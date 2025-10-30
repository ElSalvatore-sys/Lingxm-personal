#!/usr/bin/env node
// Extract Polish translations from vocabulary files

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateHash, generateFilename } from './hash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROFILE_FILES = [
  'public/data/vahiko/de.json',
  'public/data/vahiko/en.json',
  'public/data/hassan/ar.json',
  'public/data/hassan/de.json',
  'public/data/hassan/en.json',
  'public/data/jawad/de.json',
  'public/data/jawad/de-gastro.json',
  'public/data/jawad/en.json',
  'public/data/jawad/fr.json',
  'public/data/kafel/de.json',
  'public/data/kafel/de-it.json',
  'public/data/kafel/en.json',
  'public/data/salman/de.json',
  'public/data/salman/de-gastro.json',
  'public/data/salman/en.json',
  'public/data/salman/fr.json',
  'public/data/ameeno/de.json',
  'public/data/ameeno/en.json',
  'public/data/ameeno/it.json'
];

const CHAR_LIMIT = 3000;
const SAFETY_MARGIN = 0.9;
const TARGET_LIMIT = Math.floor(CHAR_LIMIT * SAFETY_MARGIN);

function createSmartBatches(words) {
  const batches = [];
  let currentBatch = [];
  let currentLength = 0;

  for (const word of words) {
    const wordWithBreak = word + '\n\n';
    const wordLength = wordWithBreak.length;

    if (currentLength + wordLength > TARGET_LIMIT && currentBatch.length > 0) {
      batches.push({
        words: [...currentBatch],
        charCount: currentLength
      });
      currentBatch = [];
      currentLength = 0;
    }

    currentBatch.push(word);
    currentLength += wordLength;
  }

  if (currentBatch.length > 0) {
    batches.push({
      words: [...currentBatch],
      charCount: currentLength
    });
  }

  return batches;
}

function extractPolish() {
  console.log('🇵🇱 Extracting Polish translations...\n');

  const polishWords = new Map(); // word -> sources

  for (const filePath of PROFILE_FILES) {
    const fullPath = path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const profile = path.basename(path.dirname(fullPath));

      let foundCount = 0;

      data.forEach(entry => {
        if (entry.translations && entry.translations.pl) {
          const polishWord = entry.translations.pl.trim();

          if (!polishWords.has(polishWord)) {
            polishWords.set(polishWord, {
              hash: generateHash(polishWord),
              sources: []
            });
          }
          polishWords.get(polishWord).sources.push(profile);
          foundCount++;
        }
      });

      if (foundCount > 0) {
        console.log(`✅ ${profile}/${path.basename(filePath)}: ${foundCount} Polish translations`);
      }
    } catch (error) {
      console.error(`❌ Error reading ${filePath}:`, error.message);
    }
  }

  const words = Array.from(polishWords.keys()).sort();
  console.log(`\n📊 Total unique Polish words: ${words.length}\n`);

  if (words.length === 0) {
    console.log('❌ No Polish translations found!');
    return;
  }

  // Create batches
  const batches = createSmartBatches(words);

  console.log(`📦 Creating ${batches.length} batch(es) (3000 char limit)\n`);

  // Create batches directory if needed
  const batchesDir = path.join(__dirname, '../audio-raw/batches');
  if (!fs.existsSync(batchesDir)) {
    fs.mkdirSync(batchesDir, { recursive: true });
  }

  // Create batch files
  const batchMapping = {};

  batches.forEach((batch, index) => {
    const batchNum = String(index + 1).padStart(3, '0');
    const batchFilename = `batch-pl-${batchNum}.txt`;
    const batchPath = path.join(batchesDir, batchFilename);

    // Generate batch text with double line breaks
    const batchText = batch.words.join('\n\n');

    // Write batch text file
    fs.writeFileSync(batchPath, batchText, 'utf8');

    // Create mapping entry
    const mp3Filename = `batch-pl-${batchNum}.mp3`;
    batchMapping[mp3Filename] = batch.words.map(word => ({
      word: word,
      hash: generateHash(word),
      filename: generateFilename(word, 'pl')
    }));

    const status = batch.charCount <= CHAR_LIMIT ? '✓' : '⚠️';
    console.log(`   ${status} ${batchFilename}: ${batch.words.length} words, ${batch.charCount} chars`);
  });

  // Update batch-mapping.json
  const mappingPath = path.join(__dirname, '../audio-raw/batch-mapping.json');
  let existingMapping = {};
  if (fs.existsSync(mappingPath)) {
    existingMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  }

  // Remove old Polish mappings if any
  Object.keys(existingMapping).forEach(key => {
    if (key.startsWith('batch-pl-')) {
      delete existingMapping[key];
    }
  });

  // Add new Polish mappings
  Object.assign(existingMapping, batchMapping);

  fs.writeFileSync(mappingPath, JSON.stringify(existingMapping, null, 2));

  console.log(`\n✅ Batch files created in: audio-raw/batches/`);
  console.log(`✅ Batch mapping updated: audio-raw/batch-mapping.json\n`);

  // Show sample
  console.log('📝 Sample from batch-pl-001.txt (first 10 words):');
  batches[0].words.slice(0, 10).forEach(word => {
    console.log(`   ${word}`);
  });

  console.log(`\n📋 TTSMaker Instructions:`);
  console.log(`   1. Go to https://ttsmaker.com`);
  console.log(`   2. Copy text from batch-pl-*.txt files`);
  console.log(`   3. Select "Polish (Poland)" → "katarzyna" female voice (ID: 30001)`);
  console.log(`   4. Generate and download as batch-pl-001.mp3, etc.`);
  console.log(`   5. Place MP3 files in audio-raw/\n`);

  console.log(`\n📊 Summary:`);
  console.log(`   - Polish words: ${words.length}`);
  console.log(`   - Batches: ${batches.length}`);
  console.log(`   - Character limit: ${CHAR_LIMIT} (target: ${TARGET_LIMIT})`);
  console.log(`   - Files: batch-pl-001.txt to batch-pl-${String(batches.length).padStart(3, '0')}.txt\n`);
}

// Run extraction
try {
  extractPolish();
} catch (error) {
  console.error('\n❌ EXTRACTION FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
}
