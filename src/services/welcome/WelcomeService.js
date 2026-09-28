const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
db.exec(`
  CREATE TABLE IF NOT EXISTS welcome_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    channel_id TEXT DEFAULT NULL,
    message_template TEXT NOT NULL DEFAULT 'Welcome {user} to {server}! We now have {memberCount} members.',
    embed_enabled INTEGER NOT NULL DEFAULT 1,
    embed_title TEXT NOT NULL DEFAULT '🎉 Welcome to the server!',
    embed_description TEXT NOT NULL DEFAULT 'Welcome {user} to **{server}** !\\nTake the time to read the rules and have fun!',
    embed_color TEXT NOT NULL DEFAULT '#57F287',
    dm_enabled INTEGER NOT NULL DEFAULT 0,
    dm_message TEXT NOT NULL DEFAULT 'Hi {username}! Welcome to {server}. Feel free to introduce yourself!',
    image_enabled INTEGER NOT NULL DEFAULT 0,
    autorole_enabled INTEGER NOT NULL DEFAULT 1,
    autorole_ids TEXT NOT NULL DEFAULT '[]',
    bot_role_id TEXT DEFAULT NULL,
    human_role_id TEXT DEFAULT NULL,
    goodbye_enabled INTEGER NOT NULL DEFAULT 1,
    goodbye_channel_id TEXT DEFAULT NULL,
    goodbye_message TEXT NOT NULL DEFAULT 'Goodbye {user}... We are down to {memberCount} members.',
    verification_enabled INTEGER NOT NULL DEFAULT 0,
    verification_role_id TEXT DEFAULT NULL,
    verification_channel_id TEXT DEFAULT NULL,
    captcha_enabled INTEGER NOT NULL DEFAULT 0,
    anti_raid_enabled INTEGER NOT NULL DEFAULT 0,
    min_account_age_days INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS welcome_messages (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    message_text TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS welcome_members_log (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'join', -- join, leave, return
    inviter_id TEXT DEFAULT NULL,
    is_verified INTEGER NOT NULL DEFAULT 0,
    account_age_days INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS welcome_questions (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    is_required INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS welcome_buttons (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    label TEXT NOT NULL,
    style TEXT NOT NULL DEFAULT 'Primary',
    role_id TEXT DEFAULT NULL,
    url TEXT DEFAULT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS welcome_snapshots (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    data_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_welcome_log_guild ON welcome_members_log(guild_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_welcome_log_user ON welcome_members_log(user_id);
`);
class WelcomeService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM welcome_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      const defaultSettings = {
        guild_id: guildId,
        enabled: 1,
        channel_id: null,
        message_template: 'Welcome {user} to {server}! We now have {memberCount} members.',
        embed_enabled: 1,
        embed_title: '🎉 Welcome to the server!',
        embed_description: 'Welcome {user} to **{server}** !\nTake the time to read the rules and have fun!',
        embed_color: '#57F287',
        dm_enabled: 0,
        dm_message: 'Hi {username}! Welcome to {server}. Feel free to introduce yourself!',
        image_enabled: 0,
        autorole_enabled: 1,
        autorole_ids: '[]',
        bot_role_id: null,
        human_role_id: null,
        goodbye_enabled: 1,
        goodbye_channel_id: null,
        goodbye_message: 'Goodbye {user}... We are down to {memberCount} members.',
        verification_enabled: 0,
        verification_role_id: null,
        verification_channel_id: null,
        captcha_enabled: 0,
        anti_raid_enabled: 0,
        min_account_age_days: 0,
        updated_at: now
      };
      db.prepare(`
        INSERT INTO welcome_settings (
          guild_id, enabled, channel_id, message_template, embed_enabled, embed_title, embed_description,
          embed_color, dm_enabled, dm_message, image_enabled, autorole_enabled, autorole_ids,
          bot_role_id, human_role_id, goodbye_enabled, goodbye_channel_id, goodbye_message,
          verification_enabled, verification_role_id, verification_channel_id, captcha_enabled,
          anti_raid_enabled, min_account_age_days, updated_at
        ) VALUES (
          @guild_id, @enabled, @channel_id, @message_template, @embed_enabled, @embed_title, @embed_description,
          @embed_color, @dm_enabled, @dm_message, @image_enabled, @autorole_enabled, @autorole_ids,
          @bot_role_id, @human_role_id, @goodbye_enabled, @goodbye_channel_id, @goodbye_message,
          @verification_enabled, @verification_role_id, @verification_channel_id, @captcha_enabled,
          @anti_raid_enabled, @min_account_age_days, @updated_at
        )
      `).run(defaultSettings);
      return defaultSettings;
    }
    return row;
  }
  static updateSettings(guildId, updates) {
    const current = this.getSettings(guildId);
    const updated = {
      ...current,
      ...updates,
      updated_at: Date.now()
    };
    db.prepare(`
      UPDATE welcome_settings
      SET enabled = @enabled,
          channel_id = @channel_id,
          message_template = @message_template,
          embed_enabled = @embed_enabled,
          embed_title = @embed_title,
          embed_description = @embed_description,
          embed_color = @embed_color,
          dm_enabled = @dm_enabled,
          dm_message = @dm_message,
          image_enabled = @image_enabled,
          autorole_enabled = @autorole_enabled,
          autorole_ids = @autorole_ids,
          bot_role_id = @bot_role_id,
          human_role_id = @human_role_id,
          goodbye_enabled = @goodbye_enabled,
          goodbye_channel_id = @goodbye_channel_id,
          goodbye_message = @goodbye_message,
          verification_enabled = @verification_enabled,
          verification_role_id = @verification_role_id,
          verification_channel_id = @verification_channel_id,
          captcha_enabled = @captcha_enabled,
          anti_raid_enabled = @anti_raid_enabled,
          min_account_age_days = @min_account_age_days,
          updated_at = @updated_at
      WHERE guild_id = @guild_id
    `).run(updated);
    return updated;
  }
  static formatMessage(template, member, guild, inviter = null) {
    if (!template) return '';
    const user = member?.user || member;
    const accountAge = user?.createdAt ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    return template
      .replace(/\{user\}/g, member ? `<@${member.id}>` : '@member')
      .replace(/\{username\}/g, user ? user.username : 'Member')
      .replace(/\{tag\}/g, user ? user.tag || user.username : 'Member#0000')
      .replace(/\{server\}/g, guild ? guild.name : 'Server')
      .replace(/\{memberCount\}/g, guild ? String(guild.memberCount) : '1')
      .replace(/\{accountAge\}/g, `${accountAge} days`)
      .replace(/\{inviter\}/g, inviter ? `<@${inviter.id}>` : 'Unknown')
      .replace(/\{date\}/g, new Date().toLocaleDateString('fr-FR'));
  }
  static addMessage(guildId, text) {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO welcome_messages (id, guild_id, message_text, is_active, created_at) VALUES (?, ?, ?, 1, ?)').run(id, guildId, text, Date.now());
    return { id, text };
  }
  static getMessages(guildId) {
    return db.prepare('SELECT * FROM welcome_messages WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static deleteMessage(guildId, id) {
    return db.prepare('DELETE FROM welcome_messages WHERE guild_id = ? AND id = ?').run(guildId, id).changes > 0;
  }
  static logMemberEvent(guildId, userId, type = 'join', inviterId = null, accountAgeDays = 0) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO welcome_members_log (id, guild_id, user_id, type, inviter_id, is_verified, account_age_days, timestamp)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, guildId, userId, type, inviterId, accountAgeDays, Date.now());
  }
  static getRecentLogs(guildId, limit = 10) {
    return db.prepare('SELECT * FROM welcome_members_log WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?').all(guildId, limit);
  }
  static getStats(guildId) {
    const joins = db.prepare('SELECT COUNT(*) as count FROM welcome_members_log WHERE guild_id = ? AND type = "join"').get(guildId)?.count || 0;
    const leaves = db.prepare('SELECT COUNT(*) as count FROM welcome_members_log WHERE guild_id = ? AND type = "leave"').get(guildId)?.count || 0;
    const verified = db.prepare('SELECT COUNT(*) as count FROM welcome_members_log WHERE guild_id = ? AND is_verified = 1').get(guildId)?.count || 0;
    const rate = joins > 0 ? Math.round(((joins - leaves) / joins) * 100) : 100;
    return {
      joins,
      leaves,
      verified,
      retentionRate: `${Math.max(0, rate)}%`
    };
  }
  static addQuestion(guildId, text, isRequired = 1) {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO welcome_questions (id, guild_id, question_text, is_required, created_at) VALUES (?, ?, ?, ?, ?)').run(id, guildId, text, isRequired ? 1 : 0, Date.now());
    return { id, text, isRequired };
  }
  static getQuestions(guildId) {
    return db.prepare('SELECT * FROM welcome_questions WHERE guild_id = ? ORDER BY created_at ASC').all(guildId);
  }
  static deleteQuestion(guildId, id) {
    return db.prepare('DELETE FROM welcome_questions WHERE guild_id = ? AND id = ?').run(guildId, id).changes > 0;
  }
  static addButton(guildId, label, roleId = null, url = null, style = 'Primary') {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO welcome_buttons (id, guild_id, label, style, role_id, url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, guildId, label, style, roleId, url, Date.now());
    return { id, label, roleId, url, style };
  }
  static getButtons(guildId) {
    return db.prepare('SELECT * FROM welcome_buttons WHERE guild_id = ? ORDER BY created_at ASC').all(guildId);
  }
  static deleteButton(guildId, id) {
    return db.prepare('DELETE FROM welcome_buttons WHERE guild_id = ? AND id = ?').run(guildId, id).changes > 0;
  }
  static getAutoroles(guildId) {
    const settings = this.getSettings(guildId);
    try {
      return JSON.parse(settings.autorole_ids || '[]');
    } catch (_) {
      return [];
    }
  }
  static addAutorole(guildId, roleId) {
    const current = this.getAutoroles(guildId);
    if (!current.includes(roleId)) {
      current.push(roleId);
      this.updateSettings(guildId, { autorole_ids: JSON.stringify(current) });
    }
    return current;
  }
  static removeAutorole(guildId, roleId) {
    let current = this.getAutoroles(guildId);
    current = current.filter(r => r !== roleId);
    this.updateSettings(guildId, { autorole_ids: JSON.stringify(current) });
    return current;
  }
  static clearAutoroles(guildId) {
    this.updateSettings(guildId, { autorole_ids: '[]' });
    return true;
  }
  static resetGuild(guildId) {
    db.prepare('DELETE FROM welcome_messages WHERE guild_id = ?').run(guildId);
    db.prepare('DELETE FROM welcome_members_log WHERE guild_id = ?').run(guildId);
    db.prepare('DELETE FROM welcome_questions WHERE guild_id = ?').run(guildId);
    db.prepare('DELETE FROM welcome_buttons WHERE guild_id = ?').run(guildId);
    return true;
  }
}
module.exports = WelcomeService;
