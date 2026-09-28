const fs = require('fs');
const path = require('path');
const dbManager = require('../../utils/database');
const { formatBytes } = require('../../utils/dev/formatters');
class DevDatabaseService {
  static getStats() {
    const db = dbManager.db;
    const dbPath = path.join(__dirname, '..', '..', '..', 'data', 'database.sqlite');
    const fileSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    const pageCount = db.pragma('page_count', { simple: true });
    const pageSize = db.pragma('page_size', { simple: true });
    const freelistCount = db.pragma('freelist_count', { simple: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const tableStats = [];
    for (const t of tables) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get().count;
      tableStats.push({ name: t.name, rows: count });
    }
    return {
      fileSize: formatBytes(fileSize),
      fileSizeBytes: fileSize,
      pageCount,
      pageSize,
      freelistCount,
      tables: tableStats
    };
  }
  static checkIntegrity() {
    const db = dbManager.db;
    const result = db.pragma('integrity_check');
    const isOk = result && result[0] && result[0].integrity_check === 'ok';
    return {
      healthy: isOk,
      details: isOk ? 'OK' : JSON.stringify(result)
    };
  }
  static vacuumAndOptimize() {
    const db = dbManager.db;
    const start = process.hrtime();
    db.exec('VACUUM;');
    db.pragma('optimize');
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
    return {
      durationMs,
      newStats: this.getStats()
    };
  }
  static getSchema() {
    const db = dbManager.db;
    return db.prepare("SELECT name, sql FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%'").all();
  }
}
module.exports = DevDatabaseService;
