/**
 * iOS-Style Tab Bar Component
 * Bottom navigation bar with haptic feedback and native iOS feel
 */

import { appHaptics } from '../utils/haptics.js';

/**
 * Tab configuration
 */
const tabs = [
  {
    id: 'vocabulary',
    icon: '📚',
    label: 'Vocabulary',
    screen: 'learning-screen'
  },
  {
    id: 'practice',
    icon: '✍️',
    label: 'Practice',
    screen: 'sentence-screen'
  },
  {
    id: 'progress',
    icon: '📊',
    label: 'Progress',
    screen: 'progress-screen'
  }
];

/**
 * TabBar class - manages the iOS-style bottom tab bar
 */
class TabBar {
  constructor() {
    this.currentTab = 'vocabulary';
    this.tabBarElement = null;
    this.isVisible = false;
  }

  /**
   * Create and inject the tab bar into the DOM
   */
  create() {
    // Create tab bar container
    this.tabBarElement = document.createElement('div');
    this.tabBarElement.className = 'ios-tab-bar';
    this.tabBarElement.id = 'ios-tab-bar';

    // Create tab items
    tabs.forEach(tab => {
      const tabItem = this.createTabItem(tab);
      this.tabBarElement.appendChild(tabItem);
    });

    // Append to app
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.appendChild(this.tabBarElement);
    }

    return this.tabBarElement;
  }

  /**
   * Create a single tab item
   * @param {Object} tab - Tab configuration
   * @returns {HTMLElement}
   */
  createTabItem(tab) {
    const tabItem = document.createElement('button');
    tabItem.className = 'tab-item';
    tabItem.dataset.tab = tab.id;
    tabItem.setAttribute('aria-label', tab.label);

    // Tab icon
    const icon = document.createElement('span');
    icon.className = 'tab-icon';
    icon.textContent = tab.icon;

    // Tab label
    const label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = tab.label;

    // Assemble tab item
    tabItem.appendChild(icon);
    tabItem.appendChild(label);

    // Add click handler
    tabItem.addEventListener('click', async () => {
      await this.selectTab(tab.id);
    });

    return tabItem;
  }

  /**
   * Select a tab and navigate to its screen
   * @param {string} tabId - Tab identifier
   */
  async selectTab(tabId) {
    // Haptic feedback
    await appHaptics.tabSwitch();

    // Update active state
    this.currentTab = tabId;
    this.updateActiveState();

    // Find the tab configuration
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Navigate to the screen
    this.navigateToScreen(tab.screen);

    // Emit custom event
    window.dispatchEvent(new CustomEvent('tabchange', {
      detail: { tabId, screen: tab.screen }
    }));
  }

  /**
   * Update active state of tabs
   */
  updateActiveState() {
    if (!this.tabBarElement) return;

    const tabItems = this.tabBarElement.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
      if (item.dataset.tab === this.currentTab) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      }
    });
  }

  /**
   * Navigate to a screen
   * @param {string} screenId - Screen element ID
   */
  navigateToScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
      screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
      targetScreen.classList.add('has-tab-bar'); // Add class for bottom padding
    }
  }

  /**
   * Show the tab bar
   */
  show() {
    if (this.tabBarElement) {
      this.tabBarElement.style.display = 'flex';
      this.isVisible = true;
    }
  }

  /**
   * Hide the tab bar
   */
  hide() {
    if (this.tabBarElement) {
      this.tabBarElement.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * Set a badge on a tab
   * @param {string} tabId - Tab identifier
   * @param {number|string} value - Badge value (number or text)
   */
  setBadge(tabId, value) {
    if (!this.tabBarElement) return;

    const tabItem = this.tabBarElement.querySelector(`[data-tab="${tabId}"]`);
    if (!tabItem) return;

    // Remove existing badge
    const existingBadge = tabItem.querySelector('.tab-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // Add new badge if value is provided
    if (value) {
      const badge = document.createElement('span');
      badge.className = 'tab-badge';
      badge.textContent = value;
      tabItem.appendChild(badge);
    }
  }

  /**
   * Clear badge from a tab
   * @param {string} tabId - Tab identifier
   */
  clearBadge(tabId) {
    this.setBadge(tabId, null);
  }

  /**
   * Enable or disable a tab
   * @param {string} tabId - Tab identifier
   * @param {boolean} enabled - Whether the tab should be enabled
   */
  setTabEnabled(tabId, enabled) {
    if (!this.tabBarElement) return;

    const tabItem = this.tabBarElement.querySelector(`[data-tab="${tabId}"]`);
    if (!tabItem) return;

    if (enabled) {
      tabItem.disabled = false;
      tabItem.classList.remove('disabled');
    } else {
      tabItem.disabled = true;
      tabItem.classList.add('disabled');
    }
  }

  /**
   * Get the currently active tab
   * @returns {string}
   */
  getCurrentTab() {
    return this.currentTab;
  }

  /**
   * Destroy the tab bar
   */
  destroy() {
    if (this.tabBarElement && this.tabBarElement.parentNode) {
      this.tabBarElement.parentNode.removeChild(this.tabBarElement);
    }
    this.tabBarElement = null;
    this.isVisible = false;
  }
}

/**
 * Create and export a singleton instance
 */
const tabBar = new TabBar();

/**
 * Initialize the tab bar when DOM is ready
 */
export function initializeTabBar() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      tabBar.create();
    });
  } else {
    tabBar.create();
  }
}

/**
 * Export the tab bar instance and utilities
 */
export default tabBar;

export {
  tabs,
  TabBar
};
