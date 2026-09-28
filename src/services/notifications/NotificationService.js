const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS notification_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    default_channel_id TEXT,
    default_role_id TEXT,
    dm_enabled INTEGER NOT NULL DEFAULT 0,
    quiet_start TEXT NOT NULL DEFAULT '22:00',
    quiet_end TEXT NOT NULL DEFAULT '08:00',
    cooldown_seconds INTEGER NOT NULL DEFAULT 10,
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'EVENT',
    channel_id TEXT,
    role_id TEXT,
    message TEXT,
    embed_enabled INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    scheduled_at INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notification_subscriptions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    channel_id TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notification_history (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    channel_id TEXT,
    recipient_id TEXT,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'DELIVERED',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notification_events (
    guild_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    channel_id TEXT,
    message_template TEXT,
    PRIMARY KEY (guild_id, event_name)
  );
  CREATE TABLE IF NOT EXISTS notification_templates (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#3498db',
    created_at INTEGER NOT NULL
  );
`);
class NotificationService {
  static getSettings(guildId) {
    let row = db.prepare('SELECT * FROM notification_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      db.prepare('INSERT OR IGNORE INTO notification_settings (guild_id) VALUES (?)').run(guildId);
      row = db.prepare('SELECT * FROM notification_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE notification_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static createNotification(guildId, name, type = 'EVENT', channelId = null, roleId = null, message = '') {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO notifications (id, guild_id, name, type, channel_id, role_id, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, name, type, channelId, roleId, message, now);
    return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  }
  static getNotifications(guildId, status = null) {
    if (status) {
      return db.prepare('SELECT * FROM notifications WHERE guild_id = ? AND status = ? ORDER BY created_at DESC').all(guildId, status);
    }
    return db.prepare('SELECT * FROM notifications WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static getNotification(idOrName) {
    return db.prepare('SELECT * FROM notifications WHERE id = ? OR name = ?').get(idOrName, idOrName);
  }
  static deleteNotification(guildId, idOrName) {
    const res = db.prepare('DELETE FROM notifications WHERE guild_id = ? AND (id = ? OR name = ?)').run(guildId, idOrName, idOrName);
    return res.changes > 0;
  }
  static subscribe(guildId, userId, notificationType, channelId = null) {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO notification_subscriptions (id, guild_id, user_id, notification_type, channel_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, notificationType, channelId, Date.now());
    return { id, user_id: userId, notification_type: notificationType };
  }
  static unsubscribe(guildId, userId, notificationType) {
    const res = db.prepare('DELETE FROM notification_subscriptions WHERE guild_id = ? AND user_id = ? AND (notification_type = ? OR notification_type = \'all\')').run(guildId, userId, notificationType);
    return res.changes > 0;
  }
  static getSubscriptions(guildId, userId) {
    return db.prepare('SELECT * FROM notification_subscriptions WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
  }
  static setEventConfig(guildId, eventName, enabled = 1, channelId = null, template = null) {
    db.prepare(`
      INSERT OR REPLACE INTO notification_events (guild_id, event_name, enabled, channel_id, message_template)
      VALUES (?, ?, ?, ?, ?)
    `).run(guildId, eventName, enabled ? 1 : 0, channelId, template);
    return db.prepare('SELECT * FROM notification_events WHERE guild_id = ? AND event_name = ?').get(guildId, eventName);
  }
  static getEvents(guildId) {
    return db.prepare('SELECT * FROM notification_events WHERE guild_id = ?').all(guildId);
  }
  static logDelivery(guildId, type, channelId, recipientId, content, status = 'DELIVERED') {
    const id = `nhist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO notification_history (id, guild_id, type, channel_id, recipient_id, content, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, type, channelId, recipientId, (content || '').slice(0, 300), status, Date.now());
  }
  static getHistory(guildId, limit = 10) {
    return db.prepare('SELECT * FROM notification_history WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?').all(guildId, limit);
  }
  static getStats(guildId) {
    const totalNotifs = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE guild_id = ?').get(guildId).count;
    const activeNotifs = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE guild_id = ? AND status = \'ACTIVE\'').get(guildId).count;
    const totalSubs = db.prepare('SELECT COUNT(*) as count FROM notification_subscriptions WHERE guild_id = ?').get(guildId).count;
    const deliveredCount = db.prepare('SELECT COUNT(*) as count FROM notification_history WHERE guild_id = ?').get(guildId).count;
    return { totalNotifs, activeNotifs, totalSubs, deliveredCount };
  }
}
module.exports = NotificationService;
