#!/usr/bin/env node
/**
 * Audio Integration Test Script
 *
 * Tests the integration between:
 * - Vocabulary words from JSON files
 * - Generated audio files in public/audio/
 * - Hash generation logic
 *
 * Verifies that audio files exist for vocabulary words
 * and reports coverage statistics.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateHash } from './hash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const AUDIO_DIR = path.join(__dirname, '../public/audio');
const SAMPLE_SIZE = 10; // Test 10 words per language

class AudioIntegrationTester {
  constructor() {
    this.results = {
      total: 0,
      found: 0,
      missing: 0,
      byLanguage: {}
    };
    this.missingFiles = [];
  }

  /**
   * Find all vocabulary JSON files
   */
  findVocabularyFiles() {
    const vocabFiles = [];
    const profiles = fs.readdirSync(DATA_DIR).filter(f => {
      const fullPath = path.join(DATA_DIR, f);
      return fs.statSync(fullPath).isDirectory();
    });

    for (const profile of profiles) {
      const profileDir = path.join(DATA_DIR, profile);
      const files = fs.readdirSync(profileDir)
        .filter(f => f.endsWith('.json') && f !== 'progress.json')
        .map(f => ({
          path: path.join(profileDir, f),
          language: f.replace('.json', ''),
          profile
        }));

      vocabFiles.push(...files);
    }

    return vocabFiles;
  }

  /**
   * Extract sample words from vocabulary file
   */
  extractSampleWords(vocabFile, sampleSize = SAMPLE_SIZE) {
    const data = JSON.parse(fs.readFileSync(vocabFile.path, 'utf8'));
    const words = new Set();

    // Extract only the primary 'word' field
    // The 'word' field is what we generated audio for
    data.forEach(entry => {
      if (entry.word) {
        words.add(entry.word);
      }
    });

    // Return sample
    const wordArray = Array.from(words);
    return wordArray.slice(0, Math.min(sampleSize, wordArray.length));
  }

  /**
   * Normalize language code (handle variants like de-gastro → de)
   */
  normalizeLanguage(language) {
    const languageMap = {
      'de-gastro': 'de',
      'de-it': 'de',
      'en-us': 'en',
      'en-gb': 'en',
      'fr-be': 'fr',
      'ar-sa': 'ar'
    };

    const normalized = languageMap[language.toLowerCase()] || language;

    if (normalized.includes('-')) {
      return normalized.split('-')[0];
    }

    return normalized;
  }

  /**
   * Test if audio file exists for a word
   */
  testAudioFile(word, language) {
    const hash = generateHash(word);
    const normalizedLang = this.normalizeLanguage(language);
    const audioPath = path.join(AUDIO_DIR, normalizedLang, `${hash}.mp3`);
    const exists = fs.existsSync(audioPath);

    let fileSize = 0;
    if (exists) {
      const stats = fs.statSync(audioPath);
      fileSize = stats.size;
    }

    return { exists, hash, audioPath, fileSize, normalizedLang };
  }

  /**
   * Test a single vocabulary file
   */
  testVocabularyFile(vocabFile) {
    console.log(`\n📝 Testing ${vocabFile.profile}/${vocabFile.language}.json...`);

    const words = this.extractSampleWords(vocabFile);
    const language = vocabFile.language;

    if (!this.results.byLanguage[language]) {
      this.results.byLanguage[language] = {
        tested: 0,
        found: 0,
        missing: 0,
        samples: []
      };
    }

    const langResults = this.results.byLanguage[language];

    words.forEach(word => {
      const result = this.testAudioFile(word, language);

      this.results.total++;
      langResults.tested++;

      if (result.exists) {
        this.results.found++;
        langResults.found++;

        // Show first 3 successful matches
        if (langResults.samples.length < 3) {
          const sizeKB = (result.fileSize / 1024).toFixed(1);
          langResults.samples.push({
            word,
            hash: result.hash,
            size: sizeKB
          });
          console.log(`   ✅ ${word} → ${language}/${result.hash}.mp3 (${sizeKB}KB)`);
        }
      } else {
        this.results.missing++;
        langResults.missing++;

        this.missingFiles.push({
          word,
          language,
          hash: result.hash,
          expectedPath: result.audioPath
        });

        console.log(`   ❌ MISSING: ${word} → ${language}/${result.hash}.mp3`);
      }
    });
  }

  /**
   * Run all tests
   */
  async run() {
    console.log('🎵 LingXM Audio Integration Test\n');
    console.log('='.repeat(60) + '\n');

    // Check if audio directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
      console.error('❌ Audio directory not found: public/audio/');
      console.log('   Run: npm run split-audio first\n');
      process.exit(1);
    }

    // Find vocabulary files
    const vocabFiles = this.findVocabularyFiles();
    console.log(`📚 Found ${vocabFiles.length} vocabulary files\n`);

    if (vocabFiles.length === 0) {
      console.error('❌ No vocabulary files found in data/');
      process.exit(1);
    }

    // Test each vocabulary file
    for (const vocabFile of vocabFiles) {
      try {
        this.testVocabularyFile(vocabFile);
      } catch (error) {
        console.error(`   ⚠️  Error testing ${vocabFile.path}:`, error.message);
      }
    }

    // Display summary
    this.displaySummary();

    // Exit with error if coverage is too low
    const coveragePercent = (this.results.found / this.results.total) * 100;
    if (coveragePercent < 90) {
      console.log('\n⚠️  Audio coverage is below 90%!');
      process.exit(1);
    }
  }

  /**
   * Display test summary
   */
  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST SUMMARY\n');

    // Overall stats
    const coveragePercent = ((this.results.found / this.results.total) * 100).toFixed(1);

    console.log(`Total Words Tested: ${this.results.total}`);
    console.log(`✅ Audio Files Found: ${this.results.found}`);
    console.log(`❌ Missing Files: ${this.results.missing}`);
    console.log(`📈 Coverage: ${coveragePercent}%\n`);

    // By language
    console.log('📋 Coverage by Language:\n');

    const languages = Object.keys(this.results.byLanguage).sort();

    languages.forEach(lang => {
      const stats = this.results.byLanguage[lang];
      const langCoverage = ((stats.found / stats.tested) * 100).toFixed(1);
      const statusIcon = langCoverage >= 90 ? '✅' : '⚠️';

      console.log(`${statusIcon} ${lang.toUpperCase()}: ${stats.found}/${stats.tested} files (${langCoverage}%)`);
    });

    // Audio file counts
    console.log('\n📁 Total Audio Files Available:\n');

    const audioLanguages = ['ar', 'de', 'en', 'fr', 'it', 'pl'];
    let totalAudioFiles = 0;

    audioLanguages.forEach(lang => {
      const langDir = path.join(AUDIO_DIR, lang);
      if (fs.existsSync(langDir)) {
        const files = fs.readdirSync(langDir).filter(f => f.endsWith('.mp3'));
        totalAudioFiles += files.length;
        console.log(`   ${lang}: ${files.length} files`);
      }
    });

    console.log(`\n   Total: ${totalAudioFiles} audio files`);

    // Missing files details
    if (this.missingFiles.length > 0 && this.missingFiles.length <= 20) {
      console.log('\n❌ Missing Files (showing all):\n');
      this.missingFiles.forEach(({ word, language, hash }) => {
        console.log(`   - ${language}/${hash}.mp3 (word: "${word}")`);
      });
    } else if (this.missingFiles.length > 20) {
      console.log(`\n❌ Missing Files (showing first 20 of ${this.missingFiles.length}):\n`);
      this.missingFiles.slice(0, 20).forEach(({ word, language, hash }) => {
        console.log(`   - ${language}/${hash}.mp3 (word: "${word}")`);
      });
      console.log(`\n   ... and ${this.missingFiles.length - 20} more`);
    }

    // Final status
    console.log('\n' + '='.repeat(60));

    if (this.results.missing === 0) {
      console.log('\n✅ ALL TESTS PASSED! Audio integration is ready.\n');
    } else if (coveragePercent >= 90) {
      console.log(`\n⚠️  ${this.results.missing} files missing, but ${coveragePercent}% coverage is acceptable.\n`);
      console.log('💡 The audioManager will use Web Speech API fallback for missing words.\n');
    } else {
      console.log(`\n❌ COVERAGE TOO LOW: ${coveragePercent}%\n`);
      console.log('   Expected: 90% minimum');
      console.log('   Action: Regenerate missing audio files\n');
    }
  }
}

// Run tests
const tester = new AudioIntegrationTester();
tester.run().catch(error => {
  console.error('\n❌ TEST FAILED:', error);
  process.exit(1);
});
