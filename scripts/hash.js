#!/usr/bin/env node
// Hash utility matching audioManager.js logic
// Used to generate consistent filenames for audio files

/**
 * Generate hash for a word (matches audioManager.js)
 * @param {string} text - The word to hash
 * @returns {string} - 8-character hex hash
 */
export function generateHash(text) {
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
 * Generate filename for a word
 * @param {string} word - The word
 * @param {string} language - Language code (de, en, etc.)
 * @returns {string} - Relative path: de/abc123ef.mp3
 */
export function generateFilename(word, language) {
  const hash = generateHash(word);
  return `${language}/${hash}.mp3`;
}

/**
 * Batch process multiple words
 * @param {Array<string>} words - Array of words
 * @param {string} language - Language code
 * @returns {Array<Object>} - Array of {word, hash, filename}
 */
export function hashWords(words, language) {
  return words.map(word => ({
    word: word,
    hash: generateHash(word),
    filename: generateFilename(word, language)
  }));
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const word = process.argv[2];
  const lang = process.argv[3] || 'de';

  if (!word) {
    console.log('Usage: node hash.js <word> [language]');
    console.log('Example: node hash.js Hallo de');
    process.exit(1);
  }

  const hash = generateHash(word);
  const filename = generateFilename(word, lang);

  console.log(`Word: ${word}`);
  console.log(`Hash: ${hash}`);
  console.log(`Filename: ${filename}`);
}
