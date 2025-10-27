# SQLite Database Integration Guide

## Overview

LingXM Personal now uses **sql.js** (browser-compatible SQLite) for scalable user progress tracking, with automatic localStorage migration and dual-storage fallback.

## Architecture

### Hybrid Storage Strategy
- **Primary**: SQLite database (via sql.js)
- **Fallback**: localStorage (automatic if database fails)
- **Persistence**: IndexedDB (with localStorage fallback)

### Database Schema

#### Tables

**users**
- `id` - Primary key
- `profile_key` - Unique profile identifier (vahiko, hassan, salman, kafel, jawad, ameeno)
- `created_at` - Timestamp
- `last_active` - Last activity timestamp
- `settings` - JSON settings

**progress**
- `id` - Primary key
- `user_id` - Foreign key to users
- `language` - Language code (de, en, ar, etc.)
- `word` - Word identifier
- `learned_at` - When first learned
- `review_count` - Number of reviews
- `last_reviewed` - Last review timestamp
- `mastery_level` - Mastery score (0-100)

**saved_words**
- `id` - Primary key
- `user_id` - Foreign key to users
- `language` - Language code
- `word` - Word text
- `word_index` - Word position in learning set
- `saved_at` - When saved
- `notes` - Optional user notes

**daily_stats**
- `id` - Primary key
- `user_id` - Foreign key to users
- `date` - Date (YYYY-MM-DD)
- `words_learned` - Words learned that day
- `words_reviewed` - Words reviewed that day
- `study_time_seconds` - Study time in seconds
- `streak_days` - Current streak

## Features

### ✅ Automatic localStorage Migration
When the database initializes for the first time, it automatically migrates existing localStorage data to the SQLite database. This happens once per profile.

### ✅ Dual Storage Fallback
- All operations attempt database first
- Falls back to localStorage if database fails
- Data is synced to both for redundancy

### ✅ IndexedDB Persistence
- Database is saved to IndexedDB for offline access
- Falls back to localStorage if IndexedDB unavailable
- Auto-saves on all data changes

### ✅ Performance Optimization
- Indexed queries for fast lookups
- Minimal overhead with sql.js WebAssembly
- Efficient batch operations

## Usage

### DatabaseManager API

```javascript
import { dbManager } from './utils/database.js';

// Initialize (automatic in ProgressTracker)
await dbManager.init();

// User operations
const user = dbManager.getOrCreateUser('vahiko');
dbManager.updateLastActive(user.id);

// Progress tracking
dbManager.recordWordLearned(userId, 'de', 'das Haus');
const progress = dbManager.getLanguageProgress(userId, 'de');

// Saved words
dbManager.saveWord(userId, 'de', 'das Haus', 0, 'Important word');
dbManager.unsaveWord(userId, 'de', 0);
const savedWords = dbManager.getSavedWords(userId, 'de');

// Statistics
dbManager.recordDailyStats(userId, '2025-10-27', 10, 300);
const streak = dbManager.getCurrentStreak(userId);
const total = dbManager.getTotalWordsLearned(userId);

// Export backup
dbManager.exportDatabase(); // Downloads .db file
```

### ProgressTracker (Updated)

The `ProgressTracker` class now automatically uses the database:

```javascript
import { ProgressTracker } from './utils/progress.js';

const tracker = new ProgressTracker('vahiko');

// Wait for database initialization (optional)
await tracker.initDatabase();

// All methods work the same as before
tracker.recordStudySession('de', 10);
tracker.markWordCompleted('de', 5);
const stats = tracker.getStats();
```

## Migration Process

### First Run
1. User selects profile
2. Database initializes
3. System checks for localStorage data
4. If found and not migrated, migrates data
5. Marks profile as migrated
6. Future runs use database directly

### Migration Key
`lingxm-migrated-{profileKey}` - Prevents duplicate migrations

## File Structure

```
src/
├── utils/
│   ├── database.js       # DatabaseManager class
│   ├── progress.js       # Updated ProgressTracker with DB integration
│   └── speech.js         # (unchanged)
├── app.js                # Updated saved words to use database
└── config.js             # (unchanged)

public/
└── sql-wasm.wasm         # SQLite WebAssembly binary

data/
└── {profile}/            # Word data JSON files
```

## Troubleshooting

### Database not initializing
- Check browser console for errors
- Verify `sql-wasm.wasm` is in `/public/` directory
- IndexedDB may be disabled in private browsing

### Migration issues
- Clear `lingxm-migrated-{profile}` from localStorage to re-migrate
- Check console for migration logs

### Performance issues
- Database auto-saves on changes (may be throttled in future)
- IndexedDB operations are async but non-blocking

## Console Logs

Watch for these log messages:

```
[DB] Created new database
[DB] Loaded existing database from storage
[Progress] Database initialized for vahiko (user_id: 1)
[Progress] Starting migration from localStorage to database...
[Progress] Migration completed successfully
[Progress] Data already migrated for vahiko
```

## Database Statistics

Check database stats in console:

```javascript
const { dbManager } = await import('./utils/database.js');
await dbManager.init();
console.log(dbManager.getStats());
// Output: { users: 6, progress_records: 120, saved_words: 15, isInitialized: true }
```

## Backup & Export

Users can export their database:

```javascript
dbManager.exportDatabase();
// Downloads: lingxm-backup-2025-10-27.db
```

## Technical Details

### Why sql.js?
- **Browser-compatible**: Pure JavaScript + WebAssembly
- **Full SQLite**: Complete SQL support
- **No backend required**: Runs entirely in browser
- **Persistent**: Saved to IndexedDB/localStorage

### Why not better-sqlite3?
- better-sqlite3 requires Node.js
- Cannot run in browser
- Would need backend server

### Data Flow
1. User action (e.g., complete word)
2. Update database (if available)
3. Update localStorage (always)
4. Auto-save to IndexedDB
5. UI reflects changes

## Future Enhancements

- [ ] Cloud sync (Firebase/Supabase)
- [ ] Import/restore from backup file
- [ ] Spaced repetition algorithm using mastery_level
- [ ] Analytics dashboard
- [ ] Export to CSV/JSON
- [ ] Cross-device sync

## Dependencies

- **sql.js**: ^1.13.0 (SQLite for browser)
- **vite**: ^5.0.0 (Build tool)

## Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)
- ❌ IE11 (not supported)

## License

Part of LingXM Personal v1.0
