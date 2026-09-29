const { EmbedBuilder } = require('discord.js');
const WelcomeService = require('../../services/welcome/WelcomeService');
module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    if (!member.guild) return;
    const guild = member.guild;
    const settings = WelcomeService.getSettings(guild.id);
    if (!settings.enabled) return;
    try {
      const accountAgeDays = Math.floor((Date.now() - member.user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      WelcomeService.logMemberEvent(guild.id, member.id, 'join', null, accountAgeDays);
      if (settings.autorole_enabled) {
        const autoroles = WelcomeService.getAutoroles(guild.id);
        if (autoroles.length > 0) {
          await member.roles.add(autoroles).catch(() => {});
        }
        if (member.user.bot && settings.bot_role_id) {
          await member.roles.add(settings.bot_role_id).catch(() => {});
        } else if (!member.user.bot && settings.human_role_id) {
          await member.roles.add(settings.human_role_id).catch(() => {});
        }
      }
      if (settings.channel_id) {
        const welcomeChannel = guild.channels.cache.get(settings.channel_id);
        if (welcomeChannel) {
          const textMsg = WelcomeService.formatMessage(settings.message_template, member, guild);
          if (settings.embed_enabled) {
            const embed = new EmbedBuilder()
              .setColor(settings.embed_color || '#57F287')
              .setTitle(settings.embed_title || 'Welcome !')
              .setDescription(WelcomeService.formatMessage(settings.embed_description, member, guild))
              .setThumbnail(member.user.displayAvatarURL())
              .setTimestamp()
              .setFooter({ text: `developed with ❤️ by Saez | ${guild.name} • Member #${guild.memberCount}` });
            await welcomeChannel.send({ content: textMsg, embeds: [embed] }).catch(() => {});
          } else {
            await welcomeChannel.send({ content: textMsg }).catch(() => {});
          }
        }
      }
      if (settings.dm_enabled && !member.user.bot) {
        const dmText = WelcomeService.formatMessage(settings.dm_message, member, guild);
        await member.send({ content: dmText }).catch(() => {});
      }
    } catch (error) {
      console.error('[GuildMemberAdd Welcome Error] :', error);
    }
  }
};
