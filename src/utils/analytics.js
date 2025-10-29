// Privacy-First Analytics for LingXM Personal
// 100% local storage, no external services, full user control

export class AnalyticsManager {
  constructor() {
    this.storageKey = 'lingxm-analytics';
    this.data = this.load();
    this.currentSession = null;
  }

  load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('[Analytics] Failed to parse localStorage:', error);
      }
    }
    return this.getEmptyData();
  }

  getEmptyData() {
    return {
      sessions: [],
      events: [],
      summary: {
        totalSessions: 0,
        totalWords: 0,
        totalEvents: 0,
        mostUsedProfile: null,
        averageSessionTime: 0,
        firstUseDate: new Date().toISOString(),
        lastUseDate: new Date().toISOString()
      }
    };
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('[Analytics] Failed to save to localStorage:', error);
    }
  }

  /**
   * Start tracking a new session
   */
  startSession(profileKey) {
    this.currentSession = {
      profile: profileKey,
      startTime: Date.now(),
      wordsViewed: 0,
      featuresUsed: [],
      languagesUsed: new Set()
    };
  }

  /**
   * End current session and save to history
   */
  endSession() {
    if (!this.currentSession) return;

    const duration = Math.round((Date.now() - this.currentSession.startTime) / 1000); // seconds
    const session = {
      profile: this.currentSession.profile,
      date: new Date().toISOString().split('T')[0],
      duration: duration,
      words: this.currentSession.wordsViewed,
      features: this.currentSession.featuresUsed,
      languages: Array.from(this.currentSession.languagesUsed),
      timestamp: new Date().toISOString()
    };

    this.data.sessions.push(session);
    this.data.summary.totalSessions++;
    this.data.summary.totalWords += session.words;
    this.data.summary.lastUseDate = session.timestamp;

    // Update average session time
    const totalDuration = this.data.sessions.reduce((sum, s) => sum + s.duration, 0);
    this.data.summary.averageSessionTime = Math.round(totalDuration / this.data.sessions.length);

    // Update most used profile
    this.updateMostUsedProfile();

    this.save();
    this.currentSession = null;
  }

  /**
   * Track an event
   */
  trackEvent(eventType, data = {}) {
    const event = {
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    };

    this.data.events.push(event);
    this.data.summary.totalEvents++;
    this.save();

    // Update current session if active
    if (this.currentSession) {
      if (eventType === 'word_viewed') {
        this.currentSession.wordsViewed++;
        if (data.language) {
          this.currentSession.languagesUsed.add(data.language);
        }
      } else if (eventType === 'feature_used') {
        if (!this.currentSession.featuresUsed.includes(data.feature)) {
          this.currentSession.featuresUsed.push(data.feature);
        }
      }
    }
  }

  /**
   * Calculate most used profile
   */
  updateMostUsedProfile() {
    const profileCounts = {};
    this.data.sessions.forEach(session => {
      profileCounts[session.profile] = (profileCounts[session.profile] || 0) + 1;
    });

    let maxCount = 0;
    let mostUsed = null;
    for (const [profile, count] of Object.entries(profileCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = profile;
      }
    }

    this.data.summary.mostUsedProfile = mostUsed;
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    // Calculate profile distribution
    const profileStats = {};
    let totalSessions = this.data.sessions.length || 1; // Avoid division by zero

    this.data.sessions.forEach(session => {
      if (!profileStats[session.profile]) {
        profileStats[session.profile] = { sessions: 0, words: 0, percentage: 0 };
      }
      profileStats[session.profile].sessions++;
      profileStats[session.profile].words += session.words;
    });

    // Calculate percentages
    for (const profile in profileStats) {
      profileStats[profile].percentage = Math.round((profileStats[profile].sessions / totalSessions) * 100);
    }

    // Count feature usage
    const featureCounts = {};
    this.data.events.forEach(event => {
      if (event.type === 'feature_used' && event.data.feature) {
        featureCounts[event.data.feature] = (featureCounts[event.data.feature] || 0) + 1;
      }
    });

    // Count achievements unlocked
    const achievementCount = this.data.events.filter(e => e.type === 'achievement_unlocked').length;

    // Count saved words
    const savedWordCount = this.data.events.filter(e => e.type === 'word_saved').length;

    // Calculate average streak
    const streaks = this.data.events
      .filter(e => e.type === 'streak_milestone' && e.data.streak)
      .map(e => e.data.streak);
    const averageStreak = streaks.length > 0
      ? Math.round(streaks.reduce((sum, s) => sum + s, 0) / streaks.length)
      : 0;

    return {
      summary: this.data.summary,
      profiles: profileStats,
      features: featureCounts,
      achievements: achievementCount,
      savedWords: savedWordCount,
      averageStreak: averageStreak,
      recentSessions: this.data.sessions.slice(-10).reverse(),
      recentEvents: this.data.events.slice(-20).reverse()
    };
  }

  /**
   * Export all data as JSON (for transparency)
   */
  exportData() {
    const exportObj = {
      ...this.data,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(exportObj, null, 2);
  }

  /**
   * Clear all analytics data
   */
  clearData() {
    this.data = this.getEmptyData();
    this.save();
    console.log('[Analytics] All data cleared');
  }

  /**
   * Get event count by type
   */
  getEventCount(eventType) {
    return this.data.events.filter(e => e.type === eventType).length;
  }

  /**
   * Get session count for a specific profile
   */
  getProfileSessionCount(profileKey) {
    return this.data.sessions.filter(s => s.profile === profileKey).length;
  }
}
