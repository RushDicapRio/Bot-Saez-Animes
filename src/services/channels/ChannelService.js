const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
const { ChannelType, PermissionsBitField } = require('discord.js');
db.exec(`
  CREATE TABLE IF NOT EXISTS channel_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    logs_channel_id TEXT DEFAULT NULL,
    auto_create_enabled INTEGER NOT NULL DEFAULT 0,
    auto_create_category_id TEXT DEFAULT NULL,
    auto_create_template_id TEXT DEFAULT NULL,
    auto_create_limit INTEGER NOT NULL DEFAULT 20,
    auto_delete_enabled INTEGER NOT NULL DEFAULT 0,
    auto_delete_empty INTEGER NOT NULL DEFAULT 0,
    auto_delete_inactive INTEGER NOT NULL DEFAULT 0,
    inactivity_threshold_days INTEGER NOT NULL DEFAULT 14,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS channel_templates (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type INTEGER NOT NULL DEFAULT 0,
    topic TEXT NOT NULL DEFAULT '',
    slowmode INTEGER NOT NULL DEFAULT 0,
    nsfw INTEGER NOT NULL DEFAULT 0,
    permissions_data TEXT DEFAULT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS channel_snapshots (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS channel_audit_logs (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS channel_copied_permissions (
    user_id TEXT PRIMARY KEY,
    permissions_data TEXT NOT NULL,
    copied_at INTEGER NOT NULL
  );
`);
class ChannelService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM channel_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO channel_settings (guild_id, updated_at)
        VALUES (?, ?)
      `).run(guildId, now);
      return db.prepare('SELECT * FROM channel_settings WHERE guild_id = ?').get(guildId);
    }
    return row;
  }
  static updateSettings(guildId, updates) {
    this.getSettings(guildId);
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), guildId);
    db.prepare(`
      UPDATE channel_settings 
      SET ${setClauses}, updated_at = ?
      WHERE guild_id = ?
    `).run(...values);
    return this.getSettings(guildId);
  }
  static getTemplates(guildId) {
    return db.prepare('SELECT * FROM channel_templates WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static getTemplate(guildId, idOrName) {
    return db.prepare('SELECT * FROM channel_templates WHERE guild_id = ? AND (id = ? OR name = ?)').get(guildId, idOrName, idOrName);
  }
  static createTemplate(guildId, { name, type = 0, topic = '', slowmode = 0, nsfw = 0, permissionsData = null }) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO channel_templates (id, guild_id, name, type, topic, slowmode, nsfw, permissions_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, name, type, topic, slowmode, nsfw ? 1 : 0, permissionsData ? JSON.stringify(permissionsData) : null, Date.now());
    return this.getTemplate(guildId, id);
  }
  static deleteTemplate(guildId, idOrName) {
    return db.prepare('DELETE FROM channel_templates WHERE guild_id = ? AND (id = ? OR name = ?)').run(guildId, idOrName, idOrName).changes > 0;
  }
  static createSnapshot(guild, name = 'Snapshot Trade Shows') {
    const id = crypto.randomUUID();
    const channelsData = guild.channels.cache.map(ch => ({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      parentId: ch.parentId,
      position: ch.rawPosition,
      topic: ch.topic || null,
      nsfw: !!ch.nsfw,
      rateLimitPerUser: ch.rateLimitPerUser || 0,
      permissionOverwrites: ch.permissionOverwrites.cache.map(ov => ({
        id: ov.id,
        type: ov.type,
        allow: ov.allow.bitfield.toString(),
        deny: ov.deny.bitfield.toString()
      }))
    }));
    db.prepare(`
      INSERT INTO channel_snapshots (id, guild_id, name, data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guild.id, name, JSON.stringify(channelsData), Date.now());
    return id;
  }
  static getSnapshots(guildId) {
    return db.prepare('SELECT id, name, created_at FROM channel_snapshots WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static getSnapshot(guildId, idOrName) {
    return db.prepare('SELECT * FROM channel_snapshots WHERE guild_id = ? AND (id = ? OR name = ?) ORDER BY created_at DESC LIMIT 1').get(guildId, idOrName, idOrName);
  }
  static deleteSnapshot(guildId, idOrName) {
    return db.prepare('DELETE FROM channel_snapshots WHERE guild_id = ? AND (id = ? OR name = ?)').run(guildId, idOrName, idOrName).changes > 0;
  }
  static copyPermissions(userId, channel) {
    const overwrites = channel.permissionOverwrites.cache.map(ov => ({
      id: ov.id,
      type: ov.type,
      allow: ov.allow.bitfield.toString(),
      deny: ov.deny.bitfield.toString()
    }));
    const existing = db.prepare('SELECT user_id FROM channel_copied_permissions WHERE user_id = ?').get(userId);
    const now = Date.now();
    if (existing) {
      db.prepare('UPDATE channel_copied_permissions SET permissions_data = ?, copied_at = ? WHERE user_id = ?').run(JSON.stringify(overwrites), now, userId);
    } else {
      db.prepare('INSERT INTO channel_copied_permissions (user_id, permissions_data, copied_at) VALUES (?, ?, ?)').run(userId, JSON.stringify(overwrites), now);
    }
    return overwrites.length;
  }
  static getCopiedPermissions(userId) {
    const row = db.prepare('SELECT * FROM channel_copied_permissions WHERE user_id = ?').get(userId);
    if (!row) return null;
    try {
      return JSON.parse(row.permissions_data);
    } catch (_) {
      return null;
    }
  }
  static logAction(guildId, channelId, userId, action, details = '') {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO channel_audit_logs (id, guild_id, channel_id, user_id, action, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, channelId || 'unknown', userId || 'unknown', action, details, Date.now());
    return id;
  }
  static getAuditLogs(guildId, limit = 20) {
    return db.prepare('SELECT * FROM channel_audit_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
}
module.exports = ChannelService;
