# Refactoring Examples: From Monolith to Components

This document shows concrete examples of how to extract code from the monolithic `app.js` (3712 lines) into clean, reusable components.

---

## Example 1: Profile Card

### Before (Monolithic app.js)

Scattered across multiple methods in `app.js`:

```javascript
class LingXMApp {
  // Lines 97-150
  setupProfileClickHandlers() {
    const profileCards = document.querySelectorAll('.profile-card');
    profileCards.forEach(card => {
      card.addEventListener('click', async (e) => {
        const profileId = card.dataset.profile;
        const hasPin = localStorage.getItem(`lingxm-pin-${profileId}`);

        if (hasPin) {
          this.showPINModal(profileId, 'verify');
          return;
        }

        await this.selectProfile(profileId);
      });
    });
  }

  // Lines 450-500
  async updateProfileProgressRings() {
    for (const profileId of Object.keys(PROFILES)) {
      const ring = document.querySelector(
        `.profile-card[data-profile="${profileId}"] .progress-ring-circle`
      );

      if (!ring) continue;

      const progress = await this.progressTracker.getProfileProgress(profileId);
      const percentage = progress.totalProgress || 0;
      const circumference = 339.292;
      const offset = circumference - (circumference * percentage) / 100;

      ring.style.strokeDashoffset = offset;
      ring.setAttribute('data-percentage', percentage);
    }
  }

  // Lines 600-650
  updateProfileLockIcons() {
    const profileCards = document.querySelectorAll('.profile-card');

    profileCards.forEach(card => {
      const profileId = card.dataset.profile;
      const hasPin = localStorage.getItem(`lingxm-pin-${profileId}`);

      if (hasPin) {
        card.classList.add('pin-protected');
      } else {
        card.classList.remove('pin-protected');
      }
    });
  }
}
```

**Problems:**
- Logic spread across multiple methods (150+ lines)
- Direct DOM manipulation scattered throughout
- Difficult to test
- Hard to reuse
- Tightly coupled to app.js

---

### After (Component-Based)

**File: `src/components/ProfileCard.js`** (50 lines, reusable)

```javascript
import { Component } from './Component.js';
import { state } from '../utils/state.js';
import { appHaptics } from '../utils/haptics.js';

export class ProfileCard extends Component {
  render() {
    const { profile, progress, locked, streak } = this.props;

    return this.createElement('button', {
      className: `profile-card ${locked ? 'pin-protected' : ''}`,
      onClick: () => this.handleClick()
    }, [
      this.createProgressRing(progress),
      this.createAvatar(profile.emoji, locked),
      this.createLanguageIndicators(profile.languages),
      this.createElement('h3', {}, profile.name),
      this.createStreakBadge(streak)
    ]);
  }

  async handleClick() {
    await appHaptics.profileSelected();

    if (this.props.locked) {
      this.emit('show-pin-modal', { profileId: this.props.profile.id });
    } else {
      state.set('currentProfile', this.props.profile.id);
    }
  }

  createProgressRing(percentage) {
    // SVG progress ring creation (10 lines)
    // ...
  }
}
```

**Benefits:**
- ✅ Single responsibility (profile card only)
- ✅ Self-contained (50 lines vs 150+ scattered)
- ✅ Reusable (can create multiple cards easily)
- ✅ Testable (can test in isolation)
- ✅ Clean separation of concerns

---

## Example 2: Screen Navigation

### Before (Monolithic app.js)

```javascript
class LingXMApp {
  // Lines 200-250
  showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    // Show target screen
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
    }

    // Update current screen
    this.currentScreen = screenId;

    // Screen-specific logic
    if (screenId === 'home-screen') {
      this.updateHomeScreen();
      this.updateLanguageSelector();
    } else if (screenId === 'learning-screen') {
      this.loadWordData();
      this.displayWord();
      this.setupSwipeGestures();
    } else if (screenId === 'progress-screen') {
      this.renderProgressDashboard();
      this.loadAchievements();
    }

    // Analytics
    this.analyticsManager.trackEvent('screen_view', { screen: screenId });
  }

  // Lines 300-350 - Mixed with other code
  backToHome() {
    this.showScreen('home-screen');
    this.currentWordIndex = 0;
    this.currentSentenceIndex = 0;
  }

  backToProfileSelection() {
    this.showScreen('profile-selection');
    this.currentProfile = null;
    localStorage.removeItem('lingxm-current-profile');
  }
}
```

**Problems:**
- Navigation logic mixed with screen initialization
- No history tracking
- Hard to implement back button correctly
- Difficult to add navigation guards
- Analytics scattered throughout

---

### After (Router-Based)

**File: `src/utils/router.js`** (150 lines, centralized)

```javascript
import { router } from './utils/router.js';

// Simple, clean navigation
router.navigate('home-screen');

// Automatic history tracking
router.back();

// Navigation guards
router.onBeforeNavigate((newScreen, currentScreen) => {
  console.log(`Navigating from ${currentScreen} to ${newScreen}`);

  // Add analytics automatically
  analyticsManager.trackEvent('screen_view', { screen: newScreen });
});

// Navigation hooks
router.onAfterNavigate((screenId) => {
  // Screen-specific initialization moved to screen classes
  const screenInstance = screens.get(screenId);
  if (screenInstance && screenInstance.onNavigatedTo) {
    screenInstance.onNavigatedTo();
  }
});
```

**Benefits:**
- ✅ Centralized navigation logic
- ✅ Built-in history management
- ✅ Navigation guards and hooks
- ✅ Easier to add analytics
- ✅ Screen-specific logic in screen classes

---

## Example 3: State Management

### Before (Monolithic app.js)

```javascript
class LingXMApp {
  constructor() {
    // Scattered state
    this.currentProfile = null;
    this.currentLanguageIndex = 0;
    this.currentWordIndex = 0;
    this.wordData = {};
    this.savedWords = this.loadSavedWords();
    this.autoPlayEnabled = this.loadAutoPlaySetting();
    this.currentTheme = this.loadThemeSetting();
    // ... 20+ more state variables
  }

  // State scattered in methods
  async selectProfile(profileId) {
    this.currentProfile = profileId;
    localStorage.setItem('lingxm-current-profile', profileId);

    // Update UI manually
    this.updateHomeScreen();
    this.updateProfileDisplay();
    this.loadVocabularyForProfile();
    this.updateThemeForProfile();
    // ... 10+ manual UI updates
  }

  loadSavedWords() {
    const saved = localStorage.getItem('lingxm-saved-words');
    return saved ? JSON.parse(saved) : [];
  }

  saveWord(word) {
    this.savedWords.push(word);
    localStorage.setItem('lingxm-saved-words', JSON.stringify(this.savedWords));

    // Manually update all places that show saved words
    this.updateSavedWordsCount();
    this.updateSavedWordsBadge();
    this.refreshSavedWordsList();
  }
}
```

**Problems:**
- State scattered across class properties
- Manual UI updates everywhere
- localStorage logic duplicated
- No reactive updates
- Hard to track state changes

---

### After (State Management)

**File: `src/utils/state.js`** (centralized, reactive)

```javascript
import { state } from './utils/state.js';

// Initialize state (automatic localStorage persistence)
state.setMany({
  currentProfile: null,
  currentLanguageIndex: 0,
  currentWordIndex: 0,
  wordData: {},
  savedWords: [],
  autoPlayEnabled: false,
  theme: 'dark'
});

// Setting state (automatic persistence)
state.set('currentProfile', 'vahiko');

// Reactive UI updates
state.subscribe('currentProfile', (profileId) => {
  // UI automatically updates when profile changes
  console.log('Profile changed to:', profileId);

  // Load data for new profile
  loadVocabularyForProfile(profileId);
});

// Multiple components can react to same state
class SavedWordsCounter extends Component {
  constructor(parent, props) {
    super(parent, props);

    // Auto-update when saved words change
    this.unsubscribe = state.subscribe('savedWords', (words) => {
      this.setState({ count: words.length });
    });
  }

  render() {
    return this.createElement('div', {}, `Saved: ${this.state.count}`);
  }

  onUnmount() {
    this.unsubscribe(); // Clean up
  }
}

// Adding a saved word
const savedWords = state.get('savedWords');
state.set('savedWords', [...savedWords, newWord]);

// All subscribed components update automatically!
```

**Benefits:**
- ✅ Centralized state management
- ✅ Reactive updates (components auto-update)
- ✅ Automatic localStorage persistence
- ✅ Easy to debug (single source of truth)
- ✅ No manual UI updates needed

---

## Example 4: Vocabulary Screen

### Before (Monolithic app.js)

```javascript
class LingXMApp {
  // Lines 800-1200 (400 lines!)
  async loadVocabularyData() {
    // Mixed data loading and UI logic
    const profile = this.currentProfile;
    const lang = this.getCurrentLanguage();

    try {
      const response = await fetch(`/data/${profile}/${lang}.json`);
      this.wordData = await response.json();

      this.displayWord();
      this.setupLanguageSwitcher();
      this.setupSwipeGestures();
      this.setupAudioButtons();
      this.updateProgressBar();
      this.checkAchievements();

    } catch (error) {
      console.error('Failed to load vocabulary:', error);
      this.showErrorMessage('Failed to load vocabulary');
    }
  }

  displayWord() {
    const word = this.wordData.words[this.currentWordIndex];

    // Direct DOM manipulation
    document.getElementById('word-text').textContent = word.word;
    document.getElementById('word-translation').textContent = word.translation;
    document.getElementById('word-explanation').textContent = word.explanation;

    // Update conjugations
    const conjugationsEl = document.getElementById('word-conjugations');
    conjugationsEl.innerHTML = '';
    word.conjugations.forEach(conj => {
      const div = document.createElement('div');
      div.className = 'conjugation-item';
      div.innerHTML = `<span>${conj.label}:</span> <strong>${conj.form}</strong>`;
      conjugationsEl.appendChild(div);
    });

    // Update examples
    document.getElementById('example-1').textContent = word.examples[0];
    document.getElementById('example-2').textContent = word.examples[1];

    // Update mastery
    this.updateMasteryIndicator(word);

    // Audio
    this.setupAudioForWord(word);
  }

  async nextWord() {
    this.currentWordIndex++;

    if (this.currentWordIndex >= this.wordData.words.length) {
      this.showCompletionScreen();
      return;
    }

    this.displayWord();
    this.updateProgressBar();
    this.savePosition();
  }

  async previousWord() {
    if (this.currentWordIndex > 0) {
      this.currentWordIndex--;
      this.displayWord();
      this.updateProgressBar();
      this.savePosition();
    }
  }

  setupSwipeGestures() {
    const wordCard = document.getElementById('word-card');

    let startX = 0;

    wordCard.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    wordCard.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;

      if (diff > 100) {
        this.previousWord();
      } else if (diff < -100) {
        this.nextWord();
      }
    });
  }
}
```

**Problems:**
- One giant method (400+ lines)
- Data loading mixed with UI rendering
- Direct DOM manipulation
- Duplicated gesture logic
- Hard to test individual features

---

### After (Screen Component)

**File: `src/screens/VocabularyScreen.js`** (100 lines, clean)

```javascript
import { Component } from '../components/Component.js';
import { VocabularyCard } from '../components/VocabularyCard.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { state } from '../utils/state.js';
import { router } from '../utils/router.js';
import { addSwipeGestures } from '../utils/gestures.js';

export class VocabularyScreen extends Component {
  constructor(parent, props) {
    super(parent, props);

    this.state = {
      currentIndex: 0,
      words: [],
      loading: true
    };

    // Subscribe to state
    this.unsubscribeIndex = state.subscribe('currentWordIndex', (index) => {
      this.setState({ currentIndex: index });
    });
  }

  render() {
    const { loading, words, currentIndex } = this.state;

    const screen = this.createElement('div', {
      id: 'vocabulary-screen',
      className: 'screen'
    });

    if (loading) {
      screen.appendChild(this.createLoader());
      return screen;
    }

    // Header with back button
    screen.appendChild(this.createHeader());

    // Word card (delegated to component)
    const wordCard = new VocabularyCard(screen, {
      word: words[currentIndex],
      onNext: () => this.nextWord(),
      onPrevious: () => this.previousWord()
    });
    wordCard.mount();
    this.addChild(wordCard);

    // Progress bar
    const progressBar = new ProgressBar(screen, {
      current: currentIndex + 1,
      total: words.length
    });
    progressBar.mount();
    this.addChild(progressBar);

    return screen;
  }

  async onMount() {
    await this.loadWords();
    this.setupGestures();
  }

  async loadWords() {
    const profile = state.get('currentProfile');
    const lang = state.get('currentLanguage');

    try {
      const response = await fetch(`/data/${profile}/${lang}.json`);
      const data = await response.json();

      this.setState({
        words: data.words,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load words:', error);
      this.showError('Failed to load vocabulary');
    }
  }

  setupGestures() {
    const cardElement = this.querySelector('.vocabulary-card');

    addSwipeGestures(cardElement, {
      onSwipeLeft: () => this.nextWord(),
      onSwipeRight: () => this.previousWord()
    });
  }

  nextWord() {
    const { currentIndex, words } = this.state;

    if (currentIndex < words.length - 1) {
      state.set('currentWordIndex', currentIndex + 1);
    }
  }

  previousWord() {
    const { currentIndex } = this.state;

    if (currentIndex > 0) {
      state.set('currentWordIndex', currentIndex - 1);
    }
  }

  onUnmount() {
    this.unsubscribeIndex();
  }
}
```

**File: `src/components/VocabularyCard.js`** (80 lines)

```javascript
import { Component } from './Component.js';

export class VocabularyCard extends Component {
  render() {
    const { word } = this.props;

    return this.createElement('div', {
      className: 'vocabulary-card'
    }, [
      this.createWordHeader(word),
      this.createExplanation(word),
      this.createConjugations(word),
      this.createExamples(word),
      this.createAudioButton(word)
    ]);
  }

  createWordHeader(word) {
    return this.createElement('div', {
      className: 'word-header'
    }, [
      this.createElement('h2', {}, word.word),
      this.createElement('p', {}, word.translation),
      this.createMasteryIndicator(word.mastery)
    ]);
  }

  // ... other creation methods
}
```

**Benefits:**
- ✅ Separated into logical components
- ✅ Clean screen/component structure
- ✅ Reusable vocabulary card
- ✅ Gesture logic centralized in utils
- ✅ Easy to test each piece
- ✅ 100 + 80 lines vs 400+ lines

---

## Migration Steps

### Step 1: Choose a Feature to Extract

Start with a **small, self-contained feature**:
- ✅ Profile card (good first choice)
- ✅ Progress ring
- ✅ Save button
- ❌ Entire vocabulary screen (too big for first attempt)

### Step 2: Create the Component

```javascript
// 1. Create new file: src/components/YourComponent.js
import { Component } from './Component.js';

export class YourComponent extends Component {
  render() {
    // Move UI creation code here
  }

  // Move related methods here
}
```

### Step 3: Replace in app.js

```javascript
// Before
setupProfileCards() {
  // 50 lines of code
}

// After
import { ProfileCard } from './components/ProfileCard.js';

setupProfileCards() {
  const profiles = Object.values(PROFILES);

  profiles.forEach(profile => {
    const card = new ProfileCard('#profiles-grid', {
      profile,
      progress: 0,
      locked: false
    });
    card.mount();
  });
}
```

### Step 4: Test

- Verify the feature still works
- Check browser console for errors
- Test all interactions

### Step 5: Repeat

Extract one more feature, test, repeat!

---

## Summary

**Monolithic app.js:**
- 3712 lines
- Everything mixed together
- Hard to maintain
- Difficult to test

**Component-based architecture:**
- ~200 lines in app.js (orchestration)
- Logical separation
- Easy to maintain
- Easy to test
- Reusable components

Start small, test frequently, and gradually migrate the codebase! 🚀
