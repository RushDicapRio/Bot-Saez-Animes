const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
db.exec(`
  CREATE TABLE IF NOT EXISTS security_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    threat_level TEXT NOT NULL DEFAULT 'FAIBLE',
    lockdown_active INTEGER NOT NULL DEFAULT 0,
    emergency_active INTEGER NOT NULL DEFAULT 0,
    safe_mode_active INTEGER NOT NULL DEFAULT 0,
    two_factor_required INTEGER NOT NULL DEFAULT 0,
    verification_level TEXT NOT NULL DEFAULT 'AVERAGE',
    alert_channel_id TEXT DEFAULT NULL,
    alert_role_id TEXT DEFAULT NULL,
    alert_dm INTEGER NOT NULL DEFAULT 1,
    anti_phishing INTEGER NOT NULL DEFAULT 1,
    anti_scam INTEGER NOT NULL DEFAULT 1,
    anti_abuse INTEGER NOT NULL DEFAULT 1,
    rate_limit_max INTEGER NOT NULL DEFAULT 30,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS security_incidents (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'MOYEN',
    status TEXT NOT NULL DEFAULT 'OPEN',
    assigned_to TEXT,
    description TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS security_threats (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    target_id TEXT,
    target_type TEXT NOT NULL DEFAULT 'USER',
    severity TEXT NOT NULL DEFAULT 'WEAK',
    status TEXT NOT NULL DEFAULT 'DETECTED',
    details TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS security_alerts (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'INFO',
    channel_id TEXT,
    message TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS security_sessions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    device TEXT NOT NULL DEFAULT 'Desktop / Discord Client',
    ip TEXT NOT NULL DEFAULT '127.0.0.1',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS security_lists (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    list_type TEXT NOT NULL DEFAULT 'whitelist',
    target_type TEXT NOT NULL DEFAULT 'user',
    value TEXT NOT NULL,
    reason TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS security_tokens (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'read:audit',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS security_stats (
    guild_id TEXT PRIMARY KEY,
    threats_blocked INTEGER NOT NULL DEFAULT 0,
    scans_performed INTEGER NOT NULL DEFAULT 0,
    incidents_count INTEGER NOT NULL DEFAULT 0,
    alerts_sent INTEGER NOT NULL DEFAULT 0,
    risk_score INTEGER NOT NULL DEFAULT 12
  );
`);
class SecurityService {
  constructor() {
    this.cache = new Map();
  }
  getSettings(guildId) {
    if (!guildId) guildId = 'global';
    let row = db.prepare('SELECT * FROM security_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO security_settings (guild_id, enabled, threat_level, lockdown_active, emergency_active, safe_mode_active, two_factor_required, verification_level, alert_channel_id, alert_role_id, alert_dm, anti_phishing, anti_scam, anti_abuse, rate_limit_max, created_at, updated_at)
        VALUES (?, 1, 'FAIBLE', 0, 0, 0, 0, 'Moyen', NULL, NULL, 1, 1, 1, 1, 30, ?, ?)
      `).run(guildId, now, now);
      row = db.prepare('SELECT * FROM security_settings WHERE guild_id = ?').get(guildId);
    }
    return row;
  }
  updateSettings(guildId, fields = {}) {
    if (!guildId) guildId = 'global';
    this.getSettings(guildId);
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => fields[k]);
    values.push(Date.now(), guildId);
    db.prepare(`UPDATE security_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
  }
  getStats(guildId) {
    if (!guildId) guildId = 'global';
    let stats = db.prepare('SELECT * FROM security_stats WHERE guild_id = ?').get(guildId);
    if (!stats) {
      db.prepare('INSERT INTO security_stats (guild_id, threats_blocked, scans_performed, incidents_count, alerts_sent, risk_score) VALUES (?, 0, 0, 0, 0, 12)').run(guildId);
      stats = db.prepare('SELECT * FROM security_stats WHERE guild_id = ?').get(guildId);
    }
    return stats;
  }
  createIncident(guildId, title, description, severity = 'MOYEN') {
    const id = 'inc_' + crypto.randomUUID().slice(0, 8);
    const now = Date.now();
    db.prepare(`
      INSERT INTO security_incidents (id, guild_id, title, severity, status, assigned_to, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'OPEN', NULL, ?, ?, ?)
    `).run(id, guildId, title, severity, description, now, now);
    db.prepare(`
      INSERT INTO security_stats (guild_id, incidents_count) VALUES (?, 1)
      ON CONFLICT(guild_id) DO UPDATE SET incidents_count = incidents_count + 1
    `).run(guildId);
    return id;
  }
  getIncidents(guildId, status = null) {
    if (status) {
      return db.prepare('SELECT * FROM security_incidents WHERE guild_id = ? AND status = ? ORDER BY created_at DESC').all(guildId, status);
    }
    return db.prepare('SELECT * FROM security_incidents WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  recordThreat(guildId, type, targetId, severity = 'FAIBLE', details = {}) {
    const id = 'thr_' + crypto.randomUUID().slice(0, 8);
    const now = Date.now();
    db.prepare(`
      INSERT INTO security_threats (id, guild_id, type, target_id, target_type, severity, status, details, created_at)
      VALUES (?, ?, ?, ?, 'USER', ?, 'DETECTED', ?, ?)
    `).run(id, guildId, type, targetId, severity, JSON.stringify(details), now);
    db.prepare(`
      INSERT INTO security_stats (guild_id, threats_blocked) VALUES (?, 1)
      ON CONFLICT(guild_id) DO UPDATE SET threats_blocked = threats_blocked + 1
    `).run(guildId);
    return id;
  }
  getThreats(guildId) {
    return db.prepare('SELECT * FROM security_threats WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  performScan(guild, type = 'quick') {
    const guildId = guild?.id || 'global';
    const now = Date.now();
    const threatsFound = [];
    const membersCount = guild?.memberCount || 1;
    const rolesCount = guild?.roles?.cache?.size || 1;
    const channelsCount = guild?.channels?.cache?.size || 1;
    let riskScore = 8;
    if (rolesCount > 50) riskScore += 5;
    if (channelsCount > 60) riskScore += 4;
    db.prepare(`
      INSERT INTO security_stats (guild_id, scans_performed, risk_score) VALUES (?, 1, ?)
      ON CONFLICT(guild_id) DO UPDATE SET
        scans_performed = scans_performed + 1,
        risk_score = excluded.risk_score
    `).run(guildId, riskScore);
    return {
      type,
      riskScore,
      scannedMembers: membersCount,
      scannedRoles: rolesCount,
      scannedChannels: channelsCount,
      threatsFound,
      status: 'TERMINÉ',
      completedAt: now
    };
  }
  addToList(guildId, listType, targetType, value, reason = '') {
    const id = 'lst_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO security_lists (id, guild_id, list_type, target_type, value, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, listType, targetType, value, reason, Date.now());
    return id;
  }
  getList(guildId, listType) {
    return db.prepare('SELECT * FROM security_lists WHERE guild_id = ? AND list_type = ? ORDER BY created_at DESC').all(guildId, listType);
  }
  removeFromList(guildId, listType, value) {
    db.prepare('DELETE FROM security_lists WHERE guild_id = ? AND list_type = ? AND value = ?').run(guildId, listType, value);
  }
}
module.exports = new SecurityService();
