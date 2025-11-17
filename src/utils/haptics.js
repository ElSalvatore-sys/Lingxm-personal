/**
 * Haptic Feedback Utilities for iOS
 * Provides tactile feedback for user interactions using Capacitor Haptics plugin
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Check if haptics are available on this platform
 * @returns {boolean}
 */
const isHapticsAvailable = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Haptic feedback utility functions
 */
export const hapticFeedback = {
  /**
   * Light tap - for button presses and minor interactions
   * Use for: general button taps, navigation, tab switches
   */
  light: async () => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.warn('[Haptics] Light impact failed:', error);
    }
  },

  /**
   * Medium tap - for moderate interactions
   * Use for: profile selection, card interactions, toggle switches
   */
  medium: async () => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.warn('[Haptics] Medium impact failed:', error);
    }
  },

  /**
   * Heavy tap - for significant interactions
   * Use for: incorrect answers, deletions, important alerts
   */
  heavy: async () => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn('[Haptics] Heavy impact failed:', error);
    }
  },

  /**
   * Success notification - distinct haptic for positive feedback
   * Use for: correct answers, achievements unlocked, milestones reached
   */
  success: async () => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.warn('[Haptics] Success notification failed:', error);
    }
  },

  /**
   * Error notification - distinct haptic for negative feedback
   * Use for: incorrect answers, failed operations, validation errors
   */
  error: async () => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.warn('[Haptics] Error notification failed:', error);
    }
  },

  /**
   * Warning notification - distinct haptic for warnings
   * Use for: warnings, alerts, important information
   */
  warning: async () => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.warn('[Haptics] Warning notification failed:', error);
    }
  },

  /**
   * Selection changed - subtle feedback for selection changes
   * Use for: swipe navigation, word navigation, list scrolling
   */
  selection: async () => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (error) {
      console.warn('[Haptics] Selection feedback failed:', error);
    }
  },

  /**
   * Vibrate with a specific pattern (advanced)
   * @param {number} duration - Duration in milliseconds
   */
  vibrate: async (duration = 200) => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.warn('[Haptics] Vibrate failed:', error);
    }
  }
};

/**
 * Contextual haptic feedback for specific app interactions
 */
export const appHaptics = {
  // Vocabulary learning interactions
  correctAnswer: () => hapticFeedback.success(),
  incorrectAnswer: () => hapticFeedback.error(),
  wordSaved: () => hapticFeedback.medium(),
  wordUnsaved: () => hapticFeedback.light(),

  // Navigation interactions
  buttonPress: () => hapticFeedback.light(),
  tabSwitch: () => hapticFeedback.medium(),
  backNavigation: () => hapticFeedback.light(),
  swipeNavigation: () => hapticFeedback.light(),

  // Profile and achievement interactions
  profileSelected: () => hapticFeedback.medium(),
  achievementUnlocked: () => hapticFeedback.success(),
  levelUp: () => hapticFeedback.success(),
  streakMilestone: () => hapticFeedback.success(),

  // Settings and toggles
  toggleOn: () => hapticFeedback.light(),
  toggleOff: () => hapticFeedback.light(),
  settingChanged: () => hapticFeedback.medium(),

  // Errors and warnings
  validationError: () => hapticFeedback.error(),
  warning: () => hapticFeedback.warning(),

  // Pull to refresh
  pullToRefreshTriggered: () => hapticFeedback.light(),

  // Long press
  longPressActivated: () => hapticFeedback.medium()
};

export default hapticFeedback;
