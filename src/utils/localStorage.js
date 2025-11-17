/**
 * LocalStorageManager - Centralized localStorage wrapper
 * Provides consistent interface for localStorage operations
 * Handles migration from legacy keys to new database-backed storage
 */

export class LocalStorageManager {
  constructor() {
    this.prefix = 'lingxm-';
  }

  // ============================================================================
  // CORE LOCALSTORAGE OPERATIONS
  // ============================================================================

  /**
   * Get item from localStorage with automatic JSON parsing
   * @param {string} key - Key name (without prefix)
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Parsed value or default
   */
  get(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      const value = localStorage.getItem(fullKey);

      if (value === null) {
        return defaultValue;
      }

      // Try to parse as JSON, fallback to raw string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('[LocalStorage] Error getting key:', key, error);
      return defaultValue;
    }
  }

  /**
   * Set item in localStorage with automatic JSON stringification
   * @param {string} key - Key name (without prefix)
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      const fullKey = this.prefix + key;

      // Stringify objects/arrays, store primitives as-is
      const stringValue = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

      localStorage.setItem(fullKey, stringValue);
      return true;
    } catch (error) {
      console.error('[LocalStorage] Error setting key:', key, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Key name (without prefix)
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('[LocalStorage] Error removing key:', key, error);
      return false;
    }
  }

  /**
   * Check if key exists in localStorage
   * @param {string} key - Key name (without prefix)
   * @returns {boolean} True if key exists
   */
  has(key) {
    const fullKey = this.prefix + key;
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * Clear all LingXM localStorage keys
   * @param {boolean} confirm - Must be true to prevent accidental clearing
   * @returns {boolean} Success status
   */
  clear(confirm = false) {
    if (!confirm) {
      console.warn('[LocalStorage] Clear requires confirm=true');
      return false;
    }

    try {
      const keys = Object.keys(localStorage);
      let cleared = 0;

      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
          cleared++;
        }
      }

      console.log(`[LocalStorage] Cleared ${cleared} keys`);
      return true;
    } catch (error) {
      console.error('[LocalStorage] Error clearing:', error);
      return false;
    }
  }

  /**
   * Get all LingXM localStorage keys
   * @returns {Array} Array of key names (without prefix)
   */
  getAllKeys() {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(this.prefix.length));
  }

  // ============================================================================
  // PROFILE-SPECIFIC OPERATIONS
  // ============================================================================

  /**
   * Get current active profile key
   * @returns {string|null} Profile key or null
   */
  getCurrentProfile() {
    return this.get('current-profile');
  }

  /**
   * Set current active profile
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} Success status
   */
  setCurrentProfile(profileKey) {
    const success = this.set('current-profile', profileKey);
    if (success) {
      this.set('profile-timestamp', Date.now());
    }
    return success;
  }

  /**
   * Get profile-specific key
   * @param {string} profileKey - Profile identifier
   * @param {string} key - Key name
   * @param {*} defaultValue - Default value
   * @returns {*} Value or default
   */
  getForProfile(profileKey, key, defaultValue = null) {
    return this.get(`${profileKey}-${key}`, defaultValue);
  }

  /**
   * Set profile-specific key
   * @param {string} profileKey - Profile identifier
   * @param {string} key - Key name
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  setForProfile(profileKey, key, value) {
    return this.set(`${profileKey}-${key}`, value);
  }

  /**
   * Remove profile-specific key
   * @param {string} profileKey - Profile identifier
   * @param {string} key - Key name
   * @returns {boolean} Success status
   */
  removeForProfile(profileKey, key) {
    return this.remove(`${profileKey}-${key}`);
  }

  /**
   * Get all keys for a specific profile
   * @param {string} profileKey - Profile identifier
   * @returns {Array} Array of key names (without profile prefix)
   */
  getProfileKeys(profileKey) {
    const allKeys = this.getAllKeys();
    const profilePrefix = `${profileKey}-`;

    return allKeys
      .filter(key => key.startsWith(profilePrefix))
      .map(key => key.substring(profilePrefix.length));
  }

  // ============================================================================
  // LANGUAGE-SPECIFIC OPERATIONS
  // ============================================================================

  /**
   * Get last active language for profile
   * @param {string} profileKey - Profile identifier
   * @returns {string|null} Language code or null
   */
  getLastActiveLanguage(profileKey) {
    return this.getForProfile(profileKey, 'last-active-language');
  }

  /**
   * Set last active language for profile
   * @param {string} profileKey - Profile identifier
   * @param {string} languageCode - Language code
   * @returns {boolean} Success status
   */
  setLastActiveLanguage(profileKey, languageCode) {
    return this.setForProfile(profileKey, 'last-active-language', languageCode);
  }

  /**
   * Get word position for profile and language
   * @param {string} profileKey - Profile identifier
   * @param {string} languageCode - Language code
   * @returns {number|null} Word index or null
   */
  getWordPosition(profileKey, languageCode) {
    return this.get(`${profileKey}-${languageCode}-position`);
  }

  /**
   * Set word position for profile and language
   * @param {string} profileKey - Profile identifier
   * @param {string} languageCode - Language code
   * @param {number} position - Word index
   * @returns {boolean} Success status
   */
  setWordPosition(profileKey, languageCode, position) {
    return this.set(`${profileKey}-${languageCode}-position`, position);
  }

  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  /**
   * Get user theme preference
   * @returns {string} 'dark' or 'light'
   */
  getTheme() {
    return this.get('theme', 'dark');
  }

  /**
   * Set user theme preference
   * @param {string} theme - 'dark' or 'light'
   * @returns {boolean} Success status
   */
  setTheme(theme) {
    return this.set('theme', theme);
  }

  /**
   * Get autoplay preference
   * @returns {boolean} Autoplay enabled
   */
  getAutoplay() {
    const value = this.get('autoplay', 'true');
    return value === 'true' || value === true;
  }

  /**
   * Set autoplay preference
   * @param {boolean} enabled - Autoplay enabled
   * @returns {boolean} Success status
   */
  setAutoplay(enabled) {
    return this.set('autoplay', enabled ? 'true' : 'false');
  }

  // ============================================================================
  // PIN/SECURITY OPERATIONS
  // ============================================================================

  /**
   * Get PIN hash for profile
   * @param {string} profileKey - Profile identifier
   * @returns {string|null} PIN hash or null
   */
  getPin(profileKey) {
    return this.getForProfile(profileKey, 'pin');
  }

  /**
   * Set PIN hash for profile
   * @param {string} profileKey - Profile identifier
   * @param {string} pinHash - Hashed PIN
   * @returns {boolean} Success status
   */
  setPin(profileKey, pinHash) {
    return this.setForProfile(profileKey, 'pin', pinHash);
  }

  /**
   * Check if PIN is enabled for profile
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} PIN enabled status
   */
  isPinEnabled(profileKey) {
    return this.getForProfile(profileKey, 'pin-enabled', false);
  }

  /**
   * Set PIN enabled status for profile
   * @param {string} profileKey - Profile identifier
   * @param {boolean} enabled - PIN enabled
   * @returns {boolean} Success status
   */
  setPinEnabled(profileKey, enabled) {
    return this.setForProfile(profileKey, 'pin-enabled', enabled);
  }

  /**
   * Get PIN attempt count
   * @param {string} profileKey - Profile identifier
   * @returns {number} Attempt count
   */
  getPinAttempts(profileKey) {
    return this.getForProfile(profileKey, 'pin-attempts', 0);
  }

  /**
   * Increment PIN attempt count
   * @param {string} profileKey - Profile identifier
   * @returns {number} New attempt count
   */
  incrementPinAttempts(profileKey) {
    const current = this.getPinAttempts(profileKey);
    const newCount = current + 1;
    this.setForProfile(profileKey, 'pin-attempts', newCount);
    return newCount;
  }

  /**
   * Reset PIN attempts
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} Success status
   */
  resetPinAttempts(profileKey) {
    return this.setForProfile(profileKey, 'pin-attempts', 0);
  }

  // ============================================================================
  // TUTORIAL/ONBOARDING OPERATIONS
  // ============================================================================

  /**
   * Check if welcome screen has been shown
   * @returns {boolean} True if shown
   */
  isWelcomeShown() {
    return this.get('welcome-shown', false);
  }

  /**
   * Mark welcome screen as shown
   * @returns {boolean} Success status
   */
  setWelcomeShown() {
    return this.set('welcome-shown', true);
  }

  /**
   * Check if tutorial has been shown for profile
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} True if shown
   */
  isTutorialShown(profileKey) {
    return this.getForProfile(profileKey, 'tutorial-shown', false);
  }

  /**
   * Mark tutorial as shown for profile
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} Success status
   */
  setTutorialShown(profileKey) {
    return this.setForProfile(profileKey, 'tutorial-shown', true);
  }

  /**
   * Check if PIN prompt has been shown for profile
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} True if shown
   */
  isPinPromptShown(profileKey) {
    return this.getForProfile(profileKey, 'pin-prompted', false);
  }

  /**
   * Mark PIN prompt as shown for profile
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} Success status
   */
  setPinPromptShown(profileKey) {
    return this.setForProfile(profileKey, 'pin-prompted', true);
  }

  // ============================================================================
  // MIGRATION HELPERS
  // ============================================================================

  /**
   * Check if profile has been migrated to new database schema
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} True if migrated
   */
  isMigrated(profileKey) {
    return this.getForProfile(profileKey, 'migrated', false);
  }

  /**
   * Mark profile as migrated
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} Success status
   */
  setMigrated(profileKey) {
    return this.setForProfile(profileKey, 'migrated', true);
  }

  /**
   * Get legacy progress data (for migration)
   * @param {string} profileKey - Profile identifier
   * @returns {Object|null} Legacy progress data
   */
  getLegacyProgress(profileKey) {
    return this.getForProfile(profileKey, 'progress');
  }

  /**
   * Get legacy achievements data (for migration)
   * @param {string} profileKey - Profile identifier
   * @returns {Object|null} Legacy achievements data
   */
  getLegacyAchievements(profileKey) {
    return this.getForProfile(profileKey, 'achievements');
  }

  /**
   * Get all legacy data for profile (for migration)
   * @param {string} profileKey - Profile identifier
   * @returns {Object} Object with all legacy data
   */
  getLegacyData(profileKey) {
    const keys = this.getProfileKeys(profileKey);
    const data = {};

    for (const key of keys) {
      data[key] = this.getForProfile(profileKey, key);
    }

    return data;
  }

  /**
   * Remove all profile-specific keys (cleanup after migration)
   * @param {string} profileKey - Profile identifier
   * @param {boolean} confirm - Must be true to prevent accidental removal
   * @returns {number} Number of keys removed
   */
  removeProfileData(profileKey, confirm = false) {
    if (!confirm) {
      console.warn('[LocalStorage] removeProfileData requires confirm=true');
      return 0;
    }

    const keys = this.getProfileKeys(profileKey);
    let removed = 0;

    for (const key of keys) {
      if (this.removeForProfile(profileKey, key)) {
        removed++;
      }
    }

    console.log(`[LocalStorage] Removed ${removed} keys for profile ${profileKey}`);
    return removed;
  }

  // ============================================================================
  // ANALYTICS OPERATIONS
  // ============================================================================

  /**
   * Get analytics data
   * @returns {Object} Analytics data
   */
  getAnalytics() {
    return this.get('analytics', {});
  }

  /**
   * Set analytics data
   * @param {Object} data - Analytics data
   * @returns {boolean} Success status
   */
  setAnalytics(data) {
    return this.set('analytics', data);
  }

  /**
   * Get build timestamp (for version tracking)
   * @returns {string|null} Build timestamp
   */
  getBuildTimestamp() {
    return this.get('build-timestamp');
  }

  /**
   * Set build timestamp
   * @param {string} timestamp - Build timestamp
   * @returns {boolean} Success status
   */
  setBuildTimestamp(timestamp) {
    return this.set('build-timestamp', timestamp);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get localStorage usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    const allKeys = this.getAllKeys();
    let totalSize = 0;

    for (const key of allKeys) {
      const value = localStorage.getItem(this.prefix + key);
      if (value) {
        totalSize += value.length;
      }
    }

    return {
      keyCount: allKeys.keys,
      totalSizeBytes: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      estimatedLimitKB: 5120, // Most browsers: ~5MB
      usagePercent: ((totalSize / (5120 * 1024)) * 100).toFixed(2)
    };
  }

  /**
   * Export all LingXM localStorage data
   * @returns {Object} All data keyed by original key names
   */
  exportAll() {
    const keys = this.getAllKeys();
    const data = {};

    for (const key of keys) {
      data[key] = this.get(key);
    }

    return data;
  }

  /**
   * Import data into localStorage
   * @param {Object} data - Data to import
   * @param {boolean} overwrite - Overwrite existing keys
   * @returns {number} Number of keys imported
   */
  importData(data, overwrite = false) {
    let imported = 0;

    for (const [key, value] of Object.entries(data)) {
      if (overwrite || !this.has(key)) {
        if (this.set(key, value)) {
          imported++;
        }
      }
    }

    console.log(`[LocalStorage] Imported ${imported} keys`);
    return imported;
  }
}

// Create singleton instance
export const localStorageManager = new LocalStorageManager();
