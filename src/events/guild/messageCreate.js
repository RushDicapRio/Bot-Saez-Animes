const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { handleMessageXp } = require('../../utils/leveling');
const DevMaintenanceService = require('../../services/dev/DevMaintenanceService');
const DevPermissionService = require('../../services/dev/DevPermissionService');
const DevMetricsService = require('../../services/dev/DevMetricsService');
const AutoModService = require('../../services/automod/AutoModService');
module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;
    try {
      const autoModResult = await AutoModService.processMessage(message);
      if (autoModResult && autoModResult.blocked) return;
    } catch (err) {
      console.error('[AutoMod] Error parsing the message :', err);
    }
    DevMetricsService.increment('messagesProcessed');P
    if (!message.content.startsWith(config.prefix)) {
      try {
        const CustomCommandService = require('../../services/custom-commands/CustomCommandService');
        const triggered = await CustomCommandService.handleTriggers(message, client);
        if (triggered) return;
      } catch (err) {
        console.error('[CustomCommands] Trigger error :', err);
      }
      await handleMessageXp(message);
      return;
    }
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    if (!commandName.length) return;
    const command = client.prefixCommands.get(commandName) ||
                    client.prefixCommands.get(client.aliases.get(commandName));
    if (!command) {
      try {
        const CustomCommandService = require('../../services/custom-commands/CustomCommandService');
        const handled = await CustomCommandService.handleMessagePrefix(message, commandName, args, client);
        if (handled) return;
      } catch (err) {
        console.error('[CustomCommands] Custom prefix error :', err);
      }
      await handleMessageXp(message);
      return;
    }
    if (DevMaintenanceService.isMaintenanceEnabled()) {
      const isDev = DevPermissionService.isDeveloper(message.author.id, client);
      if (!isDev) {
        const state = DevMaintenanceService.getStatus();
        const maintEmbed = new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle('🛠️ Technical Maintenance')
          .setDescription(state.message || 'The bot is currently undergoing maintenance.')
          .setFooter({ text: "developed with ❤️ by Saez" })
          .setTimestamp();
        return message.reply({ embeds: [maintEmbed] }).catch(() => {});
      }
    }
    try {
      DevMetricsService.increment('commandsExecuted');
      await command.execute(message, args, client);
    } catch (error) {
      DevMetricsService.increment('errorsCaught');
      console.error(`❌ Error while executing the prefix command ${config.prefix}${commandName} :`, error);
      const errorEmbed = new EmbedBuilder()
        .setColor(config.colors.danger)
        .setTitle('❌ Error')
        .setDescription('An error occurred while executing this command.')
        .setFooter({ text: "developed with ❤️ by Saez" });
      await message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
  }
};
