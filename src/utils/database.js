const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    levelup_channel_id TEXT DEFAULT NULL,
    levelup_message TEXT DEFAULT 'Congratulations {user} ! You've just switched to **niveau {level}** ! 🎉',
    levelup_embed INTEGER NOT NULL DEFAULT 1,
    xp_rate REAL NOT NULL DEFAULT 1.0
  );
  CREATE TABLE IF NOT EXISTS user_levels (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0,
    messages_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );
  CREATE INDEX IF NOT EXISTS idx_user_levels_ranking ON user_levels (guild_id, xp DESC);
  -- Tables pour la suite développeur
  CREATE TABLE IF NOT EXISTS dev_whitelist (
    user_id TEXT PRIMARY KEY,
    added_by TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS dev_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    command TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    guild_id TEXT,
    channel_id TEXT,
    duration_ms REAL,
    status TEXT NOT NULL,
    error_message TEXT,
    timestamp INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_dev_audit_time ON dev_audit_logs (timestamp DESC);
  CREATE TABLE IF NOT EXISTS dev_metrics (
    metric_key TEXT PRIMARY KEY,
    metric_value INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS dev_maintenance (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    enabled INTEGER NOT NULL DEFAULT 0,
    message TEXT DEFAULT 'The bot is currently undergoing technical maintenance. Please wait.',
    safe_mode INTEGER NOT NULL DEFAULT 0,
    start_time INTEGER
  );
  INSERT OR IGNORE INTO dev_maintenance (id, enabled, message, safe_mode, start_time)
  VALUES (1, 0, 'The bot is currently undergoing technical maintenance.', 0, NULL);
  -- Tables pour le système de Giveaways
  CREATE TABLE IF NOT EXISTS giveaways (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT DEFAULT NULL,
    host_id TEXT NOT NULL,
    prize TEXT NOT NULL,
    winner_count INTEGER NOT NULL DEFAULT 1,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    requirements TEXT DEFAULT '{}',
    bonus_entries TEXT DEFAULT '{}',
    theme TEXT DEFAULT '{}',
    extra_data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS giveaway_entries (
    giveaway_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    entries_count INTEGER NOT NULL DEFAULT 1,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (giveaway_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS giveaway_winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giveaway_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    won_at INTEGER NOT NULL,
    confirmed INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS giveaway_templates (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS giveaway_settings (
    guild_id TEXT PRIMARY KEY,
    manager_role_id TEXT DEFAULT NULL,
    default_channel_id TEXT DEFAULT NULL,
    ping_role_id TEXT DEFAULT NULL,
    color INTEGER DEFAULT NULL,
    emoji TEXT DEFAULT '🎉',
    embed_footer TEXT DEFAULT NULL
  );
  CREATE TABLE IF NOT EXISTS image_gallery (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    style TEXT DEFAULT 'standard',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS image_favorites (
    user_id TEXT NOT NULL,
    image_id TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, image_id)
  );
  CREATE TABLE IF NOT EXISTS image_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    allowed_channel_id TEXT DEFAULT NULL,
    nsfw_filter INTEGER NOT NULL DEFAULT 1,
    default_model TEXT DEFAULT 'stable-diffusion-xl',
    daily_limit INTEGER NOT NULL DEFAULT 50
  );
  CREATE TABLE IF NOT EXISTS leaderboard_seasons (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS leaderboard_rewards (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    rank_target INTEGER NOT NULL,
    role_id TEXT DEFAULT NULL,
    reward_text TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    category TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS leaderboard_settings (
    guild_id TEXT PRIMARY KEY,
    default_category TEXT DEFAULT 'xp',
    channel_id TEXT DEFAULT NULL,
    role_id TEXT DEFAULT NULL,
    live_enabled INTEGER NOT NULL DEFAULT 0,
    color INTEGER DEFAULT NULL,
    theme TEXT DEFAULT 'default'
  );
  CREATE TABLE IF NOT EXISTS leaderboard_points (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id, category)
  );
`);
const getSettingsStmt = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
const insertDefaultSettingsStmt = db.prepare(`
  INSERT OR IGNORE INTO guild_settings (guild_id, enabled, levelup_channel_id, levelup_message, levelup_embed, xp_rate)
  VALUES (?, 1, NULL, 'Congratulations {user} ! You've just switched to the **niveau {level}** ! 🎉', 1, 1.0)
`);
const updateSettingsStmt = db.prepare(`
  UPDATE guild_settings
  SET enabled = COALESCE(?, enabled),
      levelup_channel_id = ?,
      levelup_message = COALESCE(?, levelup_message),
      levelup_embed = COALESCE(?, levelup_embed),
      xp_rate = COALESCE(?, xp_rate)
  WHERE guild_id = ?
`);
const getUserLevelStmt = db.prepare('SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?');
const insertUserLevelStmt = db.prepare(`
  INSERT OR IGNORE INTO user_levels (guild_id, user_id, xp, level, messages_count)
  VALUES (?, ?, 0, 0, 0)
`);
const updateUserLevelStmt = db.prepare(`
  UPDATE user_levels
  SET xp = ?, level = ?, messages_count = messages_count + 1
  WHERE guild_id = ? AND user_id = ?
`);
const setXpStmt = db.prepare(`
  UPDATE user_levels
  SET xp = ?, level = ?
  WHERE guild_id = ? AND user_id = ?
`);
const getLeaderboardStmt = db.prepare(`
  SELECT user_id, xp, level, messages_count
  FROM user_levels
  WHERE guild_id = ?
  ORDER BY xp DESC
  LIMIT ?
`);
const getUserRankStmt = db.prepare(`
  SELECT COUNT(*) + 1 AS rank
  FROM user_levels
  WHERE guild_id = ? AND xp > ?
`);
const resetUserXpStmt = db.prepare('DELETE FROM user_levels WHERE guild_id = ? AND user_id = ?');
const resetGuildXpStmt = db.prepare('DELETE FROM user_levels WHERE guild_id = ?');
const getDevWhitelistStmt = db.prepare('SELECT * FROM dev_whitelist');
const insertDevWhitelistStmt = db.prepare('INSERT OR REPLACE INTO dev_whitelist (user_id, added_by, added_at, notes) VALUES (?, ?, ?, ?)');
const removeDevWhitelistStmt = db.prepare('DELETE FROM dev_whitelist WHERE user_id = ?');
const isDevInWhitelistStmt = db.prepare('SELECT 1 FROM dev_whitelist WHERE user_id = ?');
const insertAuditStmt = db.prepare(`
  INSERT INTO dev_audit_logs (user_id, command, action, details, guild_id, channel_id, duration_ms, status, error_message, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const getAuditLogsStmt = db.prepare('SELECT * FROM dev_audit_logs ORDER BY timestamp DESC LIMIT ?');
const clearAuditLogsStmt = db.prepare('DELETE FROM dev_audit_logs');
const countAuditLogsStmt = db.prepare('SELECT COUNT(*) as count FROM dev_audit_logs');
const getMaintenanceStmt = db.prepare('SELECT * FROM dev_maintenance WHERE id = 1');
const updateMaintenanceStmt = db.prepare(`
  UPDATE dev_maintenance
  SET enabled = COALESCE(?, enabled),
      message = COALESCE(?, message),
      safe_mode = COALESCE(?, safe_mode),
      start_time = ?
  WHERE id = 1
`);
const incrementMetricStmt = db.prepare(`
  INSERT INTO dev_metrics (metric_key, metric_value)
  VALUES (?, ?)
  ON CONFLICT(metric_key) DO UPDATE SET metric_value = metric_value + excluded.metric_value
`);
const getAllMetricsStmt = db.prepare('SELECT * FROM dev_metrics');
const dbManager = {
  db, 
  getGuildSettings(guildId) {
    insertDefaultSettingsStmt.run(guildId);
    return getSettingsStmt.get(guildId);
  },
  updateGuildSettings(guildId, { enabled, levelup_channel_id, levelup_message, levelup_embed, xp_rate }) {
    insertDefaultSettingsStmt.run(guildId);
    updateSettingsStmt.run(
      enabled !== undefined ? (enabled ? 1 : 0) : null,
      levelup_channel_id !== undefined ? levelup_channel_id : null,
      levelup_message !== undefined ? levelup_message : null,
      levelup_embed !== undefined ? (levelup_embed ? 1 : 0) : null,
      xp_rate !== undefined ? xp_rate : null,
      guildId
    );
    return this.getGuildSettings(guildId);
  },
  getUser(guildId, userId) {
    insertUserLevelStmt.run(guildId, userId);
    return getUserLevelStmt.get(guildId, userId);
  },
  updateUser(guildId, userId, xp, level) {
    insertUserLevelStmt.run(guildId, userId);
    updateUserLevelStmt.run(xp, level, guildId, userId);
    return this.getUser(guildId, userId);
  },
  setUserXpAndLevel(guildId, userId, xp, level) {
    insertUserLevelStmt.run(guildId, userId);
    setXpStmt.run(xp, level, guildId, userId);
    return this.getUser(guildId, userId);
  },
  getLeaderboard(guildId, limit = 10) {
    return getLeaderboardStmt.all(guildId, limit);
  },
  getUserRank(guildId, userId) {
    const user = this.getUser(guildId, userId);
    const result = getUserRankStmt.get(guildId, user.xp);
    return result ? result.rank : 1;
  },
  resetUser(guildId, userId) {
    resetUserXpStmt.run(guildId, userId);
  },
  resetGuild(guildId) {
    resetGuildXpStmt.run(guildId);
  },
  getDevWhitelist() {
    return getDevWhitelistStmt.all();
  },
  addDevWhitelist(userId, addedBy, notes = '') {
    insertDevWhitelistStmt.run(userId, addedBy, Date.now(), notes);
  },
  removeDevWhitelist(userId) {
    removeDevWhitelistStmt.run(userId);
  },
  isDevInWhitelist(userId) {
    return Boolean(isDevInWhitelistStmt.get(userId));
  },
  logDevAudit(entry) {
    insertAuditStmt.run(
      entry.userId,
      entry.command,
      entry.action,
      entry.details || null,
      entry.guildId || null,
      entry.channelId || null,
      entry.durationMs || 0,
      entry.status || 'OK',
      entry.errorMessage || null,
      entry.timestamp || Date.now()
    );
  },
  getDevAuditLogs(limit = 25) {
    return getAuditLogsStmt.all(limit);
  },
  clearDevAuditLogs() {
    clearAuditLogsStmt.run();
  },
  getDevAuditCount() {
    return countAuditLogsStmt.get().count;
  },
  getMaintenance() {
    return getMaintenanceStmt.get();
  },
  setMaintenance({ enabled, message, safe_mode }) {
    const current = this.getMaintenance();
    const newEnabled = enabled !== undefined ? (enabled ? 1 : 0) : current.enabled;
    const startTime = newEnabled && !current.enabled ? Date.now() : (newEnabled ? current.start_time : null);
    updateMaintenanceStmt.run(
      newEnabled,
      message !== undefined ? message : current.message,
      safe_mode !== undefined ? (safe_mode ? 1 : 0) : current.safe_mode,
      startTime
    );
    return this.getMaintenance();
  },
  incrementMetric(key, amount = 1) {
    incrementMetricStmt.run(key, amount);
  },
  getAllMetrics() {
    const rows = getAllMetricsStmt.all();
    const result = {};
    for (const row of rows) {
      result[row.metric_key] = row.metric_value;
    }
    return result;
  }
};
module.exports = dbManager;
