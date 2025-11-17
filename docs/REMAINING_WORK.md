# LingXM Personal - Remaining Work Breakdown

**Last Updated:** 2025-11-12
**Overall Completion:** 46.5%
**Remaining Work:** ~173 hours (optimistic) to ~220 hours (realistic)

---

## Executive Summary

LingXM is 46.5% complete with a production-ready core application. The primary remaining work involves content generation (vocabulary, sentences, audio) across 9 languages. This document provides a detailed breakdown of all remaining tasks with time estimates and prioritization.

---

## Critical Path: Blocking Production

### 1. Deployment Setup 🔥 URGENT
**Current Status:** 0% complete
**Blocker:** Vercel free tier rate limit (2,601 audio files exceeded quota)
**Impact:** Blocks production release

**Tasks:**
- [ ] Create GitHub repository (if not exists) - 5 minutes
- [ ] Push codebase to GitHub - 10 minutes
- [ ] Connect Vercel to GitHub repository - 5 minutes
- [ ] Configure Vercel project settings - 5 minutes
- [ ] Test Git-based deployment - 5 minutes
- [ ] Verify production URL and cache-busting - 10 minutes

**Total Time:** 40 minutes
**Priority:** P1 (Critical)
**Dependencies:** None
**Assigned To:** Ready for immediate execution

**Expected Outcome:** Production deployment working via Git-based auto-deploy

---

## Phase 1: Vocabulary Generation (High Priority)

### Overview
**Current:** 800/12,500 words (6.4% complete)
**Target:** 11,700 remaining words (93.6%)
**Estimated Time:** 120-150 hours

### 1.1 Persian (fa) - 🎉 NEARLY DONE
**Progress:** 24/25 batches (96% complete)
**Remaining:** 1 batch = 20 words

**Tasks:**
- [ ] Generate fa-a1-batch25.json (20 words) - 1 hour
- [ ] Validate schema compliance - 10 minutes
- [ ] Test audio generation pipeline - 10 minutes
- [ ] Commit to generation/fa-a1 branch - 5 minutes

**Total Time:** 1.5 hours
**Priority:** P1 (Critical - finish what's almost done)
**Expected Completion:** Week 1

---

### 1.2 Italian (it) - 44% Complete
**Progress:** 11/25 batches (44% complete)
**Remaining:** 14 batches = 280 words

**Tasks:**
- [ ] Generate it-a1-batch12.json through it-a1-batch25.json - 14 hours
- [ ] Validate all batches for schema compliance - 1 hour
- [ ] Test with Ameeno profile - 30 minutes
- [ ] Generate audio for new words - 30 minutes
- [ ] Commit to generation/it-a1 branch - 10 minutes

**Total Time:** 16 hours
**Priority:** P2 (High - Ameeno profile needs completion)
**Expected Completion:** Week 2-3

**Breakdown:**
- Batch 12: 1 hour
- Batch 13: 1 hour
- Batch 14: 1 hour
- Batch 15: 1 hour (already exists in universal/)
- Batches 16-25: 10 hours (10 batches × 1 hour each)

---

### 1.3 Polish (pl) - 52% Complete
**Progress:** 13/25 batches (52% complete, per docs)
**Remaining:** 12 batches = 240 words

**Tasks:**
- [ ] Verify existing batches (pl-a1-batch1 through batch13) - 1 hour
- [ ] Generate pl-a1-batch14 through pl-a1-batch25 - 12 hours
- [ ] Validate all batches for schema compliance - 1 hour
- [ ] Generate audio for new words - 30 minutes
- [ ] Commit to generation/pl-a1 branch - 10 minutes

**Total Time:** 14.5 hours
**Priority:** P2 (High - significant progress already made)
**Expected Completion:** Week 3-4

---

### 1.4 English (en) - 8% Complete
**Progress:** 2/25 batches (8% complete)
**Remaining:** 23 batches = 460 words

**Tasks:**
- [ ] Generate en-a1-batch3 through en-a1-batch25 - 23 hours
- [ ] Validate all batches for schema compliance - 2 hours
- [ ] Test with Salman, Vahiko, Ameeno profiles - 1 hour
- [ ] Generate audio for new words - 1 hour
- [ ] Commit to generation/en-a1 branch - 10 minutes

**Total Time:** 27 hours
**Priority:** P2 (High - multiple profiles depend on English)
**Expected Completion:** Month 1-2

**Milestones:**
- Week 2: Batches 3-10 (8 batches, 8 hours)
- Week 3: Batches 11-18 (8 batches, 8 hours)
- Week 4: Batches 19-25 (7 batches, 7 hours)

---

### 1.5 German (de) - 8% Complete
**Progress:** 2/25 batches (8% complete)
**Remaining:** 23 batches = 460 words

**Tasks:**
- [ ] Generate de-a1-batch3 through de-a1-batch25 - 23 hours
- [ ] Validate all batches for schema compliance - 2 hours
- [ ] Test with multiple profiles (Vahiko, Salman, Kafel, Jawad, Ameeno, Valeria) - 1 hour
- [ ] Generate audio for new words - 1 hour
- [ ] Commit to generation/de-a1 branch - 10 minutes

**Total Time:** 27 hours
**Priority:** P2 (High - 6 profiles depend on German)
**Expected Completion:** Month 1-2

**Milestones:**
- Week 2: Batches 3-10 (8 batches, 8 hours)
- Week 3: Batches 11-18 (8 batches, 8 hours)
- Week 4: Batches 19-25 (7 batches, 7 hours)

---

### 1.6 Arabic (ar) - 4% Complete
**Progress:** 1/25 batches (4% complete)
**Remaining:** 24 batches = 480 words

**Tasks:**
- [ ] Generate ar-a1-batch2 through ar-a1-batch25 - 24 hours
- [ ] Validate all batches for schema compliance - 2 hours
- [ ] Test with Hassan profile - 1 hour
- [ ] Generate audio for new words (Arabic voice) - 1 hour
- [ ] Verify UTF-8 encoding for Arabic script - 30 minutes
- [ ] Commit to generation/ar-a1 branch - 10 minutes

**Total Time:** 28.5 hours
**Priority:** P2 (High - Hassan profile needs Arabic completion)
**Expected Completion:** Month 2-3

**Special Considerations:**
- Right-to-left text rendering
- Arabic diacritics (tashkeel) handling
- Voice selection (Arabic SA confirmed working)

---

### 1.7 French (fr) - 0% Complete + Quality Issues 🔧
**Progress:** 0/25 batches (0% complete)
**Remaining:** 25 batches = 500 words
**Known Issues:** 220 schema violations in existing fr-a1-batch1.json

**Tasks:**
- [ ] Fix existing fr-a1-batch1.json schema violations - 2 hours
  - Missing examples
  - Incorrect part of speech tags
  - Translation inconsistencies
- [ ] Regenerate fr-a1-batch1.json with quality assurance - 2 hours
- [ ] Generate fr-a1-batch2 through fr-a1-batch25 - 24 hours
- [ ] Validate all batches for schema compliance - 3 hours (extra scrutiny)
- [ ] Test with Salman and Jawad profiles - 1 hour
- [ ] Generate audio for new words (French voice) - 1 hour
- [ ] Commit to generation/fr-a1 branch - 10 minutes

**Total Time:** 33 hours
**Priority:** P1 (Critical - quality issues affect user experience)
**Expected Completion:** Month 2-3

**Quality Assurance Steps:**
1. Run validate-vocabulary-data.js on each batch
2. Manual review of first 3 batches
3. Cross-check with French gastronomy sentences
4. Native speaker review (if available)

---

### 1.8 Spanish (es) - NOT STARTED 🚫
**Progress:** 0/25 batches (0% complete)
**Remaining:** 25 batches = 500 words

**Tasks:**
- [ ] Setup Spanish generation pipeline - 1 hour
- [ ] Select Spanish voice for TTS (Spain or Latin America) - 30 minutes
- [ ] Generate es-a1-batch1 through es-a1-batch25 - 25 hours
- [ ] Validate all batches for schema compliance - 2 hours
- [ ] Generate audio for all words (Spanish voice) - 1 hour
- [ ] Create test profile for Spanish validation - 1 hour
- [ ] Commit to generation/es-a1 branch - 10 minutes

**Total Time:** 30.5 hours
**Priority:** P3 (Medium - no existing profiles depend on Spanish)
**Expected Completion:** Month 4-5

**Voice Selection Decision Needed:**
- **Spanish (Spain):** Castilian pronunciation, European standard
- **Spanish (Latin America):** Neutral Latin American accent
- **Recommendation:** Start with European Spanish, expand later

---

### 1.9 Russian (ru) - NOT STARTED 🚫
**Progress:** 0/25 batches (0% complete)
**Remaining:** 25 batches = 500 words

**Tasks:**
- [ ] Setup Russian generation pipeline - 1 hour
- [ ] Select Russian voice for TTS - 30 minutes
- [ ] Generate ru-a1-batch1 through ru-a1-batch25 - 25 hours
- [ ] Validate all batches for schema compliance - 2 hours
- [ ] Verify UTF-8 encoding for Cyrillic script - 30 minutes
- [ ] Generate audio for all words (Russian voice) - 1 hour
- [ ] Test with Dmitri profile - 1 hour
- [ ] Commit to generation/ru-a1 branch - 10 minutes

**Total Time:** 31 hours
**Priority:** P2 (High - Dmitri profile needs Russian completion)
**Expected Completion:** Month 4-5

**Special Considerations:**
- Cyrillic script rendering
- Case system (6 cases) examples
- Verb aspect (perfective/imperfective) pairs
- Gender agreement complexity

---

### Vocabulary Generation Summary

| Language | Batches | Words | Hours | Priority | Month |
|----------|---------|-------|-------|----------|-------|
| Persian (fa) | 1 | 20 | 1.5 | P1 | Week 1 |
| Italian (it) | 14 | 280 | 16 | P2 | Week 2-3 |
| Polish (pl) | 12 | 240 | 14.5 | P2 | Week 3-4 |
| English (en) | 23 | 460 | 27 | P2 | Month 1-2 |
| German (de) | 23 | 460 | 27 | P2 | Month 1-2 |
| Arabic (ar) | 24 | 480 | 28.5 | P2 | Month 2-3 |
| French (fr) | 25 | 500 | 33 | P1 | Month 2-3 |
| Spanish (es) | 25 | 500 | 30.5 | P3 | Month 4-5 |
| Russian (ru) | 25 | 500 | 31 | P2 | Month 4-5 |
| **TOTAL** | **172** | **11,700** | **209** | | **5 months** |

**Optimistic Estimate:** 150 hours (if generation pipeline is highly optimized)
**Realistic Estimate:** 209 hours (including quality assurance)
**Pessimistic Estimate:** 250 hours (if quality issues arise)

---

## Phase 2: Sentence Expansion (Medium Priority)

### Overview
**Current:** 3,055/6,000 sentences (50.9% complete)
**Target:** 2,945 remaining sentences (49.1%)
**Estimated Time:** 40-60 hours

### 2.1 Spanish Sentences - NOT STARTED 🚫
**Needed:** 500-600 sentences (A1-C2 full coverage)

**Tasks:**
- [ ] Generate es-a1a2-sentences.json (180 sentences) - 6 hours
- [ ] Generate es-b1b2-sentences.json (180 sentences) - 6 hours
- [ ] Generate es-c1c2-sentences.json (180 sentences) - 6 hours
- [ ] Validate i+1 methodology compliance - 1 hour
- [ ] Test sentence practice mode - 1 hour
- [ ] Commit to sentences/es branch - 10 minutes

**Total Time:** 20 hours
**Priority:** P3 (Medium - no profiles currently use Spanish)
**Expected Completion:** Month 5-6

---

### 2.2 Arabic Sentences - Partial Coverage
**Current:** 180 sentences (C1-C2 only)
**Needed:** 300-360 additional sentences (A1-B2)

**Tasks:**
- [ ] Generate ar-a1a2-sentences.json (180 sentences) - 6 hours
- [ ] Generate ar-b1b2-sentences.json (180 sentences) - 6 hours
- [ ] Validate i+1 methodology compliance - 1 hour
- [ ] Test with Hassan profile - 30 minutes
- [ ] Commit to sentences/ar branch - 10 minutes

**Total Time:** 13.5 hours
**Priority:** P2 (High - Hassan profile would benefit)
**Expected Completion:** Month 3

---

### 2.3 French Sentences - Partial Coverage
**Current:** 294 sentences (B1-B2 Gastro only)
**Needed:** 500-600 additional sentences (A1-C2 general)

**Tasks:**
- [ ] Generate fr-a1a2-sentences.json (180 sentences) - 6 hours
- [ ] Generate fr-b1b2-sentences.json (180 sentences, general) - 6 hours
- [ ] Generate fr-c1c2-sentences.json (180 sentences) - 6 hours
- [ ] Validate i+1 methodology compliance - 1 hour
- [ ] Test with Salman and Jawad profiles - 1 hour
- [ ] Commit to sentences/fr branch - 10 minutes

**Total Time:** 20 hours
**Priority:** P2 (High - Salman and Jawad profiles would benefit)
**Expected Completion:** Month 3-4

---

### 2.4 Italian Sentences - Partial Coverage
**Current:** 180 sentences (A1 only)
**Needed:** 300-360 additional sentences (A2-C2)

**Tasks:**
- [ ] Generate it-a2-sentences.json (180 sentences) - 6 hours
- [ ] Generate it-b1b2-sentences.json (180 sentences) - 6 hours
- [ ] Generate it-c1c2-sentences.json (180 sentences) - 6 hours
- [ ] Validate i+1 methodology compliance - 1 hour
- [ ] Test with Ameeno and Valeria profiles - 1 hour
- [ ] Commit to sentences/it branch - 10 minutes

**Total Time:** 20 hours
**Priority:** P2 (High - Ameeno and Valeria profiles would benefit)
**Expected Completion:** Month 4

---

### 2.5 Russian Sentences - Partial Coverage
**Current:** 180 sentences (A1-B1 only)
**Needed:** 180-360 additional sentences (B2-C2)

**Tasks:**
- [ ] Generate ru-b2-sentences.json (180 sentences) - 6 hours
- [ ] Generate ru-c1c2-sentences.json (180 sentences) - 6 hours
- [ ] Validate i+1 methodology compliance - 1 hour
- [ ] Test with Dmitri profile - 1 hour
- [ ] Commit to sentences/ru branch - 10 minutes

**Total Time:** 14 hours
**Priority:** P3 (Medium - Dmitri at A1-B1, not urgent)
**Expected Completion:** Month 5

---

### 2.6 Polish Sentences - NOT STARTED 🚫
**Needed:** 300-500 sentences (A1-C2 full coverage)

**Tasks:**
- [ ] Generate pl-a1a2-sentences.json (180 sentences) - 6 hours
- [ ] Generate pl-b1b2-sentences.json (180 sentences) - 6 hours
- [ ] Generate pl-c1c2-sentences.json (180 sentences) - 6 hours
- [ ] Validate i+1 methodology compliance - 1 hour
- [ ] Create test profile for Polish validation - 1 hour
- [ ] Commit to sentences/pl branch - 10 minutes

**Total Time:** 20 hours
**Priority:** P3 (Medium - no current profiles use Polish)
**Expected Completion:** Month 6

---

### 2.7 Persian Sentences - NOT STARTED 🚫
**Needed:** 300-500 sentences (A1-C2 full coverage)

**Tasks:**
- [ ] Generate fa-a1a2-sentences.json (180 sentences) - 6 hours
- [ ] Generate fa-b1b2-sentences.json (180 sentences) - 6 hours
- [ ] Generate fa-c1c2-sentences.json (180 sentences) - 6 hours
- [ ] Validate i+1 methodology compliance - 1 hour
- [ ] Verify UTF-8 encoding for Persian script - 30 minutes
- [ ] Create test profile for Persian validation - 1 hour
- [ ] Commit to sentences/fa branch - 10 minutes

**Total Time:** 20.5 hours
**Priority:** P3 (Medium - no current profiles use Persian)
**Expected Completion:** Month 6

---

### Sentence Generation Summary

| Language | Current | Needed | Hours | Priority | Month |
|----------|---------|--------|-------|----------|-------|
| Arabic (ar) | 180 | 360 | 13.5 | P2 | Month 3 |
| French (fr) | 294 | 540 | 20 | P2 | Month 3-4 |
| Italian (it) | 180 | 540 | 20 | P2 | Month 4 |
| Russian (ru) | 180 | 360 | 14 | P3 | Month 5 |
| Spanish (es) | 0 | 540 | 20 | P3 | Month 5-6 |
| Polish (pl) | 0 | 540 | 20 | P3 | Month 6 |
| Persian (fa) | 0 | 540 | 20.5 | P3 | Month 6 |
| **TOTAL** | **834** | **3,420** | **128** | | **6 months** |

**Note:** Adjusted for efficient sentence generation with established pipeline

---

## Phase 3: Audio Generation (Low Priority)

### Overview
**Current:** 2,601/12,500 files (20.8% complete)
**Target:** 9,899 remaining files (79.2%)
**Estimated Time:** 2-3 hours manual + 30 minutes automated

**Why Low Priority:**
- Browser TTS fallback works well (98.9% existing coverage)
- Audio generation is fast once vocabulary is complete
- Can be batched efficiently (1000-3000 chars per TTS job)

### 3.1 Audio Generation Tasks
- [ ] Extract all new words from vocabulary batches - 30 minutes
- [ ] Prepare TTS batch files (36 batches @ ~15 min each) - 9 hours total
  - Manual upload to TTSMaker.com: 15 min/batch × 36 = 9 hours
  - Can be done in background while working
- [ ] Run ffmpeg silence detection and splitting - 5 minutes (automated)
- [ ] Hash-based file naming and organization - 10 minutes (automated)
- [ ] Upload to public/audio/ directory - 10 minutes
- [ ] Test audio playback for all languages - 1 hour
- [ ] Commit to audio generation branch - 10 minutes

**Total Time:** 10-12 hours (mostly manual waiting time)
**Priority:** P3 (Low - fallback works well)
**Expected Completion:** After vocabulary completion

**Optimization:**
- Can be done incrementally as vocabulary batches are completed
- Batches of 1000-3000 characters are optimal for TTS
- Silence detection catches 98%+ of word boundaries

---

## Phase 4: Quality Assurance (Ongoing)

### 4.1 French Data Quality Fix 🔧 URGENT
**Issue:** 220 schema violations in fr-a1-batch1.json
**Impact:** Inconsistent user experience, validation failures

**Tasks:**
- [ ] Analyze existing violations - 30 minutes
- [ ] Fix missing examples - 1 hour
- [ ] Correct part of speech tags - 30 minutes
- [ ] Validate translations - 30 minutes
- [ ] Regenerate file if necessary - 1 hour
- [ ] Run validation script - 10 minutes
- [ ] Test with Salman/Jawad profiles - 30 minutes
- [ ] Commit fixes - 10 minutes

**Total Time:** 4.5 hours
**Priority:** P1 (Critical - affects existing content)
**Expected Completion:** Week 1

---

### 4.2 Schema Validation for All New Batches
**Tasks:**
- [ ] Run validate-vocabulary-data.js after each batch - 5 min/batch
- [ ] Manual review of first batch per language - 30 min/language
- [ ] Spot-check random batches for quality - 2 hours total
- [ ] Fix any validation errors - 2-5 hours (as needed)

**Total Time:** 5-10 hours (ongoing)
**Priority:** P2 (High - prevents quality issues)
**Expected Completion:** Ongoing throughout vocabulary generation

---

### 4.3 Cross-Browser Testing
**Browsers:** Safari (iOS/macOS), Chrome, Firefox, Edge

**Tasks:**
- [ ] Test vocabulary mode on all browsers - 2 hours
- [ ] Test sentence practice on all browsers - 2 hours
- [ ] Test audio playback on all browsers - 1 hour
- [ ] Test offline mode on all browsers - 1 hour
- [ ] Test cache-busting on all browsers - 1 hour
- [ ] Document any browser-specific issues - 1 hour
- [ ] Fix critical issues - 2-5 hours (as needed)

**Total Time:** 10-15 hours
**Priority:** P2 (High - ensures broad compatibility)
**Expected Completion:** Month 2-3

---

### 4.4 Mobile Testing
**Devices:** iPhone, iPad, Android phone, Android tablet

**Tasks:**
- [ ] Test iOS Safari PWA install - 1 hour
- [ ] Test Android Chrome PWA install - 1 hour
- [ ] Test swipe gestures on mobile - 1 hour
- [ ] Test offline mode on mobile - 1 hour
- [ ] Test audio playback on mobile - 1 hour
- [ ] Test profile switching on mobile - 1 hour
- [ ] Document mobile-specific issues - 1 hour
- [ ] Fix critical mobile issues - 2-5 hours (as needed)

**Total Time:** 9-14 hours
**Priority:** P2 (High - mobile is primary use case)
**Expected Completion:** Month 3

---

### 4.5 UTF-8 Encoding Verification
**Scripts:** Arabic, Persian (Arabic script), Cyrillic (Russian)

**Tasks:**
- [ ] Test Arabic text rendering - 1 hour
- [ ] Test Persian text rendering - 1 hour
- [ ] Test Russian text rendering - 1 hour
- [ ] Verify right-to-left (RTL) layout for Arabic/Persian - 1 hour
- [ ] Test diacritics display - 1 hour
- [ ] Fix any encoding issues - 2-5 hours (as needed)

**Total Time:** 7-12 hours
**Priority:** P2 (High - critical for non-Latin scripts)
**Expected Completion:** Month 2-3

---

### Quality Assurance Summary

| Task | Hours | Priority | Month |
|------|-------|----------|-------|
| French data quality fix | 4.5 | P1 | Week 1 |
| Schema validation (ongoing) | 5-10 | P2 | Ongoing |
| Cross-browser testing | 10-15 | P2 | Month 2-3 |
| Mobile testing | 9-14 | P2 | Month 3 |
| UTF-8 encoding verification | 7-12 | P2 | Month 2-3 |
| **TOTAL** | **35.5-65.5** | | **6 months** |

---

## Phase 5: Code Refactoring (Optional)

### 5.1 Refactor app.js (3,712 lines)
**Issue:** Monolithic file, difficult to maintain
**Impact:** Code maintainability, future feature additions

**Suggested Breakdown:**
1. **ui.js** - UI rendering and DOM manipulation (500 lines)
2. **navigation.js** - Navigation and routing logic (300 lines)
3. **vocabulary.js** - Vocabulary mode controller (600 lines)
4. **sentences.js** - Sentence practice controller (500 lines)
5. **audio.js** - Audio playback integration (200 lines)
6. **profiles.js** - Profile management (300 lines)
7. **gamification.js** - Achievements and XP (400 lines)
8. **settings.js** - Settings and preferences (200 lines)
9. **app-core.js** - Core initialization (712 lines)

**Tasks:**
- [ ] Plan refactoring strategy - 2 hours
- [ ] Extract UI module - 3 hours
- [ ] Extract navigation module - 2 hours
- [ ] Extract vocabulary module - 4 hours
- [ ] Extract sentences module - 4 hours
- [ ] Extract audio module - 2 hours
- [ ] Extract profiles module - 3 hours
- [ ] Extract gamification module - 3 hours
- [ ] Extract settings module - 2 hours
- [ ] Update imports and dependencies - 2 hours
- [ ] Test all functionality - 3 hours
- [ ] Fix any regressions - 2-5 hours

**Total Time:** 32-35 hours
**Priority:** P3 (Low - nice to have, not blocking)
**Expected Completion:** Month 6 or later

---

## Total Remaining Work Summary

| Phase | Tasks | Hours (Optimistic) | Hours (Realistic) | Hours (Pessimistic) | Priority |
|-------|-------|-------------------|-------------------|---------------------|----------|
| **Deployment** | 1 | 0.5 | 0.7 | 1 | P1 |
| **Vocabulary** | 172 batches | 150 | 209 | 250 | P1-P2 |
| **Sentences** | 2,945 sentences | 40 | 128 | 160 | P2-P3 |
| **Audio** | 9,899 files | 2 | 10 | 15 | P3 |
| **QA** | Multiple | 35.5 | 50 | 65.5 | P1-P2 |
| **Refactoring** | Optional | 0 | 0 | 35 | P3 |
| **TOTAL** | | **228** | **397.7** | **526.5** | |

---

## Execution Strategy

### Sprint 1 (Week 1) - Quick Wins 🔥
**Focus:** Remove blockers, complete near-done items
- [x] Memory documentation ✅
- [ ] Deploy to production (40 minutes)
- [ ] Fix French data quality (4.5 hours)
- [ ] Complete Persian batch 25 (1.5 hours)

**Total:** ~7 hours
**Expected Completion:** 100% Persian vocabulary, production live

---

### Sprint 2-4 (Weeks 2-4) - Italian & Polish
**Focus:** Complete two languages to 100%
- [ ] Italian batches 12-25 (16 hours)
- [ ] Polish batches 14-25 (14.5 hours)
- [ ] Schema validation (2 hours)
- [ ] Audio generation for new words (1 hour)

**Total:** ~33.5 hours
**Expected Completion:** Italian 100%, Polish 100%

---

### Month 2 - English & German
**Focus:** Complete two major languages
- [ ] English batches 3-25 (27 hours)
- [ ] German batches 3-25 (27 hours)
- [ ] Schema validation (4 hours)
- [ ] Audio generation for new words (2 hours)
- [ ] Cross-browser testing (10 hours)

**Total:** ~70 hours
**Expected Completion:** English 100%, German 100%, QA passing

---

### Month 3 - Arabic & Sentences
**Focus:** Complete Arabic, expand sentence coverage
- [ ] Arabic batches 2-25 (28.5 hours)
- [ ] Arabic A1-B2 sentences (13.5 hours)
- [ ] French A1-C2 sentences (20 hours)
- [ ] Italian A2-C2 sentences (20 hours)
- [ ] Schema validation (6 hours)
- [ ] Mobile testing (9 hours)

**Total:** ~97 hours
**Expected Completion:** Arabic 100%, sentence coverage at 70%

---

### Month 4-5 - French, Spanish, Russian
**Focus:** Complete remaining vocabulary
- [ ] French batches 1-25 (33 hours with QA)
- [ ] Spanish batches 1-25 (30.5 hours)
- [ ] Russian batches 1-25 (31 hours)
- [ ] Schema validation (9 hours)
- [ ] Audio generation (5 hours)
- [ ] Russian B2-C2 sentences (14 hours)
- [ ] Spanish A1-C2 sentences (20 hours)

**Total:** ~142.5 hours
**Expected Completion:** All vocabulary 100%, sentence coverage at 90%

---

### Month 6 - Polish & Persian Sentences, Final QA
**Focus:** Complete all content, final polish
- [ ] Polish A1-C2 sentences (20 hours)
- [ ] Persian A1-C2 sentences (20.5 hours)
- [ ] Audio generation completion (5 hours)
- [ ] Final UTF-8 verification (7 hours)
- [ ] Complete cross-browser testing (5 hours)
- [ ] Complete mobile testing (5 hours)
- [ ] Fix all P1/P2 issues (10 hours)

**Total:** ~72.5 hours
**Expected Completion:** 100% content, all QA passing

---

## Risk Assessment

### High Risk 🔴
1. **French Quality Issues** - May require complete regeneration
2. **UTF-8 Encoding** - Arabic/Persian/Russian rendering issues
3. **Mobile Safari Caching** - iOS-specific cache bugs
4. **Audio Generation Time** - Manual TTS upload bottleneck

### Medium Risk 🟡
1. **Sentence Quality** - May need regeneration for quality
2. **Schema Validation** - New batches may have errors
3. **Cross-Browser Compatibility** - Edge cases in different browsers
4. **Time Estimates** - Generation may take longer than expected

### Low Risk 🟢
1. **Deployment** - Git-based deploy is straightforward
2. **Code Refactoring** - Optional, not blocking
3. **Audio Playback** - TTS fallback works well
4. **Profile Management** - Already working well

---

## Success Metrics

### Week 1
- [ ] Production deployment working
- [ ] French quality issues resolved
- [ ] Persian 100% complete

### Month 1
- [ ] Italian 100% complete
- [ ] Polish 100% complete
- [ ] English 60%+ complete

### Month 3
- [ ] All vocabulary 60%+ complete
- [ ] Sentence coverage 70%+ complete
- [ ] Cross-browser testing complete

### Month 6
- [ ] All vocabulary 100% complete
- [ ] Sentence coverage 100% complete
- [ ] All QA passing
- [ ] Production-ready for universal platform transformation

---

**Last Updated:** 2025-11-12 by Claude Code
**Next Review:** After Sprint 1 completion (Week 1)

For current status, see `docs/PROJECT_STATUS.md`
For roadmap, see `docs/ROADMAP.md` (to be created)
