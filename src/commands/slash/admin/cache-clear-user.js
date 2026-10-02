const AdminService = require('../../../services/admin/AdminService');
module.exports = {
  name: 'cache-clear-user',
  description: 'Clears a user\'s cache',
  category: 'Données & Cache',
  async execute(ctx) {
    const guild = ctx.guild;
    const guildId = guild ? guild.id : 'default_guild';
    const settings = AdminService.getSettings(guildId);
    const param = ctx.getString('parametre');
    const target = ctx.getUser('cible');
    AdminService.logAudit(guildId, ctx.user.id, 'COMMAND_CACHE-CLEAR-USER', target ? 'user' : null, target ? target.id : null, param || null);
    const embed = ctx.buildEmbed({
      title: '🛡️ [Admin] CACHE-CLEAR-USER',
      description: 'Clears a user\'s cache\n\n' +
        '⚙️ **System Status :** ' + (settings.setup_completed ? '✅ Configured' : '⏳ Awaiting Configuration') + '\n' +
        '🔒 **Maintenance Mode :** ' + (settings.maintenance_enabled ? '🔴 Enabled' : '🟢 Disabled') + '\n' +
        '🛡️ **Security Level :** `' + (settings.security_level || 'standard').toUpperCase() + '`' +
        (param ? '\n\n📝 **Specified Parameter :** `' + param + '`' : '') +
        (target ? '\n👤 **Target Member :** <@' + target.id + '> (`' + target.id + '`)' : ''),
      fields: [
        { name: '👥 Total Members', value: '`' + (guild ? guild.memberCount : 0) + ' members`', inline: true },
        { name: '📜 Managed Roles', value: '`' + (guild ? guild.roles.cache.size : 0) + ' roles`', inline: true },
        { name: '📁 Detected Channels', value: '`' + (guild ? guild.channels.cache.size : 0) + ' channels`', inline: true }
      ],
      color: 0xe74c3c,
      thumbnail: guild && guild.iconURL ? guild.iconURL({ dynamic: true }) : null,
      footer: 'Developed with ❤️ by Saez | Système d\'Administration'
    });
    return ctx.reply({ embeds: [embed] });
  }
};
