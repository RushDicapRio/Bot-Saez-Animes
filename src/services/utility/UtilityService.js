const crypto = require('crypto');
const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS utility_notes (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS utility_reminders (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message TEXT NOT NULL,
    remind_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
  );
  CREATE TABLE IF NOT EXISTS utility_history (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    query TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS utility_settings (
    guild_id TEXT PRIMARY KEY,
    default_timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
    max_notes_per_user INTEGER NOT NULL DEFAULT 20,
    max_reminders_per_user INTEGER NOT NULL DEFAULT 10,
    enabled INTEGER NOT NULL DEFAULT 1,
    data TEXT DEFAULT '{}'
  );
`);
class UtilityService {
  static getSettings(guildId) {
    let row = db.prepare('SELECT * FROM utility_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      db.prepare('INSERT OR IGNORE INTO utility_settings (guild_id) VALUES (?)').run(guildId);
      row = db.prepare('SELECT * FROM utility_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE utility_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static addNote(guildId, userId, title, content) {
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO utility_notes (id, guild_id, user_id, title, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, title, content, now, now);
    return { id, title, content, created_at: now };
  }
  static getNotes(guildId, userId) {
    return db.prepare('SELECT * FROM utility_notes WHERE guild_id = ? AND user_id = ? ORDER BY updated_at DESC').all(guildId, userId);
  }
  static deleteNote(guildId, userId, noteId) {
    const res = db.prepare('DELETE FROM utility_notes WHERE guild_id = ? AND user_id = ? AND (id = ? OR title = ?)').run(guildId, userId, noteId, noteId);
    return res.changes > 0;
  }
  static addReminder(guildId, userId, channelId, message, remindAt) {
    const id = `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO utility_reminders (id, guild_id, user_id, channel_id, message, remind_at, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(id, guildId, userId, channelId, message, remindAt, Date.now());
    return { id, message, remind_at: remindAt };
  }
  static getReminders(guildId, userId) {
    return db.prepare('SELECT * FROM utility_reminders WHERE guild_id = ? AND user_id = ? AND status = ? ORDER BY remind_at ASC').all(guildId, userId, 'PENDING');
  }
  static deleteReminder(guildId, userId, reminderId) {
    const res = db.prepare('DELETE FROM utility_reminders WHERE guild_id = ? AND user_id = ? AND id = ?').run(guildId, userId, reminderId);
    return res.changes > 0;
  }
  static logUsage(guildId, userId, toolName, query = '') {
    const id = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO utility_history (id, guild_id, user_id, tool_name, query, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, toolName, query.slice(0, 200), Date.now());
  }
  static getHistory(guildId, userId = null, limit = 10) {
    if (userId) {
      return db.prepare('SELECT * FROM utility_history WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT ?').all(guildId, userId, limit);
    }
    return db.prepare('SELECT * FROM utility_history WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?').all(guildId, limit);
  }
  static clearHistory(guildId, userId = null) {
    if (userId) {
      return db.prepare('DELETE FROM utility_history WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
    }
    return db.prepare('DELETE FROM utility_history WHERE guild_id = ?').run(guildId);
  }
  static safeCalculate(expression) {
    if (!expression || typeof expression !== 'string') return null;
    const sanitized = expression.replace(/[^0-9+\-*/().,%^√eE\s]/g, '');
    if (!sanitized.trim()) return null;
    try {
      const jsExpr = sanitized
        .replace(/\^/g, '**')
        .replace(/√([0-9.]+)/g, 'Math.sqrt($1)')
        .replace(/Math\.sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
      const func = new Function(`return (${jsExpr});`);
      const result = func();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return result;
      }
      return null;
    } catch {
      return null;
    }
  }
  static gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }
  static lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs((a * b) / this.gcd(a, b));
  }
  static isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }
  static factorial(n) {
    if (n < 0) return null;
    if (n > 170) return Infinity;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }
  static parseSnowflake(snowflake) {
    try {
      const id = BigInt(snowflake);
      const binary = id.toString(2).padStart(64, '0');
      const timestamp = Number((id >> 22n) + 1420070400000n);
      const workerId = Number((id & 0x3E0000n) >> 17n);
      const processId = Number((id & 0x1F000n) >> 12n);
      const increment = Number(id & 0xFFFn);
      return {
        id: snowflake,
        date: new Date(timestamp),
        timestamp,
        workerId,
        processId,
        increment,
        binary
      };
    } catch {
      return null;
    }
  }
  static toRoman(num) {
    if (isNaN(num) || num < 1 || num > 3999) return null;
    const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '';
    for (const i in lookup) {
      while (num >= lookup[i]) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
  }
  static fromRoman(str) {
    if (!str || typeof str !== 'string') return null;
    const lookup = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    const upper = str.toUpperCase().trim();
    for (let i = 0; i < upper.length; i++) {
      const current = lookup[upper[i]];
      const next = lookup[upper[i + 1]];
      if (!current) return null;
      if (next && current < next) {
        total += next - current;
        i++;
      } else {
        total += current;
      }
    }
    return total;
  }
}
module.exports = UtilityService;  
