const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const adminRegistry = require('./core/adminRegistry');
const AdminContext = require('./core/adminContext');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Complete control and administration center for the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('commande')
        .setDescription('Name of the administrative command (e.g., setup, settings, staff, roles, security...)')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option
        .setName('parametre')
        .setDescription('Parameter or configuration value')
        .setRequired(false)
    )
    .addUserOption(option =>
      option
        .setName('cible')
        .setDescription('Target member')
        .setRequired(false)
    ),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused() || '';
    const matches = adminRegistry.searchCommands(focusedValue);
    await interaction.respond(
      matches.map(cmd => ({
        name: cmd.name.length > 100 ? `${cmd.name.slice(0, 97)}...` : cmd.name,
        value: cmd.value
      }))
    ).catch(() => {});
  },
  async execute(interaction, client) {
    const ctx = new AdminContext(interaction, client);
    await adminRegistry.execute(ctx);
  }
};
