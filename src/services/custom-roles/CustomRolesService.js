const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_roles_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    max_roles_per_user INTEGER NOT NULL DEFAULT 5,
    cooldown_seconds INTEGER NOT NULL DEFAULT 10,
    notify_channel_id TEXT DEFAULT NULL,
    welcome_role_id TEXT DEFAULT NULL,
    restore_on_rejoin INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_roles (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    role_id TEXT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#5865F2',
    icon TEXT DEFAULT NULL,
    emoji TEXT DEFAULT NULL,
    hoist INTEGER NOT NULL DEFAULT 0,
    mentionable INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    is_self_assignable INTEGER NOT NULL DEFAULT 0,
    group_id TEXT DEFAULT NULL,
    required_level INTEGER NOT NULL DEFAULT 0,
    required_xp INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_role_assignments (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_at INTEGER NOT NULL,
    expires_at INTEGER DEFAULT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_role_groups (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_exclusive INTEGER NOT NULL DEFAULT 0,
    max_roles INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_role_menus (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT,
    message_id TEXT,
    title TEXT NOT NULL,
    menu_type TEXT NOT NULL DEFAULT 'select',
    options TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_role_templates (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    template_data TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_role_stats (
    guild_id TEXT PRIMARY KEY,
    total_roles_created INTEGER NOT NULL DEFAULT 0,
    total_assigned INTEGER NOT NULL DEFAULT 0,
    active_menus INTEGER NOT NULL DEFAULT 0
  );
`);
class CustomRolesService {
  constructor() {
    this.cache = new Map();
  }
  getSettings(guildId) {
    if (!guildId) guildId = 'global';
    let row = db.prepare('SELECT * FROM custom_roles_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO custom_roles_settings (guild_id, enabled, max_roles_per_user, cooldown_seconds, notify_channel_id, welcome_role_id, restore_on_rejoin, created_at, updated_at)
        VALUES (?, 1, 5, 10, NULL, NULL, 1, ?, ?)
      `).run(guildId, now, now);
      row = db.prepare('SELECT * FROM custom_roles_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE custom_roles_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
  }
  getStats(guildId) {
    if (!guildId) guildId = 'global';
    let stats = db.prepare('SELECT * FROM custom_role_stats WHERE guild_id = ?').get(guildId);
    if (!stats) {
      db.prepare('INSERT INTO custom_role_stats (guild_id, total_roles_created, total_assigned, active_menus) VALUES (?, 0, 0, 0)').run(guildId);
      stats = db.prepare('SELECT * FROM custom_role_stats WHERE guild_id = ?').get(guildId);
    }
    return stats;
  }
  createRole(guildId, name, options = {}) {
    const id = 'cr_' + crypto.randomUUID().slice(0, 8);
    const now = Date.now();
    const color = options.color || '#5865F2';
    const roleId = options.roleId || id;
    db.prepare(`
      INSERT INTO custom_roles (id, guild_id, role_id, name, color, icon, emoji, hoist, mentionable, position, is_self_assignable, group_id, required_level, required_xp, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      guildId,
      roleId,
      name,
      color,
      options.icon || null,
      options.emoji || null,
      options.hoist ? 1 : 0,
      options.mentionable ? 1 : 0,
      options.position || 0,
      options.isSelf ? 1 : 0,
      options.groupId || null,
      options.level || 0,
      options.xp || 0,
      options.createdBy || 'Système',
      now
    );
    db.prepare(`
      INSERT INTO custom_role_stats (guild_id, total_roles_created) VALUES (?, 1)
      ON CONFLICT(guild_id) DO UPDATE SET total_roles_created = total_roles_created + 1
    `).run(guildId);
    return { id, roleId, name, color, now };
  }
  getRoles(guildId) {
    if (!guildId) guildId = 'global';
    return db.prepare('SELECT * FROM custom_roles WHERE guild_id = ? ORDER BY position DESC, created_at DESC').all(guildId);
  }
  getRole(idOrName, guildId = null) {
    if (guildId) {
      return db.prepare('SELECT * FROM custom_roles WHERE guild_id = ? AND (id = ? OR role_id = ? OR name = ?)').get(guildId, idOrName, idOrName, idOrName);
    }
    return db.prepare('SELECT * FROM custom_roles WHERE id = ? OR role_id = ? OR name = ?').get(idOrName, idOrName, idOrName);
  }
  deleteRole(id, guildId) {
    db.prepare('DELETE FROM custom_roles WHERE id = ? AND guild_id = ?').run(id, guildId);
    db.prepare('DELETE FROM custom_role_assignments WHERE role_id = ? AND guild_id = ?').run(id, guildId);
  }
  assignRole(guildId, userId, roleId, durationMs = null) {
    const id = 'asg_' + crypto.randomUUID().slice(0, 8);
    const now = Date.now();
    const expiresAt = durationMs ? now + durationMs : null;
    db.prepare(`
      INSERT INTO custom_role_assignments (id, guild_id, user_id, role_id, assigned_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, roleId, now, expiresAt);
    db.prepare(`
      INSERT INTO custom_role_stats (guild_id, total_assigned) VALUES (?, 1)
      ON CONFLICT(guild_id) DO UPDATE SET total_assigned = total_assigned + 1
    `).run(guildId);
    return { id, assignedAt: now, expiresAt };
  }
  removeRole(guildId, userId, roleId) {
    db.prepare('DELETE FROM custom_role_assignments WHERE guild_id = ? AND user_id = ? AND role_id = ?').run(guildId, userId, roleId);
  }
  getUserRoles(guildId, userId) {
    return db.prepare(`
      SELECT cr.*, cra.assigned_at, cra.expires_at 
      FROM custom_role_assignments cra
      JOIN custom_roles cr ON cr.id = cra.role_id OR cr.role_id = cra.role_id
      WHERE cra.guild_id = ? AND cra.user_id = ?
    `).all(guildId, userId);
  }
  createGroup(guildId, name, isExclusive = 0, maxRoles = 1) {
    const id = 'grp_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO custom_role_groups (id, guild_id, name, is_exclusive, max_roles, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, name, isExclusive ? 1 : 0, maxRoles, Date.now());
    return id;
  }
  getGroups(guildId) {
    return db.prepare('SELECT * FROM custom_role_groups WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  createMenu(guildId, title, menuType = 'select', options = []) {
    const id = 'mnu_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO custom_role_menus (id, guild_id, channel_id, message_id, title, menu_type, options, created_at)
      VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)
    `).run(id, guildId, title, menuType, JSON.stringify(options), Date.now());
    return id;
  }
  getMenus(guildId) {
    return db.prepare('SELECT * FROM custom_role_menus WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
}
module.exports = new CustomRolesService();
