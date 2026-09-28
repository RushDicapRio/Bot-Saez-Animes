const { db } = require('../../utils/database');
class WeatherService {
  constructor() {
    this.initTables();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS weather_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        default_location TEXT DEFAULT 'Paris',
        unit_temperature TEXT DEFAULT 'celsius',
        unit_wind TEXT DEFAULT 'kmh',
        unit_pressure TEXT DEFAULT 'hPa',
        unit_distance TEXT DEFAULT 'km',
        unit_precipitation TEXT DEFAULT 'mm',
        language TEXT DEFAULT 'fr',
        format TEXT DEFAULT 'detailed',
        channel_id TEXT,
        alerts_enabled INTEGER DEFAULT 1,
        embed_color TEXT DEFAULT '#3498DB',
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS weather_user_favorites (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        location TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS weather_alerts (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        location TEXT NOT NULL,
        title TEXT NOT NULL,
        severity TEXT DEFAULT 'warning',
        description TEXT,
        starts_at INTEGER,
        ends_at INTEGER,
        active INTEGER DEFAULT 1
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS weather_cache (
        location TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS weather_dashboards (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT,
        message_id TEXT,
        location TEXT NOT NULL,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS weather_stats (
        guild_id TEXT PRIMARY KEY,
        request_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        last_request INTEGER
      );
    `);
  }
  getSettings(guildId) {
    let settings = db.prepare('SELECT * FROM weather_settings WHERE guild_id = ?').get(guildId);
    if (!settings) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO weather_settings (
          guild_id, enabled, default_location, unit_temperature, unit_wind,
          unit_pressure, unit_distance, unit_precipitation, language, format,
          alerts_enabled, embed_color, created_at, updated_at
        ) VALUES (?, 1, 'Paris', 'celsius', 'kmh', 'hPa', 'km', 'mm', 'fr', 'detailed', 1, '#3498DB', ?, ?)
      `).run(guildId, now, now);
      settings = db.prepare('SELECT * FROM weather_settings WHERE guild_id = ?').get(guildId);
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
    db.prepare(`UPDATE weather_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  resetSettings(guildId) {
    db.prepare('DELETE FROM weather_settings WHERE guild_id = ?').run(guildId);
    return this.getSettings(guildId);
  }
  recordRequest(guildId, isError = false) {
    const now = Date.now();
    const existing = db.prepare('SELECT * FROM weather_stats WHERE guild_id = ?').get(guildId);
    if (existing) {
      if (isError) {
        db.prepare('UPDATE weather_stats SET request_count = request_count + 1, error_count = error_count + 1, last_request = ? WHERE guild_id = ?').run(now, guildId);
      } else {
        db.prepare('UPDATE weather_stats SET request_count = request_count + 1, last_request = ? WHERE guild_id = ?').run(now, guildId);
      }
    } else {
      db.prepare('INSERT INTO weather_stats (guild_id, request_count, error_count, last_request) VALUES (?, 1, ?, ?)').run(guildId, isError ? 1 : 0, now);
    }
  }
  getStats(guildId) {
    let row = db.prepare('SELECT * FROM weather_stats WHERE guild_id = ?').get(guildId);
    if (!row) row = { request_count: 0, error_count: 0, last_request: null };
    const favoritesCount = db.prepare('SELECT COUNT(*) as c FROM weather_user_favorites WHERE guild_id = ?').get(guildId).c;
    const cacheCount = db.prepare('SELECT COUNT(*) as c FROM weather_cache').get().c;
    const alertsCount = db.prepare('SELECT COUNT(*) as c FROM weather_alerts WHERE guild_id = ? AND active = 1').get(guildId).c;
    return { ...row, favoritesCount, cacheCount, alertsCount };
  }
  addFavorite(guildId, userId, location) {
    const id = `${guildId}_${userId}_${location.toLowerCase().trim()}`;
    db.prepare(`
      INSERT OR REPLACE INTO weather_user_favorites (id, guild_id, user_id, location, is_default, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(id, guildId, userId, location, Date.now());
    return true;
  }
  removeFavorite(guildId, userId, location) {
    db.prepare('DELETE FROM weather_user_favorites WHERE guild_id = ? AND user_id = ? AND LOWER(location) = LOWER(?)').run(guildId, userId, location.trim());
    return true;
  }
  getFavorites(guildId, userId) {
    return db.prepare('SELECT location, is_default FROM weather_user_favorites WHERE guild_id = ? AND user_id = ? ORDER BY created_at ASC').all(guildId, userId);
  }
  getAlerts(guildId, location = null) {
    if (location) {
      return db.prepare('SELECT * FROM weather_alerts WHERE guild_id = ? AND LOWER(location) = LOWER(?) AND active = 1').all(guildId, location.trim());
    }
    return db.prepare('SELECT * FROM weather_alerts WHERE guild_id = ? AND active = 1').all(guildId);
  }
  createAlert(guildId, location, title, severity = 'warning', description = '') {
    const id = `alt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO weather_alerts (id, guild_id, location, title, severity, description, starts_at, ends_at, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, guildId, location, title, severity, description, now, now + 86400000);
    return id;
  }
  getWeather(locationQuery = 'Paris') {
    const clean = locationQuery.trim() || 'Paris';
    const cached = db.prepare('SELECT * FROM weather_cache WHERE LOWER(location) = LOWER(?)').get(clean);
    const now = Date.now();
    if (cached && (now - cached.updated_at) < 15 * 60 * 1000) {
      try {
        return JSON.parse(cached.data_json);
      } catch (e) {}
    }
    const data = this.generateRealisticWeather(clean);
    db.prepare(`
      INSERT OR REPLACE INTO weather_cache (location, data_json, updated_at)
      VALUES (?, ?, ?)
    `).run(clean, JSON.stringify(data), now);
    return data;
  }
  clearCache() {
    const res = db.prepare('DELETE FROM weather_cache').run();
    return res.changes;
  }
  generateRealisticWeather(cityName) {
    const now = new Date();
    let hash = 0;
    for (let i = 0; i < cityName.length; i++) {
      hash = (hash << 5) - hash + cityName.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const baseTemp = 10 + (seed % 16); 
    const temp = Math.round(baseTemp + (Math.sin(now.getHours() / 24 * Math.PI * 2) * 5));
    const feelsLike = temp + ((seed % 3) - 1);
    const minTemp = temp - 4;
    const maxTemp = temp + 5;
    const humidity = 45 + (seed % 45); 
    const pressure = 1010 + ((seed % 15) - 7); 
    const windSpeed = 10 + (seed % 35); 
    const uvIndex = Math.min(9, Math.max(1, Math.round((seed % 8) + (temp > 20 ? 2 : 0))));
    const cloudCover = (seed * 7) % 100;
    const rainProb = cloudCover > 50 ? (seed % 60) + 20 : (seed % 25);
    const airQuality = ['Excellent', 'Good', 'Moderate', 'Deteriorated', 'Poor'][(seed % 5)];
    let condition = 'Sunny ☀️';
    let icon = '☀️';
    if (rainProb > 60) {
      condition = 'Moderate rain 🌧️';
      icon = '🌧️';
    } else if (rainProb > 35) {
      condition = 'Passing showers 🌦️';
      icon = '🌦️';
    } else if (cloudCover > 70) {
      condition = 'Very cloudy ☁️';
      icon = '☁️';
    } else if (cloudCover > 30) {
      condition = 'Sunny spells ⛅';
      icon = '⛅';
    }
    return {
      city: cityName.charAt(0).toUpperCase() + cityName.slice(1),
      country: 'FR / International',
      coordinates: { lat: 48.85 + ((seed % 100) / 100), lon: 2.35 + ((seed % 100) / 100) },
      condition,
      icon,
      temperature: temp,
      feelsLike,
      tempMin: minTemp,
      tempMax: maxTemp,
      humidity,
      pressure,
      windSpeed,
      windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][(seed % 8)],
      windGust: Math.round(windSpeed * 1.3),
      uvIndex,
      airQuality,
      cloudCover,
      rainProbability: rainProb,
      rainAmount: (rainProb > 40 ? ((seed % 80) / 10).toFixed(1) : '0.0'),
      visibilityKm: Math.max(5, 20 - (cloudCover / 10)).toFixed(1),
      dewPoint: Math.round(temp - ((100 - humidity) / 5)),
      sunrise: '07:18',
      sunset: '19:42',
      moonPhase: ['New moon 🌑', 'First crescent moon 🌒', 'First quarter 🌓', 'Waxing gibbous 🌔', 'Full moon 🌕', 'Waning gibbous 🌖', 'Last quarter 🌗', 'Last crescent moon 🌘'][(now.getDate() % 8)],
      comfortIndex: (temp >= 18 && temp <= 24 && humidity < 70) ? 'Optimal 🟢' : 'Moderate 🟡',
      clothingAdvice: temp > 22 ? 'T-shirt, sunglasses, and cap recommended. 🧢' : (temp > 14 ? 'Light jacket or thin sweater 🧥' : 'Warm coat and scarf recommended. 🧣'),
      umbrellaAdvice: rainProb > 40 ? 'Take an umbrella just in case ! ☔' : 'No need for an umbrella today. ! 🕶️',
      timestamp: now.toISOString()
    };
  }
}
module.exports = new WeatherService();
