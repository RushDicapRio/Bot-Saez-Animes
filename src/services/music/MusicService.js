const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS music_settings (
    guild_id TEXT PRIMARY KEY,
    default_volume INTEGER NOT NULL DEFAULT 100,
    loop_mode TEXT NOT NULL DEFAULT 'off',
    autoplay INTEGER NOT NULL DEFAULT 0,
    dj_role_id TEXT DEFAULT NULL,
    default_voice_channel TEXT DEFAULT NULL,
    default_text_channel TEXT DEFAULT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    maintenance INTEGER NOT NULL DEFAULT 0,
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS music_playlists (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    tracks_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS music_favorites (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    url TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 180,
    added_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS music_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    url TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 180,
    played_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS music_queues_saved (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    queue_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
`);
class GuildMusicQueue {
  constructor(guildId) {
    this.guildId = guildId;
    this.current = null;
    this.queue = [];
    this.history = [];
    this.volume = 100;
    this.loop = 'off'; 
    this.paused = false;
    this.filters = new Set();
    this.autoplay = false;
    this.voiceChannelId = null;
    this.textChannelId = null;
    this.votes = {
      skip: new Set(),
      stop: new Set()
    };
    this.startedAt = Date.now();
    this.pausedAt = null;
    this.elapsedBeforePause = 0;
  }
  getCurrentProgress() {
    if (!this.current) return { currentSec: 0, totalSec: 0, percentage: 0 };
    const now = Date.now();
    let elapsedMs = this.elapsedBeforePause;
    if (!this.paused && this.startedAt) {
      elapsedMs += (now - this.startedAt);
    }
    const currentSec = Math.min(this.current.duration, Math.floor(elapsedMs / 1000));
    const totalSec = this.current.duration || 180;
    const percentage = Math.min(100, Math.floor((currentSec / totalSec) * 100));
    return { currentSec, totalSec, percentage };
  }
}
const activeQueues = new Map();
class MusicService {
  static getQueue(guildId) {
    if (!activeQueues.has(guildId)) {
      activeQueues.set(guildId, new GuildMusicQueue(guildId));
    }
    return activeQueues.get(guildId);
  }
  static formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  static createProgressBar(currentSec, totalSec, size = 14) {
    if (totalSec <= 0) totalSec = 180;
    const progress = Math.min(size, Math.max(0, Math.round((currentSec / totalSec) * size)));
    const empty = Math.max(0, size - progress);
    const filledBar = '━'.repeat(progress);
    const emptyBar = '─'.repeat(empty);
    return `\`${this.formatTime(currentSec)}\` [${filledBar}🔘${emptyBar}] \`${this.formatTime(totalSec)}\``;
  }
  static play(guildId, trackData, user) {
    const q = this.getQueue(guildId);
    const track = {
      id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: trackData.title || 'Musical Track',
      artist: trackData.artist || 'Unknown Artist',
      url: trackData.url || 'https://youtube.com',
      duration: trackData.duration || 214,
      thumbnail: trackData.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      requestedBy: user ? user.tag : 'Unknown',
      requestedById: user ? user.id : null
    };
    if (!q.current) {
      q.current = track;
      q.startedAt = Date.now();
      q.paused = false;
      q.elapsedBeforePause = 0;
      this.logHistory(guildId, user ? user.id : '0', track);
      return { status: 'playing', track };
    } else {
      q.queue.push(track);
      return { status: 'queued', track, position: q.queue.length };
    }
  }
  static skip(guildId) {
    const q = this.getQueue(guildId);
    if (!q.current) return null;
    const prev = q.current;
    q.history.unshift(prev);
    if (q.loop === 'track') {
      q.startedAt = Date.now();
      q.elapsedBeforePause = 0;
      return q.current;
    }
    if (q.queue.length > 0) {
      q.current = q.queue.shift();
      q.startedAt = Date.now();
      q.elapsedBeforePause = 0;
      q.paused = false;
      if (q.loop === 'queue') {
        q.queue.push(prev);
      }
    } else {
      if (q.loop === 'queue' && q.history.length > 0) {
        q.queue = [...q.history].reverse();
        q.history = [];
        q.current = q.queue.shift();
        q.startedAt = Date.now();
        q.elapsedBeforePause = 0;
      } else {
        q.current = null;
      }
    }
    q.votes.skip.clear();
    return q.current;
  }
  static pause(guildId) {
    const q = this.getQueue(guildId);
    if (!q.current || q.paused) return false;
    q.paused = true;
    q.elapsedBeforePause += (Date.now() - q.startedAt);
    return true;
  }
  static resume(guildId) {
    const q = this.getQueue(guildId);
    if (!q.current || !q.paused) return false;
    q.paused = false;
    q.startedAt = Date.now();
    return true;
  }
  static stop(guildId) {
    const q = this.getQueue(guildId);
    q.current = null;
    q.queue = [];
    q.paused = false;
    q.elapsedBeforePause = 0;
    q.votes.skip.clear();
    return true;
  }
  static setVolume(guildId, vol) {
    const q = this.getQueue(guildId);
    q.volume = Math.max(0, Math.min(200, vol));
    return q.volume;
  }
  static setLoop(guildId, mode) {
    const q = this.getQueue(guildId);
    q.loop = ['off', 'track', 'queue'].includes(mode) ? mode : 'off';
    return q.loop;
  }
  static toggleFilter(guildId, filterName) {
    const q = this.getQueue(guildId);
    if (q.filters.has(filterName)) {
      q.filters.delete(filterName);
      return false;
    } else {
      q.filters.add(filterName);
      return true;
    }
  }
  static shuffleQueue(guildId) {
    const q = this.getQueue(guildId);
    for (let i = q.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [q.queue[i], q.queue[j]] = [q.queue[j], q.queue[i]];
    }
    return q.queue;
  }
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM music_settings WHERE guild_id = ?').get(guildId);
    if (row) return row;
    db.prepare('INSERT OR IGNORE INTO music_settings (guild_id) VALUES (?)').run(guildId);
    return db.prepare('SELECT * FROM music_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE music_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static logHistory(guildId, userId, track) {
    db.prepare(`
      INSERT INTO music_history (guild_id, user_id, title, artist, url, duration, played_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(guildId, userId, track.title, track.artist, track.url, track.duration, Date.now());
  }
  static getHistory(guildId, limit = 10) {
    return db.prepare('SELECT * FROM music_history WHERE guild_id = ? ORDER BY played_at DESC LIMIT ?').all(guildId, limit);
  }
  static addFavorite(guildId, userId, track) {
    const id = `fav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO music_favorites (id, guild_id, user_id, title, artist, url, duration, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, track.title, track.artist, track.url, track.duration, Date.now());
    return id;
  }
  static getFavorites(guildId, userId) {
    return db.prepare('SELECT * FROM music_favorites WHERE guild_id = ? AND user_id = ? ORDER BY added_at DESC').all(guildId, userId);
  }
  static createPlaylist(guildId, userId, name, tracks = []) {
    const id = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO music_playlists (id, guild_id, user_id, name, is_public, tracks_json, created_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(id, guildId, userId, name, JSON.stringify(tracks), Date.now());
    return id;
  }
  static getPlaylists(guildId, userId) {
    return db.prepare('SELECT * FROM music_playlists WHERE guild_id = ? AND (user_id = ? OR is_public = 1) ORDER BY created_at DESC').all(guildId, userId);
  }
}
module.exports = MusicService;
