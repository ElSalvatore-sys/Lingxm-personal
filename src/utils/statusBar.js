/**
 * Status Bar Configuration for iOS
 * Manages status bar styling to match app theme and provide native iOS experience
 */

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/**
 * Check if status bar API is available
 * @returns {boolean}
 */
const isStatusBarAvailable = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
};

/**
 * Theme configurations for status bar
 */
const themes = {
  light: {
    style: Style.Light,
    backgroundColor: '#ffffff',
    description: 'Light theme - dark icons on light background'
  },
  dark: {
    style: Style.Dark,
    backgroundColor: '#1a1a1a',
    description: 'Dark theme - light icons on dark background'
  },
  primary: {
    style: Style.Light,
    backgroundColor: '#667eea',
    description: 'Primary color theme'
  },
  transparent: {
    style: Style.Light,
    backgroundColor: '#00000000',
    description: 'Transparent status bar (overlays content)'
  }
};

/**
 * Configure status bar to match app theme
 * @param {'light' | 'dark' | 'primary' | 'transparent'} theme - Theme to apply
 */
export const configureStatusBar = async (theme = 'light') => {
  if (!isStatusBarAvailable()) {
    console.log('[StatusBar] Not available on this platform');
    return;
  }

  try {
    const config = themes[theme] || themes.light;

    // Set status bar style
    await StatusBar.setStyle({ style: config.style });

    // Set background color
    await StatusBar.setBackgroundColor({ color: config.backgroundColor });

    console.log(`[StatusBar] Applied ${theme} theme: ${config.description}`);
  } catch (error) {
    console.warn('[StatusBar] Configuration failed:', error);
  }
};

/**
 * Show the status bar
 */
export const showStatusBar = async () => {
  if (!isStatusBarAvailable()) return;

  try {
    await StatusBar.show();
  } catch (error) {
    console.warn('[StatusBar] Show failed:', error);
  }
};

/**
 * Hide the status bar
 */
export const hideStatusBar = async () => {
  if (!isStatusBarAvailable()) return;

  try {
    await StatusBar.hide();
  } catch (error) {
    console.warn('[StatusBar] Hide failed:', error);
  }
};

/**
 * Set status bar to overlay content (transparent)
 * @param {boolean} overlay - Whether to overlay content
 */
export const setOverlay = async (overlay = true) => {
  if (!isStatusBarAvailable()) return;

  try {
    await StatusBar.setOverlaysWebView({ overlay });
  } catch (error) {
    console.warn('[StatusBar] Set overlay failed:', error);
  }
};

/**
 * Get current status bar info
 * @returns {Promise<object>}
 */
export const getStatusBarInfo = async () => {
  if (!isStatusBarAvailable()) {
    return { visible: true, style: 'default', color: '#000000' };
  }

  try {
    const info = await StatusBar.getInfo();
    return info;
  } catch (error) {
    console.warn('[StatusBar] Get info failed:', error);
    return null;
  }
};

/**
 * Initialize status bar with default settings
 * Call this when the app starts
 */
export const initializeStatusBar = async () => {
  if (!isStatusBarAvailable()) {
    console.log('[StatusBar] Platform not supported, skipping initialization');
    return;
  }

  try {
    // Show status bar
    await showStatusBar();

    // Check if dark mode is preferred
    const isDarkMode = window.matchMedia &&
                       window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Apply appropriate theme
    await configureStatusBar(isDarkMode ? 'dark' : 'light');

    console.log('[StatusBar] Initialized successfully');
  } catch (error) {
    console.warn('[StatusBar] Initialization failed:', error);
  }
};

/**
 * Listen for theme changes and update status bar accordingly
 * @param {Function} callback - Optional callback to execute on theme change
 */
export const watchThemeChanges = (callback) => {
  if (!window.matchMedia) return;

  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleThemeChange = (e) => {
    const theme = e.matches ? 'dark' : 'light';
    configureStatusBar(theme);

    if (callback && typeof callback === 'function') {
      callback(theme);
    }
  };

  // Modern browsers
  if (darkModeQuery.addEventListener) {
    darkModeQuery.addEventListener('change', handleThemeChange);
  } else if (darkModeQuery.addListener) {
    // Fallback for older browsers
    darkModeQuery.addListener(handleThemeChange);
  }

  return () => {
    if (darkModeQuery.removeEventListener) {
      darkModeQuery.removeEventListener('change', handleThemeChange);
    } else if (darkModeQuery.removeListener) {
      darkModeQuery.removeListener(handleThemeChange);
    }
  };
};

/**
 * Contextual status bar configurations for different app screens
 */
export const screenStatusBar = {
  // Profile selection screen - use primary gradient
  profileSelection: () => configureStatusBar('light'),

  // Home screen - match theme
  home: (isDark = false) => configureStatusBar(isDark ? 'dark' : 'light'),

  // Learning screen - match theme
  learning: (isDark = false) => configureStatusBar(isDark ? 'dark' : 'light'),

  // Progress screen - match theme
  progress: (isDark = false) => configureStatusBar(isDark ? 'dark' : 'light'),

  // Modal overlays - keep current
  modal: async () => {
    // Don't change status bar for modals
    console.log('[StatusBar] Modal opened, maintaining current style');
  }
};

export default {
  configure: configureStatusBar,
  show: showStatusBar,
  hide: hideStatusBar,
  setOverlay,
  getInfo: getStatusBarInfo,
  initialize: initializeStatusBar,
  watchThemeChanges,
  screens: screenStatusBar
};
