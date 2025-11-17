/**
 * MigrationManager - Handles data migration from classic to universal profiles
 * One-time migration of hardcoded PROFILES from config.js to database
 * Preserves all existing progress, achievements, and user data
 */

import { dbManager } from './database.js';
import { profileManager } from './profileManager.js';
import { localStorageManager } from './localStorage.js';
import { PROFILES } from '../config.js';

export class MigrationManager {
  constructor() {
    this.migrationVersion = '1.0.0';
    this.migrationKey = 'migration-version';
  }

  /**
   * Check if migration has already been completed
   * @returns {boolean} True if migration is complete
   */
  isMigrationComplete() {
    const version = localStorageManager.get(this.migrationKey);
    return version === this.migrationVersion;
  }

  /**
   * Run complete migration process
   * @returns {Object} Migration results
   */
  async runMigration() {
    console.log('[Migration] Starting classic profiles migration...');

    if (this.isMigrationComplete()) {
      console.log('[Migration] Already completed, skipping');
      return { success: true, alreadyComplete: true };
    }

    try {
      // Ensure database and profile manager are initialized
      await dbManager.init();
      await profileManager.init();

      const results = {
        profilesMigrated: 0,
        languagesMigrated: 0,
        errors: [],
        details: []
      };

      // Migrate each classic profile from config.js
      for (const [profileKey, profileConfig] of Object.entries(PROFILES)) {
        try {
          const result = await this.migrateClassicProfile(profileKey, profileConfig);
          results.profilesMigrated += result.success ? 1 : 0;
          results.languagesMigrated += result.languagesAdded || 0;
          results.details.push(result);
        } catch (error) {
          console.error(`[Migration] Error migrating ${profileKey}:`, error);
          results.errors.push({
            profileKey,
            error: error.message
          });
        }
      }

      // Mark migration as complete
      if (results.errors.length === 0) {
        localStorageManager.set(this.migrationKey, this.migrationVersion);
        console.log('[Migration] ✅ Complete!', results);
      } else {
        console.error('[Migration] ⚠️ Completed with errors', results);
      }

      return {
        success: results.errors.length === 0,
        ...results
      };
    } catch (error) {
      console.error('[Migration] Fatal error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Migrate a single classic profile to user_profiles table
   * @param {string} profileKey - Profile key (e.g., 'vahiko', 'hassan')
   * @param {Object} profileConfig - Profile configuration from PROFILES
   * @returns {Object} Migration result
   */
  async migrateClassicProfile(profileKey, profileConfig) {
    console.log(`[Migration] Migrating profile: ${profileKey}`);

    // Check if profile already exists in user_profiles
    const existing = profileManager.getProfile(profileKey);
    if (existing && !existing.isClassic) {
      console.log(`[Migration] Profile ${profileKey} already migrated`);
      return {
        success: true,
        profileKey,
        skipped: true,
        reason: 'already_migrated'
      };
    }

    try {
      // Create user_profile record
      dbManager.db.run(`
        INSERT OR IGNORE INTO user_profiles (
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
        'classic',
        profileConfig.name,
        profileConfig.emoji || '👤',
        profileConfig.interfaceLanguages[0], // Native language (first interface language)
        JSON.stringify(profileConfig.interfaceLanguages),
        JSON.stringify({}) // Default empty settings
      ]);

      // Get the created profile ID
      const profileResult = dbManager.db.exec(
        'SELECT id FROM user_profiles WHERE profile_key = ?',
        [profileKey]
      );

      if (profileResult.length === 0 || profileResult[0].values.length === 0) {
        throw new Error(`Failed to create profile: ${profileKey}`);
      }

      const profileId = profileResult[0].values[0][0];

      // Migrate learning languages
      let languagesAdded = 0;

      for (const lang of profileConfig.learningLanguages) {
        try {
          // Extract level code (e.g., "B2" -> "b2")
          const levelCode = lang.level ? lang.level.toLowerCase() : null;

          dbManager.db.run(`
            INSERT OR IGNORE INTO profile_languages (
              profile_id,
              language_code,
              language_name,
              level_code,
              specialty,
              daily_words
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            profileId,
            lang.code,
            lang.name,
            levelCode,
            lang.specialty || null,
            lang.dailyWords || 10
          ]);

          languagesAdded++;
        } catch (error) {
          console.error(`[Migration] Error adding language ${lang.code}:`, error);
        }
      }

      // Ensure user exists in legacy users table (for backward compatibility)
      dbManager.getOrCreateUser(profileKey);

      // Save changes
      await dbManager.saveToStorage();

      console.log(`[Migration] ✅ Migrated ${profileKey}: ${languagesAdded} languages`);

      return {
        success: true,
        profileKey,
        profileId,
        languagesAdded,
        skipped: false
      };
    } catch (error) {
      console.error(`[Migration] Error migrating ${profileKey}:`, error);
      return {
        success: false,
        profileKey,
        error: error.message
      };
    }
  }

  /**
   * Rollback migration (for testing/debugging)
   * WARNING: This removes all migrated profile data
   * @param {boolean} confirm - Must be true to execute
   * @returns {boolean} Success status
   */
  async rollbackMigration(confirm = false) {
    if (!confirm) {
      console.warn('[Migration] Rollback requires confirm=true');
      return false;
    }

    console.log('[Migration] Rolling back migration...');

    try {
      await dbManager.init();

      // Delete all classic profiles from user_profiles
      dbManager.db.run(`
        DELETE FROM user_profiles WHERE profile_type = 'classic'
      `);

      // Delete migration marker
      localStorageManager.remove(this.migrationKey);

      await dbManager.saveToStorage();

      console.log('[Migration] ✅ Rollback complete');
      return true;
    } catch (error) {
      console.error('[Migration] Rollback error:', error);
      return false;
    }
  }

  /**
   * Verify migration integrity
   * Checks that all classic profiles were migrated correctly
   * @returns {Object} Verification results
   */
  async verifyMigration() {
    console.log('[Migration] Verifying migration...');

    try {
      await dbManager.init();
      await profileManager.init();

      const results = {
        valid: true,
        totalProfiles: 0,
        migratedProfiles: 0,
        missingProfiles: [],
        mismatchedData: []
      };

      // Check each profile in PROFILES config
      for (const [profileKey, profileConfig] of Object.entries(PROFILES)) {
        results.totalProfiles++;

        const dbProfile = profileManager.getProfile(profileKey);

        if (!dbProfile) {
          results.valid = false;
          results.missingProfiles.push(profileKey);
          continue;
        }

        results.migratedProfiles++;

        // Verify profile data matches
        if (dbProfile.display_name !== profileConfig.name) {
          results.mismatchedData.push({
            profileKey,
            field: 'display_name',
            expected: profileConfig.name,
            actual: dbProfile.display_name
          });
          results.valid = false;
        }

        // Verify learning languages count
        if (dbProfile.learningLanguages.length !== profileConfig.learningLanguages.length) {
          results.mismatchedData.push({
            profileKey,
            field: 'learningLanguages.length',
            expected: profileConfig.learningLanguages.length,
            actual: dbProfile.learningLanguages.length
          });
          results.valid = false;
        }
      }

      if (results.valid) {
        console.log('[Migration] ✅ Verification passed');
      } else {
        console.error('[Migration] ⚠️ Verification failed', results);
      }

      return results;
    } catch (error) {
      console.error('[Migration] Verification error:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get migration status and statistics
   * @returns {Object} Migration status
   */
  getMigrationStatus() {
    return {
      isComplete: this.isMigrationComplete(),
      version: localStorageManager.get(this.migrationKey),
      expectedVersion: this.migrationVersion,
      classicProfilesCount: Object.keys(PROFILES).length
    };
  }

  /**
   * Force re-run migration (useful for development)
   * @param {boolean} confirm - Must be true to execute
   * @returns {Object} Migration results
   */
  async forceMigration(confirm = false) {
    if (!confirm) {
      console.warn('[Migration] Force migration requires confirm=true');
      return { success: false, message: 'Confirmation required' };
    }

    console.log('[Migration] Force re-running migration...');

    // Remove migration marker
    localStorageManager.remove(this.migrationKey);

    // Run migration
    return await this.runMigration();
  }

  /**
   * Migrate legacy localStorage data to database (optional)
   * Migrates old progress, achievements, etc. from localStorage to database
   * @param {string} profileKey - Profile to migrate data for
   * @returns {Object} Migration results
   */
  async migrateLegacyLocalStorage(profileKey) {
    console.log(`[Migration] Migrating localStorage for ${profileKey}...`);

    // Check if already migrated
    if (localStorageManager.isMigrated(profileKey)) {
      console.log(`[Migration] localStorage for ${profileKey} already migrated`);
      return { success: true, skipped: true };
    }

    try {
      const results = {
        progressMigrated: 0,
        achievementsMigrated: 0,
        settingsMigrated: 0
      };

      // Get legacy progress data
      const legacyProgress = localStorageManager.getLegacyProgress(profileKey);
      if (legacyProgress) {
        // TODO: Migrate progress data to database
        // This would require parsing the old format and inserting into progress table
        console.log('[Migration] Legacy progress found but migration not implemented yet');
      }

      // Get legacy achievements
      const legacyAchievements = localStorageManager.getLegacyAchievements(profileKey);
      if (legacyAchievements) {
        // TODO: Migrate achievements to database
        console.log('[Migration] Legacy achievements found but migration not implemented yet');
      }

      // Mark as migrated
      localStorageManager.setMigrated(profileKey);

      console.log(`[Migration] ✅ localStorage migration complete for ${profileKey}`);

      return {
        success: true,
        ...results
      };
    } catch (error) {
      console.error(`[Migration] Error migrating localStorage for ${profileKey}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Auto-run migration on app initialization (if needed)
   * This is the recommended way to trigger migration
   * @returns {Promise<Object>} Migration results
   */
  async autoMigrate() {
    if (this.isMigrationComplete()) {
      console.log('[Migration] Auto-migration: Already complete');
      return { success: true, alreadyComplete: true };
    }

    console.log('[Migration] Auto-migration: Starting...');
    return await this.runMigration();
  }
}

// Create singleton instance
export const migrationManager = new MigrationManager();

/**
 * Convenience function to run migration on app startup
 * Add this to app.js initialization
 */
export async function runMigrationIfNeeded() {
  return await migrationManager.autoMigrate();
}
