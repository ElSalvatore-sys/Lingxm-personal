# LingXM Personal - Complete Project Analysis

## Executive Summary

**LingXM Personal** is a sophisticated Progressive Web Application (PWA) designed for personalized language learning with multi-profile support, intelligent progress tracking, and offline-first architecture. The app serves 6 individual language learners (Vahiko, Hassan, Frau Salman, Kafel, Jawad, and Ameeno), each with customized language combinations and specialization tracks (gastronomy, IT, urban planning, etc.).

Built with vanilla JavaScript and Vite, the application leverages a hybrid data storage system combining SQLite (via sql.js) for scalability with localStorage as a fallback. The recent development history reveals extensive optimization work, particularly around cache-busting mechanisms to solve critical iPhone caching issues that prevented users from receiving app updates. The project demonstrates production-grade engineering with comprehensive PIN authentication, achievement systems, analytics tracking, and a sophisticated mastery-based vocabulary progression model.

**Current Status**: On main branch with dev branch containing recent features. The project is fully deployed on Vercel with a robust multi-layer cache-busting system implemented to prevent stale content delivery to users.

---

## Project Structure

### Complete Directory Tree

```
LingXM-Personal/
├── .git/                                   # Git repository
├── .vercel/                               # Vercel deployment config
├── .claude/                               # Claude Code metadata
├── public/                                # Public assets (served directly)
│   ├── data/
│   │   ├── ameeno/                       # Ameeno profile vocabulary
│   │   │   ├── de.json                   # German
│   │   │   ├── en.json                   # English
│   │   │   └── it.json                   # Italian
│   │   ├── hassan/
│   │   │   ├── ar.json                   # Arabic
│   │   │   ├── en.json
│   │   │   └── de.json
│   │   ├── jawad/
│   │   │   ├── de.json
│   │   │   ├── de-gastro.json           # Specialty: Gastronomy
│   │   │   ├── en.json
│   │   │   └── fr.json
│   │   ├── kafel/
│   │   │   ├── de.json
│   │   │   ├── de-it.json               # Specialty: IT
│   │   │   └── en.json
│   │   ├── salman/
│   │   │   ├── de.json
│   │   │   ├── de-gastro.json
│   │   │   ├── en.json
│   │   │   └── fr.json
│   │   └── vahiko/
│   │       ├── de.json
│   │       └── en.json
│   ├── icons/                            # PWA icons (8 sizes)
│   │   ├── icon-72x72.png through icon-512x512.png
│   ├── logo.svg                         # App logo
│   ├── manifest.json                    # PWA manifest
│   ├── service-worker.js                # Service worker
│   └── sql-wasm.wasm                    # SQLite WebAssembly binary
├── src/
│   ├── app.js                           # Main application class (1752 lines)
│   ├── config.js                        # Profile & language configuration
│   ├── styles/
│   │   └── main.css                     # Master stylesheet with theming
│   └── utils/
│       ├── achievements.js              # Achievement badge system
│       ├── analytics.js                 # Privacy-first analytics
│       ├── database.js                  # SQLite/IndexedDB manager
│       ├── progress.js                  # Progress tracking & mastery
│       ├── speech.js                    # Text-to-speech system
│       └── version-check.js             # Runtime version checker
├── dist/                                 # Build output directory
├── index.html                            # Main entry point (643 lines)
├── package.json                          # NPM configuration
├── vite.config.js                       # Vite build configuration
├── vercel.json                          # Vercel deployment config
├── build-version.js                     # Version generation script
├── validate-setup.sh                    # Setup validation script
└── [Documentation files]                # Cache-busting docs, deployment guides
```

---

## Technology Stack

### Core Framework & Build Tools
- **Framework**: Vanilla JavaScript (ES6+ modules)
- **Build Tool**: Vite 5.0.0 with custom plugins
- **Deployment**: Vercel (serverless platform)
- **Node Version**: 18+ (implied by Vite 5.0)

### Runtime Dependencies
- **sql.js** 1.13.0 - SQLite compiled to WebAssembly for browser-based database

### Key Technologies
1. **PWA (Progressive Web App)**
   - Service Worker for offline functionality
   - Web App Manifest for installability
   - Home screen icons (8 sizes)

2. **Storage & Database**
   - **IndexedDB** - Primary persistent storage for SQL database
   - **localStorage** - Fallback storage and settings persistence
   - **sql.js** - In-browser SQLite with automatic IndexedDB persistence

3. **Web APIs**
   - Web Speech API, Web Crypto API, Fetch API, Service Worker API, IndexedDB API

4. **CSS Features**
   - CSS Custom Properties for theming
   - Flexbox and CSS Grid layouts
   - Mobile-first responsive design
   - iOS-specific optimizations

---

## Core Functionality

### 1. Multi-Profile System
The app supports 6 different user profiles:

```
Vahiko (👩‍💼)     - German (C1) + English (B1-B2) [Urban Planning]
Hassan (👨‍💻)    - Arabic (B2-C1) + English (B2-C2) + German (B1-B2)
Frau Salman (👩‍🍳) - German (B1-B2) + Gastro German + French Gastro + English [Culinary]
Kafel (👨‍💻)    - German (B2-C1) + German IT + English [IT/Tech]
Jawad (👨‍🍳)    - German (C1) + Gastro German + French Gastro + English [Culinary]
Ameeno (🧑‍🎓)   - German (B1-B2) + English (B1-B2) + Italian (A1)
```

### 2. Vocabulary Learning System
- **Total Capacity**: ~180 words per language
- **Data Structure**: JSON files with translations, explanations, conjugations, examples
- Each word has multi-language support with detailed explanations

### 3. Mastery Level System
Words progress through 6 levels:
```
Level 0: New (🌱)
Level 1: Seen (👀)
Level 2: Learning (📚)
Level 3: Familiar (✨)
Level 4: Strong (💪)
Level 5: Mastered (🏆)
```

### 4. PIN Authentication System
- SHA-256 hashing via Web Crypto API
- 4-digit keypad interface
- Optional per-profile security

### 5. Achievement Badge System
**Word Milestones**: First Steps (1), Beginner (10), Growing (50), Advanced (100), Expert (150), Master (180)
**Streak Milestones**: Week Warrior (7), Month Master (30), Legendary (100)

### 6. Progress Tracking
- Current and longest study streaks
- Words studied per language
- Mastery levels per word
- Daily study statistics

### 7. Analytics System
Privacy-first analytics stored entirely locally:
- Session tracking, event tracking, daily statistics
- Exportable data, accessible via 3-second long-press on settings

### 8. Text-to-Speech
- Language support: German, English, French, Arabic, Polish, Farsi, Italian
- Auto-play option with smart language matching

---

## Architecture Deep Dive

### 1. Application Structure

The `LingXMApp` class orchestrates:
- Screen navigation
- Profile selection and initialization
- Word data loading and display
- User interactions (swipes, clicks)
- System integrations

### 2. Storage Architecture

**Hybrid Storage Pattern**:
```
Settings (Theme, AutoPlay) → localStorage
PIN Data (Hashed) → localStorage
Progress Data → SQLite (primary) + localStorage (fallback)
Analytics Events → localStorage (all local)
```

**Why Hybrid**: localStorage for quick access, SQLite for complex queries, automatic migration, fallback mechanism

### 3. Database Schema (SQLite via sql.js)

```sql
users (id, profile_key, created_at, last_active, settings)
progress (id, user_id, language, word, review_count, mastery_level)
saved_words (id, user_id, language, word, saved_at)
daily_stats (id, user_id, date, words_learned, streak_days)
```

### 4. Cache-Busting Architecture (Major Recent Focus)

**4-Layer Defense System**:

1. **Bootstrap Version Check** (HTML, runs immediately)
   - Fetches `/version.json` before service worker
   - Compares timestamps
   - If newer: unregister SW, clear caches, reload

2. **Service Worker** (Network-First for HTML)
   - HTML/version.json: network-first
   - Assets: cache-first

3. **Runtime Periodic Check** (Every 60 seconds)
   - Checks for updates while app is open
   - Auto-reloads if newer version

4. **Browser Meta Tags** (Defense-in-depth)
   - `Cache-Control: no-cache, no-store, must-revalidate`

### 5. Service Worker Strategy

```javascript
Cache-First (Assets): CSS, JS, images stay cached
Network-First (HTML): Always try server, fallback to cache
No-Cache (version.json): Never cache, always fetch fresh
```

---

## Git History & Evolution

### Major Phases

**Phase 1**: Foundation (profiles, core UI, basic progress)
**Phase 2**: Feature Development (achievements, analytics, PIN, speech)
**Phase 3**: Mobile Optimization (iOS Safari fixes, scrolling issues)
**Phase 4**: The Cache-Busting Saga (~15 commits)

### The Cache-Busting Saga (Recent Major Focus)

**The Problem**: iPhone users saw old cached HTML even after new deployments

**Evolution of Solutions**:
1. Service worker cache headers → Failed on iOS
2. Query parameters on HTML → Failed (cached HTML can't change)
3. **Breakthrough**: Build timestamp system
4. **Final**: 4-layer defense with bootstrap check

**Key Commits**:
```
ceec655 - Service worker v3 cache refresh
fdf9998 - Force SW updates with updateViaCache
2d2dace - Aggressive cache busting for iPhone
33a34b7 - Network-first strategy + query params
b0f9e1b - Nuclear cache busting (build timestamp)
fbd2aa9 - Prevent infinite reload loop
d5a0e18 - CRITICAL FIX: Remove auto-reload triggers
```

**Current Status**: Fully implemented and tested. Users never see stale content.

### Branch Status
- **main**: Latest stable with cache-busting
- **dev**: Development branch
- **10 feature branches**: Various profile setups and fixes

---

## Dependencies Analysis

### Production Dependencies (1)
- **sql.js** 1.13.0 - SQLite in WebAssembly for browser-based SQL database

### Development Dependencies (1)
- **vite** 5.0.0 - Build tool & dev server

### Notably Absent (By Design)
- No React/Vue/Angular - Vanilla JS is lightweight
- No PWA libraries - Native Service Worker API used
- No analytics libraries - Privacy-first local implementation

### Why sql.js?
- True SQLite compiled to WASM
- Works entirely in browser
- Complex queries for analytics/progress
- IndexedDB persistence
- Trade-off: Initial WASM load time acceptable for this use case

---

## Development Guide

### Local Setup
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:3000)
npm run build      # Build for production (creates dist/)
npm run preview    # Preview production build
npm run deploy     # Deploy to Vercel
```

### Common Development Tasks

**Adding a New Profile**:
1. Edit `src/config.js` - add to PROFILES
2. Create vocabulary JSON in `public/data/newprofile/`
3. Update icon/emoji in config
4. Test PIN setup and profile selection

**Adding a Language**:
1. Edit `src/config.js` - add to learningLanguages
2. Create JSON vocabulary file
3. Update LANGUAGE_NAMES if new language

**Modifying Progress Tracking**:
1. Changes in `src/utils/progress.js` or `database.js`
2. Handle migration from old format
3. Test localStorage fallback

**Styling Changes**:
1. Edit `src/styles/main.css`
2. Use CSS custom properties
3. Test both dark and light themes
4. Test on iOS Safari

---

## Recent Context & Issues

### The iPhone Caching Saga (Oct 2024)

**The Problem**: iPhone users opened app after deployment and saw OLD cached version

**Why Previous Solutions Failed**:
- iOS ignores many cache-control directives
- Service worker itself gets cached
- Cached HTML can't be modified with query strings
- Cached SW prevents fresh HTML from loading

**The Breakthrough**: Version.json with timestamp generated during build. Bootstrap script compares timestamps before SW registration.

**Why It Works**:
- Bootstrap check is inline HTML - can't be cached
- Hard reload forces fresh request bypassing caches
- Service worker unregistration removes offline cache
- Multiple redundant checks guarantee detection

**Commits Involved**: 15 total across 2 days
- Implemented SW v3 with better headers
- Added build-time version generation
- Created runtime version checking module
- Integrated bootstrap check in HTML
- Fixed infinite reload loops

### Other Recent Fixes

**Achievement Popups**: Reduced frequency to avoid interruption
**Profile Selection Scrolling**: Fixed iOS Safari momentum scrolling
**PIN Authentication**: Event delegation for reliable button handling

---

## Important Notes & Gotchas

### Critical Implementation Details

1. **Database Initialization is Async** - Must wait for `.init()` to complete
2. **Service Worker Caching** - Cache name must change to force refresh (currently v6)
3. **Version.json Generation** - Auto-generated during build, timestamp must differ
4. **PIN Hashing** - SHA-256 is async, must await
5. **Mastery Level** - Increments on every word VIEW, not completion
6. **Profile-Specific Data** - Separate localStorage prefixes prevent collision
7. **iOS-Specific Quirks** - Multiple webkit-specific CSS fixes required
8. **Analytics are Local** - No external services, no network requests
9. **Settings Persistence** - Theme/autoplay survive service worker clearing
10. **Language Support** - Hardcoded, requires config changes to add new languages

### Common Mistakes to Avoid

1. Don't modify service worker without changing cache name
2. Don't deploy without version.json in dist/
3. Don't add heavy libraries without considering offline impact
4. Don't assume localStorage persists across full browser cache clear
5. Don't call database methods before initialization completes
6. Don't change vocabulary file paths without updating config

---

## Technical Debt & Future Considerations

### Known Limitations

1. **Language Support** - Hardcoded, no admin interface
2. **PIN System** - No recovery mechanism beyond reset
3. **Analytics** - No charts/visualization, no date filtering
4. **Performance** - SQL queries not optimized, no indexes
5. **Offline** - No conflict resolution for offline changes

### Potential Improvements

1. **Admin Dashboard** - Add/edit profiles without code
2. **Advanced Analytics** - Visual charts, heatmaps, predictions
3. **Social Features** - Leaderboards, achievement sharing
4. **AI Integration** - Personalized suggestions, adaptive difficulty
5. **Database Optimization** - Indexes, compression, archiving
6. **Accessibility** - Screen reader, keyboard navigation, high contrast
7. **Internationalization** - App UI translations, RTL support

### Technical Debt

1. **Code Organization** - App.js is 1750 lines, could split
2. **Error Handling** - Silent fallbacks, no user-facing recovery
3. **Testing** - No unit/integration/E2E tests
4. **Documentation** - Cache-busting well-documented, others lacking

---

## Debugging Guide

**Problem: Users see stale content**
1. Check bootstrap logs in console
2. Verify version.json timestamp is newer
3. Check service worker installation in DevTools
4. Force clear browser cache manually

**Problem: Speech not working**
1. Check browser Web Speech API support
2. Verify language voice exists
3. Check speech isn't already playing

**Problem: Progress not saving**
1. Check database initialized
2. Verify IndexedDB accessible
3. Check browser isn't in private mode
4. Test localStorage fallback

**Problem: Infinite reload loop**
1. Check version.json generation
2. Verify timestamp consistency
3. Check network isn't returning different versions

---

## Summary

LingXM Personal is a well-engineered PWA for personalized language learning with impressive technical depth. The recent focus on cache-busting demonstrates production maturity - addressing a real iPhone caching issue with a comprehensive 4-layer solution.

The codebase shows good patterns (modular utilities, hybrid storage, comprehensive analytics) while carrying some technical debt (monolithic app.js, limited testing, minimal error handling). The project is stable and deployable, with strong documentation around the critical cache-busting system.

**Next Developer Should Know**:
1. Start with `src/config.js` to understand profiles
2. Read `index.html` to understand bootstrap version check
3. Follow `src/app.js` flow for main features
4. Check git history for context (especially cache-busting commits)
5. Test on iPhone, not just desktop
6. Always verify version.json changes after deployment

---

**Last Updated**: October 29, 2024
**Status**: Production-ready with active development
**Main Branch**: Contains cache-busting implementation
**Recent Focus**: iPhone caching issues (SOLVED)
