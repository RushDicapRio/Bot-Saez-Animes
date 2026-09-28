const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
db.exec(`
  CREATE TABLE IF NOT EXISTS embed_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    default_color TEXT NOT NULL DEFAULT '#5865F2',
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saved_embeds (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    title TEXT DEFAULT NULL,
    title_url TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    color TEXT NOT NULL DEFAULT '#5865F2',
    author_name TEXT DEFAULT NULL,
    author_icon TEXT DEFAULT NULL,
    author_url TEXT DEFAULT NULL,
    footer_text TEXT DEFAULT NULL,
    footer_icon TEXT DEFAULT NULL,
    thumbnail_url TEXT DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    timestamp_enabled INTEGER NOT NULL DEFAULT 0,
    fields_data TEXT NOT NULL DEFAULT '[]',
    buttons_data TEXT NOT NULL DEFAULT '[]',
    archived INTEGER NOT NULL DEFAULT 0,
    uses_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS embed_templates (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS embed_snapshots (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS embed_history (
    id TEXT PRIMARY KEY,
    embed_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
class EmbedService {
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM embed_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO embed_settings (guild_id, updated_at)
        VALUES (?, ?)
      `).run(guildId, now);
      return db.prepare('SELECT * FROM embed_settings WHERE guild_id = ?').get(guildId);
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
      UPDATE embed_settings 
      SET ${setClauses}, updated_at = ?
      WHERE guild_id = ?
    `).run(...values);
    return this.getSettings(guildId);
  }
  static getEmbeds(guildId, includeArchived = false) {
    if (includeArchived) {
      return db.prepare('SELECT * FROM saved_embeds WHERE guild_id = ? ORDER BY name ASC').all(guildId);
    }
    return db.prepare('SELECT * FROM saved_embeds WHERE guild_id = ? AND archived = 0 ORDER BY name ASC').all(guildId);
  }
  static getEmbed(guildId, nameOrId) {
    if (!nameOrId) return null;
    const clean = nameOrId.toLowerCase().trim();
    return db.prepare('SELECT * FROM saved_embeds WHERE guild_id = ? AND (LOWER(name) = ? OR id = ?)').get(guildId, clean, nameOrId);
  }
  static createEmbed(guildId, { name, title = null, description = null, color = '#5865F2' }) {
    const cleanName = name.toLowerCase().trim();
    const existing = this.getEmbed(guildId, cleanName);
    if (existing) {
      throw new Error(`An embed named "${cleanName}" already exists.`);
    }
    const id = crypto.randomUUID();
    const now = Date.now();
    db.prepare(`
      INSERT INTO saved_embeds (id, guild_id, name, title, description, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guildId, cleanName, title, description, color, now, now);
    return this.getEmbed(guildId, cleanName);
  }
  static updateEmbed(guildId, nameOrId, updates) {
    const emb = this.getEmbed(guildId, nameOrId);
    if (!emb) return null;
    const keys = Object.keys(updates);
    if (keys.length === 0) return emb;
    const histId = crypto.randomUUID();
    const versionCount = db.prepare('SELECT COUNT(*) as c FROM embed_history WHERE embed_id = ?').get(emb.id).c;
    db.prepare(`
      INSERT INTO embed_history (id, embed_id, guild_id, version, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(histId, emb.id, guildId, versionCount + 1, JSON.stringify(emb), Date.now());
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => {
      if (k === 'fields_data' && typeof updates[k] === 'object') return JSON.stringify(updates[k]);
      return updates[k];
    });
    values.push(Date.now(), emb.id);
    db.prepare(`
      UPDATE saved_embeds
      SET ${setClauses}, updated_at = ?
      WHERE id = ?
    `).run(...values);
    return this.getEmbed(guildId, emb.id);
  }
  static deleteEmbed(guildId, nameOrId) {
    const emb = this.getEmbed(guildId, nameOrId);
    if (!emb) return false;
    db.prepare('DELETE FROM embed_history WHERE embed_id = ?').run(emb.id);
    return db.prepare('DELETE FROM saved_embeds WHERE id = ?').run(emb.id).changes > 0;
  }
  static renameEmbed(guildId, oldName, newName) {
    const cleanNew = newName.toLowerCase().trim();
    if (this.getEmbed(guildId, cleanNew)) {
      throw new Error(`The name "${cleanNew}" is already taken.`);
    }
    const emb = this.getEmbed(guildId, oldName);
    if (!emb) return false;
    return db.prepare('UPDATE saved_embeds SET name = ?, updated_at = ? WHERE id = ?').run(cleanNew, Date.now(), emb.id).changes > 0;
  }
  static setArchived(guildId, nameOrId, archived) {
    const emb = this.getEmbed(guildId, nameOrId);
    if (!emb) return false;
    return db.prepare('UPDATE saved_embeds SET archived = ?, updated_at = ? WHERE id = ?').run(archived ? 1 : 0, Date.now(), emb.id).changes > 0;
  }
  static addField(guildId, nameOrId, name, value, inline = false) {
    const emb = this.getEmbed(guildId, nameOrId);
    if (!emb) return null;
    const fields = JSON.parse(emb.fields_data || '[]');
    if (fields.length >= 25) throw new Error('An embed cannot contain more than 25 fields.');
    fields.push({ name, value, inline: !!inline });
    return this.updateEmbed(guildId, emb.id, { fields_data: fields });
  }
  static removeField(guildId, nameOrId, index) {
    const emb = this.getEmbed(guildId, nameOrId);
    if (!emb) return null;
    const fields = JSON.parse(emb.fields_data || '[]');
    if (index >= 0 && index < fields.length) {
      fields.splice(index, 1);
      return this.updateEmbed(guildId, emb.id, { fields_data: fields });
    }
    return emb;
  }
  static clearFields(guildId, nameOrId) {
    return this.updateEmbed(guildId, nameOrId, { fields_data: [] });
  }
  static getTemplates(guildId) {
    return db.prepare('SELECT * FROM embed_templates WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static createTemplate(guildId, name, embedData) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO embed_templates (id, guild_id, name, data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, name.toLowerCase().trim(), JSON.stringify(embedData), Date.now());
    return id;
  }
  static deleteTemplate(guildId, name) {
    return db.prepare('DELETE FROM embed_templates WHERE guild_id = ? AND LOWER(name) = ?').run(guildId, name.toLowerCase().trim()).changes > 0;
  }
  static createSnapshot(guildId, name = 'Snapshot Embeds') {
    const id = crypto.randomUUID();
    const embeds = this.getEmbeds(guildId, true);
    const templates = this.getTemplates(guildId);
    db.prepare(`
      INSERT INTO embed_snapshots (id, guild_id, name, data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, name, JSON.stringify({ embeds, templates }), Date.now());
    return id;
  }
  static getSnapshots(guildId) {
    return db.prepare('SELECT id, name, created_at FROM embed_snapshots WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static restoreSnapshot(guildId, snapshotId) {
    const snap = db.prepare('SELECT * FROM embed_snapshots WHERE guild_id = ? AND (id = ? OR name = ?) ORDER BY created_at DESC LIMIT 1').get(guildId, snapshotId, snapshotId);
    if (!snap) return false;
    const data = JSON.parse(snap.data);
    if (Array.isArray(data.embeds)) {
      for (const e of data.embeds) {
        if (!this.getEmbed(guildId, e.name)) {
          this.createEmbed(guildId, {
            name: e.name,
            title: e.title,
            description: e.description,
            color: e.color
          });
        }
      }
    }
    return true;
  }
  static buildDiscordEmbed(embedData) {
    const embed = new EmbedBuilder();
    if (embedData.title) embed.setTitle(embedData.title);
    if (embedData.title_url) embed.setURL(embedData.title_url);
    if (embedData.description) embed.setDescription(embedData.description);
    if (embedData.color) embed.setColor(embedData.color);
    if (embedData.author_name) {
      embed.setAuthor({
        name: embedData.author_name,
        iconURL: embedData.author_icon || undefined,
        url: embedData.author_url || undefined
      });
    }
    if (embedData.footer_text) {
      embed.setFooter({
        text: embedData.footer_text,
        iconURL: embedData.footer_icon || undefined
      });
    }
    if (embedData.thumbnail_url) embed.setThumbnail(embedData.thumbnail_url);
    if (embedData.image_url) embed.setImage(embedData.image_url);
    if (embedData.timestamp_enabled) embed.setTimestamp();
    if (embedData.fields_data) {
      try {
        const fields = typeof embedData.fields_data === 'string' ? JSON.parse(embedData.fields_data) : embedData.fields_data;
        if (Array.isArray(fields) && fields.length > 0) {
          embed.addFields(fields);
        }
      } catch (_) {}
    }
    return embed;
  }
}
module.exports = EmbedService;
