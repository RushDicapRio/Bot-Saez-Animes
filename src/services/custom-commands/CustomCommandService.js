const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../config');
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_command_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    prefix TEXT DEFAULT NULL,
    logs_channel_id TEXT DEFAULT NULL,
    fallback_enabled INTEGER NOT NULL DEFAULT 0,
    fallback_message TEXT NOT NULL DEFAULT 'Custom order not found.',
    cooldown_default_sec INTEGER NOT NULL DEFAULT 3,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_commands (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    response_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'embed', 'random'
    response_content TEXT NOT NULL DEFAULT '',
    embed_data TEXT DEFAULT NULL, -- JSON string
    random_responses TEXT NOT NULL DEFAULT '[]', -- JSON string array
    ephemeral INTEGER NOT NULL DEFAULT 0,
    cooldown_sec INTEGER NOT NULL DEFAULT 0,
    required_role_id TEXT DEFAULT NULL,
    required_perm TEXT DEFAULT NULL,
    category_name TEXT NOT NULL DEFAULT 'General',
    group_name TEXT DEFAULT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    archived INTEGER NOT NULL DEFAULT 0,
    uses_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_command_aliases (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    command_name TEXT NOT NULL,
    alias TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_command_triggers (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    command_name TEXT NOT NULL,
    trigger_type TEXT NOT NULL DEFAULT 'keyword', -- 'keyword', 'exact', 'partial'
    trigger_value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_command_variables (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_command_counters (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS custom_command_logs (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    command_name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_command_snapshots (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
const commandCooldowns = new Map(); 
class CustomCommandService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM custom_command_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO custom_command_settings (guild_id, updated_at)
        VALUES (?, ?)
      `).run(guildId, now);
      return db.prepare('SELECT * FROM custom_command_settings WHERE guild_id = ?').get(guildId);
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
      UPDATE custom_command_settings 
      SET ${setClauses}, updated_at = ?
      WHERE guild_id = ?
    `).run(...values);
    return this.getSettings(guildId);
  }
  static getCommands(guildId, includeArchived = false) {
    if (includeArchived) {
      return db.prepare('SELECT * FROM custom_commands WHERE guild_id = ? ORDER BY name ASC').all(guildId);
    }
    return db.prepare('SELECT * FROM custom_commands WHERE guild_id = ? AND archived = 0 ORDER BY name ASC').all(guildId);
  }
  static getCommand(guildId, nameOrAlias) {
    if (!nameOrAlias) return null;
    const clean = nameOrAlias.toLowerCase().trim();
    const cmd = db.prepare('SELECT * FROM custom_commands WHERE guild_id = ? AND name = ?').get(guildId, clean);
    if (cmd) return cmd;
    const aliasRow = db.prepare('SELECT command_name FROM custom_command_aliases WHERE guild_id = ? AND alias = ?').get(guildId, clean);
    if (aliasRow) {
      return db.prepare('SELECT * FROM custom_commands WHERE guild_id = ? AND name = ?').get(guildId, aliasRow.command_name);
    }
    return null;
  }
  static createCommand(guildId, { name, description = '', responseType = 'text', responseContent = '', embedData = null, randomResponses = [] }) {
    const cleanName = name.toLowerCase().trim();
    const existing = this.getCommand(guildId, cleanName);
    if (existing) {
      throw new Error(`A command or alias with that name already exists. "${cleanName}".`);
    }
    const id = crypto.randomUUID();
    const now = Date.now();
    db.prepare(`
      INSERT INTO custom_commands (id, guild_id, name, description, response_type, response_content, embed_data, random_responses, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      guildId,
      cleanName,
      description,
      responseType,
      responseContent,
      embedData ? JSON.stringify(embedData) : null,
      JSON.stringify(randomResponses || []),
      now,
      now
    );
    return this.getCommand(guildId, cleanName);
  }
  static updateCommand(guildId, name, updates) {
    const cmd = this.getCommand(guildId, name);
    if (!cmd) return null;
    const keys = Object.keys(updates);
    if (keys.length === 0) return cmd;
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => {
      if (k === 'embed_data' && typeof updates[k] === 'object') return JSON.stringify(updates[k]);
      if (k === 'random_responses' && Array.isArray(updates[k])) return JSON.stringify(updates[k]);
      return updates[k];
    });
    values.push(Date.now(), cmd.id);
    db.prepare(`
      UPDATE custom_commands
      SET ${setClauses}, updated_at = ?
      WHERE id = ?
    `).run(...values);
    return this.getCommand(guildId, cmd.name);
  }
  static deleteCommand(guildId, name) {
    const cmd = this.getCommand(guildId, name);
    if (!cmd) return false;
    db.prepare('DELETE FROM custom_command_aliases WHERE guild_id = ? AND command_name = ?').run(guildId, cmd.name);
    db.prepare('DELETE FROM custom_command_triggers WHERE guild_id = ? AND command_name = ?').run(guildId, cmd.name);
    return db.prepare('DELETE FROM custom_commands WHERE id = ?').run(cmd.id).changes > 0;
  }
  static renameCommand(guildId, oldName, newName) {
    const cleanNew = newName.toLowerCase().trim();
    if (this.getCommand(guildId, cleanNew)) {
      throw new Error(`Le nom "${cleanNew}" est déjà pris.`);
    }
    const cmd = this.getCommand(guildId, oldName);
    if (!cmd) return false;
    db.prepare('UPDATE custom_commands SET name = ?, updated_at = ? WHERE id = ?').run(cleanNew, Date.now(), cmd.id);
    db.prepare('UPDATE custom_command_aliases SET command_name = ? WHERE guild_id = ? AND command_name = ?').run(cleanNew, guildId, cmd.name);
    db.prepare('UPDATE custom_command_triggers SET command_name = ? WHERE guild_id = ? AND command_name = ?').run(cleanNew, guildId, cmd.name);
    return true;
  }
  static setCommandArchived(guildId, name, archived) {
    const cmd = this.getCommand(guildId, name);
    if (!cmd) return false;
    return db.prepare('UPDATE custom_commands SET archived = ?, updated_at = ? WHERE id = ?').run(archived ? 1 : 0, Date.now(), cmd.id).changes > 0;
  }
  static setCommandEnabled(guildId, name, enabled) {
    const cmd = this.getCommand(guildId, name);
    if (!cmd) return false;
    return db.prepare('UPDATE custom_commands SET enabled = ?, updated_at = ? WHERE id = ?').run(enabled ? 1 : 0, Date.now(), cmd.id).changes > 0;
  }
  static getAliases(guildId, commandName = null) {
    if (commandName) {
      return db.prepare('SELECT * FROM custom_command_aliases WHERE guild_id = ? AND command_name = ?').all(guildId, commandName.toLowerCase());
    }
    return db.prepare('SELECT * FROM custom_command_aliases WHERE guild_id = ?').all(guildId);
  }
  static addAlias(guildId, commandName, alias) {
    const cleanAlias = alias.toLowerCase().trim();
    const cleanCmd = commandName.toLowerCase().trim();
    const cmd = this.getCommand(guildId, cleanCmd);
    if (!cmd) throw new Error(`The command "${cleanCmd}" does not exist.`);
    if (this.getCommand(guildId, cleanAlias)) {
      throw new Error(`The name or alias "${cleanAlias}" is already in use.`);
    }
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO custom_command_aliases (id, guild_id, command_name, alias)
      VALUES (?, ?, ?, ?)
    `).run(id, guildId, cleanCmd, cleanAlias);
    return true;
  }
  static removeAlias(guildId, alias) {
    return db.prepare('DELETE FROM custom_command_aliases WHERE guild_id = ? AND alias = ?').run(guildId, alias.toLowerCase().trim()).changes > 0;
  }
  static getVariables(guildId) {
    return db.prepare('SELECT * FROM custom_command_variables WHERE guild_id = ? ORDER BY name ASC').all(guildId);
  }
  static setVariable(guildId, name, value) {
    const cleanName = name.toLowerCase().trim();
    const existing = db.prepare('SELECT * FROM custom_command_variables WHERE guild_id = ? AND name = ?').get(guildId, cleanName);
    const now = Date.now();
    if (existing) {
      db.prepare('UPDATE custom_command_variables SET value = ?, updated_at = ? WHERE id = ?').run(value, now, existing.id);
    } else {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO custom_command_variables (id, guild_id, name, value, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, guildId, cleanName, value, now);
    }
    return true;
  }
  static removeVariable(guildId, name) {
    return db.prepare('DELETE FROM custom_command_variables WHERE guild_id = ? AND name = ?').run(guildId, name.toLowerCase().trim()).changes > 0;
  }
  static getCounters(guildId) {
    return db.prepare('SELECT * FROM custom_command_counters WHERE guild_id = ? ORDER BY name ASC').all(guildId);
  }
  static getCounter(guildId, name) {
    return db.prepare('SELECT * FROM custom_command_counters WHERE guild_id = ? AND name = ?').get(guildId, name.toLowerCase().trim());
  }
  static incrementCounter(guildId, name, delta = 1) {
    const clean = name.toLowerCase().trim();
    const existing = this.getCounter(guildId, clean);
    if (existing) {
      const next = existing.count + delta;
      db.prepare('UPDATE custom_command_counters SET count = ? WHERE id = ?').run(next, existing.id);
      return next;
    } else {
      const id = crypto.randomUUID();
      db.prepare('INSERT INTO custom_command_counters (id, guild_id, name, count) VALUES (?, ?, ?, ?)').run(id, guildId, clean, delta);
      return delta;
    }
  }
  static resetCounter(guildId, name) {
    return db.prepare('UPDATE custom_command_counters SET count = 0 WHERE guild_id = ? AND name = ?').run(guildId, name.toLowerCase().trim()).changes > 0;
  }
  static getTriggers(guildId) {
    return db.prepare('SELECT * FROM custom_command_triggers WHERE guild_id = ?').all(guildId);
  }
  static addTrigger(guildId, commandName, triggerValue, triggerType = 'keyword') {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO custom_command_triggers (id, guild_id, command_name, trigger_type, trigger_value)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, commandName.toLowerCase().trim(), triggerType, triggerValue.toLowerCase().trim());
    return id;
  }
  static removeTrigger(guildId, triggerIdOrVal) {
    return db.prepare('DELETE FROM custom_command_triggers WHERE guild_id = ? AND (id = ? OR trigger_value = ?)').run(guildId, triggerIdOrVal, triggerIdOrVal).changes > 0;
  }
  static createSnapshot(guildId, name = 'Snapshot Commandes') {
    const id = crypto.randomUUID();
    const settings = this.getSettings(guildId);
    const commands = this.getCommands(guildId, true);
    const aliases = this.getAliases(guildId);
    const variables = this.getVariables(guildId);
    const counters = this.getCounters(guildId);
    const triggers = this.getTriggers(guildId);
    const data = JSON.stringify({ settings, commands, aliases, variables, counters, triggers });
    db.prepare(`
      INSERT INTO custom_command_snapshots (id, guild_id, name, data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, name, data, Date.now());
    return id;
  }
  static getSnapshots(guildId) {
    return db.prepare('SELECT id, name, created_at FROM custom_command_snapshots WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static restoreSnapshot(guildId, snapshotId) {
    const snap = db.prepare('SELECT * FROM custom_command_snapshots WHERE guild_id = ? AND (id = ? OR name = ?) ORDER BY created_at DESC LIMIT 1').get(guildId, snapshotId, snapshotId);
    if (!snap) return false;
    const data = JSON.parse(snap.data);
    if (Array.isArray(data.commands)) {
      for (const cmd of data.commands) {
        if (!this.getCommand(guildId, cmd.name)) {
          this.createCommand(guildId, {
            name: cmd.name,
            description: cmd.description,
            responseType: cmd.response_type,
            responseContent: cmd.response_content,
            embedData: cmd.embed_data ? JSON.parse(cmd.embed_data) : null,
            randomResponses: cmd.random_responses ? JSON.parse(cmd.random_responses) : []
          });
        }
      }
    }
    return true;
  }
  static replacePlaceholders(text, member, guild, channel, args = []) {
    if (!text) return '';
    let out = text;
    const user = member?.user || member;
    if (user) {
      const mentionStr = user.id ? `<@${user.id}>` : `${user}`;
      out = out.replace(/\{user\}/gi, mentionStr);
      out = out.replace(/\{username\}/gi, user.username || '');
      out = out.replace(/\{tag\}/gi, user.tag || user.username || '');
      out = out.replace(/\{id\}/gi, user.id || '');
    }
    if (guild) {
      out = out.replace(/\{server\}/gi, guild.name);
      out = out.replace(/\{guild\}/gi, guild.name);
      out = out.replace(/\{memberCount\}/gi, `${guild.memberCount || 0}`);
    }
    if (channel) {
      out = out.replace(/\{channel\}/gi, `${channel}`);
    }
    out = out.replace(/\{args\}/gi, args.join(' ') || '');
    out = out.replace(/\{arg1\}/gi, args[0] || '');
    out = out.replace(/\{arg2\}/gi, args[1] || '');
    if (guild) {
      const vars = this.getVariables(guild.id);
      for (const v of vars) {
        const re = new RegExp(`\\{var:${v.name}\\}`, 'gi');
        out = out.replace(re, v.value);
      }
    }
    if (guild) {
      const counterRegex = /\{counter:([a-zA-Z0-9_\-]+)\}/gi;
      out = out.replace(counterRegex, (_, counterName) => {
        const nextVal = this.incrementCounter(guild.id, counterName, 1);
        return `${nextVal}`;
      });
    }
    out = out.replace(/\{random:([^}]+)\}/gi, (_, choicesStr) => {
      const parts = choicesStr.split('|').map(s => s.trim()).filter(Boolean);
      if (parts.length === 0) return '';
      return parts[Math.floor(Math.random() * parts.length)];
    });
    return out;
  }
  static async executeCommand(guildId, commandName, ctx, args = []) {
    const settings = this.getSettings(guildId);
    if (!settings.enabled) return { success: false, reason: 'System deactivated.' };
    const cmd = this.getCommand(guildId, commandName);
    if (!cmd) {
      if (settings.fallback_enabled) {
        await ctx.reply({ content: settings.fallback_message }).catch(() => {});
      }
      return { success: false, reason: 'Non-existent order.' };
    }
    if (!cmd.enabled || cmd.archived) {
      return { success: false, reason: 'This order is disabled or archived.' };
    }
    const member = ctx.member;
    const guild = ctx.guild;
    const channel = ctx.channel;
    const cdSec = cmd.cooldown_sec || settings.cooldown_default_sec || 0;
    if (cdSec > 0 && member) {
      const key = `${guildId}:${member.id}:${cmd.name}`;
      const last = commandCooldowns.get(key) || 0;
      const now = Date.now();
      if (now - last < cdSec * 1000) {
        const remaining = Math.ceil((cdSec * 1000 - (now - last)) / 1000);
        return ctx.sendError('Cooldown', `Please wait another **${remaining}s** before using this command again.`);
      }
      commandCooldowns.set(key, now);
    }
    if (cmd.required_role_id && member) {
      if (!member.roles.cache.has(cmd.required_role_id) && !member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return ctx.sendError('Access denied', `You must have the <@&${cmd.required_role_id}> role to run this command.`);
      }
    }
    db.prepare('UPDATE custom_commands SET uses_count = uses_count + 1 WHERE id = ?').run(cmd.id);
    const logId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO custom_command_logs (id, guild_id, command_name, user_id, channel_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(logId, guildId, cmd.name, member?.id || 'unknown', channel?.id || 'unknown', Date.now());
    let responseText = cmd.response_content || '';
    if (cmd.response_type === 'random') {
      try {
        const list = JSON.parse(cmd.random_responses || '[]');
        if (list.length > 0) {
          responseText = list[Math.floor(Math.random() * list.length)];
        }
      } catch (_) {}
    }
    responseText = this.replacePlaceholders(responseText, member, guild, channel, args);
    if (cmd.response_type === 'embed' && cmd.embed_data) {
      try {
        const embData = JSON.parse(cmd.embed_data);
        const embed = new EmbedBuilder()
          .setColor(embData.color || config.colors?.primary || '#5865F2')
          .setTitle(this.replacePlaceholders(embData.title || cmd.name, member, guild, channel, args))
          .setDescription(this.replacePlaceholders(embData.description || responseText, member, guild, channel, args))
          .setTimestamp();
        if (embData.footer) embed.setFooter({ text: this.replacePlaceholders(embData.footer, member, guild, channel, args) });
        if (embData.image) embed.setImage(embData.image);
        if (embData.thumbnail) embed.setThumbnail(embData.thumbnail);
        return await ctx.reply({ embeds: [embed], ephemeral: !!cmd.ephemeral });
      } catch (err) {
        console.error('[CustomCommands] Embed error :', err);
      }
    }
    return await ctx.reply({ content: responseText || '*(Empty response)*', ephemeral: !!cmd.ephemeral });
  }
  static async handleMessagePrefix(message, commandName, args, client) {
    if (!message.guild || message.author.bot) return false;
    const cmd = this.getCommand(message.guild.id, commandName);
    if (!cmd) return false;
    const CustomCommandContext = require('../../commands/slash/custom-commands/core/customCommandContext');
    const ctx = new CustomCommandContext(message, client, {
      commandName: cmd.name,
      param: args.join(' ')
    });
    await this.executeCommand(message.guild.id, cmd.name, ctx, args);
    return true;
  }
  static async handleTriggers(message, client) {
    if (!message.guild || message.author.bot || !message.content) return false;
    const triggers = this.getTriggers(message.guild.id);
    if (triggers.length === 0) return false;
    const lower = message.content.toLowerCase();
    for (const tr of triggers) {
      let match = false;
      if (tr.trigger_type === 'exact') {
        match = lower.trim() === tr.trigger_value;
      } else {
        match = lower.includes(tr.trigger_value);
      }
      if (match) {
        const cmd = this.getCommand(message.guild.id, tr.command_name);
        if (cmd && cmd.enabled && !cmd.archived) {
          const CustomCommandContext = require('../../commands/slash/custom-commands/core/customCommandContext');
          const ctx = new CustomCommandContext(message, client, {
            commandName: cmd.name,
            param: message.content
          });
          await this.executeCommand(message.guild.id, cmd.name, ctx, []);
          return true;
        }
      }
    }
    return false;
  }
}
module.exports = CustomCommandService;
