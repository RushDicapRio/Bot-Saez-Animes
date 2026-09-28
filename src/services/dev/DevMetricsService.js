const dbManager = require('../../utils/database');
class DevMetricsService {
  static startTime = Date.now();
  static memoryMetrics = {
    commandsExecuted: 0,
    messagesProcessed: 0,
    errorsCaught: 0,
    interactionsHandled: 0,
    xpGranted: 0
  };
  /**
   * @param {keyof typeof DevMetricsService.memoryMetrics} key 
   * @param {number} [amount=1] 
   */
  static increment(key, amount = 1) {
    if (this.memoryMetrics[key] !== undefined) {
      this.memoryMetrics[key] += amount;
    }
    try {
      dbManager.incrementMetric(key, amount);
    } catch {}
  }
  static getOverview() {
    const persistent = dbManager.getAllMetrics();
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      session: { ...this.memoryMetrics },
      persistent,
      uptimeSeconds: uptimeSec,
      commandsPerMinute: uptimeSec > 60 ? (this.memoryMetrics.commandsExecuted / (uptimeSec / 60)).toFixed(2) : this.memoryMetrics.commandsExecuted
    };
  }
}
module.exports = DevMetricsService;
