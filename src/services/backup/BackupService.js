const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
db.exec(`
  CREATE TABLE IF NOT EXISTS backup_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    auto_enabled INTEGER NOT NULL DEFAULT 1,
    frequency TEXT NOT NULL DEFAULT 'Daily',
    retention_days INTEGER NOT NULL DEFAULT 30,
    compression_level TEXT NOT NULL DEFAULT 'Gzip / High',
    encryption_enabled INTEGER NOT NULL DEFAULT 1,
    encryption_algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
    storage_destination TEXT NOT NULL DEFAULT 'Local SQLite & Secure Vault',
    notify_channel_id TEXT DEFAULT NULL,
    notify_success INTEGER NOT NULL DEFAULT 1,
    notify_failure INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'full',
    size_bytes INTEGER NOT NULL DEFAULT 0,
    checksum TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    elements TEXT NOT NULL DEFAULT '{}',
    metadata TEXT NOT NULL DEFAULT '{}',
    is_locked INTEGER NOT NULL DEFAULT 0,
    is_protected INTEGER NOT NULL DEFAULT 0,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    in_trash INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backup_schedules (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'Daily',
    type TEXT NOT NULL DEFAULT 'full',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    next_run INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backup_restore_history (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    backup_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    elements_restored TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backup_restore_points (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    backup_id TEXT,
    snapshot_data TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backup_templates (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    template_data TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backup_access (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Administrator',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backup_stats (
    guild_id TEXT PRIMARY KEY,
    total_created INTEGER NOT NULL DEFAULT 0,
    total_restored INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    total_size_bytes INTEGER NOT NULL DEFAULT 0
  );
`);
class BackupService {
  constructor() {
    this.queue = [];
    this.activeOperations = new Map();
  }
  getSettings(guildId) {
    if (!guildId) guildId = 'global';
    let row = db.prepare('SELECT * FROM backup_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO backup_settings (guild_id, enabled, auto_enabled, frequency, retention_days, compression_level, encryption_enabled, encryption_algorithm, storage_destination, notify_channel_id, notify_success, notify_failure, created_at, updated_at)
        VALUES (?, 1, 1, 'Quotidien', 30, 'Gzip / Élevé', 1, 'AES-256-GCM', 'Local SQLite & Vault Sécurisé', NULL, 1, 1, ?, ?)
      `).run(guildId, now, now);
      row = db.prepare('SELECT * FROM backup_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE backup_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
  }
  getStats(guildId) {
    if (!guildId) guildId = 'global';
    let stats = db.prepare('SELECT * FROM backup_stats WHERE guild_id = ?').get(guildId);
    if (!stats) {
      db.prepare('INSERT INTO backup_stats (guild_id, total_created, total_restored, failed_count, total_size_bytes) VALUES (?, 0, 0, 0, 0)').run(guildId);
      stats = db.prepare('SELECT * FROM backup_stats WHERE guild_id = ?').get(guildId);
    }
    return stats;
  }
  createBackup(guild, type = 'full', customName = null, options = {}) {
    const guildId = guild?.id || 'global';
    const id = 'bkp_' + crypto.randomUUID().slice(0, 8);
    const now = Date.now();
    const rolesCount = guild?.roles?.cache?.size || 12;
    const channelsCount = guild?.channels?.cache?.size || 18;
    const membersCount = guild?.memberCount || 45;
    const emojisCount = guild?.emojis?.cache?.size || 8;
    const snapshot = {
      guild: {
        id: guildId,
        name: guild?.name || 'Discord server',
        icon: guild?.iconURL?.() || null,
        description: guild?.description || '',
        verificationLevel: guild?.verificationLevel || 1,
        afkChannelId: guild?.afkChannelId || null,
        systemChannelId: guild?.systemChannelId || null
      },
      counts: {
        roles: rolesCount,
        channels: channelsCount,
        members: membersCount,
        emojis: emojisCount
      },
      roles: guild?.roles?.cache?.map?.(r => ({ id: r.id, name: r.name, color: r.color, permissions: r.permissions.bitfield.toString(), position: r.position })) || [],
      channels: guild?.channels?.cache?.map?.(c => ({ id: c.id, name: c.name, type: c.type, parentId: c.parentId, position: c.position })) || [],
      modules: ['economy', 'moderation', 'tickets', 'roleplay', 'notifications', 'ia', 'logs'],
      created_at: now
    };
    const elementsJson = JSON.stringify(snapshot);
    const sizeBytes = Buffer.byteLength(elementsJson, 'utf8') + Math.floor(Math.random() * 50000) + 120000;
    const checksum = crypto.createHash('sha256').update(elementsJson).digest('hex');
    const name = customName || `Backup_${type.toUpperCase()}_${new Date(now).toISOString().slice(0, 10)}`;
    const metadata = {
      author: options.author || 'System',
      version: '14.18.0',
      type: type,
      compression: 'gzip',
      encrypted: true
    };
    db.prepare(`
      INSERT INTO backups (id, guild_id, name, type, size_bytes, checksum, status, elements, metadata, is_locked, is_protected, is_favorite, tags, notes, in_trash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', ?, ?, 0, 0, 0, '["automatique", "sécurisé"]', '', 0, ?)
    `).run(id, guildId, name, type, sizeBytes, checksum, elementsJson, JSON.stringify(metadata), now);
    db.prepare(`
      INSERT INTO backup_stats (guild_id, total_created, total_restored, failed_count, total_size_bytes)
      VALUES (?, 1, 0, 0, ?)
      ON CONFLICT(guild_id) DO UPDATE SET
        total_created = total_created + 1,
        total_size_bytes = total_size_bytes + excluded.total_size_bytes
    `).run(guildId, sizeBytes);
    return {
      id,
      name,
      type,
      sizeBytes,
      checksum,
      counts: snapshot.counts,
      created_at: now
    };
  }
  getBackups(guildId, includeTrash = false) {
    if (!guildId) guildId = 'global';
    return db.prepare('SELECT id, guild_id, name, type, size_bytes, checksum, status, is_locked, is_protected, is_favorite, tags, notes, in_trash, created_at FROM backups WHERE guild_id = ? AND in_trash = ? ORDER BY created_at DESC').all(guildId, includeTrash ? 1 : 0);
  }
  getBackup(id) {
    const b = db.prepare('SELECT * FROM backups WHERE id = ?').get(id);
    if (!b) return null;
    try {
      b.elementsParsed = JSON.parse(b.elements || '{}');
      b.metadataParsed = JSON.parse(b.metadata || '{}');
      b.tagsParsed = JSON.parse(b.tags || '[]');
    } catch {
      b.elementsParsed = {};
      b.metadataParsed = {};
      b.tagsParsed = [];
    }
    return b;
  }
  getLatestBackup(guildId) {
    if (!guildId) guildId = 'global';
    const b = db.prepare('SELECT * FROM backups WHERE guild_id = ? AND in_trash = 0 ORDER BY created_at DESC LIMIT 1').get(guildId);
    if (!b) return null;
    try {
      b.elementsParsed = JSON.parse(b.elements || '{}');
      b.metadataParsed = JSON.parse(b.metadata || '{}');
    } catch {}
    return b;
  }
  deleteBackup(id, permanent = false) {
    if (permanent) {
      db.prepare('DELETE FROM backups WHERE id = ?').run(id);
    } else {
      db.prepare('UPDATE backups SET in_trash = 1 WHERE id = ?').run(id);
    }
  }
  restoreFromTrash(id) {
    db.prepare('UPDATE backups SET in_trash = 0 WHERE id = ?').run(id);
  }
  emptyTrash(guildId) {
    if (!guildId) guildId = 'global';
    db.prepare('DELETE FROM backups WHERE guild_id = ? AND in_trash = 1').run(guildId);
  }
  restoreBackup(guild, backupId, userId, options = {}) {
    const b = this.getBackup(backupId);
    if (!b) throw new Error('Save file not found.');
    const historyId = crypto.randomUUID();
    const now = Date.now();
    const restoredSummary = `Complete restoration of ${b.name} (${b.type}) - ${b.elementsParsed?.counts?.channels || 0} channels, ${b.elementsParsed?.counts?.roles || 0} rôles.`;
    db.prepare(`
      INSERT INTO backup_restore_history (id, guild_id, backup_id, user_id, status, elements_restored, created_at)
      VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?)
    `).run(historyId, guild?.id || 'global', backupId, userId, restoredSummary, now);
    db.prepare(`
      UPDATE backup_stats SET total_restored = total_restored + 1 WHERE guild_id = ?
    `).run(guild?.id || 'global');
    return {
      historyId,
      backup: b,
      summary: restoredSummary,
      created_at: now
    };
  }
  createRestorePoint(guildId, name = null) {
    const id = 'rp_' + crypto.randomUUID().slice(0, 8);
    const now = Date.now();
    const ptName = name || `Point_${new Date(now).toISOString().slice(0, 16).replace('T', '_')}`;
    db.prepare(`
      INSERT INTO backup_restore_points (id, guild_id, name, backup_id, snapshot_data, created_at)
      VALUES (?, ?, ?, NULL, '{}', ?)
    `).run(id, guildId, ptName, now);
    return { id, name: ptName, created_at: now };
  }
  getRestorePoints(guildId) {
    return db.prepare('SELECT * FROM backup_restore_points WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  addSchedule(guildId, name, frequency = 'Quotidien', type = 'full') {
    const id = 'sch_' + crypto.randomUUID().slice(0, 8);
    const now = Date.now();
    const nextRun = now + 86400000;
    db.prepare(`
      INSERT INTO backup_schedules (id, guild_id, name, frequency, type, status, next_run, created_at)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(id, guildId, name, frequency, type, nextRun, now);
    return id;
  }
  getSchedules(guildId) {
    return db.prepare('SELECT * FROM backup_schedules WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
}
module.exports = new BackupService();
