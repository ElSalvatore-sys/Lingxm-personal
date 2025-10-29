// Achievement System for LingXM Personal
// Tracks and manages learning milestones and badges

export const ACHIEVEMENTS = {
  firstWord: {
    id: 'first-word',
    name: 'First Steps',
    icon: '🎯',
    description: 'Completed your first word',
    category: 'words',
    check: (stats) => stats.totalWordsStudied >= 1
  },
  beginner: {
    id: 'beginner',
    name: 'Beginner',
    icon: '🌱',
    description: '10 words learned',
    category: 'words',
    check: (stats) => stats.totalWordsStudied >= 10
  },
  growing: {
    id: 'growing',
    name: 'Growing',
    icon: '🌿',
    description: '50 words learned',
    category: 'words',
    check: (stats) => stats.totalWordsStudied >= 50
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced',
    icon: '🌳',
    description: '100 words learned',
    category: 'words',
    check: (stats) => stats.totalWordsStudied >= 100
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    icon: '🎓',
    description: '150 words learned',
    category: 'words',
    check: (stats) => stats.totalWordsStudied >= 150
  },
  master: {
    id: 'master',
    name: 'Master',
    icon: '⭐',
    description: 'All 180 words completed!',
    category: 'words',
    check: (stats) => stats.totalWordsStudied >= 180
  },
  weekStreak: {
    id: 'week-streak',
    name: 'Week Warrior',
    icon: '🔥',
    description: '7-day study streak',
    category: 'streaks',
    check: (stats) => stats.currentStreak >= 7
  },
  monthStreak: {
    id: 'month-streak',
    name: 'Month Master',
    icon: '💪',
    description: '30-day study streak',
    category: 'streaks',
    check: (stats) => stats.currentStreak >= 30
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    icon: '👑',
    description: '100-day study streak!',
    category: 'streaks',
    check: (stats) => stats.currentStreak >= 100
  }
};

export class AchievementManager {
  constructor(profileKey) {
    this.profileKey = profileKey;
    this.storageKey = `lingxm-achievements-${profileKey}`;
    this.data = this.load();
  }

  load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('[Achievements] Failed to parse localStorage:', error);
      }
    }
    return { earned: [], seen: [], unread: [] };
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  /**
   * Check all achievements and return newly earned ones
   */
  checkAchievements(stats) {
    const newlyEarned = [];

    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (!this.data.earned.includes(achievement.id) && achievement.check(stats)) {
        this.data.earned.push(achievement.id);
        this.data.unread.push(achievement.id);
        newlyEarned.push(achievement);
      }
    });

    if (newlyEarned.length > 0) {
      this.save();
    }

    return newlyEarned;
  }

  /**
   * Mark achievement as seen (user viewed it in modal)
   */
  markAsSeen(achievementId) {
    if (!this.data.seen.includes(achievementId)) {
      this.data.seen.push(achievementId);
    }
    this.data.unread = this.data.unread.filter(id => id !== achievementId);
    this.save();
  }

  /**
   * Get all earned achievements
   */
  getEarned() {
    return this.data.earned.map(id =>
      Object.values(ACHIEVEMENTS).find(a => a.id === id)
    ).filter(Boolean);
  }

  /**
   * Get unread (newly earned) achievement count
   */
  getUnread() {
    return this.data.unread;
  }

  /**
   * Get progress toward next word milestone badge
   */
  getProgress(stats) {
    const wordBadges = ['firstWord', 'beginner', 'growing', 'advanced', 'expert', 'master'];
    const nextWordBadge = wordBadges.find(id => !this.data.earned.includes(id));

    if (nextWordBadge) {
      const badge = ACHIEVEMENTS[nextWordBadge];
      // Extract target number from description
      const match = badge.description.match(/(\d+)/);
      const targetWords = match ? parseInt(match[0]) : 1;

      return {
        nextBadge: badge,
        current: stats.totalWordsStudied,
        target: targetWords,
        percentage: Math.min(100, Math.round((stats.totalWordsStudied / targetWords) * 100))
      };
    }

    return null;
  }

  /**
   * Get achievements by category
   */
  getByCategory(category) {
    return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
  }
}
