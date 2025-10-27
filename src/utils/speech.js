// Text-to-Speech System for LingXM Personal

export class SpeechManager {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.isSupported = 'speechSynthesis' in window;
    this.currentUtterance = null;
    this.currentSpeed = 'normal'; // slow, normal, fast

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
      'pl': ['pl-PL', 'pl']
    };

    const possibleLangs = langMap[languageCode] || [languageCode];

    // Try to find a voice matching the language
    for (const lang of possibleLangs) {
      const voice = this.voices.find(v => v.lang.startsWith(lang));
      if (voice) {
        console.log(`Found voice for ${languageCode}: ${voice.name} (${voice.lang})`);
        return voice;
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

  // Speak with visual feedback
  speakWithFeedback(text, languageCode, buttonElement) {
    if (this.isSpeaking()) {
      this.stop();
      this.resetButton(buttonElement);
      return;
    }

    // Visual feedback - button pulsing
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
}
