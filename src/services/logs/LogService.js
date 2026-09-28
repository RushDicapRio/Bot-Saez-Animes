const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS log_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    default_channel_id TEXT,
    retention_days INTEGER NOT NULL DEFAULT 30,
    level TEXT NOT NULL DEFAULT 'INFO',
    compact INTEGER NOT NULL DEFAULT 0,
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    action TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SYSTEM',
    severity TEXT NOT NULL DEFAULT 'INFO',
    user_id TEXT,
    target_id TEXT,
    channel_id TEXT,
    details TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS log_channels (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    category TEXT NOT NULL,
    channel_id TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS log_filters (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    filter_type TEXT NOT NULL,
    target_id TEXT NOT NULL
  );
`);
class LogService {
  static getSettings(guildId) {
    let row = db.prepare('SELECT * FROM log_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      db.prepare('INSERT OR IGNORE INTO log_settings (guild_id) VALUES (?)').run(guildId);
      row = db.prepare('SELECT * FROM log_settings WHERE guild_id = ?').get(guildId);
    }
    return row;
  }
  static updateSettings(guildId, data) {
    this.getSettings(guildId);
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    if (fields.length === 0) return this.getSettings(guildId);
    values.push(guildId);
    db.prepare(`UPDATE log_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static log(guildId, action, type = 'SYSTEM', severity = 'INFO', userId = null, targetId = null, channelId = null, details = '') {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO audit_logs (id, guild_id, action, type, severity, user_id, target_id, channel_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, action, type, severity, userId, targetId, channelId, details, now);
    return id;
  }
  static getLogs(guildId, options = {}) {
    let query = 'SELECT * FROM audit_logs WHERE guild_id = ?';
    const params = [guildId];
    if (options.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }
    if (options.severity) {
      query += ' AND severity = ?';
      params.push(options.severity);
    }
    if (options.userId) {
      query += ' AND user_id = ?';
      params.push(options.userId);
    }
    if (options.channelId) {
      query += ' AND channel_id = ?';
      params.push(options.channelId);
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(options.limit || 15);
    return db.prepare(query).all(...params);
  }
  static getLog(id) {
    return db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id);
  }
  static purgeLogs(guildId, days = 30) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const res = db.prepare('DELETE FROM audit_logs WHERE guild_id = ? AND created_at < ?').run(guildId, cutoff);
    return res.changes;
  }
  static clearLogs(guildId) {
    const res = db.prepare('DELETE FROM audit_logs WHERE guild_id = ?').run(guildId);
    return res.changes;
  }
  static setLogChannel(guildId, category, channelId) {
    const existing = db.prepare('SELECT * FROM log_channels WHERE guild_id = ? AND category = ?').get(guildId, category);
    if (existing) {
      db.prepare('UPDATE log_channels SET channel_id = ? WHERE id = ?').run(channelId, existing.id);
    } else {
      const id = `lch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare('INSERT INTO log_channels (id, guild_id, category, channel_id) VALUES (?, ?, ?, ?)').run(id, guildId, category, channelId);
    }
  }
  static getLogChannels(guildId) {
    return db.prepare('SELECT * FROM log_channels WHERE guild_id = ?').all(guildId);
  }
  static removeLogChannel(guildId, category) {
    const res = db.prepare('DELETE FROM log_channels WHERE guild_id = ? AND category = ?').run(guildId, category);
    return res.changes > 0;
  }
  static getStats(guildId) {
    const totalLogs = db.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE guild_id = ?').get(guildId).count;
    const errors = db.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE guild_id = ? AND severity = \'CRITICAL\'').get(guildId).count;
    const warnings = db.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE guild_id = ? AND severity = \'WARNING\'').get(guildId).count;
    const configuredChannels = db.prepare('SELECT COUNT(*) as count FROM log_channels WHERE guild_id = ?').get(guildId).count;
    return { totalLogs, errors, warnings, configuredChannels };
  }
}
module.exports = LogService;
