# TTSMaker Audio Generation Instructions

Generated: 2025-10-30T16:33:26.455Z

---

## Overview

You need to generate **33 batch audio files** containing **2289 words** total.

**Estimated time:** 66 minutes (2 min per batch)

### ⚠️ Note: Some Batches Were Regenerated

- **DE**: Re-split into 18 smaller batches (was 12) to fit 1000 character limit

- **FR**: Re-split into 5 smaller batches (was 3) to fit 1000 character limit

---

## General Workflow

For each batch file in `audio-raw/batches/`:

1. Open the .txt file
2. Copy all text (Cmd+A, Cmd+C)
3. Go to https://ttsmaker.com
4. Paste text into the text box
5. Select the correct voice (see language sections below)
6. Click "Convert to Speech"
7. Click "Download"
8. **IMPORTANT:** Rename downloaded file to match batch name
   - Example: `ttsmaker-file-2025-01-15-1234.mp3` → `batch-de-001.mp3`
9. Move renamed file to `audio-raw/`
10. Repeat for next batch

---

## Language-Specific Instructions



### DE (REGENERATED)

**Voice:** audwin - standard männerstimme

**Voice ID:** 289

**Character Limit:** 1000 chars per batch

**Batches:** 18

**Selection:** Select "German (Germany)" → "audwin - standard männerstimme" (Voice ID: 289)

**Files to process:**

- [ ] batch-de-001.txt → batch-de-001.mp3
- [ ] batch-de-002.txt → batch-de-002.mp3
- [ ] batch-de-003.txt → batch-de-003.mp3
- [ ] batch-de-004.txt → batch-de-004.mp3
- [ ] batch-de-005.txt → batch-de-005.mp3
- [ ] batch-de-006.txt → batch-de-006.mp3
- [ ] batch-de-007.txt → batch-de-007.mp3
- [ ] batch-de-008.txt → batch-de-008.mp3
- [ ] batch-de-009.txt → batch-de-009.mp3
- [ ] batch-de-010.txt → batch-de-010.mp3
- [ ] batch-de-011.txt → batch-de-011.mp3
- [ ] batch-de-012.txt → batch-de-012.mp3
- [ ] batch-de-013.txt → batch-de-013.mp3
- [ ] batch-de-014.txt → batch-de-014.mp3
- [ ] batch-de-015.txt → batch-de-015.mp3
- [ ] batch-de-016.txt → batch-de-016.mp3
- [ ] batch-de-017.txt → batch-de-017.mp3
- [ ] batch-de-018.txt → batch-de-018.mp3


### EN

**Voice:** alayna - united states female

**Voice ID:** 148

**Character Limit:** 1000 chars per batch

**Batches:** 6

**Selection:** Select "English (United States)" → "alayna - united states female" (Voice ID: 148)

**Files to process:**

- [ ] batch-en-001.txt → batch-en-001.mp3
- [ ] batch-en-002.txt → batch-en-002.mp3
- [ ] batch-en-003.txt → batch-en-003.mp3
- [ ] batch-en-004.txt → batch-en-004.mp3
- [ ] batch-en-005.txt → batch-en-005.mp3
- [ ] batch-en-006.txt → batch-en-006.mp3


### AR

**Voice:** نور - syria female

**Voice ID:** 700621

**Character Limit:** 3000 chars per batch

**Batches:** 2

**Selection:** Select "Arabic (Syria)" → "نور" female voice (Voice ID: 700621)

**Files to process:**

- [ ] batch-ar-001.txt → batch-ar-001.mp3
- [ ] batch-ar-002.txt → batch-ar-002.mp3


### FR (REGENERATED)

**Voice:** charline - belgium female

**Voice ID:** 130011

**Character Limit:** 1000 chars per batch

**Batches:** 5

**Selection:** Select "French (Belgium)" → "charline" female voice (Voice ID: 130011)

**Files to process:**

- [ ] batch-fr-001.txt → batch-fr-001.mp3
- [ ] batch-fr-002.txt → batch-fr-002.mp3
- [ ] batch-fr-003.txt → batch-fr-003.mp3
- [ ] batch-fr-004.txt → batch-fr-004.mp3
- [ ] batch-fr-005.txt → batch-fr-005.mp3


### IT

**Voice:** elsa - italy female

**Voice ID:** 140002

**Character Limit:** 3000 chars per batch

**Batches:** 2

**Selection:** Select "Italian (Italy)" → "elsa" female voice (Voice ID: 140002)

**Files to process:**

- [ ] batch-it-001.txt → batch-it-001.mp3
- [ ] batch-it-002.txt → batch-it-002.mp3


---

## Important Notes

- **File naming is critical!** The split script expects exact batch names.
- **Voice selection must be exact** for consistent quality.
- TTSMaker is free but may have rate limits. If blocked, wait 10 minutes.
- Double line breaks in text files create pauses for word splitting.
- Download all batches before running the split script.
- German and French use smaller batches (1000 char limit)
- Polish, Arabic, Italian use larger batches (3000 char limit)

---

## Checklist Progress

- [ ] Downloaded all 33 batch MP3 files
- [ ] Renamed all files correctly (batch-XX-YYY.mp3)
- [ ] Moved all files to audio-raw/
- [ ] Verified file count matches batch count
- [ ] Ready to run split script

---

## After Completion

When all MP3 files are in `audio-raw/`, run:

```bash
npm run split-audio
```

This will automatically split the batch files into individual word audio files.
