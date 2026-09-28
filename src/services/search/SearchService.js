const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS search_settings (
    guild_id TEXT PRIMARY KEY,
    safe_search INTEGER NOT NULL DEFAULT 1,
    default_engine TEXT NOT NULL DEFAULT 'google',
    cache_enabled INTEGER NOT NULL DEFAULT 1,
    results_per_page INTEGER NOT NULL DEFAULT 5,
    language TEXT NOT NULL DEFAULT 'fr',
    region TEXT NOT NULL DEFAULT 'FR',
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS search_saved_queries (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    query TEXT NOT NULL,
    filters_json TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    query TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    results_count INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS search_cache (
    query_hash TEXT PRIMARY KEY,
    response_json TEXT NOT NULL,
    cached_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);
class SearchService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM search_settings WHERE guild_id = ?').get(guildId);
    if (row) return row;
    db.prepare(`
      INSERT OR IGNORE INTO search_settings (guild_id) VALUES (?)
    `).run(guildId);
    return db.prepare('SELECT * FROM search_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE search_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static logSearch(guildId, userId, query, category = 'general', resultsCount = 0) {
    db.prepare(`
      INSERT INTO search_history (guild_id, user_id, query, category, results_count, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(guildId, userId, query, category, resultsCount, Date.now());
  }
  static getHistory(guildId, userId, limit = 10) {
    if (userId) {
      return db.prepare('SELECT * FROM search_history WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, userId, limit);
    }
    return db.prepare('SELECT * FROM search_history WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  static clearHistory(guildId, userId = null) {
    if (userId) {
      db.prepare('DELETE FROM search_history WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
    } else {
      db.prepare('DELETE FROM search_history WHERE guild_id = ?').run(guildId);
    }
  }
  static saveQuery(guildId, userId, name, query, filters = {}) {
    const id = `sq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO search_saved_queries (id, guild_id, user_id, name, query, filters_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, name, query, JSON.stringify(filters), Date.now());
    return id;
  }
  static getSavedQueries(guildId, userId) {
    return db.prepare('SELECT * FROM search_saved_queries WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
  }
  static deleteSavedQuery(guildId, queryId) {
    db.prepare('DELETE FROM search_saved_queries WHERE guild_id = ? AND id = ?').run(guildId, queryId);
  }
  static searchUsers(guild, term) {
    if (!guild || !term) return [];
    const q = term.toLowerCase();
    return guild.members.cache
      .filter(m => m.user.username.toLowerCase().includes(q) || (m.nickname && m.nickname.toLowerCase().includes(q)) || m.id === q)
      .first(10)
      .map(m => ({
        id: m.id,
        tag: m.user.tag,
        nickname: m.nickname || m.user.username,
        rolesCount: m.roles.cache.size - 1,
        joinedAt: m.joinedAt
      }));
  }
  static searchChannels(guild, term) {
    if (!guild || !term) return [];
    const q = term.toLowerCase();
    return guild.channels.cache
      .filter(c => c.name.toLowerCase().includes(q) || c.id === q)
      .first(10)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parent: c.parent ? c.parent.name : 'None'
      }));
  }
  static searchRoles(guild, term) {
    if (!guild || !term) return [];
    const q = term.toLowerCase();
    return guild.roles.cache
      .filter(r => r.name.toLowerCase().includes(q) || r.id === q)
      .first(10)
      .map(r => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        membersCount: r.members.size,
        mentionable: r.mentionable
      }));
  }
  static searchEmojis(guild, term) {
    if (!guild || !term) return [];
    const q = term.toLowerCase();
    return guild.emojis.cache
      .filter(e => e.name.toLowerCase().includes(q) || e.id === q)
      .first(10)
      .map(e => ({
        id: e.id,
        name: e.name,
        animated: e.animated,
        identifier: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`
      }));
  }
}
module.exports = SearchService;
