import { initVersionCheck } from './utils/version-check.js';
import { PROFILES, LANGUAGE_NAMES, SECTION_LABELS } from './config.js';
import { ProgressTracker } from './utils/progress.js';
import { SpeechManager } from './utils/speech.js';
import { AchievementManager, ACHIEVEMENTS } from './utils/achievements.js';
import { AnalyticsManager } from './utils/analytics.js';
import { PositionManager } from './utils/positionManager.js';
import { dbManager } from './utils/database.js';
import { sentenceManager } from './utils/sentenceManager.js';
import { profileManager } from './utils/profileManager.js';
import { migrationManager } from './utils/migration.js';
import { localStorageManager } from './utils/localStorage.js';
import { OnboardingManager } from './screens/onboarding/OnboardingManager.js';

// ============================================
// Global Database Initialization
// ============================================
let databaseReady = null;

async function ensureDatabaseReady() {
  if (!databaseReady) {
    console.log('🔄 [DB] Initializing database...');
    databaseReady = dbManager.init();
  }
  await databaseReady;
  console.log('✅ [DB] Database ready');
  return databaseReady;
}

class LingXMApp {
  constructor() {
    this.currentProfile = null;
    this.currentLanguageIndex = 0;
    this.currentWordIndex = 0;
    this.wordData = {};
    this.savedWords = this.loadSavedWords();
    this.progressTracker = null;
    this.achievementManager = null;
    this.analyticsManager = new AnalyticsManager();
    this.speechManager = new SpeechManager();
    this.positionManager = new PositionManager(); // Initialize without database first
    this.currentWelcomeSlide = 0;
    this.autoPlayEnabled = this.loadAutoPlaySetting();
    this.currentTheme = this.loadThemeSetting();
    this.isNavigating = false; // Guard flag to prevent multiple simultaneous navigations

    // NOTE: init() is now called from DOMContentLoaded handler with await
  }

  async init() {
    this.applyTheme();

    // Initialize database before any operations
    try {
      await ensureDatabaseReady();
      console.log('✅ [INIT] Database initialization complete');
    } catch (error) {
      console.error('❌ [INIT] Database initialization failed:', error);
    }

    // Run migration to convert classic profiles to universal schema
    try {
      console.log('🔄 [INIT] Running profile migration...');
      const migrationResult = await migrationManager.autoMigrate();

      if (migrationResult.success) {
        if (migrationResult.alreadyComplete) {
          console.log('✅ [INIT] Migration already complete');
        } else {
          console.log('✅ [INIT] Profile migration complete', {
            profiles: migrationResult.profilesMigrated,
            languages: migrationResult.languagesMigrated
          });
        }
      } else {
        console.error('⚠️ [INIT] Migration completed with errors:', migrationResult);
      }
    } catch (error) {
      console.error('❌ [INIT] Migration failed:', error);
      // Continue despite migration failure - classic profiles will still work from config.js
    }

    // Initialize aggressive version checking
    // DISABLED: Only use bootstrap check, not runtime checking
    // initVersionCheck();
    this.updateProfileLockIcons();
    await this.updateProfileProgressRings();
    this.setupEventListeners();

    // Check for classic mode first
    const isClassicMode = localStorage.getItem('lingxm-classic-mode') === 'true';

    if (isClassicMode) {
      // Classic mode: Use hardcoded profiles only
      console.log('🎯 [INIT] Classic mode active');

      const savedProfile = localStorage.getItem('lingxm-current-profile');
      if (savedProfile && PROFILES[savedProfile]) {
        console.log('🔄 [INIT] Restoring classic profile:', savedProfile);
        try {
          await this.selectProfile(savedProfile);
          console.log('✅ [INIT] Classic profile restored successfully');
          this.analyticsManager.trackEvent('app_opened', { firstTime: false, restored: true, mode: 'classic' });
          return;
        } catch (error) {
          console.error('❌ [INIT] Failed to restore classic profile:', error);
        }
      }

      // No saved classic profile - show profile selection
      this.showScreen('profile-selection');
      this.analyticsManager.trackEvent('app_opened', { firstTime: false, restored: false, mode: 'classic' });
      return;
    }

    // Universal mode: Check for onboarding completion
    const onboardingShown = localStorage.getItem('lingxm-onboarding-shown');

    if (!onboardingShown) {
      // First-time user: Start onboarding
      console.log('✨ [INIT] First-time user - starting onboarding');
      this.onboardingManager = new OnboardingManager(this);
      await this.onboardingManager.start();
      this.analyticsManager.trackEvent('onboarding_started', { firstTime: true });
      return;
    }

    // Onboarding completed: Check for active custom profile
    const activeUserId = localStorage.getItem('lingxm-active-user');

    if (activeUserId) {
      console.log('🔄 [INIT] Restoring custom profile:', activeUserId);
      try {
        await this.loadCustomProfile(parseInt(activeUserId));
        console.log('✅ [INIT] Custom profile restored successfully');
        this.analyticsManager.trackEvent('app_opened', { firstTime: false, restored: true, mode: 'universal' });
        return;
      } catch (error) {
        console.error('❌ [INIT] Failed to restore custom profile:', error);
        // Fall through to re-onboarding
      }
    }

    // Edge case: Onboarding shown but no profile - restart onboarding
    console.log('⚠️ [INIT] Onboarding incomplete - restarting');
    this.onboardingManager = new OnboardingManager(this);
    await this.onboardingManager.start();
    this.analyticsManager.trackEvent('onboarding_restarted', { reason: 'no_profile' });
  }

  setupEventListeners() {
    // Profile selection - setup handlers
    this.setupProfileClickHandlers();

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
      // CRITICAL: Save position BEFORE leaving
      if (this.profileKey && this.currentProfile) {
        const lang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
        this.positionManager.saveImmediately(
          this.profileKey,
          lang.code,
          this.currentWordIndex
        );
        console.log('🚪 [Back Button] Position saved before navigation');
      }

      // Go back to home screen instead of profile selection
      this.renderHomeScreen();
    });

    // Save word button
    document.getElementById('save-word-btn').addEventListener('click', () => {
      this.toggleSaveWord();
    });

    // Achievements button
    document.getElementById('achievements-btn')?.addEventListener('click', () => {
      this.toggleAchievements();
    });

    // Close achievements
    document.getElementById('close-achievements')?.addEventListener('click', () => {
      this.toggleAchievements();
    });

    // Settings button
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.toggleSettings();
    });

    // Close settings
    document.getElementById('close-settings')?.addEventListener('click', () => {
      this.toggleSettings();
    });

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('change', (e) => {
      this.currentTheme = e.target.checked ? 'light' : 'dark';
      this.applyTheme();
      this.saveThemeSetting();
    });

    // Auto-play toggle
    document.getElementById('autoplay-toggle')?.addEventListener('change', (e) => {
      this.autoPlayEnabled = e.target.checked;
      this.saveAutoPlaySetting();
    });

    // Classic mode toggle
    document.getElementById('toggle-classic-mode-btn')?.addEventListener('click', () => {
      this.toggleClassicMode();
    });

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const langIndex = parseInt(e.currentTarget.dataset.lang);
        this.switchLanguage(langIndex);
      });
    });

    // PIN keypad - use event delegation for better reliability
    document.addEventListener('click', (e) => {
      // PIN digit buttons
      if (e.target.closest('.pin-key[data-digit]')) {
        const digit = e.target.closest('.pin-key[data-digit]').dataset.digit;
        console.log('[PIN] Digit clicked:', digit);
        this.handlePinDigit(digit);
      }

      // PIN backspace button
      if (e.target.closest('.pin-key-backspace')) {
        console.log('[PIN] Backspace clicked');
        this.handlePinBackspace();
      }

      // PIN submit button
      if (e.target.closest('.pin-key-submit')) {
        console.log('[PIN] Submit clicked');
        this.submitPin();
      }
    });

    // PIN modal - cancel button
    document.getElementById('pin-cancel-btn')?.addEventListener('click', () => {
      this.closePinModal();
    });

    // PIN modal - forgot PIN button
    document.getElementById('pin-forgot-btn')?.addEventListener('click', () => {
      this.showForgotPinDialog();
    });

    // PIN setup modal - skip button
    document.getElementById('pin-setup-skip-btn')?.addEventListener('click', () => {
      this.handleSetupSkip();
    });

    // PIN setup modal - create PIN button
    document.getElementById('pin-setup-create-btn')?.addEventListener('click', () => {
      this.handleSetupCreate();
    });

    // Settings - change PIN button
    document.getElementById('change-pin-btn')?.addEventListener('click', () => {
      this.handleChangePinClick();
    });

    // Welcome screen - next button
    document.getElementById('welcome-next-btn')?.addEventListener('click', () => {
      this.nextWelcomeSlide();
    });

    // Welcome screen - back button
    document.getElementById('welcome-back-btn')?.addEventListener('click', () => {
      this.previousWelcomeSlide();
    });

    // Welcome screen - skip button
    document.getElementById('welcome-skip-btn')?.addEventListener('click', () => {
      this.skipWelcome();
    });

    // Welcome screen - get started button
    document.getElementById('welcome-get-started-btn')?.addEventListener('click', () => {
      this.completeWelcome();
    });

    // Welcome screen - dot indicators
    document.querySelectorAll('.welcome-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const slideIndex = parseInt(e.currentTarget.dataset.slide);
        this.goToWelcomeSlide(slideIndex);
      });
    });

    // Swipe tutorial - dismiss button
    document.getElementById('swipe-tutorial-dismiss')?.addEventListener('click', () => {
      this.dismissSwipeTutorial();
    });

    // Analytics modal - close button
    document.getElementById('close-analytics')?.addEventListener('click', () => {
      this.toggleAnalytics();
    });

    // Analytics - export button
    document.getElementById('analytics-export-btn')?.addEventListener('click', () => {
      this.exportAnalyticsData();
    });

    // Analytics - clear button
    document.getElementById('analytics-clear-btn')?.addEventListener('click', () => {
      this.clearAnalyticsData();
    });

    // Settings button - long press for analytics
    let settingsPressTimer;
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn?.addEventListener('mousedown', () => {
      settingsPressTimer = setTimeout(() => {
        this.showAnalytics();
      }, 3000);
    });
    settingsBtn?.addEventListener('mouseup', () => {
      clearTimeout(settingsPressTimer);
    });
    settingsBtn?.addEventListener('mouseleave', () => {
      clearTimeout(settingsPressTimer);
    });
    // Touch events for mobile
    settingsBtn?.addEventListener('touchstart', () => {
      settingsPressTimer = setTimeout(() => {
        this.showAnalytics();
      }, 3000);
    });
    settingsBtn?.addEventListener('touchend', () => {
      clearTimeout(settingsPressTimer);
    });

    // Swipe navigation (touch)
    this.setupSwipeNavigation();
  }

  setupSwipeNavigation() {
    const card = document.getElementById('word-card');
    const wordMain = document.querySelector('.word-main');
    let touchStartX = 0;
    let touchEndX = 0;
    let currentX = 0;
    let isSwiping = false;

    card.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      currentX = 0;
      isSwiping = false;
      wordMain.style.transition = 'none';
    });

    card.addEventListener('touchmove', (e) => {
      if (!touchStartX) return;

      currentX = e.changedTouches[0].screenX - touchStartX;
      isSwiping = Math.abs(currentX) > 10;

      if (isSwiping) {
        const progress = Math.min(Math.abs(currentX) / 200, 1);
        const opacity = 1 - (progress * 0.3);

        wordMain.style.transform = `translateX(${currentX}px)`;
        wordMain.style.opacity = opacity;
      }
    });

    card.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;

      // Reset transform
      wordMain.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      wordMain.style.transform = '';
      wordMain.style.opacity = '';

      if (isSwiping) {
        this.handleSwipe(touchStartX, touchEndX);
      }

      touchStartX = 0;
      touchEndX = 0;
      currentX = 0;
      isSwiping = false;
    });

    // Also support click on left/right sides
    card.addEventListener('click', async (e) => {
      if (isSwiping) return;

      const cardWidth = card.offsetWidth;
      const clickX = e.clientX;

      if (clickX < cardWidth * 0.3) {
        await this.previousWord();
      } else if (clickX > cardWidth * 0.7) {
        await this.nextWord();
      }
    });
  }

  setupProfileClickHandlers() {
    // Re-attach profile click handlers (fixes production timing issues)
    console.log('[PIN] Setting up profile click handlers');

    document.querySelectorAll('.profile-card').forEach(card => {
      // Clone and replace to remove old listeners
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
    });

    // Re-query and attach fresh listeners
    document.querySelectorAll('.profile-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const profileKey = e.currentTarget.dataset.profile;
        console.log('[PIN] Profile clicked:', profileKey);

        // Check if PIN is enabled for this profile
        if (this.isPinEnabled(profileKey)) {
          console.log('[PIN] Showing PIN modal for', profileKey);
          this.showPinModal(profileKey, 'verify');
        } else {
          console.log('[PIN] Showing first-time prompt for', profileKey);
          this.showFirstTimePinPrompt(profileKey);
        }
      });
    });
  }

  async handleSwipe(startX, endX) {
    const swipeThreshold = 50;
    const diff = startX - endX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next word
        await this.animateWordTransition('left', async () => await this.nextWord());
      } else {
        // Swipe right - previous word
        await this.animateWordTransition('right', async () => await this.previousWord());
      }
    }
  }

  async animateWordTransition(direction, callback) {
    const wordMain = document.querySelector('.word-main');

    // Animate out
    wordMain.classList.add(`swipe-out-${direction}`);

    setTimeout(async () => {
      // Execute word change
      await callback();

      // Remove old animation class
      wordMain.classList.remove(`swipe-out-${direction}`);

      // Animate in
      wordMain.classList.add('swipe-in');

      setTimeout(() => {
        wordMain.classList.remove('swipe-in');
      }, 400);
    }, 400);
  }

  async selectProfile(profileKey) {
    // Ensure database is ready before any profile operations
    await ensureDatabaseReady();
    console.log('✅ [SELECT_PROFILE] Database ready for profile:', profileKey);

    this.currentProfile = PROFILES[profileKey];
    this.profileKey = profileKey;
    this.progressTracker = new ProgressTracker(profileKey);
    this.achievementManager = new AchievementManager(profileKey);

    // Initialize database and load progress before starting session
    await this.progressTracker.initDatabase();

    // Pass database to PositionManager once it's initialized
    if (this.progressTracker.useDatabase && this.progressTracker.database) {
      this.positionManager.database = this.progressTracker.database;
      console.log('🔗 [PositionManager] Database connected');
    }

    // Start analytics session
    this.analyticsManager.startSession(profileKey);

    // Load word data for this profile
    await this.loadWordData();

    // Persist profile selection to localStorage for page refresh
    localStorage.setItem('lingxm-current-profile', profileKey);
    localStorage.setItem('lingxm-profile-timestamp', Date.now().toString());
    console.log('💾 [PERSIST] Profile saved to localStorage:', profileKey);

    // Show home screen with navigation cards
    this.renderHomeScreen();
  }

  /**
   * Load custom profile from database (universal profile system)
   */
  async loadCustomProfile(profileId) {
    try {
      console.log('[LOAD_CUSTOM_PROFILE] Loading profile:', profileId);

      // Ensure database is ready
      if (!this.database || !this.database.db) {
        console.log('[LOAD_CUSTOM_PROFILE] Waiting for database...');
        await this.database.init();
      }

      console.log('✅ [LOAD_CUSTOM_PROFILE] Database ready for profile ID:', profileId);

      // Import profileManager
      const { profileManager } = await import('./utils/profileManager.js');

      // Initialize ProfileManager if not already initialized
      if (!profileManager.db) {
        await profileManager.init();
      }

      // Get profile with languages (NOW WORKS WITH NUMERIC ID!)
      const profile = await profileManager.getProfile(profileId);

      console.log('[LOAD_CUSTOM_PROFILE] ProfileManager returned:', profile);

      if (!profile) {
        throw new Error(`Profile ${profileId} not found in database`);
      }

      console.log('✅ [LOAD_CUSTOM_PROFILE] Profile loaded:', profile.display_name);

      // Build learning languages array with flags
      const learningLanguages = profile.learningLanguages.map(lang => ({
        code: lang.languageCode,
        name: lang.languageName,
        level: lang.levelCode?.toUpperCase() || 'A1',
        specialty: lang.specialty,
        dailyWords: lang.dailyWords || 10,
        flag: this.getFlagForLanguage(lang.languageCode)
      }));

      // Create profile object matching PROFILES structure
      this.currentProfile = {
        name: profile.display_name,
        emoji: profile.avatar_emoji || '👤',
        interfaceLanguages: profile.interface_languages || [profile.native_language],
        learningLanguages: learningLanguages,
        totalDailyWords: learningLanguages.reduce((sum, lang) => sum + lang.dailyWords, 0)
      };

      console.log('✅ [LOAD_CUSTOM_PROFILE] Current profile set:', this.currentProfile.name);

      // Set profile key for progress tracking
      this.profileKey = profile.profile_key || `user_${profileId}`;

      // Initialize progress tracker and achievement manager
      this.progressTracker = new ProgressTracker(this.profileKey);
      this.achievementManager = new AchievementManager(this.profileKey);

      // Initialize database and load progress
      await this.progressTracker.initDatabase();

      // Pass database to PositionManager
      if (this.progressTracker.useDatabase && this.progressTracker.database) {
        this.positionManager.database = this.progressTracker.database;
        console.log('🔗 [PositionManager] Database connected');
      }

      // Start analytics session
      this.analyticsManager.startSession(this.profileKey);

      // Load word data for this profile
      await this.loadWordData();

      // Persist profile selection to localStorage
      localStorage.setItem('lingxm-active-user', profileId.toString());
      localStorage.setItem('lingxm-profile-key', this.profileKey);
      localStorage.setItem('lingxm-profile-timestamp', Date.now().toString());
      console.log('💾 [PERSIST] Custom profile saved to localStorage:', profileId);

      // Show home screen
      this.renderHomeScreen();

      console.log('✅ [LOAD_CUSTOM_PROFILE] Complete! Home screen shown.');

    } catch (error) {
      console.error('❌ [LOAD_CUSTOM_PROFILE] Error loading profile:', error);
      console.error('❌ [LOAD_CUSTOM_PROFILE] Stack:', error.stack);

      // Fallback: Show onboarding again
      alert('Error loading profile. Please try again or use Classic Mode.');
      localStorage.removeItem('lingxm-active-user');
      localStorage.removeItem('lingxm-onboarding-complete');
      window.location.reload();
    }
  }

  /**
   * Get flag emoji for language code
   */
  getFlagForLanguage(code) {
    const flags = {
      en: '🇬🇧', de: '🇩🇪', ar: '🇸🇦', pl: '🇵🇱',
      fr: '🇫🇷', fa: '🇮🇷', it: '🇮🇹', ru: '🇷🇺'
    };
    return flags[code] || '🌐';
  }

  /**
   * Return to profile selection screen
   * Clears current session but preserves all user data/progress
   */
  returnToProfileSelection() {
    console.log('🔙 [PROFILE] Returning to profile selection');

    // End current analytics session
    if (this.analyticsManager) {
      this.analyticsManager.endSession();
    }

    // Clear current profile from localStorage (prevents auto-restore)
    localStorage.removeItem('lingxm-current-profile');
    localStorage.removeItem('lingxm-profile-timestamp');
    console.log('💾 [PERSIST] Profile session cleared from localStorage');

    // Reset current profile state
    this.currentProfile = null;
    this.profileKey = null;
    this.currentLanguageIndex = 0;
    this.currentWordIndex = 0;

    // Navigate to profile selection screen
    this.showScreen('profile-selection');

    this.analyticsManager.trackEvent('profile_selection_returned');
  }

  async loadWordData() {
    console.log('[VOCAB] Starting vocabulary load for profile:', this.profileKey);
    this.wordData = {};

    for (const lang of this.currentProfile.learningLanguages) {
      const path = `/data/${this.profileKey}/${lang.code}.json`;
      console.log(`[VOCAB] Fetching: ${path}`);

      try {
        const response = await fetch(path);
        console.log(`[VOCAB] Response status: ${response.status} for ${path}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.wordData[lang.code] = await response.json();
        console.log(`[VOCAB] ✓ Loaded ${this.wordData[lang.code].length} words for ${lang.code}`);

      } catch (error) {
        console.error(`[VOCAB] ✗ FAILED to load ${path}:`, error);
        console.log(`[VOCAB] Using placeholder data for ${lang.code}`);
        this.wordData[lang.code] = this.createPlaceholderData(lang);
      }
    }

    console.log('[VOCAB] Total languages loaded:', Object.keys(this.wordData));
  }

  createPlaceholderData(lang) {
    const words = [];
    for (let i = 0; i < lang.dailyWords; i++) {
      words.push({
        word: `${lang.name} Word ${i + 1}`,
        translations: this.getTranslations(`Example word ${i + 1}`),
        explanation: this.getExplanations(`This is an example explanation for word ${i + 1}`),
        conjugations: lang.code !== 'en' ? this.getExampleConjugations() : null,
        examples: this.getExamples(i + 1)
      });
    }
    return words;
  }

  getTranslations(baseText) {
    const translations = {};
    for (const langCode of this.currentProfile.interfaceLanguages) {
      translations[langCode] = `[${langCode.toUpperCase()}] ${baseText}`;
    }
    return translations;
  }

  getExplanations(baseText) {
    const explanations = {};
    for (const langCode of this.currentProfile.interfaceLanguages) {
      explanations[langCode] = `[${langCode.toUpperCase()}] ${baseText}`;
    }
    return explanations;
  }

  getExampleConjugations() {
    return [
      { form: 'Infinitive', value: 'example' },
      { form: 'Present', value: 'examples' },
      { form: 'Past', value: 'exampled' }
    ];
  }

  getExamples(num) {
    const examples = {};
    for (const langCode of this.currentProfile.interfaceLanguages) {
      examples[langCode] = [
        `[${langCode.toUpperCase()}] Example sentence ${num}.1`,
        `[${langCode.toUpperCase()}] Example sentence ${num}.2`
      ];
    }
    return examples;
  }

  setupLanguageButtons() {
    const buttons = document.querySelectorAll('.lang-btn');
    const langs = this.currentProfile.learningLanguages;

    langs.forEach((lang, index) => {
      if (buttons[index]) {
        buttons[index].textContent = `${lang.flag} ${lang.name}`;
        buttons[index].style.display = 'block';
        buttons[index].dataset.lang = index;
      }
    });

    // Hide unused buttons
    for (let i = langs.length; i < buttons.length; i++) {
      buttons[i].style.display = 'none';
    }

    // Set first as active
    buttons[0]?.classList.add('active');
  }

  async switchLanguage(langIndex) {
    if (langIndex >= this.currentProfile.learningLanguages.length) return;

    const lang = this.currentProfile.learningLanguages[langIndex];

    this.currentLanguageIndex = langIndex;
    this.currentWordIndex = 0;

    // CRITICAL: Save position IMMEDIATELY when switching languages
    this.positionManager.saveImmediately(
      this.profileKey,
      lang.code,
      this.currentWordIndex
    );
    console.log('🌐 [Language Switch] Position saved for', lang.code);

    // Update active button
    document.querySelectorAll('.lang-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === langIndex);
    });

    await this.displayCurrentWord();
    this.showProgressBar();

    // Track analytics
    this.analyticsManager.trackEvent('language_switched', {
      language: lang.code,
      languageName: lang.name
    });
  }

  async displayCurrentWord() {
    const lang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
    const words = this.wordData[lang.code];

    if (!words || words.length === 0) {
      this.showError('No words available');
      return;
    }

    const word = words[this.currentWordIndex];
    const primaryLang = this.currentProfile.interfaceLanguages[0];
    const secondaryLang = this.currentProfile.interfaceLanguages[1];

    // Track word viewed in analytics
    this.analyticsManager.trackEvent('word_viewed', {
      language: lang.code,
      wordIndex: this.currentWordIndex,
      word: word.word
    });

    // Update section headers based on profile interface languages
    this.updateSectionHeaders(primaryLang, secondaryLang);

    // Record study session
    if (this.progressTracker) {
      this.progressTracker.recordStudySession(lang.code, 1);
      // Note: Word completion is tracked via mastery levels (incrementMastery)
      // not by simple viewing. This prevents inflating the completed count.
    }

    // Check for halfway achievement (50% completion)
    // DISABLED: Halfway achievement popup removed
    // this.checkHalfwayAchievement(lang.code, words.length);

    // Update header
    const levelText = lang.specialty ? `${lang.level} - ${lang.specialty}` : lang.level;
    document.getElementById('current-lang').textContent = `${this.currentProfile.emoji} ${this.currentProfile.name} • ${lang.flag} ${lang.name} ${levelText}`;

    // Update word display with speaker button
    document.getElementById('word-text').innerHTML = `
      ${word.word}
      <button class="speaker-btn main-word-speaker" data-text="${word.word}" data-lang="${lang.code}">
        🔊
      </button>
    `;

    // Show translations in BOTH interface languages with speaker buttons
    const translationHTML = `
      <div>
        ${word.translations[primaryLang]}
        <button class="speaker-btn" data-text="${word.translations[primaryLang]}" data-lang="${primaryLang}">
          🔊
        </button>
      </div>
      <div style="margin-top: 0.5rem; opacity: 0.8;">
        ${word.translations[secondaryLang]}
        <button class="speaker-btn" data-text="${word.translations[secondaryLang]}" data-lang="${secondaryLang}">
          🔊
        </button>
      </div>
    `;
    document.getElementById('word-translation').innerHTML = translationHTML;

    // Show explanations in BOTH interface languages
    const explanationHTML = `
      <div style="margin-bottom: 1rem;">
        <strong>${LANGUAGE_NAMES[primaryLang].native}:</strong><br>
        ${word.explanation[primaryLang]}
      </div>
      <div>
        <strong>${LANGUAGE_NAMES[secondaryLang].native}:</strong><br>
        ${word.explanation[secondaryLang]}
      </div>
    `;
    document.getElementById('word-explanation').innerHTML = explanationHTML;

    // Show conjugations if available
    const conjugationSection = document.getElementById('conjugation-section');
    if (word.conjugations) {
      conjugationSection.style.display = 'block';
      const conjugationsHTML = word.conjugations.map(conj => `
        <div class="conjugation-item">
          <span class="conjugation-label">${conj.form}:</span>
          <span>${conj.value}</span>
        </div>
      `).join('');
      document.getElementById('word-conjugations').innerHTML = conjugationsHTML;
    } else {
      conjugationSection.style.display = 'none';
    }

    // Show examples in BOTH languages (NO speaker buttons for sentences)
    document.getElementById('example-1').innerHTML = `
      <div>
        ${word.examples[primaryLang][0]}
      </div>
      <div style="margin-top: 0.5rem; opacity: 0.8; font-size: 0.9rem;">
        ${word.examples[secondaryLang][0]}
      </div>
    `;

    document.getElementById('example-2').innerHTML = `
      <div>
        ${word.examples[primaryLang][1]}
      </div>
      <div style="margin-top: 0.5rem; opacity: 0.8; font-size: 0.9rem;">
        ${word.examples[secondaryLang][1]}
      </div>
    `;

    // Add event listeners to all speaker buttons
    this.attachSpeakerListeners();

    // Auto-play if enabled (iOS needs longer delay for voice loading)
    if (this.autoPlayEnabled) {
      setTimeout(() => {
        // Check if voices are loaded, retry if not
        if (!this.speechManager.isAvailable()) {
          console.log('Voices not ready, retrying in 1s...');
          setTimeout(() => this.attemptAutoPlay(), 1000);
        } else {
          this.attemptAutoPlay();
        }
      }, 1000);
    }

    // Update save button
    await this.updateSaveButton();
    this.showProgressBar();

    // Update mastery display and increment review count
    this.updateMasteryDisplay();
    this.incrementMastery();
  }

  showProgressBar() {
    if (!this.progressTracker) return;

    const stats = this.progressTracker.getStats();

    // Update progress info in header - only show streak badge
    const progressInfo = document.querySelector('.progress-info');
    const streakBadge = progressInfo.querySelector('.streak-badge') || document.createElement('div');
    streakBadge.className = 'streak-badge';
    streakBadge.innerHTML = `🔥 ${stats.currentStreak}`;

    if (!progressInfo.querySelector('.streak-badge')) {
      progressInfo.appendChild(streakBadge);
    }

    // Progress bar removed - word counter is sufficient
  }

  showProgressStats() {
    if (!this.progressTracker) return;

    const stats = this.progressTracker.getStats();
    alert(`
📊 Your Progress:
🔥 Current Streak: ${stats.currentStreak} days
🏆 Longest Streak: ${stats.longestStreak} days
📚 Total Words: ${stats.totalWordsStudied}
📅 Study Days: ${stats.totalDaysStudied}
    `);
  }

  async nextWord() {
    const lang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
    const words = this.wordData[lang.code];

    if (this.currentWordIndex < words.length - 1) {
      this.currentWordIndex++;

      // SAVE POSITION (debounced for rapid navigation)
      this.positionManager.saveDebounced(
        this.profileKey,
        lang.code,
        this.currentWordIndex
      );

      await this.displayCurrentWord();
    }
  }

  async previousWord() {
    if (this.currentWordIndex > 0) {
      this.currentWordIndex--;

      // SAVE POSITION (debounced for rapid navigation)
      const lang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
      this.positionManager.saveDebounced(
        this.profileKey,
        lang.code,
        this.currentWordIndex
      );

      await this.displayCurrentWord();
    }
  }

  // NOTE: saveCurrentPosition() and loadLastPosition() have been replaced by PositionManager
  // All position management is now handled by src/utils/positionManager.js

  async toggleSaveWord() {
    const lang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
    const word = this.wordData[lang.code][this.currentWordIndex];
    const key = `${this.profileKey}-${lang.code}-${this.currentWordIndex}`;

    const wasSaved = this.savedWords.has(key);

    // Update database if available
    if (this.progressTracker?.useDatabase && this.progressTracker?.userId) {
      try {
        const { dbManager } = await import('./utils/database.js');
        const isSaved = dbManager.isWordSaved(
          this.progressTracker.userId,
          lang.code,
          this.currentWordIndex
        );

        if (isSaved) {
          dbManager.unsaveWord(
            this.progressTracker.userId,
            lang.code,
            this.currentWordIndex
          );
        } else {
          dbManager.saveWord(
            this.progressTracker.userId,
            lang.code,
            word.word,
            this.currentWordIndex,
            ''
          );
        }
      } catch (error) {
        console.error('[SavedWords] Database operation failed:', error);
      }
    }

    // Always update localStorage as backup
    if (this.savedWords.has(key)) {
      this.savedWords.delete(key);
    } else {
      this.savedWords.add(key);
    }

    this.saveSavedWords();
    this.updateSaveButton().catch(err => console.error('[App] updateSaveButton failed:', err));

    // Track analytics
    this.analyticsManager.trackEvent(wasSaved ? 'word_unsaved' : 'word_saved', {
      language: lang.code,
      wordIndex: this.currentWordIndex,
      word: word.word
    });
    this.analyticsManager.trackEvent('feature_used', { feature: 'saved_words' });
  }

  async updateSaveButton() {
    const lang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
    const key = `${this.profileKey}-${lang.code}-${this.currentWordIndex}`;
    const btn = document.getElementById('save-word-btn');

    let isSaved = this.savedWords.has(key);

    // Ensure database is ready before checking
    await ensureDatabaseReady();

    // Check database if available (takes priority)
    if (this.progressTracker?.useDatabase && this.progressTracker?.userId) {
      try {
        const { dbManager } = await import('./utils/database.js');
        // CRITICAL FIX: Await the database call
        isSaved = await dbManager.isWordSaved(
          this.progressTracker.userId,
          lang.code,
          this.currentWordIndex
        );
      } catch (error) {
        // Fallback to localStorage
        console.error('[SavedWords] Failed to check database:', error);
      }
    }

    btn.textContent = isSaved ? '★' : '☆';
  }

  loadSavedWords() {
    const saved = localStorage.getItem('lingxm-saved-words');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  }

  saveSavedWords() {
    localStorage.setItem('lingxm-saved-words',
      JSON.stringify([...this.savedWords]));
  }

  showScreen(screenId) {
    // Remove active from all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Add active to target screen with error handling
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
      console.log(`✅ [SCREEN] Showing: ${screenId}`);
    } else {
      console.error(`❌ [SCREEN] Element not found: ${screenId}`);
      return;
    }

    // CRITICAL FIX: Add class to body for profile-selection scroll (fallback for :has())
    if (screenId === 'profile-selection') {
      document.body.classList.add('profile-selection-active');
      document.getElementById('app').classList.add('profile-selection-active');

      // Re-attach profile button handlers when showing profile selection screen
      // This ensures handlers work reliably in production
      this.setupProfileClickHandlers();
    } else {
      document.body.classList.remove('profile-selection-active');
      document.getElementById('app').classList.remove('profile-selection-active');
    }
  }

  showError(message) {
    document.getElementById('word-text').textContent = 'Error';
    document.getElementById('word-translation').textContent = message;
  }

  // Speech-related methods
  attachSpeakerListeners() {
    document.querySelectorAll('.speaker-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.speakText(btn);
      });
    });
  }

  async speakText(buttonElement) {
    const text = buttonElement.dataset.text;
    const lang = buttonElement.dataset.lang;

    if (text && lang) {
      await this.speechManager.speakWithFeedback(text, lang, buttonElement);
    }
  }

  attemptAutoPlay() {
    if (this.speechManager.isAvailable()) {
      const mainSpeaker = document.querySelector('.main-word-speaker');
      if (mainSpeaker) {
        this.speakText(mainSpeaker);
      }
    } else {
      console.warn('Auto-play failed: No voices available');
    }
  }

  toggleSettings() {
    console.log('⚙️ [SETTINGS] toggleSettings() called');
    const modal = document.getElementById('settings-modal');

    if (!modal) {
      console.error('❌ [SETTINGS] Modal element not found!');
      return;
    }

    const isOpening = !modal.classList.contains('active');
    modal.classList.toggle('active');
    console.log(`⚙️ [SETTINGS] Modal ${isOpening ? 'opening' : 'closing'}`);

    // Track analytics when opening
    if (isOpening) {
      this.analyticsManager.trackEvent('feature_used', { feature: 'settings' });
    }

    // Update UI with current settings
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.checked = this.currentTheme === 'light';
    }

    const autoPlayToggle = document.getElementById('autoplay-toggle');
    if (autoPlayToggle) {
      autoPlayToggle.checked = this.autoPlayEnabled;
    }

    // Show PIN setting only when logged into a profile
    const pinSettingItem = document.getElementById('pin-setting-item');
    if (pinSettingItem) {
      if (this.currentProfile && this.profileKey) {
        pinSettingItem.style.display = 'flex';
        // Update button text based on whether PIN is enabled
        const changePinBtn = document.getElementById('change-pin-btn');
        if (changePinBtn) {
          changePinBtn.textContent = this.isPinEnabled(this.profileKey) ? 'Change PIN' : 'Set PIN';
        }
      } else {
        pinSettingItem.style.display = 'none';
      }
    }

    // Update classic mode button
    const classicModeSetting = document.getElementById('classic-mode-setting');
    const classicModeBtn = document.getElementById('toggle-classic-mode-btn');
    if (classicModeSetting && classicModeBtn) {
      const isClassicMode = localStorage.getItem('lingxm-classic-mode') === 'true';
      classicModeSetting.style.display = 'flex';
      classicModeBtn.textContent = isClassicMode ? 'Exit Classic Mode' : 'Enter Classic Mode';
    }
  }

  toggleClassicMode() {
    const isClassicMode = localStorage.getItem('lingxm-classic-mode') === 'true';

    if (isClassicMode) {
      // Exit classic mode
      localStorage.removeItem('lingxm-classic-mode');
      localStorage.removeItem('lingxm-current-profile');
      this.analyticsManager.trackEvent('classic_mode_toggled', { enabled: false });
    } else {
      // Enter classic mode
      localStorage.setItem('lingxm-classic-mode', 'true');
      localStorage.removeItem('lingxm-active-user');
      localStorage.removeItem('lingxm-profile-key');
      this.analyticsManager.trackEvent('classic_mode_toggled', { enabled: true });
    }

    // Show confirmation and reload
    const message = isClassicMode
      ? 'Classic mode disabled. The page will reload to show universal onboarding.'
      : 'Classic mode enabled. The page will reload to show classic profiles.';

    alert(message);
    window.location.reload();
  }

  toggleAutoPlay() {
    this.autoPlayEnabled = !this.autoPlayEnabled;
    this.saveAutoPlaySetting();
    console.log(`Auto-play ${this.autoPlayEnabled ? 'enabled' : 'disabled'}`);
  }

  loadAutoPlaySetting() {
    const saved = localStorage.getItem('lingxm-autoplay');
    return saved === 'true';
  }

  saveAutoPlaySetting() {
    localStorage.setItem('lingxm-autoplay', this.autoPlayEnabled.toString());
  }

  loadThemeSetting() {
    const saved = localStorage.getItem('lingxm-theme');
    return saved || 'dark';
  }

  saveThemeSetting() {
    localStorage.setItem('lingxm-theme', this.currentTheme);
  }

  applyTheme() {
    document.documentElement.dataset.theme = this.currentTheme;
  }

  updateSectionHeaders(primaryLang, secondaryLang) {
    // Update section headers based on profile interface languages
    document.getElementById('explanation-header').textContent =
      `${SECTION_LABELS.explanation[primaryLang]} / ${SECTION_LABELS.explanation[secondaryLang]}`;
    document.getElementById('conjugation-header').textContent =
      `${SECTION_LABELS.conjugation[primaryLang]} / ${SECTION_LABELS.conjugation[secondaryLang]}`;
    document.getElementById('example1-header').textContent =
      `${SECTION_LABELS.example1[primaryLang]} / ${SECTION_LABELS.example1[secondaryLang]}`;
    document.getElementById('example2-header').textContent =
      `${SECTION_LABELS.example2[primaryLang]} / ${SECTION_LABELS.example2[secondaryLang]}`;
  }

  checkHalfwayAchievement(langCode, totalWords) {
    if (!this.progressTracker) return;

    const completedCount = this.progressTracker.getCompletedCount(langCode);
    const halfwayPoint = Math.floor(totalWords / 2);

    // Check if user just reached exactly 50% (halfway point)
    // Use localStorage to track if we've already shown this achievement
    const achievementKey = `lingxm-halfway-${this.profileKey}-${langCode}`;
    const hasShownAchievement = localStorage.getItem(achievementKey);

    if (completedCount === halfwayPoint && !hasShownAchievement) {
      this.showHalfwayPopup();
      localStorage.setItem(achievementKey, 'true');
    }
  }

  showHalfwayPopup() {
    // Create popup overlay
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">🎉</div>
        <h2>Congratulations!</h2>
        <p>You've completed half the vocabulary!</p>
        <p class="achievement-contact">Contact Herr Hassan to generate more words.</p>
        <button class="achievement-btn" id="close-achievement">Continue</button>
      </div>
    `;

    document.body.appendChild(popup);

    // Close popup on button click
    document.getElementById('close-achievement').addEventListener('click', () => {
      popup.remove();
    });

    // Auto-remove after animation
    setTimeout(() => {
      popup.classList.add('show');
    }, 100);
  }

  // ============================================
  // PIN Authentication System
  // ============================================

  async hashPin(pin) {
    // Use Web Crypto API to hash PIN with SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  isPinEnabled(profileKey) {
    return localStorage.getItem(`lingxm-pin-enabled-${profileKey}`) === 'true';
  }

  async getPinHash(profileKey) {
    return localStorage.getItem(`lingxm-pin-${profileKey}`);
  }

  async setPinForProfile(profileKey, pin) {
    const hash = await this.hashPin(pin);
    localStorage.setItem(`lingxm-pin-${profileKey}`, hash);
    localStorage.setItem(`lingxm-pin-enabled-${profileKey}`, 'true');
    this.updateProfileLockIcons();
  }

  async disablePinForProfile(profileKey) {
    localStorage.removeItem(`lingxm-pin-${profileKey}`);
    localStorage.removeItem(`lingxm-pin-enabled-${profileKey}`);
    localStorage.removeItem(`lingxm-pin-attempts-${profileKey}`);
    this.updateProfileLockIcons();
  }

  async verifyPin(profileKey, pin) {
    const storedHash = await this.getPinHash(profileKey);
    const enteredHash = await this.hashPin(pin);
    return storedHash === enteredHash;
  }

  resetPinAttempts(profileKey) {
    localStorage.removeItem(`lingxm-pin-attempts-${profileKey}`);
  }

  updateProfileLockIcons() {
    document.querySelectorAll('.profile-card').forEach(card => {
      const profileKey = card.dataset.profile;
      if (this.isPinEnabled(profileKey)) {
        card.classList.add('pin-protected');
      } else {
        card.classList.remove('pin-protected');
      }
    });
  }

  async updateProfileProgressRings() {
    // Ensure database is ready before calculating progress
    await ensureDatabaseReady();
    console.log('[PROFILE] Updating progress rings for all profiles');

    const cards = document.querySelectorAll('.profile-card');

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const profileKey = card.dataset.profile;
      const profile = PROFILES[profileKey];

      if (!profile) continue;

      // Create temporary progress tracker to get stats
      const tempTracker = new ProgressTracker(profileKey);
      await tempTracker.initDatabase();
      const stats = tempTracker.getStats();

      // Calculate aggregate progress across all languages
      let totalWords = 0;
      let masteredWords = 0;

      for (const lang of profile.learningLanguages) {
        // Estimate: assume each language has roughly equal words
        // In production, you'd load actual word counts
        totalWords += lang.dailyWords * 18; // Rough estimate
        masteredWords += tempTracker.getCompletedCount(lang.code);
      }

      const percentage = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
      console.log(`[PROFILE] ${profileKey}: ${percentage}% (${masteredWords}/${totalWords} words)`);

      // Animate progress ring
      this.animateProgressRing(card, percentage, i * 100);

      // Render language flags
      this.renderLanguageFlags(card, profile.learningLanguages);

      // Update streak badge
      this.updateStreakBadge(card, stats.currentStreak);
    }
  }

  animateProgressRing(card, percentage, delay = 0) {
    const profileKey = card.dataset.profile;
    console.log(`[ANIM] ⚠️ Starting animation for ${profileKey}, ${percentage}%`);

    const circle = card.querySelector('.progress-ring-circle');
    const wrapper = card.querySelector('.profile-progress-wrapper');
    const svg = card.querySelector('.progress-ring');

    if (!circle) {
      console.error(`[ANIM] ❌ Circle not found for ${profileKey}`);
      return;
    }
    if (!wrapper) {
      console.error(`[ANIM] ❌ Wrapper not found for ${profileKey}`);
      return;
    }
    if (!svg) {
      console.error(`[ANIM] ❌ SVG not found for ${profileKey}`);
      return;
    }

    console.log(`[ANIM] ✅ All elements found for ${profileKey}`);

    // Force visibility with inline styles
    wrapper.style.display = 'flex';
    wrapper.style.visibility = 'visible';
    wrapper.style.opacity = '1';
    svg.style.display = 'block';
    svg.style.visibility = 'visible';
    console.log(`[ANIM] ✅ Forced visibility for ${profileKey} wrapper and SVG`);

    // Set CSS variable for percentage
    card.style.setProperty('--progress-percentage', percentage);

    // Set data attribute for reference
    circle.setAttribute('data-percentage', percentage);

    // Trigger animation after delay
    setTimeout(() => {
      card.classList.add('visible');
      console.log(`[ANIM] ✅ Progress ring animated for ${profileKey}: ${percentage}%`);
    }, delay);
  }

  renderLanguageFlags(card, languages) {
    const profileKey = card.dataset.profile;
    console.log(`[FLAGS] ⚠️ Starting render for ${profileKey}, languages:`, languages);

    const container = card.querySelector('.language-indicators');
    if (!container) {
      console.error(`[FLAGS] ❌ Container not found for ${profileKey}`);
      return;
    }
    console.log(`[FLAGS] ✅ Container found for ${profileKey}`);
    console.log(`[FLAGS] Container innerHTML BEFORE:`, container.innerHTML);

    const flagMap = {
      'de': '🇩🇪',
      'en': '🇬🇧',
      'ar': '🇸🇦',
      'fr': '🇫🇷',
      'it': '🇮🇹',
      'pl': '🇵🇱',
      'fa': '🇮🇷'
    };

    const maxVisible = 3;
    const visibleLangs = languages.slice(0, maxVisible);
    const remainingCount = languages.length - maxVisible;

    let html = visibleLangs
      .map(lang => {
        const flag = flagMap[lang.code] || '🌐';
        const title = `${lang.name} ${lang.level}`;
        return `<span class="lang-flag" title="${title}">${flag}</span>`;
      })
      .join('');

    if (remainingCount > 0) {
      html += `<span class="lang-more" title="${remainingCount} more language${remainingCount > 1 ? 's' : ''}">+${remainingCount}</span>`;
    }

    console.log(`[FLAGS] Generated HTML:`, html);
    container.innerHTML = html;
    console.log(`[FLAGS] Container innerHTML AFTER:`, container.innerHTML);

    // Force visibility with inline styles
    container.style.display = 'flex';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    console.log(`[FLAGS] ✅ Forced container visible for ${profileKey}`);
    console.log(`[FLAGS] ✅ Rendered ${visibleLangs.length} flags for ${profileKey}`);
  }

  updateStreakBadge(card, streakDays) {
    const profileKey = card.dataset.profile;
    console.log(`[STREAK] ⚠️ Updating badge for ${profileKey}, streak: ${streakDays} days`);

    const badge = card.querySelector('.profile-streak');
    if (!badge) {
      console.error(`[STREAK] ❌ Badge not found for ${profileKey}`);
      return;
    }
    console.log(`[STREAK] ✅ Badge found for ${profileKey}`);

    // Always show badge (for debugging visibility)
    if (streakDays > 0) {
      badge.textContent = `🔥 ${streakDays} day${streakDays !== 1 ? 's' : ''}`;
      badge.classList.add('active');
    } else {
      badge.textContent = `🔥 Just started!`;
      badge.classList.remove('active');
    }

    // Force visibility with inline styles
    badge.style.display = 'inline-block';
    badge.style.visibility = 'visible';
    badge.style.opacity = '1';

    console.log(`[STREAK] ✅ Badge visible for ${profileKey}: "${badge.textContent}"`);
  }

  showPinModal(profileKey, mode = 'verify') {
    this.currentPinProfile = profileKey;
    this.pinMode = mode;
    this.currentPin = '';
    this.pinAttempts = parseInt(localStorage.getItem(`lingxm-pin-attempts-${profileKey}`) || '0');

    const modal = document.getElementById('pin-modal');
    const profile = PROFILES[profileKey];

    // Update UI
    document.getElementById('pin-profile-emoji').textContent = profile.emoji;
    document.getElementById('pin-profile-name').textContent = profile.name;

    if (mode === 'verify') {
      document.getElementById('pin-modal-title').textContent = '🔒 Enter PIN';
      document.getElementById('pin-message').textContent = '';
      document.getElementById('pin-message').style.color = '';
    } else if (mode === 'create') {
      document.getElementById('pin-modal-title').textContent = '🔐 Create PIN';
      document.getElementById('pin-message').textContent = 'Enter a 4-digit PIN';
      document.getElementById('pin-message').style.color = '';
    }

    // Show forgot PIN after 3 attempts
    if (this.pinAttempts >= 3) {
      document.getElementById('pin-forgot-btn').style.display = 'block';
    } else {
      document.getElementById('pin-forgot-btn').style.display = 'none';
    }

    modal.classList.add('active');
    this.clearPinDots();
  }

  closePinModal() {
    const modal = document.getElementById('pin-modal');
    modal.classList.remove('active');
    this.currentPin = '';
    this.clearPinDots();
  }

  clearPinDots() {
    document.querySelectorAll('.pin-dot').forEach(dot => {
      dot.classList.remove('filled');
    });
  }

  updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
      if (index < this.currentPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  handlePinDigit(digit) {
    if (this.currentPin.length < 4) {
      this.currentPin += digit;
      this.updatePinDots();

      // Auto-submit when 4 digits entered
      if (this.currentPin.length === 4) {
        setTimeout(() => this.submitPin(), 300);
      }
    }
  }

  handlePinBackspace() {
    if (this.currentPin.length > 0) {
      this.currentPin = this.currentPin.slice(0, -1);
      this.updatePinDots();
    }
  }

  async submitPin() {
    if (this.currentPin.length !== 4) return;

    if (this.pinMode === 'verify') {
      const isValid = await this.verifyPin(this.currentPinProfile, this.currentPin);

      if (isValid) {
        // Success animation
        const pinContent = document.querySelector('.pin-content');
        pinContent.classList.add('success');
        this.resetPinAttempts(this.currentPinProfile);

        setTimeout(() => {
          this.closePinModal();
          pinContent.classList.remove('success');
          this.selectProfile(this.currentPinProfile);
        }, 500);
      } else {
        // Wrong PIN
        this.pinAttempts++;
        localStorage.setItem(`lingxm-pin-attempts-${this.currentPinProfile}`, this.pinAttempts.toString());

        const pinContent = document.querySelector('.pin-content');
        pinContent.classList.add('shake');
        document.getElementById('pin-message').textContent = '❌ Wrong PIN, try again';
        document.getElementById('pin-message').style.color = 'var(--color-danger)';

        setTimeout(() => {
          pinContent.classList.remove('shake');
          this.currentPin = '';
          this.clearPinDots();
        }, 500);

        if (this.pinAttempts >= 3) {
          document.getElementById('pin-forgot-btn').style.display = 'block';
        }
      }
    } else if (this.pinMode === 'create') {
      // First entry - ask for confirmation
      this.tempPin = this.currentPin;
      this.pinMode = 'confirm';
      document.getElementById('pin-modal-title').textContent = 'Confirm PIN';
      document.getElementById('pin-message').textContent = 'Enter PIN again to confirm';
      this.currentPin = '';
      this.clearPinDots();
    } else if (this.pinMode === 'confirm') {
      if (this.currentPin === this.tempPin) {
        // PINs match - save
        await this.setPinForProfile(this.currentPinProfile, this.currentPin);
        const pinContent = document.querySelector('.pin-content');
        pinContent.classList.add('success');
        document.getElementById('pin-message').textContent = '✓ PIN created successfully!';
        document.getElementById('pin-message').style.color = 'var(--color-success)';

        setTimeout(() => {
          this.closePinModal();
          pinContent.classList.remove('success');
          this.selectProfile(this.currentPinProfile);
        }, 600);
      } else {
        // PINs don't match
        const pinContent = document.querySelector('.pin-content');
        pinContent.classList.add('shake');
        document.getElementById('pin-message').textContent = '❌ PINs don\'t match, try again';
        document.getElementById('pin-message').style.color = 'var(--color-danger)';

        setTimeout(() => {
          pinContent.classList.remove('shake');
          this.pinMode = 'create';
          this.currentPin = '';
          this.clearPinDots();
          document.getElementById('pin-modal-title').textContent = 'Create PIN';
          document.getElementById('pin-message').textContent = 'Enter a 4-digit PIN';
          document.getElementById('pin-message').style.color = '';
        }, 500);
      }
    }
  }

  showFirstTimePinPrompt(profileKey) {
    // Check if user has been prompted before
    const hasBeenPrompted = localStorage.getItem(`lingxm-pin-prompted-${profileKey}`);

    if (hasBeenPrompted) {
      // User previously skipped - just login
      this.selectProfile(profileKey);
    } else {
      // First time - show setup prompt
      this.showSetupPinPrompt(profileKey);
    }
  }

  showSetupPinPrompt(profileKey) {
    const modal = document.getElementById('pin-setup-modal');
    const profile = PROFILES[profileKey];
    this.currentPinProfile = profileKey;

    // Update UI
    document.getElementById('pin-setup-emoji').textContent = profile.emoji;
    document.getElementById('pin-setup-name').textContent = profile.name;

    modal.classList.add('active');
  }

  closeSetupPinModal() {
    const modal = document.getElementById('pin-setup-modal');
    modal.classList.remove('active');
  }

  handleSetupSkip() {
    // Mark as prompted and login
    localStorage.setItem(`lingxm-pin-prompted-${this.currentPinProfile}`, 'true');
    this.closeSetupPinModal();
    this.selectProfile(this.currentPinProfile);
  }

  handleSetupCreate() {
    // Close setup modal and show PIN creation modal
    this.closeSetupPinModal();
    localStorage.setItem(`lingxm-pin-prompted-${this.currentPinProfile}`, 'true');
    this.showPinModal(this.currentPinProfile, 'create');
  }

  showForgotPinDialog() {
    if (confirm('Reset PIN? This will remove PIN protection for this profile.\n\nYou can set a new PIN later from Settings.')) {
      this.disablePinForProfile(this.currentPinProfile);
      this.closePinModal();
      this.selectProfile(this.currentPinProfile);
    }
  }

  handleChangePinClick() {
    if (this.currentProfile && this.profileKey) {
      this.toggleSettings();
      setTimeout(() => {
        this.showPinModal(this.profileKey, 'create');
      }, 300);
    }
  }

  // ============================================
  // Mastery System
  // ============================================

  async updateMasteryDisplay() {
    if (!this.progressTracker || !this.currentProfile) return;

    const lang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
    const masteryData = await this.progressTracker.getWordMastery(lang.code, this.currentWordIndex);

    if (!masteryData) return;

    const level = masteryData.level;
    const indicator = document.getElementById('mastery-indicator');
    const stars = document.querySelectorAll('.mastery-stars .star');
    const label = document.getElementById('mastery-label');

    // Update stars
    stars.forEach((star, index) => {
      if (index < level) {
        star.classList.add('filled');
      } else {
        star.classList.remove('filled');
      }
    });

    // Update label and level class
    indicator.className = `mastery-indicator level-${level}`;
    const labels = ['New', 'Seen', 'Learning', 'Familiar', 'Strong', 'Mastered'];
    label.textContent = labels[level] || 'New';
  }

  async incrementMastery() {
    if (!this.progressTracker || !this.currentProfile) return;

    const lang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
    const result = await this.progressTracker.incrementWordReview(lang.code, this.currentWordIndex);

    // Only show popup on exactly the 5th view of a word (reviewCount === 5)
    // This shows encouragement after 5 reviews, then never again for that word
    // DISABLED: Mastery level-up popup removed
    // if (result && result.reviewCount === 5) {
    //   this.showMasteryLevelUp(result.newLevel);
    // }
  }

  showMasteryLevelUp(newLevel) {
    const labels = ['New', 'Seen', 'Learning', 'Familiar', 'Strong', 'Mastered'];
    const emojis = ['🌱', '👀', '📚', '✨', '💪', '🏆'];

    const popup = document.createElement('div');
    popup.className = 'achievement-popup show';
    popup.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${emojis[newLevel] || '⭐'}</div>
        <h2>Level Up!</h2>
        <p>${labels[newLevel] || 'Progress'}  Level</p>
        <p class="achievement-contact">Keep practicing to master this word!</p>
        <button class="achievement-btn" onclick="this.closest('.achievement-popup').remove()">
          Continue
        </button>
      </div>
    `;
    document.body.appendChild(popup);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      popup.remove();
    }, 4000);
  }

  // ============================================
  // Achievement System
  // ============================================

  toggleAchievements() {
    console.log('🏆 [ACHIEVEMENTS] toggleAchievements() called');
    const modal = document.getElementById('achievements-modal');

    if (!modal) {
      console.error('❌ [ACHIEVEMENTS] Modal element not found!');
      return;
    }

    const isActive = modal.classList.contains('active');
    console.log(`🏆 [ACHIEVEMENTS] Modal ${isActive ? 'closing' : 'opening'}`);

    if (isActive) {
      modal.classList.remove('active');
    } else {
      modal.classList.add('active');
      this.populateAchievements();
      // Track analytics when opening
      this.analyticsManager.trackEvent('feature_used', { feature: 'achievements' });
    }
  }

  populateAchievements() {
    if (!this.achievementManager) return;

    const stats = this.progressTracker.getStats();

    // Update progress to next badge
    const progress = this.achievementManager.getProgress(stats);
    if (progress) {
      document.querySelector('.next-badge-icon').textContent = progress.nextBadge.icon;
      document.querySelector('.next-badge-name').textContent = progress.nextBadge.name;
      document.querySelector('.progress-bar-fill').style.width = `${progress.percentage}%`;
      document.querySelector('.progress-bar-text').textContent = `${progress.current} / ${progress.target}`;
    }

    // Populate word badges
    const wordBadgesGrid = document.getElementById('word-badges-grid');
    wordBadgesGrid.innerHTML = '';
    const wordBadges = this.achievementManager.getByCategory('words');
    wordBadges.forEach(badge => {
      const isEarned = this.achievementManager.data.earned.includes(badge.id);
      const badgeEl = this.createBadgeElement(badge, isEarned);
      wordBadgesGrid.appendChild(badgeEl);
    });

    // Populate streak badges
    const streakBadgesGrid = document.getElementById('streak-badges-grid');
    streakBadgesGrid.innerHTML = '';
    const streakBadges = this.achievementManager.getByCategory('streaks');
    streakBadges.forEach(badge => {
      const isEarned = this.achievementManager.data.earned.includes(badge.id);
      const badgeEl = this.createBadgeElement(badge, isEarned);
      streakBadgesGrid.appendChild(badgeEl);
    });

    // Mark all unread as seen
    this.achievementManager.getUnread().forEach(id => {
      this.achievementManager.markAsSeen(id);
    });
    this.updateAchievementBadge();
  }

  createBadgeElement(badge, isEarned) {
    const div = document.createElement('div');
    div.className = `badge-item ${isEarned ? 'earned' : 'locked'}`;
    div.innerHTML = `
      <span class="badge-icon">${badge.icon}</span>
      <p class="badge-name">${badge.name}</p>
      <p class="badge-description">${badge.description}</p>
    `;
    return div;
  }

  checkNewAchievements() {
    if (!this.achievementManager || !this.progressTracker) return;

    const stats = this.progressTracker.getStats();
    const newAchievements = this.achievementManager.checkAchievements(stats);

    if (newAchievements.length > 0) {
      // Track each new achievement
      newAchievements.forEach(achievement => {
        this.analyticsManager.trackEvent('achievement_unlocked', {
          achievementId: achievement.id,
          achievementName: achievement.name,
          category: achievement.category
        });
      });

      // Show celebration for the first new achievement
      // DISABLED: Achievement celebration popup removed
      // this.showAchievementCelebration(newAchievements[0]);
      this.updateAchievementBadge();
    }
  }

  showAchievementCelebration(achievement) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup show';
    popup.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${achievement.icon}</div>
        <h2>Achievement Unlocked!</h2>
        <p>${achievement.name}</p>
        <p class="achievement-contact">${achievement.description}</p>
        <button class="achievement-btn" onclick="this.closest('.achievement-popup').remove()">
          Awesome!
        </button>
      </div>
    `;
    document.body.appendChild(popup);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      popup.remove();
    }, 5000);
  }

  updateAchievementBadge() {
    if (!this.achievementManager) return;

    const unreadCount = this.achievementManager.getUnread().length;
    const badge = document.getElementById('achievement-badge');

    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // ============================================
  // Welcome Screen
  // ============================================

  nextWelcomeSlide() {
    if (this.currentWelcomeSlide < 2) {
      this.currentWelcomeSlide++;
      this.updateWelcomeSlides();
      this.analyticsManager.trackEvent('welcome_slide_next', { slide: this.currentWelcomeSlide });
    }
  }

  previousWelcomeSlide() {
    if (this.currentWelcomeSlide > 0) {
      this.currentWelcomeSlide--;
      this.updateWelcomeSlides();
      this.analyticsManager.trackEvent('welcome_slide_back', { slide: this.currentWelcomeSlide });
    }
  }

  goToWelcomeSlide(slideIndex) {
    this.currentWelcomeSlide = slideIndex;
    this.updateWelcomeSlides();
  }

  updateWelcomeSlides() {
    // Update slide visibility
    document.querySelectorAll('.welcome-slide').forEach((slide, index) => {
      if (index === this.currentWelcomeSlide) {
        slide.classList.add('active');
        slide.classList.remove('prev');
      } else if (index < this.currentWelcomeSlide) {
        slide.classList.remove('active');
        slide.classList.add('prev');
      } else {
        slide.classList.remove('active', 'prev');
      }
    });

    // Update dots
    document.querySelectorAll('.welcome-dot').forEach((dot, index) => {
      if (index === this.currentWelcomeSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Update buttons
    const backBtn = document.getElementById('welcome-back-btn');
    const nextBtn = document.getElementById('welcome-next-btn');
    const getStartedBtn = document.getElementById('welcome-get-started-btn');

    if (this.currentWelcomeSlide === 0) {
      backBtn.style.display = 'none';
      nextBtn.style.display = 'block';
      getStartedBtn.style.display = 'none';
    } else if (this.currentWelcomeSlide === 2) {
      backBtn.style.display = 'block';
      nextBtn.style.display = 'none';
      getStartedBtn.style.display = 'block';
    } else {
      backBtn.style.display = 'block';
      nextBtn.style.display = 'block';
      getStartedBtn.style.display = 'none';
    }
  }

  skipWelcome() {
    localStorage.setItem('lingxm-welcome-shown', 'true');
    this.showScreen('profile-selection');
    this.analyticsManager.trackEvent('welcome_skipped', { atSlide: this.currentWelcomeSlide });
  }

  completeWelcome() {
    localStorage.setItem('lingxm-welcome-shown', 'true');
    this.showScreen('profile-selection');
    this.analyticsManager.trackEvent('welcome_completed', {});
  }

  // ============================================
  // Swipe Tutorial
  // ============================================

  showSwipeTutorial(profileKey) {
    const tutorialShown = localStorage.getItem(`lingxm-tutorial-shown-${profileKey}`);
    if (tutorialShown) return;

    const tutorial = document.getElementById('swipe-tutorial');
    tutorial.classList.add('active');

    this.analyticsManager.trackEvent('tutorial_shown', { profile: profileKey });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (tutorial.classList.contains('active')) {
        this.dismissSwipeTutorial();
      }
    }, 10000);
  }

  dismissSwipeTutorial() {
    const tutorial = document.getElementById('swipe-tutorial');
    tutorial.classList.remove('active');

    if (this.profileKey) {
      localStorage.setItem(`lingxm-tutorial-shown-${this.profileKey}`, 'true');
      this.analyticsManager.trackEvent('tutorial_dismissed', { profile: this.profileKey });
    }
  }

  // ============================================
  // Analytics System
  // ============================================

  showAnalytics() {
    const modal = document.getElementById('analytics-modal');
    modal.classList.add('active');
    this.populateAnalyticsData();
    this.analyticsManager.trackEvent('analytics_viewed', {});
  }

  toggleAnalytics() {
    const modal = document.getElementById('analytics-modal');
    modal.classList.toggle('active');
  }

  populateAnalyticsData() {
    const stats = this.analyticsManager.getUsageStats();

    // Update summary stats
    document.getElementById('stat-total-sessions').textContent = stats.summary.totalSessions;
    document.getElementById('stat-total-words').textContent = stats.summary.totalWords.toLocaleString();
    const avgMinutes = Math.floor(stats.summary.averageSessionTime / 60);
    document.getElementById('stat-avg-session').textContent = `${avgMinutes} min`;
    document.getElementById('stat-total-events').textContent = stats.summary.totalEvents;

    // Update feature stats
    document.getElementById('stat-achievements').textContent = stats.achievements;
    document.getElementById('stat-saved-words').textContent = stats.savedWords;
    document.getElementById('stat-avg-streak').textContent = `${stats.averageStreak} days`;

    // Populate profile usage
    const profilesDiv = document.getElementById('analytics-profiles');
    profilesDiv.innerHTML = '';
    const sortedProfiles = Object.entries(stats.profiles).sort((a, b) => b[1].percentage - a[1].percentage);
    sortedProfiles.forEach(([profile, data]) => {
      const item = document.createElement('div');
      item.className = 'analytics-list-item';
      item.innerHTML = `
        <span>${PROFILES[profile]?.name || profile}</span>
        <span><strong>${data.percentage}%</strong> (${data.sessions} sessions)</span>
      `;
      profilesDiv.appendChild(item);
    });

    // Populate recent sessions
    const recentDiv = document.getElementById('analytics-recent');
    recentDiv.innerHTML = '';
    stats.recentSessions.slice(0, 5).forEach(session => {
      const item = document.createElement('div');
      item.className = 'analytics-recent-item';
      const duration = Math.floor(session.duration / 60);
      item.innerHTML = `
        <strong>${PROFILES[session.profile]?.name || session.profile}</strong> •
        ${session.words} words • ${duration} min • ${session.date}
      `;
      recentDiv.appendChild(item);
    });
  }

  exportAnalyticsData() {
    const jsonData = this.analyticsManager.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lingxm-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.analyticsManager.trackEvent('analytics_exported', {});
  }

  clearAnalyticsData() {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      this.analyticsManager.clearData();
      this.populateAnalyticsData();
      alert('Analytics data cleared successfully.');
      this.analyticsManager.trackEvent('analytics_cleared', {});
    }
  }

  // ============================================
  // HOME SCREEN - CARD-BASED NAVIGATION
  // ============================================

  renderHomeScreen() {
    console.log('[HOME] Rendering home screen for profile:', this.profileKey);

    // Update header with profile info
    const profile = this.currentProfile;
    document.getElementById('home-user-avatar').textContent = profile.emoji;
    document.getElementById('home-user-name').textContent = profile.name;

    // Update language badge (show current/first language)
    const currentLang = profile.learningLanguages[this.currentLanguageIndex || 0];
    document.getElementById('home-language-badge').textContent =
      `${currentLang.flag} ${currentLang.name} ${currentLang.level}`;

    // Update streak badge
    const streak = this.progressTracker ? this.progressTracker.getStats().currentStreak : 0;
    document.getElementById('home-streak-badge').textContent =
      `🔥 ${streak} day${streak !== 1 ? 's' : ''}`;

    // Calculate and display dynamic counts
    this.updateHomeCardCounts();

    // Render language selector widget
    this.renderLanguageSelector();

    // Setup card click handlers
    this.setupHomeCardHandlers();

    // Setup header button handlers
    this.setupHomeHeaderHandlers();

    // Setup language selector handlers
    this.setupLanguageSelectorHandlers();

    // Show home screen
    this.showScreen('home-screen');

    this.analyticsManager.trackEvent('home_screen_viewed', { profile: this.profileKey });
  }

  /**
   * Render language selector widget on home screen
   */
  renderLanguageSelector() {
    console.log('[HOME] Rendering language selector');

    const container = document.getElementById('language-selector-widget');
    if (!container) {
      console.warn('[HOME] Language selector container not found');
      return;
    }

    const languages = this.currentProfile.learningLanguages;
    const currentIndex = this.currentLanguageIndex;

    // Build language cards HTML
    const cardsHTML = languages.map((lang, index) => {
      const isActive = index === currentIndex;
      const progress = this.getLanguageProgressSync(lang.code);

      return `
        <div class="language-option ${isActive ? 'active' : ''}" data-lang-index="${index}">
          <div class="language-option-check">✓</div>
          <div class="language-option-flag">${lang.flag}</div>
          <div class="language-option-name">${lang.name}</div>
          <div class="language-option-level">${lang.level}</div>
          <div class="language-option-divider"></div>
          <div class="language-option-stats">
            <div class="language-option-stat">
              <span class="language-stat-value">${progress.total}</span>
              <span class="language-stat-label">Words</span>
            </div>
            <div class="language-option-stat">
              <span class="language-stat-value">${progress.percentage}%</span>
              <span class="language-stat-label">Mastered</span>
            </div>
          </div>
          <div class="language-option-progress" style="width: ${progress.percentage}%;"></div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="language-selector-cards">
        ${cardsHTML}
      </div>
    `;

    console.log('[HOME] Language selector rendered with', languages.length, 'languages');
  }

  updateHomeCardCounts() {
    // Vocabulary count - total words for all languages
    let totalWords = 0;
    for (const lang of this.currentProfile.learningLanguages) {
      if (this.wordData[lang.code]) {
        totalWords += this.wordData[lang.code].length;
      }
    }
    document.getElementById('vocab-count').textContent = `${totalWords} words`;

    // Progress percentage - calculate completed words
    if (this.progressTracker) {
      let completedWords = 0;
      let totalVocab = 0;

      for (const lang of this.currentProfile.learningLanguages) {
        if (this.wordData[lang.code]) {
          totalVocab += this.wordData[lang.code].length;
          completedWords += this.progressTracker.getCompletedCount(lang.code);
        }
      }

      const progressPercent = totalVocab > 0 ? Math.round((completedWords / totalVocab) * 100) : 0;
      document.getElementById('progress-count').textContent = `${progressPercent}%`;
    } else {
      document.getElementById('progress-count').textContent = '0%';
    }

    // Saved words count
    const savedCount = this.savedWords ? Object.keys(this.savedWords).length : 0;
    document.getElementById('saved-count').textContent = `${savedCount} saved`;
  }

  setupHomeCardHandlers() {
    console.log('[HOME] Setting up card handlers (event delegation)');

    const container = document.querySelector('.home-cards-grid');
    if (!container) {
      console.error('[HOME] Cards container not found');
      return;
    }

    // Remove old handler if exists
    if (container._cardClickHandler) {
      container.removeEventListener('click', container._cardClickHandler);
      console.log('[HOME] Removed old card handler');
    }

    // Create new handler with event delegation
    const clickHandler = (e) => {
      // Find the clicked card (handles clicks on children too)
      const card = e.target.closest('.home-card');
      if (!card) return;

      e.preventDefault();
      e.stopPropagation();

      const section = card.dataset.section;
      console.log('[HOME] Card clicked:', section);

      if (section) {
        this.navigateToSection(section);
      }
    };

    // Attach single delegated listener to container
    container.addEventListener('click', clickHandler);

    // Save reference for future removal
    container._cardClickHandler = clickHandler;

    console.log('[HOME] Card handlers attached via delegation');
  }

  setupHomeHeaderHandlers() {
    // Remove old handlers to prevent duplicates (defensive programming)
    const homeBackBtn = document.getElementById('home-back-btn');
    const homeSettingsBtn = document.getElementById('home-settings-btn');
    const homeAchievementsBtn = document.getElementById('home-achievements-btn');
    const homeStreakBadge = document.getElementById('home-streak-badge');

    // Clone and replace to remove all old event listeners
    if (homeBackBtn) {
      const newHomeBackBtn = homeBackBtn.cloneNode(true);
      homeBackBtn.parentNode.replaceChild(newHomeBackBtn, homeBackBtn);
      newHomeBackBtn.addEventListener('click', () => {
        console.log('🔙 [HOME] Back button clicked');
        this.returnToProfileSelection();
      });
    }

    if (homeSettingsBtn) {
      const newHomeSettingsBtn = homeSettingsBtn.cloneNode(true);
      homeSettingsBtn.parentNode.replaceChild(newHomeSettingsBtn, homeSettingsBtn);
      newHomeSettingsBtn.addEventListener('click', () => {
        console.log('⚙️ [HOME] Settings button clicked');
        this.toggleSettings();
      });
    }

    if (homeAchievementsBtn) {
      const newHomeAchievementsBtn = homeAchievementsBtn.cloneNode(true);
      homeAchievementsBtn.parentNode.replaceChild(newHomeAchievementsBtn, homeAchievementsBtn);
      newHomeAchievementsBtn.addEventListener('click', () => {
        console.log('🏆 [HOME] Achievements button clicked');
        this.toggleAchievements();
      });
    }

    if (homeStreakBadge) {
      const newHomeStreakBadge = homeStreakBadge.cloneNode(true);
      homeStreakBadge.parentNode.replaceChild(newHomeStreakBadge, homeStreakBadge);
      newHomeStreakBadge.addEventListener('click', () => {
        console.log('🔥 [HOME] Streak badge clicked');
        this.toggleAchievements();
      });
    }

    console.log('✅ [HOME] Header handlers attached');
  }

  /**
   * Setup click handlers for language selector widget
   */
  setupLanguageSelectorHandlers() {
    const container = document.getElementById('language-selector-widget');
    if (!container) return;

    // Add click handlers to all language option cards
    const languageOptions = container.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
      option.addEventListener('click', () => {
        const langIndex = parseInt(option.getAttribute('data-lang-index'));
        this.switchLanguageFromHome(langIndex);
      });
    });

    console.log('[HOME] Language selector handlers setup for', languageOptions.length, 'languages');
  }

  /**
   * Switch language from home screen
   * Updates widget and home card counts
   */
  async switchLanguageFromHome(newIndex) {
    if (newIndex === this.currentLanguageIndex) {
      console.log('[HOME] Already on this language');
      return;
    }

    console.log(`[HOME] Switching language from ${this.currentLanguageIndex} to ${newIndex}`);

    const oldLang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
    const newLang = this.currentProfile.learningLanguages[newIndex];

    // Update index
    this.currentLanguageIndex = newIndex;
    this.currentWordIndex = 0;

    // Save position immediately
    if (this.positionManager) {
      this.positionManager.saveImmediately(
        this.profileKey,
        newLang.code,
        this.currentWordIndex
      );
    }

    // Update language badge in header
    document.getElementById('home-language-badge').textContent =
      `${newLang.flag} ${newLang.name} ${newLang.level}`;

    // Re-render language selector to show new active state
    this.renderLanguageSelector();

    // Re-setup handlers (since we just re-rendered)
    this.setupLanguageSelectorHandlers();

    // Update home card counts
    this.updateHomeCardCounts();

    // Track analytics
    this.analyticsManager.trackEvent('language_switched', {
      from: oldLang.code,
      to: newLang.code,
      location: 'home_screen'
    });

    console.log(`[HOME] ✅ Switched to ${newLang.name}`);
  }

  navigateToSection(section) {
    // Guard against multiple simultaneous calls
    if (this.isNavigating) {
      console.warn('[HOME] Navigation in progress, ignoring duplicate');
      return;
    }

    this.isNavigating = true;
    console.log('[HOME] Navigating to section:', section);
    this.analyticsManager.trackEvent('home_card_clicked', { section, profile: this.profileKey });

    try {
      switch(section) {
        case 'vocabulary':
          this.startVocabularyPractice();
          break;

        case 'sentences':
          this.startSentencePractice();
          break;

        case 'progress':
          // Show progress dashboard
          this.showScreen('progress-screen');
          this.renderProgressDashboard();
          break;

        case 'saved':
          // TODO: Implement saved words view
          this.showComingSoonModal('Saved Words Review');
          break;

        default:
          console.warn('[HOME] Unknown section:', section);
      }
    } finally {
      // Reset flag after a short delay to allow navigation to complete
      setTimeout(() => {
        this.isNavigating = false;
        console.log('[HOME] Navigation complete, ready for next action');
      }, 300);
    }
  }

  async startVocabularyPractice() {
    try {
      console.log('[VOCAB] Starting vocabulary practice');

      // Ensure database is ready before vocabulary operations
      await ensureDatabaseReady();
      console.log('✅ [VOCAB] Database ready for vocabulary practice');

      // Setup language buttons
      this.setupLanguageButtons();

      // Restore last position using PositionManager
      console.log('🔎 [INIT RESUME]', {
        profile: this.profileKey,
        availableLanguages: this.currentProfile.learningLanguages.map(l => l.code)
      });

      // Get the last active language for this profile
      const lastActiveLang = this.positionManager.getLastActiveLanguage(this.profileKey);

      // Find the language index for the last active language
      let langIndex = -1;
      if (lastActiveLang) {
        langIndex = this.currentProfile.learningLanguages.findIndex(
          lang => lang.code === lastActiveLang
        );
      }

      // If no last active language or language not found, default to first language
      if (langIndex < 0) {
        langIndex = 0;
        console.log(`ℹ️ [INIT RESUME] No last active language, defaulting to first language: ${this.currentProfile.learningLanguages[0].code}`);
      }

      this.currentLanguageIndex = langIndex;
      const currentLang = this.currentProfile.learningLanguages[this.currentLanguageIndex];

      // Load the position for this specific language using PositionManager
      const savedPosition = await this.positionManager.load(this.profileKey, currentLang.code);

      if (savedPosition && savedPosition.lastWordIndex !== null) {
        // Validate word index doesn't exceed vocabulary length
        // Check if vocabulary data exists for this language
        if (this.wordData[currentLang.code] && this.wordData[currentLang.code].length > 0) {
          const maxIndex = this.wordData[currentLang.code].length - 1;
          this.currentWordIndex = Math.min(savedPosition.lastWordIndex, maxIndex);
          console.log(`✅ [Resume] Restored position: word #${this.currentWordIndex + 1} of ${maxIndex + 1}, language: ${currentLang.code} (from ${savedPosition.source})`);
        } else {
          // Vocabulary not loaded for this language, start from beginning
          this.currentWordIndex = 0;
          console.warn(`⚠️ [Resume] No vocabulary loaded for ${currentLang.code}, starting from word #1`);
        }
      } else {
        // No saved position for this language, start from beginning
        this.currentWordIndex = 0;
        console.log(`ℹ️ [Resume] No saved position for ${currentLang.code}, starting from word #1`);
      }

      // Show learning screen with explicit style forcing for robustness
      console.log('[VOCAB] ⚠️ About to call showScreen');
      this.showScreen('learning-screen');
      console.log('[VOCAB] ⚠️ showScreen returned');

      // Add explicit style forcing to ensure visibility (overrides any conflicting CSS)
      const homeScreen = document.getElementById('home-screen');
      const learningScreen = document.getElementById('learning-screen');

      if (homeScreen) {
        homeScreen.style.display = 'none';
        homeScreen.classList.remove('active');
        console.log('[VOCAB] ✅ Forced home-screen hidden (inline style)');
      } else {
        console.error('[VOCAB] ❌ home-screen element not found');
      }

      if (learningScreen) {
        learningScreen.style.display = 'flex';
        learningScreen.style.flexDirection = 'column';
        learningScreen.classList.add('active');
        console.log('[VOCAB] ✅ Forced learning-screen visible (inline style)');
      } else {
        console.error('[VOCAB] ❌ learning-screen element not found');
      }

      await this.displayCurrentWord();
      this.showProgressBar();

      // Show swipe tutorial on first visit
      this.showSwipeTutorial(this.profileKey);

      // Check for new achievements and update badge
      this.updateAchievementBadge();

      this.analyticsManager.trackEvent('vocabulary_practice_started', {
        profile: this.profileKey,
        language: currentLang.code
      });

      console.log('[VOCAB] ✅✅✅ METHOD COMPLETED SUCCESSFULLY ✅✅✅');

    } catch (error) {
      console.error('[VOCAB] ❌❌❌ CRITICAL ERROR IN startVocabularyPractice:', error);
      console.error('[VOCAB] Error name:', error.name);
      console.error('[VOCAB] Error message:', error.message);
      console.error('[VOCAB] Error stack:', error.stack);

      // Show error to user
      alert(`Failed to start vocabulary practice!\n\nError: ${error.message}\n\nPlease check the console for details.`);

      // Attempt recovery: show home screen again
      try {
        console.log('[VOCAB] Attempting to recover by showing home screen...');
        const homeScreen = document.getElementById('home-screen');
        if (homeScreen) {
          homeScreen.style.display = 'flex';
          homeScreen.classList.add('active');
          console.log('[VOCAB] ✅ Recovered: home screen shown');
        }
      } catch (recoveryError) {
        console.error('[VOCAB] ❌ Recovery also failed:', recoveryError);
      }
    }
  }

  // ========================================
  // PROGRESS DASHBOARD METHODS
  // ========================================

  async renderProgressDashboard() {
    console.log('[PROGRESS] Rendering gamified progress dashboard');
    await ensureDatabaseReady();

    try {
      // Fetch all progress data
      const overallProgress = await this.getOverallProgress();
      const languageProgress = await this.getLanguageProgress();
      const recentActivity = await this.getRecentActivity();
      const streakStats = await this.getStreakStats();

      // Calculate XP and level
      const xpData = this.calculateXPAndLevel(overallProgress.mastered);

      // Render gamified sections
      this.renderJourneyHero(xpData, streakStats);
      this.renderDailyGoals(recentActivity);
      this.renderLanguagesGrid(languageProgress);
      this.renderAchievementsShowcase();
      this.renderWeeklyTimeline(recentActivity);

      // Setup event handlers
      this.setupProgressScreenHandlers();

      console.log('[PROGRESS] Gamified dashboard rendered successfully');
    } catch (error) {
      console.error('[PROGRESS] Error rendering dashboard:', error);
    }
  }

  /**
   * Calculate XP and level based on mastered words
   * XP System: 100 XP per word mastered, level up every 1000 XP
   */
  calculateXPAndLevel(masteredWords) {
    const xpPerWord = 100;
    const xpPerLevel = 1000;

    const totalXP = masteredWords * xpPerWord;
    const level = Math.floor(totalXP / xpPerLevel) + 1; // Start at level 1
    const currentXP = totalXP % xpPerLevel;
    const nextLevelXP = xpPerLevel;
    const xpProgress = (currentXP / nextLevelXP) * 100;

    return {
      totalXP,
      level,
      currentXP,
      nextLevelXP,
      xpProgress,
      masteredWords
    };
  }

  /**
   * Render journey hero section with level, XP, and streak
   */
  renderJourneyHero(xpData, streakStats) {
    // Greeting based on time of day
    const hour = new Date().getHours();
    let greeting = 'Welcome back!';
    if (hour < 12) greeting = 'Good morning!';
    else if (hour < 18) greeting = 'Good afternoon!';
    else greeting = 'Good evening!';

    document.getElementById('journey-greeting').textContent = greeting;

    // Encouragement messages
    const encouragements = [
      'Keep crushing it!',
      'You\'re on fire!',
      'Amazing progress!',
      'Keep it up!',
      'You\'re doing great!',
      'Impressive work!',
      'You\'re unstoppable!'
    ];
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    document.getElementById('journey-encouragement').textContent = randomEncouragement;

    // Level display
    document.getElementById('user-level').textContent = xpData.level;

    // XP progress bar
    document.getElementById('current-xp').textContent = xpData.currentXP;
    document.getElementById('next-level-xp').textContent = xpData.nextLevelXP;

    const xpBar = document.getElementById('xp-bar');
    setTimeout(() => {
      xpBar.style.width = `${xpData.xpProgress}%`;
    }, 100);

    // Streak display
    document.getElementById('streak-count').textContent = streakStats.currentStreak;

    const streakMessage = streakStats.currentStreak === 0
      ? 'Start your streak today!'
      : streakStats.currentStreak >= 7
      ? 'You\'re on fire! 🔥'
      : streakStats.currentStreak >= 3
      ? 'Keep it going!'
      : 'Great start!';

    document.getElementById('streak-message').textContent = streakMessage;
  }

  /**
   * Render daily goals with animated rings
   */
  renderDailyGoals(recentActivity) {
    // Get today's activity
    const today = recentActivity.find(day => {
      const dayDate = new Date(day.date).toDateString();
      const todayDate = new Date().toDateString();
      return dayDate === todayDate;
    });

    const wordsToday = today ? today.wordsReviewed : 0;
    const practiceTime = Math.floor(wordsToday * 0.5); // Estimate: 30s per word
    const accuracy = 85; // TODO: Calculate from actual session data

    // Daily goals
    const goalsWords = 20;
    const goalsTime = 15; // minutes
    const goalsAccuracy = 80; // percent

    // Update text
    document.getElementById('goal-words-text').textContent = `${wordsToday}/${goalsWords}`;
    document.getElementById('goal-time-text').textContent = `${practiceTime}/${goalsTime} min`;
    document.getElementById('goal-accuracy-text').textContent = `${accuracy}%`;

    // Animate rings
    this.animateGoalRing('goal-ring-words', wordsToday / goalsWords, 70);
    this.animateGoalRing('goal-ring-time', practiceTime / goalsTime, 55);
    this.animateGoalRing('goal-ring-accuracy', accuracy / goalsAccuracy, 40);
  }

  /**
   * Animate a goal ring (similar to Apple Watch rings)
   */
  animateGoalRing(ringId, progress, radius) {
    const ring = document.getElementById(ringId);
    if (!ring) return;

    const circumference = 2 * Math.PI * radius;
    const progressClamped = Math.min(progress, 1);
    const offset = circumference - (progressClamped * circumference);

    setTimeout(() => {
      ring.style.strokeDashoffset = offset;
    }, 300);
  }

  /**
   * Render languages grid with beautiful cards
   */
  renderLanguagesGrid(languageProgress) {
    const container = document.querySelector('.languages-grid');
    if (!container) return;

    const descriptors = {
      high: ['You\'re crushing it!', 'Amazing progress!', 'Keep it up!'],
      medium: ['You\'re doing great!', 'Nice work!', 'Keep going!'],
      low: ['Just getting started!', 'Keep practicing!', 'You got this!']
    };

    const cardsHTML = languageProgress.map((lang, index) => {
      const descriptor = lang.percentage > 70 ? descriptors.high :
                        lang.percentage > 30 ? descriptors.medium :
                        descriptors.low;
      const randomDescriptor = descriptor[Math.floor(Math.random() * descriptor.length)];

      return `
        <div class="language-card" style="animation-delay: ${index * 100}ms">
          <div class="language-card-header">
            <div class="language-card-flag">${lang.flag}</div>
            <div class="language-card-info">
              <div class="language-card-name">${lang.name}</div>
              <div class="language-card-descriptor">${randomDescriptor}</div>
            </div>
          </div>
          <div class="language-card-progress">
            <div class="language-progress-percentage">${lang.percentage}%</div>
          </div>
          <div class="language-card-stats">
            <div class="language-card-stat">
              <span class="language-card-stat-value">${lang.mastered}</span>
              <span class="language-card-stat-label">Mastered</span>
            </div>
            <div class="language-card-stat">
              <span class="language-card-stat-value">${lang.total}</span>
              <span class="language-card-stat-label">Total</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = cardsHTML;
  }

  /**
   * Render achievements showcase
   */
  renderAchievementsShowcase() {
    const container = document.querySelector('.achievements-grid');
    if (!container || !this.achievementManager) return;

    // Get first 4 achievements (mix of unlocked and next to unlock)
    const allAchievements = this.achievementManager.achievements;
    const unlockedIds = this.achievementManager.data.earned;

    const showcaseAchievements = [
      ...allAchievements.filter(a => unlockedIds.includes(a.id)).slice(0, 2),
      ...allAchievements.filter(a => !unlockedIds.includes(a.id)).slice(0, 2)
    ];

    const achievementsHTML = showcaseAchievements.map((achievement, index) => {
      const isUnlocked = unlockedIds.includes(achievement.id);
      const lockedClass = isUnlocked ? '' : 'locked';

      return `
        <div class="achievement-card ${lockedClass}" style="animation-delay: ${index * 100}ms">
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-info">
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-status ${isUnlocked ? 'unlocked' : ''}">
              ${isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = achievementsHTML;
  }

  /**
   * Render weekly activity timeline
   */
  renderWeeklyTimeline(recentActivity) {
    const container = document.querySelector('.weekly-timeline');
    if (!container) return;

    const maxWords = Math.max(...recentActivity.map(d => d.wordsReviewed), 1);
    const today = new Date().toDateString();

    const timelineHTML = recentActivity.slice(0, 7).reverse().map((day, index) => {
      const dayDate = new Date(day.date).toDateString();
      const isToday = dayDate === today;
      const isBest = day.wordsReviewed === maxWords && maxWords > 0;
      const isRest = day.wordsReviewed === 0;

      const classes = [
        'timeline-day',
        isToday ? 'active' : '',
        isBest && !isRest ? 'best' : '',
        isRest ? 'rest' : ''
      ].filter(Boolean).join(' ');

      const dots = '●'.repeat(Math.min(Math.ceil(day.wordsReviewed / 10), 10));
      const badge = isBest && !isRest ? '<span class="timeline-day-badge">Best day!</span>' : '';
      const count = isRest ? 'Rest day' : `${day.wordsReviewed} words`;

      return `
        <div class="${classes}" style="animation-delay: ${index * 50}ms">
          <div class="timeline-day-name">${day.dayName}</div>
          <div class="timeline-day-dots">${dots}</div>
          <div class="timeline-day-count">${count}</div>
          ${badge}
        </div>
      `;
    }).join('');

    container.innerHTML = timelineHTML;
  }

  async getOverallProgress() {
    console.log('[PROGRESS] Getting overall progress');

    const { dbManager } = await import('./utils/database.js');
    const userId = this.progressTracker?.userId;

    let totalWords = 0;
    let masteredWords = 0;

    try {
      // Iterate through each learning language for this profile
      for (const langObj of this.currentProfile.learningLanguages) {
        const lang = langObj.code;
        const vocabulary = this.wordData[lang] || [];

        console.log(`[PROGRESS] Processing ${lang}: ${vocabulary.length} words`);

        totalWords += vocabulary.length;

        if (userId) {
          // Get progress from database for this language
          const progressData = dbManager.getLearnedWords(userId, lang);
          console.log(`[PROGRESS] Got ${progressData.length} progress records for ${lang}`);

          // Count words at mastery level 4 or higher as mastered
          const mastered = progressData.filter(p => p.mastery_level >= 4).length;
          masteredWords += mastered;

          console.log(`[PROGRESS] ${lang}: ${mastered} mastered out of ${vocabulary.length}`);
        }
      }

      const percentage = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

      console.log(`[PROGRESS] Overall: ${masteredWords}/${totalWords} = ${percentage}%`);

      return {
        total: totalWords,
        mastered: masteredWords,
        percentage: percentage
      };
    } catch (error) {
      console.error('[PROGRESS] Error in getOverallProgress:', error);
      return {
        total: 0,
        mastered: 0,
        percentage: 0
      };
    }
  }

  async getLanguageProgress() {
    console.log('[PROGRESS] Getting language progress');

    const { dbManager } = await import('./utils/database.js');
    const userId = this.progressTracker?.userId;
    const results = [];

    try {
      for (const langObj of this.currentProfile.learningLanguages) {
        const lang = langObj.code;
        const vocabulary = this.wordData[lang] || [];

        let mastered = 0;

        if (userId) {
          const progressData = dbManager.getLearnedWords(userId, lang);
          mastered = progressData.filter(p => p.mastery_level >= 4).length;
        }

        const percentage = vocabulary.length > 0 ? Math.round((mastered / vocabulary.length) * 100) : 0;

        results.push({
          code: lang,
          name: langObj.name,
          flag: langObj.flag,
          total: vocabulary.length,
          mastered: mastered,
          percentage: percentage
        });

        console.log(`[PROGRESS] Language ${lang}: ${percentage}% (${mastered}/${vocabulary.length})`);
      }

      return results.sort((a, b) => b.percentage - a.percentage);
    } catch (error) {
      console.error('[PROGRESS] Error in getLanguageProgress:', error);
      return [];
    }
  }

  /**
   * Get language progress synchronously (for home screen widget)
   * Uses cached progress data without database async calls
   */
  getLanguageProgressSync(languageCode) {
    const vocabulary = this.wordData[languageCode] || [];
    const total = vocabulary.length;

    let mastered = 0;
    if (this.progressTracker) {
      mastered = this.progressTracker.getCompletedCount(languageCode);
    }

    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return {
      total,
      mastered,
      percentage
    };
  }

  async getMasteryBreakdown() {
    console.log('[PROGRESS] Getting mastery breakdown');

    const { dbManager } = await import('./utils/database.js');
    const userId = this.progressTracker?.userId;

    const levelCounts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    let totalWords = 0;

    try {
      for (const langObj of this.currentProfile.learningLanguages) {
        const lang = langObj.code;
        const vocabulary = this.wordData[lang] || [];

        if (userId) {
          const progressData = dbManager.getLearnedWords(userId, lang);

          // Create a map of word → mastery level
          const progressMap = {};
          progressData.forEach(p => {
            progressMap[p.word] = p.mastery_level;
          });

          // Count each word's mastery level
          vocabulary.forEach(wordObj => {
            const level = progressMap[wordObj.word] || 0;
            levelCounts[level]++;
            totalWords++;
          });
        } else {
          // If no database, all words are level 0
          totalWords += vocabulary.length;
          levelCounts[0] += vocabulary.length;
        }
      }

      console.log('[PROGRESS] Mastery breakdown:', levelCounts, 'Total:', totalWords);

      return {
        levels: levelCounts,
        total: totalWords
      };
    } catch (error) {
      console.error('[PROGRESS] Error in getMasteryBreakdown:', error);
      return {
        levels: {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        total: 0
      };
    }
  }

  async getRecentActivity() {
    console.log('[PROGRESS] Getting recent activity');

    const { dbManager } = await import('./utils/database.js');
    const userId = this.progressTracker?.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = [];

    try {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        let wordsReviewed = 0;

        if (userId) {
          const dayStats = dbManager.getDailyStats(userId, dateStr);
          wordsReviewed = dayStats ? (dayStats.words_learned || 0) : 0;
        }

        last7Days.push({
          date: dateStr,
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
          wordsReviewed: wordsReviewed
        });
      }

      console.log('[PROGRESS] Last 7 days activity:', last7Days);

      return last7Days;
    } catch (error) {
      console.error('[PROGRESS] Error in getRecentActivity:', error);
      return Array(7).fill(null).map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
          wordsReviewed: 0
        };
      });
    }
  }

  async getStreakStats() {
    console.log('[PROGRESS] Getting streak stats');

    const { dbManager } = await import('./utils/database.js');
    const userId = this.progressTracker?.userId;

    try {
      let currentStreak = 0;
      let longestStreak = 0;
      let totalDaysActive = 0;

      if (userId) {
        currentStreak = dbManager.getCurrentStreak(userId) || 0;
      }

      // Fall back to localStorage for longest streak and total days
      if (this.progressTracker?.data) {
        longestStreak = this.progressTracker.data.longestStreak || 0;
        totalDaysActive = this.progressTracker.data.studyHistory?.length || 0;
      }

      console.log('[PROGRESS] Streak stats:', {currentStreak, longestStreak, totalDaysActive});

      return {
        currentStreak,
        longestStreak,
        totalDaysActive
      };
    } catch (error) {
      console.error('[PROGRESS] Error in getStreakStats:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0
      };
    }
  }

  getLanguageFlag(languageCode) {
    const flagMap = {
      'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹',
      'pt': '🇵🇹', 'ru': '🇷🇺', 'ja': '🇯🇵', 'ko': '🇰🇷',
      'zh': '🇨🇳', 'ar': '🇸🇦', 'hi': '🇮🇳', 'nl': '🇳🇱'
    };
    return flagMap[languageCode] || '🌍';
  }

  renderOverallProgress(data) {
    const circle = document.querySelector('#progress-screen .overall-progress-circle');
    const percentageEl = document.querySelector('#progress-screen .overall-percentage');
    const wordsCountEl = document.querySelector('#progress-screen .overall-words-count');

    if (circle && percentageEl && wordsCountEl) {
      const radius = 75;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (data.percentage / 100) * circumference;

      // Animate the circle
      setTimeout(() => {
        circle.style.strokeDashoffset = offset;
      }, 300);

      // Update text with animation
      let currentPercentage = 0;
      const step = data.percentage / 60;
      const interval = setInterval(() => {
        currentPercentage += step;
        if (currentPercentage >= data.percentage) {
          currentPercentage = data.percentage;
          clearInterval(interval);
        }
        percentageEl.textContent = `${Math.round(currentPercentage)}%`;
      }, 16);

      wordsCountEl.textContent = `${data.mastered} of ${data.total} words mastered`;
    }
  }

  renderQuickStats(stats) {
    const streakValue = document.querySelector('#progress-screen .streak-stat .stat-value');
    const activityValue = document.querySelector('#progress-screen .activity-stat .stat-value');

    if (streakValue) {
      streakValue.textContent = `${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`;
    }
    if (activityValue) {
      activityValue.textContent = `${stats.totalDaysActive} day${stats.totalDaysActive !== 1 ? 's' : ''}`;
    }
  }

  renderLanguageProgress(languages) {
    const container = document.querySelector('#progress-screen .language-progress-list');
    if (!container) return;

    if (languages.length === 0) {
      container.innerHTML = '<div class="empty-state">No language data yet. Start learning to see your progress!</div>';
      return;
    }

    const html = languages.map((lang, index) => `
      <div class="lang-progress-item" style="animation-delay: ${index * 100}ms">
        <div class="lang-progress-header">
          <span class="lang-flag">${lang.flag}</span>
          <span class="lang-name">${lang.name.toUpperCase()}</span>
          <span class="lang-percentage">${lang.percentage}%</span>
        </div>
        <div class="lang-progress-track">
          <div class="lang-progress-bar" style="--progress: ${lang.percentage}%; animation-delay: ${index * 100 + 200}ms"></div>
        </div>
        <div class="lang-progress-stats">${lang.mastered} / ${lang.total} words mastered</div>
      </div>
    `).join('');

    container.innerHTML = html;

    // Trigger animations
    setTimeout(() => {
      const bars = container.querySelectorAll('.lang-progress-bar');
      bars.forEach(bar => {
        const progress = parseInt(bar.style.getPropertyValue('--progress'));
        bar.style.width = `${progress}%`;
      });
    }, 100);
  }

  renderMasteryDistribution(breakdown) {
    const container = document.querySelector('#progress-screen .mastery-levels-list');
    if (!container) return;

    const masteryLevels = [
      { level: 5, label: 'Mastered', color: 'var(--success)' },
      { level: 4, label: 'Proficient', color: '#3b82f6' },
      { level: 3, label: 'Familiar', color: '#8b5cf6' },
      { level: 2, label: 'Learning', color: '#f59e0b' },
      { level: 1, label: 'Introduced', color: '#ef4444' },
      { level: 0, label: 'New', color: '#6b7280' }
    ];

    const totalWords = breakdown.total || 1; // Avoid division by zero

    const html = masteryLevels.map((item, index) => {
      const count = breakdown.levels[item.level] || 0;
      const percentage = Math.round((count / totalWords) * 100);

      return `
        <div class="mastery-level-item" style="animation-delay: ${index * 80}ms">
          <div class="mastery-level-header">
            <span class="mastery-level-label">${item.label}</span>
            <span class="mastery-level-count">${count} (${percentage}%)</span>
          </div>
          <div class="mastery-level-track">
            <div class="mastery-level-bar level-${item.level}"
                 style="--progress: ${percentage}%; background: ${item.color}; animation-delay: ${index * 80 + 200}ms"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // Trigger animations
    setTimeout(() => {
      const bars = container.querySelectorAll('.mastery-level-bar');
      bars.forEach(bar => {
        const progress = parseInt(bar.style.getPropertyValue('--progress'));
        bar.style.width = `${progress}%`;
      });
    }, 100);
  }

  renderActivityCalendar(activityData) {
    const container = document.querySelector('#progress-screen .activity-calendar');
    if (!container) return;

    const maxWords = Math.max(...activityData.map(d => d.wordsReviewed), 1);

    const html = activityData.map((day, index) => {
      const heightPercent = maxWords > 0 ? (day.wordsReviewed / maxWords) * 100 : 0;
      return `
        <div class="activity-day" style="animation-delay: ${index * 60}ms">
          <div class="activity-day-bar">
            <div class="activity-day-fill" style="--height: ${heightPercent}%; animation-delay: ${index * 60 + 200}ms"></div>
          </div>
          <div class="activity-day-label">${day.dayName}</div>
          <div class="activity-day-count">${day.wordsReviewed}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // Trigger animations
    setTimeout(() => {
      const fills = container.querySelectorAll('.activity-day-fill');
      fills.forEach(fill => {
        const height = parseInt(fill.style.getPropertyValue('--height'));
        fill.style.height = `${height}%`;
      });
    }, 100);
  }

  setupProgressScreenHandlers() {
    // Back button
    const backBtn = document.getElementById('progress-back-btn');
    if (backBtn) {
      backBtn.replaceWith(backBtn.cloneNode(true));
      const newBackBtn = document.getElementById('progress-back-btn');
      newBackBtn.addEventListener('click', () => {
        this.showScreen('home-screen');
      });
    }

    // View All Achievements button
    const viewAllBtn = document.getElementById('view-all-achievements-btn');
    if (viewAllBtn) {
      viewAllBtn.replaceWith(viewAllBtn.cloneNode(true));
      const newViewAllBtn = document.getElementById('view-all-achievements-btn');
      newViewAllBtn.addEventListener('click', () => {
        this.toggleAchievements();
      });
    }
  }

  // ==================== Sentence Practice Methods ====================

  /**
   * Start sentence practice session
   */
  async startSentencePractice() {
    console.log('[SENTENCES] Starting sentence practice');

    // Ensure database ready
    await ensureDatabaseReady();

    // SIMPLIFIED USER CHECK
    if (!this.currentUser || !this.currentUser.id) {
      console.log('[SENTENCES] No current user, initializing...');

      // Get profile key
      const profileKey = this.currentProfile?.key ||
                         this.profileKey ||
                         localStorage.getItem('lingxm-selected-profile') ||
                         'hassan';

      // Create or get user (returns user object with id property)
      try {
        const user = dbManager.getOrCreateUser(profileKey);

        this.currentUser = {
          id: user.id,  // Extract id from user object
          profile_key: profileKey
        };

        console.log('[SENTENCES] ✅ User initialized:', user.id);
      } catch (error) {
        console.error('[SENTENCES] Error creating user:', error);

        // Fallback: use default ID
        this.currentUser = {
          id: 1,
          profile_key: profileKey
        };

        console.log('[SENTENCES] Using fallback user ID: 1');
      }
    } else {
      console.log('[SENTENCES] Using existing user:', this.currentUser.id);
    }

    // Verify we have user ID
    const userId = this.currentUser?.id;
    if (!userId) {
      alert('Unable to initialize user. Please refresh and try again.');
      return;
    }

    console.log('[SENTENCES] User ID:', userId);

    // Get current language
    const currentLang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
    let langCode = currentLang.code;
    let langName = currentLang.name;

    // ============================================================
    // EXTRACT LEVEL AND SPECIALIZATION EARLY
    // ============================================================
    let userLevel = currentLang?.level?.toLowerCase().replace(/[-\s]/g, '') || 'b1b2';
    let specialization = currentLang?.specialization?.toLowerCase() || null;
    let levelKey = userLevel;
    if (specialization) {
      levelKey = `${userLevel}-${specialization}`;
    }

    console.log(`[SENTENCES] Language: ${langName} (${langCode})`);
    console.log(`[SENTENCES] User level: ${userLevel}${specialization ? ` (${specialization})` : ''}`);

    // Load sentences for this language WITH LEVEL
    let sentenceData = await sentenceManager.loadSentences(langCode, levelKey);

    // SMART FALLBACK: If current language has no sentences, try English
    if (!sentenceData && langCode !== 'en') {
      console.log(`[SENTENCES] No sentences for ${langCode}, trying English fallback`);

      // Find English in user's languages
      const englishLang = this.currentProfile.learningLanguages.find(l => l.code === 'en');

      if (englishLang) {
        // Extract English user's level
        const englishLevel = englishLang?.level?.toLowerCase().replace(/[-\s]/g, '') || 'b1b2';
        sentenceData = await sentenceManager.loadSentences('en', englishLevel);

        if (sentenceData) {
          console.log(`[SENTENCES] ✅ Using English sentences as fallback`);
          // Show user-friendly message
          const userConfirmed = confirm(
            `Sentence practice not yet available for ${currentLang.name}.\n\n` +
            `Would you like to practice English sentences instead?`
          );

          if (!userConfirmed) {
            return; // User declined
          }

          // Update to use English
          langCode = 'en';
          langName = 'English';
          userLevel = englishLevel;
          levelKey = englishLevel;
        }
      }
    }

    // If still no sentences available
    if (!sentenceData) {
      alert(`Sentence practice not available yet. Coming soon!`);
      return;
    }

    // ============================================================
    // DEV MODE: NO MASTERY REQUIREMENT
    // Practice sentences immediately with ANY vocabulary!
    // ============================================================
    // userId already declared at line 2828
    console.log(`[SENTENCES] Using userId:`, userId, `(type: ${typeof userId})`);

    // DEV MODE: Use all vocabulary for sentence matching (no mastery check)
    const masteredWords = this.wordData[langCode]?.map(w => w.word) || [];
    console.log(`[SENTENCES] 🎯 DEV MODE: Using all ${masteredWords.length} vocabulary words (no mastery check)`);

    // Production mode would check mastery level:
    // const progress = await dbManager.getProgress(userId, langCode);
    // const masteredWords = progress.filter(p => p.mastery_level >= 5).map(p => p.word);

    // ============================================================
    // FIND i+1 SENTENCES WITH USER'S LEVEL
    // ============================================================
    console.log(`[SENTENCES] Requesting sentences for ${langCode} at level: ${levelKey}`);

    const i1Sentences = await sentenceManager.findI1Sentences(
      langCode,
      masteredWords,
      10,
      levelKey  // PASS THE FULL LEVEL KEY (includes specialization if present)
    );

    console.log(`[SENTENCES] Found ${i1Sentences.length} i+1 sentences`);

    // Check if user has enough mastered words
    if (i1Sentences.length === 0) {
      this.showScreen('sentence-screen');
      document.getElementById('no-sentences-available').classList.remove('hidden');
      document.getElementById('btn-no-sentences-back').onclick = () => {
        this.showScreen('home-screen');
      };
      return;
    }

    // Initialize sentence session
    this.sentenceSession = {
      language: langCode,
      languageName: langName,
      sentences: i1Sentences.slice(0, 10), // Practice 10 sentences per session
      currentIndex: 0,
      selectedWord: null,
      correctCount: 0,
      incorrectCount: 0,
      masteredWords: masteredWords
    };

    // Show sentence screen
    this.showScreen('sentence-screen');
    this.renderSentenceScreen();
    this.loadNextSentence();

    // Track analytics
    this.analyticsManager.trackEvent('sentence_practice_start', {
      language: langCode,
      available_sentences: i1Sentences.length,
      mastered_words: masteredWords.length
    });
  }

  /**
   * Render sentence practice screen UI
   */
  renderSentenceScreen() {
    const session = this.sentenceSession;

    // Hide no-sentences screen if visible
    document.getElementById('no-sentences-available').classList.add('hidden');

    // Language flag mapping
    const languageFlags = {
      'en': '🇬🇧',
      'de': '🇩🇪',
      'fr': '🇫🇷',
      'ar': '🇸🇦',
      'it': '🇮🇹'
    };

    // Update session info with flag
    const languageFlag = document.getElementById('sentence-language-flag');
    if (languageFlag) {
      languageFlag.textContent = languageFlags[session.language] || '🌐';
    }
    document.getElementById('sentence-language').textContent = session.languageName;
    document.getElementById('sentence-known-count').textContent = session.masteredWords.length;

    // Initialize live stats
    document.getElementById('sentence-correct-live').textContent = '0';
    document.getElementById('sentence-incorrect-live').textContent = '0';

    // Initialize progress ring
    this.updateSentenceProgressRing();

    // Setup event handlers
    this.setupSentenceEventHandlers();
  }

  /**
   * Load and display next sentence
   */
  loadNextSentence() {
    const session = this.sentenceSession;

    if (session.currentIndex >= session.sentences.length) {
      this.showSessionComplete();
      return;
    }

    const sentence = session.sentences[session.currentIndex];
    session.selectedWord = null;
    session.answered = false; // Reset answered flag for new sentence

    console.log(`[SENTENCES] Loading sentence ${session.currentIndex + 1}/${session.sentences.length}`);
    console.log(`[SENTENCES] Target: ${sentence.target_word}, Known: ${sentence.known_percentage}%`);

    // ============================================================
    // EXTRACT SENTENCE TEXT SAFELY
    // ============================================================
    const fullSentenceText = sentence.sentence || sentence.full || sentence.text || '';

    // Safety check: Ensure we have text
    if (!fullSentenceText || typeof fullSentenceText !== 'string') {
      console.error('[SENTENCES] Invalid sentence text:', sentence);
      this.showSessionComplete(); // Skip to end
      return;
    }

    // ============================================================
    // CREATE BLANK VERSION
    // ============================================================
    const targetWord = sentence.target_word || sentence.word || '';

    // Generate blank if not provided
    let blankVersion = sentence.blank;
    if (!blankVersion) {
      // Create blank by replacing target word with _____
      if (targetWord) {
        // Try exact match first
        blankVersion = fullSentenceText.replace(targetWord, '_____');

        // If no replacement happened, try case-insensitive
        if (blankVersion === fullSentenceText) {
          const regex = new RegExp('\\b' + targetWord + '\\b', 'gi');
          blankVersion = fullSentenceText.replace(regex, '_____');
        }
      } else {
        // No target word - use first word as blank
        blankVersion = fullSentenceText.replace(/^\w+/, '_____');
      }
    }

    console.log(`[SENTENCES] Sentence text: "${fullSentenceText}"`);
    console.log(`[SENTENCES] Target word: "${targetWord}"`);
    console.log(`[SENTENCES] Blank version: "${blankVersion}"`);

    // Update progress indicator
    document.getElementById('sentence-current').textContent = session.currentIndex + 1;
    document.getElementById('sentence-total').textContent = session.sentences.length;

    // Update progress ring for new sentence
    this.updateSentenceProgressRing();

    // Update difficulty badge
    const difficultyBadge = document.getElementById('sentence-difficulty');
    difficultyBadge.textContent = sentence.difficulty || 'basic';

    // Display sentence with blank
    const sentenceText = document.getElementById('sentence-text');
    sentenceText.innerHTML = blankVersion.replace('_____', '<span class="blank">_____</span>');

    // Generate word bank (1 correct + 3 distractors)
    const allWords = this.wordData[session.language]?.map(w => w.word || w) || [];
    const wordBank = sentenceManager.generateWordBank(sentence, allWords);

    // Safety check: Ensure we have word bank
    if (!wordBank || wordBank.length === 0) {
      console.error('[SENTENCES] Failed to generate word bank for:', sentence);
      this.loadNextSentence(); // Skip to next sentence
      return;
    }

    console.log(`[SENTENCES] Word bank (${wordBank.length} words):`, wordBank);

    // Render word options
    const wordBankEl = document.getElementById('word-bank');
    wordBankEl.innerHTML = wordBank.map(word => `
      <button class="word-option" data-word="${word}">
        ${word}
      </button>
    `).join('');

    // Hide feedback, show check button
    document.getElementById('sentence-feedback').classList.add('hidden');
    document.getElementById('btn-check-answer').classList.remove('hidden');
    document.getElementById('btn-check-answer').disabled = true;
    document.getElementById('btn-next-sentence').classList.add('hidden');
  }

  /**
   * Setup event handlers for sentence screen
   */
  setupSentenceEventHandlers() {
    // Back button
    const backBtn = document.getElementById('sentence-back-btn');
    backBtn.replaceWith(backBtn.cloneNode(true));
    const newBackBtn = document.getElementById('sentence-back-btn');
    newBackBtn.addEventListener('click', () => {
      if (confirm('Exit sentence practice? Your progress will be saved.')) {
        this.showScreen('home-screen');
      }
    });

    // Word selection
    const wordBank = document.getElementById('word-bank');
    const wordBankHandler = (e) => {
      if (e.target.classList.contains('word-option')) {
        // Ignore if already answered
        if (this.sentenceSession.answered) {
          return;
        }

        // Remove previous selection
        document.querySelectorAll('.word-option').forEach(btn => {
          btn.classList.remove('selected');
        });

        // Select this word
        e.target.classList.add('selected');
        this.sentenceSession.selectedWord = e.target.getAttribute('data-word');

        // Auto-check immediately (no button needed!)
        this.checkSentenceAnswer();
      }
    };
    wordBank.replaceWith(wordBank.cloneNode(true));
    document.getElementById('word-bank').addEventListener('click', wordBankHandler);

    // Check answer button
    const checkBtn = document.getElementById('btn-check-answer');
    checkBtn.replaceWith(checkBtn.cloneNode(true));
    document.getElementById('btn-check-answer').addEventListener('click', () => this.checkSentenceAnswer());

    // Next sentence button
    const nextBtn = document.getElementById('btn-next-sentence');
    nextBtn.replaceWith(nextBtn.cloneNode(true));
    document.getElementById('btn-next-sentence').addEventListener('click', () => {
      this.sentenceSession.currentIndex++;
      this.loadNextSentence();
    });

    // Practice again button
    const practiceAgainBtn = document.getElementById('btn-practice-again');
    practiceAgainBtn.replaceWith(practiceAgainBtn.cloneNode(true));
    document.getElementById('btn-practice-again').addEventListener('click', () => {
      this.startSentencePractice();
    });

    // Back to home buttons
    document.querySelectorAll('.btn-back-home').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      newBtn.addEventListener('click', () => {
        this.showScreen('home-screen');
      });
      btn.replaceWith(newBtn);
    });
  }

  /**
   * Check if selected answer is correct
   */
  async checkSentenceAnswer() {
    const session = this.sentenceSession;
    const sentence = session.sentences[session.currentIndex];
    const selectedWord = session.selectedWord;
    const correctWord = sentence.target_word;
    const isCorrect = selectedWord === correctWord;

    // Mark as answered to prevent double-clicking
    session.answered = true;

    console.log(`[SENTENCES] Answer: ${selectedWord}, Correct: ${correctWord}, Result: ${isCorrect}`);

    // Update session stats
    if (isCorrect) {
      session.correctCount++;
    } else {
      session.incorrectCount++;
    }

    // Update database (generate ID if missing)
    const sentenceId = sentence.id || `${session.language}-${sentence.target_word || sentence.target || 'unknown'}-${Date.now()}`;
    await dbManager.updateSentenceProgress(
      this.currentUser.id,
      session.language,
      sentenceId,
      isCorrect
    );

    // Visual feedback on word options
    document.querySelectorAll('.word-option').forEach(btn => {
      const word = btn.getAttribute('data-word');
      if (word === correctWord) {
        btn.classList.add('correct');
      } else if (word === selectedWord && !isCorrect) {
        btn.classList.add('incorrect');
      }
      btn.disabled = true;
    });

    // Show compact feedback with new classes
    const feedbackEl = document.getElementById('sentence-feedback');
    const feedbackContent = feedbackEl.querySelector('.feedback-content');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackMessage = document.getElementById('feedback-message');
    const feedbackSentence = document.getElementById('feedback-full-sentence');

    feedbackEl.classList.remove('hidden');

    if (isCorrect) {
      feedbackIcon.textContent = '✓';
      feedbackIcon.className = 'feedback-icon-compact success';
      feedbackMessage.textContent = 'Correct!';
      feedbackContent.classList.add('success');
      feedbackContent.classList.remove('error');
    } else {
      feedbackIcon.textContent = '✗';
      feedbackIcon.className = 'feedback-icon-compact error';
      feedbackMessage.textContent = `Incorrect - The answer was "${correctWord}"`;
      feedbackContent.classList.add('error');
      feedbackContent.classList.remove('success');
    }

    feedbackSentence.textContent = sentence.full;

    // Update live stats
    document.getElementById('sentence-correct-live').textContent = session.correctCount;
    document.getElementById('sentence-incorrect-live').textContent = session.incorrectCount;

    // Update progress ring
    this.updateSentenceProgressRing();

    // Hide check button, show next button
    document.getElementById('btn-check-answer').classList.add('hidden');
    document.getElementById('btn-next-sentence').classList.remove('hidden');

    // Track analytics
    this.analyticsManager.trackEvent('sentence_answer', {
      language: session.language,
      correct: isCorrect,
      difficulty: sentence.difficulty
    });
  }

  /**
   * Update sentence practice progress ring animation
   */
  updateSentenceProgressRing() {
    if (!this.sentenceSession) return;

    const session = this.sentenceSession;
    const current = session.currentIndex + 1; // +1 because index is 0-based
    const total = session.sentences.length;
    const percentage = Math.round((current / total) * 100);

    // Update progress text
    const progressText = document.getElementById('sentence-progress-text');
    if (progressText) {
      progressText.textContent = `${percentage}%`;
    }

    // Update progress ring (SVG circle animation)
    const progressRing = document.getElementById('sentence-progress-ring');
    if (progressRing) {
      const radius = 26; // Must match the r value in SVG
      const circumference = 2 * Math.PI * radius; // ~163.36
      const offset = circumference - (percentage / 100) * circumference;
      progressRing.style.strokeDashoffset = offset;
    }
  }

  /**
   * Show session complete screen
   */
  showSessionComplete() {
    const session = this.sentenceSession;

    console.log('[SENTENCES] Session complete');
    console.log(`[SENTENCES] Correct: ${session.correctCount}, Incorrect: ${session.incorrectCount}`);

    // Hide practice UI, show complete screen (with null checks)
    const infoCard = document.querySelector('.sentence-info-card');
    const sentenceCard = document.querySelector('.sentence-card');
    const wordBank = document.querySelector('.word-bank-container');
    const actions = document.querySelector('.sentence-actions');

    if (infoCard) infoCard.classList.add('hidden');
    if (sentenceCard) sentenceCard.classList.add('hidden');
    if (wordBank) wordBank.classList.add('hidden');
    if (actions) actions.classList.add('hidden');

    const completeScreen = document.getElementById('session-complete');
    if (!completeScreen) {
      console.error('[SENTENCES] session-complete element not found in DOM!');
      // Fallback: just go back to home
      this.showScreen('home-screen');
      return;
    }
    completeScreen.classList.remove('hidden');

    // Calculate accuracy
    const total = session.correctCount + session.incorrectCount;
    const accuracy = total > 0 ? Math.round((session.correctCount / total) * 100) : 0;

    // Update stats (with null checks)
    const correctEl = document.getElementById('session-correct');
    const incorrectEl = document.getElementById('session-incorrect');
    const accuracyEl = document.getElementById('session-accuracy');

    if (correctEl) correctEl.textContent = session.correctCount;
    if (incorrectEl) incorrectEl.textContent = session.incorrectCount;
    if (accuracyEl) accuracyEl.textContent = accuracy + '%';

    // Track analytics
    this.analyticsManager.trackEvent('sentence_session_complete', {
      language: session.language,
      correct: session.correctCount,
      incorrect: session.incorrectCount,
      accuracy: accuracy
    });
  }

  /**
   * Add test progress for development/testing
   * Sets 50 random words to mastery level 5
   */
  async addTestProgress() {
    console.log('[TEST] Adding test progress data...');

    if (!this.currentUser) {
      console.error('[TEST] No current user');
      return;
    }

    const langCode = 'en';
    const words = this.wordData[langCode];

    if (!words || words.length === 0) {
      console.error('[TEST] No vocabulary loaded');
      return;
    }

    // Set first 50 words to mastery level 5
    for (let i = 0; i < Math.min(50, words.length); i++) {
      await dbManager.updateProgress(
        this.currentUser.id,
        langCode,
        words[i].word,
        5,  // Mastery level 5
        0   // Review count
      );
    }

    console.log('[TEST] ✅ Added mastery progress for 50 words');
    alert('Test progress added! Refresh the page and try Sentence Builder again.');
  }

  showComingSoonModal(featureName) {
    alert(`${featureName} is coming soon! 🚀\n\nThis feature is currently in development and will be available in a future update.`);
    this.analyticsManager.trackEvent('coming_soon_viewed', { feature: featureName });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  window.app = new LingXMApp();

  // Wait for app initialization to complete
  await window.app.init();

  // Expose speechManager globally for testing/debugging
  window.speechManager = window.app.speechManager;

  console.log('✅ LingXM initialized with hybrid audio system');
  console.log('💡 Debug: window.speechManager.getAudioStats() to see cache stats');
});
