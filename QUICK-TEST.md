# ⚡ Quick Audio Integration Test

**Dev Server:** ✅ Running at http://localhost:3000/

---

## 🚀 30-Second Test

1. **Open:** http://localhost:3000/
2. **Open DevTools Console** (F12 or Cmd+Option+I)
3. **Look for:**
   ```
   ✅ LingXM initialized with hybrid audio system
   💡 Debug: window.speechManager.getAudioStats() to see cache stats
   ```

4. **Click any profile** → Select vocabulary
5. **Click speaker button** 🔊
6. **Listen:** Should hear high-quality pre-recorded audio!

---

## ✅ Success = You Hear This:

- Clear, consistent voice quality
- No robotic/synthetic sound
- Instant playback (< 200ms)
- Console shows: `"Played pre-recorded audio for: 'word'"`

---

## ⚠️  Fallback = You Hear This:

- Slightly robotic browser TTS voice
- Console shows: `"Audio file not found, will use TTS fallback"`
- **This is OK for 3 words** (1.6% of vocabulary)

---

## 🔍 Quick Console Tests

### Check Cache Stats:
```javascript
window.speechManager.getAudioStats()
```

**Expected:**
```javascript
{
  cachedFiles: 5,      // Number of MP3s in memory
  failedFiles: 0,      // Number of missing files found
  totalAttempts: 5     // Total lookups
}
```

### Disable Pre-recorded Audio (Test Fallback):
```javascript
window.speechManager.togglePrerecordedAudio(false);
// Now click speaker → Should use browser TTS

window.speechManager.togglePrerecordedAudio(true);
// Re-enable pre-recorded audio
```

---

## 🎯 Priority Tests

### Test #1: Arabic (CRITICAL)
- Open Hassan's profile
- Click Arabic vocabulary
- Test speaker button
- **Expected:** Beautiful, clear Arabic audio

### Test #2: German
- Open any German vocabulary
- Test: "lernen", "verstehen"
- **Expected:** Native German pronunciation

### Test #3: English
- Test: "to implement", "achievement"
- **Expected:** Clear American/British English

---

## 📊 What to Check in Network Tab

1. Open DevTools → **Network** tab
2. Filter: `mp3`
3. Click speaker button
4. **Should see:**
   - `GET /audio/de/41efdb22.mp3`
   - Status: `200`
   - Size: `~2-12 KB`
   - Time: `< 100ms`

5. Click **same speaker again**
   - **No new network request!** (Cached)

---

## ❌ If Something's Wrong

### No Audio at All?
- Check console for red errors
- Verify audio files exist: `ls public/audio/de/*.mp3`
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### All Words Use TTS Fallback?
- Check Network tab for 404 errors
- Verify server is serving files from `public/audio/`
- Check browser console for "Audio file not found" messages

### Console Errors?
- Copy error message
- Check if `audioManager.js` imported correctly
- Restart dev server

---

## ✨ Ready to Test?

**Your dev server is running!**
**Open: http://localhost:3000/**

The hybrid audio system is live and waiting for you to test it! 🎉

---

**For detailed testing guide, see: TESTING-GUIDE.md**
