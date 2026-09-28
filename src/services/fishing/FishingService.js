const { db } = require('../../utils/database');
const FISH_SPECIES = [
  { name: 'Silver Roach', rarity: 'common', baseWeight: 0.3, baseLength: 18, basePrice: 15, spots: ['Peaceful Lake', 'Rushing River'] },
  { name: 'Rainbow Trout', rarity: 'common', baseWeight: 1.8, baseLength: 38, basePrice: 30, spots: ['Rushing River', 'Peaceful Lake'] },
  { name: 'River Barbel', rarity: 'common', baseWeight: 1.5, baseLength: 32, basePrice: 25, spots: ['Whitewater'] },
  { name: 'Common Carp', rarity: 'common', baseWeight: 4.8, baseLength: 55, basePrice: 40, spots: ['Peaceful Lake'] },
  { name: 'Atlantic Mackerel', rarity: 'common', baseWeight: 0.6, baseLength: 28, basePrice: 20, spots: ['Coastal Bay', 'Open Sea'] },
  { name: 'Toothed Pike', rarity: 'uncommon', baseWeight: 6.5, baseLength: 78, basePrice: 90, spots: ['Peaceful Lake', 'Rushing River'] },
  { name: 'Golden Zander', rarity: 'uncommon', baseWeight: 4.2, baseLength: 62, basePrice: 85, spots: ['Peaceful Lake', 'Rushing River'] },
  { name: 'Gilt-head Bream', rarity: 'uncommon', baseWeight: 2.8, baseLength: 42, basePrice: 80, spots: ['Coastal Bay'] },
  { name: 'Wild Salmon', rarity: 'uncommon', baseWeight: 7.5, baseLength: 85, basePrice: 120, spots: ['Rushing River', 'Open Sea'] },
  { name: 'White Sturgeon', rarity: 'rare', baseWeight: 22.0, baseLength: 130, basePrice: 350, spots: ['Rushing River', 'Peaceful Lake'] },
  { name: 'Bluefin Tuna', rarity: 'rare', baseWeight: 50.0, baseLength: 170, basePrice: 480, spots: ['Open Sea'] },
  { name: 'Sailfish', rarity: 'rare', baseWeight: 38.0, baseLength: 190, basePrice: 550, spots: ['Open Sea', 'Abyssal Trench'] },
  { name: 'Monstrous Catfish', rarity: 'epic', baseWeight: 75.0, baseLength: 220, basePrice: 950, spots: ['Peaceful Lake'] },
  { name: 'Hammerhead Shark', rarity: 'epic', baseWeight: 110.0, baseLength: 240, basePrice: 1300, spots: ['Open Sea', 'Abyssal Trench'] },
  { name: 'Giant Manta Ray', rarity: 'epic', baseWeight: 140.0, baseLength: 290, basePrice: 1600, spots: ['Open Sea'] },
  { name: 'Leviathan of the Abyss', rarity: 'legendary', baseWeight: 380.0, baseLength: 480, basePrice: 5500, spots: ['Abyssal Trench'] },
  { name: 'Bioluminescent Ghost Fish', rarity: 'legendary', baseWeight: 15.0, baseLength: 95, basePrice: 7500, spots: ['Fosse Abyssale'] },
  { name: 'Mythical Golden Carp', rarity: 'legendary', baseWeight: 9.5, baseLength: 75, basePrice: 10000, spots: ['Peaceful Lake'] }
];
const FISHING_SPOTS = [
  { name: 'Peaceful Lake', minLevel: 1, desc: 'Calm, reed-fringed waters, ideal for beginners.' },
  { name: 'Whitewater River', minLevel: 2, desc: 'Swift current where energetic trout and salmon swim.' },
  { name: 'Coastal Bay', minLevel: 4, desc: 'A salty, sea-breeze-swept shore teeming with sea bream and saltwater fish.' },
  { name: 'Open Sea', minLevel: 6, desc: 'Deep waters where giant tuna and sharks hunt.' },
  { name: 'Abyssal Trench', minLevel: 10, desc: 'The shadowy depths harboring legendary creatures.' }
];
const RODS = [
  { level: 1, name: 'Driftwood Walking Stick', bonusLuck: 0, cost: 0 },
  { level: 2, name: 'Fiberglass Rod', bonusLuck: 5, cost: 250 },
  { level: 3, name: 'High-Strength Carbon Rod', bonusLuck: 12, cost: 800 },
  { level: 4, name: 'Titanium & Megabass Rod', bonusLuck: 20, cost: 2500 },
  { level: 5, name: 'Celestial Rod of the Ancient Angler', bonusLuck: 35, cost: 8000 }
];
class FishingService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS fishing_profiles (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rod_level INTEGER DEFAULT 1,
        bait_equipped TEXT DEFAULT 'Earth-worm',
        current_spot TEXT DEFAULT 'Peaceful Lake',
        casts_count INTEGER DEFAULT 0,
        fish_caught INTEGER DEFAULT 0,
        fish_sold INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 100,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        rank TEXT DEFAULT 'Sunday Fisherman',
        line_state TEXT DEFAULT 'IDLE', -- IDLE, CASTED
        current_bite TEXT,
        cast_time INTEGER DEFAULT 0,
        aquarium_capacity INTEGER DEFAULT 5,
        PRIMARY KEY (guild_id, user_id)
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS fishing_catches (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        fish_name TEXT NOT NULL,
        rarity TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        length_cm REAL NOT NULL,
        price INTEGER NOT NULL,
        in_aquarium INTEGER DEFAULT 0,
        is_trophy INTEGER DEFAULT 0,
        caught_at INTEGER NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS fishing_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        weather TEXT DEFAULT 'Sunny',
        tide TEXT DEFAULT 'High tide',
        season TEXT DEFAULT 'Spring',
        created_at INTEGER
      );
    `);
  }
  getSettings(guildId) {
    let s = db.prepare('SELECT * FROM fishing_settings WHERE guild_id = ?').get(guildId);
    if (!s) {
      db.prepare('INSERT INTO fishing_settings (guild_id, enabled, weather, tide, season, created_at) VALUES (?, 1, "Sunny", "High tide", "Spring", ?)')
        .run(guildId, Date.now());
      s = db.prepare('SELECT * FROM fishing_settings WHERE guild_id = ?').get(guildId);
    }
    return s;
  }
  updateSettings(guildId, updates = {}) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getSettings(guildId);
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(guildId);
    db.prepare(`UPDATE fishing_settings SET ${setClauses} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  getProfile(guildId, userId) {
    let p = db.prepare('SELECT * FROM fishing_profiles WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    if (!p) {
      db.prepare(`
        INSERT INTO fishing_profiles (guild_id, user_id, rod_level, bait_equipped, current_spot, casts_count, fish_caught, fish_sold, coins, xp, level, rank, line_state, cast_time)
        VALUES (?, ?, 1, 'Earth-worm', 'Peaceful Lake', 0, 0, 0, 100, 0, 1, 'Sunday Fisherman', 'IDLE', 0)
      `).run(guildId, userId);
      p = db.prepare('SELECT * FROM fishing_profiles WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    }
    return p;
  }
  addXp(guildId, userId, amount) {
    const p = this.getProfile(guildId, userId);
    let newXp = p.xp + amount;
    let newLevel = p.level;
    let leveledUp = false;
    let needed = newLevel * 80;
    while (newXp >= needed) {
      newXp -= needed;
      newLevel += 1;
      leveledUp = true;
      needed = newLevel * 80;
    }
    const ranks = ['Sunday Angler', 'Reed Enthusiast', 'Seasoned Angler', 'Master of the Waters', 'Legend of the Oceans'];
    const rankIndex = Math.min(ranks.length - 1, Math.floor(newLevel / 3));
    const newRank = ranks[rankIndex];
    db.prepare('UPDATE fishing_profiles SET xp = ?, level = ?, rank = ? WHERE guild_id = ? AND user_id = ?')
      .run(newXp, newLevel, newRank, guildId, userId);
    return { leveledUp, newLevel, newRank };
  }
  castLine(guildId, userId) {
    const p = this.getProfile(guildId, userId);
    const now = Date.now();
    const available = FISH_SPECIES.filter(f => f.spots.includes(p.current_spot));
    const pool = available.length ? available : FISH_SPECIES;
    const rod = RODS.find(r => r.level === p.rod_level) || RODS[0];
    const luckRoll = Math.random() * 100 + rod.bonusLuck;
    let chosenRarity = 'common';
    if (luckRoll > 95) chosenRarity = 'legendary';
    else if (luckRoll > 80) chosenRarity = 'epic';
    else if (luckRoll > 60) chosenRarity = 'rare';
    else if (luckRoll > 35) chosenRarity = 'uncommon';
    let candidates = pool.filter(f => f.rarity === chosenRarity);
    if (!candidates.length) candidates = pool;
    const baseFish = candidates[Math.floor(Math.random() * candidates.length)];
    const variance = 0.75 + Math.random() * 0.5;
    const weight = +(baseFish.baseWeight * variance).toFixed(2);
    const length = +(baseFish.baseLength * variance).toFixed(1);
    const price = Math.floor(baseFish.basePrice * variance);
    const biteData = {
      name: baseFish.name,
      rarity: baseFish.rarity,
      weight,
      length,
      price
    };
    db.prepare(`
      UPDATE fishing_profiles
      SET line_state = 'CASTED',
          current_bite = ?,
          cast_time = ?,
          casts_count = casts_count + 1
      WHERE guild_id = ? AND user_id = ?
    `).run(JSON.stringify(biteData), now, guildId, userId);
    return { spot: p.current_spot, rod: rod.name };
  }
  reelCatch(guildId, userId) {
    const p = this.getProfile(guildId, userId);
    if (p.line_state !== 'CASTED' || !p.current_bite) {
      return null;
    }
    const fish = JSON.parse(p.current_bite);
    const id = `fish_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO fishing_catches (id, guild_id, user_id, fish_name, rarity, weight_kg, length_cm, price, in_aquarium, is_trophy, caught_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
    `).run(id, guildId, userId, fish.name, fish.rarity, fish.weight, fish.length, fish.price, now);P
    db.prepare(`
      UPDATE fishing_profiles
      SET line_state = 'IDLE',
          current_bite = NULL,
          fish_caught = fish_caught + 1
      WHERE guild_id = ? AND user_id = ?
    `).run(guildId, userId);
    const xpGained = Math.max(10, Math.floor(fish.price / 3));
    const xpRes = this.addXp(guildId, userId, xpGained);
    return {
      fish,
      catchId: id,
      xpGained,
      leveledUp: xpRes.leveledUp,
      newLevel: xpRes.newLevel,
      newRank: xpRes.newRank
    };
  }
  sellCatches(guildId, userId) {
    const catches = db.prepare('SELECT * FROM fishing_catches WHERE guild_id = ? AND user_id = ? AND in_aquarium = 0').all(guildId, userId);
    if (!catches.length) return { count: 0, total: 0 };
    const total = catches.reduce((acc, c) => acc + c.price, 0);
    db.prepare('DELETE FROM fishing_catches WHERE guild_id = ? AND user_id = ? AND in_aquarium = 0').run(guildId, userId);
    db.prepare('UPDATE fishing_profiles SET coins = coins + ?, fish_sold = fish_sold + ? WHERE guild_id = ? AND user_id = ?')
      .run(total, catches.length, guildId, userId);
    return { count: catches.length, total };
  }
  getAquarium(guildId, userId) {
    return db.prepare('SELECT * FROM fishing_catches WHERE guild_id = ? AND user_id = ? AND in_aquarium = 1').all(guildId, userId);
  }
  addToAquarium(guildId, userId, catchId) {
    const p = this.getProfile(guildId, userId);
    const count = db.prepare('SELECT COUNT(*) as c FROM fishing_catches WHERE guild_id = ? AND user_id = ? AND in_aquarium = 1').get(guildId, userId).c;
    if (count >= p.aquarium_capacity) return { success: false, reason: 'capacity_full' };
    const updated = db.prepare('UPDATE fishing_catches SET in_aquarium = 1 WHERE id = ? AND guild_id = ? AND user_id = ?').run(catchId, guildId, userId).changes;
    return { success: updated > 0 };
  }
  getLeaderboard(guildId, limit = 10) {
    return db.prepare(`
      SELECT * FROM fishing_profiles
      WHERE guild_id = ?
      ORDER BY fish_caught DESC, xp DESC
      LIMIT ?
    `).all(guildId, limit);
  }
  getBestCatch(guildId, userId) {
    return db.prepare(`
      SELECT * FROM fishing_catches
      WHERE guild_id = ? AND user_id = ?
      ORDER BY price DESC, weight_kg DESC
      LIMIT 1
    `).get(guildId, userId);
  }
}
module.exports = {
  FishingService: new FishingService(),
  FISH_SPECIES,
  FISHING_SPOTS,
  RODS
};
