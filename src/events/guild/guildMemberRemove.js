const { EmbedBuilder } = require('discord.js');
const WelcomeService = require('../../services/welcome/WelcomeService');
module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member, client) {
    if (!member.guild) return;
    const guild = member.guild;
    const settings = WelcomeService.getSettings(guild.id);
    if (!settings.enabled) return;
    try {
      WelcomeService.logMemberEvent(guild.id, member.id, 'leave');
      if (settings.goodbye_enabled) {
        const targetChannelId = settings.goodbye_channel_id || settings.channel_id;
        if (targetChannelId) {
          const goodbyeChannel = guild.channels.cache.get(targetChannelId);
          if (goodbyeChannel) {
            const textMsg = WelcomeService.formatMessage(settings.goodbye_message, member, guild);
            const embed = new EmbedBuilder()
              .setColor('#ED4245')
              .setTitle('👋 A member has passed away.')
              .setDescription(textMsg)
              .setThumbnail(member.user?.displayAvatarURL())
              .setTimestamp()
              .setFooter({ text: `developed with ❤️ by Saez |${guild.name} • ${guild.memberCount} remaining members` });
            await goodbyeChannel.send({ embeds: [embed] }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('[GuildMemberRemove Welcome Error] :', error);
    }
  }
};
