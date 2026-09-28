const { db } = require('../../utils/database');
const crypto = require('crypto');
class CasinoService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS casino_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        min_bet INTEGER DEFAULT 10,
        max_bet INTEGER DEFAULT 50000,
        daily_bonus INTEGER DEFAULT 500,
        jackpot_pool INTEGER DEFAULT 25000,
        cooldown_seconds INTEGER DEFAULT 3,
        house_edge_percent REAL DEFAULT 2.5,
        anti_cheat INTEGER DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS casino_profiles (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        chips INTEGER DEFAULT 1000,
        total_wagered INTEGER DEFAULT 0,
        total_won INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        daily_streak INTEGER DEFAULT 0,
        last_daily INTEGER DEFAULT 0,
        biggest_win INTEGER DEFAULT 0,
        favorite_game TEXT DEFAULT 'slots',
        badges_json TEXT DEFAULT '[]',
        PRIMARY KEY (guild_id, user_id)
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS casino_history (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        game TEXT NOT NULL,
        bet INTEGER NOT NULL,
        payout INTEGER NOT NULL,
        result TEXT NOT NULL,
        details TEXT,
        timestamp INTEGER NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS casino_jackpot (
        guild_id TEXT PRIMARY KEY,
        current_amount INTEGER DEFAULT 25000,
        last_winner_id TEXT,
        last_winner_amount INTEGER DEFAULT 0,
        last_won_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS casino_tournaments (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        game TEXT NOT NULL,
        entry_fee INTEGER DEFAULT 100,
        prize_pool INTEGER DEFAULT 1000,
        status TEXT DEFAULT 'OPEN',
        participants_json TEXT DEFAULT '[]',
        scores_json TEXT DEFAULT '{}',
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS casino_wheels (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slices_json TEXT NOT NULL,
        cost INTEGER DEFAULT 100,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS casino_teams (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        leader_id TEXT NOT NULL,
        members_json TEXT DEFAULT '[]',
        total_score INTEGER DEFAULT 0
      );
    `);
  }
  getSettings(guildId) {
    let s = db.prepare('SELECT * FROM casino_settings WHERE guild_id = ?').get(guildId);
    if (!s) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO casino_settings (guild_id, enabled, min_bet, max_bet, daily_bonus, jackpot_pool, cooldown_seconds, house_edge_percent, anti_cheat, created_at, updated_at)
        VALUES (?, 1, 10, 50000, 500, 25000, 3, 2.5, 1, ?, ?)
      `).run(guildId, now, now);
      s = db.prepare('SELECT * FROM casino_settings WHERE guild_id = ?').get(guildId);
    }
    return s;
  }
  updateSettings(guildId, updates = {}) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getSettings(guildId);
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), guildId);
    db.prepare(`UPDATE casino_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  getProfile(guildId, userId) {
    let p = db.prepare('SELECT * FROM casino_profiles WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    if (!p) {
      db.prepare(`
        INSERT INTO casino_profiles (guild_id, user_id, chips, total_wagered, total_won, games_played, games_won, daily_streak, last_daily, biggest_win, favorite_game, badges_json)
        VALUES (?, ?, 1000, 0, 0, 0, 0, 0, 0, 0, 'slots', '[]')
      `).run(guildId, userId);
      p = db.prepare('SELECT * FROM casino_profiles WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    }
    return p;
  }
  addChips(guildId, userId, amount) {
    const amt = Math.max(0, parseInt(amount, 10) || 0);
    this.getProfile(guildId, userId);
    db.prepare('UPDATE casino_profiles SET chips = chips + ? WHERE guild_id = ? AND user_id = ?').run(amt, guildId, userId);
    return this.getProfile(guildId, userId);
  }
  removeChips(guildId, userId, amount) {
    const amt = Math.max(0, parseInt(amount, 10) || 0);
    const p = this.getProfile(guildId, userId);
    const newChips = Math.max(0, p.chips - amt);
    db.prepare('UPDATE casino_profiles SET chips = ? WHERE guild_id = ? AND user_id = ?').run(newChips, guildId, userId);
    return this.getProfile(guildId, userId);
  }
  recordGame(guildId, userId, gameName, bet, payout, resultStatus, details = '') {
    const p = this.getProfile(guildId, userId);
    const isWin = payout > bet;
    const winAmount = Math.max(0, payout - bet);
    const newBiggest = Math.max(p.biggest_win, winAmount);
    db.prepare(`
      UPDATE casino_profiles
      SET chips = chips - ? + ?,
          total_wagered = total_wagered + ?,
          total_won = total_won + ?,
          games_played = games_played + 1,
          games_won = games_won + ?,
          biggest_win = ?,
          favorite_game = ?
      WHERE guild_id = ? AND user_id = ?
    `).run(bet, payout, bet, payout, isWin ? 1 : 0, newBiggest, gameName, guildId, userId);
    const historyId = `csn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO casino_history (id, guild_id, user_id, game, bet, payout, result, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(historyId, guildId, userId, gameName, bet, payout, resultStatus, details, Date.now());
    this.addToJackpot(guildId, Math.max(1, Math.floor(bet * 0.01)));
    return this.getProfile(guildId, userId);
  }
  getJackpot(guildId) {
    let j = db.prepare('SELECT * FROM casino_jackpot WHERE guild_id = ?').get(guildId);
    if (!j) {
      db.prepare(`
        INSERT INTO casino_jackpot (guild_id, current_amount, last_winner_id, last_winner_amount, last_won_at)
        VALUES (?, 25000, NULL, 0, NULL)
      `).run(guildId);
      j = db.prepare('SELECT * FROM casino_jackpot WHERE guild_id = ?').get(guildId);
    }
    return j;
  }
  addToJackpot(guildId, amount) {
    this.getJackpot(guildId);
    db.prepare('UPDATE casino_jackpot SET current_amount = current_amount + ? WHERE guild_id = ?').run(amount, guildId);
  }
  resetJackpot(guildId, newBase = 25000) {
    this.getJackpot(guildId);
    db.prepare('UPDATE casino_jackpot SET current_amount = ? WHERE guild_id = ?').run(newBase, guildId);
    return this.getJackpot(guildId);
  }
  winJackpot(guildId, userId) {
    const j = this.getJackpot(guildId);
    const amount = j.current_amount;
    db.prepare(`
      UPDATE casino_jackpot
      SET current_amount = 25000,
          last_winner_id = ?,
          last_winner_amount = ?,
          last_won_at = ?
      WHERE guild_id = ?
    `).run(userId, amount, Date.now(), guildId);
    this.addChips(guildId, userId, amount);
    return amount;
  }
  claimDaily(guildId, userId) {
    const p = this.getProfile(guildId, userId);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const diff = now - p.last_daily;
    if (diff < oneDay) {
      const remainingHours = Math.ceil((oneDay - diff) / (60 * 60 * 1000));
      return { success: false, remainingHours };
    }
    let streak = p.daily_streak;
    if (diff < oneDay * 2) {
      streak += 1;
    } else {
      streak = 1;
    }
    const baseBonus = this.getSettings(guildId).daily_bonus;
    const bonusMultiplier = Math.min(3, 1 + streak * 0.1);
    const totalAmount = Math.floor(baseBonus * bonusMultiplier);
    db.prepare(`
      UPDATE casino_profiles
      SET chips = chips + ?,
          daily_streak = ?,
          last_daily = ?
      WHERE guild_id = ? AND user_id = ?
    `).run(totalAmount, streak, now, guildId, userId);
    return { success: true, amount: totalAmount, streak, newTotal: p.chips + totalAmount };
  }
  playSlots(guildId, userId, bet) {
    const symbols = [
      { sym: '🍒', weight: 40, mult: 2 },
      { sym: '🍋', weight: 30, mult: 3 },
      { sym: '🍇', weight: 20, mult: 5 },
      { sym: '🔔', weight: 10, mult: 10 },
      { sym: '⭐', weight: 5, mult: 25 },
      { sym: '💎', weight: 3, mult: 50 },
      { sym: '7️⃣', weight: 1, mult: 100 }
    ];
    const pickSymbol = () => {
      const totalWeight = symbols.reduce((acc, s) => acc + s.weight, 0);
      let rand = Math.random() * totalWeight;
      for (const s of symbols) {
        if (rand < s.weight) return s;
        rand -= s.weight;
      }
      return symbols[0];
    };
    const s1 = pickSymbol();
    const s2 = pickSymbol();
    const s3 = pickSymbol();
    let multiplier = 0;
    let isWin = false;
    if (s1.sym === s2.sym && s2.sym === s3.sym) {
      multiplier = s1.mult;
      isWin = true;
    } else if (s1.sym === s2.sym || s2.sym === s3.sym || s1.sym === s3.sym) {
      const matched = s1.sym === s2.sym ? s1 : s3;
      multiplier = 1.5;
      isWin = true;
    }
    const payout = Math.floor(bet * multiplier);
    this.recordGame(guildId, userId, 'slots', bet, payout, isWin ? 'WIN' : 'LOSE', `${s1.sym} | ${s2.sym} | ${s3.sym}`);
    return {
      reels: [s1.sym, s2.sym, s3.sym],
      isWin,
      multiplier,
      payout,
      net: payout - bet
    };
  }
  playRoulette(guildId, userId, bet, betType, betValue = '') {
    const rolledNumber = Math.floor(Math.random() * 37); // 0 à 36
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const isRed = redNumbers.includes(rolledNumber);
    const isBlack = rolledNumber !== 0 && !isRed;
    const isEven = rolledNumber !== 0 && rolledNumber % 2 === 0;
    const isOdd = rolledNumber !== 0 && rolledNumber % 2 !== 0;
    let isWin = false;
    let multiplier = 0;
    const type = betType.toLowerCase();
    if (type === 'red' || type === 'rouge') {
      if (isRed) { isWin = true; multiplier = 2; }
    } else if (type === 'black' || type === 'noir') {
      if (isBlack) { isWin = true; multiplier = 2; }
    } else if (type === 'even' || type === 'pair') {
      if (isEven) { isWin = true; multiplier = 2; }
    } else if (type === 'odd' || type === 'impair') {
      if (isOdd) { isWin = true; multiplier = 2; }
    } else if (type === 'number' || !isNaN(parseInt(type, 10))) {
      const num = parseInt(betValue || type, 10);
      if (num === rolledNumber) { isWin = true; multiplier = 36; }
    }
    const payout = Math.floor(bet * multiplier);
    const colorStr = rolledNumber === 0 ? 'Green 🟢' : (isRed ? 'Red 🔴' : 'Black ⚫');
    this.recordGame(guildId, userId, 'roulette', bet, payout, isWin ? 'WIN' : 'LOSE', `Draw : ${rolledNumber} (${colorStr})`);
    return {
      rolledNumber,
      color: colorStr,
      isWin,
      multiplier,
      payout,
      net: payout - bet
    };
  }
  playBlackjack(guildId, userId, bet) {
    const drawCard = () => {
      const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
      return cards[Math.floor(Math.random() * cards.length)];
    };
    let p1 = drawCard();
    let p2 = drawCard();
    let playerTotal = p1 + p2;
    if (playerTotal === 22) playerTotal = 12; // Deux As
    let d1 = drawCard();
    let d2 = drawCard();
    let dealerTotal = d1 + d2;
    if (dealerTotal === 22) dealerTotal = 12;
    while (dealerTotal < 17) {
      const card = drawCard();
      dealerTotal += card;
      if (dealerTotal > 21 && card === 11) dealerTotal -= 10;
    }
    let isWin = false;
    let isDraw = false;
    let multiplier = 0;
    let message = '';
    if (playerTotal === 21) {
      isWin = true;
      multiplier = 2.5; 
      message = 'Natural Blackjack ! 🃏';
    } else if (dealerTotal > 21) {
      isWin = true;
      multiplier = 2;
      message = 'The dealer busts ! 💥';
    } else if (playerTotal > dealerTotal) {
      isWin = true;
      multiplier = 2;
      message = 'Victory against the dealer ! ✨';
    } else if (playerTotal === dealerTotal) {
      isDraw = true;
      multiplier = 1;
      message = 'Tie (Push) ! 🤝';
    } else {
      isWin = false;
      message = 'The bank wins. 🏦';
    }

    const payout = Math.floor(bet * multiplier);
    this.recordGame(guildId, userId, 'blackjack', bet, payout, isWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSE'), `Player : ${playerTotal} | Bank : ${dealerTotal}`);
    return {
      playerTotal,
      dealerTotal,
      isWin,
      isDraw,
      multiplier,
      payout,
      net: payout - bet,
      message
    };
  }
  playCoinflip(guildId, userId, bet, choice) {
    const roll = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin = (choice.toLowerCase() === 'heads' || choice.toLowerCase() === 'face' || choice.toLowerCase() === 'pile')
      ? (choice.toLowerCase().includes('pile') ? roll === 'tails' : roll === 'heads')
      : (Math.random() < 0.5);
    const multiplier = isWin ? 2 : 0;
    const payout = Math.floor(bet * multiplier);
    const sideName = roll === 'heads' ? 'Face 🪙' : 'Stack 🪙';
    this.recordGame(guildId, userId, 'coinflip', bet, payout, isWin ? 'WIN' : 'LOSE', `Result : ${sideName}`);
    return {
      roll: sideName,
      isWin,
      multiplier,
      payout,
      net: payout - bet
    };
  }
  playDice(guildId, userId, bet, guessType = 'over', target = 7) {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    let isWin = false;
    let multiplier = 0;
    if (guessType === 'over' || guessType === 'plus') {
      if (total > target) { isWin = true; multiplier = 2; }
    } else if (guessType === 'under' || guessType === 'moins') {
      if (total < target) { isWin = true; multiplier = 2; }
    } else if (guessType === 'exact' || guessType === 'egal') {
      if (total === target) { isWin = true; multiplier = 5; }
    } else if (guessType === 'doubles' || guessType === 'double') {
      if (d1 === d2) { isWin = true; multiplier = 4; }
    } else {
      if (total >= 7) { isWin = true; multiplier = 2; }
    }
    const payout = Math.floor(bet * multiplier);
    this.recordGame(guildId, userId, 'dice', bet, payout, isWin ? 'WIN' : 'LOSE', `Dés : [${d1}, ${d2}] = ${total}`);
    return {
      d1,
      d2,
      total,
      isWin,
      multiplier,
      payout,
      net: payout - bet
    };
  }
  spinWheel(guildId, userId) {
    const slices = [
      { label: '0 Jetons', reward: 0, weight: 30 },
      { label: '50 Jetons', reward: 50, weight: 25 },
      { label: '100 Jetons', reward: 100, weight: 20 },
      { label: '250 Jetons', reward: 250, weight: 12 },
      { label: '500 Jetons', reward: 500, weight: 8 },
      { label: '1,000 Jetons', reward: 1000, weight: 4 },
      { label: 'JACKPOT 🌟', reward: 5000, weight: 1 }
    ];
    const totalWeight = slices.reduce((a, s) => a + s.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = slices[0];
    for (const s of slices) {
      if (rand < s.weight) {
        chosen = s;
        break;
      }
      rand -= s.weight;
    }
    thiS.addChips(guildId, userId, chosen.reward);
    this.recordGame(guildId, userId, 'wheel', 50, chosen.reward, chosen.reward > 0 ? 'WIN' : 'LOSE', chosen.label);
    return chosen;
  }
  getLeaderboard(guildId, limit = 10) {
    return db.prepare('SELECT * FROM casino_profiles WHERE guild_id = ? ORDER BY chips DESC LIMIT ?').all(guildId, limit);
  }
  getHistory(guildId, userId = null, limit = 10) {
    if (userId) {
      return db.prepare('SELECT * FROM casino_history WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, userId, limit);
    }
    return db.prepare('SELECT * FROM casino_history WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
}
module.exports = new CasinoService();
