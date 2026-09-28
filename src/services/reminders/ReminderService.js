const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
db.exec(`
  CREATE TABLE IF NOT EXISTS reminder_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    default_delivery TEXT NOT NULL DEFAULT 'dm', -- 'dm', 'channel'
    default_channel_id TEXT DEFAULT NULL,
    max_reminders_per_user INTEGER NOT NULL DEFAULT 25,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    note TEXT DEFAULT NULL,
    due_timestamp INTEGER NOT NULL,
    repeat_interval TEXT DEFAULT NULL, -- 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'weekdays', 'weekends'
    repeat_count INTEGER NOT NULL DEFAULT 0,
    repeat_until INTEGER DEFAULT NULL,
    delivery_type TEXT NOT NULL DEFAULT 'dm', -- 'dm', 'channel', 'thread'
    delivery_channel_id TEXT DEFAULT NULL,
    mention_user INTEGER NOT NULL DEFAULT 1,
    mention_role_id TEXT DEFAULT NULL,
    priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    category TEXT NOT NULL DEFAULT 'General',
    tag TEXT DEFAULT NULL,
    color TEXT NOT NULL DEFAULT '#5865F2',
    emoji TEXT NOT NULL DEFAULT '⏰',
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled', 'snoozed'
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reminder_history (
    id TEXT PRIMARY KEY,
    reminder_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'delivered', 'failed', 'snoozed', 'skipped'
    executed_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reminder_templates (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    delay_sec INTEGER NOT NULL DEFAULT 3600,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reminder_chains (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    steps_data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
let schedulerInterval = null;
class ReminderService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM reminder_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO reminder_settings (guild_id, updated_at)
        VALUES (?, ?)
      `).run(guildId, now);
      return db.prepare('SELECT * FROM reminder_settings WHERE guild_id = ?').get(guildId);
    }
    return row;
  }
  static updateSettings(guildId, updates) {
    this.getSettings(guildId);
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), guildId);
    db.prepare(`
      UPDATE reminder_settings 
      SET ${setClauses}, updated_at = ?
      WHERE guild_id = ?
    `).run(...values);
    return this.getSettings(guildId);
  }
  static createReminder(guildId, userId, {
    title,
    message = '',
    dueTimestamp,
    repeatInterval = null,
    deliveryType = 'dm',
    deliveryChannelId = null,
    priority = 'normal',
    category = 'Général',
    tag = null,
    color = '#5865F2',
    emoji = '⏰'
  }) {
    const id = crypto.randomUUID().slice(0, 8);
    const now = Date.now();
    db.prepare(`
      INSERT INTO reminders (
        id, guild_id, user_id, title, message, due_timestamp,
        repeat_interval, delivery_type, delivery_channel_id,
        priority, category, tag, color, emoji, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      id, guildId, userId, title, message, dueTimestamp,
      repeatInterval, deliveryType, deliveryChannelId,
      priority, category, tag, color, emoji, now, now
    );
    return this.getReminder(guildId, id);
  }
  static getReminder(guildId, idOrTitle) {
    if (!idOrTitle) return null;
    const clean = idOrTitle.trim();
    return db.prepare('SELECT * FROM reminders WHERE guild_id = ? AND (id = ? OR LOWER(title) = ?)').get(guildId, clean, clean.toLowerCase());
  }
  static getUserReminders(guildId, userId, status = null) {
    if (status) {
      return db.prepare('SELECT * FROM reminders WHERE guild_id = ? AND user_id = ? AND status = ? ORDER BY due_timestamp ASC').all(guildId, userId, status);
    }
    return db.prepare('SELECT * FROM reminders WHERE guild_id = ? AND user_id = ? ORDER BY due_timestamp ASC').all(guildId, userId);
  }
  static getAllGuildReminders(guildId, status = 'active') {
    if (status === 'all') {
      return db.prepare('SELECT * FROM reminders WHERE guild_id = ? ORDER BY due_timestamp ASC').all(guildId);
    }
    return db.prepare('SELECT * FROM reminders WHERE guild_id = ? AND status = ? ORDER BY due_timestamp ASC').all(guildId, status);
  }
  static updateReminder(guildId, id, updates) {
    const rem = this.getReminder(guildId, id);
    if (!rem) return null;
    const keys = Object.keys(updates);
    if (keys.length === 0) return rem;
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), rem.id);
    db.prepare(`
      UPDATE reminders
      SET ${setClauses}, updated_at = ?
      WHERE id = ?
    `).run(...values);
    return this.getReminder(guildId, rem.id);
  }
  static deleteReminder(guildId, id) {
    const rem = this.getReminder(guildId, id);
    if (!rem) return false;
    db.prepare('DELETE FROM reminder_history WHERE reminder_id = ?').run(rem.id);
    return db.prepare('DELETE FROM reminders WHERE id = ?').run(rem.id).changes > 0;
  }
  static setStatus(guildId, id, status) {
    const rem = this.getReminder(guildId, id);
    if (!rem) return false;
    return db.prepare('UPDATE reminders SET status = ?, updated_at = ? WHERE id = ?').run(status, Date.now(), rem.id).changes > 0;
  }
  static snooze(guildId, id, delayMinutes = 15) {
    const rem = this.getReminder(guildId, id);
    if (!rem) return false;
    const nextDue = Date.now() + (delayMinutes * 60 * 1000);
    return db.prepare('UPDATE reminders SET due_timestamp = ?, status = \'active\', updated_at = ? WHERE id = ?').run(nextDue, Date.now(), rem.id).changes > 0;
  }
  static getTemplates(guildId) {
    return db.prepare('SELECT * FROM reminder_templates WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static createTemplate(guildId, name, title, message, delaySec = 3600) {
    const id = crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO reminder_templates (id, guild_id, name, title, message, delay_sec, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, name.toLowerCase().trim(), title, message, delaySec, Date.now());
    return id;
  }
  static deleteTemplate(guildId, nameOrId) {
    return db.prepare('DELETE FROM reminder_templates WHERE guild_id = ? AND (name = ? OR id = ?)').run(guildId, nameOrId, nameOrId).changes > 0;
  }
  static initScheduler(client) {
    if (schedulerInterval) clearInterval(schedulerInterval);
    console.log('⏰ [ReminderService] Reminder scheduler initialized.');
    schedulerInterval = setInterval(() => {
      this.checkDueReminders(client).catch(err => {
        console.error('[ReminderService] Error while checking reminders :', err);
      });
    }, 15000); 
  }
  static async checkDueReminders(client) {
    const now = Date.now();
    const dueList = db.prepare('SELECT * FROM reminders WHERE status = \'active\' AND due_timestamp <= ?').all(now);
    for (const rem of dueList) {
      try {
        const guild = client.guilds.cache.get(rem.guild_id);
        const user = await client.users.fetch(rem.user_id).catch(() => null);
        if (!user) {
          db.prepare('UPDATE reminders SET status = \'completed\' WHERE id = ?').run(rem.id);
          continue;
        }
        const embed = new EmbedBuilder()
          .setColor(rem.color || '#5865F2')
          .setTitle(`${rem.emoji || '⏰'} Reminder : ${rem.title}`)
          .setDescription(rem.message || 'It\'s time for your reminder !')
          .addFields(
            { name: 'Priority', value: `\`${rem.priority.toUpperCase()}\``, inline: true },
            { name: 'Category', value: `\`${rem.category}\``, inline: true },
            { name: 'Scheduled date', value: `<t:${Math.floor(rem.due_timestamp / 1000)}:F>`, inline: false }
          )
          .setTimestamp();
        let delivered = false;
        if (rem.delivery_type === 'dm') {
          const sent = await user.send({ embeds: [embed] }).catch(() => null);
          if (sent) delivered = true;
        }
        if (!delivered && rem.delivery_channel_id && guild) {
          const channel = guild.channels.cache.get(rem.delivery_channel_id);
          if (channel && channel.isTextBased()) {
            const mention = rem.mention_user ? `${user}` : '';
            await channel.send({ content: mention, embeds: [embed] }).catch(() => {});
            delivered = true;
          }
        }
        if (!delivered && guild) {
          const fallbackChannel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));
          if (fallbackChannel) {
            await fallbackChannel.send({ content: `${user}`, embeds: [embed] }).catch(() => {});
            delivered = true;
          }
        }
        const histId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO reminder_history (id, reminder_id, user_id, guild_id, status, executed_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(histId, rem.id, rem.user_id, rem.guild_id, delivered ? 'delivered' : 'failed', now);
        if (rem.repeat_interval) {
          let nextTimestamp = rem.due_timestamp;
          const oneHour = 60 * 60 * 1000;
          const oneDay = 24 * oneHour;
          switch (rem.repeat_interval) {
            case 'hourly': nextTimestamp += oneHour; break;
            case 'daily': nextTimestamp += oneDay; break;
            case 'weekly': nextTimestamp += 7 * oneDay; break;
            case 'monthly': nextTimestamp += 30 * oneDay; break;
            case 'yearly': nextTimestamp += 365 * oneDay; break;
            default: nextTimestamp += oneDay; break;
          }
          if (rem.repeat_until && nextTimestamp > rem.repeat_until) {
            db.prepare('UPDATE reminders SET status = \'completed\', repeat_count = repeat_count + 1 WHERE id = ?').run(rem.id);
          } else {
            db.prepare('UPDATE reminders SET due_timestamp = ?, repeat_count = repeat_count + 1, updated_at = ? WHERE id = ?').run(nextTimestamp, now, rem.id);
          }
        } else {
          db.prepare('UPDATE reminders SET status = \'completed\', updated_at = ? WHERE id = ?').run(now, rem.id);
        }
      } catch (err) {
        console.error(`[ReminderService] Erreur lors de l'exécution du rappel ${rem.id}:`, err);
      }
    }
  }
  static parseDuration(input) {
    if (!input) return null;
    const clean = input.trim().toLowerCase();
    const match = clean.match(/^(\d+)\s*(s|sec|m|min|h|heure|heures|d|j|jour|jours|w|semaine)$/i);
    if (!match) {
      const val = parseInt(clean, 10);
      return isNaN(val) ? null : val * 60 * 1000; 
    }
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit.startsWith('s')) return num * 1000;
    if (unit.startsWith('m')) return num * 60 * 1000;
    if (unit.startsWith('h')) return num * 3600 * 1000;
    if (unit.startsWith('d') || unit.startsWith('j')) return num * 86400 * 1000;
    if (unit.startsWith('w')) return num * 7 * 86400 * 1000;
    return num * 60 * 1000;
  }
}
module.exports = ReminderService;
