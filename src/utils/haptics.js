/**
 * Haptic Feedback Manager for iOS
 * Provides tactile feedback for user interactions
 */
export class HapticManager {
  static isAvailable() {
    return window.Capacitor?.Plugins?.Haptics !== undefined;
  }

  /**
   * Light impact - for button taps, navigation
   */
  static async light() {
    if (!this.isAvailable()) return;

    try {
      await window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    } catch (error) {
      console.warn('[Haptics] Light impact failed:', error);
    }
  }

  /**
   * Medium impact - for selections, mode switches
   */
  static async medium() {
    if (!this.isAvailable()) return;

    try {
      await window.Capacitor.Plugins.Haptics.impact({ style: 'medium' });
    } catch (error) {
      console.warn('[Haptics] Medium impact failed:', error);
    }
  }

  /**
   * Heavy impact - for errors, important actions
   */
  static async heavy() {
    if (!this.isAvailable()) return;

    try {
      await window.Capacitor.Plugins.Haptics.impact({ style: 'heavy' });
    } catch (error) {
      console.warn('[Haptics] Heavy impact failed:', error);
    }
  }

  /**
   * Success notification - for correct answers, achievements
   */
  static async success() {
    if (!this.isAvailable()) return;

    try {
      await window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' });
    } catch (error) {
      console.warn('[Haptics] Success notification failed:', error);
    }
  }

  /**
   * Error notification - for incorrect answers
   */
  static async error() {
    if (!this.isAvailable()) return;

    try {
      await window.Capacitor.Plugins.Haptics.notification({ type: 'ERROR' });
    } catch (error) {
      console.warn('[Haptics] Error notification failed:', error);
    }
  }

  /**
   * Warning notification
   */
  static async warning() {
    if (!this.isAvailable()) return;

    try {
      await window.Capacitor.Plugins.Haptics.notification({ type: 'WARNING' });
    } catch (error) {
      console.warn('[Haptics] Warning notification failed:', error);
    }
  }

  /**
   * Selection changed - for pickers, toggles
   */
  static async selectionChanged() {
    if (!this.isAvailable()) return;

    try {
      await window.Capacitor.Plugins.Haptics.selectionChanged();
    } catch (error) {
      console.warn('[Haptics] Selection changed failed:', error);
    }
  }
}
