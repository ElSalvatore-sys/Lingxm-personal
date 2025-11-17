/**
 * Simple reactive state management for LingXM app
 * Provides centralized state with subscription-based updates
 *
 * Usage:
 * ```javascript
 * import { state } from './utils/state.js';
 *
 * // Set state
 * state.set('currentProfile', 'vahiko');
 *
 * // Get state
 * const profile = state.get('currentProfile');
 *
 * // Subscribe to changes
 * const unsubscribe = state.subscribe('currentProfile', (newValue, oldValue) => {
 *   console.log('Profile changed from', oldValue, 'to', newValue);
 * });
 *
 * // Unsubscribe
 * unsubscribe();
 * ```
 */

class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.middleware = [];
    this.history = new Map();
    this.maxHistorySize = 10;
  }

  /**
   * Set state value
   * @param {string} key - State key
   * @param {*} value - State value
   * @param {object} options - Options (silent: skip listeners, saveHistory: save to history)
   */
  set(key, value, options = {}) {
    const { silent = false, saveHistory = false } = options;

    const oldValue = this.state[key];

    // Check if value actually changed
    if (oldValue === value) {
      return;
    }

    // Save to history if requested
    if (saveHistory) {
      this.saveToHistory(key, oldValue);
    }

    // Run middleware
    let processedValue = value;
    for (const middlewareFn of this.middleware) {
      processedValue = middlewareFn(key, processedValue, oldValue);
    }

    // Update state
    this.state[key] = processedValue;

    // Notify listeners (unless silent)
    if (!silent && this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          callback(processedValue, oldValue);
        } catch (error) {
          console.error(`[State] Error in listener for "${key}":`, error);
        }
      });
    }

    // Emit global state change event
    if (!silent) {
      window.dispatchEvent(new CustomEvent('statechange', {
        detail: { key, value: processedValue, oldValue }
      }));
    }
  }

  /**
   * Get state value
   * @param {string} key - State key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*}
   */
  get(key, defaultValue = undefined) {
    return this.state.hasOwnProperty(key) ? this.state[key] : defaultValue;
  }

  /**
   * Check if state key exists
   * @param {string} key - State key
   * @returns {boolean}
   */
  has(key) {
    return this.state.hasOwnProperty(key);
  }

  /**
   * Delete state key
   * @param {string} key - State key
   */
  delete(key) {
    const oldValue = this.state[key];
    delete this.state[key];

    // Notify listeners
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        callback(undefined, oldValue);
      });
    }
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Callback function(newValue, oldValue)
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).delete(callback);

        // Clean up empty listener sets
        if (this.listeners.get(key).size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Subscribe to multiple keys
   * @param {Array<string>} keys - Array of state keys
   * @param {Function} callback - Callback function(changes)
   * @returns {Function} Unsubscribe function
   */
  subscribeToMany(keys, callback) {
    const unsubscribers = keys.map(key => {
      return this.subscribe(key, (newValue, oldValue) => {
        callback({ key, newValue, oldValue });
      });
    });

    // Return function to unsubscribe from all
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Update nested state (for objects)
   * @param {string} key - State key
   * @param {object} updates - Updates to merge
   */
  update(key, updates) {
    const current = this.get(key);

    if (typeof current === 'object' && current !== null) {
      this.set(key, { ...current, ...updates });
    } else {
      console.warn(`[State] Cannot update non-object state: ${key}`);
    }
  }

  /**
   * Reset state to initial values
   * @param {object} initialState - Initial state object
   */
  reset(initialState = {}) {
    this.state = { ...initialState };

    // Notify all listeners
    this.listeners.forEach((callbacks, key) => {
      const value = this.state[key];
      callbacks.forEach(callback => callback(value, undefined));
    });
  }

  /**
   * Get all state
   * @returns {object}
   */
  getAll() {
    return { ...this.state };
  }

  /**
   * Set multiple state values at once
   * @param {object} updates - State updates
   * @param {boolean} silent - Skip listeners
   */
  setMany(updates, silent = false) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value, { silent });
    });
  }

  /**
   * Add middleware function
   * Middleware runs before state is updated
   * @param {Function} middlewareFn - Middleware function(key, value, oldValue) => newValue
   */
  addMiddleware(middlewareFn) {
    this.middleware.push(middlewareFn);
  }

  /**
   * Save current value to history
   * @param {string} key - State key
   * @param {*} value - Value to save
   */
  saveToHistory(key, value) {
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }

    const history = this.history.get(key);
    history.push(value);

    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Get history for a key
   * @param {string} key - State key
   * @returns {Array}
   */
  getHistory(key) {
    return this.history.get(key) || [];
  }

  /**
   * Undo last change for a key
   * @param {string} key - State key
   */
  undo(key) {
    const history = this.history.get(key);

    if (history && history.length > 0) {
      const previousValue = history.pop();
      this.set(key, previousValue, { silent: false, saveHistory: false });
    }
  }

  /**
   * Persist state to localStorage
   * @param {Array<string>} keys - Keys to persist (empty = all keys)
   * @param {string} storageKey - localStorage key
   */
  persist(keys = [], storageKey = 'lingxm-state') {
    const stateToPersist = keys.length > 0
      ? keys.reduce((acc, key) => {
          if (this.has(key)) {
            acc[key] = this.get(key);
          }
          return acc;
        }, {})
      : this.state;

    try {
      localStorage.setItem(storageKey, JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('[State] Failed to persist state:', error);
    }
  }

  /**
   * Restore state from localStorage
   * @param {string} storageKey - localStorage key
   * @param {boolean} merge - Merge with existing state or replace
   */
  restore(storageKey = 'lingxm-state', merge = true) {
    try {
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const parsedState = JSON.parse(stored);

        if (merge) {
          this.setMany(parsedState, true);
        } else {
          this.reset(parsedState);
        }

        return true;
      }
    } catch (error) {
      console.error('[State] Failed to restore state:', error);
    }

    return false;
  }
}

// Export singleton instance
export const state = new StateManager();

// Initialize default app state
state.setMany({
  // User & Profile
  currentProfile: null,
  currentLanguageIndex: 0,
  currentLanguage: null,

  // Vocabulary
  currentWordIndex: 0,
  wordData: {},
  savedWords: [],

  // Practice
  currentSentenceIndex: 0,
  sentenceData: {},
  practiceMode: 'vocabulary', // 'vocabulary' | 'sentences'

  // UI State
  theme: 'dark',
  autoPlayEnabled: false,
  currentScreen: null,

  // Database
  databaseReady: false,

  // Loading states
  isLoading: false,
  loadingMessage: '',

  // Error states
  error: null,
  errorMessage: ''
}, true); // Silent initialization

// Add localStorage persistence middleware
state.addMiddleware((key, value, oldValue) => {
  // Auto-persist certain keys
  const persistKeys = ['theme', 'autoPlayEnabled', 'currentProfile'];

  if (persistKeys.includes(key)) {
    try {
      localStorage.setItem(`lingxm-${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`[State] Failed to persist ${key}:`, error);
    }
  }

  return value; // Return unchanged
});

// Restore persisted state on initialization
['theme', 'autoPlayEnabled', 'currentProfile'].forEach(key => {
  try {
    const stored = localStorage.getItem(`lingxm-${key}`);
    if (stored) {
      state.set(key, JSON.parse(stored), { silent: true });
    }
  } catch (error) {
    console.error(`[State] Failed to restore ${key}:`, error);
  }
});

export default state;
