const { db } = require('../../utils/database');
class CryptoService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS crypto_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        default_currency TEXT DEFAULT 'USD',
        default_exchange TEXT DEFAULT 'Binance',
        alerts_channel_id TEXT,
        role_analyst_id TEXT,
        chart_theme TEXT DEFAULT 'dark',
        debug_mode INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS crypto_wallets (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        address TEXT NOT NULL,
        chain TEXT DEFAULT 'ETH',
        label TEXT,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS crypto_portfolios (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT DEFAULT 'Principal',
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS crypto_portfolio_assets (
        id TEXT PRIMARY KEY,
        portfolio_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        amount REAL NOT NULL,
        buy_price REAL NOT NULL,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS crypto_watchlists (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS crypto_alerts (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        target_price REAL NOT NULL,
        condition TEXT DEFAULT 'above',
        active INTEGER DEFAULT 1,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS crypto_cache (
        key TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS crypto_stats (
        guild_id TEXT PRIMARY KEY,
        request_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        last_request INTEGER
      );
    `);
  }
  getSettings(guildId) {
    let settings = db.prepare('SELECT * FROM crypto_settings WHERE guild_id = ?').get(guildId);
    if (!settings) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO crypto_settings (
          guild_id, enabled, default_currency, default_exchange, chart_theme, debug_mode, created_at, updated_at
        ) VALUES (?, 1, 'USD', 'Binance', 'dark', 0, ?, ?)
      `).run(guildId, now, now);
      settings = db.prepare('SELECT * FROM crypto_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE crypto_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  resetSettings(guildId) {
    db.prepare('DELETE FROM crypto_settings WHERE guild_id = ?').run(guildId);
    return this.getSettings(guildId);
  }
  recordRequest(guildId, isError = false) {
    const now = Date.now();
    const existing = db.prepare('SELECT * FROM crypto_stats WHERE guild_id = ?').get(guildId);
    if (existing) {
      if (isError) {
        db.prepare('UPDATE crypto_stats SET request_count = request_count + 1, error_count = error_count + 1, last_request = ? WHERE guild_id = ?').run(now, guildId);
      } else {
        db.prepare('UPDATE crypto_stats SET request_count = request_count + 1, last_request = ? WHERE guild_id = ?').run(now, guildId);
      }
    } else {
      db.prepare('INSERT INTO crypto_stats (guild_id, request_count, error_count, last_request) VALUES (?, 1, ?, ?)').run(guildId, isError ? 1 : 0, now);
    }
  }
  getStats(guildId) {
    let row = db.prepare('SELECT * FROM crypto_stats WHERE guild_id = ?').get(guildId);
    if (!row) row = { request_count: 0, error_count: 0, last_request: null };
    const portfoliosCount = db.prepare('SELECT COUNT(*) as c FROM crypto_portfolios WHERE guild_id = ?').get(guildId).c;
    const walletsCount = db.prepare('SELECT COUNT(*) as c FROM crypto_wallets WHERE guild_id = ?').get(guildId).c;
    const alertsCount = db.prepare('SELECT COUNT(*) as c FROM crypto_alerts WHERE guild_id = ? AND active = 1').get(guildId).c;
    return { ...row, portfoliosCount, walletsCount, alertsCount };
  }

  // --- CRYPTO MARKET ENGINE ---
  getCoinData(symbolOrName = 'BTC') {
    const sym = symbolOrName.toUpperCase().trim() || 'BTC';
    const knownCoins = {
      'BTC': { name: 'Bitcoin', price: 92450.00, change24h: 3.45, change7d: 8.12, change30d: 14.50, rank: 1, mcap: '1.82T', vol24h: '48.2B', ath: 99800.00, atl: 67.81, supply: '19.78M', maxSupply: '21.00M', dominance: '56.4%', icon: '₿' },
      'ETH': { name: 'Ethereum', price: 3420.50, change24h: 2.15, change7d: 5.60, change30d: 11.20, rank: 2, mcap: '412.5B', vol24h: '24.1B', ath: 4891.70, atl: 0.42, supply: '120.4M', maxSupply: 'Illimité', dominance: '14.8%', icon: 'Ξ' },
      'SOL': { name: 'Solana', price: 185.30, change24h: -1.20, change7d: 12.40, change30d: 22.80, rank: 3, mcap: '87.1B', vol24h: '7.8B', ath: 260.06, atl: 0.50, supply: '468.2M', maxSupply: 'Illimité', dominance: '3.2%', icon: '◎' },
      'BNB': { name: 'Binance Coin', price: 645.20, change24h: 0.85, change7d: 3.10, change30d: 7.45, rank: 4, mcap: '94.3B', vol24h: '1.9B', ath: 720.67, atl: 0.096, supply: '146.1M', maxSupply: '200M', dominance: '3.4%', icon: '🔶' },
      'XRP': { name: 'Ripple', price: 1.45, change24h: 4.80, change7d: 18.90, change30d: 45.20, rank: 5, mcap: '82.5B', vol24h: '8.4B', ath: 3.84, atl: 0.0028, supply: '56.8B', maxSupply: '100B', dominance: '2.9%', icon: '✕' },
      'ADA': { name: 'Cardano', price: 0.78, change24h: -0.45, change7d: 6.30, change30d: 18.10, rank: 9, mcap: '28.1B', vol24h: '1.4B', ath: 3.10, atl: 0.017, supply: '35.7B', maxSupply: '45B', dominance: '1.0%', icon: '₳' },
      'DOGE': { name: 'Dogecoin', price: 0.28, change24h: 5.60, change7d: 14.20, change30d: 38.40, rank: 7, mcap: '41.2B', vol24h: '5.2B', ath: 0.737, atl: 0.000085, supply: '147.2B', maxSupply: 'Illimité', dominance: '1.5%', icon: '🐕' },
      'AVAX': { name: 'Avalanche', price: 34.50, change24h: 1.80, change7d: 9.40, change30d: 15.60, rank: 11, mcap: '14.2B', vol24h: '850M', ath: 146.22, atl: 2.79, supply: '407M', maxSupply: '720M', dominance: '0.5%', icon: '🔺' },
      'DOT': { name: 'Polkadot', price: 7.20, change24h: 0.30, change7d: 4.10, change30d: 9.80, rank: 15, mcap: '10.5B', vol24h: '420M', ath: 55.00, atl: 2.69, supply: '1.45B', maxSupply: 'Illimité', dominance: '0.4%', icon: '●' },
      'LINK': { name: 'Chainlink', price: 18.40, change24h: 2.90, change7d: 11.20, change30d: 24.50, rank: 14, mcap: '11.2B', vol24h: '920M', ath: 52.88, atl: 0.126, supply: '608M', maxSupply: '1B', dominance: '0.4%', icon: '⬡' },
      'PEPE': { name: 'Pepe', price: 0.0000185, change24h: 8.40, change7d: 25.10, change30d: 65.40, rank: 21, mcap: '7.8B', vol24h: '2.1B', ath: 0.000025, atl: 0.000000055, supply: '420.69T', maxSupply: '420.69T', dominance: '0.3%', icon: '🐸' },
      'SUI': { name: 'Sui', price: 3.42, change24h: 6.10, change7d: 21.40, change30d: 55.80, rank: 18, mcap: '9.8B', vol24h: '1.7B', ath: 3.92, atl: 0.364, supply: '2.85B', maxSupply: '10B', dominance: '0.3%', icon: '💧' },
      'NEAR': { name: 'NEAR Protocol', price: 6.80, change24h: 3.10, change7d: 15.20, change30d: 28.40, rank: 19, mcap: '8.2B', vol24h: '890M', ath: 20.42, atl: 0.526, supply: '1.21B', maxSupply: 'Illimité', dominance: '0.3%', icon: 'Ⓝ' },
      'RENDER': { name: 'Render', price: 8.15, change24h: 4.50, change7d: 16.80, change30d: 32.10, rank: 28, mcap: '4.2B', vol24h: '650M', ath: 13.60, atl: 0.26, supply: '518M', maxSupply: '536M', dominance: '0.2%', icon: '🎨' },
      'USDT': { name: 'Tether', price: 1.00, change24h: 0.01, change7d: 0.02, change30d: 0.01, rank: 3, mcap: '132.5B', vol24h: '85.4B', ath: 1.32, atl: 0.57, supply: '132.5B', maxSupply: 'Illimité', dominance: '4.8%', icon: '💵' }
    };
    if (knownCoins[sym]) {
      return { symbol: sym, ...knownCoins[sym] };
    }
    let hash = 0;
    for (let i = 0; i < sym.length; i++) hash = (hash << 5) - hash + sym.charCodeAt(i);
    const seed = Math.abs(hash);
    const p = Math.max(0.0001, (seed % 500) + ((seed % 100) / 100));
    return {
      symbol: sym,
      name: `${sym} Token`,
      price: p,
      change24h: ((seed % 20) - 9.5).toFixed(2),
      change7d: ((seed % 40) - 15).toFixed(2),
      change30d: ((seed % 80) - 25).toFixed(2),
      rank: (seed % 400) + 50,
      mcap: `${(p * 10).toFixed(1)}M`,
      vol24h: `${(p * 2).toFixed(1)}M`,
      ath: (p * 2.5).toFixed(2),
      atl: (p * 0.1).toFixed(4),
      supply: '100M',
      maxSupply: '100M',
      dominance: '<0.1%',
      icon: '🪙'
    };
  }
  getMarketOverview() {
    return {
      totalMarketCap: '3.25T $',
      totalVolume24h: '168.4B $',
      btcDominance: '56.4%',
      ethDominance: '14.8%',
      fearAndGreedIndex: 78,
      fearAndGreedSentiment: 'Extreme Greed 🤑',
      gasGwei: 18,
      activeCryptos: 14250,
      topGainer: { symbol: 'PEPE', change: '+8.4%' },
      topLoser: { symbol: 'SOL', change: '-1.2%' }
    };
  }
  getOrCreatePortfolio(guildId, userId, name = 'Principal') {
    let p = db.prepare('SELECT * FROM crypto_portfolios WHERE guild_id = ? AND user_id = ? AND name = ?').get(guildId, userId, name);
    if (!p) {
      const id = `ptf_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare('INSERT INTO crypto_portfolios (id, guild_id, user_id, name, created_at) VALUES (?, ?, ?, ?, ?)').run(id, guildId, userId, name, Date.now());
      p = db.prepare('SELECT * FROM crypto_portfolios WHERE id = ?').get(id);
    }
    return p;
  }
  addPortfolioAsset(portfolioId, symbol, amount, buyPrice) {
    const id = `ast_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO crypto_portfolio_assets (id, portfolio_id, symbol, amount, buy_price, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, portfolioId, symbol.toUpperCase().trim(), amount, buyPrice, Date.now());
    return true;
  }
  getPortfolioAssets(portfolioId) {
    return db.prepare('SELECT * FROM crypto_portfolio_assets WHERE portfolio_id = ?').all(portfolioId);
  }
  calculatePortfolio(portfolioId) {
    const assets = this.getPortfolioAssets(portfolioId);
    let totalInvested = 0;
    let totalCurrent = 0;
    const details = [];
    for (const a of assets) {
      const coin = this.getCoinData(a.symbol);
      const invested = a.amount * a.buy_price;
      const current = a.amount * coin.price;
      const pnl = current - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
      totalInvested += invested;
      totalCurrent += current;
      details.push({
        symbol: a.symbol,
        amount: a.amount,
        buyPrice: a.buy_price,
        currentPrice: coin.price,
        invested,
        current,
        pnl,
        pnlPercent
      });
    }
    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, totalPnL, totalPnLPercent, details };
  }
  addWallet(guildId, userId, address, chain = 'ETH', label = '') {
    const id = `wlt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO crypto_wallets (id, guild_id, user_id, address, chain, label, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, address, chain.toUpperCase(), label || 'My Wallet', Date.now());
    return id;
  }
  getWallets(guildId, userId) {
    return db.prepare('SELECT * FROM crypto_wallets WHERE guild_id = ? AND user_id = ?').all(guildId, userId);
  }
  deleteWallet(guildId, userId, addressOrId) {
    db.prepare('DELETE FROM crypto_wallets WHERE guild_id = ? AND user_id = ? AND (id = ? OR address = ?)').run(guildId, userId, addressOrId, addressOrId);
    return true;
  }
  addToWatchlist(guildId, userId, symbol) {
    const id = `${guildId}_${userId}_${symbol.toUpperCase().trim()}`;
    db.prepare('INSERT OR REPLACE INTO crypto_watchlists (id, guild_id, user_id, symbol, created_at) VALUES (?, ?, ?, ?, ?)').run(id, guildId, userId, symbol.toUpperCase().trim(), Date.now());
    return true;
  }
  removeFromWatchlist(guildId, userId, symbol) {
    db.prepare('DELETE FROM crypto_watchlists WHERE guild_id = ? AND user_id = ? AND symbol = ?').run(guildId, userId, symbol.toUpperCase().trim());
    return true;
  }
  getWatchlist(guildId, userId) {
    return db.prepare('SELECT symbol FROM crypto_watchlists WHERE guild_id = ? AND user_id = ?').all(guildId, userId);
  }
  createAlert(guildId, userId, symbol, targetPrice, condition = 'above') {
    const id = `alt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO crypto_alerts (id, guild_id, user_id, symbol, target_price, condition, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, guildId, userId, symbol.toUpperCase().trim(), targetPrice, condition, Date.now());
    return id;
  }
  getAlerts(guildId, userId) {
    return db.prepare('SELECT * FROM crypto_alerts WHERE guild_id = ? AND user_id = ? AND active = 1').all(guildId, userId);
  }
  deleteAlert(guildId, alertId) {
    db.prepare('DELETE FROM crypto_alerts WHERE guild_id = ? AND id = ?').run(guildId, alertId);
    return true;
  }
}
module.exports = new CryptoService();
