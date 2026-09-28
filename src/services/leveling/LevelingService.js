const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS leveling_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    xp_rate REAL NOT NULL DEFAULT 1.0,
    formula_type TEXT NOT NULL DEFAULT 'exponential', -- 'linear', 'exponential', 'custom'
    min_msg_xp INTEGER NOT NULL DEFAULT 15,
    max_msg_xp INTEGER NOT NULL DEFAULT 25,
    msg_cooldown INTEGER NOT NULL DEFAULT 60, -- secondes
    voice_rate REAL NOT NULL DEFAULT 10.0, -- XP per minute of voice communication
    voice_cooldown INTEGER NOT NULL DEFAULT 60,
    levelup_channel_id TEXT DEFAULT NULL,
    levelup_message TEXT DEFAULT '🎉 Bravo {user}! You've reached **Level {level}** !',
    levelup_embed INTEGER NOT NULL DEFAULT 1,
    levelup_role_id TEXT DEFAULT NULL,
    max_level INTEGER NOT NULL DEFAULT 200,
    bots_xp INTEGER NOT NULL DEFAULT 0,
    maintenance INTEGER NOT NULL DEFAULT 0,
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS leveling_rewards (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    reward_type TEXT NOT NULL DEFAULT 'role', -- 'role', 'badge', 'tier', 'custom'
    reward_value TEXT NOT NULL,
    reward_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS leveling_boosts (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'server', 'role', 'channel', 'user', 'event'
    target_id TEXT,
    multiplier REAL NOT NULL DEFAULT 1.5,
    expires_at INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS leveling_streaks (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_active INTEGER NOT NULL DEFAULT 0,
    bonus_multiplier REAL NOT NULL DEFAULT 1.0,
    PRIMARY KEY (guild_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS leveling_badges (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT NOT NULL DEFAULT '🏅',
    unlocked_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS leveling_cards (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    theme TEXT DEFAULT 'dark',
    background_url TEXT DEFAULT NULL,
    accent_color TEXT DEFAULT '#5865F2',
    font TEXT DEFAULT 'Inter',
    layout TEXT DEFAULT 'standard',
    PRIMARY KEY (guild_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS leveling_exclusions (
    guild_id TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'role', 'channel', 'user'
    target_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, target_type, target_id)
  );
  CREATE TABLE IF NOT EXISTS leveling_prestige (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    prestige_level INTEGER NOT NULL DEFAULT 0,
    rebirth_count INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS leveling_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    timestamp INTEGER NOT NULL
  );
`);
class LevelingService {
  static xpNeededForNextLevel(level, formulaType = 'exponential') {
    if (formulaType === 'linear') {
      return 100 + (level * 50);
    }
    return Math.floor(5 * (level ** 2) + (50 * level) + 100);
  }
  static totalXpForLevel(level, formulaType = 'exponential') {
    let total = 0;
    for (let l = 0; l < level; l++) {
      total += this.xpNeededForNextLevel(l, formulaType);
    }
    return total;
  }
  static getLevelData(totalXp, formulaType = 'exponential', maxLevel = 200) {
    let level = 0;
    let accumulated = 0;
    while (level < maxLevel) {
      const needed = this.xpNeededForNextLevel(level, formulaType);
      if (accumulated + needed > totalXp) {
        const currentLevelXp = Math.max(0, totalXp - accumulated);
        const progressPercentage = Math.min(100, Math.max(0, Math.floor((currentLevelXp / needed) * 100)));
        return {
          level,
          totalXp,
          currentLevelXp,
          xpNeededForNext: needed,
          progressPercentage,
          nextLevelTotalXp: accumulated + needed
        };
      }
      accumulated += needed;
      level++;
    }
    return {
      level: maxLevel,
      totalXp,
      currentLevelXp: totalXp - accumulated,
      xpNeededForNext: this.xpNeededForNextLevel(maxLevel, formulaType),
      progressPercentage: 100,
      nextLevelTotalXp: accumulated
    };
  }
  static createProgressBar(current, max, size = 14) {
    if (max <= 0) return `[${'█'.repeat(size)}] 100%`;
    const percentage = Math.min(1, Math.max(0, current / max));
    const progress = Math.round(size * percentage);
    const emptyProgress = Math.max(0, size - progress);
    const filledBar = '█'.repeat(progress);
    const emptyBar = '░'.repeat(emptyProgress);
    return `[${filledBar}${emptyBar}] ${Math.floor(percentage * 100)}%`;
  }
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM leveling_settings WHERE guild_id = ?').get(guildId);
    if (row) return row;
    db.prepare(`
      INSERT OR IGNORE INTO leveling_settings (guild_id) VALUES (?)
    `).run(guildId);
    return db.prepare('SELECT * FROM leveling_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE leveling_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static getUserData(guildId, userId) {
    const raw = dbManager.getUser(guildId, userId);
    const settings = this.getSettings(guildId);
    const levelInfo = this.getLevelData(raw.xp, settings.formula_type, settings.max_level);
    const rank = this.getUserRank(guildId, userId);
    const prestige = this.getPrestige(guildId, userId);
    return {
      guildId,
      userId,
      xp: raw.xp,
      level: levelInfo.level,
      messagesCount: raw.messages_count,
      currentLevelXp: levelInfo.currentLevelXp,
      xpNeededForNext: levelInfo.xpNeededForNext,
      progressPercentage: levelInfo.progressPercentage,
      rank,
      prestigeLevel: prestige.prestige_level,
      rebirthCount: prestige.rebirth_count
    };
  }
  static getUserRank(guildId, userId) {
    const res = db.prepare(`
      WITH ranked AS (
        SELECT user_id, RANK() OVER (ORDER BY xp DESC) as user_rank
        FROM user_levels
        WHERE guild_id = ?
      )
      SELECT user_rank FROM ranked WHERE user_id = ?
    `).get(guildId, userId);

    return res ? res.user_rank : 1;
  }
  static setXp(guildId, userId, newXp) {
    const settings = this.getSettings(guildId);
    const levelInfo = this.getLevelData(Math.max(0, newXp), settings.formula_type, settings.max_level);
    dbManager.setUserXpAndLevel(guildId, userId, Math.max(0, newXp), levelInfo.level);
    this.logAudit(guildId, userId, 'SET_XP', null, `${newXp}`);
    return this.getUserData(guildId, userId);
  }
  static addXp(guildId, userId, amount) {
    const current = this.getUserData(guildId, userId);
    const newXp = Math.max(0, current.xp + amount);
    return this.setXp(guildId, userId, newXp);
  }
  static setLevel(guildId, userId, level) {
    const settings = this.getSettings(guildId);
    const targetXp = this.totalXpForLevel(level, settings.formula_type);
    dbManager.setUserXpAndLevel(guildId, userId, targetXp, level);
    this.logAudit(guildId, userId, 'SET_LEVEL', null, `${level}`);
    return this.getUserData(guildId, userId);
  }
  static getLeaderboard(guildId, limit = 10, offset = 0) {
    return db.prepare(`
      SELECT user_id, xp, level, messages_count,
             RANK() OVER (ORDER BY xp DESC) as user_rank
      FROM user_levels
      WHERE guild_id = ?
      ORDER BY xp DESC
      LIMIT ? OFFSET ?
    `).all(guildId, limit, offset);
  }
  static getNearbyUsers(guildId, userId, range = 3) {
    const myRank = this.getUserRank(guildId, userId);
    const minRank = Math.max(1, myRank - range);
    const maxRank = myRank + range;
    return db.prepare(`
      WITH ranked AS (
        SELECT user_id, xp, level, messages_count,
               RANK() OVER (ORDER BY xp DESC) as user_rank
        FROM user_levels
        WHERE guild_id = ?
      )
      SELECT * FROM ranked
      WHERE user_rank BETWEEN ? AND ?
      ORDER BY user_rank ASC
    `).all(guildId, minRank, maxRank);
  }
  static getActiveBoosts(guildId) {
    const now = Date.now();
    return db.prepare(`
      SELECT * FROM leveling_boosts
      WHERE guild_id = ? AND (expires_at IS NULL OR expires_at > ?)
    `).all(guildId, now);
  }
  static calculateMultiplier(guildId, member, channelId) {
    const settings = this.getSettings(guildId);
    let mult = settings.xp_rate || 1.0;
    const boosts = this.getActiveBoosts(guildId);
    for (const b of boosts) {
      if (b.target_type === 'server') {
        mult *= b.multiplier;
      } else if (b.target_type === 'channel' && channelId && b.target_id === channelId) {
        mult *= b.multiplier;
      } else if (b.target_type === 'user' && member && member.id === b.target_id) {
        mult *= b.multiplier;
      } else if (b.target_type === 'role' && member && member.roles && member.roles.cache && member.roles.cache.has(b.target_id)) {
        mult *= b.multiplier;
      }
    }
    return Math.round(mult * 100) / 100;
  }
  static getRewards(guildId) {
    return db.prepare('SELECT * FROM leveling_rewards WHERE guild_id = ? ORDER BY level ASC').all(guildId);
  }
  static addReward(guildId, level, rewardType, rewardValue, rewardName) {
    const id = `rew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO leveling_rewards (id, guild_id, level, reward_type, reward_value, reward_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, level, rewardType, rewardValue, rewardName, Date.now());
    return id;
  }
  static removeReward(guildId, rewardId) {
    db.prepare('DELETE FROM leveling_rewards WHERE guild_id = ? AND id = ?').run(guildId, rewardId);
  }
  static isExcluded(guildId, targetType, targetId) {
    const res = db.prepare('SELECT 1 FROM leveling_exclusions WHERE guild_id = ? AND target_type = ? AND target_id = ?').get(guildId, targetType, targetId);
    return Boolean(res);
  }
  static setExclusion(guildId, targetType, targetId, exclude = true) {
    if (exclude) {
      db.prepare('INSERT OR IGNORE INTO leveling_exclusions (guild_id, target_type, target_id) VALUES (?, ?, ?)').run(guildId, targetType, targetId);
    } else {
      db.prepare('DELETE FROM leveling_exclusions WHERE guild_id = ? AND target_type = ? AND target_id = ?').run(guildId, targetType, targetId);
    }
  }
  static getExclusions(guildId) {
    return db.prepare('SELECT * FROM leveling_exclusions WHERE guild_id = ?').all(guildId);
  }
  static getPrestige(guildId, userId) {
    const row = db.prepare('SELECT * FROM leveling_prestige WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    if (row) return row;
    db.prepare('INSERT OR IGNORE INTO leveling_prestige (guild_id, user_id, prestige_level, rebirth_count, updated_at) VALUES (?, ?, 0, 0, ?)').run(guildId, userId, Date.now());
    return { guild_id: guildId, user_id: userId, prestige_level: 0, rebirth_count: 0 };
  }
  static addPrestige(guildId, userId) {
    const pres = this.getPrestige(guildId, userId);
    const newPres = pres.prestige_level + 1;
    db.prepare('UPDATE leveling_prestige SET prestige_level = ?, updated_at = ? WHERE guild_id = ? AND user_id = ?').run(newPres, Date.now(), guildId, userId);
    this.setXp(guildId, userId, 0);
    return newPres;
  }
  static getUserBadges(guildId, userId) {
    return db.prepare('SELECT * FROM leveling_badges WHERE guild_id = ? AND user_id = ?').all(guildId, userId);
  }
  static addBadge(guildId, userId, badgeId, badgeName, badgeIcon = '🏅') {
    const id = `bdg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO leveling_badges (id, guild_id, user_id, badge_id, badge_name, badge_icon, unlocked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, badgeId, badgeName, badgeIcon, Date.now());
  }
  static getCardCustomization(guildId, userId) {
    const row = db.prepare('SELECT * FROM leveling_cards WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    if (row) return row;
    return {
      theme: 'dark',
      background_url: null,
      accent_color: '#5865F2',
      font: 'Inter',
      layout: 'standard'
    };
  }
  static setCardCustomization(guildId, userId, opts) {
    db.prepare(`
      INSERT INTO leveling_cards (guild_id, user_id, theme, background_url, accent_color, font, layout)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(guild_id, user_id) DO UPDATE SET
        theme = COALESCE(excluded.theme, theme),
        background_url = COALESCE(excluded.background_url, background_url),
        accent_color = COALESCE(excluded.accent_color, accent_color),
        font = COALESCE(excluded.font, font),
        layout = COALESCE(excluded.layout, layout)
    `).run(guildId, userId, opts.theme || 'dark', opts.background_url || null, opts.accent_color || '#5865F2', opts.font || 'Inter', opts.layout || 'standard');
    return this.getCardCustomization(guildId, userId);
  }
  static getGuildStats(guildId) {
    const countRow = db.prepare('SELECT COUNT(*) as total_users, SUM(xp) as total_xp, AVG(level) as avg_level, MAX(level) as max_level FROM user_levels WHERE guild_id = ?').get(guildId);
    return {
      totalUsers: countRow.total_users || 0,
      totalXp: countRow.total_xp || 0,
      avgLevel: Math.round((countRow.avg_level || 0) * 10) / 10,
      maxLevel: countRow.max_level || 0
    };
  }
  static logAudit(guildId, userId, action, oldVal, newVal) {
    db.prepare(`
      INSERT INTO leveling_logs (guild_id, user_id, action, old_value, new_value, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(guildId, userId, action, oldVal ? String(oldVal) : null, newVal ? String(newVal) : null, Date.now());
  }
  static getAuditLogs(guildId, limit = 20) {
    return db.prepare('SELECT * FROM leveling_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
}
module.exports = LevelingService;
