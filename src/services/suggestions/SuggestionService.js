const { db } = require('../../utils/database');
class SuggestionService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        channel_id TEXT,
        log_channel_id TEXT,
        role_staff_id TEXT,
        anonymous_enabled INTEGER DEFAULT 0,
        thread_enabled INTEGER DEFAULT 1,
        cooldown_seconds INTEGER DEFAULT 30,
        upvote_emoji TEXT DEFAULT '👍',
        downvote_emoji TEXT DEFAULT '👎',
        min_upvotes_for_trending INTEGER DEFAULT 5,
        default_category TEXT DEFAULT 'Général',
        embed_color TEXT DEFAULT '#5865F2',
        voting_enabled INTEGER DEFAULT 1,
        debug_mode INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestions (
        id TEXT PRIMARY KEY,
        num INTEGER,
        guild_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        is_anonymous INTEGER DEFAULT 0,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT DEFAULT 'Général',
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        tags TEXT,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        staff_note TEXT,
        assigned_reviewer_id TEXT,
        message_id TEXT,
        channel_id TEXT,
        thread_id TEXT,
        roadmap_status TEXT,
        milestone TEXT,
        version TEXT,
        is_archived INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_votes (
        id TEXT PRIMARY KEY,
        suggestion_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        vote_type INTEGER NOT NULL,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_comments (
        id TEXT PRIMARY KEY,
        suggestion_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        content TEXT NOT NULL,
        is_staff INTEGER DEFAULT 0,
        is_pinned INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_categories (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#5865F2',
        sort_order INTEGER DEFAULT 0
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_boards (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        columns_json TEXT,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_panels (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT,
        message_id TEXT,
        title TEXT,
        description TEXT,
        color TEXT DEFAULT '#5865F2'
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_templates (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        template_text TEXT NOT NULL,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_roadmap (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        suggestion_id TEXT NOT NULL,
        stage TEXT DEFAULT 'planned',
        sort_order INTEGER DEFAULT 0
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_changelog (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        suggestion_id TEXT,
        version TEXT,
        description TEXT NOT NULL,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        suggestion_id TEXT,
        user_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp INTEGER NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_revisions (
        id TEXT PRIMARY KEY,
        suggestion_id TEXT NOT NULL,
        title TEXT,
        description TEXT,
        author_id TEXT,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_links (
        id TEXT PRIMARY KEY,
        suggestion_a TEXT NOT NULL,
        suggestion_b TEXT NOT NULL,
        relation_type TEXT DEFAULT 'related'
      );
    `);
  }
  getSettings(guildId) {
    let settings = db.prepare('SELECT * FROM suggestion_settings WHERE guild_id = ?').get(guildId);
    if (!settings) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO suggestion_settings (
          guild_id, enabled, anonymous_enabled, thread_enabled, cooldown_seconds,
          upvote_emoji, downvote_emoji, min_upvotes_for_trending, default_category,
          embed_color, voting_enabled, debug_mode, created_at, updated_at
        ) VALUES (?, 1, 0, 1, 30, '👍', '👎', 5, 'General', '#5865F2', 1, 0, ?, ?)
      `).run(guildId, now, now);
      settings = db.prepare('SELECT * FROM suggestion_settings WHERE guild_id = ?').get(guildId);
    }
    return settings;
  }
  updateSettings(guildId, updates = {}) {
    const current = this.getSettings(guildId);
    const keys = Object.keys(updates);
    if (keys.length === 0) return current;
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), guildId);
    db.prepare(`UPDATE suggestion_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  resetSettings(guildId) {
    db.prepare('DELETE FROM suggestion_settings WHERE guild_id = ?').run(guildId);
    return this.getSettings(guildId);
  }
  generateId(prefix = 'sug') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }
  getNextNum(guildId) {
    const row = db.prepare('SELECT MAX(num) as max_num FROM suggestions WHERE guild_id = ?').get(guildId);
    return (row && row.max_num) ? row.max_num + 1 : 1;
  }
  createSuggestion(guildId, authorId, data = {}) {
    const id = this.generateId('sug');
    const num = this.getNextNum(guildId);
    const now = Date.now();
    db.prepare(`
      INSERT INTO suggestions (
        id, num, guild_id, author_id, is_anonymous, title, description,
        category, status, priority, tags, upvotes, downvotes, staff_note,
        assigned_reviewer_id, message_id, channel_id, thread_id, roadmap_status,
        milestone, version, is_archived, is_deleted, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 0, 0, '', null, null, null, null, null, null, null, 0, 0, ?, ?)
    `).run(
      id,
      num,
      guildId,
      authorId,
      data.is_anonymous ? 1 : 0,
      data.title || `Suggestion #${num}`,
      data.description || 'Aucune description fournie.',
      data.category || 'Général',
      data.priority || 'normal',
      data.tags || '',
      now,
      now
    );
    this.logHistory(guildId, id, authorId, 'create', `Creation of the suggestion #${num}: "${data.title || ''}"`);
    return this.getSuggestion(guildId, id);
  }
  getSuggestion(guildId, idOrNum) {
    if (!idOrNum) return null;
    const clean = idOrNum.toString().trim().toLowerCase();
    const asNum = parseInt(clean.replace('#', ''), 10);
    if (!isNaN(asNum)) {
      const byNum = db.prepare('SELECT * FROM suggestions WHERE guild_id = ? AND num = ?').get(guildId, asNum);
      if (byNum) return byNum;
    }
    return db.prepare('SELECT * FROM suggestions WHERE guild_id = ? AND LOWER(id) = ?').get(guildId, clean);
  }
  findSuggestion(guildId, query) {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    const direct = this.getSuggestion(guildId, clean);
    if (direct) return direct;
    return db.prepare(`
      SELECT * FROM suggestions
      WHERE guild_id = ? AND is_deleted = 0
        AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)
      ORDER BY created_at DESC LIMIT 1
    `).get(guildId, `%${clean}%`, `%${clean}%`);
  }
  updateSuggestion(guildId, id, updates = {}, userId = 'system') {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getSuggestion(guildId, id);
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), guildId, id);
    db.prepare(`UPDATE suggestions SET ${setClauses}, updated_at = ? WHERE guild_id = ? AND id = ?`).run(...values);
    this.logHistory(guildId, id, userId, 'update', `Modifying fields : ${keys.join(', ')}`);
    return this.getSuggestion(guildId, id);
  }
  deleteSuggestion(guildId, id, userId = 'system', soft = true) {
    if (soft) {
      db.prepare('UPDATE suggestions SET is_deleted = 1, updated_at = ? WHERE guild_id = ? AND id = ?').run(Date.now(), guildId, id);
      this.logHistory(guildId, id, userId, 'delete', 'Suggestion moved to the trash');
    } else {
      db.prepare('DELETE FROM suggestions WHERE guild_id = ? AND id = ?').run(guildId, id);
      db.prepare('DELETE FROM suggestion_votes WHERE suggestion_id = ?').run(id);
      db.prepare('DELETE FROM suggestion_comments WHERE suggestion_id = ?').run(id);
      this.logHistory(guildId, id, userId, 'purge', 'Suggestion permanently deleted');
    }
    return true;
  }
  restoreSuggestion(guildId, id, userId = 'system') {
    db.prepare('UPDATE suggestions SET is_deleted = 0, updated_at = ? WHERE guild_id = ? AND id = ?').run(Date.now(), guildId, id);
    this.logHistory(guildId, id, userId, 'restore', 'Restored suggestion');
    return this.getSuggestion(guildId, id);
  }
  getSuggestions(guildId, filter = {}) {
    let query = 'SELECT * FROM suggestions WHERE guild_id = ?';
    const params = [guildId];
    if (filter.is_deleted !== undefined) {
      query += ' AND is_deleted = ?';
      params.push(filter.is_deleted ? 1 : 0);
    } else {
      query += ' AND is_deleted = 0';
    }
    if (filter.is_archived !== undefined) {
      query += ' AND is_archived = ?';
      params.push(filter.is_archived ? 1 : 0);
    }
    if (filter.author_id) {
      query += ' AND author_id = ?';
      params.push(filter.author_id);
    }
    if (filter.status) {
      query += ' AND LOWER(status) = LOWER(?)';
      params.push(filter.status);
    }
    if (filter.category) {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(filter.category);
    }
    if (filter.priority) {
      query += ' AND LOWER(priority) = LOWER(?)';
      params.push(filter.priority);
    }
    if (filter.sort === 'votes') {
      query += ' ORDER BY (upvotes - downvotes) DESC, upvotes DESC';
    } else if (filter.sort === 'popular') {
      query += ' ORDER BY upvotes DESC';
    } else if (filter.sort === 'trending') {
      query += ' ORDER BY (upvotes + downvotes) DESC, updated_at DESC';
    } else if (filter.sort === 'oldest') {
      query += ' ORDER BY created_at ASC';
    } else {
      query += ' ORDER BY created_at DESC';
    }
    if (filter.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
    }
    return db.prepare(query).all(...params);
  }
  countSuggestions(guildId, filter = {}) {
    return this.getSuggestions(guildId, filter).length;
  }
  vote(suggestionId, userId, voteType) {
    const existing = db.prepare('SELECT * FROM suggestion_votes WHERE suggestion_id = ? AND user_id = ?').get(suggestionId, userId);
    const now = Date.now();
    if (existing) {
      if (existing.vote_type === voteType) {
        db.prepare('DELETE FROM suggestion_votes WHERE id = ?').run(existing.id);
        this.recalculateVotes(suggestionId);
        return { action: 'unvoted', voteType: 0 };
      } else {
        db.prepare('UPDATE suggestion_votes SET vote_type = ?, updated_at = ? WHERE id = ?').run(voteType, now, existing.id);
        this.recalculateVotes(suggestionId);
        return { action: 'changed', voteType };
      }
    } else {
      const id = `${suggestionId}_${userId}`;
      db.prepare('INSERT INTO suggestion_votes (id, suggestion_id, user_id, vote_type, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, suggestionId, userId, voteType, now);
      this.recalculateVotes(suggestionId);
      return { action: 'voted', voteType };
    }
  }
  recalculateVotes(suggestionId) {
    const upvotes = db.prepare('SELECT COUNT(*) as c FROM suggestion_votes WHERE suggestion_id = ? AND vote_type = 1').get(suggestionId).c;
    const downvotes = db.prepare('SELECT COUNT(*) as c FROM suggestion_votes WHERE suggestion_id = ? AND vote_type = -1').get(suggestionId).c;
    db.prepare('UPDATE suggestions SET upvotes = ?, downvotes = ?, updated_at = ? WHERE id = ?').run(upvotes, downvotes, Date.now(), suggestionId);
    return { upvotes, downvotes };
  }
  getVotes(suggestionId) {
    return db.prepare('SELECT * FROM suggestion_votes WHERE suggestion_id = ?').all(suggestionId);
  }
  getUserVotes(userId) {
    return db.prepare('SELECT * FROM suggestion_votes WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
  }
  resetVotes(suggestionId) {
    db.prepare('DELETE FROM suggestion_votes WHERE suggestion_id = ?').run(suggestionId);
    db.prepare('UPDATE suggestions SET upvotes = 0, downvotes = 0, updated_at = ? WHERE id = ?').run(Date.now(), suggestionId);
  }
  addComment(guildId, suggestionId, authorId, content, isStaff = 0) {
    const id = this.generateId('com');
    db.prepare(`
      INSERT INTO suggestion_comments (id, suggestion_id, guild_id, author_id, content, is_staff, is_pinned, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, suggestionId, guildId, authorId, content, isStaff ? 1 : 0, Date.now());
    return db.prepare('SELECT * FROM suggestion_comments WHERE id = ?').get(id);
  }
  getComments(suggestionId) {
    return db.prepare('SELECT * FROM suggestion_comments WHERE suggestion_id = ? ORDER BY is_pinned DESC, created_at ASC').all(suggestionId);
  }
  deleteComment(commentId) {
    db.prepare('DELETE FROM suggestion_comments WHERE id = ?').run(commentId);
    return true;
  }
  pinComment(commentId, pin = true) {
    db.prepare('UPDATE suggestion_comments SET is_pinned = ? WHERE id = ?').run(pin ? 1 : 0, commentId);
    return true;
  }
  createCategory(guildId, name, description = '', color = '#5865F2') {
    const id = this.generateId('cat');
    db.prepare('INSERT INTO suggestion_categories (id, guild_id, name, description, color, sort_order) VALUES (?, ?, ?, ?, ?, 0)').run(id, guildId, name, description, color);
    return db.prepare('SELECT * FROM suggestion_categories WHERE id = ?').get(id);
  }
  getCategories(guildId) {
    return db.prepare('SELECT * FROM suggestion_categories WHERE guild_id = ? ORDER BY sort_order ASC, name ASC').all(guildId);
  }
  deleteCategory(guildId, nameOrId) {
    db.prepare('DELETE FROM suggestion_categories WHERE guild_id = ? AND (id = ? OR LOWER(name) = LOWER(?))').run(guildId, nameOrId, nameOrId);
    return true;
  }
  createTemplate(guildId, name, text) {
    const id = this.generateId('tpl');
    db.prepare('INSERT INTO suggestion_templates (id, guild_id, name, template_text, created_at) VALUES (?, ?, ?, ?, ?)').run(id, guildId, name, text, Date.now());
    return db.prepare('SELECT * FROM suggestion_templates WHERE id = ?').get(id);
  }
  getTemplates(guildId) {
    return db.prepare('SELECT * FROM suggestion_templates WHERE guild_id = ? ORDER BY name ASC').all(guildId);
  }
  deleteTemplate(guildId, nameOrId) {
    db.prepare('DELETE FROM suggestion_templates WHERE guild_id = ? AND (id = ? OR LOWER(name) = LOWER(?))').run(guildId, nameOrId, nameOrId);
    return true;
  }
  addToRoadmap(guildId, suggestionId, stage = 'planned') {
    const id = this.generateId('rdm');
    db.prepare('INSERT OR REPLACE INTO suggestion_roadmap (id, guild_id, suggestion_id, stage, sort_order) VALUES (?, ?, ?, ?, 0)').run(id, guildId, suggestionId, stage);
    this.updateSuggestion(guildId, suggestionId, { roadmap_status: stage });
    return db.prepare('SELECT * FROM suggestion_roadmap WHERE id = ?').get(id);
  }
  getRoadmap(guildId) {
    return db.prepare(`
      SELECT r.*, s.title, s.status, s.num, s.upvotes
      FROM suggestion_roadmap r
      JOIN suggestions s ON r.suggestion_id = s.id
      WHERE r.guild_id = ?
      ORDER BY r.sort_order ASC
    `).all(guildId);
  }
  addChangelog(guildId, suggestionId, version, description) {
    const id = this.generateId('chl');
    db.prepare('INSERT INTO suggestion_changelog (id, guild_id, suggestion_id, version, description, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, guildId, suggestionId, version, description, Date.now());
    return db.prepare('SELECT * FROM suggestion_changelog WHERE id = ?').get(id);
  }
  getChangelogs(guildId) {
    return db.prepare('SELECT * FROM suggestion_changelog WHERE guild_id = ? ORDER BY created_at DESC LIMIT 20').all(guildId);
  }
  logHistory(guildId, suggestionId, userId, action, details) {
    try {
      db.prepare(`
        INSERT INTO suggestion_history (guild_id, suggestion_id, user_id, action, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(guildId, suggestionId || null, userId || 'system', action, details || '', Date.now());
    } catch (e) {
      console.error('[SuggestionService] logHistory error :', e);
    }
  }
  getHistory(guildId, suggestionId = null, limit = 20) {
    if (suggestionId) {
      return db.prepare('SELECT * FROM suggestion_history WHERE guild_id = ? AND suggestion_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, suggestionId, limit);
    }
    return db.prepare('SELECT * FROM suggestion_history WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  createRevision(suggestionId, title, description, authorId) {
    const id = this.generateId('rev');
    db.prepare('INSERT INTO suggestion_revisions (id, suggestion_id, title, description, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, suggestionId, title, description, authorId, Date.now());
    return id;
  }
  getRevisions(suggestionId) {
    return db.prepare('SELECT * FROM suggestion_revisions WHERE suggestion_id = ? ORDER BY created_at DESC').all(suggestionId);
  }
  getStats(guildId) {
    const total = db.prepare('SELECT COUNT(*) as c FROM suggestions WHERE guild_id = ? AND is_deleted = 0').get(guildId).c;
    const pending = db.prepare('SELECT COUNT(*) as c FROM suggestions WHERE guild_id = ? AND status = "pending" AND is_deleted = 0').get(guildId).c;
    const approved = db.prepare('SELECT COUNT(*) as c FROM suggestions WHERE guild_id = ? AND status = "approved" AND is_deleted = 0').get(guildId).c;
    const rejected = db.prepare('SELECT COUNT(*) as c FROM suggestions WHERE guild_id = ? AND status = "rejected" AND is_deleted = 0').get(guildId).c;
    const implemented = db.prepare('SELECT COUNT(*) as c FROM suggestions WHERE guild_id = ? AND status = "implemented" AND is_deleted = 0').get(guildId).c;
    const totalVotes = db.prepare(`
      SELECT COUNT(*) as c FROM suggestion_votes v
      JOIN suggestions s ON v.suggestion_id = s.id
      WHERE s.guild_id = ?
    `).get(guildId).c;
    return { total, pending, approved, rejected, implemented, totalVotes };
  }
  getTopSubmitters(guildId, limit = 10) {
    return db.prepare(`
      SELECT author_id, COUNT(*) as count
      FROM suggestions
      WHERE guild_id = ? AND is_deleted = 0
      GROUP BY author_id
      ORDER BY count DESC
      LIMIT ?
    `).all(guildId, limit);
  }
  getTopVoted(guildId, limit = 5) {
    return db.prepare(`
      SELECT * FROM suggestions
      WHERE guild_id = ? AND is_deleted = 0
      ORDER BY upvotes DESC
      LIMIT ?
    `).all(guildId, limit);
  }
  cleanupOldSuggestions(guildId, days = 60) {
    const limit = Date.now() - (days * 24 * 3600 * 1000);
    const res = db.prepare('DELETE FROM suggestions WHERE guild_id = ? AND (is_deleted = 1 OR (status = "rejected" AND updated_at < ?))').run(guildId, limit);
    return res.changes;
  }
}
module.exports = new SuggestionService();
