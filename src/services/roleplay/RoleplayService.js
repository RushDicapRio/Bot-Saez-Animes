const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS rp_settings (
    guild_id TEXT PRIMARY KEY,
    world_name TEXT NOT NULL DEFAULT 'Kingdom of Antigravity',
    season TEXT NOT NULL DEFAULT 'Spring',
    weather TEXT NOT NULL DEFAULT 'Sunny',
    time_of_day TEXT NOT NULL DEFAULT '12:00',
    difficulty TEXT NOT NULL DEFAULT 'Normal',
    mode TEXT NOT NULL DEFAULT 'Free',
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS rp_characters (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    age INTEGER NOT NULL DEFAULT 20,
    gender TEXT NOT NULL DEFAULT 'Not defined',
    race TEXT NOT NULL DEFAULT 'Human',
    occupation TEXT NOT NULL DEFAULT 'Adventurer',
    title TEXT NOT NULL DEFAULT 'Novice',
    biography TEXT,
    appearance TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    health INTEGER NOT NULL DEFAULT 100,
    max_health INTEGER NOT NULL DEFAULT 100,
    stamina INTEGER NOT NULL DEFAULT 100,
    currency INTEGER NOT NULL DEFAULT 100,
    faction_id TEXT,
    location TEXT NOT NULL DEFAULT 'Central Inn',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rp_sessions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    location TEXT NOT NULL DEFAULT 'Capital',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rp_scenes (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rp_inventory (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_equipped INTEGER NOT NULL DEFAULT 0,
    item_type TEXT NOT NULL DEFAULT 'OBJET'
  );
  CREATE TABLE IF NOT EXISTS rp_factions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    leader_id TEXT,
    description TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rp_quests (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    reward TEXT,
    status TEXT NOT NULL DEFAULT 'AVAILABLE'
  );
  CREATE TABLE IF NOT EXISTS rp_npcs (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Merchant',
    location TEXT NOT NULL DEFAULT 'Market Square',
    dialogue TEXT NOT NULL DEFAULT 'Greetings, traveler!'
  );
  CREATE TABLE IF NOT EXISTS rp_journal (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    entry TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
class RoleplayService {
  static getSettings(guildId) {
    let row = db.prepare('SELECT * FROM rp_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      db.prepare('INSERT OR IGNORE INTO rp_settings (guild_id) VALUES (?)').run(guildId);
      row = db.prepare('SELECT * FROM rp_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE rp_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static getActiveCharacter(guildId, userId) {
    let char = db.prepare('SELECT * FROM rp_characters WHERE guild_id = ? AND user_id = ? AND is_active = 1').get(guildId, userId);
    if (!char) {
      const anyChar = db.prepare('SELECT * FROM rp_characters WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1').get(guildId, userId);
      if (anyChar) {
        db.prepare('UPDATE rp_characters SET is_active = 1 WHERE id = ?').run(anyChar.id);
        return anyChar;
      }
    }
    return char;
  }
  static createCharacter(guildId, userId, name, occupation = 'Adventurer', race = 'Human') {
    const id = `char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare('UPDATE rp_characters SET is_active = 0 WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
    db.prepare(`
      INSERT INTO rp_characters (id, guild_id, user_id, name, occupation, race, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, guildId, userId, name, occupation, race, Date.now());
    this.addItem(id, 'Épée d\'entraînement', 1, 'ARME', 1);
    this.addItem(id, 'Potion de soin', 3, 'CONSOMMABLE', 0);
    return db.prepare('SELECT * FROM rp_characters WHERE id = ?').get(id);
  }
  static getCharacters(guildId, userId) {
    return db.prepare('SELECT * FROM rp_characters WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
  }
  static switchCharacter(guildId, userId, charIdOrName) {
    const char = db.prepare('SELECT * FROM rp_characters WHERE guild_id = ? AND user_id = ? AND (id = ? OR name LIKE ?)').get(guildId, userId, charIdOrName, `%${charIdOrName}%`);
    if (!char) return null;
    db.prepare('UPDATE rp_characters SET is_active = 0 WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
    db.prepare('UPDATE rp_characters SET is_active = 1 WHERE id = ?').run(char.id);
    return char;
  }
  static deleteCharacter(guildId, userId, charIdOrName) {
    const char = db.prepare('SELECT * FROM rp_characters WHERE guild_id = ? AND user_id = ? AND (id = ? OR name LIKE ?)').get(guildId, userId, charIdOrName, `%${charIdOrName}%`);
    if (!char) return false;
    db.prepare('DELETE FROM rp_inventory WHERE character_id = ?').run(char.id);
    db.prepare('DELETE FROM rp_journal WHERE character_id = ?').run(char.id);
    db.prepare('DELETE FROM rp_characters WHERE id = ?').run(char.id);
    return true;
  }
  static getInventory(characterId) {
    return db.prepare('SELECT * FROM rp_inventory WHERE character_id = ?').all(characterId);
  }
  static addItem(characterId, itemName, quantity = 1, type = 'OBJET', equipped = 0) {
    const existing = db.prepare('SELECT * FROM rp_inventory WHERE character_id = ? AND item_name = ?').get(characterId, itemName);
    if (existing) {
      db.prepare('UPDATE rp_inventory SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
    } else {
      const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO rp_inventory (id, character_id, item_name, quantity, is_equipped, item_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, characterId, itemName, quantity, equipped, type);
    }
  }
  static getSession(guildId) {
    return db.prepare('SELECT * FROM rp_sessions WHERE guild_id = ? AND status = \'ACTIVE\' ORDER BY created_at DESC LIMIT 1').get(guildId);
  }
  static startSession(guildId, ownerId, name = 'Nouvelle Aventure') {
    const id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare('UPDATE rp_sessions SET status = \'ENDED\' WHERE guild_id = ?').run(guildId);
    db.prepare(`
      INSERT INTO rp_sessions (id, guild_id, name, owner_id, status, created_at)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?)
    `).run(id, guildId, name, ownerId, Date.now());
    return db.prepare('SELECT * FROM rp_sessions WHERE id = ?').get(id);
  }
  static stopSession(guildId) {
    return db.prepare('UPDATE rp_sessions SET status = \'ENDED\' WHERE guild_id = ? AND status = \'ACTIVE\'').run(guildId);
  }
  static rollDice(diceStr = '1d20') {
    const match = diceStr.toLowerCase().match(/^(\d+)d(\d+)([\+\-]\d+)?$/);
    if (!match) {
      const single = Math.floor(Math.random() * 20) + 1;
      return { count: 1, sides: 20, modifier: 0, rolls: [single], total: single };
    }
    const count = Math.min(100, Math.max(1, parseInt(match[1], 10)));
    const sides = Math.min(1000, Math.max(2, parseInt(match[2], 10)));
    const modifier = match[3] ? parseInt(match[3], 10) : 0;
    const rolls = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      rolls.push(r);
      sum += r;
    }
    return { count, sides, modifier, rolls, total: sum + modifier };
  }
  static getStats(guildId) {
    const totalChars = db.prepare('SELECT COUNT(*) as count FROM rp_characters WHERE guild_id = ?').get(guildId).count;
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM rp_sessions WHERE guild_id = ?').get(guildId).count;
    const totalFactions = db.prepare('SELECT COUNT(*) as count FROM rp_factions WHERE guild_id = ?').get(guildId).count;
    const totalQuests = db.prepare('SELECT COUNT(*) as count FROM rp_quests WHERE guild_id = ?').get(guildId).count;
    return { totalChars, totalSessions, totalFactions, totalQuests };
  }
}
module.exports = RoleplayService;
