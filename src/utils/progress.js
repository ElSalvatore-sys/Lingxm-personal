// Progress Tracking System for LingXM Personal
// Hybrid storage: SQLite database (primary) + localStorage (fallback)

import { dbManager } from './database.js';

export class ProgressTracker {
  constructor(profileKey) {
    this.profileKey = profileKey;
    this.storageKey = `lingxm-progress-${profileKey}`;
    this.data = this.loadProgress(); // localStorage data
    this.userId = null;
    this.useDatabase = false;
    this.dbReady = false;

    // Initialize database asynchronously
    this.initDatabase();
  }

  /**
   * Initialize database and migrate localStorage data if needed
   */
  async initDatabase() {
    try {
      await dbManager.init();

      // Get or create user
      const user = dbManager.getOrCreateUser(this.profileKey);
      this.userId = user.id;
      this.useDatabase = true;
      this.dbReady = true;

      console.log(`[Progress] Database initialized for ${this.profileKey} (user_id: ${this.userId})`);

      // Check if we need to migrate localStorage data
      await this.migrateFromLocalStorage();

      // Update last active
      dbManager.updateLastActive(this.userId);
    } catch (error) {
      console.error('[Progress] Database initialization failed, using localStorage:', error);
      this.useDatabase = false;
      this.dbReady = false;
    }
  }

  /**
   * Migrate existing localStorage data to database (one-time operation)
   */
  async migrateFromLocalStorage() {
    if (!this.useDatabase || !this.userId) return;

    const migrationKey = `lingxm-migrated-${this.profileKey}`;
    const alreadyMigrated = localStorage.getItem(migrationKey);

    if (alreadyMigrated) {
      console.log(`[Progress] Data already migrated for ${this.profileKey}`);
      return;
    }

    try {
      const localData = this.data;

      if (!localData || Object.keys(localData).length === 0) {
        console.log('[Progress] No localStorage data to migrate');
        localStorage.setItem(migrationKey, 'true');
        return;
      }

      console.log('[Progress] Starting migration from localStorage to database...');

      // Migrate language progress
      if (localData.languageProgress) {
        for (const [langCode, langData] of Object.entries(localData.languageProgress)) {
          // Migrate completed words
          if (langData.completedWords) {
            const completedWords = Array.isArray(langData.completedWords)
              ? langData.completedWords
              : Array.from(langData.completedWords || []);

            for (const wordKey of completedWords) {
              // wordKey format: "language-wordIndex"
              const word = `word_${wordKey}`;
              dbManager.recordWordLearned(this.userId, langCode, word);
            }
          }
        }
      }

      // Migrate daily stats
      if (localData.studyHistory && Array.isArray(localData.studyHistory)) {
        for (const session of localData.studyHistory) {
          if (session.date && session.languages) {
            const totalWords = Object.values(session.languages).reduce((sum, count) => sum + count, 0);
            dbManager.recordDailyStats(this.userId, session.date, totalWords, 0);
          }
        }
      }

      // Mark as migrated
      localStorage.setItem(migrationKey, 'true');
      console.log('[Progress] Migration completed successfully');
    } catch (error) {
      console.error('[Progress] Migration failed:', error);
    }
  }

  loadProgress() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('[Progress] Failed to parse localStorage:', error);
      }
    }

    // Initialize new progress data
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      totalWordsStudied: 0,
      totalDaysStudied: 0,
      languageProgress: {},
      dailyGoal: 10,
      studyHistory: []
    };
  }

  saveProgress() {
    // Always save to localStorage as backup
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  // Mark today as studied
  recordStudySession(languageCode, wordsStudied) {
    const today = new Date().toDateString();

    // Update database if available
    if (this.useDatabase && this.userId) {
      try {
        const todayISO = new Date().toISOString().split('T')[0];
        dbManager.recordDailyStats(this.userId, todayISO, wordsStudied, 0);
      } catch (error) {
        console.error('[Progress] Failed to record session in database:', error);
      }
    }

    // Always update localStorage as fallback
    // Check if already studied today
    if (this.data.lastStudyDate === today) {
      // Update today's session
      this.updateTodaySession(languageCode, wordsStudied);
    } else {
      // New day - check streak
      this.updateStreak(today);
      this.data.totalDaysStudied++;

      // Add new session
      this.data.studyHistory.push({
        date: today,
        languages: {
          [languageCode]: wordsStudied
        }
      });
    }

    this.data.lastStudyDate = today;
    this.data.totalWordsStudied += wordsStudied;

    // Update language-specific progress
    if (!this.data.languageProgress[languageCode]) {
      this.data.languageProgress[languageCode] = {
        wordsStudied: 0,
        lastStudied: null,
        completedWords: new Set()
      };
    }

    this.data.languageProgress[languageCode].wordsStudied += wordsStudied;
    this.data.languageProgress[languageCode].lastStudied = today;

    this.saveProgress();
  }

  updateTodaySession(languageCode, wordsStudied) {
    const todaySession = this.data.studyHistory[this.data.studyHistory.length - 1];
    if (!todaySession.languages[languageCode]) {
      todaySession.languages[languageCode] = 0;
    }
    todaySession.languages[languageCode] += wordsStudied;
  }

  updateStreak(today) {
    if (!this.data.lastStudyDate) {
      // First time studying
      this.data.currentStreak = 1;
      this.data.longestStreak = 1;
      return;
    }

    const lastDate = new Date(this.data.lastStudyDate);
    const currentDate = new Date(today);
    const diffTime = currentDate - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      this.data.currentStreak++;
      if (this.data.currentStreak > this.data.longestStreak) {
        this.data.longestStreak = this.data.currentStreak;
      }
    } else if (diffDays > 1) {
      // Streak broken
      this.data.currentStreak = 1;
    }
    // diffDays === 0 means same day (already handled)
  }

  markWordCompleted(languageCode, wordIndex) {
    const key = `${languageCode}-${wordIndex}`;

    // Update database if available
    if (this.useDatabase && this.userId) {
      try {
        const word = `word_${key}`;
        dbManager.recordWordLearned(this.userId, languageCode, word);
      } catch (error) {
        console.error('[Progress] Failed to mark word in database:', error);
      }
    }

    // Always update localStorage as fallback
    if (!this.data.languageProgress[languageCode]) {
      this.data.languageProgress[languageCode] = {
        wordsStudied: 0,
        lastStudied: null,
        completedWords: new Set()
      };
    }

    if (!this.data.languageProgress[languageCode].completedWords) {
      this.data.languageProgress[languageCode].completedWords = new Set();
    }

    this.data.languageProgress[languageCode].completedWords.add(key);
    this.saveProgress();
  }

  getCompletionPercentage(languageCode, totalWords) {
    // Try database first
    if (this.useDatabase && this.userId) {
      try {
        const progress = dbManager.getLanguageProgress(this.userId, languageCode);
        const completed = progress?.learned_count || 0;
        return Math.round((completed / totalWords) * 100);
      } catch (error) {
        console.error('[Progress] Failed to get completion from database:', error);
      }
    }

    // Fallback to localStorage
    if (!this.data.languageProgress[languageCode]) return 0;

    const completed = this.data.languageProgress[languageCode].completedWords
      ? this.data.languageProgress[languageCode].completedWords.size
      : 0;

    return Math.round((completed / totalWords) * 100);
  }

  getTodayProgress(languageCode) {
    const today = new Date().toDateString();
    if (this.data.lastStudyDate !== today) return 0;

    const todaySession = this.data.studyHistory[this.data.studyHistory.length - 1];
    return todaySession?.languages?.[languageCode] || 0;
  }

  getStats() {
    // Try database first
    if (this.useDatabase && this.userId) {
      try {
        const currentStreak = dbManager.getCurrentStreak(this.userId);
        const totalWordsStudied = dbManager.getTotalWordsLearned(this.userId);

        return {
          currentStreak: currentStreak,
          longestStreak: this.data.longestStreak, // Keep from localStorage for now
          totalWordsStudied: totalWordsStudied,
          totalDaysStudied: this.data.totalDaysStudied,
          lastStudyDate: this.data.lastStudyDate,
          usingDatabase: true
        };
      } catch (error) {
        console.error('[Progress] Failed to get stats from database:', error);
      }
    }

    // Fallback to localStorage
    return {
      currentStreak: this.data.currentStreak,
      longestStreak: this.data.longestStreak,
      totalWordsStudied: this.data.totalWordsStudied,
      totalDaysStudied: this.data.totalDaysStudied,
      lastStudyDate: this.data.lastStudyDate,
      usingDatabase: false
    };
  }

  // Convert Set to Array for JSON serialization
  toJSON() {
    const data = { ...this.data };
    Object.keys(data.languageProgress).forEach(lang => {
      if (data.languageProgress[lang].completedWords instanceof Set) {
        data.languageProgress[lang].completedWords = 
          Array.from(data.languageProgress[lang].completedWords);
      }
    });
    return data;
  }
}
