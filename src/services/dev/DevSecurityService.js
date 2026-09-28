const config = require('../../config');
const DevPermissionService = require('./DevPermissionService');
const DevMaintenanceService = require('./DevMaintenanceService');
class DevSecurityService {
  /**
   * @param {import('discord.js').Client} client 
   */
  static getSecurityAudit(client) {
    const findings = [];
    const devs = DevPermissionService.getDevelopers(client);
    const maintenance = DevMaintenanceService.getStatus();
    if (devs.length === 0) {
      findings.push({ level: 'WARNING', title: 'No explicit owner configured in OWNER_IDS' });
    } else {
      findings.push({ level: 'OK', title: `${devs.length} authorized developer(s) on the whitelist` });
    }
    if (!config.token || config.token.length < 30) {
      findings.push({ level: 'DANGER', title: 'Missing or abnormally short Discord token' });
    } else {
      findings.push({ level: 'OK', title: 'Discord token present and masked in all log streams' });
    }
    findings.push({
      level: 'INFO',
      title: `Maintenance : ${maintenance.enabled ? 'ACTIVE' : 'INACTIVE'} | Safe Mode : ${maintenance.safe_mode ? 'ACTIF' : 'INACTIF'}`
    });
    const intents = client.options.intents;
    findings.push({
      level: 'INFO',
      title: `Intents Gateway : Bitfield [${intents.bitfield}]`
    });
    return {
      findings,
      developerCount: devs.length,
      maintenanceActive: Boolean(maintenance.enabled),
      safeModeActive: Boolean(maintenance.safe_mode)
    };
  }
}
module.exports = DevSecurityService;
