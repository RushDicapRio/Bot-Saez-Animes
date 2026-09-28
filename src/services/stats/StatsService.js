const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
db.exec(`
  CREATE TABLE IF NOT EXISTS stats_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    retention_days INTEGER NOT NULL DEFAULT 90,
    timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
    anonymize INTEGER NOT NULL DEFAULT 0,
    excluded_channels TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS stats_snapshots (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    label TEXT,
    data_json TEXT NOT NULL,
    created_by TEXT
  );
  CREATE TABLE IF NOT EXISTS stats_reports (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    schedule TEXT NOT NULL DEFAULT 'weekly',
    config_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS stats_events (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT,
    channel_id TEXT,
    metric TEXT,
    value REAL NOT NULL DEFAULT 1,
    meta_json TEXT,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS stats_archives (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_stats_events_guild_time ON stats_events(guild_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_stats_events_type ON stats_events(event_type);
`);
class StatsService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM stats_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      const defaultSettings = {
        guild_id: guildId,
        enabled: 1,
        retention_days: 90,
        timezone: 'Europe/Paris',
        anonymize: 0,
        excluded_channels: '[]',
        updated_at: now
      };
      db.prepare(`
        INSERT INTO stats_settings (guild_id, enabled, retention_days, timezone, anonymize, excluded_channels, updated_at)
        VALUES (@guild_id, @enabled, @retention_days, @timezone, @anonymize, @excluded_channels, @updated_at)
      `).run(defaultSettings);
      return defaultSettings;
    }
    return row;
  }
  static updateSettings(guildId, updates) {
    const current = this.getSettings(guildId);
    const updated = {
      ...current,
      ...updates,
      updated_at: Date.now()
    };
    db.prepare(`
      UPDATE stats_settings
      SET enabled = @enabled,
          retention_days = @retention_days,
          timezone = @timezone,
          anonymize = @anonymize,
          excluded_channels = @excluded_channels,
          updated_at = @updated_at
      WHERE guild_id = @guild_id
    `).run(updated);
    return updated;
  }
  static trackEvent(guildId, eventType, data = {}) {
    const settings = this.getSettings(guildId);
    if (!settings.enabled) return null;
    const id = crypto.randomUUID();
    const now = Date.now();
    const event = {
      id,
      guild_id: guildId,
      event_type: eventType,
      user_id: settings.anonymize ? 'anonymized' : (data.userId || null),
      channel_id: data.channelId || null,
      metric: data.metric || 'count',
      value: typeof data.value === 'number' ? data.value : 1,
      meta_json: data.meta ? JSON.stringify(data.meta) : null,
      timestamp: now
    };
    db.prepare(`
      INSERT INTO stats_events (id, guild_id, event_type, user_id, channel_id, metric, value, meta_json, timestamp)
      VALUES (@id, @guild_id, @event_type, @user_id, @channel_id, @metric, @value, @meta_json, @timestamp)
    `).run(event);
    return event;
  }
  static getOverview(guildId, guild = null) {
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM stats_events WHERE guild_id = ?').get(guildId)?.count || 0;
    const msgCount = db.prepare('SELECT COUNT(*) as count FROM stats_events WHERE guild_id = ? AND event_type = ?').get(guildId, 'message')?.count || 0;
    const cmdCount = db.prepare('SELECT COUNT(*) as count FROM stats_events WHERE guild_id = ? AND event_type = ?').get(guildId, 'command')?.count || 0;
    const voiceCount = db.prepare('SELECT COUNT(*) as count FROM stats_events WHERE guild_id = ? AND event_type = ?').get(guildId, 'voice')?.count || 0;
    const memberCount = guild ? guild.memberCount : 0;
    const channelCount = guild ? guild.channels.cache.size : 0;
    const roleCount = guild ? guild.roles.cache.size : 0;
    return {
      totalEvents,
      msgCount,
      cmdCount,
      voiceCount,
      memberCount,
      channelCount,
      roleCount
    };
  }
  static createSnapshot(guildId, label = 'Manual snapshot', createdBy = 'System', guild = null) {
    const id = crypto.randomUUID();
    const now = Date.now();
    const data = {
      timestamp: now,
      overview: this.getOverview(guildId, guild),
      members: guild ? {
        total: guild.memberCount,
        bots: guild.members.cache.filter(m => m.user.bot).size,
        humans: guild.members.cache.filter(m => !m.user.bot).size
      } : {},
      channels: guild ? {
        text: guild.channels.cache.filter(c => c.type === 0).size,
        voice: guild.channels.cache.filter(c => c.type === 2).size,
        categories: guild.channels.cache.filter(c => c.type === 4).size
      } : {}
    };
    db.prepare(`
      INSERT INTO stats_snapshots (id, guild_id, timestamp, label, data_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, now, label, JSON.stringify(data), createdBy);
    return { id, timestamp: now, label, data };
  }
  static getSnapshots(guildId, limit = 10) {
    return db.prepare('SELECT * FROM stats_snapshots WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  static getSnapshot(id) {
    return db.prepare('SELECT * FROM stats_snapshots WHERE id = ?').get(id);
  }
  static createReport(guildId, name, schedule = 'weekly', config = {}) {
    const id = crypto.randomUUID();
    const now = Date.now();
    db.prepare(`
      INSERT INTO stats_reports (id, guild_id, name, schedule, config_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, name, schedule, JSON.stringify(config), now);
    return { id, guildId, name, schedule, config, created_at: now };
  }
  static getReports(guildId) {
    return db.prepare('SELECT * FROM stats_reports WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static deleteReport(id) {
    return db.prepare('DELETE FROM stats_reports WHERE id = ?').run(id).changes > 0;
  }
  static getTopUsers(guildId, limit = 10) {
    return db.prepare(`
      SELECT user_id, COUNT(*) as count
      FROM stats_events
      WHERE guild_id = ? AND user_id IS NOT NULL AND user_id != 'anonymized'
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT ?
    `).all(guildId, limit);
  }
  static getTopChannels(guildId, limit = 10) {
    return db.prepare(`
      SELECT channel_id, COUNT(*) as count
      FROM stats_events
      WHERE guild_id = ? AND channel_id IS NOT NULL
      GROUP BY channel_id
      ORDER BY count DESC
      LIMIT ?
    `).all(guildId, limit);
  }
  static getAggregatesByPeriod(guildId, periodHours = 24) {
    const since = Date.now() - (periodHours * 60 * 60 * 1000);
    return db.prepare(`
      SELECT event_type, COUNT(*) as count
      FROM stats_events
      WHERE guild_id = ? AND timestamp >= ?
      GROUP BY event_type
    `).all(guildId, since);
  }
  static cleanupOldData(guildId, days = 90) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const result = db.prepare('DELETE FROM stats_events WHERE guild_id = ? AND timestamp < ?').run(guildId, cutoff);
    return result.changes;
  }
  static resetGuildStats(guildId) {
    db.prepare('DELETE FROM stats_events WHERE guild_id = ?').run(guildId);
    db.prepare('DELETE FROM stats_snapshots WHERE guild_id = ?').run(guildId);
    db.prepare('DELETE FROM stats_reports WHERE guild_id = ?').run(guildId);
    db.prepare('DELETE FROM stats_archives WHERE guild_id = ?').run(guildId);
    return true;
  }
}
module.exports = StatsService;
