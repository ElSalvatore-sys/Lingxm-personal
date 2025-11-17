/**
 * OnboardingManager.js
 * Orchestrates the 8-screen onboarding flow for new LingXM users
 */

import { WelcomeScreen } from './WelcomeScreen.js';
import { NativeLanguageScreen } from './NativeLanguageScreen.js';
import { LearningLanguageScreen } from './LearningLanguageScreen.js';
import { ContextLanguageScreen } from './ContextLanguageScreen.js';
import { SelfAssessmentScreen } from './SelfAssessmentScreen.js';
import { ProfileNameScreen } from './ProfileNameScreen.js';
import { SpecializationsScreen } from './SpecializationsScreen.js';
import { CompleteScreen } from './CompleteScreen.js';
import { getDatabase } from '../../utils/database.js';
import { profileManager } from '../../utils/profileManager.js';

export class OnboardingManager {
  constructor(app) {
    this.app = app;
    this.currentScreenIndex = 0;
    this.screens = [];
    this.container = null;

    // User data collected throughout onboarding
    this.userData = {
      nativeLanguage: null,
      learningLanguage: null,
      contextLanguage: null,
      level: null,
      name: null,
      emoji: '👤',
      specializations: [],
      dailyWords: 10
    };
  }

  /**
   * Initialize and start the onboarding flow
   */
  async start() {
    // Create onboarding container
    this.createContainer();

    // Initialize all screens
    this.screens = [
      new WelcomeScreen(this),
      new NativeLanguageScreen(this),
      new LearningLanguageScreen(this),
      new ContextLanguageScreen(this),
      new SelfAssessmentScreen(this),
      new ProfileNameScreen(this),
      new SpecializationsScreen(this),
      new CompleteScreen(this)
    ];

    // Show first screen
    this.showScreen(0);
  }

  /**
   * Create the onboarding container element
   */
  createContainer() {
    // Remove existing onboarding container if any
    const existing = document.getElementById('onboarding-container');
    if (existing) {
      existing.remove();
    }

    // Create new container
    this.container = document.createElement('div');
    this.container.id = 'onboarding-container';
    this.container.className = 'onboarding-container active';
    document.body.appendChild(this.container);
  }

  /**
   * Show a specific screen by index
   */
  showScreen(index) {
    if (index < 0 || index >= this.screens.length) {
      console.error('Invalid screen index:', index);
      return;
    }

    this.currentScreenIndex = index;
    const screen = this.screens[index];

    // Clear container
    this.container.innerHTML = '';

    // Render screen
    const screenElement = screen.render();
    this.container.appendChild(screenElement);

    // Add entry animation
    requestAnimationFrame(() => {
      screenElement.classList.add('active');
    });

    // Call screen's onShow hook if it exists
    if (screen.onShow) {
      screen.onShow();
    }
  }

  /**
   * Navigate to next screen
   */
  next() {
    const currentScreen = this.screens[this.currentScreenIndex];

    // Validate current screen if validation method exists
    if (currentScreen.validate && !currentScreen.validate()) {
      return;
    }

    // Collect data from current screen
    if (currentScreen.collectData) {
      currentScreen.collectData();
    }

    // Move to next screen
    if (this.currentScreenIndex < this.screens.length - 1) {
      this.showScreen(this.currentScreenIndex + 1);
    }
  }

  /**
   * Navigate to previous screen
   */
  back() {
    if (this.currentScreenIndex > 0) {
      this.showScreen(this.currentScreenIndex - 1);
    }
  }

  /**
   * Skip to a specific screen
   */
  skipTo(index) {
    this.showScreen(index);
  }

  /**
   * Set user data field
   */
  setData(field, value) {
    this.userData[field] = value;
  }

  /**
   * Get user data field
   */
  getData(field) {
    return this.userData[field];
  }

  /**
   * Activate classic mode and redirect to hardcoded profiles
   */
  activateClassicMode() {
    localStorage.setItem('lingxm-classic-mode', 'true');

    // Hide onboarding container
    if (this.container) {
      this.container.classList.remove('active');
      setTimeout(() => this.container.remove(), 300);
    }

    // Show existing profile selection screen
    this.app.showScreen('profile-selection');
  }

  /**
   * Create custom profile in database and complete onboarding
   */
  async createProfile() {
    try {
      console.log('[ONBOARDING] Creating profile with data:', this.userData);

      // Initialize ProfileManager
      await profileManager.init();

      // Prepare interface languages array
      const interfaceLanguages = this.userData.contextLanguage
        ? [this.userData.nativeLanguage, this.userData.contextLanguage]
        : [this.userData.nativeLanguage];

      // Create profile using ProfileManager
      const newProfile = await profileManager.createProfile({
        displayName: this.userData.name,
        avatarEmoji: this.userData.emoji,
        nativeLanguage: this.userData.nativeLanguage,
        interfaceLanguages: interfaceLanguages,
        settings: { theme: 'dark', auto_play: true }
      });

      console.log('[ONBOARDING] Profile created with ID:', newProfile.id);

      // Add learning language to profile
      const specialtyString = this.userData.specializations.length > 0
        ? this.userData.specializations.join(', ')
        : null;

      await profileManager.addLanguageToProfile(newProfile.id, {
        languageCode: this.userData.learningLanguage,
        languageName: this.getLanguageName(this.userData.learningLanguage),
        levelCode: this.userData.level.toLowerCase(),
        specialty: specialtyString,
        dailyWords: this.userData.dailyWords
      });

      console.log('[ONBOARDING] Language added to profile');

      // Wait a bit for database to settle (IndexedDB async operations)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify profile can be retrieved with language data
      const verifyProfile = await profileManager.getProfile(newProfile.id);

      if (!verifyProfile) {
        throw new Error('Profile creation verification failed - profile not found');
      }

      if (!verifyProfile.learningLanguages || verifyProfile.learningLanguages.length === 0) {
        throw new Error('Profile creation verification failed - no learning languages');
      }

      console.log('[ONBOARDING] ✅ Profile verified:', verifyProfile.profile_key, 'with', verifyProfile.learningLanguages.length, 'language(s)');

      // Save to localStorage
      localStorage.setItem('lingxm-active-user', newProfile.id.toString());
      localStorage.setItem('lingxm-profile-key', newProfile.profile_key);
      localStorage.setItem('lingxm-onboarding-shown', 'true');

      console.log('[ONBOARDING] Profile activated:', newProfile.id);

      // Hide onboarding container
      if (this.container) {
        this.container.classList.remove('active');
        setTimeout(() => this.container.remove(), 300);
      }

      // Load custom profile and show home screen
      await this.app.loadCustomProfile(newProfile.id);

      console.log('[ONBOARDING] ✅ Profile loaded successfully');

      return newProfile.id;
    } catch (error) {
      console.error('[ONBOARDING] ❌ Error creating profile:', error);

      // Show user-friendly error with fallback option
      const errorMessage = `
        Failed to create profile: ${error.message}
        <br><br>
        You can try again or use Classic Mode to select a pre-configured profile.
      `;

      this.showError(errorMessage);
      throw error;
    }
  }

  /**
   * Get language name from language code
   */
  getLanguageName(code) {
    const languageNames = {
      'en': 'English',
      'de': 'German',
      'ar': 'Arabic',
      'fr': 'French',
      'it': 'Italian',
      'ru': 'Russian',
      'es': 'Spanish',
      'pl': 'Polish',
      'fa': 'Persian'
    };
    return languageNames[code] || code.toUpperCase();
  }

  /**
   * Show error message
   */
  showError(message) {
    // Create error modal
    const modal = document.createElement('div');
    modal.className = 'onboarding-modal';
    modal.innerHTML = `
      <div class="onboarding-modal-content">
        <div class="onboarding-modal-icon">⚠️</div>
        <h3>Oops!</h3>
        <p>${message}</p>
        <button class="btn-primary-modern" onclick="this.closest('.onboarding-modal').remove()">
          Got it
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  }

  /**
   * Show info modal
   */
  showModal(title, message, buttonText = 'Got it') {
    const modal = document.createElement('div');
    modal.className = 'onboarding-modal';
    modal.innerHTML = `
      <div class="onboarding-modal-content">
        <div class="onboarding-modal-icon">ℹ️</div>
        <h3>${title}</h3>
        <p>${message}</p>
        <button class="btn-primary-modern" onclick="this.closest('.onboarding-modal').remove()">
          ${buttonText}
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  }
}
