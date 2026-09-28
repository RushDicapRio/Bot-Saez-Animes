const { db } = require('../../utils/database');
const crypto = require('crypto');
const DEFAULT_QUESTIONS = [
  {
    category: 'history',
    difficulty: 'easy',
    question: 'In which year did the storming of the Bastille take place?',
    answer: '1789',
    options: ['1789', '1792', '1804', '1776'],
    explanation: 'The storming of the Bastille took place on July 14, 1789, in Paris.',
    hint: 'The end of the 18th century.'
  },
  {
    category: 'history',
    difficulty: 'medium',
    question: 'Who was the first emperor of Rome?',
    answer: 'Augustus',
    options: ['Augustus', 'Julius Caesar', 'Nero', 'Tiberius'],
    explanation: 'Augustus (Octavian) became the first Roman emperor in 27 BC.',
    hint: 'His name gave rise to a month of the year.'
  },
  {
    category: 'history',
    difficulty: 'hard',
    question: 'Which battle marked the definitive end of Napoleon I in 1815?',
    answer: 'Waterloo',
    options: ['Waterloo', 'Austerlitz', 'Trafalgar', 'Iéna'],
    explanation: 'The Battle of Waterloo took place on June 18, 1815, in Belgium.',
    hint: 'Starts with W.'
  },

  {
    category: 'geography',
    difficulty: 'easy',
    question: 'What is the capital of Australia?',
    answer: 'Canberra',
    options: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane'],
    explanation: 'Canberra was chosen as a compromise between Sydney and Melbourne.',
    hint: 'It is neither Sydney nor Melbourne.'
  },
  {
    category: 'geography',
    difficulty: 'medium',
    question: 'What is the longest river in the world?',
    answer: 'The Nile',
    options: ['The Nile', 'The Amazon', 'The Yangtze', 'The Mississippi'],
    explanation: 'The Nile measures approximately 6,650 km, although the Amazon is often considered the largest by volume.',
    hint: 'It crosses Egypt.'
  },
  {
    category: 'science',
    difficulty: 'easy',
    question: 'What is the chemical symbol for gold?',
    answer: 'Au',
    options: ['Au', 'Ag', 'Fe', 'Cu'],
    explanation: 'The symbol Au comes from the Latin "Aurum".',
    hint: 'Two letters starting with A.'
  },
  {
    category: 'space',
    difficulty: 'easy',
    question: 'What is the largest planet in the solar system?',
    answer: 'Jupiter',
    options: ['Jupiter', 'Saturn', 'Neptune', 'Mars'],
    explanation: 'Jupiter is a gas giant with a mass greater than that of all the other planets combined.',
    hint: 'It has a large red spot.'
  },
  {
    category: 'science',
    difficulty: 'medium',
    question: 'What is the approximate speed of light in a vacuum?',
    answer: '300 000 km/s',
    options: ['300 000 km/s', '150 000 km/s', '1 000 000 km/s', '30 000 km/s'],
    explanation: 'The exact speed of light in a vacuum is 299,792,458 m/s.',
    hint: 'About three hundred thousand.'
  },
  {
    category: 'gaming',
    difficulty: 'easy',
    question: 'Which Nintendo character eats mushrooms to grow bigger ?',
    answer: 'Mario',
    options: ['Mario', 'Sonic', 'Zelda', 'Crash'],
    explanation: 'Mario takes a Super Mushroom to become Super Mario.',
    hint: 'The mustachioed plumber.'
  },
  {
    category: 'technology',
    difficulty: 'easy',
    question: 'Who founded the company Microsoft with Paul Allen?',
    answer: 'Bill Gates',
    options: ['Bill Gates', 'Steve Jobs', 'Elon Musk', 'Mark Zuckerberg'],
    explanation: 'Bill Gates and Paul Allen founded Microsoft in 1975.',
    hint: 'Initials B.G.'
  },
  {
    category: 'coding',
    difficulty: 'medium',
    question: 'Which language is primarily executed client-side in web browsers?',
    answer: 'JavaScript',
    options: ['JavaScript', 'Python', 'C++', 'Java'],
    explanation: 'JavaScript was created by Brendan Eich in 1995 for Netscape.',
    hint: 'JS.'
  },
  {
    category: 'discord',
    difficulty: 'easy',
    question: 'In which year was Discord officially launched?',
    answer: '2015',
    options: ['2015', '2012', '2017', '2019'],
    explanation: 'Discord was created by Jason Citron and Stanislav Vishnevskiy in May 2015.',
    hint: 'About 10 years ago.'
  },
  {
    category: 'cinema',
    difficulty: 'easy',
    question: 'Who directed the film "Titanic," released in 1997?',
    answer: 'James Cameron',
    options: ['James Cameron', 'Steven Spielberg', 'Christopher Nolan', 'George Lucas'],
    explanation: 'James Cameron also directed Avatar and Terminator.',
    hint: 'The director of Avatar.'
  },
  {
    category: 'anime',
    difficulty: 'easy',
    question: 'In Dragon Ball, what is Goku\'s real Saiyan name?',
    answer: 'Kakarot',
    options: ['Kakarot', 'Vegeta', 'Raditz', 'Bardock'],
    explanation: 'His original name on Planet Vegeta is Kakarot.',
    hint: 'Derived from the English word "carrot".'
  },
  {
    category: 'animals',
    difficulty: 'easy',
    question: 'Which bird is flightless but an excellent swimmer in Antarctica?',
    answer: 'The penguin',
    options: ['The penguin', 'The auk', 'The albatross', 'The seagull'],
    explanation: 'Penguins live in the Southern Hemisphere and cannot fly in the air.',
    hint: 'Often confused with the penguin.'
  },
  {
    category: 'sports',
    difficulty: 'easy',
    question: 'How many players make up a football team on the field?',
    answer: '11',
    options: ['11', '10', '12', '9'],
    explanation: 'A football team consists of 11 players, including the goalkeeper.',
    hint: 'A double-digit odd number.'
  }
];
class TriviaService {
  constructor() {
    this.activeGames = new Map(); 
    this.initTables();
    this.seedDefaultQuestions();
  }
  initTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS trivia_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        channel_id TEXT,
        language TEXT DEFAULT 'fr',
        time_limit INTEGER DEFAULT 25,
        question_count INTEGER DEFAULT 10,
        lives INTEGER DEFAULT 3,
        cooldown INTEGER DEFAULT 5,
        anti_cheat INTEGER DEFAULT 1,
        announcements INTEGER DEFAULT 1,
        embed_color TEXT DEFAULT '#FEE75C',
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS trivia_questions (
        id TEXT PRIMARY KEY,
        guild_id TEXT DEFAULT 'GLOBAL',
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        options_json TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        difficulty TEXT DEFAULT 'medium',
        explanation TEXT,
        hint TEXT,
        status TEXT DEFAULT 'approved',
        author_id TEXT,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS trivia_user_stats (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        wrong_answers INTEGER DEFAULT 0,
        highest_streak INTEGER DEFAULT 0,
        fastest_answer_ms INTEGER DEFAULT 999999,
        badges_json TEXT DEFAULT '[]',
        title TEXT DEFAULT 'Novice du Trivia',
        updated_at INTEGER,
        PRIMARY KEY (guild_id, user_id)
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS trivia_teams (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        leader_id TEXT NOT NULL,
        members_json TEXT DEFAULT '[]',
        score INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS trivia_templates (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        config_json TEXT NOT NULL,
        created_at INTEGER
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS trivia_history (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        winner_id TEXT,
        winner_name TEXT,
        top_score INTEGER DEFAULT 0,
        mode TEXT,
        category TEXT,
        players_count INTEGER,
        ended_at INTEGER
      );
    `);
  }
  seedDefaultQuestions() {
    const count = db.prepare("SELECT COUNT(*) as c FROM trivia_questions WHERE guild_id = 'GLOBAL'").get().c;
    if (count === 0) {
      const insert = db.prepare(`
        INSERT INTO trivia_questions (id, guild_id, question, answer, options_json, category, difficulty, explanation, hint, status, author_id, created_at)
        VALUES (?, 'GLOBAL', ?, ?, ?, ?, ?, ?, ?, 'approved', 'SYSTEM', ?)
      `);
      const now = Date.now();
      for (const q of DEFAULT_QUESTIONS) {
        const id = `q_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
        insert.run(
          id,
          q.question,
          q.answer,
          JSON.stringify(q.options),
          q.category,
          q.difficulty,
          q.explanation,
          q.hint,
          now
        );
      }
    }
  }
  getSettings(guildId) {
    let s = db.prepare('SELECT * FROM trivia_settings WHERE guild_id = ?').get(guildId);
    if (!s) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO trivia_settings (guild_id, enabled, language, time_limit, question_count, lives, cooldown, anti_cheat, announcements, embed_color, created_at, updated_at)
        VALUES (?, 1, 'fr', 25, 10, 3, 5, 1, 1, '#FEE75C', ?, ?)
      `).run(guildId, now, now);
      s = db.prepare('SELECT * FROM trivia_settings WHERE guild_id = ?').get(guildId);
    }
    return s;
  }
  updateSettings(guildId, updates = {}) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getSettings(guildId);
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(Date.now(), guildId);
    db.prepare(`UPDATE trivia_settings SET ${setClauses}, updated_at = ? WHERE guild_id = ?`).run(...values);
    return this.getSettings(guildId);
  }
  resetSettings(guildId) {
    db.prepare('DELETE FROM trivia_settings WHERE guild_id = ?').run(guildId);
    return this.getSettings(guildId);
  }
  getQuestions({ guildId = 'GLOBAL', category = null, difficulty = null, limit = 10 } = {}) {
    let sql = "SELECT * FROM trivia_questions WHERE status = 'approved' AND (guild_id = ? OR guild_id = 'GLOBAL')";
    const params = [guildId];
    if (category && category !== 'all' && category !== 'mixed' && category !== 'random') {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }
    if (difficulty && difficulty !== 'all' && difficulty !== 'random') {
      sql += ' AND LOWER(difficulty) = LOWER(?)';
      params.push(difficulty);
    }
    sql += ' ORDER BY RANDOM() LIMIT ?';
    params.push(limit);
    return db.prepare(sql).all(...params).map(row => ({
      ...row,
      options: JSON.parse(row.options_json || '[]')
    }));
  }
  addQuestion(guildId, authorId, data) {
    const id = `q_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO trivia_questions (id, guild_id, question, answer, options_json, category, difficulty, explanation, hint, status, author_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)
    `).run(
      id,
      guildId,
      data.question,
      data.answer,
      JSON.stringify(data.options || [data.answer]),
      data.category || 'general',
      data.difficulty || 'medium',
      data.explanation || '',
      data.hint || '',
      authorId,
      Date.now()
    );
    return id;
  }
  getQuestionCount(guildId) {
    return db.prepare("SELECT COUNT(*) as c FROM trivia_questions WHERE guild_id = ? OR guild_id = 'GLOBAL'").get(guildId).c;
  }
  getGame(guildId) {
    return this.activeGames.get(guildId) || null;
  }
  createGame(guildId, channelId, hostUser, options = {}) {
    const existing = this.getGame(guildId);
    if (existing && existing.status !== 'ended') {
      return existing;
    }
    const settings = this.getSettings(guildId);
    const questionCount = options.questionCount || settings.question_count || 10;
    const questions = this.getQuestions({
      guildId,
      category: options.category || 'all',
      difficulty: options.difficulty || 'all',
      limit: questionCount
    });
    const game = {
      id: `game_${Date.now().toString(36)}`,
      guildId,
      channelId,
      hostId: hostUser.id,
      hostName: hostUser.username,
      mode: options.mode || 'classic',
      category: options.category || 'all',
      difficulty: options.difficulty || 'medium',
      status: 'lobby', 
      questionIndex: 0,
      questions,
      currentQuestion: null,
      questionStartTime: null,
      timeLimit: options.timeLimit || settings.time_limit || 25,
      players: new Map([[hostUser.id, { id: hostUser.id, name: hostUser.username, score: 0, streak: 0, highestStreak: 0, correct: 0, wrong: 0 }]]),
      answeredThisQuestion: new Set(),
      round: 1,
      createdAt: Date.now()
    };
    this.activeGames.set(guildId, game);
    return game;
  }
  startGame(guildId) {
    const game = this.getGame(guildId);
    if (!game) return null;
    game.status = 'active';
    game.questionIndex = 0;
    this.nextQuestion(guildId);
    return game;
  }
  nextQuestion(guildId) {
    const game = this.getGame(guildId);
    if (!game || game.status !== 'active') return null;
    if (game.questionIndex >= game.questions.length) {
      return this.endGame(guildId);
    }
    game.currentQuestion = game.questions[game.questionIndex];
    game.questionStartTime = Date.now();
    game.answeredThisQuestion.clear();
    game.questionIndex++;
    return game;
  }
  submitAnswer(guildId, user, answerInput) {
    const game = this.getGame(guildId);
    if (!game || game.status !== 'active' || !game.currentQuestion) {
      return { success: false, reason: 'no_game' };
    }
    if (game.answeredThisQuestion.has(user.id)) {
      return { success: false, reason: 'already_answered' };
    }
    if (!game.players.has(user.id)) {
      game.players.set(user.id, {
        id: user.id,
        name: user.username,
        score: 0,
        streak: 0,
        highestStreak: 0,
        correct: 0,
        wrong: 0
      });
    }
    const player = game.players.get(user.id);
    game.answeredThisQuestion.add(user.id);
    const timeTakenMs = Date.now() - game.questionStartTime;
    const correctAns = game.currentQuestion.answer.trim().toLowerCase();
    const isCorrect = answerInput.trim().toLowerCase() === correctAns ||
      (game.currentQuestion.options && game.currentQuestion.options.some((opt, idx) => {
        const letter = String.fromCharCode(65 + idx).toLowerCase();
        return (answerInput.trim().toLowerCase() === letter || answerInput.trim().toLowerCase() === (idx + 1).toString()) && opt.trim().toLowerCase() === correctAns;
      }));
    if (isCorrect) {
      player.correct++;
      player.streak++;
      if (player.streak > player.highestStreak) player.highestStreak = player.streak;
      const basePoints = 100;
      const speedBonus = Math.max(0, Math.floor((game.timeLimit * 1000 - timeTakenMs) / 100));
      const streakBonus = Math.min(player.streak * 10, 50);
      const points = basePoints + speedBonus + streakBonus;
      player.score += points;
      this.recordUserStats(guildId, user.id, {
        correct: 1,
        wrong: 0,
        points,
        streak: player.streak,
        timeMs: timeTakenMs
      });
      return {
        success: true,
        correct: true,
        points,
        streak: player.streak,
        totalScore: player.score,
        timeMs: timeTakenMs,
        explanation: game.currentQuestion.explanation
      };
    } else {
      player.wrong++;
      player.streak = 0;
      this.recordUserStats(guildId, user.id, { correct: 0, wrong: 1, points: 0, streak: 0, timeMs: timeTakenMs });
      return {
        success: true,
        correct: false,
        correctAnswer: game.currentQuestion.answer,
        explanation: game.currentQuestion.explanation
      };
    }
  }
  endGame(guildId) {
    const game = this.getGame(guildId);
    if (!game) return null;
    game.status = 'ended';
    const sorted = Array.from(game.players.values()).sort((a, b) => b.score - a.score);
    const winner = sorted[0] || null;
    if (winner) {
      db.prepare(`
        INSERT INTO trivia_history (id, guild_id, winner_id, winner_name, top_score, mode, category, players_count, ended_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        game.id,
        guildId,
        winner.id,
        winner.name,
        winner.score,
        game.mode,
        game.category,
        game.players.size,
        Date.now()
      );
      const stats = this.getUserStats(guildId, winner.id);
      db.prepare(`UPDATE trivia_user_stats SET games_won = games_won + 1, games_played = games_played + 1 WHERE guild_id = ? AND user_id = ?`)
        .run(guildId, winner.id);
    }
    this.activeGames.delete(guildId);
    return { game, leaderboard: sorted, winner };
  }
  getUserStats(guildId, userId) {
    let stats = db.prepare('SELECT * FROM trivia_user_stats WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    if (!stats) {
      db.prepare(`
        INSERT INTO trivia_user_stats (guild_id, user_id, games_played, games_won, total_score, correct_answers, wrong_answers, highest_streak, fastest_answer_ms, updated_at)
        VALUES (?, ?, 0, 0, 0, 0, 0, 0, 999999, ?)
      `).run(guildId, userId, Date.now());
      stats = db.prepare('SELECT * FROM trivia_user_stats WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    }
    return stats;
  }
  recordUserStats(guildId, userId, { correct, wrong, points, streak, timeMs }) {
    const current = this.getUserStats(guildId, userId);
    const newStreak = Math.max(current.highest_streak, streak || 0);
    const newFastest = Math.min(current.fastest_answer_ms, timeMs || 999999);
    db.prepare(`
      UPDATE trivia_user_stats
      SET total_score = total_score + ?,
          correct_answers = correct_answers + ?,
          wrong_answers = wrong_answers + ?,
          highest_streak = ?,
          fastest_answer_ms = ?,
          updated_at = ?
      WHERE guild_id = ? AND user_id = ?
    `).run(points || 0, correct || 0, wrong || 0, newStreak, newFastest, Date.now(), guildId, userId);
  }
  getLeaderboard(guildId, limit = 10) {
    return db.prepare(`
      SELECT * FROM trivia_user_stats
      WHERE guild_id = ?
      ORDER BY total_score DESC
      LIMIT ?
    `).all(guildId, limit);
  }
  getHistory(guildId, limit = 5) {
    return db.prepare('SELECT * FROM trivia_history WHERE guild_id = ? ORDER BY ended_at DESC LIMIT ?').all(guildId, limit);
  }
  createTeam(guildId, name, leaderId) {
    const id = `team_${Date.now().toString(36)}`;
    db.prepare(`
      INSERT INTO trivia_teams (id, guild_id, name, leader_id, members_json, score, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, guildId, name, leaderId, JSON.stringify([leaderId]), Date.now());
    return id;
  }
  getTeams(guildId) {
    return db.prepare('SELECT * FROM trivia_teams WHERE guild_id = ? ORDER BY score DESC').all(guildId);
  }
}
module.exports = new TriviaService();
