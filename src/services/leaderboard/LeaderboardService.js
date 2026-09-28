const dbManager = require('../../utils/database');
class LeaderboardService {
  constructor() {
    this.db = dbManager.db;
  }
  getLeaderboard(guildId, category = 'xp', limit = 10, offset = 0) {
    if (category === 'xp' || category === 'level' || category === 'messages') {
      let orderCol = 'xp';
      if (category === 'level') orderCol = 'level DESC, xp';
      if (category === 'messages') orderCol = 'messages_count';
      return this.db.prepare(`
        SELECT user_id, xp, level, messages_count,
               RANK() OVER (ORDER BY ${orderCol} DESC) as rank
        FROM user_levels
        WHERE guild_id = ?
        ORDER BY ${orderCol} DESC
        LIMIT ? OFFSET ?
      `).all(guildId, limit, offset);
    }
    if (category === 'giveaways' || category === 'giveaway-wins') {
      return this.db.prepare(`
        SELECT gw.user_id, COUNT(*) as wins_count,
               RANK() OVER (ORDER BY COUNT(*) DESC) as rank
        FROM giveaway_winners gw
        JOIN giveaways g ON gw.giveaway_id = g.id
        WHERE g.guild_id = ?
        GROUP BY gw.user_id
        ORDER BY wins_count DESC
        LIMIT ? OFFSET ?
      `).all(guildId, limit, offset);
    }
    return this.db.prepare(`
      SELECT user_id, points,
             RANK() OVER (ORDER BY points DESC) as rank
      FROM leaderboard_points
      WHERE guild_id = ? AND category = ?
      ORDER BY points DESC
      LIMIT ? OFFSET ?
    `).all(guildId, category, limit, offset);
  }
  getUserRank(guildId, userId, category = 'xp') {
    const list = this.getLeaderboard(guildId, category, 1000, 0);
    const found = list.find(u => u.user_id === userId);
    if (!found) {
      return { rank: 'Uncategorized', score: 0, total: list.length };
    }
    return {
      rank: found.rank,
      data: found,
      total: list.length,
      percentile: Math.max(1, Math.round(((list.length - found.rank + 1) / list.length) * 100))
    };
  }
  getNearby(guildId, userId, category = 'xp', radius = 2) {
    const list = this.getLeaderboard(guildId, category, 1000, 0);
    const idx = list.findIndex(u => u.user_id === userId);
    if (idx === -1) return [];
    const start = Math.max(0, idx - radius);
    const end = Math.min(list.length, idx + radius + 1);
    return list.slice(start, end);
  }
  addPoints(guildId, userId, category, amount) {
    const existing = this.db.prepare('SELECT points FROM leaderboard_points WHERE guild_id = ? AND user_id = ? AND category = ?').get(guildId, userId, category);
    const newPts = (existing ? existing.points : 0) + amount;
    this.db.prepare(`
      INSERT OR REPLACE INTO leaderboard_points (guild_id, user_id, category, points, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(guildId, userId, category, newPts, Date.now());
    return newPts;
  }
  setPoints(guildId, userId, category, amount) {
    this.db.prepare(`
      INSERT OR REPLACE INTO leaderboard_points (guild_id, user_id, category, points, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(guildId, userId, category, amount, Date.now());
    return amount;
  }
  createSnapshot(guildId, category = 'xp') {
    const data = this.getLeaderboard(guildId, category, 50, 0);
    const id = 'snap_' + Math.random().toString(36).substring(2, 9);
    this.db.prepare(`
      INSERT INTO leaderboard_snapshots (id, guild_id, category, data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, category, JSON.stringify(data), Date.now());
    return { id, count: data.length };
  }
  getActiveSeason(guildId) {
    return this.db.prepare("SELECT * FROM leaderboard_seasons WHERE guild_id = ? AND status = 'active' ORDER BY start_time DESC LIMIT 1").get(guildId) || null;
  }
}
module.exports = new LeaderboardService();
