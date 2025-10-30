/**
 * Audio Manager - Hybrid Audio System
 *
 * Manages audio playback with intelligent fallback:
 * 1. Try to load pre-recorded MP3 files (high quality)
 * 2. Fall back to Web Speech API if file unavailable
 *
 * Features:
 * - Hash-based file lookup
 * - Memory caching for performance
 * - Error handling and retry logic
 * - Seamless fallback to TTS
 */

export class AudioManager {
  constructor(speechManager) {
    this.speechManager = speechManager;
    this.audioCache = new Map(); // Cache loaded audio elements
    this.failedHashes = new Set(); // Track files that don't exist
    this.AUDIO_BASE_PATH = '/audio'; // Base path for audio files

    // Preload popular words on idle
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  /**
   * Generate hash from text (matches scripts/hash.js)
   * @param {string} text - Word or phrase to hash
   * @returns {string} 8-character hex hash
   */
  generateHash(text) {
    let hash = 0;
    const str = text.toLowerCase().trim();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16).substring(0, 8);
  }

  /**
   * Normalize language code (handle variants like de-gastro → de)
   * @param {string} language - Language code (possibly with variant)
   * @returns {string} Base language code
   */
  normalizeLanguage(language) {
    // Map language variants to base languages
    const languageMap = {
      'de-gastro': 'de',
      'de-it': 'de',
      'en-us': 'en',
      'en-gb': 'en',
      'fr-be': 'fr',
      'ar-sa': 'ar'
    };

    const normalized = languageMap[language.toLowerCase()] || language;

    // Extract base language from codes like 'de-DE' or 'en-US'
    if (normalized.includes('-')) {
      return normalized.split('-')[0];
    }

    return normalized;
  }

  /**
   * Generate audio file path from word and language
   * @param {string} word - The word to speak
   * @param {string} language - Language code (de, en, ar, fr, it, pl)
   * @returns {string} Path to audio file
   */
  getAudioPath(word, language) {
    const hash = this.generateHash(word);
    const normalizedLang = this.normalizeLanguage(language);
    return `${this.AUDIO_BASE_PATH}/${normalizedLang}/${hash}.mp3`;
  }

  /**
   * Load audio file from cache or fetch it
   * @param {string} word - Word to load
   * @param {string} language - Language code
   * @returns {Promise<HTMLAudioElement|null>} Audio element or null if not found
   */
  async loadAudio(word, language) {
    const hash = this.generateHash(word);
    const normalizedLang = this.normalizeLanguage(language);
    const cacheKey = `${normalizedLang}:${hash}`;

    // Check if we already know this file doesn't exist
    if (this.failedHashes.has(cacheKey)) {
      return null;
    }

    // Return cached audio if available
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey);
    }

    // Try to load the audio file
    const audioPath = this.getAudioPath(word, language);

    try {
      const audio = new Audio(audioPath);

      // Test if file exists by attempting to load metadata
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });

      // Cache successful load
      this.audioCache.set(cacheKey, audio);
      return audio;

    } catch (error) {
      // File doesn't exist or failed to load
      console.debug(`Audio file not found: ${audioPath}, will use TTS fallback`);
      this.failedHashes.add(cacheKey);
      return null;
    }
  }

  /**
   * Play audio with fallback to Web Speech API
   * @param {string} text - Text to speak
   * @param {string} language - Language code
   * @param {HTMLElement} buttonElement - Speaker button element
   * @returns {Promise<boolean>} True if audio played, false if fallback used
   */
  async playWithFallback(text, language, buttonElement) {
    // Update button state to loading
    const originalContent = buttonElement.innerHTML;
    buttonElement.classList.add('loading');
    buttonElement.disabled = true;

    try {
      // Detect if this is a sentence (long text with spaces) vs a single word
      const isSentence = text.length > 50 || (text.includes(' ') && text.split(' ').length > 3);

      if (isSentence) {
        // Sentences always use TTS (no pre-recorded audio for full sentences)
        console.debug(`[Audio] Using TTS for sentence: "${text.substring(0, 30)}..."`);
        this.speechManager.speakWithFeedback(text, language, buttonElement);
        return false; // Used TTS
      }

      // For short text (single words or short phrases), try pre-recorded audio
      const audio = await this.loadAudio(text, language);

      if (audio) {
        // Play pre-recorded audio
        await this.playAudioElement(audio, buttonElement);
        console.debug(`[Audio] Played pre-recorded audio for: "${text}"`);
        return true; // Used pre-recorded audio
      } else {
        // Fall back to Web Speech API
        console.debug(`[Audio] No pre-recorded audio for "${text}", using TTS fallback`);
        this.speechManager.speakWithFeedback(text, language, buttonElement);
        return false; // Used TTS fallback
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

  /**
   * Play an audio element with visual feedback
   * @param {HTMLAudioElement} audio - Audio element to play
   * @param {HTMLElement} buttonElement - Speaker button element
   * @returns {Promise<void>}
   */
  async playAudioElement(audio, buttonElement) {
    return new Promise((resolve, reject) => {
      // Clone audio to allow multiple simultaneous plays
      const audioClone = audio.cloneNode();

      // Add visual feedback
      buttonElement.classList.add('speaking');

      // Handle playback events
      audioClone.addEventListener('ended', () => {
        buttonElement.classList.remove('speaking');
        resolve();
      }, { once: true });

      audioClone.addEventListener('error', (error) => {
        buttonElement.classList.remove('speaking');
        reject(error);
      }, { once: true });

      // Start playback
      audioClone.play().catch(reject);
    });
  }

  /**
   * Preload audio files for better performance
   * @param {Array<{word: string, language: string}>} wordList - Words to preload
   */
  async preloadAudio(wordList) {
    if (this.isPreloading) return;

    this.isPreloading = true;
    this.preloadQueue = [...wordList];

    // Preload in background during idle time
    const preloadNext = async () => {
      if (this.preloadQueue.length === 0) {
        this.isPreloading = false;
        return;
      }

      const { word, language } = this.preloadQueue.shift();

      try {
        await this.loadAudio(word, language);
      } catch (error) {
        // Silently fail preloading
        console.debug(`Preload failed for ${word} (${language})`);
      }

      // Continue preloading with delay
      if (this.preloadQueue.length > 0) {
        setTimeout(preloadNext, 100); // Throttle preloading
      } else {
        this.isPreloading = false;
      }
    };

    preloadNext();
  }

  /**
   * Clear audio cache (useful for memory management)
   */
  clearCache() {
    this.audioCache.clear();
    console.log('Audio cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      cachedFiles: this.audioCache.size,
      failedFiles: this.failedHashes.size,
      totalAttempts: this.audioCache.size + this.failedHashes.size
    };
  }
}
