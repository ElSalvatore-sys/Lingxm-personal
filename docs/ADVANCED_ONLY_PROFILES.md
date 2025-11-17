# Advanced-Only Vocabulary Profiles

## Issue Summary

The following vocabulary files contain **only C1-C2 advanced/academic vocabulary** with no beginner (A1-B1) content:

### Affected Files

1. **hassan/en.json** - Advanced English academic vocabulary
   - Sample words: scrutinize, articulate, substantiate, pragmatic, optimization
   - Level: C1-C2 only
   - Use case: Academic writing, research, thesis work

2. **hassan/de.json** - Advanced German academic/philosophical vocabulary
   - Sample words: Ambivalenz, implizieren, Prämisse, relativieren, Stringenz
   - Level: C1-C2 only
   - Use case: Academic conferences, philosophical texts, dissertations

3. **hassan/ar.json** - Advanced Arabic (business, media, politics)
   - Sample words: إستراتيجية (strategy), تحليل (analysis), ديمقراطية (democracy)
   - Level: B2-C2
   - Use case: Professional/academic Arabic contexts

4. **dmitri/en.json** - Same as hassan/en.json (advanced English)
   - Level: C1-C2 only

## Current State (After Phase 1)

✅ **CEFR metadata added**
- Words 0-89: Labeled as "C1"
- Words 90-179: Labeled as "C2"

## Solutions

### Option 1: Document as "Advanced-Only" ⭐ RECOMMENDED FOR NOW
- Add metadata field to indicate these are advanced-only profiles
- Keep existing content for advanced learners
- Generate separate A1-B2 files in Phase 3

### Option 2: Generate Full A1-C2 Content (Phase 3)
- Generate 180 new A1-B2 words for these profiles
- Move existing C1-C2 words to indices 120-179
- Result: Complete A1-C2 progression

### Option 3: Replace Entirely (Phase 3)
- Generate completely new frequency-based vocabulary
- Replace with proper A1 → C2 progression
- Archive current content for reference

## Recommendation

**For Phase 1:** Mark these files as "advanced-only" and document the use case

**For Phase 3:** Generate new A1-C2 files with proper progression using frequency sources

## Implementation

These profiles serve advanced learners (graduate students, researchers, professionals) who need sophisticated vocabulary for academic or professional contexts. The vocabulary is intentionally advanced and should be preserved as optional "advanced tracks" while also creating beginner-friendly alternatives.

---

**Status:** Documented
**Next Action:** Create beginner-friendly alternatives in Phase 3 (vocabulary generation)
