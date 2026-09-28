const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS mod_settings (
    guild_id TEXT PRIMARY KEY,
    modlog_channel_id TEXT DEFAULT NULL,
    mute_role_id TEXT DEFAULT NULL,
    quarantine_role_id TEXT DEFAULT NULL,
    automod_enabled INTEGER NOT NULL DEFAULT 1,
    raidmode_enabled INTEGER NOT NULL DEFAULT 0,
    anti_spam_enabled INTEGER NOT NULL DEFAULT 1,
    join_protection_enabled INTEGER NOT NULL DEFAULT 1,
    min_account_age_days INTEGER NOT NULL DEFAULT 3,
    slowmode_default INTEGER NOT NULL DEFAULT 0,
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS mod_cases (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    case_number INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'WARN', 'TIMEOUT', 'MUTE', 'KICK', 'BAN', 'SOFTBAN', 'STRIKE'
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'No reason provided',
    duration INTEGER DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'RESOLVED', 'APPEALED', 'CLOSED'
    evidence TEXT DEFAULT '[]',
    notes TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_warns (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_strikes (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_notes (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    note TEXT NOT NULL,
    is_private INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_reports (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    reported_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'
    priority TEXT NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    assigned_to TEXT DEFAULT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_appeals (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    case_id TEXT,
    appeal_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
    reviewed_by TEXT DEFAULT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_automod_rules (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'SPAM', 'LINKS', 'INVITES', 'WORDS', 'MENTIONS', 'CAPS'
    action TEXT NOT NULL DEFAULT 'WARN',
    enabled INTEGER NOT NULL DEFAULT 1,
    exempt_roles TEXT DEFAULT '[]',
    exempt_channels TEXT DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS mod_blacklists (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'user', 'role', 'channel', 'word', 'domain', 'invite'
    value TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_whitelists (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_presets (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    action TEXT NOT NULL,
    duration INTEGER DEFAULT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_suspicious (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 1,
    reasons TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
`);
class ModerationService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM mod_settings WHERE guild_id = ?').get(guildId);
    if (row) return row;
    db.prepare('INSERT OR IGNORE INTO mod_settings (guild_id) VALUES (?)').run(guildId);
    return db.prepare('SELECT * FROM mod_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE mod_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static createCase(guildId, { type, userId, moderatorId, reason = 'No reason provided', duration = null }) {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM mod_cases WHERE guild_id = ?').get(guildId);
    const caseNumber = (countRow ? countRow.count : 0) + 1;
    const id = `case_${guildId}_${caseNumber}`;
    db.prepare(`
      INSERT INTO mod_cases (id, guild_id, case_number, type, user_id, moderator_id, reason, duration, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
    `).run(id, guildId, caseNumber, type.toUpperCase(), userId, moderatorId, reason, duration, Date.now());
    return { id, caseNumber, type, userId, moderatorId, reason, duration };
  }
  static getCase(guildId, caseIdentifier) {
    return db.prepare('SELECT * FROM mod_cases WHERE guild_id = ? AND (id = ? OR case_number = ?)').get(guildId, caseIdentifier, caseIdentifier);
  }
  static getCases(guildId, limit = 10) {
    return db.prepare('SELECT * FROM mod_cases WHERE guild_id = ? ORDER BY case_number DESC LIMIT ?').all(guildId, limit);
  }
  static getUserCases(guildId, userId) {
    return db.prepare('SELECT * FROM mod_cases WHERE guild_id = ? AND user_id = ? ORDER BY case_number DESC').all(guildId, userId);
  }
  static addWarn(guildId, userId, moderatorId, reason) {
    const id = `warn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO mod_warns (id, guild_id, user_id, moderator_id, reason, active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(id, guildId, userId, moderatorId, reason, Date.now());
    this.createCase(guildId, { type: 'WARN', userId, moderatorId, reason });
    return id;
  }
  static getWarns(guildId, userId) {
    return db.prepare('SELECT * FROM mod_warns WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
  }
  static removeWarn(guildId, warnId) {
    db.prepare('DELETE FROM mod_warns WHERE guild_id = ? AND id = ?').run(guildId, warnId);
  }
  static clearWarns(guildId, userId) {
    db.prepare('DELETE FROM mod_warns WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
  }
  static addStrike(guildId, userId, points = 1, reason = 'Infraction disciplinaire') {
    const id = `str_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO mod_strikes (id, guild_id, user_id, points, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, points, reason, Date.now());
    return id;
  }
  static getStrikes(guildId, userId) {
    return db.prepare('SELECT * FROM mod_strikes WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
  }
  static getTotalStrikes(guildId, userId) {
    const row = db.prepare('SELECT SUM(points) as total FROM mod_strikes WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    return row && row.total ? row.total : 0;
  }
  static addNote(guildId, userId, moderatorId, note, isPrivate = 0) {
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO mod_notes (id, guild_id, user_id, moderator_id, note, is_private, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, moderatorId, note, isPrivate ? 1 : 0, Date.now());
    return id;
  }
  static getNotes(guildId, userId) {
    return db.prepare('SELECT * FROM mod_notes WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
  }
  static createReport(guildId, reporterId, reportedId, reason, priority = 'MEDIUM') {
    const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO mod_reports (id, guild_id, reporter_id, reported_id, reason, status, priority, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).run(id, guildId, reporterId, reportedId, reason, priority, Date.now());
    return id;
  }
  static getReports(guildId, limit = 10) {
    return db.prepare('SELECT * FROM mod_reports WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?').all(guildId, limit);
  }
  static getStats(guildId) {
    const casesCount = db.prepare('SELECT COUNT(*) as count FROM mod_cases WHERE guild_id = ?').get(guildId);
    const warnsCount = db.prepare('SELECT COUNT(*) as count FROM mod_warns WHERE guild_id = ?').get(guildId);
    const reportsCount = db.prepare('SELECT COUNT(*) as count FROM mod_reports WHERE guild_id = ?').get(guildId);
    return {
      totalCases: casesCount ? casesCount.count : 0,
      totalWarns: warnsCount ? warnsCount.count : 0,
      totalReports: reportsCount ? reportsCount.count : 0
    };
  }
}
module.exports = ModerationService;
