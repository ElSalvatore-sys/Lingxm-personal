/**
 * Position Manager - Bulletproof Resume Feature
 *
 * Features:
 * - Debounced saves for rapid navigation (performance)
 * - Immediate saves for critical moments (tab close, back button)
 * - Multi-layer persistence (localStorage + database)
 * - Comprehensive event listeners (beforeunload, visibilitychange, pagehide)
 * - Fail-safe recovery mechanisms
 */

export class PositionManager {
  constructor(database = null) {
    this.database = database;
    this.saveTimeout = null;
    this.DEBOUNCE_DELAY = 500; // ms - wait before saving during rapid navigation

    // Track current position for event listeners
    this.currentProfile = null;
    this.currentLanguage = null;
    this.currentWordIndex = null;

    this.setupEventListeners();
    console.log('🎯 [PositionManager] Initialized with event listeners');
  }

  /**
   * Setup universal save triggers for critical moments
   */
  setupEventListeners() {
    // Save on tab close (most critical)
    window.addEventListener('beforeunload', () => {
      console.log('🚪 [PositionManager] beforeunload - saving immediately');
      this.saveImmediately();
    });

    // Save on tab visibility change (switching tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('👁️ [PositionManager] Tab hidden - saving immediately');
        this.saveImmediately();
      }
    });

    // Save on page navigation/hide
    window.addEventListener('pagehide', () => {
      console.log('📄 [PositionManager] pagehide - saving immediately');
      this.saveImmediately();
    });
  }

  /**
   * Update current position (called before every save)
   */
  updateCurrentPosition(profile, language, wordIndex) {
    this.currentProfile = profile;
    this.currentLanguage = language;
    this.currentWordIndex = wordIndex;
  }

  /**
   * Debounced save - for rapid navigation (next/previous/swipe)
   * Delays save by DEBOUNCE_DELAY to avoid excessive saves
   */
  saveDebounced(profile, language, wordIndex) {
    // Update current position for event listeners
    this.updateCurrentPosition(profile, language, wordIndex);

    // Clear existing timeout
    clearTimeout(this.saveTimeout);

    // Schedule new save
    this.saveTimeout = setTimeout(() => {
      this.saveImmediately(profile, language, wordIndex);
    }, this.DEBOUNCE_DELAY);

    console.log(`⏱️ [PositionManager] Debounced save scheduled (${this.DEBOUNCE_DELAY}ms)`, {
      profile,
      language,
      wordIndex
    });
  }

  /**
   * Immediate save - for critical moments (back button, tab close, language switch)
   * No debouncing, saves instantly
   */
  saveImmediately(profile = null, language = null, wordIndex = null) {
    // Use current position if parameters not provided (for event listeners)
    profile = profile || this.currentProfile;
    language = language || this.currentLanguage;
    wordIndex = wordIndex !== null ? wordIndex : this.currentWordIndex;

    // Validate parameters
    if (!profile || !language || wordIndex === null || wordIndex === undefined) {
      console.warn('⚠️ [PositionManager] Invalid save parameters, skipping save', {
        profile,
        language,
        wordIndex
      });
      return false;
    }

    const position = {
      lastWordIndex: wordIndex,
      lastLanguage: language,
      timestamp: new Date().toISOString()
    };

    const key = `lingxm-${profile}-${language}-position`;

    console.log('🔵 [SAVE POSITION - IMMEDIATE]', {
      profile,
      language,
      wordIndex,
      key,
      position
    });

    try {
      // LAYER 1: Save to localStorage (fast, synchronous)
      localStorage.setItem(key, JSON.stringify(position));

      // Also save "last active language" for this profile
      const lastActiveLangKey = `lingxm-${profile}-last-active-language`;
      localStorage.setItem(lastActiveLangKey, language);

      console.log('✅ [localStorage] Saved successfully', {
        key,
        lastActiveLanguage: language
      });

      // LAYER 2: Save to database (if available)
      this.saveToDatabaseAsync(profile, language, wordIndex);

      // Verify localStorage save
      const verification = localStorage.getItem(key);
      if (verification) {
        console.log('✅ [VERIFY] Position saved correctly', {
          stored: JSON.parse(verification)
        });
        return true;
      } else {
        console.error('❌ [VERIFY] Failed to verify save!');
        return false;
      }

    } catch (error) {
      console.error('❌ [PositionManager] Save failed:', error);
      return false;
    }
  }

  /**
   * Save to database asynchronously (non-blocking)
   */
  async saveToDatabaseAsync(profile, language, wordIndex) {
    if (!this.database || !this.database.isInitialized) {
      console.log('ℹ️ [Database] Not available, using localStorage only');
      return;
    }

    try {
      await this.database.savePosition(profile, language, wordIndex);
      console.log('✅ [Database] Position saved', {
        profile,
        language,
        wordIndex
      });
    } catch (error) {
      console.warn('⚠️ [Database] Save failed, localStorage backup available', error);
    }
  }

  /**
   * Load position for a specific profile and language
   * Tries database first, falls back to localStorage
   */
  async load(profile, language) {
    console.log('🔍 [LOAD POSITION]', {
      profile,
      language,
      allKeys: Object.keys(localStorage).filter(k => k.startsWith('lingxm-'))
    });

    let position = null;

    // LAYER 1: Try database first (if available)
    if (this.database && this.database.isInitialized) {
      try {
        const dbPosition = await this.database.loadPosition(profile, language);
        if (dbPosition !== null && dbPosition !== undefined) {
          position = {
            lastWordIndex: dbPosition,
            lastLanguage: language,
            source: 'database'
          };
          console.log('📦 [Database] Position loaded', position);
        }
      } catch (error) {
        console.warn('⚠️ [Database] Load failed, trying localStorage', error);
      }
    }

    // LAYER 2: Fall back to localStorage
    if (!position) {
      const key = `lingxm-${profile}-${language}-position`;
      const saved = localStorage.getItem(key);

      if (saved) {
        try {
          position = JSON.parse(saved);
          position.source = 'localStorage';
          console.log('📦 [localStorage] Position loaded', {
            key,
            position
          });
        } catch (error) {
          console.error('❌ [localStorage] Parse failed:', error);
          return null;
        }
      }
    }

    // No position found
    if (!position) {
      console.log('ℹ️ [PositionManager] No saved position for this language');
      return null;
    }

    // Validate and return
    console.log('✅ [PARSED POSITION]', {
      wordIndex: position.lastWordIndex,
      language: position.lastLanguage,
      source: position.source,
      timestamp: position.timestamp
    });

    return position;
  }

  /**
   * Get the last active language for a profile
   */
  getLastActiveLanguage(profile) {
    const key = `lingxm-${profile}-last-active-language`;
    const language = localStorage.getItem(key);

    console.log('🔎 [Last Active Language]', {
      profile,
      language: language || 'none'
    });

    return language;
  }

  /**
   * Clear position for a specific profile and language (useful for reset)
   */
  clearPosition(profile, language) {
    const key = `lingxm-${profile}-${language}-position`;
    localStorage.removeItem(key);

    if (this.database && this.database.isInitialized) {
      this.database.clearPosition(profile, language);
    }

    console.log('🗑️ [PositionManager] Cleared position', {
      profile,
      language
    });
  }

  /**
   * Clear all positions for a profile (useful for profile reset)
   */
  clearAllPositions(profile) {
    // Clear localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`lingxm-${profile}-`) && k.endsWith('-position'));
    keys.forEach(key => localStorage.removeItem(key));

    // Clear last active language
    localStorage.removeItem(`lingxm-${profile}-last-active-language`);

    console.log('🗑️ [PositionManager] Cleared all positions for profile', {
      profile,
      keysCleared: keys.length
    });
  }

  /**
   * Get statistics about saved positions
   */
  getStats() {
    const positionKeys = Object.keys(localStorage).filter(k => k.includes('position'));
    const languageKeys = Object.keys(localStorage).filter(k => k.includes('last-active-language'));

    return {
      savedPositions: positionKeys.length,
      lastActiveLanguages: languageKeys.length,
      positions: positionKeys.map(key => {
        try {
          return {
            key,
            data: JSON.parse(localStorage.getItem(key))
          };
        } catch {
          return { key, data: 'invalid' };
        }
      })
    };
  }
}
