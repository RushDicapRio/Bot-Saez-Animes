const { SlashCommandBuilder } = require('discord.js');
const welcomeRegistry = require('./core/welcomeRegistry');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Complete system for member greetings, welcomes, auto-roles, and departures.')
    .addStringOption(option =>
      option
        .setName('commande')
        .setDescription('The welcome command or action to execute')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option
        .setName('parametre')
        .setDescription('Text, channel, role, or option')
        .setRequired(false)
    )
    .addUserOption(option =>
      option
        .setName('cible')
        .setDescription('Target user (if applicable)')
        .setRequired(false)
    ),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = welcomeRegistry.searchCommands(focusedValue);
    await interaction.respond(choices).catch(() => {});
  },
  async execute(interaction, client) {
    const subCmdName = interaction.options.getString('commande')?.toLowerCase();
    const param = interaction.options.getString('parametre');
    const targetUser = interaction.options.getUser('cible');
    const ctx = new WelcomeContext(interaction, client, {
      commandName: subCmdName,
      param,
      targetUser
    });
    const command = welcomeRegistry.getCommand(subCmdName);
    if (!command) {
      return welcomeRegistry.showHelp(ctx);
    }
    try {
      await command.execute(ctx, client);
    } catch (error) {
      console.error(`[Welcome] Error during execution of ${subCmdName} :`, error);
      const embed = ctx.createEmbed('#ED4245')
        .setTitle('❌ Runtime Error')
        .setDescription('An unexpected error occurred while executing this welcome command.')
        .setFooter({ text: "developed with ❤️ by Saez" });
      await ctx.reply({ embeds: [embed] }).catch(() => {});
    }
  }
};
