const dbManager = require('../../utils/database');
const { sanitizeSecrets } = require('../../utils/dev/formatters');
class DevAuditService {
  /**
   * @param {object} params
   * @param {string} params.userId 
   * @param {string} params.command 
   * @param {string} params.action 
   * @param {any} [params.details] 
   * @param {string} [params.guildId] 
   * @param {string} [params.channelId] 
   * @param {number} [params.durationMs] 
   * @param {'OK'|'ERROR'|'CANCELLED'} [params.status] 
   * @param {string} [params.errorMessage] 
   */
  static log({ userId, command, action, details, guildId, channelId, durationMs = 0, status = 'OK', errorMessage }) {
    try {
      let serializedDetails = '';
      if (details) {
        serializedDetails = typeof details === 'string' ? details : JSON.stringify(details);
        serializedDetails = sanitizeSecrets(serializedDetails);
      }
      dbManager.logDevAudit({
        userId,
        command,
        action,
        details: serializedDetails,
        guildId,
        channelId,
        durationMs: Number(durationMs.toFixed ? durationMs.toFixed(2) : durationMs),
        status,
        errorMessage: errorMessage ? sanitizeSecrets(String(errorMessage)) : null,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('❌ [DevAuditService] Error while writing to the audit log :', err);
    }
  }
  static logAction({ userId, action, details = '', guildId = null }) {
    return this.log({
      userId,
      command: 'dev',
      action,
      details,
      guildId,
      status: 'OK'
    });
  }
  static getRecentLogs(limit = 25) {
    return this.getRecent(limit);
  }
  static getLogsByUser(userId, limit = 25) {
    const all = this.getRecent(100);
    return all.filter(l => l.user_id === userId || l.userId === userId).slice(0, limit);
  }
  /**
   * @param {number} limit 
   */
  static getRecent(limit = 25) {
    return dbManager.getDevAuditLogs(limit);
  }
  static clear() {
    dbManager.clearDevAuditLogs();
  }
  static getStatistics() {
    const totalCount = dbManager.getDevAuditCount();
    const recent = dbManager.getDevAuditLogs(100);
    const errorCount = recent.filter(r => r.status === 'ERROR').length;
    const actionsByType = {};
    for (const r of recent) {
      actionsByType[r.command] = (actionsByType[r.command] || 0) + 1;
    }
    return {
      totalCount,
      recentSampleSize: recent.length,
      errorCount,
      actionsByType
    };
  }
}
module.exports = DevAuditService;
