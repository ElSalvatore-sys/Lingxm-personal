import { PROFILES, LANGUAGE_NAMES, SECTION_LABELS } from './config.js';
import { ProgressTracker } from './utils/progress.js';
import { SpeechManager } from './utils/speech.js';
import { AchievementManager, ACHIEVEMENTS } from './utils/achievements.js';
import { AnalyticsManager } from './utils/analytics.js';

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
    this.currentWelcomeSlide = 0;
    this.autoPlayEnabled = this.loadAutoPlaySetting();
    this.currentTheme = this.loadThemeSetting();

    this.init();
  }

  init() {
    this.applyTheme();
    this.updateProfileLockIcons();
    this.updateProfileProgressRings();
    this.setupEventListeners();

    // Check for first-time visit - show welcome screen
    // DISABLED: Welcome screen popup removed
    // const welcomeShown = localStorage.getItem('lingxm-welcome-shown');
    // if (!welcomeShown) {
    //   this.showScreen('welcome-screen');
    //   this.analyticsManager.trackEvent('app_opened', { firstTime: true });
    // } else {
    //   this.showScreen('profile-selection');
    //   this.analyticsManager.trackEvent('app_opened', { firstTime: false });
    // }

    // Always go directly to profile selection
    this.showScreen('profile-selection');
    this.analyticsManager.trackEvent('app_opened', { firstTime: false });
  }

  setupEventListeners() {
    // Profile selection - setup handlers
    this.setupProfileClickHandlers();

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
      // End analytics session
      this.analyticsManager.endSession();

      if (this.progressTracker) {
        this.showProgressStats();
      }
      setTimeout(() => {
        this.showScreen('profile-selection');
        this.updateProfileProgressRings();
        this.currentProfile = null;
        this.progressTracker = null;
      }, 2000);
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
    card.addEventListener('click', (e) => {
      if (isSwiping) return;

      const cardWidth = card.offsetWidth;
      const clickX = e.clientX;

      if (clickX < cardWidth * 0.3) {
        this.previousWord();
      } else if (clickX > cardWidth * 0.7) {
        this.nextWord();
      }
    });
  }

  setupProfileClickHandlers() {
    // Re-attach profile click handlers (fixes production timing issues)
    console.log('[PIN] Setting up profile click handlers');

    document.querySelectorAll('.profile-btn').forEach(btn => {
      // Clone and replace to remove old listeners
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    });

    // Re-query and attach fresh listeners
    document.querySelectorAll('.profile-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
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

  handleSwipe(startX, endX) {
    const swipeThreshold = 50;
    const diff = startX - endX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next word
        this.animateWordTransition('left', () => this.nextWord());
      } else {
        // Swipe right - previous word
        this.animateWordTransition('right', () => this.previousWord());
      }
    }
  }

  animateWordTransition(direction, callback) {
    const wordMain = document.querySelector('.word-main');

    // Animate out
    wordMain.classList.add(`swipe-out-${direction}`);

    setTimeout(() => {
      // Execute word change
      callback();

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
    this.currentProfile = PROFILES[profileKey];
    this.profileKey = profileKey;
    this.progressTracker = new ProgressTracker(profileKey);
    this.achievementManager = new AchievementManager(profileKey);

    // Initialize database and load progress before starting session
    await this.progressTracker.initDatabase();

    // Start analytics session
    this.analyticsManager.startSession(profileKey);

    // Load word data for this profile
    await this.loadWordData();

    // Setup language buttons
    this.setupLanguageButtons();

    // Show first language's first word
    this.currentLanguageIndex = 0;
    this.currentWordIndex = 0;

    this.showScreen('learning-screen');
    this.displayCurrentWord();
    this.showProgressBar();

    // Show swipe tutorial on first visit
    // DISABLED: Swipe tutorial popup removed
    // this.showSwipeTutorial(profileKey);

    // Check for new achievements and update badge
    // DISABLED: Achievement celebration popup removed
    // this.checkNewAchievements();
    this.updateAchievementBadge();
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

  switchLanguage(langIndex) {
    if (langIndex >= this.currentProfile.learningLanguages.length) return;

    const lang = this.currentProfile.learningLanguages[langIndex];

    this.currentLanguageIndex = langIndex;
    this.currentWordIndex = 0;

    // Update active button
    document.querySelectorAll('.lang-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === langIndex);
    });

    this.displayCurrentWord();
    this.showProgressBar();

    // Track analytics
    this.analyticsManager.trackEvent('language_switched', {
      language: lang.code,
      languageName: lang.name
    });
  }

  displayCurrentWord() {
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

    // Show examples in BOTH languages with speaker buttons
    document.getElementById('example-1').innerHTML = `
      <div>
        ${word.examples[primaryLang][0]}
        <button class="speaker-btn" data-text="${word.examples[primaryLang][0]}" data-lang="${primaryLang}">
          🔊
        </button>
      </div>
      <div style="margin-top: 0.5rem; opacity: 0.8; font-size: 0.9rem;">
        ${word.examples[secondaryLang][0]}
      </div>
    `;

    document.getElementById('example-2').innerHTML = `
      <div>
        ${word.examples[primaryLang][1]}
        <button class="speaker-btn" data-text="${word.examples[primaryLang][1]}" data-lang="${primaryLang}">
          🔊
        </button>
      </div>
      <div style="margin-top: 0.5rem; opacity: 0.8; font-size: 0.9rem;">
        ${word.examples[secondaryLang][1]}
      </div>
    `;

    // Add event listeners to all speaker buttons
    this.attachSpeakerListeners();

    // Auto-play if enabled
    if (this.autoPlayEnabled && this.speechManager.isAvailable()) {
      setTimeout(() => {
        const mainSpeaker = document.querySelector('.main-word-speaker');
        if (mainSpeaker) {
          this.speakText(mainSpeaker);
        }
      }, 300);
    }

    // Update save button
    this.updateSaveButton();
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

  nextWord() {
    const lang = this.currentProfile.learningLanguages[this.currentLanguageIndex];
    const words = this.wordData[lang.code];

    if (this.currentWordIndex < words.length - 1) {
      this.currentWordIndex++;
      this.displayCurrentWord();
    }
  }

  previousWord() {
    if (this.currentWordIndex > 0) {
      this.currentWordIndex--;
      this.displayCurrentWord();
    }
  }

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
    this.updateSaveButton();

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

    // Check database if available (takes priority)
    if (this.progressTracker?.useDatabase && this.progressTracker?.userId) {
      try {
        const { dbManager } = await import('./utils/database.js');
        isSaved = dbManager.isWordSaved(
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
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

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

  speakText(buttonElement) {
    const text = buttonElement.dataset.text;
    const lang = buttonElement.dataset.lang;

    if (text && lang) {
      this.speechManager.speakWithFeedback(text, lang, buttonElement);
    }
  }

  toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      const isOpening = !modal.classList.contains('active');
      modal.classList.toggle('active');

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
    }
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
    document.querySelectorAll('.profile-btn').forEach(btn => {
      const profileKey = btn.dataset.profile;
      if (this.isPinEnabled(profileKey)) {
        btn.classList.add('pin-protected');
      } else {
        btn.classList.remove('pin-protected');
      }
    });
  }

  updateProfileProgressRings() {
    document.querySelectorAll('.profile-btn').forEach(btn => {
      const profileKey = btn.dataset.profile;
      const profile = PROFILES[profileKey];

      if (!profile) return;

      // Create temporary progress tracker to get stats
      const tempTracker = new ProgressTracker(profileKey);
      const stats = tempTracker.getStats();

      // Get the progress rings container
      const ringsContainer = btn.querySelector('.profile-progress-rings');
      if (!ringsContainer) return;

      // Clear existing content
      ringsContainer.innerHTML = '';

      // Create SVG defs for gradient (only once)
      if (!document.getElementById('progressGradient')) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'progressGradient');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#10b981');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#059669');
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);
        document.body.appendChild(svg);
      }

      // Calculate aggregate progress
      let totalWords = 0;
      let completedWords = 0;
      profile.learningLanguages.forEach(lang => {
        totalWords += 180;
        completedWords += tempTracker.getCompletedCount(lang.code);
      });
      const aggregatePercentage = Math.round((completedWords / totalWords) * 100);

      // Decide layout based on number of languages
      const langCount = profile.learningLanguages.length;

      if (langCount <= 3) {
        // Show compact individual rings for 2-3 languages
        profile.learningLanguages.forEach(lang => {
          const percentage = tempTracker.getCompletionPercentage(lang.code, 180);

          const container = document.createElement('div');
          container.className = 'progress-ring-container';
          container.title = `${lang.flag} ${lang.name}: ${percentage}%`;

          // Create smaller SVG (32px)
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.classList.add('progress-ring');
          svg.setAttribute('viewBox', '0 0 32 32');

          const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          bgCircle.classList.add('progress-ring-circle', 'progress-ring-background');
          bgCircle.setAttribute('cx', '16');
          bgCircle.setAttribute('cy', '16');
          bgCircle.setAttribute('r', '14');

          const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          progressCircle.classList.add('progress-ring-circle', 'progress-ring-progress');
          progressCircle.setAttribute('cx', '16');
          progressCircle.setAttribute('cy', '16');
          progressCircle.setAttribute('r', '14');

          const circumference = 2 * Math.PI * 14; // 87.96
          const offset = circumference - (percentage / 100) * circumference;
          progressCircle.style.strokeDashoffset = offset;

          svg.appendChild(bgCircle);
          svg.appendChild(progressCircle);

          const text = document.createElement('div');
          text.className = 'progress-ring-text';
          text.textContent = `${percentage}%`;

          container.appendChild(svg);
          container.appendChild(text);
          ringsContainer.appendChild(container);
        });
      } else {
        // Show aggregate progress summary for 4+ languages
        const summary = document.createElement('div');
        summary.className = 'profile-progress-summary';
        summary.innerHTML = `
          <div class="progress-indicator" style="--progress: ${aggregatePercentage}"></div>
          <span class="progress-text">${aggregatePercentage}% Complete</span>
        `;
        summary.title = `${completedWords} of ${totalWords} words completed`;
        ringsContainer.appendChild(summary);
      }

      // Update streak badge
      const streakBadge = btn.querySelector('.profile-streak');
      if (streakBadge && stats.currentStreak > 0) {
        streakBadge.innerHTML = `🔥 ${stats.currentStreak} days`;
        streakBadge.classList.add('active');
      } else if (streakBadge) {
        streakBadge.classList.remove('active');
      }
    });
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
    const modal = document.getElementById('achievements-modal');
    const isActive = modal.classList.contains('active');

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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new LingXMApp();
});
