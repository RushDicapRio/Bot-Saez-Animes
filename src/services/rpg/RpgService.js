const { db } = require('../../utils/database');
const CLASSES = {
  guerrier: { name: 'Warrior', hp: 120, mana: 30, attack: 18, defense: 14, speed: 8, desc: 'Master of close-quarters combat and the shield.' },
  mage: { name: 'Mage', hp: 80, mana: 100, attack: 22, defense: 6, speed: 10, desc: 'Caster of destructive and arcane spells.' },
  voleur: { name: 'Thief', hp: 90, mana: 40, attack: 19, defense: 8, speed: 18, desc: 'Fast, stealthy, and a specialist in critical hits.' },
  paladin: { name: 'Paladin', hp: 130, mana: 60, attack: 15, defense: 16, speed: 7, desc: 'Holy protector combining sword and sacred magic.' },
  archer: { name: 'Archer', hp: 95, mana: 50, attack: 20, defense: 9, speed: 14, desc: 'Sniper eliminating targets from a distance.' }
};
const RACES = {
  humain: { name: 'Human', bonus: 'Versatile (+5 to all stats)', hp: 5, attack: 2, defense: 2 },
  elfe: { name: 'Elf', bonus: 'Agile and Magical (+10 Mana, +4 Speed)', hp: 0, attack: 3, defense: 1 },
  nain: { name: 'Dwarf', bonus: 'Tough as stone (+20 HP, +5 Defense)', hp: 20, attack: 1, defense: 5 },
  orc: { name: 'Orc', bonus: 'Ruthless Brute Force (+8 Attack)', hp: 10, attack: 8, defense: 0 }
};
const LOCATIONS = [
  { name: 'Val-Étoile Housing Complex', level: 1, desc: 'A secure capital with its guilds, forges, and inns.' },
  { name: 'Misty Forest', level: 2, desc: 'Dense woods inhabited by wild wolves and bandits.' },
  { name: 'Ruins of Aethelgard', level: 5, desc: 'Ancient fortress haunted by specters and stone guardians.' },
  { name: 'Sulphur Caverns', level: 8, desc: 'Volcanic caves inhabited by salamanders and lava golems.' },
  { name: 'Dark Dragon Peak', level: 12, desc: 'Frozen, perilous summit where the legendary dragon sleeps.' }
];
const MONSTERS = [
  { name: 'Goblin Pillager', hp: 45, attack: 8, defense: 2, xp: 25, gold: 15, level: 1 },
  { name: 'Skeletal Wolf', hp: 60, attack: 12, defense: 4, xp: 40, gold: 25, level: 2 },
  { name: 'Masked Bandit', hp: 85, attack: 16, defense: 6, xp: 60, gold: 45, level: 3 },
  { name: 'Revenant Warrior', hp: 120, attack: 22, defense: 10, xp: 110, gold: 80, level: 5 },
  { name: 'Rock Golem', hp: 180, attack: 28, defense: 18, xp: 200, gold: 150, level: 7 },
  { name: 'Wyvern Lord', hp: 300, attack: 42, defense: 22, xp: 450, gold: 350, level: 10 }
];
class RpgService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS rpg_characters (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        title TEXT DEFAULT 'Novice Adventurer',
        class TEXT NOT NULL DEFAULT 'Warrior',
        subclass TEXT DEFAULT 'None',
        race TEXT NOT NULL DEFAULT 'Human',
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        hp INTEGER DEFAULT 100,
        max_hp INTEGER DEFAULT 100,
        mana INTEGER DEFAULT 50,
        max_mana INTEGER DEFAULT 50,
        attack INTEGER DEFAULT 15,
        defense INTEGER DEFAULT 10,
        speed INTEGER DEFAULT 10,
        gold INTEGER DEFAULT 100,
        location TEXT DEFAULT 'Val-Étoile Housing Complex',
        is_active INTEGER DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS rpg_inventories (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        item_type TEXT NOT NULL, -- weapon, armor, potion, material
        rarity TEXT DEFAULT 'common',
        attack_bonus INTEGER DEFAULT 0,
        defense_bonus INTEGER DEFAULT 0,
        is_equipped INTEGER DEFAULT 0,
        quantity INTEGER DEFAULT 1
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS rpg_combats (
        character_id TEXT PRIMARY KEY,
        enemy_name TEXT NOT NULL,
        enemy_hp INTEGER NOT NULL,
        enemy_max_hp INTEGER NOT NULL,
        enemy_attack INTEGER NOT NULL,
        enemy_defense INTEGER NOT NULL,
        reward_xp INTEGER NOT NULL,
        reward_gold INTEGER NOT NULL,
        turn INTEGER DEFAULT 1,
        status TEXT DEFAULT 'ACTIVE',
        log TEXT DEFAULT ''
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS rpg_quests (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        goal INTEGER DEFAULT 1,
        reward_xp INTEGER DEFAULT 50,
        reward_gold INTEGER DEFAULT 30,
        status TEXT DEFAULT 'IN_PROGRESS' -- IN_PROGRESS, COMPLETED
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS rpg_guilds (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        leader_id TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        members_json TEXT DEFAULT '[]',
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS rpg_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        difficulty TEXT DEFAULT 'normal',
        mode TEXT DEFAULT 'standard',
        created_at INTEGER
      );
    `);
  }
  getSettings(guildId) {
    let s = db.prepare('SELECT * FROM rpg_settings WHERE guild_id = ?').get(guildId);
    if (!s) {
      db.prepare('INSERT INTO rpg_settings (guild_id, enabled, difficulty, mode, created_at) VALUES (?, 1, "normal", "standard", ?)')
        .run(guildId, Date.now());
      s = db.prepare('SELECT * FROM rpg_settings WHERE guild_id = ?').get(guildId);
    }
    return s;
  }
  updateSettings(guildId, updates = {}) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getSettings(guildId);
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(guildId);
    db.prepare(`UPDATE rpg_settings SET ${setClauses} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  getCharacter(guildId, userId) {
    return db.prepare('SELECT * FROM rpg_characters WHERE guild_id = ? AND user_id = ? AND is_active = 1').get(guildId, userId) || null;
  }
  createCharacter(guildId, userId, name, className = 'warrior', raceName = 'human') {
    const clsKey = (className || 'warrior').toLowerCase();
    const raceKey = (raceName || 'human').toLowerCase();
    const cls = CLASSES[clsKey] || CLASSES.guerrier;
    const race = RACES[raceKey] || RACES.humain;
    const id = `char_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    const maxHp = cls.hp + (race.hp || 0);
    const attack = cls.attack + (race.attack || 0);
    const defense = cls.defense + (race.defense || 0);
    db.prepare('UPDATE rpg_characters SET is_active = 0 WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
    db.prepare(`
      INSERT INTO rpg_characters (
        id, guild_id, user_id, name, title, class, subclass, race, level, xp, hp, max_hp, mana, max_mana,
        attack, defense, speed, gold, location, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'Aventurier Novice', ?, 'Aucune', ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, 150, 'Val-Étoile Housing Complex', 1, ?, ?)
    `).run(id, guildId, userId, name.trim(), cls.name, race.name, maxHp, maxHp, cls.mana, cls.mana, attack, defense, cls.speed, now, now);
    this.addItem(id, 'Épée d’Entraînement', 'weapon', 'common', 5, 0, 1);
    this.addItem(id, 'Tunique de Cuir', 'armor', 'common', 0, 4, 1);
    this.addItem(id, 'Potion de Soin Mineure', 'potion', 'common', 0, 0, 0, 3);
    return this.getCharacter(guildId, userId);
  }
  addXp(charId, amount) {
    const char = db.prepare('SELECT * FROM rpg_characters WHERE id = ?').get(charId);
    if (!char) return null;
    let newXp = char.xp + amount;
    let newLevel = char.level;
    let leveledUp = false;
    let needed = newLevel * 100;
    while (newXp >= needed) {
      newXp -= needed;
      newLevel += 1;
      leveledUp = true;
      needed = newLevel * 100;
    }
    if (leveledUp) {
      const hpGain = 15;
      const atkGain = 3;
      const defGain = 2;
      db.prepare(`
        UPDATE rpg_characters
        SET level = ?, xp = ?, max_hp = max_hp + ?, hp = max_hp + ?, attack = attack + ?, defense = defense + ?
        WHERE id = ?
      `).run(newLevel, newXp, hpGain, hpGain, atkGain, defGain, charId);
    } else {
      db.prepare('UPDATE rpg_characters SET xp = ? WHERE id = ?').run(newXp, charId);
    }
    return { leveledUp, newLevel, newXp };
  }
  getInventory(charId) {
    return db.prepare('SELECT * FROM rpg_inventories WHERE character_id = ?').all(charId);
  }
  addItem(charId, name, type, rarity = 'common', atk = 0, def = 0, equip = 0, qty = 1) {
    const existing = db.prepare('SELECT * FROM rpg_inventories WHERE character_id = ? AND item_name = ?').get(charId, name);
    if (existing && type === 'potion') {
      db.prepare('UPDATE rpg_inventories SET quantity = quantity + ? WHERE id = ?').run(qty, existing.id);
      return existing.id;
    }
    const id = `item_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO rpg_inventories (id, character_id, item_name, item_type, rarity, attack_bonus, defense_bonus, is_equipped, quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, charId, name, type, rarity, atk, def, equip, qty);
    return id;
  }
  getActiveCombat(charId) {
    return db.prepare('SELECT * FROM rpg_combats WHERE character_id = ? AND status = "ACTIVE"').get(charId) || null;
  }
  startCombat(charId, monsterData = null) {
    const m = monsterData || MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
    db.prepare(`
      INSERT OR REPLACE INTO rpg_combats (character_id, enemy_name, enemy_hp, enemy_max_hp, enemy_attack, enemy_defense, reward_xp, reward_gold, turn, status, log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'ACTIVE', ?)
    `).run(charId, m.name, m.hp, m.hp, m.attack, m.defense || 2, m.xp, m.gold, `A ${m.name} appears before you !`);
    return this.getActiveCombat(charId);
  }
  attackTurn(charId) {
    const combat = this.getActiveCombat(charId);
    if (!combat) return null;
    const char = db.prepare('SELECT * FROM rpg_characters WHERE id = ?').get(charId);
    if (!char) return null;
    const playerDamage = Math.max(1, Math.floor(char.attack * (0.85 + Math.random() * 0.3)) - combat.enemy_defense);
    const newEnemyHp = Math.max(0, combat.enemy_hp - playerDamage);
    let log = `⚔️ You attack the **${combat.enemy_name}** and deal **${playerDamage} damage** !`;
    if (newEnemyHp <= 0) {
      db.prepare('UPDATE rpg_combats SET enemy_hp = 0, status = "WON" WHERE character_id = ?').run(charId);
      db.prepare('UPDATE rpg_characters SET gold = gold + ? WHERE id = ?').run(combat.reward_gold, charId);
      const xpRes = this.addXp(charId, combat.reward_xp);
      return {
        finished: true,
        won: true,
        playerDamage,
        newEnemyHp: 0,
        playerHp: char.hp,
        rewardXp: combat.reward_xp,
        rewardGold: combat.reward_gold,
        leveledUp: xpRes?.leveledUp,
        newLevel: xpRes?.newLevel,
        log
      };
    }
    const enemyDamage = Math.max(1, Math.floor(combat.enemy_attack * (0.85 + Math.random() * 0.3)) - char.defense);
    const newPlayerHp = Math.max(0, char.hp - enemyDamage);
    db.prepare('UPDATE rpg_characters SET hp = ? WHERE id = ?').run(newPlayerHp, charId);
    log += `\n💥 The **${combat.enemy_name}** strikes back and deals **${enemyDamage} damage** to you !`;
    if (newPlayerHp <= 0) {
      db.prepare('UPDATE rpg_combats SET status = "DEFEATED" WHERE character_id = ?').run(charId);
      db.prepare('UPDATE rpg_characters SET hp = max_hp / 2, location = "Val-Étoile Housing Complex" WHERE id = ?').run(charId);
      return {
        finished: true,
        won: false,
        playerDamage,
        enemyDamage,
        playerHp: 0,
        log: log + '\n💀 You fell in battle and were repatriated to the capital.'
      };
    }
    db.prepare('UPDATE rpg_combats SET enemy_hp = ?, turn = turn + 1, log = ? WHERE character_id = ?')
      .run(newEnemyHp, log, charId);
    return {
      finished: false,
      playerDamage,
      enemyDamage,
      enemyHp: newEnemyHp,
      enemyMaxHp: combat.enemy_max_hp,
      playerHp: newPlayerHp,
      playerMaxHp: char.max_hp,
      turn: combat.turn + 1,
      log
    };
  }
  fleeCombat(charId) {
    const combat = this.getActiveCombat(charId);
    if (!combat) return false;
    db.prepare('UPDATE rpg_combats SET status = "FLED" WHERE character_id = ?').run(charId);
    return true;
  }
  explore(charId) {
    const char = db.prepare('SELECT * FROM rpg_characters WHERE id = ?').get(charId);
    if (!char) return null;
    const roll = Math.random();
    if (roll < 0.5) {
      const combat = this.startCombat(charId);
      return { type: 'combat', combat };
    } else if (roll < 0.8) {
      const goldFound = Math.floor(15 + Math.random() * 40);
      db.prepare('UPDATE rpg_characters SET gold = gold + ? WHERE id = ?').run(goldFound, charId);
      return { type: 'treasure', gold: goldFound };
    } else {
      const xpFound = Math.floor(10 + Math.random() * 25);
      this.addXp(charId, xpFound);
      return { type: 'discovery', xp: xpFound };
    }
  }
  getLeaderboard(guildId, limit = 10) {
    return db.prepare(`
      SELECT * FROM rpg_characters
      WHERE guild_id = ? AND is_active = 1
      ORDER BY level DESC, xp DESC
      LIMIT ?
    `).all(guildId, limit);
  }
}
module.exports = {
  RpgService: new RpgService(),
  CLASSES,
  RACES,
  LOCATIONS,
  MONSTERS
};
