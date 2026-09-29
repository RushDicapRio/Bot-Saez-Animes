const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('../config');
/**
 * @param {import('discord.js').Client} client 
 */
function loadSlashCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands', 'slash');
  if (!fs.existsSync(commandsPath)) return;
  const categories = fs.readdirSync(commandsPath);
  client.slashCommandsData = [];
  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const stat = fs.statSync(categoryPath);
    const files = stat.isDirectory()
      ? fs.readdirSync(categoryPath).filter(file => file.endsWith('.js')).map(f => path.join(categoryPath, f))
      : (category.endsWith('.js') ? [categoryPath] : []);
    for (const filePath of files) {
      const command = require(filePath);
      if (!command.data || !command.execute) {
        continue;
      }
      command.category = stat.isDirectory() ? category : 'Général';
      client.slashCommands.set(command.data.name, command);
      client.slashCommandsData.push(command.data.toJSON());
    }
  }
  console.log(`✅ [Slash Commands] ${client.slashCommands.size} Slash command(s) loaded.`);
}
/**
 * @param {import('discord.js').Client} client 
 */
async function registerSlashCommands(client) {
  if (!client.slashCommandsData.length) return;
  const rest = new REST({ version: '10' }).setToken(config.token);
  const clientId = config.clientId || client.user.id;
  try {
    console.log('🔄 Registering slash commands on Discord...');
    for (const guild of client.guilds.cache.values()) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(clientId, guild.id),
          { body: client.slashCommandsData }
        );
        console.log(`⚡ Slash commands deployed instantly on "${guild.name}" (${guild.id}) !`);
      } catch (gErr) {
        console.warn(`⚠️ Unable to save to the server ${guild.name} : ${gErr.message}`);
      }
    }
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: client.slashCommandsData }
    );
    console.log('✅ Globally registered slash commands !');
  } catch (error) {
    console.error('❌ Error saving slash commands :', error);
  }
}
module.exports = { loadSlashCommands, registerSlashCommands };
