/**
 * DatabaseManager - Browser-compatible SQLite database using sql.js
 * Provides scalable user progress tracking with automatic persistence
 */

import initSqlJs from 'sql.js';

export class DatabaseManager {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize the database (async)
   * Loads existing database from IndexedDB or creates a new one
   */
  async init() {
    if (this.isInitialized) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Initialize sql.js (use local wasm file, fallback to CDN)
        this.SQL = await initSqlJs({
          locateFile: file => {
            // Try local file first, fallback to CDN
            return `/${file}`;
          }
        });

        // Try to load existing database from IndexedDB
        const savedDb = await this.loadFromStorage();

        if (savedDb) {
          this.db = new this.SQL.Database(savedDb);
          console.log('[DB] Loaded existing database from storage');
        } else {
          this.db = new this.SQL.Database();
          console.log('[DB] Created new database');
        }

        // Initialize tables
        this.initializeTables();

        // Save initial state
        await this.saveToStorage();

        this.isInitialized = true;
        return this.db;
      } catch (error) {
        console.error('[DB] Initialization failed:', error);
        this.isInitialized = false;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Create all required tables with indexes
   */
  initializeTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Create users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_key TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_active TEXT DEFAULT CURRENT_TIMESTAMP,
        settings TEXT DEFAULT '{}'
      );
    `);

    // Create progress table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        language TEXT NOT NULL,
        word TEXT NOT NULL,
        learned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        review_count INTEGER DEFAULT 0,
        last_reviewed TEXT,
        mastery_level INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, language, word)
      );
    `);

    // Create saved_words table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS saved_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        language TEXT NOT NULL,
        word TEXT NOT NULL,
        word_index INTEGER,
        saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, language, word_index)
      );
    `);

    // Create daily_stats table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        words_learned INTEGER DEFAULT 0,
        words_reviewed INTEGER DEFAULT 0,
        study_time_seconds INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, date)
      );
    `);

    // Create indexes for performance
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_progress_user_lang ON progress(user_id, language);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_saved_words_user ON saved_words(user_id);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);`);
  }

  // ============================================================================
  // USER METHODS
  // ============================================================================

  /**
   * Get or create a user by profile key
   */
  getOrCreateUser(profileKey) {
    if (!this.db) throw new Error('Database not initialized');

    // Try to get existing user
    const result = this.db.exec(
      'SELECT * FROM users WHERE profile_key = ?',
      [profileKey]
    );

    if (result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      return {
        id: row[0],
        profile_key: row[1],
        created_at: row[2],
        last_active: row[3],
        settings: JSON.parse(row[4] || '{}')
      };
    }

    // Create new user
    this.db.run(
      'INSERT INTO users (profile_key) VALUES (?)',
      [profileKey]
    );

    // Get the newly created user
    const newUser = this.db.exec(
      'SELECT * FROM users WHERE profile_key = ?',
      [profileKey]
    );

    if (newUser.length > 0 && newUser[0].values.length > 0) {
      const row = newUser[0].values[0];
      return {
        id: row[0],
        profile_key: row[1],
        created_at: row[2],
        last_active: row[3],
        settings: JSON.parse(row[4] || '{}')
      };
    }

    throw new Error('Failed to create user');
  }

  /**
   * Update last active timestamp for a user
   */
  updateLastActive(userId) {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(
      `UPDATE users SET last_active = datetime('now') WHERE id = ?`,
      [userId]
    );

    this.saveToStorage(); // Persist changes
  }

  // ============================================================================
  // PROGRESS METHODS
  // ============================================================================

  /**
   * Record a word as learned or reviewed
   */
  recordWordLearned(userId, language, word) {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`
      INSERT INTO progress (user_id, language, word, learned_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, language, word) DO UPDATE SET
        review_count = review_count + 1,
        last_reviewed = datetime('now')
    `, [userId, language, word]);

    this.saveToStorage(); // Persist changes
  }

  /**
   * Get language progress statistics
   */
  getLanguageProgress(userId, language) {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT COUNT(*) as learned_count
      FROM progress
      WHERE user_id = ? AND language = ?
    `, [userId, language]);

    if (result.length > 0 && result[0].values.length > 0) {
      return { learned_count: result[0].values[0][0] };
    }

    return { learned_count: 0 };
  }

  /**
   * Get all learned words for a user and language
   */
  getLearnedWords(userId, language) {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT word, learned_at, review_count, last_reviewed, mastery_level
      FROM progress
      WHERE user_id = ? AND language = ?
      ORDER BY learned_at DESC
    `, [userId, language]);

    if (result.length > 0) {
      return result[0].values.map(row => ({
        word: row[0],
        learned_at: row[1],
        review_count: row[2],
        last_reviewed: row[3],
        mastery_level: row[4]
      }));
    }

    return [];
  }

  /**
   * Update mastery level for a word
   */
  updateMasteryLevel(userId, language, word, masteryLevel) {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`
      UPDATE progress
      SET mastery_level = ?, review_count = review_count + 1, last_reviewed = ?
      WHERE user_id = ? AND language = ? AND word = ?
    `, [masteryLevel, new Date().toISOString(), userId, language, word]);
  }

  /**
   * Get word mastery data (review count, dates, mastery level)
   */
  getWordMasteryData(userId, language, word) {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT review_count, learned_at, last_reviewed, mastery_level
      FROM progress
      WHERE user_id = ? AND language = ? AND word = ?
    `, [userId, language, word]);

    if (result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      return {
        review_count: row[0],
        learned_at: row[1],
        last_reviewed: row[2],
        mastery_level: row[3]
      };
    }

    return null;
  }

  // ============================================================================
  // SAVED WORDS METHODS
  // ============================================================================

  /**
   * Save a word to the saved_words list
   */
  saveWord(userId, language, word, wordIndex = null, notes = '') {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`
      INSERT OR REPLACE INTO saved_words (user_id, language, word, word_index, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, language, word, wordIndex, notes]);

    this.saveToStorage(); // Persist changes
  }

  /**
   * Remove a word from saved_words
   */
  unsaveWord(userId, language, wordIndex) {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`
      DELETE FROM saved_words
      WHERE user_id = ? AND language = ? AND word_index = ?
    `, [userId, language, wordIndex]);

    this.saveToStorage(); // Persist changes
  }

  /**
   * Get all saved words for a user and language
   */
  getSavedWords(userId, language = null) {
    if (!this.db) throw new Error('Database not initialized');

    let query = `
      SELECT id, language, word, word_index, saved_at, notes
      FROM saved_words
      WHERE user_id = ?
    `;

    const params = [userId];

    if (language) {
      query += ' AND language = ?';
      params.push(language);
    }

    query += ' ORDER BY saved_at DESC';

    const result = this.db.exec(query, params);

    if (result.length > 0) {
      return result[0].values.map(row => ({
        id: row[0],
        language: row[1],
        word: row[2],
        word_index: row[3],
        saved_at: row[4],
        notes: row[5]
      }));
    }

    return [];
  }

  /**
   * Check if a word is saved
   */
  isWordSaved(userId, language, wordIndex) {
    if (!this.db) {
      console.warn('[Database] Not initialized, returning false');
      return false;
    }

    try {
      const result = this.db.exec(`
        SELECT COUNT(*) FROM saved_words
        WHERE user_id = ? AND language = ? AND word_index = ?
      `, [userId, language, wordIndex]);

      return result.length > 0 && result[0].values[0][0] > 0;
    } catch (error) {
      console.error('[Database] Error checking saved word:', error);
      return false;
    }
  }

  // ============================================================================
  // STATISTICS METHODS
  // ============================================================================

  /**
   * Record daily statistics
   */
  recordDailyStats(userId, date, wordsLearned, studyTime = 0) {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`
      INSERT INTO daily_stats (user_id, date, words_learned, study_time_seconds)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        words_learned = words_learned + ?,
        study_time_seconds = study_time_seconds + ?
    `, [userId, date, wordsLearned, studyTime, wordsLearned, studyTime]);

    this.saveToStorage(); // Persist changes
  }

  /**
   * Get current streak for a user
   */
  getCurrentStreak(userId) {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT MAX(streak_days) as current_streak
      FROM daily_stats
      WHERE user_id = ?
    `, [userId]);

    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values[0][0] || 0;
    }

    return 0;
  }

  /**
   * Get total words learned across all languages
   */
  getTotalWordsLearned(userId) {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT COUNT(*) as total
      FROM progress
      WHERE user_id = ?
    `, [userId]);

    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values[0][0] || 0;
    }

    return 0;
  }

  /**
   * Get daily stats for a specific date
   */
  getDailyStats(userId, date) {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT words_learned, words_reviewed, study_time_seconds, streak_days
      FROM daily_stats
      WHERE user_id = ? AND date = ?
    `, [userId, date]);

    if (result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      return {
        words_learned: row[0],
        words_reviewed: row[1],
        study_time_seconds: row[2],
        streak_days: row[3]
      };
    }

    return null;
  }

  // ============================================================================
  // PERSISTENCE METHODS (IndexedDB + localStorage fallback)
  // ============================================================================

  /**
   * Save database to IndexedDB (with localStorage fallback)
   */
  async saveToStorage() {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const blob = new Blob([data], { type: 'application/x-sqlite3' });

      // Try IndexedDB first
      try {
        await this.saveToIndexedDB(blob);
      } catch (idbError) {
        console.warn('[DB] IndexedDB save failed, using localStorage:', idbError);
        // Fallback to localStorage (has size limits)
        const base64 = await this.blobToBase64(blob);
        localStorage.setItem('lingxm-database', base64);
      }
    } catch (error) {
      console.error('[DB] Failed to save database:', error);
    }
  }

  /**
   * Load database from IndexedDB or localStorage
   */
  async loadFromStorage() {
    try {
      // Try IndexedDB first
      const blob = await this.loadFromIndexedDB();
      if (blob) {
        return new Uint8Array(await blob.arrayBuffer());
      }

      // Fallback to localStorage
      const base64 = localStorage.getItem('lingxm-database');
      if (base64) {
        const blob = await this.base64ToBlob(base64);
        return new Uint8Array(await blob.arrayBuffer());
      }
    } catch (error) {
      console.error('[DB] Failed to load database:', error);
    }

    return null;
  }

  /**
   * IndexedDB operations
   */
  async saveToIndexedDB(blob) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LingXM-DB', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('database')) {
          db.createObjectStore('database');
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['database'], 'readwrite');
        const store = transaction.objectStore('database');
        const putRequest = store.put(blob, 'data');

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
    });
  }

  async loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LingXM-DB', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('database')) {
          db.createObjectStore('database');
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('database')) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(['database'], 'readonly');
        const store = transaction.objectStore('database');
        const getRequest = store.get('data');

        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  /**
   * Helper: Convert blob to base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Helper: Convert base64 to blob
   */
  async base64ToBlob(base64) {
    const response = await fetch(`data:application/x-sqlite3;base64,${base64}`);
    return await response.blob();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Export database as downloadable file
   */
  exportDatabase() {
    if (!this.db) throw new Error('Database not initialized');

    const data = this.db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `lingxm-backup-${new Date().toISOString().split('T')[0]}.db`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Get database statistics
   */
  getStats() {
    if (!this.db) throw new Error('Database not initialized');

    const userCount = this.db.exec('SELECT COUNT(*) FROM users')[0].values[0][0];
    const progressCount = this.db.exec('SELECT COUNT(*) FROM progress')[0].values[0][0];
    const savedWordsCount = this.db.exec('SELECT COUNT(*) FROM saved_words')[0].values[0][0];

    return {
      users: userCount,
      progress_records: progressCount,
      saved_words: savedWordsCount,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Close database and cleanup
   */
  close() {
    if (this.db) {
      this.saveToStorage();
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Create singleton instance
export const dbManager = new DatabaseManager();
