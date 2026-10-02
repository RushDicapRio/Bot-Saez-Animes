const AdminService = require('../../../services/admin/AdminService');
module.exports = {
  name: 'announcement-preview',
  description: 'Preview an ad',
  category: 'Annonces & Accueil',
  async execute(ctx) {
    const guild = ctx.guild;
    const guildId = guild ? guild.id : 'default_guild';
    const settings = AdminService.getSettings(guildId);
    const param = ctx.getString('parametre');
    const target = ctx.getUser('cible');
    AdminService.logAudit(guildId, ctx.user.id, 'COMMAND_ANNOUNCEMENT-PREVIEW', target ? 'user' : null, target ? target.id : null, param || null);
    const embed = ctx.buildEmbed({
      title: '🛡️ [Admin] ANNOUNCEMENT-PREVIEW',
      description: 'Preview an announcement\n\n' +
        '⚙️ **System status :** ' + (settings.setup_completed ? '✅ Configured' : '⏳ Awaiting configuration') + '\n' +
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
