const dbManager = require('../../utils/database');
class ImageService {
  constructor() {
    this.db = dbManager.db;
  }
  saveImage({ guildId, userId, prompt, imageUrl, style = 'standard' }) {
    const id = 'img_' + Math.random().toString(36).substring(2, 9);
    const createdAt = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO image_gallery (id, guild_id, user_id, prompt, image_url, style, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, guildId, userId, prompt, imageUrl, style, createdAt);
    return { id, guildId, userId, prompt, imageUrl, style, createdAt };
  }
  getImage(id) {
    return this.db.prepare('SELECT * FROM image_gallery WHERE id = ?').get(id) || null;
  }
  getUserImages(userId, limit = 10) {
    return this.db.prepare('SELECT * FROM image_gallery WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
  }
  toggleFavorite(userId, imageId) {
    const existing = this.db.prepare('SELECT * FROM image_favorites WHERE user_id = ? AND image_id = ?').get(userId, imageId);
    if (existing) {
      this.db.prepare('DELETE FROM image_favorites WHERE user_id = ? AND image_id = ?').run(userId, imageId);
      return false; 
    } else {
      this.db.prepare('INSERT INTO image_favorites (user_id, image_id, added_at) VALUES (?, ?, ?)').run(userId, imageId, Date.now());
      return true; 
    }
  }
  getFavorites(userId, limit = 10) {
    return this.db.prepare(`
      SELECT g.* FROM image_gallery g
      JOIN image_favorites f ON g.id = f.image_id
      WHERE f.user_id = ?
      ORDER BY f.added_at DESC
      LIMIT ?
    `).all(userId, limit);
  }
  getSettings(guildId) {
    const row = this.db.prepare('SELECT * FROM image_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      return {
        guild_id: guildId,
        enabled: 1,
        allowed_channel_id: null,
        nsfw_filter: 1,
        default_model: 'stable-diffusion-xl',
        daily_limit: 50
      };
    }
    return row;
  }
  expandPrompt(prompt, style = 'realistic') {
    const enhancers = {
      realistic: 'photorealistic, ultra detailed, 8k resolution, cinematic lighting, masterpiece, sharp focus',
      anime: 'anime aesthetic, makoto shinkai style, vibrant colors, detailed lineart, studio ghibli lighting',
      cyberpunk: 'neon glow, futuristic cityscape, dark moody atmosphere, holographic reflections, synthwave colors',
      fantasy: 'epic fantasy art, mythical glowing elements, ethereal atmosphere, greg rutkowski style, highly detailed',
      cinematic: '35mm film photograph, dramatic rim lighting, shallow depth of field, blockbuster movie still',
      pixelart: '16-bit pixel art, nostalgic arcade style, crisp retro pixels, isometric view'
    };
    const suffix = enhancers[style.toLowerCase()] || enhancers.realistic;
    return `${prompt.trim()}, ${suffix}`;
  }
}
module.exports = new ImageService();
