const { db } = require('../../utils/database');
class BirthdayService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS birthday_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        channel_id TEXT,
        role_id TEXT,
        role_duration_hours INTEGER DEFAULT 24,
        announcement_enabled INTEGER DEFAULT 1,
        announcement_time TEXT DEFAULT '09:00',
        timezone TEXT DEFAULT 'Europe/Paris',
        default_message TEXT DEFAULT '🎉 Happy birthday, {user} ! You are now {age} years old ! 🎂',
        embed_color TEXT DEFAULT '#FF69B4',
        embed_title TEXT DEFAULT '🎂 Happy birthday !',
        show_age_default INTEGER DEFAULT 1,
        mention_user INTEGER DEFAULT 1,
        mention_role_id TEXT,
        reminder_days_before INTEGER DEFAULT 0,
        debug_mode INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS birthdays (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        day INTEGER NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER,
        is_private INTEGER DEFAULT 0,
        hide_age INTEGER DEFAULT 0,
        hide_year INTEGER DEFAULT 0,
        timezone TEXT,
        custom_message TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS birthday_wishes (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS birthday_templates (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS birthday_milestones (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        age INTEGER NOT NULL,
        message TEXT,
        role_id TEXT,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS birthday_events (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT,
        celebration_date INTEGER,
        status TEXT DEFAULT 'scheduled',
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS birthday_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp INTEGER NOT NULL
      );
    `);
  }
  getSettings(guildId) {
    let settings = db.prepare('SELECT * FROM birthday_settings WHERE guild_id = ?').get(guildId);
    if (!settings) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO birthday_settings (
          guild_id, enabled, role_duration_hours, announcement_enabled, announcement_time,
          timezone, default_message, embed_color, embed_title, show_age_default,
          mention_user, reminder_days_before, debug_mode, created_at, updated_at
        ) VALUES (?, 1, 24, 1, '09:00', 'Europe/Paris', '🎉 Happy birthday, {user} ! You are now {age} years old ! 🎂', '#FF69B4', '🎂 Happy birthday !', 1, 1, 0, 0, ?, ?)
      `).run(guildId, now, now);
      settings = db.prepare('SELECT * FROM birthday_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE birthday_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  resetSettings(guildId) {
    db.prepare('DELETE FROM birthday_settings WHERE guild_id = ?').run(guildId);
    return this.getSettings(guildId);
  }
  generateId(prefix = 'bday') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }
  setBirthday(guildId, userId, day, month, year = null) {
    const existing = this.getBirthday(guildId, userId);
    const now = Date.now();
    if (existing) {
      db.prepare(`
        UPDATE birthdays
        SET day = ?, month = ?, year = ?, updated_at = ?
        WHERE guild_id = ? AND user_id = ?
      `).run(day, month, year, now, guildId, userId);
      this.logHistory(guildId, userId, 'update', `Update : ${day}/${month}${year ? `/${year}` : ''}`);
      return this.getBirthday(guildId, userId);
    } else {
      const id = this.generateId('bday');
      db.prepare(`
        INSERT INTO birthdays (id, guild_id, user_id, day, month, year, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, guildId, userId, day, month, year, now, now);
      this.logHistory(guildId, userId, 'set', `Registration : ${day}/${month}${year ? `/${year}` : ''}`);
      return this.getBirthday(guildId, userId);
    }
  }
  getBirthday(guildId, userId) {
    return db.prepare('SELECT * FROM birthdays WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
  }
  updateBirthday(guildId, userId, updates = {}) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getBirthday(guildId, userId);
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), guildId, userId);
    db.prepare(`UPDATE birthdays SET ${setClauses}, updated_at = ? WHERE guild_id = ? AND user_id = ?`).run(...values);
    return this.getBirthday(guildId, userId);
  }
  deleteBirthday(guildId, userId) {
    db.prepare('DELETE FROM birthdays WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
    this.logHistory(guildId, userId, 'delete', 'Deleting the anniversary');
    return true;
  }
  getBirthdays(guildId, filter = {}) {
    let query = 'SELECT * FROM birthdays WHERE guild_id = ?';
    const params = [guildId];
    if (filter.month) {
      query += ' AND month = ?';
      params.push(filter.month);
    }
    if (filter.day) {
      query += ' AND day = ?';
      params.push(filter.day);
    }
    if (filter.is_private !== undefined) {
      query += ' AND is_private = ?';
      params.push(filter.is_private ? 1 : 0);
    }
    query += ' ORDER BY month ASC, day ASC';
    if (filter.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
    }
    return db.prepare(query).all(...params);
  }
  countBirthdays(guildId) {
    return db.prepare('SELECT COUNT(*) as c FROM birthdays WHERE guild_id = ?').get(guildId).c;
  }
  calculateAge(birthYear, birthMonth, birthDay) {
    if (!birthYear) return null;
    const now = new Date();
    let age = now.getFullYear() - birthYear;
    const m = (now.getMonth() + 1) - birthMonth;
    if (m < 0 || (m === 0 && now.getDate() < birthDay)) {
      age--;
    }
    return age;
  }
  getUpcomingBirthdays(guildId, limit = 10) {
    const all = this.getBirthdays(guildId);
    if (!all.length) return [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const withDays = all.map(b => {
      let nextDate = new Date(now.getFullYear(), b.month - 1, b.day);
      if (nextDate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
        nextDate = new Date(now.getFullYear() + 1, b.month - 1, b.day);
      }
      const diffTime = nextDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...b, nextDate, diffDays };
    });
    withDays.sort((a, b) => a.diffDays - b.diffDays);
    return withDays.slice(0, limit);
  }
  getTodayBirthdays(guildId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    return this.getBirthdays(guildId, { month: currentMonth, day: currentDay });
  }
  getTomorrowBirthdays(guildId) {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const month = tom.getMonth() + 1;
    const day = tom.getDate();
    return this.getBirthdays(guildId, { month, day });
  }
  addWish(guildId, senderId, targetId, message) {
    const id = this.generateId('wsh');
    db.prepare(`
      INSERT INTO birthday_wishes (id, guild_id, sender_id, target_id, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, senderId, targetId, message, Date.now());
    return db.prepare('SELECT * FROM birthday_wishes WHERE id = ?').get(id);
  }
  getWishes(guildId, targetId) {
    return db.prepare('SELECT * FROM birthday_wishes WHERE guild_id = ? AND target_id = ? ORDER BY created_at DESC').all(guildId, targetId);
  }
  createTemplate(guildId, name, message) {
    const id = this.generateId('tpl');
    db.prepare('INSERT INTO birthday_templates (id, guild_id, name, message, created_at) VALUES (?, ?, ?, ?, ?)').run(id, guildId, name, message, Date.now());
    return db.prepare('SELECT * FROM birthday_templates WHERE id = ?').get(id);
  }
  getTemplates(guildId) {
    return db.prepare('SELECT * FROM birthday_templates WHERE guild_id = ? ORDER BY name ASC').all(guildId);
  }
  deleteTemplate(guildId, nameOrId) {
    db.prepare('DELETE FROM birthday_templates WHERE guild_id = ? AND (id = ? OR LOWER(name) = LOWER(?))').run(guildId, nameOrId, nameOrId);
    return true;
  }
  addMilestone(guildId, age, message, roleId = null) {
    const id = this.generateId('mls');
    db.prepare(`
      INSERT OR REPLACE INTO birthday_milestones (id, guild_id, age, message, role_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, age, message, roleId, Date.now());
    return db.prepare('SELECT * FROM birthday_milestones WHERE id = ?').get(id);
  }
  getMilestones(guildId) {
    return db.prepare('SELECT * FROM birthday_milestones WHERE guild_id = ? ORDER BY age ASC').all(guildId);
  }
  deleteMilestone(guildId, age) {
    db.prepare('DELETE FROM birthday_milestones WHERE guild_id = ? AND age = ?').run(guildId, age);
    return true;
  }
  logHistory(guildId, userId, action, details) {
    try {
      db.prepare(`
        INSERT INTO birthday_history (guild_id, user_id, action, details, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `).run(guildId, userId || null, action, details || '', Date.now());
    } catch (e) {
      console.error('[BirthdayService] logHistory error :', e);
    }
  }
  getHistory(guildId, limit = 20) {
    return db.prepare('SELECT * FROM birthday_history WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  getStats(guildId) {
    const total = this.countBirthdays(guildId);
    const withYear = db.prepare('SELECT COUNT(*) as c FROM birthdays WHERE guild_id = ? AND year IS NOT NULL').get(guildId).c;
    const privateCount = db.prepare('SELECT COUNT(*) as c FROM birthdays WHERE guild_id = ? AND is_private = 1').get(guildId).c;
    const wishesCount = db.prepare('SELECT COUNT(*) as c FROM birthday_wishes WHERE guild_id = ?').get(guildId).c;
    const monthDistribution = db.prepare(`
      SELECT month, COUNT(*) as count
      FROM birthdays
      WHERE guild_id = ?
      GROUP BY month
      ORDER BY month ASC
    `).all(guildId);
    return { total, withYear, privateCount, wishesCount, monthDistribution };
  }
  cleanupOrphaned(guildId, validUserIds = []) {
    if (!validUserIds.length) return 0;
    const all = this.getBirthdays(guildId);
    let removed = 0;
    for (const b of all) {
      if (!validUserIds.includes(b.user_id)) {
        this.deleteBirthday(guildId, b.user_id);
        removed++;
      }
    }
    return removed;
  }
}
module.exports = new BirthdayService();
