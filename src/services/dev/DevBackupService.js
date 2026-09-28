const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { formatBytes } = require('../../utils/dev/formatters');
class DevBackupService {
  static getBackupsDir() {
    const dir = path.join(__dirname, '..', '..', '..', 'data', 'backups');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }
  static getDbPath() {
    return path.join(__dirname, '..', '..', '..', 'data', 'database.sqlite');
  }
  static async createBackup() {
    const backupsDir = this.getBackupsDir();
    const sourceDb = this.getDbPath();
    if (!fs.existsSync(sourceDb)) {
      throw new Error("The source database file does not exist.");
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sqlite`;
    const targetPath = path.join(backupsDir, backupFileName);
    fs.copyFileSync(sourceDb, targetPath);
    const stats = fs.statSync(targetPath);
    return {
      fileName: backupFileName,
      path: targetPath,
      size: formatBytes(stats.size),
      sizeBytes: stats.size,
      timestamp: stats.mtimeMs
    };
  }
  static listBackups() {
    const backupsDir = this.getBackupsDir();
    if (!fs.existsSync(backupsDir)) return [];
    const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.sqlite'));
    return files.map(file => {
      const fullPath = path.join(backupsDir, file);
      const stats = fs.statSync(fullPath);
      return {
        fileName: file,
        size: formatBytes(stats.size),
        sizeBytes: stats.size,
        createdAt: stats.mtimeMs
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
  }
  /**
   * @param {string} fileName 
   */
  static verifyBackup(fileName) {
    const backupsDir = this.getBackupsDir();
    const backupPath = path.join(backupsDir, fileName);
    if (!fs.existsSync(backupPath)) {
      throw new Error(`The save file ${fileName} cannot be found.`);
    }
    const testDb = new Database(backupPath, { readonly: true });
    try {
      const integrity = testDb.pragma('integrity_check');
      const isOk = integrity && integrity[0] && integrity[0].integrity_check === 'ok';
      return {
        valid: isOk,
        details: isOk ? 'SQLite integrity validated without errors.' : 'Altered or corrupted file.'
      };
    } finally {
      testDb.close();
    }
  }
  /**
   * @param {string} fileName 
   */
  static restoreBackup(fileName) {
    const backupsDir = this.getBackupsDir();
    const backupPath = path.join(backupsDir, fileName);
    const mainDb = this.getDbPath();
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Save file not found : ${fileName}`);
    }
    const tempRescue = path.join(backupsDir, `pre-restore-rescue-${Date.now()}.sqlite`);
    if (fs.existsSync(mainDb)) {
      fs.copyFileSync(mainDb, tempRescue);
    }
    fs.copyFileSync(backupPath, mainDb);
    return {
      restoredFrom: fileName,
      rescueFile: path.basename(tempRescue)
    };
  }
  /**
   * @param {string} fileName 
   */
  static deleteBackup(fileName) {
    const backupsDir = this.getBackupsDir();
    const backupPath = path.join(backupsDir, fileName);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      return true;
    }
    return false;
  }
}
module.exports = DevBackupService;
