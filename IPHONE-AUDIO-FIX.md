# iPhone Audio Issues - Diagnosis & Fix

**Issue:** Audio not working on iPhone Safari
**Root Cause:** iOS requires user interaction before playing audio (autoplay policy)

---

## 🔍 Likely Problems on iPhone

### 1. **iOS Autoplay Policy** (Most Common)
iOS Safari blocks audio playback unless triggered by user interaction.

**Symptoms:**
- Desktop works fine
- iPhone: No audio plays
- Console: "NotAllowedError: play() failed"

**Fix:** Ensure audio is only played after user tap/click

### 2. **Audio Format Issues**
iOS Safari is picky about MP3 encoding.

**Check:**
- Are MP3 files encoded correctly?
- Sample rate: 44.1kHz or 48kHz
- Bitrate: 128kbps or higher

### 3. **Service Worker Caching**
Old cached files on iPhone.

**Fix:**
- Hard refresh on iPhone (hold refresh button)
- Clear Safari cache
- Update service worker

---

## ✅ Current Implementation Check

Let me verify our audioManager handles iOS correctly:

**File:** `src/utils/audioManager.js`

**Current playWithFallback() method:**
```javascript
async playWithFallback(text, language, buttonElement) {
  // Update button state to loading
  const originalContent = buttonElement.innerHTML;
  buttonElement.classList.add('loading');
  buttonElement.disabled = true;

  try {
    // Detect if this is a sentence vs a word
    const isSentence = text.length > 50 || (text.includes(' ') && text.split(' ').length > 3);

    if (isSentence) {
      // Sentences always use TTS
      console.debug(`[Audio] Using TTS for sentence: "${text.substring(0, 30)}..."`);
      this.speechManager.speakWithFeedback(text, language, buttonElement);
      return false;
    }

    // For short text, try pre-recorded audio
    const audio = await this.loadAudio(text, language);

    if (audio) {
      // Play pre-recorded audio
      await this.playAudioElement(audio, buttonElement);
      console.debug(`[Audio] Played pre-recorded audio for: "${text}"`);
      return true;
    } else {
      // Fall back to Web Speech API
      console.debug(`[Audio] No pre-recorded audio for "${text}", using TTS fallback`);
      this.speechManager.speakWithFeedback(text, language, buttonElement);
      return false;
    }
  } catch (error) {
    console.error('[Audio] Playback error:', error);
    // Final fallback to TTS
    this.speechManager.speakWithFeedback(text, language, buttonElement);
    return false;
  } finally {
    // Reset button state
    setTimeout(() => {
      buttonElement.classList.remove('loading');
      buttonElement.disabled = false;
    }, 100);
  }
}
```

**Issue:** The `audio.play()` call in `playAudioElement()` may fail on iOS if not triggered directly by user interaction.

---

## 🔧 iPhone-Specific Fixes Needed

### Fix 1: Add iOS Detection and User Interaction Check

**Add to audioManager.js:**

```javascript
constructor(speechManager) {
  this.speechManager = speechManager;
  this.audioCache = new Map();
  this.failedHashes = new Set();
  this.AUDIO_BASE_PATH = '/audio';
  this.preloadQueue = [];
  this.isPreloading = false;

  // iOS Detection
  this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Track if user has interacted (for iOS autoplay policy)
  this.userHasInteracted = false;
  this.setupInteractionListener();
}

setupInteractionListener() {
  // iOS requires user interaction before audio
  const markInteraction = () => {
    this.userHasInteracted = true;
    console.log('[Audio] User interaction detected, audio unlocked');
  };

  // Listen for first touch/click
  document.addEventListener('touchstart', markInteraction, { once: true });
  document.addEventListener('click', markInteraction, { once: true });
}
```

### Fix 2: Improve playAudioElement for iOS

```javascript
async playAudioElement(audio, buttonElement) {
  return new Promise((resolve, reject) => {
    // Clone audio to allow multiple simultaneous plays
    const audioClone = audio.cloneNode();

    // iOS SPECIFIC: Set playsinline attribute
    if (this.isIOS) {
      audioClone.setAttribute('playsinline', '');
      audioClone.setAttribute('webkit-playsinline', '');
    }

    // Add visual feedback
    buttonElement.classList.add('speaking');

    // Handle playback events
    audioClone.addEventListener('ended', () => {
      buttonElement.classList.remove('speaking');
      resolve();
    }, { once: true });

    audioClone.addEventListener('error', (error) => {
      buttonElement.classList.remove('speaking');
      console.error('[Audio] Playback error:', error);
      reject(error);
    }, { once: true });

    // Start playback with iOS-specific error handling
    audioClone.play()
      .then(() => {
        console.log('[Audio] Playback started successfully');
      })
      .catch(error => {
        console.error('[Audio] Play failed:', error);

        // iOS specific: If autoplay fails, show user prompt
        if (this.isIOS && error.name === 'NotAllowedError') {
          console.warn('[Audio] iOS autoplay blocked. User interaction may be needed.');
          // Fallback to TTS
          buttonElement.classList.remove('speaking');
          reject(new Error('iOS autoplay blocked'));
        } else {
          reject(error);
        }
      });
  });
}
```

### Fix 3: Add Audio Context Unlock for iOS

iOS Safari requires the AudioContext to be unlocked via user interaction.

**Add to audioManager.js constructor:**

```javascript
// For iOS: Create and unlock AudioContext
if (this.isIOS) {
  this.unlockAudioContext();
}

unlockAudioContext() {
  // Create AudioContext for iOS audio unlock
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    console.warn('[Audio] AudioContext not supported');
    return;
  }

  this.audioContext = new AudioContext();

  // Unlock audio on first user interaction
  const unlock = () => {
    // Create empty buffer
    const buffer = this.audioContext.createBuffer(1, 1, 22050);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    // Play silent sound to unlock
    if (source.start) {
      source.start(0);
    } else if (source.play) {
      source.play(0);
    } else if (source.noteOn) {
      source.noteOn(0);
    }

    console.log('[Audio] iOS AudioContext unlocked');

    // Remove listeners after unlock
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('click', unlock);
  };

  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('click', unlock, { once: true });
}
```

---

## 🧪 Testing on iPhone

### Step 1: Check Console Logs

Open Safari on iPhone:
1. Connect iPhone to Mac via USB
2. On Mac: Safari → Develop → [Your iPhone] → [Your Site]
3. Watch console for errors

**Look for:**
- "NotAllowedError: play() failed"
- "The request is not allowed by the user agent"
- "User interaction is required"

### Step 2: Test Audio Playback

1. Open app on iPhone
2. Select a profile
3. Tap speaker icon on a word
4. Check:
   - Does audio play?
   - Any console errors?
   - Does TTS fallback work?

### Step 3: Test After Hard Refresh

1. Hold refresh button in Safari
2. Tap "Reload Without Content Blockers"
3. Test audio again

---

## 🚀 Quick Fix to Deploy Now

**If you need immediate iPhone fix, I can:**

1. **Update audioManager.js** with iOS-specific fixes
2. **Commit the changes**
3. **Push to GitHub** → Vercel auto-deploys
4. **Test on iPhone** after deployment

**Estimated time:** 5 minutes to implement + 2 minutes deploy

---

## 📋 Alternative: Use iOS-Compatible Audio Format

If MP3 doesn't work, we can also generate M4A or AAC files which are better supported on iOS.

**But first, let's try the code fixes above** - they're easier and usually solve the issue.

---

## ✅ Summary

**Most Likely Issue:** iOS autoplay policy blocking audio
**Fix:** Add iOS detection + AudioContext unlock + playsinline attributes
**Deploy:** Push to GitHub → Vercel auto-deploys → Test on iPhone

**Should I implement these iPhone fixes now?** 📱
