const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_settings (
    guild_id TEXT PRIMARY KEY,
    setup_completed INTEGER NOT NULL DEFAULT 0,
    lockdown_enabled INTEGER NOT NULL DEFAULT 0,
    maintenance_enabled INTEGER NOT NULL DEFAULT 0,
    maintenance_message TEXT DEFAULT 'The server is currently undergoing maintenance.',
    log_channel_id TEXT DEFAULT NULL,
    welcome_channel_id TEXT DEFAULT NULL,
    welcome_enabled INTEGER NOT NULL DEFAULT 0,
    welcome_message TEXT DEFAULT 'Welcome to the server, {user} !',
    welcome_role_id TEXT DEFAULT NULL,
    autorole_id TEXT DEFAULT NULL,
    autorole_enabled INTEGER NOT NULL DEFAULT 0,
    verification_enabled INTEGER NOT NULL DEFAULT 0,
    verification_role_id TEXT DEFAULT NULL,
    verification_channel_id TEXT DEFAULT NULL,
    backup_auto INTEGER NOT NULL DEFAULT 0,
    security_level TEXT DEFAULT 'medium',
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS admin_staff (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rank INTEGER NOT NULL DEFAULT 1, -- 1: Mod, 2: Admin, 3: Manager, 4: Owner
    role_title TEXT NOT NULL DEFAULT 'Moderator',
    permissions TEXT DEFAULT '["kick", "mute", "warn"]',
    added_at INTEGER NOT NULL,
    added_by TEXT NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS admin_permissions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'role', 'user', 'channel'
    target_id TEXT NOT NULL,
    permission_node TEXT NOT NULL,
    allowed INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS admin_backups (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_templates (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    roles_json TEXT DEFAULT '[]',
    channels_json TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_automod (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'spam', 'links', 'invites', 'words', 'mentions'
    action TEXT NOT NULL DEFAULT 'warn',
    enabled INTEGER NOT NULL DEFAULT 1,
    exempt_roles TEXT DEFAULT '[]',
    exempt_channels TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_announcements (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    scheduled_at INTEGER,
    sent_at INTEGER,
    created_by TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_forms (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    questions_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'open',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_applications (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    fields_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_tickets_config (
    guild_id TEXT PRIMARY KEY,
    category_id TEXT DEFAULT NULL,
    staff_role_id TEXT DEFAULT NULL,
    transcript_channel_id TEXT DEFAULT NULL,
    panel_message_id TEXT DEFAULT NULL,
    enabled INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS admin_reactions_roles (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    role_id TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_member_notes (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    note TEXT NOT NULL,
    flag TEXT DEFAULT 'INFO',
    created_at INTEGER NOT NULL
  );
`);
class AdminService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM admin_settings WHERE guild_id = ?').get(guildId);
    if (row) return row;
    db.prepare(`
      INSERT OR IGNORE INTO admin_settings (guild_id) VALUES (?)
    `).run(guildId);
    return db.prepare('SELECT * FROM admin_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE admin_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static getStaffList(guildId) {
    return db.prepare('SELECT * FROM admin_staff WHERE guild_id = ? ORDER BY rank DESC, added_at ASC').all(guildId);
  }
  static addStaff(guildId, userId, rank = 1, roleTitle = 'Moderator', addedBy = 'SYSTEM') {
    db.prepare(`
      INSERT INTO admin_staff (guild_id, user_id, rank, role_title, added_at, added_by)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(guild_id, user_id) DO UPDATE SET
        rank = excluded.rank,
        role_title = excluded.role_title
    `).run(guildId, userId, rank, roleTitle, Date.now(), addedBy);
    this.logAudit(guildId, addedBy, 'STAFF_ADD', 'user', userId, `Rank ${rank} (${roleTitle})`);
  }
  static removeStaff(guildId, userId, removedBy = 'SYSTEM') {
    db.prepare('DELETE FROM admin_staff WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
    this.logAudit(guildId, removedBy, 'STAFF_REMOVE', 'user', userId, 'Staff removed');
  }
  static logAudit(guildId, userId, action, targetType = null, targetId = null, details = null) {
    db.prepare(`
      INSERT INTO admin_audit_logs (guild_id, user_id, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(guildId, userId, action, targetType, targetId, details, Date.now());
  }
  static getAuditLogs(guildId, limit = 25) {
    return db.prepare('SELECT * FROM admin_audit_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  static createBackup(guildId, name, data, createdBy = 'SYSTEM') {
    const id = `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO admin_backups (id, guild_id, name, data, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, name, JSON.stringify(data), Date.now(), createdBy);
    return id;
  }
  static getBackups(guildId) {
    return db.prepare('SELECT id, name, created_at, created_by FROM admin_backups WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static getBackup(guildId, backupId) {
    return db.prepare('SELECT * FROM admin_backups WHERE guild_id = ? AND id = ?').get(guildId, backupId);
  }
  static deleteBackup(guildId, backupId) {
    db.prepare('DELETE FROM admin_backups WHERE guild_id = ? AND id = ?').run(guildId, backupId);
  }
  static addMemberNote(guildId, userId, moderatorId, note, flag = 'INFO') {
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO admin_member_notes (id, guild_id, user_id, moderator_id, note, flag, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, moderatorId, note, flag, Date.now());
    return id;
  }
  static getMemberNotes(guildId, userId) {
    return db.prepare('SELECT * FROM admin_member_notes WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
  }
  static runSecurityScan(guild) {
    const findings = [];
    const settings = this.getSettings(guild.id);
    if (!settings.setup_completed) {
      findings.push('⚠️ Administrative configuration wizard not completed.');
    }
    if (!settings.log_channel_id) {
      findings.push('⚠️ No administrative log room configured.');
    }
    if (!settings.verification_enabled) {
      findings.push('ℹ️ Automatic member verification is disabled.');
    }
    if (guild.roles.cache.some(r => r.permissions.has('Administrator') && r.members.size > 5)) {
      findings.push('⚠️ More than 5 members have the Direct Administrator permission.');
    }
    return {
      status: findings.length === 0 ? 'Excellent' : (findings.length <= 2 ? 'Good' : 'Attention required'),
      findings
    };
  }
}
module.exports = AdminService;
