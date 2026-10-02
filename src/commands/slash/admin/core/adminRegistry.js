const fs = require('fs');
const path = require('path');
const commandsPath = path.join(__dirname, '..');
const commandsMap = new Map();
const allCommandsList = [];
if (fs.existsSync(commandsPath)) {
  const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && file !== 'admin.js');
  for (const file of files) {
    try {
      const cmdDef = require(path.join(commandsPath, file));
      if (!cmdDef || typeof cmdDef !== 'object' || typeof cmdDef.execute !== 'function') continue;
      const cmdName = (cmdDef.name || path.basename(file, '.js')).toLowerCase();
      const fullDef = {
        name: cmdName,
        ...cmdDef,
        registryName: cmdDef.category || 'Administration'
      };
      commandsMap.set(cmdName, fullDef);
      allCommandsList.push(fullDef);
      if (Array.isArray(cmdDef.aliases)) {
        for (const alias of cmdDef.aliases) {
          commandsMap.set(alias.toLowerCase(), fullDef);
        }
      }
    } catch (err) {
      console.error(`[AdminRegistry] Error loading ${file} :`, err);
    }
  }
}
const helpDef = {
  name: 'help',
  description: 'Displays all available administration commands.',
  category: 'Aide & Menu',
  registryName: 'Aide & Menu',
  aliases: ['aide', 'menu'],
  async execute(ctx) {
    return adminRegistry.showHelp(ctx, ctx.getString('parametre'));
  }
};
commandsMap.set('help', helpDef);
commandsMap.set('aide', helpDef);
commandsMap.set('menu', helpDef);
allCommandsList.unshift(helpDef);
const adminRegistry = {
  commandsMap,
  allCommandsList,
  getCommand(name) {
    if (!name) return null;
    return commandsMap.get(name.toLowerCase()) || null;
  },
  searchCommands(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      return allCommandsList.slice(0, 25).map(c => ({
        name: `${c.name} — ${c.description}`.slice(0, 100),
        value: c.name
      }));
    }
    const matches = [];
    for (const cmd of allCommandsList) {
      if (cmd.name.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q)) {
        matches.push({
          name: `${cmd.name} — ${cmd.description}`.slice(0, 100),
          value: cmd.name
        });
        if (matches.length >= 25) break;
      }
    }
    return matches;
  },
  async showHelp(ctx, target) {
    if (target) {
      const cmd = this.getCommand(target);
      if (cmd) {
        const aliases = cmd.aliases && cmd.aliases.length > 0 ? cmd.aliases.map(a => `\`${a}\``).join(', ') : 'None';
        const embed = ctx.buildEmbed({
          title: `📖 Administration Command : /admin ${cmd.name}`,
          description: cmd.description,
          fields: [
            { name: 'Category', value: `\`${cmd.registryName || cmd.category}\``, inline: true },
            { name: 'Alias', value: aliases, inline: true },
            { name: 'Usage', value: `\`/admin command :${cmd.name}\` or \`++admin ${cmd.name}\``, inline: false }
          ],
          color: 0xe74c3c,
          footer: "Developed with ❤️ by Saez"
        });
        return ctx.reply({ embeds: [embed] });
      }
      const categoriesMap = new Map();
      for (const c of allCommandsList) {
        if (c.name === 'help') continue;
        const cat = c.registryName || c.category || 'Administration';
        if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
        categoriesMap.get(cat).push(c);
      }
      for (const [catName, catCmds] of categoriesMap.entries()) {
        if (catName.toLowerCase().includes(target.toLowerCase())) {
          const list = catCmds
            .map(c => `• \`/admin ${c.name}\` : ${c.description}`)
            .join('\n');

          const embed = ctx.buildEmbed({
            title: `📁 Administration Category : ${catName}`,
            description: list.slice(0, 4000),
            color: 0xe74c3c,
            footer: "Developed with ❤️ by Saez"
          });
          return ctx.reply({ embeds: [embed] });
        }
      }
    }
    const categoriesMap = new Map();
    for (const cmd of allCommandsList) {
      if (cmd.name === 'help') continue;
      const cat = cmd.registryName || cmd.category || 'Administration';
      if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
      categoriesMap.get(cat).push(cmd.name);
    }
    const fields = [];
    for (const [cat, cmds] of categoriesMap.entries()) {
      const sample = cmds.slice(0, 5).map(k => `\`${k}\``).join(', ');
      fields.push({
        name: `${cat} (${cmds.length} commands)`,
        value: `**Examples :** ${sample}...`,
        inline: false
      });
    }
    const embed = ctx.buildEmbed({
      title: '🛡️ Complete Administration Dashboard',
      description: `Discover more than **${allCommandsList.length} server administration commands**, permissions, staff, roles, channels, security, backups and logs** !\n\nUse \`/admin <command>\` or \`++admin <command>\`.\nTo detail a command : \`++admin help <name>\`.\nInteractive autocomplete available on \`/admin\`.`,
      fields: fields,
      color: 0xe74c3c,
      footer: `Developed with ❤️ by Saez | Total : ${allCommandsList.length} commands ready for use`
    });
    return ctx.reply({ embeds: [embed] });
  },
  async execute(ctx) {
    const rawCmd = ctx.getString('commande') || 'settings';
    const cmdName = rawCmd.trim().toLowerCase();
    if (cmdName === 'help' || cmdName === 'aide') {
      const target = ctx.getString('parametre');
      return this.showHelp(ctx, target);
    }
    const command = this.getCommand(cmdName);
    if (!command) {
      const embed = ctx.buildEmbed({
        title: '❌ Unknown Admin Command',
        description: `The command \`${cmdName}\` does not exist.\nUse \`/admin help\` or \`++admin help\` to view the list.`,
        color: 0xe74c3c,
        footer: "Developed with ❤️ by Saez"
      });
      return ctx.reply({ embeds: [embed] });
    }
    try {
      await command.execute(ctx);
    } catch (err) {
      console.error(`[AdminRegistry] Error during execution of ${cmdName} :`, err);
      const errEmbed = ctx.buildEmbed({
        title: `⚠️ Error during execution of /admin ${cmdName}`,
        description: `An error occurred : \`${err.message}\``,
        color: 0xe74c3c,
        footer: "Developed with ❤️ by Saez"
      });
      await ctx.reply({ embeds: [errEmbed] });
    }
  }
};
module.exports = adminRegistry;
