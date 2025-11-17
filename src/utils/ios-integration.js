/**
 * iOS Integration Guide
 * This file demonstrates how to integrate haptics, gestures, and iOS features into the app
 *
 * USAGE: Import this file in app.js and call initializeIOSFeatures()
 */

import { appHaptics } from './haptics.js';
import { initializeStatusBar, watchThemeChanges } from './statusBar.js';
import { addSwipeGestures, addPullToRefresh } from './gestures.js';
import tabBar from '../components/TabBar.js';

/**
 * Initialize all iOS features
 */
export async function initializeIOSFeatures() {
  console.log('[iOS] Initializing iOS native features...');

  // 1. Initialize status bar
  await initializeStatusBar();

  // 2. Watch for theme changes
  watchThemeChanges((theme) => {
    console.log(`[iOS] Theme changed to: ${theme}`);
  });

  // 3. Initialize tab bar (optional - can be enabled/disabled)
  // Uncomment to enable tab bar navigation:
  // tabBar.create();
  // tabBar.hide(); // Hidden by default, show when appropriate

  console.log('[iOS] iOS features initialized successfully');
}

/**
 * Add haptic feedback to existing UI elements
 * Call this function after DOM is ready
 */
export function integrateHapticFeedback() {
  console.log('[iOS] Integrating haptic feedback...');

  // Button presses
  document.querySelectorAll('button, .btn, .icon-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      // Skip if button is disabled
      if (button.disabled) return;

      // Determine haptic type based on button class
      if (button.classList.contains('profile-card')) {
        await appHaptics.profileSelected();
      } else if (button.classList.contains('home-card')) {
        await appHaptics.tabSwitch();
      } else {
        await appHaptics.buttonPress();
      }
    });
  });

  // Toggle switches
  document.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        await appHaptics.toggleOn();
      } else {
        await appHaptics.toggleOff();
      }
    });
  });

  // Save word button (star icon)
  const saveButton = document.getElementById('save-word-btn');
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const isSaved = saveButton.classList.contains('saved');
      if (isSaved) {
        await appHaptics.wordUnsaved();
      } else {
        await appHaptics.wordSaved();
      }
    });
  }

  console.log('[iOS] Haptic feedback integrated');
}

/**
 * Add swipe gestures to word card for navigation
 */
export function integrateSwipeGestures() {
  console.log('[iOS] Integrating swipe gestures...');

  const wordCard = document.getElementById('word-card');
  if (wordCard) {
    const swipeHandler = addSwipeGestures(wordCard, {
      onSwipeLeft: async () => {
        console.log('[iOS] Swiped left - next word');
        // Trigger next word navigation
        const event = new CustomEvent('navigate-word', { detail: { direction: 'next' } });
        window.dispatchEvent(event);
      },
      onSwipeRight: async () => {
        console.log('[iOS] Swiped right - previous word');
        // Trigger previous word navigation
        const event = new CustomEvent('navigate-word', { detail: { direction: 'previous' } });
        window.dispatchEvent(event);
      }
    });

    console.log('[iOS] Swipe gestures added to word card');
  }

  // Add swipe gestures to sentence cards if they exist
  const sentenceCard = document.getElementById('sentence-card');
  if (sentenceCard) {
    addSwipeGestures(sentenceCard, {
      onSwipeLeft: async () => {
        console.log('[iOS] Swiped left - next sentence');
        const event = new CustomEvent('navigate-sentence', { detail: { direction: 'next' } });
        window.dispatchEvent(event);
      }
    });
  }
}

/**
 * Add pull-to-refresh to progress screen
 */
export function integratePullToRefresh() {
  console.log('[iOS] Integrating pull-to-refresh...');

  const progressScreen = document.querySelector('#progress-screen .progress-dashboard');
  if (progressScreen) {
    const pullToRefreshHandler = addPullToRefresh(progressScreen, async () => {
      console.log('[iOS] Refreshing progress data...');

      // Trigger progress refresh
      const event = new CustomEvent('refresh-progress');
      window.dispatchEvent(event);

      // Simulate async refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    console.log('[iOS] Pull-to-refresh added to progress screen');
  }
}

/**
 * Add haptic feedback for vocabulary interactions
 */
export function integrateVocabularyHaptics() {
  // Listen for correct/incorrect answer events
  window.addEventListener('answer-correct', async () => {
    await appHaptics.correctAnswer();
  });

  window.addEventListener('answer-incorrect', async () => {
    await appHaptics.incorrectAnswer();
  });

  // Listen for achievement unlocked events
  window.addEventListener('achievement-unlocked', async () => {
    await appHaptics.achievementUnlocked();
  });

  // Listen for level up events
  window.addEventListener('level-up', async () => {
    await appHaptics.levelUp();
  });

  console.log('[iOS] Vocabulary haptics integrated');
}

/**
 * Complete iOS integration
 * Call this function when the app is fully loaded
 */
export async function completeIOSIntegration() {
  await initializeIOSFeatures();
  integrateHapticFeedback();
  integrateSwipeGestures();
  integratePullToRefresh();
  integrateVocabularyHaptics();

  console.log('[iOS] ✅ Complete iOS integration finished');
}

/**
 * Example: How to use haptics in your code
 *
 * // Correct answer
 * await appHaptics.correctAnswer();
 *
 * // Incorrect answer
 * await appHaptics.incorrectAnswer();
 *
 * // Button press
 * await appHaptics.buttonPress();
 *
 * // Tab switch
 * await appHaptics.tabSwitch();
 *
 * // Word saved
 * await appHaptics.wordSaved();
 *
 * // Profile selected
 * await appHaptics.profileSelected();
 *
 * // Achievement unlocked
 * await appHaptics.achievementUnlocked();
 */

export default {
  initializeIOSFeatures,
  integrateHapticFeedback,
  integrateSwipeGestures,
  integratePullToRefresh,
  integrateVocabularyHaptics,
  completeIOSIntegration
};
