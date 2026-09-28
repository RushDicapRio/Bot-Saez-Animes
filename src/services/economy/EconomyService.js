const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS economy_settings (
    guild_id TEXT PRIMARY KEY,
    currency_name TEXT NOT NULL DEFAULT 'Pieces',
    currency_symbol TEXT NOT NULL DEFAULT '🪙',
    default_balance INTEGER NOT NULL DEFAULT 500,
    daily_amount INTEGER NOT NULL DEFAULT 250,
    weekly_amount INTEGER NOT NULL DEFAULT 1500,
    monthly_amount INTEGER NOT NULL DEFAULT 6000,
    work_min INTEGER NOT NULL DEFAULT 50,
    work_max INTEGER NOT NULL DEFAULT 150,
    work_cooldown_sec INTEGER NOT NULL DEFAULT 3600,
    bank_interest_rate REAL NOT NULL DEFAULT 0.02,
    enabled INTEGER NOT NULL DEFAULT 1,
    maintenance INTEGER NOT NULL DEFAULT 0,
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS economy_wallets (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    wallet INTEGER NOT NULL DEFAULT 500,
    bank INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_daily INTEGER NOT NULL DEFAULT 0,
    last_weekly INTEGER NOT NULL DEFAULT 0,
    last_monthly INTEGER NOT NULL DEFAULT 0,
    last_work INTEGER NOT NULL DEFAULT 0,
    job_id TEXT DEFAULT 'novice',
    job_xp INTEGER NOT NULL DEFAULT 0,
    networth INTEGER NOT NULL DEFAULT 500,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS economy_transactions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    from_user_id TEXT,
    to_user_id TEXT,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'DEPOSIT', 'WITHDRAW', 'TRANSFER', 'PAY', 'DAILY', 'WEEKLY', 'WORK', 'SHOP', 'ADMIN', 'LOTTERY'
    reason TEXT NOT NULL DEFAULT 'Transaction standard',
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS economy_jobs (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    base_salary INTEGER NOT NULL DEFAULT 100,
    required_xp INTEGER NOT NULL DEFAULT 0,
    cooldown_seconds INTEGER NOT NULL DEFAULT 3600
  );
  CREATE TABLE IF NOT EXISTS economy_inventory (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    equipped INTEGER NOT NULL DEFAULT 0,
    acquired_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS economy_shop_items (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    stock INTEGER NOT NULL DEFAULT -1, -- -1 = infini
    discount_percent INTEGER NOT NULL DEFAULT 0,
    buyable INTEGER NOT NULL DEFAULT 1,
    sellable INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS economy_market_offers (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN'
  );
  CREATE TABLE IF NOT EXISTS economy_businesses (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    balance INTEGER NOT NULL DEFAULT 1000,
    revenue INTEGER NOT NULL DEFAULT 0,
    expenses INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS economy_properties (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    property_type TEXT NOT NULL,
    name TEXT NOT NULL,
    value INTEGER NOT NULL,
    rent_income INTEGER NOT NULL DEFAULT 50,
    upgrade_level INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS economy_bounties (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reward_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS economy_lottery (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    jackpot INTEGER NOT NULL DEFAULT 10000,
    ticket_price INTEGER NOT NULL DEFAULT 50,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    ended_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS economy_lottery_tickets (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    lottery_id TEXT NOT NULL,
    ticket_count INTEGER NOT NULL DEFAULT 1,
    bought_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS economy_loans (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    remaining INTEGER NOT NULL,
    interest_rate REAL NOT NULL DEFAULT 0.05,
    due_at INTEGER NOT NULL
  );
`);
class EconomyService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM economy_settings WHERE guild_id = ?').get(guildId);
    if (row) return row;
    db.prepare('INSERT OR IGNORE INTO economy_settings (guild_id) VALUES (?)').run(guildId);
    return db.prepare('SELECT * FROM economy_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE economy_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static getWallet(guildId, userId) {
    let row = db.prepare('SELECT * FROM economy_wallets WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    if (!row) {
      const settings = this.getSettings(guildId);
      db.prepare(`
        INSERT INTO economy_wallets (guild_id, user_id, wallet, bank, streak_days, last_daily, last_weekly, last_monthly, last_work, job_id, job_xp, networth, updated_at)
        VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 'novice', 0, ?, ?)
      `).run(guildId, userId, settings.default_balance, settings.default_balance, Date.now());
      row = db.prepare('SELECT * FROM economy_wallets WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    }
    row.networth = row.wallet + row.bank;
    return row;
  }
  static addMoney(guildId, userId, amount, where = 'wallet') {
    const w = this.getWallet(guildId, userId);
    const amt = Math.max(0, parseInt(amount, 10) || 0);
    if (where === 'bank') {
      db.prepare('UPDATE economy_wallets SET bank = bank + ?, networth = wallet + bank + ?, updated_at = ? WHERE guild_id = ? AND user_id = ?')
        .run(amt, amt, Date.now(), guildId, userId);
    } else {
      db.prepare('UPDATE economy_wallets SET wallet = wallet + ?, networth = wallet + ? + bank, updated_at = ? WHERE guild_id = ? AND user_id = ?')
        .run(amt, amt, Date.now(), guildId, userId);
    }
    return this.getWallet(guildId, userId);
  }
  static removeMoney(guildId, userId, amount, where = 'wallet') {
    const w = this.getWallet(guildId, userId);
    const amt = Math.max(0, parseInt(amount, 10) || 0);
    if (where === 'bank') {
      const newBank = Math.max(0, w.bank - amt);
      db.prepare('UPDATE economy_wallets SET bank = ?, networth = wallet + ?, updated_at = ? WHERE guild_id = ? AND user_id = ?')
        .run(newBank, newBank, Date.now(), guildId, userId);
    } else {
      const newWallet = Math.max(0, w.wallet - amt);
      db.prepare('UPDATE economy_wallets SET wallet = ?, networth = ? + bank, updated_at = ? WHERE guild_id = ? AND user_id = ?')
        .run(newWallet, newWallet, Date.now(), guildId, userId);
    }
    return this.getWallet(guildId, userId);
  }
  static deposit(guildId, userId, amount) {
    const w = this.getWallet(guildId, userId);
    const amt = amount === 'all' ? w.wallet : Math.min(w.wallet, Math.max(0, parseInt(amount, 10) || 0));
    if (amt <= 0) return { success: false, amount: 0, wallet: w };
    this.removeMoney(guildId, userId, amt, 'wallet');
    this.addMoney(guildId, userId, amt, 'bank');
    this.logTransaction(guildId, userId, null, amt, 'DEPOSIT', 'Bank deposit');
    return { success: true, amount: amt, wallet: this.getWallet(guildId, userId) };
  }
  static withdraw(guildId, userId, amount) {
    const w = this.getWallet(guildId, userId);
    const amt = amount === 'all' ? w.bank : Math.min(w.bank, Math.max(0, parseInt(amount, 10) || 0));
    if (amt <= 0) return { success: false, amount: 0, wallet: w };
    this.removeMoney(guildId, userId, amt, 'bank');
    this.addMoney(guildId, userId, amt, 'wallet');
    this.logTransaction(guildId, null, userId, amt, 'WITHDRAW', 'Bank withdrawal');
    return { success: true, amount: amt, wallet: this.getWallet(guildId, userId) };
  }
  static transferMoney(guildId, fromUserId, toUserId, amount, reason = 'Funds transfer') {
    const fromW = this.getWallet(guildId, fromUserId);
    const amt = Math.max(0, parseInt(amount, 10) || 0);
    if (fromW.wallet < amt || amt <= 0) return { success: false, error: 'Insufficient funds' };
    this.removeMoney(guildId, fromUserId, amt, 'wallet');
    this.addMoney(guildId, toUserId, amt, 'wallet');
    this.logTransaction(guildId, fromUserId, toUserId, amt, 'TRANSFER', reason);
    return { success: true, amount: amt };
  }
  static claimDaily(guildId, userId) {
    const w = this.getWallet(guildId, userId);
    const settings = this.getSettings(guildId);
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    if (now - w.last_daily < cooldownMs) {
      const remainingMs = cooldownMs - (now - w.last_daily);
      return { success: false, remainingMs, amount: 0 };
    }
    const streak = (now - w.last_daily < cooldownMs * 2) ? w.streak_days + 1 : 1;
    const bonus = Math.min(500, (streak - 1) * 25);
    const totalGain = settings.daily_amount + bonus;
    this.addMoney(guildId, userId, totalGain, 'wallet');
    db.prepare('UPDATE economy_wallets SET streak_days = ?, last_daily = ? WHERE guild_id = ? AND user_id = ?')
      .run(streak, now, guildId, userId);
    this.logTransaction(guildId, null, userId, totalGain, 'DAILY', `Daily reward (Série : ${streak}j)`);
    return { success: true, amount: totalGain, streak, wallet: this.getWallet(guildId, userId) };
  }
  static claimWork(guildId, userId) {
    const w = this.getWallet(guildId, userId);
    const settings = this.getSettings(guildId);
    const now = Date.now();
    const cooldownMs = (settings.work_cooldown_sec || 3600) * 1000;
    if (now - w.last_work < cooldownMs) {
      const remainingMs = cooldownMs - (now - w.last_work);
      return { success: false, remainingMs, amount: 0 };
    }
    const earned = Math.floor(Math.random() * (settings.work_max - settings.work_min + 1)) + settings.work_min;
    this.addMoney(guildId, userId, earned, 'wallet');
    db.prepare('UPDATE economy_wallets SET last_work = ?, job_xp = job_xp + 10 WHERE guild_id = ? AND user_id = ?')
      .run(now, guildId, userId);
    this.logTransaction(guildId, null, userId, earned, 'WORK', 'Wages');
    return { success: true, amount: earned, wallet: this.getWallet(guildId, userId) };
  }
  static logTransaction(guildId, fromUserId, toUserId, amount, type, reason) {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO economy_transactions (id, guild_id, from_user_id, to_user_id, amount, type, reason, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, fromUserId, toUserId, amount, type, reason, Date.now());
    return id;
  }
  static getTransactions(guildId, userId = null, limit = 10) {
    if (userId) {
      return db.prepare('SELECT * FROM economy_transactions WHERE guild_id = ? AND (from_user_id = ? OR to_user_id = ?) ORDER BY timestamp DESC LIMIT ?').all(guildId, userId, userId, limit);
    }
    return db.prepare('SELECT * FROM economy_transactions WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  static getLeaderboard(guildId, limit = 10) {
    return db.prepare(`
      SELECT user_id, wallet, bank, (wallet + bank) as networth,
             RANK() OVER (ORDER BY (wallet + bank) DESC) as user_rank
      FROM economy_wallets
      WHERE guild_id = ?
      ORDER BY networth DESC
      LIMIT ?
    `).all(guildId, limit);
  }
  static getShopItems(guildId) {
    const items = db.prepare('SELECT * FROM economy_shop_items WHERE guild_id = ? ORDER BY price ASC').all(guildId);
    if (items.length > 0) return items;
    const defaults = [
      { id: 'item_apple', name: 'Golden Apple', description: 'Restores energy and boosts your gains.', price: 100, category: 'Consommable' },
      { id: 'item_pickaxe', name: 'Diamond Pickaxe', description: 'Increases your work earnings by 25%.', price: 1500, category: 'Outil' },
      { id: 'item_shield', name: 'Anti-Theft Shield', description: 'Protects your wallet for 24 hours.', price: 800, category: 'Défense' },
      { id: 'item_car', name: 'Sports car', description: 'Prestigious luxury vehicle.', price: 25000, category: 'Véhicule' },
      { id: 'item_mansion', name: 'Luxurious Villa', description: 'Income-generating real estate property.', price: 100000, category: 'Immobilier' }
    ];
    for (const def of defaults) {
      db.prepare(`
        INSERT OR IGNORE INTO economy_shop_items (id, guild_id, item_id, name, description, price, category, stock, discount_percent, buyable, sellable)
        VALUES (?, ?, ?, ?, ?, ?, ?, -1, 0, 1, 1)
      `).run(`${guildId}_${def.id}`, guildId, def.id, def.name, def.description, def.price, def.category);
    }
    return db.prepare('SELECT * FROM economy_shop_items WHERE guild_id = ? ORDER BY price ASC').all(guildId);
  }
  static getInventory(guildId, userId) {
    return db.prepare('SELECT * FROM economy_inventory WHERE guild_id = ? AND user_id = ? ORDER BY acquired_at DESC').all(guildId, userId);
  }
}
module.exports = EconomyService;
