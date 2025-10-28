import { PROFILES, LANGUAGE_NAMES } from './config.js';
import { ProgressTracker } from './utils/progress.js';
import { SpeechManager } from './utils/speech.js';

class LingXMApp {
  constructor() {
    this.currentProfile = null;
    this.currentLanguageIndex = 0;
    this.currentWordIndex = 0;
    this.wordData = {};
    this.savedWords = this.loadSavedWords();
    this.progressTracker = null;
    this.speechManager = new SpeechManager();
    this.autoPlayEnabled = this.loadAutoPlaySetting();
    this.currentTheme = this.loadThemeSetting();

    this.init();
  }

  init() {
    this.applyTheme();
    this.setupEventListeners();
    this.showScreen('profile-selection');
  }

  setupEventListeners() {
    // Profile selection
    document.querySelectorAll('.profile-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const profile = e.currentTarget.dataset.profile;
        this.selectProfile(profile);
      });
    });

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
      if (this.progressTracker) {
        this.showProgressStats();
      }
      setTimeout(() => {
        this.showScreen('profile-selection');
        this.currentProfile = null;
        this.progressTracker = null;
      }, 2000);
    });

    // Save word button
    document.getElementById('save-word-btn').addEventListener('click', () => {
      this.toggleSaveWord();
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

    // Speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = e.currentTarget.dataset.speed;
        this.setSpeed(speed);
      });
    });

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const langIndex = parseInt(e.currentTarget.dataset.lang);
        this.switchLanguage(langIndex);
      });
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
  }

  async loadWordData() {
    // For now, we'll use placeholder data
    // In next steps, we'll generate real data
    this.wordData = {};

    for (const lang of this.currentProfile.learningLanguages) {
      try {
        const response = await fetch(`/data/${this.profileKey}/${lang.code}.json`);
        this.wordData[lang.code] = await response.json();
      } catch (error) {
        console.log(`Creating placeholder for ${lang.code}`);
        this.wordData[lang.code] = this.createPlaceholderData(lang);
      }
    }
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

    this.currentLanguageIndex = langIndex;
    this.currentWordIndex = 0;

    // Update active button
    document.querySelectorAll('.lang-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === langIndex);
    });

    this.displayCurrentWord();
    this.showProgressBar();
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

    // Record study session
    if (this.progressTracker) {
      this.progressTracker.recordStudySession(lang.code, 1);
      this.progressTracker.markWordCompleted(lang.code, this.currentWordIndex);
    }

    // Update header
    const levelText = lang.specialty ? `${lang.level} - ${lang.specialty}` : lang.level;
    document.getElementById('current-lang').textContent = `${this.currentProfile.emoji} ${this.currentProfile.name} • ${lang.flag} ${lang.name} ${levelText}`;
    document.getElementById('word-counter').textContent =
      `${this.currentWordIndex + 1}/${words.length}`;

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
      modal.classList.toggle('active');

      // Update UI with current settings
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.checked = this.currentTheme === 'light';
      }

      const autoPlayToggle = document.getElementById('autoplay-toggle');
      if (autoPlayToggle) {
        autoPlayToggle.checked = this.autoPlayEnabled;
      }

      const speedButtons = document.querySelectorAll('.speed-btn');
      speedButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.speed === this.speechManager.currentSpeed);
      });
    }
  }

  toggleAutoPlay() {
    this.autoPlayEnabled = !this.autoPlayEnabled;
    this.saveAutoPlaySetting();
    console.log(`Auto-play ${this.autoPlayEnabled ? 'enabled' : 'disabled'}`);
  }

  setSpeed(speed) {
    this.speechManager.setSpeed(speed);
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.speed === speed);
    });
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new LingXMApp();
});
