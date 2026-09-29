const fs = require('fs');
const path = require('path');
/**
 * @param {import('discord.js').Client} client 
 */
function loadPrefixCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands', 'prefix');
  if (!fs.existsSync(commandsPath)) return;
  const categories = fs.readdirSync(commandsPath);
  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const stat = fs.statSync(categoryPath);
    const files = stat.isDirectory()
      ? fs.readdirSync(categoryPath).filter(file => file.endsWith('.js')).map(f => path.join(categoryPath, f))
      : (category.endsWith('.js') ? [categoryPath] : []);
    for (const filePath of files) {
      const command = require(filePath);
      if (!command.name || !command.execute) {
        console.warn(`⚠️ [PrefixHandler] The command in "${filePath}" is missing the "name" or "execute" property.`);
        continue;
      }
      command.category = stat.isDirectory() ? category : 'Général';
      client.prefixCommands.set(command.name.toLowerCase(), command);
      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          client.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
        }
      }
    }
  }
  console.log(`✅ [Prefix Commands] ${client.prefixCommands.size} Prefixed command(s) loaded (${client.aliases.size} alias).`);
}
module.exports = { loadPrefixCommands };
