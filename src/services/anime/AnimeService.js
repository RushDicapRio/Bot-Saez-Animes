const dbManager = require('../../utils/database');
const db = dbManager.db;
const crypto = require('crypto');
db.exec(`
  CREATE TABLE IF NOT EXISTS anime_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    nsfw_allowed INTEGER NOT NULL DEFAULT 0,
    spoiler_protection INTEGER NOT NULL DEFAULT 1,
    auto_alerts INTEGER NOT NULL DEFAULT 1,
    update_channel_id TEXT DEFAULT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS anime_watchlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    anime_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'watching', -- watching, completed, planned, dropped, paused, rewatching
    episodes_watched INTEGER NOT NULL DEFAULT 0,
    total_episodes INTEGER NOT NULL DEFAULT 12,
    score REAL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS anime_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    anime_id TEXT NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT,
    added_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS anime_custom_lists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 1,
    anime_ids_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS anime_reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    anime_id TEXT NOT NULL,
    score REAL NOT NULL,
    review_text TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS anime_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    guild_id TEXT,
    anime_id TEXT NOT NULL,
    title TEXT NOT NULL,
    alert_type TEXT NOT NULL DEFAULT 'release',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS anime_watch_parties (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    host_user_id TEXT NOT NULL,
    anime_title TEXT NOT NULL,
    episode INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    members_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS anime_server_entries (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    anime_id TEXT NOT NULL,
    title TEXT NOT NULL,
    added_by TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS anime_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    anime_id TEXT NOT NULL,
    title TEXT NOT NULL,
    viewed_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_watchlist_user ON anime_watchlist(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON anime_favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_history_user ON anime_history(user_id);
`);
const BUILTIN_ANIMES = [
  {
    id: '1',
    title: 'Frieren: Beyond Journey\'s End',
    japaneseTitle: 'Sousou no Frieren',
    format: 'TV',
    episodes: 28,
    status: 'End',
    season: 'Autumn 2023',
    score: 9.38,
    ranking: 1,
    popularity: 14,
    studio: 'Madhouse',
    genres: ["Adventure", "Drama", "Fantasy"],
    synopsis: 'The story follows the elf mage Frieren after the defeat of the Demon King and the introspective journey she undertakes to better understand humanity.',
    characters: ['Frieren', 'Fern', 'Stark', 'Himmel', 'Heiter', 'Eisen'],
    trailer: 'https://youtube.com/watch?v=qgQunxD0qMo',
    banner: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg'
  },
  {
    id: '2',
    title: 'Fullmetal Alchemist: Brotherhood',
    japaneseTitle: 'Hagane no Renkinjutsushi: Fullmetal Alchemist',
    format: 'TV',
    episodes: 64,
    status: 'End',
    season: 'Spring 2009',
    score: 9.10,
    ranking: 2,
    popularity: 3,
    studio: 'Bones',
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
    synopsis: 'Two alchemist brothers travel the world in search of the legendary Philosopher\'s Stone to restore their lost bodies.',
    characters: ['Edward Elric', 'Alphonse Elric', 'Roy Mustang', 'Riza Hawkeye', 'Winry Rockbell'],
    trailer: 'https://youtube.com/watch?v=--IcmZkvL0Q',
    banner: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg'
  },
  {
    id: '3',
    title: 'Attack on Titan',
    japaneseTitle: 'Shingeki no Kyojin',
    format: 'TV',
    episodes: 89,
    status: 'End',
    season: 'Spring 2013',
    score: 8.54,
    ranking: 85,
    popularity: 1,
    studio: 'Wit Studio / MAPPA',
    genres: ['Action', 'Drama', 'Suspense', 'Mystery'],
    synopsis: 'Humanity lives secluded behind immense walls to protect itself from giant, man-eating creatures: the Titans.',
    characters: ['Eren Yeager', 'Mikasa Ackerman', 'Armin Arlert', 'Levi Ackerman', 'Erwin Smith'],
    trailer: 'https://youtube.com/watch?v=MGRm4IzK1SQ',
    banner: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg'
  },
  {
    id: '4',
    title: 'Jujutsu Kaisen',
    japaneseTitle: 'Jujutsu Kaisen',
    format: 'TV',
    episodes: 47,
    status: 'In progress',
    season: 'Autumn 2020',
    score: 8.60,
    ranking: 70,
    popularity: 4,
    studio: 'MAPPA',
    genres: ['Action', 'Fantasy', 'Supernatural'],
    synopsis: 'Yuji Itadori swallows a legendary cursed finger and finds himself drawn into the secret world of exorcists.',
    characters: ['Yuji Itadori', 'Megumi Fushiguro', 'Nobara Kugisaki', 'Satoru Gojo', 'Ryomen Sukuna'],
    trailer: 'https://youtube.com/watch?v=pkKu9hLT-t8',
    banner: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg'
  },
  {
    id: '5',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    japaneseTitle: 'Kimetsu no Yaiba',
    format: 'TV',
    episodes: 55,
    status: 'In progress',
    season: 'Spring 2019',
    score: 8.48,
    ranking: 120,
    popularity: 2,
    studio: 'ufotable',
    genres: ['Action', 'Fantasy', 'Historical'],
    synopsis: 'Tanjiro Kamado becomes a Demon Slayer to save his sister Nezuko, who has been transformed into a demon.',
    characters: ['Tanjiro Kamado', 'Nezuko Kamado', 'Zenitsu Agatsuma', 'Inosuke Hashibira', 'Giyu Tomioka'],
    trailer: 'https://youtube.com/watch?v=VQGCKyvzIM4',
    banner: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg'
  },
  {
    id: '6',
    title: 'Steins;Gate',
    japaneseTitle: 'Steins;Gate',
    format: 'TV',
    episodes: 24,
    status: 'End',
    season: 'Spring 2011',
    score: 9.07,
    ranking: 3,
    popularity: 13,
    studio: 'White Fox',
    genres: ['Drama', 'Science Fiction', 'Suspense'],
    synopsis: 'A self-proclaimed mad scientist accidentally discovers a way to send messages into the past.',
    characters: ['Rintarou Okabe', 'Kurisu Makise', 'Mayuri Shiina', 'Itaru Hashida', 'Suzuha Amane'],
    trailer: 'https://youtube.com/watch?v=27OZcZOHchU',
    banner: 'https://cdn.myanimelist.net/images/anime/5/73797l.jpg'
  },
  {
    id: '7',
    title: 'Death Note',
    japaneseTitle: 'Death Note',
    format: 'TV',
    episodes: 37,
    status: 'End',
    season: 'Autumn 2006',
    score: 8.62,
    ranking: 65,
    popularity: 5,
    studio: 'Madhouse',
    genres: ['Supernatural', 'Suspense', 'Psychological'],
    synopsis: 'A brilliant high school student finds a supernatural notebook capable of killing anyone whose name is written in it.',
    characters: ['Light Yagami', 'L Lawliet', 'Ryuk', 'Misa Amane', 'Near'],
    trailer: 'https://youtube.com/watch?v=NlJZ-YgAt-c',
    banner: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg'
  },
  {
    id: '8',
    title: 'One Piece',
    japaneseTitle: 'One Piece',
    format: 'TV',
    episodes: 1100,
    status: 'In progress',
    season: 'Autumn 1999',
    score: 8.72,
    ranking: 45,
    popularity: 7,
    studio: 'Toei Animation',
    genres: ['Action', 'Adventure', 'Comedy', 'Fantasy'],
    synopsis: 'Monkey D. Luffy and his pirate crew sail the seas in search of the ultimate treasure, the One Piece.',
    characters: ['Monkey D. Luffy', 'Roronoa Zoro', 'Nami', 'Usopp', 'Sanji', 'Tony Tony Chopper'],
    trailer: 'https://youtube.com/watch?v=MCb13lbKps8',
    banner: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg'
  },
  {
    id: '9',
    title: 'Spirited Away',
    japaneseTitle: 'Sen to Chihiro no Kamikakushi',
    format: 'Film',
    episodes: 1,
    status: 'End',
    season: 'Summer 2001',
    score: 8.78,
    ranking: 38,
    popularity: 18,
    studio: 'Studio Ghibli',
    genres: ['Adventure', 'Supernatural', 'Fantasy'],
    synopsis: 'Chihiro, a ten-year-old girl, enters the spirit world ruled by the witch Yubaba.',
    characters: ['Chihiro Ogino', 'Haku', 'Yubaba', 'Kamaji', 'Sans-Visage'],
    trailer: 'https://youtube.com/watch?v=ByXuk9QqQkk',
    banner: 'https://cdn.myanimelist.net/images/anime/10/75815l.jpg'
  },
  {
    id: '10',
    title: 'Cowboy Bebop',
    japaneseTitle: 'Cowboy Bebop',
    format: 'TV',
    episodes: 26,
    status: 'End',
    season: 'Spring 1998',
    score: 8.75,
    ranking: 41,
    popularity: 42,
    studio: 'Sunrise',
    genres: ['Action', 'Science Fiction', 'Spatial'],
    synopsis: 'In 2071, a motley crew of bounty hunters travels the solar system aboard the spaceship Bebop.',
    characters: ['Spike Spiegel', 'Jet Black', 'Faye Valentine', 'Edward Wong', 'Ein'],
    trailer: 'https://youtube.com/watch?v=qig4KOK2R2g',
    banner: 'https://cdn.myanimelist.net/images/anime/4/19644l.jpg'
  }
];
class AnimeService {
  static getBuiltinAnimes() {
    return BUILTIN_ANIMES;
  }
  static searchAnime(query) {
    if (!query) return BUILTIN_ANIMES.slice(0, 5);
    const q = query.toLowerCase().trim();
    return BUILTIN_ANIMES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.japaneseTitle.toLowerCase().includes(q) ||
      a.genres.some(g => g.toLowerCase().includes(q)) ||
      a.studio.toLowerCase().includes(q) ||
      a.characters.some(c => c.toLowerCase().includes(q))
    );
  }
  static getAnimeById(id) {
    return BUILTIN_ANIMES.find(a => a.id === String(id)) || null;
  }
  static getRandomAnime(filter = null) {
    let list = BUILTIN_ANIMES;
    if (filter === 'classic') {
      list = BUILTIN_ANIMES.filter(a => parseInt(a.season.match(/\d{4}/)?.[0] || '2020', 10) < 2012);
    } else if (filter === 'new') {
      list = BUILTIN_ANIMES.filter(a => parseInt(a.season.match(/\d{4}/)?.[0] || '2020', 10) >= 2019);
    }
    const idx = Math.floor(Math.random() * list.length);
    return list[idx] || BUILTIN_ANIMES[0];
  }
  static getSettings(guildId) {
    const row = db.prepare('SELECT * FROM anime_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      const now = Date.now();
      const defaultSettings = {
        guild_id: guildId,
        enabled: 1,
        nsfw_allowed: 0,
        spoiler_protection: 1,
        auto_alerts: 1,
        update_channel_id: null,
        updated_at: now
      };
      db.prepare(`
        INSERT INTO anime_settings (guild_id, enabled, nsfw_allowed, spoiler_protection, auto_alerts, update_channel_id, updated_at)
        VALUES (@guild_id, @enabled, @nsfw_allowed, @spoiler_protection, @auto_alerts, @update_channel_id, @updated_at)
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
      UPDATE anime_settings
      SET enabled = @enabled,
          nsfw_allowed = @nsfw_allowed,
          spoiler_protection = @spoiler_protection,
          auto_alerts = @auto_alerts,
          update_channel_id = @update_channel_id,
          updated_at = @updated_at
      WHERE guild_id = @guild_id
    `).run(updated);
    return updated;
  }
  static getWatchlist(userId, status = null) {
    if (status) {
      return db.prepare('SELECT * FROM anime_watchlist WHERE user_id = ? AND status = ? ORDER BY updated_at DESC').all(userId, status);
    }
    return db.prepare('SELECT * FROM anime_watchlist WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
  }
  static getWatchlistEntry(userId, animeId) {
    return db.prepare('SELECT * FROM anime_watchlist WHERE user_id = ? AND (anime_id = ? OR title LIKE ?)').get(userId, animeId, `%${animeId}%`);
  }
  static setWatchlistEntry(userId, animeId, title, data = {}) {
    const existing = this.getWatchlistEntry(userId, animeId);
    const now = Date.now();
    if (existing) {
      const updated = {
        id: existing.id,
        status: data.status || existing.status,
        episodes_watched: data.episodes_watched !== undefined ? data.episodes_watched : existing.episodes_watched,
        total_episodes: data.total_episodes || existing.total_episodes,
        score: data.score !== undefined ? data.score : existing.score,
        notes: data.notes || existing.notes,
        updated_at: now
      };
      db.prepare(`
        UPDATE anime_watchlist
        SET status = @status,
            episodes_watched = @episodes_watched,
            total_episodes = @total_episodes,
            score = @score,
            notes = @notes,
            updated_at = @updated_at
        WHERE id = @id
      `).run(updated);
      return updated;
    } else {
      const id = crypto.randomUUID();
      const entry = {
        id,
        user_id: userId,
        anime_id: String(animeId),
        title: title || 'Unknown Anime',
        status: data.status || 'watching',
        episodes_watched: data.episodes_watched || 0,
        total_episodes: data.total_episodes || 12,
        score: data.score || null,
        notes: data.notes || null,
        updated_at: now
      };
      db.prepare(`
        INSERT INTO anime_watchlist (id, user_id, anime_id, title, status, episodes_watched, total_episodes, score, notes, updated_at)
        VALUES (@id, @user_id, @anime_id, @title, @status, @episodes_watched, @total_episodes, @score, @notes, @updated_at)
      `).run(entry);
      return entry;
    }
  }
  static removeWatchlistEntry(userId, animeId) {
    const res = db.prepare('DELETE FROM anime_watchlist WHERE user_id = ? AND (anime_id = ? OR title LIKE ?)').run(userId, animeId, `%${animeId}%`);
    return res.changes > 0;
  }
  static getFavorites(userId) {
    return db.prepare('SELECT * FROM anime_favorites WHERE user_id = ? ORDER BY added_at DESC').all(userId);
  }
  static addFavorite(userId, animeId, title, imageUrl = null) {
    const existing = db.prepare('SELECT * FROM anime_favorites WHERE user_id = ? AND (anime_id = ? OR title = ?)').get(userId, animeId, title);
    if (existing) return existing;
    const id = crypto.randomUUID();
    const entry = {
      id,
      user_id: userId,
      anime_id: String(animeId),
      title,
      image_url: imageUrl,
      added_at: Date.now()
    };
    db.prepare(`
      INSERT INTO anime_favorites (id, user_id, anime_id, title, image_url, added_at)
      VALUES (@id, @user_id, @anime_id, @title, @image_url, @added_at)
    `).run(entry);
    return entry;
  }
  static removeFavorite(userId, animeId) {
    const res = db.prepare('DELETE FROM anime_favorites WHERE user_id = ? AND (anime_id = ? OR title LIKE ?)').run(userId, animeId, `%${animeId}%`);
    return res.changes > 0;
  }
  static clearFavorites(userId) {
    const res = db.prepare('DELETE FROM anime_favorites WHERE user_id = ?').run(userId);
    return res.changes;
  }
  static getCustomLists(userId) {
    return db.prepare('SELECT * FROM anime_custom_lists WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }
  static createCustomList(userId, name) {
    const id = crypto.randomUUID();
    const entry = {
      id,
      user_id: userId,
      name,
      is_public: 1,
      anime_ids_json: '[]',
      created_at: Date.now()
    };
    db.prepare(`
      INSERT INTO anime_custom_lists (id, user_id, name, is_public, anime_ids_json, created_at)
      VALUES (@id, @user_id, @name, @is_public, @anime_ids_json, @created_at)
    `).run(entry);
    return entry;
  }
  static deleteCustomList(userId, listIdOrName) {
    const res = db.prepare('DELETE FROM anime_custom_lists WHERE user_id = ? AND (id = ? OR name LIKE ?)').run(userId, listIdOrName, `%${listIdOrName}%`);
    return res.changes > 0;
  }
  static addReview(userId, animeId, score, reviewText) {
    const existing = db.prepare('SELECT * FROM anime_reviews WHERE user_id = ? AND anime_id = ?').get(userId, animeId);
    const now = Date.now();
    if (existing) {
      db.prepare(`
        UPDATE anime_reviews
        SET score = ?, review_text = ?, updated_at = ?
        WHERE id = ?
      `).run(score, reviewText, now, existing.id);
      return { ...existing, score, review_text: reviewText, updated_at: now };
    }
    const id = crypto.randomUUID();
    const review = { id, user_id: userId, anime_id: String(animeId), score, review_text: reviewText, created_at: now, updated_at: now };
    db.prepare(`
      INSERT INTO anime_reviews (id, user_id, anime_id, score, review_text, created_at, updated_at)
      VALUES (@id, @user_id, @anime_id, @score, @review_text, @created_at, @updated_at)
    `).run(review);
    return review;
  }
  static getReviews(animeId) {
    return db.prepare('SELECT * FROM anime_reviews WHERE anime_id = ? ORDER BY created_at DESC').all(String(animeId));
  }
  static createWatchParty(guildId, channelId, hostUserId, animeTitle, episode = 1) {
    const id = crypto.randomUUID();
    const entry = {
      id,
      guild_id: guildId,
      channel_id: channelId,
      host_user_id: hostUserId,
      anime_title: animeTitle,
      episode,
      status: 'active',
      members_json: JSON.stringify([hostUserId]),
      created_at: Date.now()
    };
    db.prepare(`
      INSERT INTO anime_watch_parties (id, guild_id, channel_id, host_user_id, anime_title, episode, status, members_json, created_at)
      VALUES (@id, @guild_id, @channel_id, @host_user_id, @anime_title, @episode, @status, @members_json, @created_at)
    `).run(entry);
    return entry;
  }
  static getWatchParty(guildId) {
    return db.prepare('SELECT * FROM anime_watch_parties WHERE guild_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1').get(guildId);
  }
  static endWatchParty(guildId) {
    const res = db.prepare('UPDATE anime_watch_parties SET status = "ended" WHERE guild_id = ? AND status = "active"').run(guildId);
    return res.changes > 0;
  }
  static logHistory(userId, animeId, title) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO anime_history (id, user_id, anime_id, title, viewed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, String(animeId), title, Date.now());
  }
  static getHistory(userId, limit = 10) {
    return db.prepare('SELECT * FROM anime_history WHERE user_id = ? ORDER BY viewed_at DESC LIMIT ?').all(userId, limit);
  }
  static clearHistory(userId) {
    const res = db.prepare('DELETE FROM anime_history WHERE user_id = ?').run(userId);
    return res.changes;
  }
  static getUserStats(userId) {
    const watchlist = this.getWatchlist(userId);
    const favorites = this.getFavorites(userId);
    let totalEpisodes = 0;
    let completedCount = 0;
    let watchingCount = 0;
    for (const item of watchlist) {
      totalEpisodes += item.episodes_watched || 0;
      if (item.status === 'completed') completedCount++;
      if (item.status === 'watching') watchingCount++;
    }
    const estimatedHours = Math.round((totalEpisodes * 24) / 60);
    return {
      watchlistTotal: watchlist.length,
      favoritesTotal: favorites.length,
      totalEpisodes,
      completedCount,
      watchingCount,
      estimatedHours
    };
  }
}
module.exports = AnimeService;
