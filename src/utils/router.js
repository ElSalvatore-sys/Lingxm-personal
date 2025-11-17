/**
 * Simple screen-based router for SPA navigation
 * Manages screen visibility and transitions without hash routing
 *
 * Usage:
 * ```javascript
 * import { router } from './utils/router.js';
 *
 * // Navigate to a screen
 * router.navigate('home-screen');
 *
 * // Navigate with callback
 * router.navigate('vocabulary-screen', () => {
 *   console.log('Navigated to vocabulary');
 * });
 *
 * // Go back
 * router.back();
 * ```
 */

class Router {
  constructor() {
    this.currentScreen = null;
    this.history = [];
    this.screenContainer = null;
    this.beforeNavigateCallbacks = [];
    this.afterNavigateCallbacks = [];
  }

  /**
   * Initialize router with screen container
   * @param {string|HTMLElement} container - Container selector or element
   */
  init(container = '#app') {
    if (typeof container === 'string') {
      this.screenContainer = document.querySelector(container);
    } else {
      this.screenContainer = container;
    }

    if (!this.screenContainer) {
      console.error('[Router] Container not found:', container);
    }
  }

  /**
   * Navigate to a screen
   * @param {string} screenId - Screen element ID (without #)
   * @param {Function} callback - Optional callback after navigation
   * @param {object} options - Navigation options
   */
  navigate(screenId, callback, options = {}) {
    const {
      addToHistory = true,
      transitionClass = 'fade',
      clearHistory = false
    } = options;

    // Get screen element
    const screen = document.getElementById(screenId);

    if (!screen) {
      console.error(`[Router] Screen not found: ${screenId}`);
      return false;
    }

    // Call before navigate callbacks
    this.beforeNavigateCallbacks.forEach(cb => cb(screenId, this.currentScreen));

    // Hide current screen
    if (this.currentScreen) {
      const currentElement = document.getElementById(this.currentScreen);
      if (currentElement) {
        currentElement.classList.remove('active');
      }
    }

    // Show new screen
    screen.classList.add('active');

    // Update history
    if (addToHistory && this.currentScreen) {
      if (clearHistory) {
        this.history = [];
      } else {
        this.history.push(this.currentScreen);
      }
    }

    // Update current screen
    this.currentScreen = screenId;

    // Call after navigate callbacks
    this.afterNavigateCallbacks.forEach(cb => cb(screenId));

    // Call optional callback
    if (callback && typeof callback === 'function') {
      callback();
    }

    // Emit custom event
    window.dispatchEvent(new CustomEvent('screenchange', {
      detail: { screenId, previousScreen: this.history[this.history.length - 1] }
    }));

    return true;
  }

  /**
   * Go back to previous screen
   * @param {Function} callback - Optional callback after navigation
   */
  back(callback) {
    if (this.history.length === 0) {
      console.warn('[Router] No history to go back to');
      return false;
    }

    const previousScreen = this.history.pop();
    return this.navigate(previousScreen, callback, { addToHistory: false });
  }

  /**
   * Get current screen ID
   * @returns {string|null}
   */
  getCurrentScreen() {
    return this.currentScreen;
  }

  /**
   * Get history stack
   * @returns {Array<string>}
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Check if we can go back
   * @returns {boolean}
   */
  canGoBack() {
    return this.history.length > 0;
  }

  /**
   * Register a before navigate callback
   * @param {Function} callback - Callback function(newScreenId, currentScreenId)
   */
  onBeforeNavigate(callback) {
    this.beforeNavigateCallbacks.push(callback);
  }

  /**
   * Register an after navigate callback
   * @param {Function} callback - Callback function(screenId)
   */
  onAfterNavigate(callback) {
    this.afterNavigateCallbacks.push(callback);
  }

  /**
   * Navigate to home (first screen in history or default)
   * @param {string} defaultHome - Default home screen if no history
   */
  navigateHome(defaultHome = 'home-screen') {
    if (this.history.length > 0) {
      const homeScreen = this.history[0];
      this.clearHistory();
      this.navigate(homeScreen, null, { addToHistory: false });
    } else {
      this.navigate(defaultHome, null, { clearHistory: true });
    }
  }

  /**
   * Replace current screen (navigate without adding to history)
   * @param {string} screenId - Screen element ID
   * @param {Function} callback - Optional callback
   */
  replace(screenId, callback) {
    return this.navigate(screenId, callback, { addToHistory: false });
  }

  /**
   * Show a screen (alias for navigate)
   * @param {string} screenId - Screen element ID
   */
  show(screenId) {
    return this.navigate(screenId);
  }

  /**
   * Hide a specific screen
   * @param {string} screenId - Screen element ID
   */
  hide(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.remove('active');
    }
  }

  /**
   * Hide all screens
   */
  hideAll() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
  }
}

// Export singleton instance
export const router = new Router();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    router.init();
  });
} else {
  router.init();
}

export default router;
