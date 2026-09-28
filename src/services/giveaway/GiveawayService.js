const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const dbManager = require('../../utils/database');
const config = require('../../config');
class GiveawayService {
  constructor() {
    this.schedulerInterval = null;
    this.db = dbManager.db;
  }
  initScheduler(client) {
    if (this.schedulerInterval) return;
    this.schedulerInterval = setInterval(async () => {
      try {
        const now = Date.now();
        const stmt = this.db.prepare("SELECT * FROM giveaways WHERE status = 'active' AND end_time <= ?");
        const dueGiveaways = stmt.all(now);
        for (const g of dueGiveaways) {
          await this.endGiveaway(g.id, client).catch(err => {
            console.error(`[GiveawayScheduler] Giveaway end error ${g.id}:`, err);
          });
        }
      } catch (err) {
        console.error('[GiveawayScheduler] Loop error :', err);
      }
    }, 10000); 
    console.log('⏰ [Giveaway] Automatic scheduler started.');
  }
  async createGiveaway({ guildId, channelId, hostId, prize, durationMs, winnerCount = 1, requirements = {}, theme = {}, extra = {} }) {
    const id = 'gw_' + Math.random().toString(36).substring(2, 9);
    const startTime = Date.now();
    const endTime = startTime + (durationMs || 3600000);
    const stmt = this.db.prepare(`
      INSERT INTO giveaways (id, guild_id, channel_id, host_id, prize, winner_count, start_time, end_time, status, requirements, bonus_entries, theme, extra_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      guildId,
      channelId,
      hostId,
      prize,
      winnerCount,
      startTime,
      endTime,
      JSON.stringify(requirements),
      JSON.stringify(extra.bonus || {}),
      JSON.stringify(theme),
      JSON.stringify(extra)
    );
    return this.getGiveaway(id);
  }
  getGiveaway(id) {
    const stmt = this.db.prepare('SELECT * FROM giveaways WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    return {
      ...row,
      requirements: JSON.parse(row.requirements || '{}'),
      bonus_entries: JSON.parse(row.bonus_entries || '{}'),
      theme: JSON.parse(row.theme || '{}'),
      extra_data: JSON.parse(row.extra_data || '{}')
    };
  }
  getGiveaways(guildId, status = null) {
    let query = 'SELECT * FROM giveaways WHERE guild_id = ?';
    const params = [guildId];
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY start_time DESC';
    const rows = this.db.prepare(query).all(...params);
    return rows.map(r => ({
      ...r,
      requirements: JSON.parse(r.requirements || '{}'),
      bonus_entries: JSON.parse(r.bonus_entries || '{}'),
      theme: JSON.parse(r.theme || '{}'),
      extra_data: JSON.parse(r.extra_data || '{}')
    }));
  }
  async publishGiveaway(giveaway, client) {
    const guild = client.guilds.cache.get(giveaway.guild_id);
    if (!guild) throw new Error('Server not found.');
    const channel = guild.channels.cache.get(giveaway.channel_id) || await guild.channels.fetch(giveaway.channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) throw new Error('Text-based room not found.');
    const endUnix = Math.floor(giveaway.end_time / 1000);
    const embed = new EmbedBuilder()
      .setColor(giveaway.theme?.color || config.colors?.primary || 0x5865F2)
      .setTitle(`🎉 **GIVEAWAY : ${giveaway.prize}** 🎉`)
      .setDescription(
        `Click the button below to participate. !\n\n` +
        `• **End :** <t:${endUnix}:R> (<t:${endUnix}:F>)\n` +
        `• **Winner(s) :** **${giveaway.winner_count}**\n` +
        `• **Organized by :** <@${giveaway.host_id}>\n` +
        (giveaway.requirements?.role ? `• **Required role :** <@&${giveaway.requirements.role}>\n` : '') +
        (giveaway.requirements?.level ? `• **Minimum level :** Level ${giveaway.requirements.level}\n` : '')
      )
      .setFooter({ text: `developed with ❤️ by Saez | ID : ${giveaway.id} • 0 participant(s)` })
      .setTimestamp(new Date(giveaway.end_time));
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${giveaway.id}`)
        .setLabel('Participate (0)')
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Primary)
    );
    const message = await channel.send({ embeds: [embed], components: [row] });
    this.db.prepare('UPDATE giveaways SET message_id = ? WHERE id = ?').run(message.id, giveaway.id);
    giveaway.message_id = message.id;
    return message;
  }
  async handleButton(interaction, client) {
    const customId = interaction.customId;
    if (!customId.startsWith('giveaway_enter_')) return;
    const giveawayId = customId.replace('giveaway_enter_', '');
    const giveaway = this.getGiveaway(giveawayId);
    if (!giveaway) {
      return interaction.reply({ content: '❌ This giveaway no longer exists.', flags: 64 });
    }
    if (giveaway.status !== 'active') {
      return interaction.reply({ content: '⚠️ This giveaway is no longer active.', flags: 64 });
    }
    if (Date.now() >= giveaway.end_time) {
      return interaction.reply({ content: '⏳ This giveaway has ended! The draw is imminent.', flags: 64 });
    }
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    if (giveaway.requirements?.role) {
      const hasRole = interaction.member.roles.cache.has(giveaway.requirements.role);
      if (!hasRole) {
        return interaction.reply({
          content: `❌ You do not have the required role (<@&${giveaway.requirements.role}>) to participate.`,
          flags: 64
        });
      }
    }
    const existingStmt = this.db.prepare('SELECT * FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?');
    const existing = existingStmt.get(giveawayId, userId);
    if (existing) {
      this.db.prepare('DELETE FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?').run(giveawayId, userId);
      await this.updateGiveawayMessage(giveaway, client).catch(() => {});
      return interaction.reply({
        content: '👋 You have successfully withdrawn your participation.',
        flags: 64
      });
    }
    let entries = 1;
    if (giveaway.bonus_entries) {
      for (const [roleId, bonus] of Object.entries(giveaway.bonus_entries)) {
        if (interaction.member.roles.cache.has(roleId)) {
          entries += Number(bonus) || 0;
        }
      }
    }
    this.db.prepare(`
      INSERT INTO giveaway_entries (giveaway_id, guild_id, user_id, entries_count, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(giveawayId, guildId, userId, entries, Date.now());
    await this.updateGiveawayMessage(giveaway, client).catch(() => {});
    return interaction.reply({
      content: `🎉 **Entry confirmed !** You have **${entries} entry/entries** to win **${giveaway.prize}** ! Good luck ! 🍀`,
      flags: 64
    });
  }
  async updateGiveawayMessage(giveaway, client) {
    if (!giveaway.message_id) return;
    const guild = client.guilds.cache.get(giveaway.guild_id);
    if (!guild) return;
    const channel = guild.channels.cache.get(giveaway.channel_id);
    if (!channel) return;
    const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
    if (!message) return;
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM giveaway_entries WHERE giveaway_id = ?');
    const count = countStmt.get(giveaway.id)?.count || 0;
    const endUnix = Math.floor(giveaway.end_time / 1000);
    const embed = EmbedBuilder.from(message.embeds[0])
      .setFooter({ text: `developed with ❤️ by Saez | ID : ${giveaway.id} • ${count} participant(s)` });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${giveaway.id}`)
        .setLabel(`Participate (${count})`)
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(giveaway.status !== 'active')
    );
    await message.edit({ embeds: [embed], components: [row] });
  }s
  async endGiveaway(id, client) {
    const giveaway = this.getGiveaway(id);
    if (!giveaway || giveaway.status === 'ended') return null;
    this.db.prepare("UPDATE giveaways SET status = 'ended' WHERE id = ?").run(id);
    const entries = this.db.prepare('SELECT * FROM giveaway_entries WHERE giveaway_id = ?').all(id);
    const winners = [];
    if (entries.length > 0) {
      const pool = [];
      for (const entry of entries) {
        for (let i = 0; i < entry.entries_count; i++) {
          pool.push(entry.user_id);
        }
      }
      const countToPick = Math.min(giveaway.winner_count, entries.length);
      const pickedSet = new Set();
      while (pickedSet.size < countToPick && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        const pick = pool[idx];
        if (!pickedSet.has(pick)) {
          pickedSet.add(pick);
          winners.push(pick);
        }
        pool.splice(idx, 1);
      }
    }
    for (const w of winners) {
      this.db.prepare('INSERT INTO giveaway_winners (giveaway_id, user_id, won_at, confirmed) VALUES (?, ?, ?, 1)').run(id, w, Date.now());
    }
    const guild = client.guilds.cache.get(giveaway.guild_id);
    if (guild) {
      const channel = guild.channels.cache.get(giveaway.channel_id);
      if (channel) {
        const message = giveaway.message_id ? await channel.messages.fetch(giveaway.message_id).catch(() => null) : null;
        const winnersText = winners.length > 0
          ? winners.map(w => `<@${w}>`).join(', ')
          : 'No eligible participants 😢';
        if (message) {
          const finishedEmbed = new EmbedBuilder()
            .setColor(winners.length > 0 ? 0x2ecc71 : 0x95a5a6)
            .setTitle(`🎊 **GIVEAWAY OVER : ${giveaway.prize}** 🎊`)
            .setDescription(
              `• **Batch :** **${giveaway.prize}**\n` +
              `• **Winner(s) :** ${winnersText}\n` +
              `• **Organized by :** <@${giveaway.host_id}>\n` +
              `• **Total Participants :** ${entries.length}`
            )
            .setFooter({ text: `developed with ❤️ by Saez | ID : ${giveaway.id} • Finished` })
            .setTimestamp();
          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`giveaway_ended_${giveaway.id}`)
              .setLabel(`Finished (${entries.length})`)
              .setEmoji('🏁')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
          await message.edit({ embeds: [finishedEmbed], components: [disabledRow] }).catch(() => {});
        }
        if (winners.length > 0) {
          await channel.send({
            content: `🎉 Congratulations to ${winnersText} for winning **${giveaway.prize}** ! (ID : \`${giveaway.id}\`)`
          }).catch(() => {});
        }
      }
    }
    return { giveaway, winners };
  }
  async rerollGiveaway(id, client, count = 1) {
    const giveaway = this.getGiveaway(id);
    if (!giveaway) throw new Error('Giveaway not found.');
    const entries = this.db.prepare('SELECT * FROM giveaway_entries WHERE giveaway_id = ?').all(id);
    if (entries.length === 0) throw new Error('No participants for this giveaway.');
    const previousWinners = this.db.prepare('SELECT user_id FROM giveaway_winners WHERE giveaway_id = ?').all(id).map(w => w.user_id);
    const eligibleEntries = entries.filter(e => !previousWinners.includes(e.user_id));
    if (eligibleEntries.length === 0) {
      throw new Error('All the participants have already won.');
    }
    const pool = [];
    for (const entry of eligibleEntries) {
      for (let i = 0; i < entry.entries_count; i++) pool.push(entry.user_id);
    }
    const countToPick = Math.min(count, eligibleEntries.length);
    const newWinners = [];
    const pickedSet = new Set();
    while (pickedSet.size < countToPick && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const pick = pool[idx];
      if (!pickedSet.has(pick)) {
        pickedSet.add(pick);
        newWinners.push(pick);
        this.db.prepare('INSERT INTO giveaway_winners (giveaway_id, user_id, won_at, confirmed) VALUES (?, ?, ?, 1)').run(id, pick, Date.now());
      }
      pool.splice(idx, 1);
    }
    const guild = client.guilds.cache.get(giveaway.guild_id);
    if (guild) {
      const channel = guild.channels.cache.get(giveaway.channel_id);
      if (channel) {
        await channel.send({
          content: `🎲 **New Printing (Reroll) :** Congratulations to ${newWinners.map(w => `<@${w}>`).join(', ')} who win(s) **${giveaway.prize}** ! 🍀`
        }).catch(() => {});
      }
    }
    return newWinners;
  }
}
module.exports = new GiveawayService();
