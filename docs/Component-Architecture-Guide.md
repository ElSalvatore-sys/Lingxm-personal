# Component Architecture Guide

## Overview

This guide explains the new component-based architecture for the LingXM app, designed to replace the monolithic 3712-line `app.js`.

**Current Problem:**
- `app.js` is 3712 lines (monolithic, hard to maintain)
- No separation of concerns
- Difficult to test individual features
- Hard to add new features without breaking existing ones

**New Solution:**
- Component-based architecture
- Centralized state management
- Simple screen-based router
- Clear separation of concerns

---

## Architecture Overview

```
src/
├── app.js (200 lines max - orchestration only)
├── components/
│   ├── Component.js (Base class)
│   ├── ProfileCard.js
│   ├── VocabularyCard.js
│   ├── ProgressRing.js
│   ├── LanguageSelector.js
│   └── TabBar.js (iOS navigation)
├── screens/
│   ├── WelcomeScreen.js
│   ├── ProfileScreen.js
│   ├── HomeScreen.js
│   ├── VocabularyScreen.js
│   ├── SentenceScreen.js
│   └── ProgressScreen.js
├── utils/
│   ├── router.js (Screen navigation)
│   ├── state.js (State management)
│   ├── database.js (existing)
│   ├── progress.js (existing)
│   ├── haptics.js (iOS integration)
│   └── statusBar.js (iOS integration)
└── styles/
    ├── main.css
    ├── components.css
    └── ios.css
```

---

## Core Concepts

### 1. Component Base Class

All UI components extend from `Component.js`:

```javascript
import { Component } from './components/Component.js';

class MyComponent extends Component {
  render() {
    return this.createElement('div', {
      className: 'my-component'
    }, [
      this.createElement('h1', {}, 'Hello World')
    ]);
  }

  onMount() {
    console.log('Component mounted!');
  }
}

// Usage
const component = new MyComponent('#parent', { title: 'Test' });
component.mount();
```

**Lifecycle Methods:**
- `render()` - Create and return DOM element (required)
- `onMount()` - Called after component is added to DOM
- `onBeforeUpdate(oldState)` - Called before re-render
- `onUpdate()` - Called after re-render
- `onUnmount()` - Called before component is removed

**Component Methods:**
- `setState(newState)` - Update state and re-render
- `update()` - Manually trigger re-render
- `mount()` - Add component to DOM
- `unmount()` - Remove component from DOM
- `show()` / `hide()` / `toggle()` - Control visibility
- `createElement(tag, attrs, children)` - Helper for building DOM

---

### 2. State Management

Centralized reactive state using `state.js`:

```javascript
import { state } from './utils/state.js';

// Set state
state.set('currentProfile', 'vahiko');

// Get state
const profile = state.get('currentProfile');

// Subscribe to changes
const unsubscribe = state.subscribe('currentProfile', (newValue, oldValue) => {
  console.log('Profile changed:', newValue);
  // Update UI automatically
});

// Update nested objects
state.update('userPreferences', {
  theme: 'dark',
  autoPlay: true
});

// Unsubscribe when done
unsubscribe();
```

**Benefits:**
- ✅ Reactive updates (components auto-update when state changes)
- ✅ Centralized state (single source of truth)
- ✅ Auto-persistence to localStorage
- ✅ State history and undo functionality
- ✅ Middleware support

**Default State Keys:**
- `currentProfile` - Current user profile
- `currentLanguageIndex` - Active language index
- `wordData` - Vocabulary data
- `savedWords` - Bookmarked words
- `theme` - UI theme ('light' | 'dark')
- `autoPlayEnabled` - Auto-play audio setting
- `databaseReady` - Database initialization status

---

### 3. Router (Screen Navigation)

Simple screen-based routing with `router.js`:

```javascript
import { router } from './utils/router.js';

// Navigate to a screen
router.navigate('home-screen');

// Navigate with callback
router.navigate('vocabulary-screen', () => {
  console.log('Navigated to vocabulary');
});

// Go back
router.back();

// Check if can go back
if (router.canGoBack()) {
  router.back();
}

// Listen for navigation events
router.onAfterNavigate((screenId) => {
  console.log('Navigated to:', screenId);
});
```

**Router Methods:**
- `navigate(screenId, callback, options)` - Navigate to screen
- `back(callback)` - Go to previous screen
- `replace(screenId, callback)` - Replace current screen (no history)
- `navigateHome(defaultHome)` - Go to home screen
- `getCurrentScreen()` - Get current screen ID
- `canGoBack()` - Check if history exists
- `onBeforeNavigate(callback)` - Hook before navigation
- `onAfterNavigate(callback)` - Hook after navigation

---

## Migration Strategy

### Phase 1: Setup Infrastructure ✅

**Status:** Complete

Files created:
- `src/components/Component.js` - Base component class
- `src/utils/router.js` - Screen navigation system
- `src/utils/state.js` - State management system

### Phase 2: Create Example Components

Extract one component at a time from `app.js`:

#### Example: Profile Card Component

**Before (in app.js):**
```javascript
// 200 lines of profile card logic mixed with other code
setupProfileClickHandlers() {
  const profileCards = document.querySelectorAll('.profile-card');
  profileCards.forEach(card => {
    card.addEventListener('click', async () => {
      // 50 lines of click handler logic
    });
  });
}
```

**After (ProfileCard.js):**
```javascript
import { Component } from './Component.js';
import { state } from '../utils/state.js';
import { appHaptics } from '../utils/haptics.js';

export class ProfileCard extends Component {
  render() {
    const { profile, languages, streak } = this.props;

    return this.createElement('button', {
      className: 'profile-card',
      onClick: () => this.handleClick()
    }, [
      this.createElement('div', { className: 'profile-avatar' }, profile.emoji),
      this.createElement('h3', { className: 'profile-name' }, profile.name),
      this.createElement('div', { className: 'profile-streak' }, `🔥 ${streak} days`)
    ]);
  }

  async handleClick() {
    await appHaptics.profileSelected();
    state.set('currentProfile', this.props.profile.id);
  }
}
```

**Usage:**
```javascript
const card = new ProfileCard('#profiles-grid', {
  profile: { id: 'vahiko', name: 'Vahiko', emoji: '👩‍💼' },
  languages: ['de', 'en'],
  streak: 5
});
card.mount();
```

---

### Phase 3: Extract Screens

Convert screen logic from `app.js` into Screen classes.

#### Example: Vocabulary Screen

**Before (in app.js):**
```javascript
// Mixed with 3000 other lines
showVocabularyScreen() {
  // 300 lines of vocabulary logic
}
```

**After (VocabularyScreen.js):**
```javascript
import { Component } from '../components/Component.js';
import { VocabularyCard } from '../components/VocabularyCard.js';
import { state } from '../utils/state.js';
import { router } from '../utils/router.js';

export class VocabularyScreen extends Component {
  constructor(parent, props) {
    super(parent, props);

    this.state = {
      currentWordIndex: 0,
      words: []
    };

    // Subscribe to state changes
    this.unsubscribeWord = state.subscribe('currentWordIndex', (index) => {
      this.setState({ currentWordIndex: index });
    });
  }

  render() {
    const container = this.createElement('div', {
      className: 'vocabulary-screen screen',
      id: 'vocabulary-screen'
    });

    // Header
    const header = this.createElement('header', { className: 'app-header' }, [
      this.createElement('button', {
        className: 'icon-btn',
        onClick: () => router.back()
      }, '←'),
      this.createElement('h1', {}, 'Vocabulary Practice')
    ]);

    // Word card
    const wordCard = new VocabularyCard(container, {
      word: this.state.words[this.state.currentWordIndex]
    });

    container.appendChild(header);
    wordCard.mount();

    return container;
  }

  onMount() {
    this.loadWords();
  }

  onUnmount() {
    this.unsubscribeWord();
  }

  async loadWords() {
    const words = await this.fetchWords();
    this.setState({ words });
  }
}
```

---

### Phase 4: Refactor app.js

**New app.js (target: 200 lines):**

```javascript
import { router } from './utils/router.js';
import { state } from './utils/state.js';
import { dbManager } from './utils/database.js';
import { initializeIOSFeatures } from './utils/ios-integration.js';
import { ProfileScreen } from './screens/ProfileScreen.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { VocabularyScreen } from './screens/VocabularyScreen.js';

class LingXMApp {
  constructor() {
    this.screens = new Map();
    this.init();
  }

  async init() {
    console.log('[App] Initializing LingXM...');

    // Initialize database
    await this.initDatabase();

    // Initialize iOS features
    await this.initIOSFeatures();

    // Setup screens
    this.setupScreens();

    // Setup state listeners
    this.setupStateListeners();

    // Restore or show profile selection
    await this.restoreSession();

    console.log('[App] ✅ LingXM initialized');
  }

  async initDatabase() {
    await dbManager.init();
    state.set('databaseReady', true);
  }

  async initIOSFeatures() {
    await initializeIOSFeatures();
  }

  setupScreens() {
    // Register screens (lazy initialization)
    this.screens.set('profile-screen', ProfileScreen);
    this.screens.set('home-screen', HomeScreen);
    this.screens.set('vocabulary-screen', VocabularyScreen);

    // Setup router hooks
    router.onAfterNavigate((screenId) => {
      state.set('currentScreen', screenId);
    });
  }

  setupStateListeners() {
    // Listen to profile changes
    state.subscribe('currentProfile', async (profile) => {
      if (profile) {
        await this.onProfileSelected(profile);
      }
    });

    // Listen to theme changes
    state.subscribe('theme', (theme) => {
      this.applyTheme(theme);
    });
  }

  async restoreSession() {
    const savedProfile = state.get('currentProfile');

    if (savedProfile) {
      router.navigate('home-screen');
    } else {
      router.navigate('profile-screen');
    }
  }

  async onProfileSelected(profileId) {
    console.log('[App] Profile selected:', profileId);
    // Load profile data
    // Navigate to home
    router.navigate('home-screen');
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LingXMApp();
  });
} else {
  new LingXMApp();
}
```

---

## Migration Checklist

### Step 1: Infrastructure ✅
- [x] Create Component base class
- [x] Create Router system
- [x] Create State management
- [x] Document architecture

### Step 2: Extract Components (Gradual)
- [ ] ProfileCard component
- [ ] VocabularyCard component
- [ ] ProgressRing component
- [ ] LanguageSelector component
- [ ] SentencePractice component
- [ ] StatsCard component

### Step 3: Extract Screens (Gradual)
- [ ] WelcomeScreen
- [ ] ProfileScreen
- [ ] HomeScreen
- [ ] VocabularyScreen
- [ ] SentenceScreen
- [ ] ProgressScreen

### Step 4: Refactor app.js
- [ ] Move initialization logic to screens
- [ ] Replace direct DOM manipulation with components
- [ ] Use router for navigation
- [ ] Use state for data management
- [ ] Reduce to ~200 lines

### Step 5: Testing
- [ ] Test each migrated component
- [ ] Test screen transitions
- [ ] Test state persistence
- [ ] Test all user flows
- [ ] Performance testing

---

## Best Practices

### 1. Component Design
- ✅ Keep components small and focused (single responsibility)
- ✅ Use props for configuration
- ✅ Use state for internal component state
- ✅ Use global state (state.js) for app-wide data
- ✅ Clean up in `onUnmount()` (event listeners, subscriptions)

### 2. State Management
- ✅ Use descriptive state keys
- ✅ Subscribe to state changes for reactive updates
- ✅ Unsubscribe when component unmounts
- ✅ Use `update()` for nested object updates
- ✅ Keep state normalized (avoid deep nesting)

### 3. Navigation
- ✅ Use router for all screen changes
- ✅ Use `back()` instead of manually showing previous screen
- ✅ Add navigation guards with `onBeforeNavigate` if needed
- ✅ Emit custom events for cross-component communication

### 4. Performance
- ✅ Avoid unnecessary re-renders
- ✅ Clean up event listeners and subscriptions
- ✅ Use lazy loading for screens
- ✅ Debounce expensive operations

---

## Examples

### Example 1: Reactive Component

```javascript
import { Component } from './components/Component.js';
import { state } from './utils/state.js';

class WordCounter extends Component {
  constructor(parent, props) {
    super(parent, props);

    // Subscribe to word count changes
    this.unsubscribe = state.subscribe('wordCount', (count) => {
      this.setState({ count });
    });

    this.state = {
      count: state.get('wordCount', 0)
    };
  }

  render() {
    return this.createElement('div', {
      className: 'word-counter'
    }, `Words learned: ${this.state.count}`);
  }

  onUnmount() {
    // Clean up subscription
    this.unsubscribe();
  }
}
```

### Example 2: Screen with Multiple Components

```javascript
import { Component } from '../components/Component.js';
import { Header } from '../components/Header.js';
import { WordCard } from '../components/WordCard.js';
import { Footer } from '../components/Footer.js';

export class VocabularyScreen extends Component {
  render() {
    const screen = this.createElement('div', {
      id: 'vocabulary-screen',
      className: 'screen'
    });

    // Add header
    const header = new Header(screen, { title: 'Vocabulary' });
    header.mount();
    this.addChild(header);

    // Add word card
    const wordCard = new WordCard(screen, {
      word: this.props.word
    });
    wordCard.mount();
    this.addChild(wordCard);

    // Add footer
    const footer = new Footer(screen);
    footer.mount();
    this.addChild(footer);

    return screen;
  }
}
```

### Example 3: Component Communication

```javascript
// Using state for component communication
import { state } from './utils/state.js';

// Component A: Update state
class SaveButton extends Component {
  handleClick() {
    state.set('wordSaved', true);
  }
}

// Component B: React to state change
class SavedIndicator extends Component {
  constructor(parent, props) {
    super(parent, props);

    this.unsubscribe = state.subscribe('wordSaved', (saved) => {
      this.setState({ saved });
    });
  }

  render() {
    return this.createElement('div', {
      className: this.state.saved ? 'saved' : ''
    }, this.state.saved ? '✓ Saved' : 'Not saved');
  }

  onUnmount() {
    this.unsubscribe();
  }
}
```

---

## Troubleshooting

### Component Not Rendering
- Check that `render()` returns an HTMLElement
- Verify parent element exists
- Check console for errors

### State Not Updating
- Verify you're using `state.set()` not directly modifying `state.state`
- Check that you subscribed to the correct key
- Ensure subscription callback is being called

### Memory Leaks
- Always unsubscribe from state in `onUnmount()`
- Remove event listeners in `onUnmount()`
- Clear intervals/timeouts in `onUnmount()`

### Router Not Working
- Ensure screen elements have correct IDs
- Check that screens have class "screen"
- Verify router is initialized

---

## Next Steps

1. **Start Small**: Extract one small component (e.g., ProfileCard)
2. **Test**: Ensure it works before moving on
3. **Iterate**: Extract more components gradually
4. **Refactor**: Simplify app.js as you extract logic
5. **Document**: Add JSDoc comments to new components

---

## Resources

- Component Base Class: `src/components/Component.js`
- Router Documentation: `src/utils/router.js`
- State Management: `src/utils/state.js`
- iOS Integration Guide: `docs/iOS-Implementation-Summary.md`

---

**Ready to modernize the codebase!** 🏗️

Start by extracting one component and gradually migrate the rest. The new architecture will make the app much easier to maintain and extend.
