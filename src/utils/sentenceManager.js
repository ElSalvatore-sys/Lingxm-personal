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
   * @returns {Object|null} - Sentence data or null if not found
   */
  async loadSentences(language) {
    console.log(`[SENTENCES] Loading sentences for ${language}`);

    // Return from cache if already loaded
    if (this.loadedLanguages.has(language)) {
      console.log(`[SENTENCES] Using cached sentences for ${language}`);
      return this.sentenceCache[language];
    }

    try {
      // Try new organized structure first: /data/sentences/{language}/{language}-{level}-sentences.json
      // For now, try common patterns for the language
      const patterns = [
        `/data/sentences/${language}/${language}-c1c2-sentences.json`,
        `/data/sentences/${language}/${language}-b1b2-sentences.json`,
        `/data/sentences/${language}/${language}-a1a2-sentences.json`,
        `/data/sentences/${language}-sentences.json` // Legacy fallback
      ];

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

      // Cache the data
      this.sentenceCache[language] = data;
      this.loadedLanguages.add(language);

      console.log(`[SENTENCES] ✅ Loaded ${data.metadata.total_sentences} sentences for ${language}`);
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
   * @param {number} userId - User ID
   * @param {string} language - Language code
   * @param {Array<string>} masteredWords - Array of mastered word strings
   * @returns {Array} - Array of i+1 sentences with metadata
   */
  async findI1Sentences(userId, language, masteredWords) {
    console.log(`[SENTENCES] Finding i+1 sentences for ${language}`);
    console.log(`[SENTENCES] User has mastered ${masteredWords.length} words`);

    const data = await this.loadSentences(language);
    if (!data) {
      console.warn(`[SENTENCES] No sentence data available for ${language}`);
      return [];
    }

    const i1Sentences = [];
    const masteredSet = new Set(masteredWords); // Faster lookup

    // Iterate through all sentences in the language
    Object.entries(data.sentences).forEach(([targetWord, sentenceArray]) => {
      sentenceArray.forEach(sentence => {
        const totalVocab = sentence.vocabulary_used.length;

        // Count how many words in the sentence are mastered
        const knownVocab = sentence.vocabulary_used.filter(word =>
          masteredSet.has(word)
        ).length;

        const knownPercentage = totalVocab > 0 ? (knownVocab / totalVocab) * 100 : 0;

        // i+1 criteria: 70-100% of words are known (more realistic for testing/advanced learners)
        if (knownPercentage >= 70 && knownPercentage <= 100) {
          i1Sentences.push({
            ...sentence,
            known_percentage: Math.round(knownPercentage),
            known_count: knownVocab,
            total_vocab_count: totalVocab,
            unknown_words: sentence.vocabulary_used.filter(w => !masteredSet.has(w))
          });
        }
      });
    });

    console.log(`[SENTENCES] Found ${i1Sentences.length} i+1 sentences (70-100% known)`);

    // Sort by known_percentage (descending) - easier sentences first
    i1Sentences.sort((a, b) => b.known_percentage - a.known_percentage);

    return i1Sentences;
  }

  /**
   * Generate word bank: 1 correct answer + 3 distractors
   * @param {Object} sentence - Sentence object with target_word
   * @param {Array<string>} allWords - All available words for distractors
   * @returns {Array<string>} - Shuffled array of 4 words
   */
  generateWordBank(sentence, allWords) {
    const targetWord = sentence.target_word;

    // Select 3 distractors
    const distractors = this.selectDistractors(targetWord, allWords, 3);

    // Combine correct word + distractors
    const wordBank = [targetWord, ...distractors];

    // Shuffle so correct answer isn't always in same position
    return this.shuffle(wordBank);
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
