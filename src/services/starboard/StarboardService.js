const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
db.exec(`
  CREATE TABLE IF NOT EXISTS starboard_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    channel_id TEXT DEFAULT NULL,
    emoji TEXT NOT NULL DEFAULT '⭐',
    threshold INTEGER NOT NULL DEFAULT 3,
    self_star INTEGER NOT NULL DEFAULT 0,
    min_age_seconds INTEGER NOT NULL DEFAULT 0,
    media_only INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#FFAC33',
    notify_author INTEGER NOT NULL DEFAULT 1,
    log_channel_id TEXT DEFAULT NULL,
    is_logs_enabled INTEGER NOT NULL DEFAULT 0,
    cooldown_seconds INTEGER NOT NULL DEFAULT 0,
    anti_spam_enabled INTEGER NOT NULL DEFAULT 1,
    vote_limit INTEGER NOT NULL DEFAULT 0,
    pin_threshold INTEGER NOT NULL DEFAULT 10,
    auto_pin INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS starboard_posts (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    original_message_id TEXT NOT NULL,
    original_channel_id TEXT NOT NULL,
    starboard_message_id TEXT DEFAULT NULL,
    author_id TEXT NOT NULL,
    stars_count INTEGER NOT NULL DEFAULT 1,
    content TEXT DEFAULT '',
    attachments_json TEXT NOT NULL DEFAULT '[]',
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_hidden INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS starboard_reactions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    added_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS starboard_exclusions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    target_type TEXT NOT NULL, -- channel, category, role, user, bot, thread, word
    target_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS starboard_badges (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    reward_role_id TEXT DEFAULT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS starboard_contests (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, ended, cancelled
    winner_id TEXT DEFAULT NULL,
    start_at INTEGER NOT NULL,
    end_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS starboard_hall_of_fame (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    added_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sb_posts_guild ON starboard_posts(guild_id);
  CREATE INDEX IF NOT EXISTS idx_sb_posts_orig ON starboard_posts(original_message_id);
  CREATE INDEX IF NOT EXISTS idx_sb_react_msg ON starboard_reactions(message_id);
  CREATE INDEX IF NOT EXISTS idx_sb_excl_guild ON starboard_exclusions(guild_id);
`);
class StarboardService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM starboard_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      const defaultSettings = {
        guild_id: guildId,
        enabled: 1,
        channel_id: null,
        emoji: '⭐',
        threshold: 3,
        self_star: 0,
        min_age_seconds: 0,
        media_only: 0,
        color: '#FFAC33',
        notify_author: 1,
        log_channel_id: null,
        is_logs_enabled: 0,
        cooldown_seconds: 0,
        anti_spam_enabled: 1,
        vote_limit: 0,
        pin_threshold: 10,
        auto_pin: 0,
        updated_at: now
      };
      db.prepare(`
        INSERT INTO starboard_settings (
          guild_id, enabled, channel_id, emoji, threshold, self_star, min_age_seconds, media_only,
          color, notify_author, log_channel_id, is_logs_enabled, cooldown_seconds, anti_spam_enabled,
          vote_limit, pin_threshold, auto_pin, updated_at
        ) VALUES (
          @guild_id, @enabled, @channel_id, @emoji, @threshold, @self_star, @min_age_seconds, @media_only,
          @color, @notify_author, @log_channel_id, @is_logs_enabled, @cooldown_seconds, @anti_spam_enabled,
          @vote_limit, @pin_threshold, @auto_pin, @updated_at
        )
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
      UPDATE starboard_settings
      SET enabled = @enabled,
          channel_id = @channel_id,
          emoji = @emoji,
          threshold = @threshold,
          self_star = @self_star,
          min_age_seconds = @min_age_seconds,
          media_only = @media_only,
          color = @color,
          notify_author = @notify_author,
          log_channel_id = @log_channel_id,
          is_logs_enabled = @is_logs_enabled,
          cooldown_seconds = @cooldown_seconds,
          anti_spam_enabled = @anti_spam_enabled,
          vote_limit = @vote_limit,
          pin_threshold = @pin_threshold,
          auto_pin = @auto_pin,
          updated_at = @updated_at
      WHERE guild_id = @guild_id
    `).run(updated);
    return updated;
  }
  static getPostByOriginalId(guildId, messageId) {
    return db.prepare('SELECT * FROM starboard_posts WHERE guild_id = ? AND original_message_id = ?').get(guildId, messageId);
  }
  static getPostById(postId) {
    return db.prepare('SELECT * FROM starboard_posts WHERE id = ?').get(postId);
  }
  static createPost(guildId, data) {
    const id = crypto.randomUUID();
    const now = Date.now();
    const post = {
      id,
      guild_id: guildId,
      original_message_id: data.original_message_id,
      original_channel_id: data.original_channel_id,
      starboard_message_id: data.starboard_message_id || null,
      author_id: data.author_id,
      stars_count: data.stars_count || 1,
      content: data.content || '',
      attachments_json: JSON.stringify(data.attachments || []),
      is_pinned: data.is_pinned ? 1 : 0,
      is_hidden: 0,
      created_at: now,
      updated_at: now
    };
    db.prepare(`
      INSERT INTO starboard_posts (
        id, guild_id, original_message_id, original_channel_id, starboard_message_id,
        author_id, stars_count, content, attachments_json, is_pinned, is_hidden, created_at, updated_at
      ) VALUES (
        @id, @guild_id, @original_message_id, @original_channel_id, @starboard_message_id,
        @author_id, @stars_count, @content, @attachments_json, @is_pinned, @is_hidden, @created_at, @updated_at
      )
    `).run(post);
    return post;
  }
  static updatePostStars(id, starsCount, starboardMessageId = null) {
    const now = Date.now();
    if (starboardMessageId) {
      db.prepare(`
        UPDATE starboard_posts
        SET stars_count = ?, starboard_message_id = ?, updated_at = ?
        WHERE id = ?
      `).run(starsCount, starboardMessageId, now, id);
    } else {
      db.prepare(`
        UPDATE starboard_posts
        SET stars_count = ?, updated_at = ?
        WHERE id = ?
      `).run(starsCount, now, id);
    }
    return this.getPostById(id);
  }
  static deletePost(guildId, messageIdOrPostId) {
    const res = db.prepare('DELETE FROM starboard_posts WHERE guild_id = ? AND (id = ? OR original_message_id = ? OR starboard_message_id = ?)').run(guildId, messageIdOrPostId, messageIdOrPostId, messageIdOrPostId);
    return res.changes > 0;
  }
  static getTopPosts(guildId, limit = 10) {
    return db.prepare('SELECT * FROM starboard_posts WHERE guild_id = ? AND is_hidden = 0 ORDER BY stars_count DESC, created_at DESC LIMIT ?').all(guildId, limit);
  }
  static getRecentPosts(guildId, limit = 10) {
    return db.prepare('SELECT * FROM starboard_posts WHERE guild_id = ? AND is_hidden = 0 ORDER BY created_at DESC LIMIT ?').all(guildId, limit);
  }
  static addReaction(guildId, messageId, userId, emoji = '⭐') {
    const existing = db.prepare('SELECT * FROM starboard_reactions WHERE guild_id = ? AND message_id = ? AND user_id = ? AND emoji = ?').get(guildId, messageId, userId, emoji);
    if (existing) return existing;
    const id = crypto.randomUUID();
    const entry = {
      id,
      guild_id: guildId,
      message_id: messageId,
      user_id: userId,
      emoji,
      added_at: Date.now()
    };
    db.prepare(`
      INSERT INTO starboard_reactions (id, guild_id, message_id, user_id, emoji, added_at)
      VALUES (@id, @guild_id, @message_id, @user_id, @emoji, @added_at)
    `).run(entry);
    return entry;
  }
  static removeReaction(guildId, messageId, userId, emoji = '⭐') {
    const res = db.prepare('DELETE FROM starboard_reactions WHERE guild_id = ? AND message_id = ? AND user_id = ? AND emoji = ?').run(guildId, messageId, userId, emoji);
    return res.changes > 0;
  }
  static getReactionsCount(messageId, emoji = '⭐') {
    const row = db.prepare('SELECT COUNT(*) as count FROM starboard_reactions WHERE message_id = ? AND emoji = ?').get(messageId, emoji);
    return row?.count || 0;
  }
  static getReactionsUsers(messageId, emoji = '⭐') {
    return db.prepare('SELECT user_id FROM starboard_reactions WHERE message_id = ? AND emoji = ?').all(messageId, emoji);
  }
  static isExcluded(guildId, type, id) {
    const row = db.prepare('SELECT * FROM starboard_exclusions WHERE guild_id = ? AND target_type = ? AND target_id = ?').get(guildId, type, String(id));
    return !!row;
  }
  static addExclusion(guildId, type, id) {
    if (this.isExcluded(guildId, type, id)) return false;
    const entryId = crypto.randomUUID();
    db.prepare('INSERT INTO starboard_exclusions (id, guild_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?)').run(entryId, guildId, type, String(id), Date.now());
    return true;
  }
  static removeExclusion(guildId, type, id) {
    const res = db.prepare('DELETE FROM starboard_exclusions WHERE guild_id = ? AND target_type = ? AND target_id = ?').run(guildId, type, String(id));
    return res.changes > 0;
  }
  static getExclusions(guildId) {
    return db.prepare('SELECT * FROM starboard_exclusions WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static getUserStats(guildId, userId) {
    const totalPosts = db.prepare('SELECT COUNT(*) as count FROM starboard_posts WHERE guild_id = ? AND author_id = ?').get(guildId, userId)?.count || 0;
    const totalStarsReceived = db.prepare('SELECT SUM(stars_count) as total FROM starboard_posts WHERE guild_id = ? AND author_id = ?').get(guildId, userId)?.total || 0;
    const totalStarsGiven = db.prepare('SELECT COUNT(*) as count FROM starboard_reactions WHERE guild_id = ? AND user_id = ?').get(guildId, userId)?.count || 0;
    return {
      totalPosts,
      totalStarsReceived,
      totalStarsGiven
    };
  }
  static getLeaderboard(guildId, type = 'stars', limit = 10) {
    if (type === 'posts') {
      return db.prepare(`
        SELECT author_id as user_id, COUNT(*) as value
        FROM starboard_posts
        WHERE guild_id = ? AND is_hidden = 0
        GROUP BY author_id
        ORDER BY value DESC
        LIMIT ?
      `).all(guildId, limit);
    } else if (type === 'given') {
      return db.prepare(`
        SELECT user_id, COUNT(*) as value
        FROM starboard_reactions
        WHERE guild_id = ?
        GROUP BY user_id
        ORDER BY value DESC
        LIMIT ?
      `).all(guildId, limit);
    } else {
      return db.prepare(`
        SELECT author_id as user_id, SUM(stars_count) as value
        FROM starboard_posts
        WHERE guild_id = ? AND is_hidden = 0
        GROUP BY author_id
        ORDER BY value DESC
        LIMIT ?
      `).all(guildId, limit);
    }
  }
  static getGuildStats(guildId) {
    const postsCount = db.prepare('SELECT COUNT(*) as count FROM starboard_posts WHERE guild_id = ?').get(guildId)?.count || 0;
    const totalStars = db.prepare('SELECT SUM(stars_count) as total FROM starboard_posts WHERE guild_id = ?').get(guildId)?.total || 0;
    const highestPost = db.prepare('SELECT * FROM starboard_posts WHERE guild_id = ? ORDER BY stars_count DESC LIMIT 1').get(guildId);
    const avgStars = postsCount > 0 ? (totalStars / postsCount).toFixed(1) : 0;
    return {
      postsCount,
      totalStars,
      avgStars,
      highestStars: highestPost?.stars_count || 0
    };
  }
  static resetGuild(guildId) {
    db.prepare('DELETE FROM starboard_posts WHERE guild_id = ?').run(guildId);
    db.prepare('DELETE FROM starboard_reactions WHERE guild_id = ?').run(guildId);
    db.prepare('DELETE FROM starboard_exclusions WHERE guild_id = ?').run(guildId);
    return true;
  }
}
module.exports = StarboardService;
