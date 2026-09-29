const { Events, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../../config');
const DevMaintenanceService = require('../../services/dev/DevMaintenanceService');
const DevPermissionService = require('../../services/dev/DevPermissionService');
const DevMetricsService = require('../../services/dev/DevMetricsService');
module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (interaction.isAutocomplete()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      try {
        await command.autocomplete(interaction, client);
      } catch (err) {
        console.error(`[Autocomplete Error] /${interaction.commandName}:`, err);
      }
      return;
    }
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('giveaway_')) {
        const GiveawayService = require('../../services/giveaway/GiveawayService');
        return await GiveawayService.handleButton(interaction, client).catch(err => {
          console.error('[GiveawayButton] Error :', err);
        });
      }
      return;
    }
    if (!interaction.isChatInputCommand()) return;
    DevMetricsService.increment('interactionsHandled');
    if (DevMaintenanceService.isMaintenanceEnabled()) {
      const isDev = DevPermissionService.isDeveloper(interaction.user.id, client);
      if (!isDev) {
        const state = DevMaintenanceService.getStatus();
        const maintEmbed = new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle('🛠️ Technical Maintenance')
          .setDescription(state.message || 'The bot is currently undergoing maintenance. Please wait.')
          .setFooter({ text: "developed with ❤️ by Saez" })
          .setTimestamp();
        return interaction.reply({ embeds: [maintEmbed], flags: MessageFlags.Ephemeral });
      }
    }
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) {
      console.warn(`[SlashHandler] Unknown order received : ${interaction.commandName}`);
      return interaction.reply({
        content: `❌ This order no longer exists or has not yet been recorded.`,
        flags: MessageFlags.Ephemeral
      });
    }
    try {
      DevMetricsService.increment('commandsExecuted');
      await command.execute(interaction, client);
    } catch (error) {
      DevMetricsService.increment('errorsCaught');
      console.error(`❌ Error executing the slash command /${interaction.commandName} :`, error);
      const errorEmbed = new EmbedBuilder()
        .setColor(config.colors.danger)
        .setTitle('❌ An error occurred.')
        .setDescription('An unexpected error occurred while executing this command.')
        .setFooter({ text: "developed with ❤️ by Saez" });
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
  }
};
