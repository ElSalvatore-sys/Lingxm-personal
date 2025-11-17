/**
 * ProfileManager - Universal Profile Management System
 * Manages both classic (hardcoded) and universal (user-created) profiles
 * Provides CRUD operations and bridges legacy config.js PROFILES with database
 */

import { dbManager } from './database.js';
import { PROFILES } from '../config.js';

export class ProfileManager {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize profile manager
   * Must be called after database initialization
   */
  async init() {
    await dbManager.init();
    this.db = dbManager.db;
    return this;
  }

  // ============================================================================
  // PROFILE CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new universal profile
   * @param {Object} profileData - Profile configuration
   * @param {string} profileData.displayName - User's name
   * @param {string} profileData.nativeLanguage - Primary UI language (e.g., 'en', 'ar')
   * @param {string[]} [profileData.interfaceLanguages] - UI language array (defaults to [nativeLanguage])
   * @param {string} [profileData.avatarEmoji='👤'] - Profile emoji
   * @param {Object} [profileData.settings={}] - User preferences
   * @returns {Object} Created profile with id and profile_key
   */
  createProfile(profileData) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    const {
      displayName,
      nativeLanguage,
      interfaceLanguages = [nativeLanguage],
      avatarEmoji = '👤',
      settings = {}
    } = profileData;

    // Validate required fields
    if (!displayName || !nativeLanguage) {
      throw new Error('displayName and nativeLanguage are required');
    }

    // Generate unique profile_key
    const profileKey = this._generateProfileKey(displayName);

    // Insert into user_profiles table
    dbManager.db.run(`
      INSERT INTO user_profiles (
        profile_key,
        profile_type,
        display_name,
        avatar_emoji,
        native_language,
        interface_languages,
        settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      profileKey,
      'universal',
      displayName,
      avatarEmoji,
      nativeLanguage,
      JSON.stringify(interfaceLanguages),
      JSON.stringify(settings)
    ]);

    // Get the created profile ID
    const result = dbManager.db.exec(
      'SELECT id FROM user_profiles WHERE profile_key = ?',
      [profileKey]
    );

    if (result.length > 0 && result[0].values.length > 0) {
      const profileId = result[0].values[0][0];

      console.log('[ProfileManager] Profile inserted with ID:', profileId);

      // Also create entry in legacy users table for compatibility
      dbManager.getOrCreateUser(profileKey);

      // Save to storage
      dbManager.saveToStorage();

      // Get the complete profile using the new getProfile() method
      const profile = this.getProfile(profileId);

      if (!profile) {
        throw new Error('Failed to retrieve newly created profile');
      }

      console.log('[ProfileManager] ✅ Profile created and verified:', profile.profile_key);

      return profile;
    }

    throw new Error('Failed to create profile');
  }

  /**
   * Get profile by profile_key OR numeric ID
   * Checks both database (universal) and config.js (classic)
   * @param {string|number} identifier - Profile key (string) or profile ID (number)
   * @returns {Object|null} Profile object or null
   */
  getProfile(identifier) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    console.log('[ProfileManager] Getting profile:', identifier, 'type:', typeof identifier);

    // Determine if identifier is numeric ID or string profile_key
    const isNumericId = typeof identifier === 'number' ||
                        (typeof identifier === 'string' && !isNaN(parseInt(identifier)) && identifier === parseInt(identifier).toString());

    let query, params;
    if (isNumericId) {
      // Query by numeric ID
      query = 'SELECT * FROM user_profiles WHERE id = ? AND is_archived = 0';
      params = [typeof identifier === 'number' ? identifier : parseInt(identifier)];
      console.log('[ProfileManager] Querying by ID:', params[0]);
    } else {
      // Query by profile_key (string)
      query = 'SELECT * FROM user_profiles WHERE profile_key = ? AND is_archived = 0';
      params = [identifier];
      console.log('[ProfileManager] Querying by profile_key:', params[0]);
    }

    // Try database first (universal profiles)
    const result = dbManager.db.exec(query, params);

    if (result.length > 0 && result[0].values.length > 0) {
      const profile = this._rowToProfile(result[0].columns, result[0].values[0]);

      // Load associated learning languages
      profile.learningLanguages = this.getProfileLanguages(profile.id);

      console.log('[ProfileManager] ✅ Profile loaded:', profile.profile_key, 'with', profile.learningLanguages.length, 'languages');
      return profile;
    }

    console.log('[ProfileManager] Profile not found in database, trying classic profiles...');

    // Fallback to classic profile from config.js (only for string keys)
    if (!isNumericId && PROFILES[identifier]) {
      console.log('[ProfileManager] ✅ Found in classic profiles:', identifier);
      return this._classicToUniversalFormat(identifier, PROFILES[identifier]);
    }

    console.warn('[ProfileManager] ❌ Profile not found:', identifier);
    return null;
  }

  /**
   * Get all profiles (both classic and universal)
   * @param {Object} options - Filter options
   * @param {boolean} [options.includeArchived=false] - Include archived profiles
   * @param {string} [options.profileType] - Filter by 'classic' or 'universal'
   * @returns {Array} Array of profile objects
   */
  getAllProfiles(options = {}) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    const { includeArchived = false, profileType } = options;

    // Get universal profiles from database
    let query = 'SELECT * FROM user_profiles WHERE 1=1';
    const params = [];

    if (!includeArchived) {
      query += ' AND is_archived = 0';
    }

    if (profileType) {
      query += ' AND profile_type = ?';
      params.push(profileType);
    }

    query += ' ORDER BY last_active DESC';

    const result = dbManager.db.exec(query, params);

    const profiles = [];

    if (result.length > 0 && result[0].values.length > 0) {
      for (const row of result[0].values) {
        const profile = this._rowToProfile(result[0].columns, row);
        profile.learningLanguages = this.getProfileLanguages(profile.id);
        profiles.push(profile);
      }
    }

    return profiles;
  }

  /**
   * Update profile information
   * @param {string} profileKey - Profile identifier
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  updateProfile(profileKey, updates) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    const allowedFields = [
      'display_name',
      'avatar_emoji',
      'native_language',
      'interface_languages',
      'settings'
    ];

    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);

        // Stringify JSON fields
        if (key === 'interface_languages' || key === 'settings') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    }

    if (setClauses.length === 0) {
      console.warn('[ProfileManager] No valid fields to update');
      return false;
    }

    // Add last_active update
    setClauses.push('last_active = ?');
    params.push(new Date().toISOString());

    // Add profileKey for WHERE clause
    params.push(profileKey);

    const query = `
      UPDATE user_profiles
      SET ${setClauses.join(', ')}
      WHERE profile_key = ?
    `;

    try {
      dbManager.db.run(query, params);
      dbManager.saveToStorage();
      console.log('[ProfileManager] Updated profile:', profileKey);
      return true;
    } catch (error) {
      console.error('[ProfileManager] Error updating profile:', error);
      return false;
    }
  }

  /**
   * Archive (soft delete) a profile
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} Success status
   */
  archiveProfile(profileKey) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    try {
      dbManager.db.run(
        'UPDATE user_profiles SET is_archived = 1 WHERE profile_key = ?',
        [profileKey]
      );
      dbManager.saveToStorage();
      console.log('[ProfileManager] Archived profile:', profileKey);
      return true;
    } catch (error) {
      console.error('[ProfileManager] Error archiving profile:', error);
      return false;
    }
  }

  /**
   * Restore an archived profile
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} Success status
   */
  restoreProfile(profileKey) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    try {
      dbManager.db.run(
        'UPDATE user_profiles SET is_archived = 0 WHERE profile_key = ?',
        [profileKey]
      );
      dbManager.saveToStorage();
      console.log('[ProfileManager] Restored profile:', profileKey);
      return true;
    } catch (error) {
      console.error('[ProfileManager] Error restoring profile:', error);
      return false;
    }
  }

  /**
   * Permanently delete a profile and all associated data
   * @param {string} profileKey - Profile identifier
   * @returns {boolean} Success status
   */
  deleteProfile(profileKey) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    try {
      // Get profile_id first
      const profile = this.getProfile(profileKey);
      if (!profile) {
        console.warn('[ProfileManager] Profile not found:', profileKey);
        return false;
      }

      // Delete from user_profiles (CASCADE will delete profile_languages and proficiency_tests)
      dbManager.db.run(
        'DELETE FROM user_profiles WHERE profile_key = ?',
        [profileKey]
      );

      // Also delete from legacy users table
      dbManager.db.run(
        'DELETE FROM users WHERE profile_key = ?',
        [profileKey]
      );

      dbManager.saveToStorage();
      console.log('[ProfileManager] Deleted profile:', profileKey);
      return true;
    } catch (error) {
      console.error('[ProfileManager] Error deleting profile:', error);
      return false;
    }
  }

  // ============================================================================
  // LEARNING LANGUAGE MANAGEMENT
  // ============================================================================

  /**
   * Add a learning language to a profile
   * @param {number} profileId - Profile ID (from user_profiles)
   * @param {Object} languageData - Language configuration
   * @param {string} languageData.languageCode - ISO 639-1 code (e.g., 'de')
   * @param {string} languageData.languageName - Display name (e.g., 'German')
   * @param {string} [languageData.levelCode] - CEFR level (e.g., 'b2')
   * @param {string} [languageData.specialty] - Specialty (e.g., 'gastro', 'it')
   * @param {number} [languageData.dailyWords=10] - Daily word goal
   * @returns {boolean} Success status
   */
  addLanguageToProfile(profileId, languageData) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    const {
      languageCode,
      languageName,
      levelCode = null,
      specialty = null,
      dailyWords = 10
    } = languageData;

    if (!languageCode || !languageName) {
      throw new Error('languageCode and languageName are required');
    }

    try {
      dbManager.db.run(`
        INSERT INTO profile_languages (
          profile_id,
          language_code,
          language_name,
          level_code,
          specialty,
          daily_words
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [profileId, languageCode, languageName, levelCode, specialty, dailyWords]);

      dbManager.saveToStorage();
      console.log('[ProfileManager] Added language:', { profileId, languageCode });
      return true;
    } catch (error) {
      console.error('[ProfileManager] Error adding language:', error);
      return false;
    }
  }

  /**
   * Get all learning languages for a profile
   * @param {number} profileId - Profile ID
   * @param {boolean} [activeOnly=true] - Return only active languages
   * @returns {Array} Array of language objects
   */
  getProfileLanguages(profileId, activeOnly = true) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    let query = 'SELECT * FROM profile_languages WHERE profile_id = ?';
    const params = [profileId];

    if (activeOnly) {
      query += ' AND is_active = 1';
    }

    query += ' ORDER BY added_at ASC';

    const result = dbManager.db.exec(query, params);

    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values.map(row => ({
        id: row[0],
        profileId: row[1],
        languageCode: row[2],
        languageName: row[3],
        levelCode: row[4],
        specialty: row[5],
        dailyWords: row[6],
        isActive: row[7] === 1,
        addedAt: row[8]
      }));
    }

    return [];
  }

  /**
   * Update learning language configuration
   * @param {number} profileId - Profile ID
   * @param {string} languageCode - Language code to update
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  updateProfileLanguage(profileId, languageCode, updates) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    const allowedFields = ['level_code', 'specialty', 'daily_words', 'is_active'];

    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (setClauses.length === 0) {
      return false;
    }

    params.push(profileId, languageCode);

    const query = `
      UPDATE profile_languages
      SET ${setClauses.join(', ')}
      WHERE profile_id = ? AND language_code = ?
    `;

    try {
      dbManager.db.run(query, params);
      dbManager.saveToStorage();
      return true;
    } catch (error) {
      console.error('[ProfileManager] Error updating language:', error);
      return false;
    }
  }

  /**
   * Remove a learning language from profile
   * @param {number} profileId - Profile ID
   * @param {string} languageCode - Language code to remove
   * @returns {boolean} Success status
   */
  removeLanguageFromProfile(profileId, languageCode) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    try {
      dbManager.db.run(
        'DELETE FROM profile_languages WHERE profile_id = ? AND language_code = ?',
        [profileId, languageCode]
      );
      dbManager.saveToStorage();
      console.log('[ProfileManager] Removed language:', { profileId, languageCode });
      return true;
    } catch (error) {
      console.error('[ProfileManager] Error removing language:', error);
      return false;
    }
  }

  // ============================================================================
  // PROFICIENCY TEST MANAGEMENT
  // ============================================================================

  /**
   * Record proficiency test result
   * @param {number} profileId - Profile ID
   * @param {string} languageCode - Language tested
   * @param {Object} testData - Test results
   * @returns {boolean} Success status
   */
  recordProficiencyTest(profileId, languageCode, testData) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    const {
      testType = 'quick',
      determinedLevel,
      score,
      questionsTotal,
      questionsCorrect
    } = testData;

    if (!determinedLevel) {
      throw new Error('determinedLevel is required');
    }

    try {
      dbManager.db.run(`
        INSERT INTO proficiency_tests (
          profile_id,
          language_code,
          test_type,
          determined_level,
          score,
          questions_total,
          questions_correct
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        profileId,
        languageCode,
        testType,
        determinedLevel,
        score,
        questionsTotal,
        questionsCorrect
      ]);

      dbManager.saveToStorage();
      console.log('[ProfileManager] Recorded test:', { profileId, languageCode, determinedLevel });
      return true;
    } catch (error) {
      console.error('[ProfileManager] Error recording test:', error);
      return false;
    }
  }

  /**
   * Get proficiency test history for a profile and language
   * @param {number} profileId - Profile ID
   * @param {string} languageCode - Language code
   * @returns {Array} Array of test results
   */
  getProficiencyTests(profileId, languageCode) {
    if (!this.db) throw new Error('ProfileManager not initialized');

    const result = dbManager.db.exec(`
      SELECT * FROM proficiency_tests
      WHERE profile_id = ? AND language_code = ?
      ORDER BY taken_at DESC
    `, [profileId, languageCode]);

    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values.map(row => ({
        id: row[0],
        profileId: row[1],
        languageCode: row[2],
        testType: row[3],
        determinedLevel: row[4],
        score: row[5],
        questionsTotal: row[6],
        questionsCorrect: row[7],
        takenAt: row[8]
      }));
    }

    return [];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate unique profile_key from display name
   * @private
   */
  _generateProfileKey(displayName) {
    // Create base key from name (lowercase, no spaces, alphanumeric only)
    const baseKey = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    return `${baseKey}_${randomSuffix}`;
  }

  /**
   * Convert database row to profile object
   * @private
   */
  _rowToProfile(columns, row) {
    const profile = {};

    columns.forEach((col, idx) => {
      const value = row[idx];

      // Parse JSON fields
      if (col === 'interface_languages' || col === 'settings') {
        profile[col] = value ? JSON.parse(value) : (col === 'settings' ? {} : []);
      } else if (col === 'is_archived') {
        profile[col] = value === 1;
      } else {
        profile[col] = value;
      }
    });

    return profile;
  }

  /**
   * Convert classic PROFILES config to universal format
   * @private
   */
  _classicToUniversalFormat(profileKey, classicProfile) {
    return {
      profile_key: profileKey,
      profile_type: 'classic',
      display_name: classicProfile.name,
      avatar_emoji: classicProfile.emoji,
      native_language: classicProfile.interfaceLanguages[0],
      interface_languages: classicProfile.interfaceLanguages,
      learningLanguages: classicProfile.learningLanguages.map(lang => ({
        languageCode: lang.code,
        languageName: lang.name,
        levelCode: lang.level?.toLowerCase(),
        specialty: lang.specialty || null,
        dailyWords: lang.dailyWords || 10,
        isActive: true
      })),
      settings: {},
      is_archived: false,
      isClassic: true // Flag to identify classic profiles
    };
  }

  /**
   * Update last active timestamp for profile
   */
  updateLastActive(profileKey) {
    if (!this.db) return;

    try {
      dbManager.db.run(
        'UPDATE user_profiles SET last_active = ? WHERE profile_key = ?',
        [new Date().toISOString(), profileKey]
      );
      dbManager.saveToStorage();
    } catch (error) {
      console.error('[ProfileManager] Error updating last active:', error);
    }
  }
}

// Create singleton instance
export const profileManager = new ProfileManager();
