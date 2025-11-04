/**
 * SentenceManager - Handles sentence loading and i+1 selection
 * Completely independent from vocabulary system
 */
class SentenceManager {
  constructor() {
    this.sentenceCache = {}; // Cache loaded sentences per language
    this.loadedLanguages = new Set();
  }

  /**
   * Load sentences for a language from JSON (on-demand, lazy loading)
   * @param {string} language - Language code (en, ar, de, etc.)
   * @param {string} userLevel - User's proficiency level (e.g., "a1a2", "b1b2", "c1c2")
   * @returns {Object|null} - Sentence data or null if not found
   */
  async loadSentences(language, userLevel = null) {
    console.log(`[SENTENCES] Loading sentences for ${language} at level: ${userLevel || 'auto'}`);

    // Create cache key with level
    const cacheKey = userLevel ? `${language}-${userLevel}` : language;

    // Return from cache if already loaded
    if (this.sentenceCache[cacheKey]) {
      console.log(`[SENTENCES] Using cached sentences for ${cacheKey}`);
      return this.sentenceCache[cacheKey];
    }

    try {
      // Build patterns: If userLevel is specified, try it FIRST
      let patterns = [];

      if (userLevel) {
        // User's level gets priority
        patterns.push(`/data/sentences/${language}/${language}-${userLevel}-sentences.json`);
      }

      // Fallback patterns (only if user level didn't work)
      patterns = patterns.concat([
        `/data/sentences/${language}/${language}-c1c2-sentences.json`,
        `/data/sentences/${language}/${language}-b1b2-sentences.json`,
        `/data/sentences/${language}/${language}-a1a2-sentences.json`,
        `/data/sentences/${language}-sentences.json` // Legacy fallback
      ]);

      let response = null;
      let foundPattern = null;

      for (const pattern of patterns) {
        response = await fetch(pattern);
        if (response.ok) {
          foundPattern = pattern;
          console.log(`[SENTENCES] Found sentences at: ${pattern}`);
          break;
        }
      }

      if (!response || !response.ok) {
        console.warn(`[SENTENCES] No sentences found for ${language}`);
        return null;
      }

      const data = await response.json();

      // Validate data structure
      if (!data.metadata || !data.sentences) {
        console.error(`[SENTENCES] Invalid sentence data structure for ${language}`);
        return null;
      }

      // Cache the data with level-specific key
      this.sentenceCache[cacheKey] = data;
      this.loadedLanguages.add(cacheKey);

      console.log(`[SENTENCES] ✅ Loaded ${data.metadata.total_sentences} sentences for ${cacheKey}`);
      if (data.metadata.source_profile && data.metadata.source_level) {
        console.log(`[SENTENCES] Source: ${data.metadata.source_profile} (${data.metadata.source_level})`);
      }
      return data;
    } catch (error) {
      console.error(`[SENTENCES] Error loading ${language}:`, error);
      return null;
    }
  }

  /**
   * Get all sentences for a specific target word
   * @param {string} language - Language code
   * @param {string} word - Target word
   * @returns {Array} - Array of sentence objects
   */
  getSentencesForWord(language, word) {
    const data = this.sentenceCache[language];
    if (!data || !data.sentences[word]) {
      console.warn(`[SENTENCES] No sentences found for word: ${word} in ${language}`);
      return [];
    }
    return data.sentences[word];
  }

  /**
   * Find i+1 sentences where 80-95% of vocabulary is mastered
   * @param {string} language - Language code
   * @param {Array<string>} masteredWords - Array of mastered word strings
   * @param {number} limit - Maximum number of sentences to return
   * @param {string} userLevel - User's proficiency level (e.g., "a1a2", "b1b2", "c1c2")
   * @returns {Array} - Array of i+1 sentences with metadata
   */
  async findI1Sentences(language, masteredWords, limit = 10, userLevel = null) {
    console.log(`[SENTENCES] Finding i+1 sentences for ${language}`);
    console.log(`[SENTENCES] User has mastered ${masteredWords.length} words`);
    console.log(`[SENTENCES] User level: ${userLevel || 'auto'}`);

    // Create Set for faster lookups (lowercase for case-insensitive matching)
    const masteredSet = new Set(masteredWords.map(w => w.toLowerCase()));

    // NO MASTERY REQUIREMENT MODE - Use ALL sentences
    if (masteredWords.length === 0) {
      console.log('[SENTENCES] ⚠️ No mastered words, returning ALL sentences for practice');

      const data = await this.loadSentences(language, userLevel);
      if (!data || !data.sentences) {
        console.warn('[SENTENCES] No sentence data available');
        return [];
      }

      // Flatten all sentences into single array
      const allSentences = [];
      Object.entries(data.sentences).forEach(([word, wordSentences]) => {
        if (Array.isArray(wordSentences)) {
          wordSentences.forEach(sent => {
            if (sent && typeof sent === 'object') {
              allSentences.push({
                ...sent,
                word_source: word
              });
            }
          });
        }
      });

      // Shuffle and return limited set
      const shuffled = allSentences.sort(() => Math.random() - 0.5);
      const result = shuffled.slice(0, limit);
      console.log(`[SENTENCES] ✅ Returning ${result.length} sentences (no mastery filter)`);
      return result;
    }

    // Load sentences for language with user's level
    const data = await this.loadSentences(language, userLevel);
    if (!data || !data.sentences) {
      console.warn('[SENTENCES] No sentence data available');
      return [];
    }

    console.log(`[SENTENCES] Processing sentences with ${masteredWords.length} mastered words`);

    // ============================================================
    // BUILD RESULTS WITH SAFE PROCESSING
    // ============================================================
    const results = [];
    const sentenceEntries = Object.entries(data.sentences);

    console.log(`[SENTENCES] Processing ${sentenceEntries.length} word entries`);

    sentenceEntries.forEach(([word, wordSentences]) => {
      // SAFETY: Ensure wordSentences is an array
      if (!Array.isArray(wordSentences)) {
        return; // Skip invalid entries
      }

      // Process each sentence for this word
      wordSentences.forEach((sentence) => {
        // SAFETY: Ensure sentence is an object
        if (!sentence || typeof sentence !== 'object') {
          return; // Skip invalid sentences
        }

        // Get sentence text with fallbacks
        const sentenceText = sentence.sentence || sentence.full || sentence.text || '';

        // SAFETY: Ensure we have valid text
        if (!sentenceText || typeof sentenceText !== 'string' || sentenceText.length === 0) {
          return; // Skip sentences without text
        }

        // ============================================================
        // CALCULATE KNOWN PERCENTAGE (SAFE METHOD)
        // ============================================================

        // Option 1: Use vocabulary_used if available (new format)
        if (sentence.vocabulary_used && Array.isArray(sentence.vocabulary_used) && sentence.vocabulary_used.length > 0) {
          const totalVocab = sentence.vocabulary_used.length;
          const knownVocab = sentence.vocabulary_used.filter(w =>
            masteredSet.has(w.toLowerCase())
          ).length;

          const knownPercentage = totalVocab > 0 ? (knownVocab / totalVocab) * 100 : 0;

          // DEV MODE: Accept ALL percentages (0-100%)
          results.push({
            ...sentence,
            sentence: sentenceText,
            target_word: sentence.target_word || word,
            known_percentage: knownPercentage,
            word_source: word
          });
        }
        // Option 2: Calculate from sentence text (legacy format)
        else {
          // Split sentence into words
          const words = sentenceText.split(/\s+/).filter(w => w.length > 0);

          if (words.length === 0) {
            return; // Skip empty sentences
          }

          // Count known words
          const knownCount = words.filter(w => {
            const normalized = w.toLowerCase().replace(/[.,!?;:'"()]/g, '');
            return normalized.length > 0 && masteredSet.has(normalized);
          }).length;

          const knownPercentage = (knownCount / words.length) * 100;

          // DEV MODE: Accept ALL percentages (0-100%)
          results.push({
            ...sentence,
            sentence: sentenceText,
            target_word: sentence.target_word || word,
            known_percentage: knownPercentage,
            word_source: word,
            vocabulary_used: words // Add for consistency
          });
        }
      });
    });

    console.log(`[SENTENCES] Found ${results.length} sentences (DEV MODE: all percentages accepted)`);

    // Shuffle results
    const shuffled = results.sort(() => Math.random() - 0.5);

    // Return limited set
    const final = shuffled.slice(0, limit);
    console.log(`[SENTENCES] Returning ${final.length} sentences for practice`);

    return final;
  }

  /**
   * Generate word bank: 1 correct answer + 3 distractors
   * @param {Object} sentence - Sentence object with target_word
   * @param {Array<string>} allWords - All available words for distractors
   * @returns {Array<string>} - Shuffled array of 4 words
   */
  generateWordBank(sentence, allWords) {
    console.log('[SENTENCES] Generating word bank for:', sentence.target_word);

    // SAFETY CHECK: Validate sentence
    if (!sentence || !sentence.target_word) {
      console.error('[SENTENCES] Invalid sentence for word bank generation');
      return [];
    }

    // SAFETY CHECK: Validate vocabulary
    if (!allWords || !Array.isArray(allWords) || allWords.length === 0) {
      console.error('[SENTENCES] No vocabulary available for word bank');
      return [sentence.target_word]; // Return at least the correct word
    }

    const targetWord = sentence.target_word;

    // Filter and validate words
    const validWords = allWords.filter(w =>
      typeof w === 'string' && w.length > 0 && w !== targetWord
    );

    if (validWords.length === 0) {
      console.error('[SENTENCES] No valid words for distractors');
      return [targetWord]; // Return at least the correct word
    }

    // Select 3 distractors
    const distractors = this.selectDistractors(targetWord, validWords, 3);

    // Combine correct word + distractors
    const wordBank = [targetWord, ...distractors];

    // Shuffle so correct answer isn't always in same position
    const shuffled = this.shuffle(wordBank);

    console.log(`[SENTENCES] Generated word bank:`, shuffled);
    return shuffled;
  }

  /**
   * Select distractor words (similar length, different words)
   * @param {string} targetWord - The correct word
   * @param {Array<string>} allWords - Pool of words to choose from
   * @param {number} count - Number of distractors needed
   * @returns {Array<string>} - Array of distractor words
   */
  selectDistractors(targetWord, allWords, count) {
    const targetLength = targetWord.length;

    // Filter: not the target word, similar length (±3 chars)
    const candidates = allWords.filter(word =>
      word !== targetWord &&
      Math.abs(word.length - targetLength) <= 3
    );

    // If not enough candidates, just use random words
    if (candidates.length < count) {
      console.warn(`[SENTENCES] Not enough similar words, using random distractors`);
      const randomCandidates = allWords.filter(w => w !== targetWord);
      return this.shuffle(randomCandidates).slice(0, count);
    }

    // Randomly select from candidates
    return this.shuffle(candidates).slice(0, count);
  }

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - New shuffled array
   */
  shuffle(array) {
    const arr = [...array]; // Don't mutate original
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Clear cache for a language (useful for testing/updates)
   * @param {string} language - Language code
   */
  clearCache(language) {
    if (language) {
      delete this.sentenceCache[language];
      this.loadedLanguages.delete(language);
      console.log(`[SENTENCES] Cleared cache for ${language}`);
    } else {
      this.sentenceCache = {};
      this.loadedLanguages.clear();
      console.log(`[SENTENCES] Cleared all sentence cache`);
    }
  }
}

// Export singleton instance
export const sentenceManager = new SentenceManager();
