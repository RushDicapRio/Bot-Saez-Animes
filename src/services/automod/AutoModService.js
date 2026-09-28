const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../config');
db.exec(`
  CREATE TABLE IF NOT EXISTS automod_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    logs_channel_id TEXT DEFAULT NULL,
    alert_channel_id TEXT DEFAULT NULL,
    alert_role_id TEXT DEFAULT NULL,
    alert_threshold INTEGER NOT NULL DEFAULT 3,
    profanity_enabled INTEGER NOT NULL DEFAULT 1,
    profanity_level TEXT NOT NULL DEFAULT 'medium',
    profanity_languages TEXT NOT NULL DEFAULT '["fr","en"]',
    spam_enabled INTEGER NOT NULL DEFAULT 1,
    spam_threshold INTEGER NOT NULL DEFAULT 5,
    spam_window INTEGER NOT NULL DEFAULT 5,
    spam_action TEXT NOT NULL DEFAULT 'delete',
    duplicate_enabled INTEGER NOT NULL DEFAULT 1,
    duplicate_threshold INTEGER NOT NULL DEFAULT 3,
    duplicate_window INTEGER NOT NULL DEFAULT 10,
    duplicate_action TEXT NOT NULL DEFAULT 'warn',
    flood_enabled INTEGER NOT NULL DEFAULT 1,
    flood_threshold INTEGER NOT NULL DEFAULT 6,
    flood_window INTEGER NOT NULL DEFAULT 5,
    flood_action TEXT NOT NULL DEFAULT 'timeout',
    caps_enabled INTEGER NOT NULL DEFAULT 1,
    caps_threshold INTEGER NOT NULL DEFAULT 70,
    caps_minimum INTEGER NOT NULL DEFAULT 10,
    caps_action TEXT NOT NULL DEFAULT 'delete',
    mention_enabled INTEGER NOT NULL DEFAULT 1,
    mention_limit INTEGER NOT NULL DEFAULT 5,
    mention_window INTEGER NOT NULL DEFAULT 10,
    mention_action TEXT NOT NULL DEFAULT 'warn',
    everyone_enabled INTEGER NOT NULL DEFAULT 1,
    everyone_action TEXT NOT NULL DEFAULT 'delete',
    role_mention_enabled INTEGER NOT NULL DEFAULT 1,
    role_mention_limit INTEGER NOT NULL DEFAULT 3,
    role_mention_action TEXT NOT NULL DEFAULT 'delete',
    link_enabled INTEGER NOT NULL DEFAULT 0,
    link_action TEXT NOT NULL DEFAULT 'delete',
    invite_enabled INTEGER NOT NULL DEFAULT 1,
    invite_action TEXT NOT NULL DEFAULT 'delete',
    attachment_enabled INTEGER NOT NULL DEFAULT 0,
    attachment_size_mb INTEGER NOT NULL DEFAULT 25,
    attachment_action TEXT NOT NULL DEFAULT 'delete',
    emoji_enabled INTEGER NOT NULL DEFAULT 0,
    emoji_limit INTEGER NOT NULL DEFAULT 8,
    emoji_action TEXT NOT NULL DEFAULT 'delete',
    sticker_enabled INTEGER NOT NULL DEFAULT 0,
    sticker_limit INTEGER NOT NULL DEFAULT 2,
    sticker_action TEXT NOT NULL DEFAULT 'delete',
    phishing_enabled INTEGER NOT NULL DEFAULT 1,
    phishing_action TEXT NOT NULL DEFAULT 'ban',
    scam_enabled INTEGER NOT NULL DEFAULT 1,
    scam_action TEXT NOT NULL DEFAULT 'ban',
    nsfw_enabled INTEGER NOT NULL DEFAULT 1,
    nsfw_action TEXT NOT NULL DEFAULT 'delete',
    image_enabled INTEGER NOT NULL DEFAULT 0,
    image_action TEXT NOT NULL DEFAULT 'delete',
    video_enabled INTEGER NOT NULL DEFAULT 0,
    video_action TEXT NOT NULL DEFAULT 'delete',
    username_enabled INTEGER NOT NULL DEFAULT 0,
    username_action TEXT NOT NULL DEFAULT 'warn',
    bio_enabled INTEGER NOT NULL DEFAULT 0,
    bio_action TEXT NOT NULL DEFAULT 'warn',
    quarantine_role_id TEXT DEFAULT NULL,
    quarantine_duration_min INTEGER NOT NULL DEFAULT 60,
    raid_enabled INTEGER NOT NULL DEFAULT 1,
    raid_threshold INTEGER NOT NULL DEFAULT 10,
    raid_window INTEGER NOT NULL DEFAULT 10,
    raid_action TEXT NOT NULL DEFAULT 'lock',
    join_spam_enabled INTEGER NOT NULL DEFAULT 1,
    reaction_spam_enabled INTEGER NOT NULL DEFAULT 1,
    reaction_spam_limit INTEGER NOT NULL DEFAULT 6,
    thread_spam_enabled INTEGER NOT NULL DEFAULT 1,
    thread_spam_limit INTEGER NOT NULL DEFAULT 3,
    webhook_enabled INTEGER NOT NULL DEFAULT 1,
    webhook_limit INTEGER NOT NULL DEFAULT 5,
    bot_age_min_days INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS automod_rules (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    trigger TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT 'delete',
    priority INTEGER NOT NULL DEFAULT 1,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS automod_keywords (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    word TEXT NOT NULL,
    match_type TEXT NOT NULL DEFAULT 'partial', -- 'partial' ou 'exact'
    case_sensitive INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS automod_regexes (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    pattern TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT 'delete',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS automod_domains (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'block', -- 'allow' ou 'block'
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS automod_violations (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    content TEXT DEFAULT '',
    action_taken TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS automod_escalations (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    violation_count INTEGER NOT NULL,
    action TEXT NOT NULL,
    duration_min INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS automod_exceptions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'user', 'role', 'channel', 'category', 'bot'
    target_id TEXT NOT NULL,
    rule_type TEXT NOT NULL DEFAULT 'all',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS automod_snapshots (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
const userMessageHistory = new Map(); 
const recentJoins = new Map(); 
class AutoModService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM automod_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO automod_settings (guild_id, updated_at)
        VALUES (?, ?)
      `).run(guildId, now);
      return db.prepare('SELECT * FROM automod_settings WHERE guild_id = ?').get(guildId);
    }
    return row;
  }
  static updateSettings(guildId, updates) {
    this.getSettings(guildId); 
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), guildId);
    db.prepare(`
      UPDATE automod_settings 
      SET ${setClauses}, updated_at = ?
      WHERE guild_id = ?
    `).run(...values);
    return this.getSettings(guildId);
  }
  static getRules(guildId) {
    return db.prepare('SELECT * FROM automod_rules WHERE guild_id = ? ORDER BY priority ASC, created_at DESC').all(guildId);
  }
  static addRule(guildId, { name, type, trigger, action = 'delete', priority = 1 }) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO automod_rules (id, guild_id, name, type, trigger, action, priority, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, guildId, name, type, trigger, action, priority, Date.now());
    return id;
  }
  static deleteRule(guildId, idOrName) {
    return db.prepare('DELETE FROM automod_rules WHERE guild_id = ? AND (id = ? OR name = ?)').run(guildId, idOrName, idOrName).changes > 0;
  }
  static setRuleEnabled(guildId, idOrName, enabled) {
    return db.prepare('UPDATE automod_rules SET enabled = ? WHERE guild_id = ? AND (id = ? OR name = ?)').run(enabled ? 1 : 0, guildId, idOrName, idOrName).changes > 0;
  }
  static getKeywords(guildId) {
    return db.prepare('SELECT * FROM automod_keywords WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static addKeyword(guildId, word, matchType = 'partial', caseSensitive = 0) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO automod_keywords (id, guild_id, word, match_type, case_sensitive, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, word, matchType, caseSensitive ? 1 : 0, Date.now());
    return id;
  }
  static removeKeyword(guildId, word) {
    return db.prepare('DELETE FROM automod_keywords WHERE guild_id = ? AND (word = ? OR id = ?)').run(guildId, word, word).changes > 0;
  }
  static getRegexes(guildId) {
    return db.prepare('SELECT * FROM automod_regexes WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static addRegex(guildId, pattern, action = 'delete') {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO automod_regexes (id, guild_id, pattern, action, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, pattern, action, Date.now());
    return id;
  }
  static removeRegex(guildId, patternOrId) {
    return db.prepare('DELETE FROM automod_regexes WHERE guild_id = ? AND (pattern = ? OR id = ?)').run(guildId, patternOrId, patternOrId).changes > 0;
  }
  static getDomains(guildId) {
    return db.prepare('SELECT * FROM automod_domains WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static addDomain(guildId, domain, type = 'block') {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO automod_domains (id, guild_id, domain, type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, domain.toLowerCase().trim(), type, Date.now());
    return id;
  }
  static removeDomain(guildId, domain) {
    return db.prepare('DELETE FROM automod_domains WHERE guild_id = ? AND (domain = ? OR id = ?)').run(guildId, domain.toLowerCase().trim(), domain).changes > 0;
  }
  static getExceptions(guildId) {
    return db.prepare('SELECT * FROM automod_exceptions WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static addException(guildId, targetType, targetId, ruleType = 'all') {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO automod_exceptions (id, guild_id, target_type, target_id, rule_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, targetType, targetId, ruleType, Date.now());
    return id;
  }
  static removeException(guildId, targetId) {
    return db.prepare('DELETE FROM automod_exceptions WHERE guild_id = ? AND (target_id = ? OR id = ?)').run(guildId, targetId, targetId).changes > 0;
  }
  static isExempt(guildId, member, channel, ruleType = 'all') {
    if (!member || !member.id) return false;
    if (member.permissions && member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
    const exceptions = this.getExceptions(guildId);
    for (const ex of exceptions) {
      if (ex.rule_type !== 'all' && ex.rule_type !== ruleType) continue;
      if (ex.target_type === 'user' && ex.target_id === member.id) return true;
      if (ex.target_type === 'bot' && member.user && member.user.bot) return true;
      if (ex.target_type === 'channel' && channel && channel.id === ex.target_id) return true;
      if (ex.target_type === 'category' && channel && channel.parentId === ex.target_id) return true;
      if (ex.target_type === 'role' && member.roles && member.roles.cache && member.roles.cache.has(ex.target_id)) return true;
    }
    return false;
  }
  static logViolation(guildId, userId, channelId, ruleType, content, actionTaken) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO automod_violations (id, guild_id, user_id, channel_id, rule_type, content, action_taken, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, userId, channelId, ruleType, content ? content.slice(0, 500) : '', actionTaken, Date.now());
    return id;
  }
  static getViolations(guildId, limit = 20) {
    return db.prepare('SELECT * FROM automod_violations WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  static getUserViolations(guildId, userId, limit = 20) {
    return db.prepare('SELECT * FROM automod_violations WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, userId, limit);
  }
  static getChannelViolations(guildId, channelId, limit = 20) {
    return db.prepare('SELECT * FROM automod_violations WHERE guild_id = ? AND channel_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, channelId, limit);
  }
  static clearViolations(guildId) {
    return db.prepare('DELETE FROM automod_violations WHERE guild_id = ?').run(guildId).changes;
  }
  static getEscalations(guildId) {
    return db.prepare('SELECT * FROM automod_escalations WHERE guild_id = ? ORDER BY violation_count ASC').all(guildId);
  }
  static addEscalation(guildId, level, violationCount, action, durationMin = 0) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO automod_escalations (id, guild_id, level, violation_count, action, duration_min)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guildId, level, violationCount, action, durationMin);
    return id;
  }
  static removeEscalation(guildId, idOrLevel) {
    return db.prepare('DELETE FROM automod_escalations WHERE guild_id = ? AND (id = ? OR level = ?)').run(guildId, idOrLevel, idOrLevel).changes > 0;
  }
  static createSnapshot(guildId, name = 'Automod Snapshot') {
    const id = crypto.randomUUID();
    const settings = this.getSettings(guildId);
    const rules = this.getRules(guildId);
    const keywords = this.getKeywords(guildId);
    const regexes = this.getRegexes(guildId);
    const domains = this.getDomains(guildId);
    const exceptions = this.getExceptions(guildId);
    const escalations = this.getEscalations(guildId);
    const payload = JSON.stringify({ settings, rules, keywords, regexes, domains, exceptions, escalations });
    db.prepare(`
      INSERT INTO automod_snapshots (id, guild_id, name, data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, name, payload, Date.now());
    return id;
  }
  static getSnapshots(guildId) {
    return db.prepare('SELECT id, name, created_at FROM automod_snapshots WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static restoreSnapshot(guildId, snapshotId) {
    const snap = db.prepare('SELECT * FROM automod_snapshots WHERE guild_id = ? AND (id = ? OR name = ?) ORDER BY created_at DESC LIMIT 1').get(guildId, snapshotId, snapshotId);
    if (!snap) return false;
    const data = JSON.parse(snap.data);
    if (data.settings) {
      delete data.settings.guild_id;
      this.updateSettings(guildId, data.settings);
    }
    return true;
  }
  static async processMessage(message) {
    if (!message || !message.guild || !message.member || message.author.bot) return null;
    const settings = this.getSettings(message.guild.id);
    if (!settings.enabled) return null;
    const member = message.member;
    const channel = message.channel;
    const content = message.content || '';
    if (this.isExempt(message.guild.id, member, channel, 'all')) {
      return null;
    }
    let violation = null;
    if (settings.invite_enabled && !this.isExempt(message.guild.id, member, channel, 'invite')) {
      const inviteRegex = /(discord\.(gg|io|me|li)\/.+|discord(app)?\.com\/invite\/.+)/i;
      if (inviteRegex.test(content)) {
        violation = {
          type: 'invitation',
          reason: 'Unauthorized Discord invitation',
          action: settings.invite_action || 'delete'
        };
      }
    }
    if (!violation && settings.link_enabled && !this.isExempt(message.guild.id, member, channel, 'link')) {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urls = content.match(urlRegex);
      if (urls && urls.length > 0) {
        const domains = this.getDomains(message.guild.id);
        const allowedDomains = domains.filter(d => d.type === 'allow').map(d => d.domain);
        const blockedDomains = domains.filter(d => d.type === 'block').map(d => d.domain);
        for (const url of urls) {
          try {
            const domain = new URL(url).hostname.toLowerCase();
            const isBlocked = blockedDomains.some(b => domain.includes(b));
            const isAllowed = allowedDomains.length > 0 && allowedDomains.some(a => domain.includes(a));
            if (isBlocked || (allowedDomains.length > 0 && !isAllowed)) {
              violation = {
                type: 'lien',
                reason: `Prohibited link or domain (${domain})`,
                action: settings.link_action || 'delete'
              };
              break;
            }
          } catch (_) {}
        }
      }
    }
    if (!violation && !this.isExempt(message.guild.id, member, channel, 'mention')) {
      if (settings.everyone_enabled && (content.includes('@everyone') || content.includes('@here'))) {
        violation = {
          type: 'everyone',
          reason: '@everyone / @here mentions not allowed',
          action: settings.everyone_action || 'delete'
        };
      } else if (settings.mention_enabled && message.mentions.users.size > settings.mention_limit) {
        violation = {
          type: 'mentions',
          reason: `Excessive references (${message.mentions.users.size} > ${settings.mention_limit})`,
          action: settings.mention_action || 'warn'
        };
      } else if (settings.role_mention_enabled && message.mentions.roles.size > settings.role_mention_limit) {
        violation = {
          type: 'role-mentions',
          reason: `Excessive mentions of roles (${message.mentions.roles.size} > ${settings.role_mention_limit})`,
          action: settings.role_mention_action || 'delete'
        };
      }
    }
    if (!violation && settings.caps_enabled && content.length >= settings.caps_minimum && !this.isExempt(message.guild.id, member, channel, 'caps')) {
      const letters = content.replace(/[^a-zA-Z]/g, '');
      if (letters.length >= settings.caps_minimum) {
        const uppers = letters.replace(/[^A-Z]/g, '').length;
        const percent = Math.round((uppers / letters.length) * 100);
        if (percent >= settings.caps_threshold) {
          violation = {
            type: 'majuscules',
            reason: `Excessive percentage of capital letters (${percent}% >= ${settings.caps_threshold}%)`,
            action: settings.caps_action || 'delete'
          };
        }
      }
    }
    if (!violation && !this.isExempt(message.guild.id, member, channel, 'keyword')) {
      const keywords = this.getKeywords(message.guild.id);
      for (const kw of keywords) {
        const searchWord = kw.case_sensitive ? kw.word : kw.word.toLowerCase();
        const textToSearch = kw.case_sensitive ? content : content.toLowerCase();
        let matched = false;
        if (kw.match_type === 'exact') {
          const words = textToSearch.split(/\s+/);
          matched = words.includes(searchWord);
        } else {
          matched = textToSearch.includes(searchWord);
        }
        if (matched) {
          violation = {
            type: 'mot_interdit',
            reason: `Forbidden word detected : "${kw.word}"`,
            action: 'delete'
          };
          break;
        }
      }
    }
    if (!violation && !this.isExempt(message.guild.id, member, channel, 'regex')) {
      const regexes = this.getRegexes(message.guild.id);
      for (const rg of regexes) {
        try {
          const re = new RegExp(rg.pattern, 'i');
          if (re.test(content)) {
            violation = {
              type: 'regex',
              reason: `Match against the regex filter : ${rg.pattern}`,
              action: rg.action || 'delete'
            };
            break;
          }
        } catch (_) {}
      }
    }
    if (!violation && (settings.spam_enabled || settings.duplicate_enabled || settings.flood_enabled) && !this.isExempt(message.guild.id, member, channel, 'spam')) {
      const key = `${message.guild.id}:${member.id}`;
      const now = Date.now();
      let history = userMessageHistory.get(key) || [];
      history = history.filter(item => now - item.timestamp < 30000);
      if (settings.duplicate_enabled) {
        const duplicates = history.filter(item => item.content === content && now - item.timestamp < settings.duplicate_window * 1000);
        if (duplicates.length + 1 >= settings.duplicate_threshold) {
          violation = {
            type: 'duplicate',
            reason: `Repeated identical messages (${duplicates.length + 1} messages)`,
            action: settings.duplicate_action || 'warn'
          };
        }
      }
      if (!violation && settings.flood_enabled) {
        const recentMessages = history.filter(item => now - item.timestamp < settings.flood_window * 1000);
        if (recentMessages.length + 1 >= settings.flood_threshold) {
          violation = {
            type: 'flood',
            reason: `Sending frequency too high (${recentMessages.length + 1} msgs / ${settings.flood_window}s)`,
            action: settings.flood_action || 'timeout'
          };
        }
      }
      history.push({ timestamp: now, content });
      userMessageHistory.set(key, history);
    }
    if (!violation) return null;
    this.logViolation(message.guild.id, member.id, channel.id, violation.type, content, violation.action);
    if (violation.action === 'delete' || violation.action === 'timeout' || violation.action === 'kick' || violation.action === 'ban') {
      try {
        if (message.deletable) await message.delete().catch(() => {});
      } catch (_) {}
    }
    try {
      if (violation.action === 'timeout') {
        const durationMs = 60 * 1000 * 5; 
        if (member.moderatable) {
          await member.timeout(durationMs, `[AutoMod] ${violation.reason}`).catch(() => {});
        }
      } else if (violation.action === 'kick') {
        if (member.kickable) {
          await member.kick(`[AutoMod] ${violation.reason}`).catch(() => {});
        }
      } else if (violation.action === 'ban') {
        if (member.bannable) {
          await member.ban({ reason: `[AutoMod] ${violation.reason}` }).catch(() => {});
        }
      } else if (violation.action === 'warn') {
        const warnEmbed = new EmbedBuilder()
          .setColor(config.colors.warning || '#FEE75C')
          .setTitle('⚠️ AutoMod Warning')
          .setDescription(`Your message has been identified as a violation. : **${violation.reason}**.\nPlease respect the server rules.`)
          .setTimestamp();
        await member.send({ embeds: [warnEmbed] }).catch(async () => {
          const tempMsg = await channel.send({ content: `${member}`, embeds: [warnEmbed] }).catch(() => {});
          if (tempMsg) setTimeout(() => tempMsg.delete().catch(() => {}), 6000);
        });
      }
    } catch (_) {}
    const logChannelId = settings.alert_channel_id || settings.logs_channel_id;
    if (logChannelId) {
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel && logChannel.isTextBased()) {
        const alertEmbed = new EmbedBuilder()
          .setColor(config.colors.danger || '#ED4245')
          .setTitle('🛡️ AutoMod Detection')
          .addFields(
            { name: 'User', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
            { name: 'Channel', value: `${channel}`, inline: true },
            { name: 'Type of offense', value: `\`${violation.type}\``, inline: true },
            { name: 'Reason', value: violation.reason, inline: false },
            { name: 'Applied action', value: `\`${violation.action.toUpperCase()}\``, inline: true },
            { name: 'Partial content', value: `\`\`\`${(content || '[No text]').slice(0, 300)}\`\`\``, inline: false }
          )
          .setTimestamp();
        logChannel.send({ embeds: [alertEmbed] }).catch(() => {});
      }
    }
    return { blocked: true, violation };
  }
}
module.exports = AutoModService;
