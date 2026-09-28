const dbManager = require('../../utils/database');
const db = dbManager.db;
db.exec(`
  CREATE TABLE IF NOT EXISTS ticket_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    maintenance INTEGER NOT NULL DEFAULT 0,
    support_role_id TEXT,
    manager_role_id TEXT,
    admin_role_id TEXT,
    category_id TEXT,
    archive_category_id TEXT,
    log_channel_id TEXT,
    transcript_channel_id TEXT,
    naming_format TEXT NOT NULL DEFAULT 'ticket-{number}',
    ticket_counter INTEGER NOT NULL DEFAULT 0,
    user_limit INTEGER NOT NULL DEFAULT 3,
    auto_close_hours INTEGER NOT NULL DEFAULT 48,
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT,
    user_id TEXT NOT NULL,
    ticket_number INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'Support',
    topic TEXT NOT NULL DEFAULT 'General assistance',
    status TEXT NOT NULL DEFAULT 'OPEN',
    priority TEXT NOT NULL DEFAULT 'NORMAL',
    claimed_by TEXT,
    assigned_to TEXT,
    close_reason TEXT,
    closed_by TEXT,
    created_at INTEGER NOT NULL,
    closed_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS ticket_panels (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    channel_id TEXT,
    message_id TEXT,
    button_label TEXT NOT NULL DEFAULT 'Open a ticket',
    button_emoji TEXT NOT NULL DEFAULT '📩',
    category_name TEXT NOT NULL DEFAULT 'Support',
    published INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS ticket_categories (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT NOT NULL DEFAULT '🎫',
    discord_category_id TEXT
  );
  CREATE TABLE IF NOT EXISTS ticket_notes (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ticket_blacklist (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT,
    added_by TEXT,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS ticket_transcripts (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
class TicketService {
  static getSettings(guildId) {
    let row = db.prepare('SELECT * FROM ticket_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      db.prepare('INSERT OR IGNORE INTO ticket_settings (guild_id) VALUES (?)').run(guildId);
      row = db.prepare('SELECT * FROM ticket_settings WHERE guild_id = ?').get(guildId);
    }
    return row;
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
    db.prepare(`UPDATE ticket_settings SET ${fields.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  static createTicket(guildId, userId, category = 'Support', topic = 'General assistance', channelId = null) {
    const settings = this.getSettings(guildId);
    const nextNumber = (settings.ticket_counter || 0) + 1;
    this.updateSettings(guildId, { ticket_counter: nextNumber });
    const id = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO tickets (id, guild_id, channel_id, user_id, ticket_number, category, topic, status, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', 'NORMAL', ?)
    `).run(id, guildId, channelId, userId, nextNumber, category, topic, now);
    return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  }
  static getTicket(idOrChannelId) {
    return db.prepare('SELECT * FROM tickets WHERE id = ? OR channel_id = ?').get(idOrChannelId, idOrChannelId);
  }
  static getTickets(guildId, status = null) {
    if (status) {
      return db.prepare('SELECT * FROM tickets WHERE guild_id = ? AND status = ? ORDER BY created_at DESC').all(guildId, status);
    }
    return db.prepare('SELECT * FROM tickets WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);
  }
  static getUserActiveTickets(guildId, userId) {
    return db.prepare('SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status IN (\'OPEN\', \'CLAIMED\')').all(guildId, userId);
  }
  static closeTicket(ticketId, closedBy, reason = 'Normal closure') {
    db.prepare(`
      UPDATE tickets
      SET status = 'CLOSED', closed_by = ?, close_reason = ?, closed_at = ?
      WHERE id = ?
    `).run(closedBy, reason, Date.now(), ticketId);
    return this.getTicket(ticketId);
  }
  static reopenTicket(ticketId) {
    db.prepare(`
      UPDATE tickets
      SET status = 'OPEN', closed_at = NULL, close_reason = NULL, closed_by = NULL
      WHERE id = ?
    `).run(ticketId);
    return this.getTicket(ticketId);
  }
  static claimTicket(ticketId, claimedBy) {
    db.prepare(`
      UPDATE tickets
      SET status = 'CLAIMED', claimed_by = ?
      WHERE id = ?
    `).run(claimedBy, ticketId);
    return this.getTicket(ticketId);
  }
  static unclaimTicket(ticketId) {
    db.prepare(`
      UPDATE tickets
      SET status = 'OPEN', claimed_by = NULL
      WHERE id = ?
    `).run(ticketId);
    return this.getTicket(ticketId);
  }
  static assignTicket(ticketId, assignedTo) {
    db.prepare('UPDATE tickets SET assigned_to = ? WHERE id = ?').run(assignedTo, ticketId);
    return this.getTicket(ticketId);
  }
  static setPriority(ticketId, priority) {
    db.prepare('UPDATE tickets SET priority = ? WHERE id = ?').run(priority.toUpperCase(), ticketId);
    return this.getTicket(ticketId);
  }
  static deleteTicket(ticketId) {
    db.prepare('DELETE FROM ticket_notes WHERE ticket_id = ?').run(ticketId);
    return db.prepare('DELETE FROM tickets WHERE id = ?').run(ticketId);
  }
  static getStats(guildId) {
    const total = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild_id = ?').get(guildId).count;
    const open = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status IN (\'OPEN\', \'CLAIMED\')').get(guildId).count;
    const closed = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status = \'CLOSED\'').get(guildId).count;
    const claimed = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status = \'CLAIMED\'').get(guildId).count;
    return { total, open, closed, claimed };
  }
  static createPanel(guildId, title, description, categoryName = 'Support') {
    const id = `panel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO ticket_panels (id, guild_id, title, description, category_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, guildId, title, description, categoryName);
    return db.prepare('SELECT * FROM ticket_panels WHERE id = ?').get(id);
  }
  static getPanels(guildId) {
    return db.prepare('SELECT * FROM ticket_panels WHERE guild_id = ?').all(guildId);
  }
  static addNote(ticketId, authorId, content) {
    const id = `tnote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO ticket_notes (id, ticket_id, author_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, ticketId, authorId, content, Date.now());
    return { id, ticket_id: ticketId, content, created_at: Date.now() };
  }
  static getNotes(ticketId) {
    return db.prepare('SELECT * FROM ticket_notes WHERE ticket_id = ? ORDER BY created_at ASC').all(ticketId);
  }
  static isBlacklisted(guildId, userId) {
    const row = db.prepare('SELECT * FROM ticket_blacklist WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    return !!row;
  }
  static addToBlacklist(guildId, userId, reason = 'Non spécifié', addedBy = null) {
    db.prepare(`
      INSERT OR REPLACE INTO ticket_blacklist (guild_id, user_id, reason, added_by, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(guildId, userId, reason, addedBy, Date.now());
    return true;
  }
  static removeFromBlacklist(guildId, userId) {
    const res = db.prepare('DELETE FROM ticket_blacklist WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
    return res.changes > 0;
  }
}
module.exports = TicketService;
