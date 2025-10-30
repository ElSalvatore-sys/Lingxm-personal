# Italian Audio Fix Instructions

Generated: 2025-10-30

---

## 🐛 Problem Diagnosis

**batch-it-001.mp3 FAILED:**
- Silence detection found only 83 segments instead of 100 words
- 17-word mismatch exceeded tolerance (>5 words)
- Script skipped batch entirely → 0 files created
- **Cause:** Italian TTS spoke words too quickly without clear pauses

**batch-it-002.mp3 SUCCEEDED:**
- Found 78 segments vs 80 words (2-word difference)
- Within tolerance → processed successfully
- Created 78/80 MP3 files (97.5% success)

**Current Status:**
- ✅ 78/180 Italian words have audio (43.3%)
- ❌ 102 Italian words missing (from batch-001)

---

## ✅ Solution: Re-generate batch-it-001 with Better Pauses

### Step 1: Copy Fixed Text

Open: `audio-raw/batches/batch-it-001-FIXED.txt`

This file contains:
- 100 Italian words
- **Triple line breaks between words** (more silence than original)
- 816 characters total (well under 3000 limit)

### Step 2: Go to TTSMaker

1. Open: https://ttsmaker.com
2. Copy ALL text from `batch-it-001-FIXED.txt` (Cmd+A, Cmd+C)
3. Paste into TTSMaker text box

### Step 3: Select Voice Settings

**CRITICAL: Use these EXACT settings:**

1. **Language:** Italian (Italy)
2. **Voice:** elsa - italy female (Voice ID: 140002)
3. **Speed:** **0.8x** (SLOWER than normal - this is key!)
   - Or if 0.8x not available, use 0.9x
   - Normal speed (1.0x) will fail again
4. **Pauses:** If there's a "pause duration" setting, increase it

### Step 4: Generate & Download

1. Click "Convert to Speech"
2. Wait for generation (~30 seconds)
3. Click "Download"
4. **Rename file to:** `batch-it-001.mp3` (EXACTLY this name)

### Step 5: Replace File

1. Move downloaded file to: `audio-raw/it/`
2. **Replace** the existing `batch-it-001.mp3`
3. Verify file size is ~800KB-1MB (original was 973KB)

### Step 6: Re-run Split Script

Run this command:

```bash
npm run split-audio
```

The script will:
- Re-process batch-it-001.mp3 with triple line breaks
- Should now find ~98-100 segments
- Extract all 100 words successfully
- Create ~100 new MP3 files in public/audio/it/

### Step 7: Verify Success

Check Italian audio files:

```bash
ls public/audio/it/*.mp3 | wc -l
```

**Expected:** ~178-180 files (78 from batch-2 + 100 from batch-1)

---

## 🎯 Expected Results

**Before Fix:**
- Italian files: 78/180 (43.3%)

**After Fix:**
- Italian files: ~178-180/180 (98-100%)
- Total audio files: ~2,605-2,607

---

## ⚠️ Troubleshooting

### If batch-001 still fails after regeneration:

**Option B: Manual Timestamp Splitting**

If TTSMaker regeneration still doesn't work, we can:
1. Listen to batch-it-001.mp3
2. Note timestamps for each word
3. Use manual split script to cut at exact times

To use Option B, tell me and I'll create the manual splitting script.

### If you get different segment count:

- **95-100 segments:** Good! Process will succeed
- **90-94 segments:** Marginal, might work (tolerance is ±5)
- **<90 segments:** Failed, try even slower speech or Option B

---

## 📊 Summary

| Batch | Status | Words | Created | Success |
|-------|--------|-------|---------|---------|
| batch-it-001 | ❌ FAILED | 100 | 0 | 0% |
| batch-it-002 | ✅ SUCCESS | 80 | 78 | 97.5% |

**Action:** Re-generate batch-it-001 with:
- ✅ Triple line breaks (done - see batch-it-001-FIXED.txt)
- ✅ 0.8x slower speech (do this on TTSMaker)
- ✅ elsa voice (same as before)

**Time Required:** ~5 minutes
**Success Probability:** ~95%

---

## Need Help?

If regeneration doesn't work or you encounter issues:
1. Check error logs: `audio-raw/errors.log`
2. Check split report: `audio-raw/split-report.json`
3. Ask for Option B (manual splitting)
