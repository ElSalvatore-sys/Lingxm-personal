// Text-to-Speech System for LingXM Personal
// Hybrid approach: Uses pre-recorded audio files with Web Speech API fallback

import { AudioManager } from './audioManager.js';

export class SpeechManager {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.isSupported = 'speechSynthesis' in window;
    this.currentUtterance = null;
    this.currentSpeed = 'normal'; // slow, normal, fast

    // Initialize audio manager for pre-recorded files
    this.audioManager = new AudioManager(this);
    this.usePrerecordedAudio = true; // Feature flag to enable/disable pre-recorded audio

    if (this.isSupported) {
      this.loadVoices();

      // Voices might load asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    this.voices = this.synthesis.getVoices();
    console.log(`Loaded ${this.voices.length} voices`);
  }

  // Get best voice for language
  getBestVoice(languageCode) {
    if (!this.isSupported || this.voices.length === 0) {
      return null;
    }

    // Language code mapping
    const langMap = {
      'de': ['de-DE', 'de-AT', 'de-CH', 'de'],
      'de-gastro': ['de-DE', 'de-AT', 'de-CH', 'de'],
      'en': ['en-US', 'en-GB', 'en-AU', 'en'],
      'fr': ['fr-FR', 'fr-CA', 'fr-BE', 'fr'],
      'ar': ['ar-SA', 'ar-EG', 'ar'],
      'pl': ['pl-PL', 'pl'],
      'it': ['it-IT', 'it-CH', 'it']
    };

    const possibleLangs = langMap[languageCode] || [languageCode];

    // Try to find a voice matching the language
    for (const lang of possibleLangs) {
      const matchingVoices = this.voices.filter(v => v.lang.startsWith(lang));

      if (matchingVoices.length > 0) {
        // Prefer Google/Premium/Enhanced voices (better quality)
        let bestVoice = matchingVoices.find(v =>
          v.name.includes('Google') ||
          v.name.includes('Premium') ||
          v.name.includes('Enhanced')
        );

        // Fallback to first matching voice
        if (!bestVoice) {
          bestVoice = matchingVoices[0];
        }

        console.log(`Found voice for ${languageCode}: ${bestVoice.name} (${bestVoice.lang})`);
        return bestVoice;
      }
    }

    // Fallback to first available voice
    console.log(`No specific voice found for ${languageCode}, using default`);
    return this.voices[0];
  }

  // Get speed value from preset
  getSpeedValue(preset) {
    const speeds = {
      'slow': 0.7,
      'normal': 0.9,
      'fast': 1.2
    };
    return speeds[preset] || speeds.normal;
  }

  // Set speed preset
  setSpeed(preset) {
    if (['slow', 'normal', 'fast'].includes(preset)) {
      this.currentSpeed = preset;
      console.log(`Speech speed set to: ${preset}`);
    }
  }

  // Speak text
  speak(text, languageCode, onEnd = null) {
    if (!this.isSupported) {
      console.error('Speech synthesis not supported');
      return false;
    }

    // Stop any ongoing speech
    this.stop();

    // Create utterance
    this.currentUtterance = new SpeechSynthesisUtterance(text);

    // Set voice
    const voice = this.getBestVoice(languageCode);
    if (voice) {
      this.currentUtterance.voice = voice;
      this.currentUtterance.lang = voice.lang;
    } else {
      // Set language even without specific voice
      this.currentUtterance.lang = languageCode;
    }

    // Set speech parameters
    this.currentUtterance.rate = this.getSpeedValue(this.currentSpeed);
    this.currentUtterance.pitch = 1.0;
    this.currentUtterance.volume = 1.0;

    // Event handlers
    this.currentUtterance.onend = () => {
      console.log('Speech finished');
      if (onEnd) onEnd();
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      this.showError('Audio not available on this device');
      if (onEnd) onEnd();
    };

    // Speak
    try {
      this.synthesis.speak(this.currentUtterance);
      console.log(`Speaking: "${text}" in ${languageCode} at ${this.currentSpeed} speed`);
      return true;
    } catch (error) {
      console.error('Speech failed:', error);
      return false;
    }
  }

  // Stop current speech
  stop() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  // Check if speaking
  isSpeaking() {
    return this.synthesis.speaking;
  }

  // Speak with visual feedback (hybrid: pre-recorded audio + TTS fallback)
  async speakWithFeedback(text, languageCode, buttonElement) {
    if (this.isSpeaking()) {
      this.stop();
      this.resetButton(buttonElement);
      return;
    }

    // Try pre-recorded audio first if enabled
    if (this.usePrerecordedAudio) {
      try {
        const usedPrerecorded = await this.audioManager.playWithFallback(
          text,
          languageCode,
          buttonElement
        );

        if (usedPrerecorded) {
          // Successfully played pre-recorded audio
          console.debug(`Played pre-recorded audio for: "${text}"`);
          return;
        }
        // If usedPrerecorded is false, audioManager already fell back to TTS
        return;
      } catch (error) {
        console.error('Audio playback error, falling back to TTS:', error);
        // Continue to TTS fallback below
      }
    }

    // Fallback to Web Speech API (or if pre-recorded disabled)
    buttonElement.classList.add('speaking');

    this.speak(text, languageCode, () => {
      this.resetButton(buttonElement);
    });
  }

  resetButton(buttonElement) {
    if (buttonElement) {
      buttonElement.classList.remove('speaking');
    }
  }

  // Show error toast to user
  showError(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'tts-error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Get available languages
  getAvailableLanguages() {
    const languages = new Set();
    this.voices.forEach(voice => {
      const lang = voice.lang.split('-')[0];
      languages.add(lang);
    });
    return Array.from(languages);
  }

  // Check if supported
  isAvailable() {
    return this.isSupported && this.voices.length > 0;
  }

  // Toggle pre-recorded audio feature
  togglePrerecordedAudio(enabled) {
    this.usePrerecordedAudio = enabled;
    console.log(`Pre-recorded audio ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get audio cache statistics
  getAudioStats() {
    if (this.audioManager) {
      return this.audioManager.getCacheStats();
    }
    return null;
  }

  // Preload audio for current vocabulary
  async preloadVocabularyAudio(words, language) {
    if (this.audioManager && this.usePrerecordedAudio) {
      const wordList = words.map(word => ({ word, language }));
      await this.audioManager.preloadAudio(wordList);
      console.log(`Preloaded ${words.length} audio files for ${language}`);
    }
  }
}
