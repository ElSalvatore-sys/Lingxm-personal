// Progress Tracking System for LingXM Personal

export class ProgressTracker {
  constructor(profileKey) {
    this.profileKey = profileKey;
    this.storageKey = `lingxm-progress-${profileKey}`;
    this.data = this.loadProgress();
  }

  loadProgress() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
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
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  // Mark today as studied
  recordStudySession(languageCode, wordsStudied) {
    const today = new Date().toDateString();
    
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
    return {
      currentStreak: this.data.currentStreak,
      longestStreak: this.data.longestStreak,
      totalWordsStudied: this.data.totalWordsStudied,
      totalDaysStudied: this.data.totalDaysStudied,
      lastStudyDate: this.data.lastStudyDate
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
