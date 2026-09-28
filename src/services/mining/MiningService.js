const { db } = require('../../utils/database');
const ORES = [
  { name: 'Pierre Brute', rarity: 'common', type: 'ore', minDepth: 0, maxDepth: 200, price: 5 },
  { name: 'Fossil Coal', rarity: 'common', type: 'ore', minDepth: 5, maxDepth: 300, price: 15 },
  { name: 'Copper Ore', rarity: 'common', type: 'ore', minDepth: 15, maxDepth: 400, price: 30 },
  { name: 'Iron ore', rarity: 'common', type: 'ore', minDepth: 30, maxDepth: 600, price: 45 },
  { name: 'Silver Ore', rarity: 'uncommon', type: 'ore', minDepth: 80, maxDepth: 800, price: 90 },
  { name: 'Native Gold Nugget', rarity: 'uncommon', type: 'ore', minDepth: 120, maxDepth: 1200, price: 150 },
  { name: 'Crystalline Rose Quartz', rarity: 'uncommon', type: 'crystal', minDepth: 100, maxDepth: 1000, price: 110 },
  { name: 'Dark Amethyst', rarity: 'uncommon', type: 'crystal', minDepth: 150, maxDepth: 1200, price: 140 },
  { name: 'Perfect Emerald', rarity: 'rare', type: 'gem', minDepth: 250, maxDepth: 2000, price: 350 },
  { name: 'Deep Sapphire', rarity: 'rare', type: 'gem', minDepth: 350, maxDepth: 2200, price: 480 },
  { name: 'Blazing Ruby', rarity: 'rare', type: 'gem', minDepth: 450, maxDepth: 2500, price: 600 },
  { name: 'Giant Ammonite Fossil', rarity: 'rare', type: 'fossil', minDepth: 200, maxDepth: 1500, price: 500 },
  { name: 'Rough Diamond', rarity: 'epic', type: 'gem', minDepth: 600, maxDepth: 3500, price: 1300 },
  { name: 'Shimmering Mithril', rarity: 'epic', type: 'ore', minDepth: 800, maxDepth: 4000, price: 1800 },
  { name: 'Incandescent Obsidian', rarity: 'epic', type: 'crystal', minDepth: 1000, maxDepth: 4500, price: 2100 },
  { name: 'Forgotten Dwarven Relic', rarity: 'epic', type: 'artifact', minDepth: 750, maxDepth: 3000, price: 2500 },
  { name: 'Cosmic Adamantine', rarity: 'legendary', type: 'ore', minDepth: 1500, maxDepth: 9999, price: 6000 },
  { name: 'Raw Infinity Stone', rarity: 'legendary', type: 'crystal', minDepth: 2200, maxDepth: 9999, price: 12000 },
  { name: 'Magmatic-Tectonic Core', rarity: 'legendary', type: 'artifact', minDepth: 3000, maxDepth: 9999, price: 25000 }
];
const MINING_ZONES = [
  { name: 'Surface Quarry', minLevel: 1, minDepth: 0, maxDepth: 80, desc: 'Sandy spoil tip and open-pit quarries.' },
  { name: 'Underground Galleries', minLevel: 2, minDepth: 80, maxDepth: 300, desc: 'Network of old mines shored up with wooden beams.' },
  { name: 'Crystal Caverns', minLevel: 4, minDepth: 300, maxDepth: 800, desc: 'Sparkling cavities rich in geodes and gemstones.' },
  { name: 'Magmatic Faults', minLevel: 7, minDepth: 800, maxDepth: 1800, desc: 'Searing volcanic fissures where precious ores lie dormant.' },
  { name: 'Heart of the Abyss', minLevel: 10, minDepth: 1800, maxDepth: 9999, desc: 'Extreme depths resonating with the heartbeats of the Earth.' }
];
const PICKAXES = [
  { level: 1, name: 'Chipped Stone Pickaxe', bonusLuck: 0, cost: 0 },
  { level: 2, name: 'Wrought Iron Pickaxe', bonusLuck: 8, cost: 350 },
  { level: 3, name: 'Hardened Steel Pickaxe', bonusLuck: 16, cost: 1200 },
  { level: 4, name: 'Pneumatic Diamond Drill', bonusLuck: 28, cost: 4000 },
  { level: 5, name: 'Quantum Plasma Excavator', bonusLuck: 45, cost: 12000 }
];
class MiningService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS mining_profiles (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        depth INTEGER DEFAULT 10,
        max_depth INTEGER DEFAULT 10,
        pickaxe_level INTEGER DEFAULT 1,
        backpack_capacity INTEGER DEFAULT 30,
        lantern_level INTEGER DEFAULT 1,
        stamina INTEGER DEFAULT 100,
        max_stamina INTEGER DEFAULT 100,
        coins INTEGER DEFAULT 150,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        rank TEXT DEFAULT 'Rock Hunter',
        current_zone TEXT DEFAULT 'Surface Quarry',
        workers_count INTEGER DEFAULT 0,
        automation_enabled INTEGER DEFAULT 0,
        last_idle_claim INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS mining_inventories (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        ore_name TEXT NOT NULL,
        ore_type TEXT NOT NULL,
        rarity TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price INTEGER NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS mining_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER
      );
    `);
  }
  getSettings(guildId) {
    let s = db.prepare('SELECT * FROM mining_settings WHERE guild_id = ?').get(guildId);
    if (!s) {
      db.prepare('INSERT INTO mining_settings (guild_id, enabled, created_at) VALUES (?, 1, ?)')
        .run(guildId, Date.now());
      s = db.prepare('SELECT * FROM mining_settings WHERE guild_id = ?').get(guildId);
    }
    return s;
  }
  updateSettings(guildId, updates = {}) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getSettings(guildId);
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(guildId);
    db.prepare(`UPDATE mining_settings SET ${setClauses} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  getProfile(guildId, userId) {
    let p = db.prepare('SELECT * FROM mining_profiles WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    if (!p) {
      db.prepare(`
        INSERT INTO mining_profiles (guild_id, user_id, depth, max_depth, pickaxe_level, backpack_capacity, lantern_level, stamina, max_stamina, coins, xp, level, rank, current_zone, workers_count, automation_enabled, last_idle_claim)
        VALUES (?, ?, 10, 10, 1, 30, 1, 100, 100, 150, 0, 1, 'Rock Hunter', 'Surface Quarry', 0, 0, ?)
      `).run(guildId, userId, Date.now());
      p = db.prepare('SELECT * FROM mining_profiles WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    }
    return p;
  }
  addXp(guildId, userId, amount) {
    const p = this.getProfile(guildId, userId);
    let newXp = p.xp + amount;
    let newLevel = p.level;
    let leveledUp = false;
    let needed = newLevel * 90;
    while (newXp >= needed) {
      newXp -= needed;
      newLevel += 1;
      leveledUp = true;
      needed = newLevel * 90;
    }
    const ranks = ['Stone Seeker', 'Deep-Level Miner', 'Gallery Artisan', 'Master Driller', 'Lord of the Depths'];
    const rankIndex = Math.min(ranks.length - 1, Math.floor(newLevel / 3));
    const newRank = ranks[rankIndex];
    db.prepare('UPDATE mining_profiles SET xp = ?, level = ?, rank = ? WHERE guild_id = ? AND user_id = ?')
      .run(newXp, newLevel, newRank, guildId, userId);
    return { leveledUp, newLevel, newRank };
  }
  mine(guildId, userId) {
    const p = this.getProfile(guildId, userId);
    if (p.stamina < 10) {
      return { success: false, reason: 'no_stamina' };
    }
    const pickaxe = PICKAXES.find(r => r.level === p.pickaxe_level) || PICKAXES[0];
    const depthGained = Math.floor(3 + Math.random() * 8);
    const newDepth = p.depth + depthGained;
    const newMaxDepth = Math.max(p.max_depth, newDepth);
    const zone = MINING_ZONES.slice().reverse().find(z => newDepth >= z.minDepth) || MINING_ZONES[0];
    const eligible = ORES.filter(o => newDepth >= o.minDepth);
    const luckRoll = Math.random() * 100 + pickaxe.bonusLuck;
    let targetRarity = 'common';
    if (luckRoll > 95) targetRarity = 'legendary';
    else if (luckRoll > 80) targetRarity = 'epic';
    else if (luckRoll > 60) targetRarity = 'rare';
    else if (luckRoll > 35) targetRarity = 'uncommon';
    let candidates = eligible.filter(o => o.rarity === targetRarity);
    if (!candidates.length) candidates = eligible.length ? eligible : ORES;
    const minedOre = candidates[Math.floor(Math.random() * candidates.length)];
    const qty = Math.floor(1 + Math.random() * 3);
    const existing = db.prepare('SELECT * FROM mining_inventories WHERE guild_id = ? AND user_id = ? AND ore_name = ?')
      .get(guildId, userId, minedOre.name);
    if (existing) {
      db.prepare('UPDATE mining_inventories SET quantity = quantity + ? WHERE id = ?').run(qty, existing.id);
    } else {
      const id = `ore_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO mining_inventories (id, guild_id, user_id, ore_name, ore_type, rarity, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, guildId, userId, minedOre.name, minedOre.type, minedOre.rarity, qty, minedOre.price);
    }
    db.prepare(`
      UPDATE mining_profiles
      SET depth = ?, max_depth = ?, current_zone = ?, stamina = stamina - 10
      WHERE guild_id = ? AND user_id = ?
    `).run(newDepth, newMaxDepth, zone.name, guildId, userId);
    const xpGained = Math.max(10, Math.floor(minedOre.price * qty * 0.4));
    const xpRes = this.addXp(guildId, userId, xpGained);
    return {
      success: true,
      ore: minedOre,
      quantity: qty,
      depthGained,
      currentDepth: newDepth,
      zoneName: zone.name,
      xpGained,
      leveledUp: xpRes.leveledUp,
      newLevel: xpRes.newLevel,
      newRank: xpRes.newRank
    };
  }
  getInventory(guildId, userId) {
    return db.prepare('SELECT * FROM mining_inventories WHERE guild_id = ? AND user_id = ?').all(guildId, userId);
  }
  sellOres(guildId, userId) {
    const inv = this.getInventory(guildId, userId);
    if (!inv.length) return { count: 0, total: 0 };
    const total = inv.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const count = inv.reduce((sum, item) => sum + item.quantity, 0);
    db.prepare('DELETE FROM mining_inventories WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
    db.prepare('UPDATE mining_profiles SET coins = coins + ? WHERE guild_id = ? AND user_id = ?').run(total, guildId, userId);
    return { count, total };
  }
  refineOres(guildId, userId) {
    const inv = this.getInventory(guildId, userId);
    if (!inv.length) return { count: 0, bonus: 0 };
    let totalValue = 0;
    for (const item of inv) {
      const refinedPrice = Math.floor(item.unit_price * 1.35);
      db.prepare('UPDATE mining_inventories SET unit_price = ? WHERE id = ?').run(refinedPrice, item.id);
      totalValue += refinedPrice * item.quantity;
    }
    return { count: inv.length, bonus: 35 };
  }
  getLeaderboard(guildId, limit = 10) {
    return db.prepare(`
      SELECT * FROM mining_profiles
      WHERE guild_id = ?
      ORDER BY max_depth DESC, level DESC
      LIMIT ?
    `).all(guildId, limit);
  }
}
module.exports = {
  MiningService: new MiningService(),
  ORES,
  MINING_ZONES,
  PICKAXES
};
