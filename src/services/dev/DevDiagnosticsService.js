const os = require('os');
const { version: djsVersion } = require('discord.js');
const dbManager = require('../../utils/database');
const config = require('../../config');
class DevDiagnosticsService {
  /**
   * @param {import('discord.js').Client} client 
   * @param {boolean} [full=true] 
   */
  static async runDiagnostics(client, full = true) {
    const checks = [];
    let hasError = false;
    let hasWarning = false;
    const wsPing = client.ws.ping;
    if (wsPing >= 0 && wsPing < 200) {
      checks.push({ name: 'Discord Gateway (WebSocket)', status: 'OK', details: `${wsPing} ms` });
    } else if (wsPing >= 200 && wsPing < 500) {
      hasWarning = true;
      checks.push({ name: 'Discord Gateway (WebSocket)', status: 'WARNING', details: `High latency (${wsPing} ms)` });
    } else {
      hasError = true;
      checks.push({ name: 'Discord Gateway (WebSocket)', status: 'ERROR', details: `Disconnected or critical latency (${wsPing} ms)` });
    }
    try {
      const dbStart = process.hrtime();
      const integrity = dbManager.db.pragma('integrity_check');
      const dbDiff = process.hrtime(dbStart);
      const dbTimeMs = (dbDiff[0] * 1000 + dbDiff[1] / 1e6).toFixed(2);
      const isIntegrityOk = integrity && integrity[0] && integrity[0].integrity_check === 'ok';
      if (isIntegrityOk) {
        checks.push({ name: 'Base de Données (SQLite WAL)', status: 'OK', details: `Integrated (Test : ${dbTimeMs} ms)` });
      } else {
        hasWarning = true;
        checks.push({ name: 'Base de Données (SQLite WAL)', status: 'WARNING', details: `Integrity issue detected` });
      }
    } catch (err) {
      hasError = true;
      checks.push({ name: 'Base de Données (SQLite WAL)', status: 'ERROR', details: err.message });
    }
    const slashCount = client.slashCommands ? client.slashCommands.size : 0;
    const prefixCount = client.prefixCommands ? client.prefixCommands.size : 0;
    if (slashCount > 0 && prefixCount > 0) {
      checks.push({ name: 'Command Loader', status: 'OK', details: `${slashCount} Slash, ${prefixCount} Préfixe` });
    } else {
      hasWarning = true;
      checks.push({ name: 'Command Loader', status: 'WARNING', details: 'No order loaded' });
    }
    const mem = process.memoryUsage();
    const heapUsedMB = mem.heapUsed / 1024 / 1024;
    const rssMB = mem.rss / 1024 / 1024;
    if (heapUsedMB < 300) {
      checks.push({ name: 'Mémoire Processus (RAM)', status: 'OK', details: `Heap : ${heapUsedMB.toFixed(1)} MB | RSS : ${rssMB.toFixed(1)} MB` });
    } else if (heapUsedMB < 600) {
      hasWarning = true;
      checks.push({ name: 'Mémoire Processus (RAM)', status: 'WARNING', details: `Moderate consumption (${heapUsedMB.toFixed(1)} MB)` });
    } else {
      hasError = true;
      checks.push({ name: 'Mémoire Processus (RAM)', status: 'ERROR', details: `Critical consumption (${heapUsedMB.toFixed(1)} MB)` });
    }
    if (config.token && config.token.length > 20) {
      checks.push({ name: 'Configuration & Token', status: 'OK', details: 'Defined and secure' });
    } else {
      hasError = true;
      checks.push({ name: 'Configuration & Token', status: 'ERROR', details: 'Missing or invalid token' });
    }
    if (full) {
      try {
        const restStart = Date.now();
        await client.rest.get('/users/@me');
        const restTime = Date.now() - restStart;
        checks.push({ name: 'Discord REST API', status: 'OK', details: `Response in ${restTime} ms` });
      } catch (err) {
        hasWarning = true;
        checks.push({ name: 'Discord REST API', status: 'WARNING', details: `Error REST : ${err.message}` });
      }
      const eventLoopLag = await new Promise(resolve => {
        const start = process.hrtime();
        setImmediate(() => {
          const diff = process.hrtime(start);
          resolve((diff[0] * 1000 + diff[1] / 1e6).toFixed(2));
        });
      });
      if (eventLoopLag < 30) {
        checks.push({ name: 'Node.js Event Loop', status: 'OK', details: `Lag : ${eventLoopLag} ms` });
      } else if (eventLoopLag < 100) {
        hasWarning = true;
        checks.push({ name: 'Node.js Event Loop', status: 'WARNING', details: `High lag : ${eventLoopLag} ms` });
      } else {
        hasError = true;
        checks.push({ name: 'Node.js Event Loop', status: 'ERROR', details: `Critical lag : ${eventLoopLag} ms` });
      }
      const guildCount = client.guilds.cache.size;
      const userCount = client.users.cache.size;
      const channelCount = client.channels.cache.size;
      checks.push({
        name: 'Discord Client Cache',
        status: 'OK',
        details: `${guildCount} servers, ${userCount} users, ${channelCount} channels`
      });
      checks.push({
        name: 'Environnement Système',
        status: 'OK',
        details: `Node ${process.version} | D.js v${djsVersion} | ${os.type()} ${os.arch()}`
      });
    }
    let overall = 'HEALTHY';
    if (hasError) overall = 'ERROR';
    else if (hasWarning) overall = 'WARNING';
    return {
      overall,
      checks,
      timestamp: Date.now()
    };
  }
}
module.exports = DevDiagnosticsService;
