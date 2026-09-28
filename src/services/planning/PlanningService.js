const { db } = require('../../utils/database');
class PlanningService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        timezone TEXT DEFAULT 'Europe/Paris',
        default_view TEXT DEFAULT 'calendar',
        log_channel_id TEXT,
        role_manager_id TEXT,
        conflict_detection INTEGER DEFAULT 1,
        reminder_delay INTEGER DEFAULT 15,
        max_items INTEGER DEFAULT 500,
        published INTEGER DEFAULT 1,
        share_token TEXT,
        debug_mode INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_items (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'event',
        category TEXT DEFAULT 'General',
        location TEXT,
        link TEXT,
        image_url TEXT,
        color TEXT DEFAULT '#5865F2',
        emoji TEXT DEFAULT '📅',
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        is_all_day INTEGER DEFAULT 0,
        timezone TEXT DEFAULT 'Europe/Paris',
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        tags TEXT,
        max_participants INTEGER DEFAULT 0,
        project_id TEXT,
        priority TEXT DEFAULT 'normal',
        is_archived INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_participants (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        is_required INTEGER DEFAULT 0,
        notes TEXT,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_resources (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'room',
        description TEXT,
        capacity INTEGER DEFAULT 1,
        location TEXT,
        is_available INTEGER DEFAULT 1,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_reservations (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        item_id TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        status TEXT DEFAULT 'confirmed',
        reason TEXT,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_shifts (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        title TEXT NOT NULL,
        user_id TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        role_required TEXT,
        status TEXT DEFAULT 'open',
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_polls (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        options_json TEXT,
        votes_json TEXT,
        status TEXT DEFAULT 'open',
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_templates (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'template',
        data_json TEXT NOT NULL,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_teams (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'team',
        description TEXT,
        members_json TEXT,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_blocks (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        target_type TEXT DEFAULT 'user',
        target_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        reason TEXT,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_workflows (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        trigger_type TEXT DEFAULT 'on_create',
        action_type TEXT DEFAULT 'notify',
        enabled INTEGER DEFAULT 1,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_rules (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        rule_type TEXT DEFAULT 'conflict',
        value TEXT,
        priority INTEGER DEFAULT 1,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        item_id TEXT,
        user_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp INTEGER NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_revisions (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        label TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS planning_availabilities (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        day_of_week INTEGER,
        start_time TEXT,
        end_time TEXT,
        is_busy INTEGER DEFAULT 0,
        note TEXT,
        updated_at INTEGER
      );
    `);
  }
  getSettings(guildId) {
    let settings = db.prepare('SELECT * FROM planning_settings WHERE guild_id = ?').get(guildId);
    if (!settings) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO planning_settings (guild_id, enabled, timezone, default_view, conflict_detection, reminder_delay, max_items, published, debug_mode, created_at, updated_at)
        VALUES (?, 1, 'Europe/Paris', 'calendar', 1, 15, 500, 1, 0, ?, ?)
      `).run(guildId, now, now);
      settings = db.prepare('SELECT * FROM planning_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE planning_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  resetSettings(guildId) {
    db.prepare('DELETE FROM planning_settings WHERE guild_id = ?').run(guildId);
    return this.getSettings(guildId);
  }
  generateId(prefix = 'pln') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }
  createItem(guildId, creatorId, data) {
    const id = this.generateId('evt');
    const now = Date.now();
    const startTime = data.start_time || now;
    const endTime = data.end_time || (startTime + 3600000); // 1h default
    db.prepare(`
      INSERT INTO planning_items (
        id, guild_id, creator_id, title, description, type, category,
        location, link, image_url, color, emoji, start_time, end_time,
        is_all_day, timezone, status, notes, tags, max_participants,
        project_id, priority, is_archived, is_deleted, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(
      id,
      guildId,
      creatorId,
      data.title || 'Untitled event',
      data.description || '',
      data.type || 'event',
      data.category || 'General',
      data.location || '',
      data.link || '',
      data.image_url || '',
      data.color || '#5865F2',
      data.emoji || '📅',
      startTime,
      endTime,
      data.is_all_day ? 1 : 0,
      data.timezone || 'Europe/Paris',
      data.status || 'scheduled',
      data.notes || '',
      data.tags || '',
      data.max_participants || 0,
      data.project_id || null,
      data.priority || 'normal',
      now,
      now
    );
    this.logHistory(guildId, id, creatorId, 'create', `Creation of the element "${data.title}"`);
    return this.getItem(guildId, id);
  }
  getItem(guildId, id) {
    return db.prepare('SELECT * FROM planning_items WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  findItemByTitleOrId(guildId, query) {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    return db.prepare(`
      SELECT * FROM planning_items
      WHERE guild_id = ? AND is_deleted = 0
        AND (LOWER(id) = ? OR LOWER(title) LIKE ?)
      ORDER BY start_time ASC LIMIT 1
    `).get(guildId, clean, `%${clean}%`);
  }
  updateItem(guildId, id, updates = {}, userId = 'system') {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getItem(guildId, id);
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), guildId, id);
    db.prepare(`UPDATE planning_items SET ${setClauses}, updated_at = ? WHERE guild_id = ? AND id = ?`).run(...values);
    this.logHistory(guildId, id, userId, 'update', `Modifying fields : ${keys.join(', ')}`);
    return this.getItem(guildId, id);
  }
  deleteItem(guildId, id, userId = 'system', soft = true) {
    if (soft) {
      db.prepare('UPDATE planning_items SET is_deleted = 1, updated_at = ? WHERE guild_id = ? AND id = ?').run(Date.now(), guildId, id);
      this.logHistory(guildId, id, userId, 'delete', 'Item moved to the Trash');
    } else {
      db.prepare('DELETE FROM planning_items WHERE guild_id = ? AND id = ?').run(guildId, id);
      db.prepare('DELETE FROM planning_participants WHERE guild_id = ? AND item_id = ?').run(guildId, id);
      this.logHistory(guildId, id, userId, 'purge', 'Item permanently deleted');
    }
    return true;
  }
  restoreItem(guildId, id, userId = 'system') {
    db.prepare('UPDATE planning_items SET is_deleted = 0, updated_at = ? WHERE guild_id = ? AND id = ?').run(Date.now(), guildId, id);
    this.logHistory(guildId, id, userId, 'restore', 'Restored item');
    return this.getItem(guildId, id);
  }
  getItems(guildId, filter = {}) {
    let query = 'SELECT * FROM planning_items WHERE guild_id = ?';
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
    if (filter.status) {
      query += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter.type) {
      query += ' AND type = ?';
      params.push(filter.type);
    }
    if (filter.category) {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(filter.category);
    }
    if (filter.from) {
      query += ' AND end_time >= ?';
      params.push(filter.from);
    }
    if (filter.to) {
      query += ' AND start_time <= ?';
      params.push(filter.to);
    }
    query += ' ORDER BY start_time ASC';
    if (filter.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
    }
    return db.prepare(query).all(...params);
  }
  countItems(guildId, filter = {}) {
    return this.getItems(guildId, filter).length;
  }
  addParticipant(guildId, itemId, userId, status = 'pending', isRequired = 0) {
    const id = `${itemId}_${userId}`;
    db.prepare(`
      INSERT OR REPLACE INTO planning_participants (id, item_id, guild_id, user_id, status, is_required, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, itemId, guildId, userId, status, isRequired ? 1 : 0, Date.now());
    return db.prepare('SELECT * FROM planning_participants WHERE id = ?').get(id);
  }
  removeParticipant(guildId, itemId, userId) {
    db.prepare('DELETE FROM planning_participants WHERE guild_id = ? AND item_id = ? AND user_id = ?').run(guildId, itemId, userId);
  }
  getParticipants(guildId, itemId) {
    return db.prepare('SELECT * FROM planning_participants WHERE guild_id = ? AND item_id = ?').all(guildId, itemId);
  }
  updateParticipantStatus(guildId, itemId, userId, status, notes = '') {
    const id = `${itemId}_${userId}`;
    db.prepare(`
      INSERT OR REPLACE INTO planning_participants (id, item_id, guild_id, user_id, status, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, itemId, guildId, userId, status, notes, Date.now());
    return db.prepare('SELECT * FROM planning_participants WHERE id = ?').get(id);
  }
  createResource(guildId, name, type = 'room', description = '', capacity = 1, location = '') {
    const id = this.generateId(type === 'room' ? 'room' : 'res');
    db.prepare(`
      INSERT INTO planning_resources (id, guild_id, name, type, description, capacity, location, is_available, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, guildId, name, type, description, capacity, location, Date.now());
    return this.getResource(guildId, id);
  }
  getResource(guildId, id) {
    return db.prepare('SELECT * FROM planning_resources WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  findResourceByNameOrId(guildId, query) {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    return db.prepare('SELECT * FROM planning_resources WHERE guild_id = ? AND (LOWER(id) = ? OR LOWER(name) LIKE ?) LIMIT 1').get(guildId, clean, `%${clean}%`);
  }
  getResources(guildId, type = null) {
    if (type) {
      return db.prepare('SELECT * FROM planning_resources WHERE guild_id = ? AND type = ? ORDER BY name ASC').all(guildId, type);
    }
    return db.prepare('SELECT * FROM planning_resources WHERE guild_id = ? ORDER BY name ASC').all(guildId);
  }
  deleteResource(guildId, id) {
    db.prepare('DELETE FROM planning_resources WHERE guild_id = ? AND id = ?').run(guildId, id);
    db.prepare('DELETE FROM planning_reservations WHERE guild_id = ? AND resource_id = ?').run(guildId, id);
    return true;
  }
  createReservation(guildId, resourceId, userId, startTime, endTime, reason = '', itemId = null) {
    const id = this.generateId('rsv');
    db.prepare(`
      INSERT INTO planning_reservations (id, guild_id, resource_id, user_id, item_id, start_time, end_time, status, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
    `).run(id, guildId, resourceId, userId, itemId, startTime, endTime, reason, Date.now());
    return this.getReservation(guildId, id);
  }
  getReservation(guildId, id) {
    return db.prepare('SELECT * FROM planning_reservations WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  getReservations(guildId, resourceId = null) {
    if (resourceId) {
      return db.prepare('SELECT * FROM planning_reservations WHERE guild_id = ? AND resource_id = ? ORDER BY start_time ASC').all(guildId, resourceId);
    }
    return db.prepare('SELECT * FROM planning_reservations WHERE guild_id = ? ORDER BY start_time ASC').all(guildId);
  }
  cancelReservation(guildId, id) {
    db.prepare('UPDATE planning_reservations SET status = "cancelled" WHERE guild_id = ? AND id = ?').run(guildId, id);
    return true;
  }
  createShift(guildId, title, userId, startTime, endTime, roleRequired = '') {
    const id = this.generateId('shf');
    db.prepare(`
      INSERT INTO planning_shifts (id, guild_id, title, user_id, start_time, end_time, role_required, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, title, userId, startTime, endTime, roleRequired, userId ? 'assigned' : 'open', Date.now());
    return this.getShift(guildId, id);
  }
  getShift(guildId, id) {
    return db.prepare('SELECT * FROM planning_shifts WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  getShifts(guildId) {
    return db.prepare('SELECT * FROM planning_shifts WHERE guild_id = ? ORDER BY start_time ASC').all(guildId);
  }
  assignShift(guildId, id, userId) {
    db.prepare('UPDATE planning_shifts SET user_id = ?, status = "assigned" WHERE guild_id = ? AND id = ?').run(userId, guildId, id);
    return this.getShift(guildId, id);
  }
  unassignShift(guildId, id) {
    db.prepare('UPDATE planning_shifts SET user_id = NULL, status = "open" WHERE guild_id = ? AND id = ?').run(guildId, id);
    return this.getShift(guildId, id);
  }
  deleteShift(guildId, id) {
    db.prepare('DELETE FROM planning_shifts WHERE guild_id = ? AND id = ?').run(guildId, id);
    return true;
  }
  createPoll(guildId, creatorId, title, description, options = []) {
    const id = this.generateId('pol');
    db.prepare(`
      INSERT INTO planning_polls (id, guild_id, creator_id, title, description, options_json, votes_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, '{}', 'open', ?)
    `).run(id, guildId, creatorId, title, description, JSON.stringify(options), Date.now());
    return this.getPoll(guildId, id);
  }
  getPoll(guildId, id) {
    return db.prepare('SELECT * FROM planning_polls WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  getPolls(guildId) {
    return db.prepare('SELECT * FROM planning_polls WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  votePoll(guildId, id, userId, optionIndex) {
    const poll = this.getPoll(guildId, id);
    if (!poll) return null;
    const votes = JSON.parse(poll.votes_json || '{}');
    votes[userId] = optionIndex;
    db.prepare('UPDATE planning_polls SET votes_json = ? WHERE guild_id = ? AND id = ?').run(JSON.stringify(votes), guildId, id);
    return this.getPoll(guildId, id);
  }
  closePoll(guildId, id) {
    db.prepare('UPDATE planning_polls SET status = "closed" WHERE guild_id = ? AND id = ?').run(guildId, id);
    return this.getPoll(guildId, id);
  }
  createTemplate(guildId, name, data, type = 'template') {
    const id = this.generateId('tpl');
    db.prepare(`
      INSERT INTO planning_templates (id, guild_id, name, type, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, name, type, JSON.stringify(data), Date.now());
    return this.getTemplate(guildId, id);
  }
  getTemplate(guildId, id) {
    return db.prepare('SELECT * FROM planning_templates WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  findTemplateByNameOrId(guildId, query) {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    return db.prepare('SELECT * FROM planning_templates WHERE guild_id = ? AND (LOWER(id) = ? OR LOWER(name) LIKE ?) LIMIT 1').get(guildId, clean, `%${clean}%`);
  }
  getTemplates(guildId, type = 'template') {
    return db.prepare('SELECT * FROM planning_templates WHERE guild_id = ? AND type = ? ORDER BY name ASC').all(guildId, type);
  }
  deleteTemplate(guildId, id) {
    db.prepare('DELETE FROM planning_templates WHERE guild_id = ? AND id = ?').run(guildId, id);
    return true;
  }
  createTeam(guildId, name, description = '', members = [], type = 'team') {
    const id = this.generateId(type === 'team' ? 'tm' : 'grp');
    db.prepare(`
      INSERT INTO planning_teams (id, guild_id, name, type, description, members_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, name, type, description, JSON.stringify(members), Date.now());
    return this.getTeam(guildId, id);
  }
  getTeam(guildId, id) {
    return db.prepare('SELECT * FROM planning_teams WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  findTeamByNameOrId(guildId, query) {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    return db.prepare('SELECT * FROM planning_teams WHERE guild_id = ? AND (LOWER(id) = ? OR LOWER(name) LIKE ?) LIMIT 1').get(guildId, clean, `%${clean}%`);
  }
  getTeams(guildId, type = 'team') {
    return db.prepare('SELECT * FROM planning_teams WHERE guild_id = ? AND type = ? ORDER BY name ASC').all(guildId, type);
  }
  deleteTeam(guildId, id) {
    db.prepare('DELETE FROM planning_teams WHERE guild_id = ? AND id = ?').run(guildId, id);
    return true;
  }
  createBlock(guildId, targetType, targetId, startTime, endTime, reason = '') {
    const id = this.generateId('blk');
    db.prepare(`
      INSERT INTO planning_blocks (id, guild_id, target_type, target_id, start_time, end_time, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, targetType, targetId, startTime, endTime, reason, Date.now());
    return this.getBlock(guildId, id);
  }
  getBlock(guildId, id) {
    return db.prepare('SELECT * FROM planning_blocks WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  getBlocks(guildId) {
    return db.prepare('SELECT * FROM planning_blocks WHERE guild_id = ? ORDER BY start_time ASC').all(guildId);
  }
  deleteBlock(guildId, id) {
    db.prepare('DELETE FROM planning_blocks WHERE guild_id = ? AND id = ?').run(guildId, id);
    return true;
  }
  createWorkflow(guildId, name, triggerType = 'on_create', actionType = 'notify') {
    const id = this.generateId('wf');
    db.prepare(`
      INSERT INTO planning_workflows (id, guild_id, name, trigger_type, action_type, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(id, guildId, name, triggerType, actionType, Date.now());
    return this.getWorkflow(guildId, id);
  }
  getWorkflow(guildId, id) {
    return db.prepare('SELECT * FROM planning_workflows WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  getWorkflows(guildId) {
    return db.prepare('SELECT * FROM planning_workflows WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  deleteWorkflow(guildId, id) {
    db.prepare('DELETE FROM planning_workflows WHERE guild_id = ? AND id = ?').run(guildId, id);
    return true;
  }
  createRule(guildId, name, ruleType, value, priority = 1) {
    const id = this.generateId('rul');
    db.prepare(`
      INSERT INTO planning_rules (id, guild_id, name, rule_type, value, priority, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, guildId, name, ruleType, value, priority, Date.now());
    return this.getRule(guildId, id);
  }
  getRule(guildId, id) {
    return db.prepare('SELECT * FROM planning_rules WHERE guild_id = ? AND id = ?').get(guildId, id);
  }
  getRules(guildId) {
    return db.prepare('SELECT * FROM planning_rules WHERE guild_id = ? ORDER BY priority DESC, created_at ASC').all(guildId);
  }
  deleteRule(guildId, id) {
    db.prepare('DELETE FROM planning_rules WHERE guild_id = ? AND id = ?').run(guildId, id);
    return true;
  }
  checkConflicts(guildId, startTime, endTime, excludeItemId = null) {
    const items = this.getItems(guildId, { is_deleted: false, is_archived: false });
    return items.filter(item => {
      if (excludeItemId && item.id === excludeItemId) return false;
      return (item.start_time < endTime && item.end_time > startTime);
    });
  }
  logHistory(guildId, itemId, userId, action, details) {
    try {
      db.prepare(`
        INSERT INTO planning_history (guild_id, item_id, user_id, action, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(guildId, itemId || null, userId || 'system', action, details || '', Date.now());
    } catch (e) {
      console.error('[PlanningService] logHistory error :', e);
    }
  }
  getHistory(guildId, limit = 20) {
    return db.prepare('SELECT * FROM planning_history WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  createRevision(guildId, label) {
    const id = this.generateId('rev');
    const items = this.getItems(guildId);
    const snapshot = JSON.stringify({ items, timestamp: Date.now() });
    db.prepare(`
      INSERT INTO planning_revisions (id, guild_id, label, snapshot_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, label || `Sauvegarde du ${new Date().toLocaleDateString('fr-FR')}`, snapshot, Date.now());
    return id;
  }
  getRevisions(guildId) {
    return db.prepare('SELECT id, guild_id, label, created_at FROM planning_revisions WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  restoreRevision(guildId, revId) {
    const rev = db.prepare('SELECT * FROM planning_revisions WHERE guild_id = ? AND id = ?').get(guildId, revId);
    if (!rev) return false;
    const data = JSON.parse(rev.snapshot_json);
    if (Array.isArray(data.items)) {
      db.prepare('DELETE FROM planning_items WHERE guild_id = ?').run(guildId);
      for (const item of data.items) {
        db.prepare(`
          INSERT INTO planning_items (
            id, guild_id, creator_id, title, description, type, category,
            location, link, image_url, color, emoji, start_time, end_time,
            is_all_day, timezone, status, notes, tags, max_participants,
            project_id, priority, is_archived, is_deleted, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          item.id, item.guild_id, item.creator_id, item.title, item.description,
          item.type, item.category, item.location, item.link, item.image_url,
          item.color, item.emoji, item.start_time, item.end_time, item.is_all_day,
          item.timezone, item.status, item.notes, item.tags, item.max_participants,
          item.project_id, item.priority, item.is_archived, item.is_deleted,
          item.created_at, item.updated_at
        );
      }
      return true;
    }
    return false;
  }
  getStats(guildId) {
    const totalItems = db.prepare('SELECT COUNT(*) as c FROM planning_items WHERE guild_id = ? AND is_deleted = 0').get(guildId).c;
    const scheduled = db.prepare('SELECT COUNT(*) as c FROM planning_items WHERE guild_id = ? AND status = "scheduled" AND is_deleted = 0').get(guildId).c;
    const completed = db.prepare('SELECT COUNT(*) as c FROM planning_items WHERE guild_id = ? AND status = "completed" AND is_deleted = 0').get(guildId).c;
    const cancelled = db.prepare('SELECT COUNT(*) as c FROM planning_items WHERE guild_id = ? AND status = "cancelled" AND is_deleted = 0').get(guildId).c;
    const archived = db.prepare('SELECT COUNT(*) as c FROM planning_items WHERE guild_id = ? AND is_archived = 1').get(guildId).c;
    const resources = db.prepare('SELECT COUNT(*) as c FROM planning_resources WHERE guild_id = ?').get(guildId).c;
    const reservations = db.prepare('SELECT COUNT(*) as c FROM planning_reservations WHERE guild_id = ?').get(guildId).c;
    const shifts = db.prepare('SELECT COUNT(*) as c FROM planning_shifts WHERE guild_id = ?').get(guildId).c;
    const participants = db.prepare('SELECT COUNT(*) as c FROM planning_participants WHERE guild_id = ?').get(guildId).c;
    return {
      totalItems,
      scheduled,
      completed,
      cancelled,
      archived,
      resources,
      reservations,
      shifts,
      participants
    };
  }
  cleanupOldItems(guildId, days = 30) {
    const limit = Date.now() - (days * 24 * 3600 * 1000);
    const res = db.prepare('DELETE FROM planning_items WHERE guild_id = ? AND (is_deleted = 1 OR end_time < ?)').run(guildId, limit);
    return res.changes;
  }
}
module.exports = new PlanningService();
