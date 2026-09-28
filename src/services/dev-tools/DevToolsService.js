const { db } = require('../../utils/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
class DevToolsService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS devtools_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        dev_mode INTEGER DEFAULT 1,
        debug_mode INTEGER DEFAULT 0,
        safe_mode INTEGER DEFAULT 1,
        allowed_roles_json TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS devtools_snippets (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        name TEXT NOT NULL,
        language TEXT DEFAULT 'javascript',
        code TEXT NOT NULL,
        description TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS devtools_templates (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS devtools_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        level TEXT DEFAULT 'info',
        message TEXT NOT NULL,
        stack TEXT,
        timestamp INTEGER NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS devtools_benchmarks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        duration_ms REAL NOT NULL,
        memory_used_mb REAL NOT NULL,
        timestamp INTEGER NOT NULL
      );
    `);
  }
  getSettings(guildId) {
    let settings = db.prepare('SELECT * FROM devtools_settings WHERE guild_id = ?').get(guildId);
    if (!settings) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO devtools_settings (guild_id, enabled, dev_mode, debug_mode, safe_mode, created_at, updated_at)
        VALUES (?, 1, 1, 0, 1, ?, ?)
      `).run(guildId, now, now);
      settings = db.prepare('SELECT * FROM devtools_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE devtools_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  resetSettings(guildId) {
    db.prepare('DELETE FROM devtools_settings WHERE guild_id = ?').run(guildId);
    return this.getSettings(guildId);
  }
  log(guildId, level, message, stack = '') {
    try {
      db.prepare('INSERT INTO devtools_logs (guild_id, level, message, stack, timestamp) VALUES (?, ?, ?, ?, ?)').run(guildId, level, message, stack, Date.now());
    } catch (e) {}
  }
  getLogs(guildId, limit = 10) {
    return db.prepare('SELECT * FROM devtools_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  clearLogs(guildId) {
    return db.prepare('DELETE FROM devtools_logs WHERE guild_id = ?').run(guildId).changes;
  }
  saveSnippet(guildId, authorId, name, code, language = 'javascript', description = '') {
    const id = `snp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    db.prepare(`
      INSERT OR REPLACE INTO devtools_snippets (id, guild_id, author_id, name, language, code, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, authorId, name.trim(), language, code, description, now, now);
    return id;
  }
  getSnippets(guildId) {
    return db.prepare('SELECT * FROM devtools_snippets WHERE guild_id = ? ORDER BY name ASC').all(guildId);
  }
  getSnippet(guildId, nameOrId) {
    return db.prepare('SELECT * FROM devtools_snippets WHERE guild_id = ? AND (id = ? OR LOWER(name) = LOWER(?))').get(guildId, nameOrId, nameOrId);
  }
  deleteSnippet(guildId, nameOrId) {
    return db.prepare('DELETE FROM devtools_snippets WHERE guild_id = ? AND (id = ? OR LOWER(name) = LOWER(?))').run(guildId, nameOrId, nameOrId).changes > 0;
  }
  saveTemplate(guildId, name, content) {
    const id = `tpl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare('INSERT OR REPLACE INTO devtools_templates (id, guild_id, name, content, created_at) VALUES (?, ?, ?, ?, ?)').run(id, guildId, name, content, Date.now());
    return id;
  }
  getTemplates(guildId) {
    return db.prepare('SELECT * FROM devtools_templates WHERE guild_id = ? ORDER BY name ASC').all(guildId);
  }
  getTemplate(guildId, nameOrId) {
    return db.prepare('SELECT * FROM devtools_templates WHERE guild_id = ? AND (id = ? OR LOWER(name) = LOWER(?))').get(guildId, nameOrId, nameOrId);
  }
  deleteTemplate(guildId, nameOrId) {
    return db.prepare('DELETE FROM devtools_templates WHERE guild_id = ? AND (id = ? OR LOWER(name) = LOWER(?))').run(guildId, nameOrId, nameOrId).changes > 0;
  }
  getSystemInfo() {
    const mem = process.memoryUsage();
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.floor(process.uptime()),
      heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2),
      rssMB: (mem.rss / 1024 / 1024).toFixed(2),
      externalMB: (mem.external / 1024 / 1024).toFixed(2),
      pid: process.pid
    };
  }
  getProjectPackage() {
    try {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      if (fs.existsSync(pkgPath)) {
        return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      }
    } catch (e) {}
    return { name: 'Saez-Animes', version: '51.0.0', dependencies: {} };
  }
  getDatabaseStats() {
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);
      return {
        tableCount: tables.length,
        tables
      };
    } catch (e) {
      return { tableCount: 0, tables: [] };
    }
  }
  recordBenchmark(name, durationMs, memoryUsedMb) {
    const id = `bmk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare('INSERT INTO devtools_benchmarks (id, name, duration_ms, memory_used_mb, timestamp) VALUES (?, ?, ?, ?, ?)').run(id, name, durationMs, memoryUsedMb, Date.now());
    return id;
  }
  getBenchmarks(limit = 10) {
    return db.prepare('SELECT * FROM devtools_benchmarks ORDER BY timestamp DESC LIMIT ?').all(limit);
  }
}
module.exports = new DevToolsService();
