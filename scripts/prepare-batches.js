#!/usr/bin/env node
// Batch Preparation Script for TTSMaker
// Generates text files for copy-paste into TTSMaker with language-specific character limits

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateHash, generateFilename } from './hash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, 'batch-manifest.json');
const BATCHES_DIR = path.join(__dirname, '../audio-raw/batches');
const MAPPING_PATH = path.join(__dirname, '../audio-raw/batch-mapping.json');
const INSTRUCTIONS_PATH = path.join(__dirname, '../audio-raw/INSTRUCTIONS.md');

// Language-specific character limits for TTSMaker
const CHAR_LIMITS = {
  'de': 1000,   // German: 1000 char limit
  'en': 1000,   // English: 1000 char limit
  'ar': 3000,   // Arabic: 3000 char limit
  'fr': 1000,   // French: 1000 char limit (Belgium French)
  'it': 3000,   // Italian: 3000 char limit
  'pl': 3000    // Polish: 3000 char limit
};

// Safety margin: aim for 90% of limit to be safe
const SAFETY_MARGIN = 0.9;

const VOICE_CONFIG = {
  'de': {
    voiceId: '289',
    voiceName: 'audwin - standard männerstimme',
    instructions: 'Select "German (Germany)" → "audwin - standard männerstimme" (Voice ID: 289)',
    charLimit: CHAR_LIMITS.de
  },
  'en': {
    voiceId: '148',
    voiceName: 'alayna - united states female',
    instructions: 'Select "English (United States)" → "alayna - united states female" (Voice ID: 148)',
    charLimit: CHAR_LIMITS.en
  },
  'ar': {
    voiceId: '700621',
    voiceName: 'نور - syria female',
    instructions: 'Select "Arabic (Syria)" → "نور" female voice (Voice ID: 700621)',
    charLimit: CHAR_LIMITS.ar
  },
  'fr': {
    voiceId: '130011',
    voiceName: 'charline - belgium female',
    instructions: 'Select "French (Belgium)" → "charline" female voice (Voice ID: 130011)',
    charLimit: CHAR_LIMITS.fr
  },
  'it': {
    voiceId: '140002',
    voiceName: 'elsa - italy female',
    instructions: 'Select "Italian (Italy)" → "elsa" female voice (Voice ID: 140002)',
    charLimit: CHAR_LIMITS.it
  },
  'pl': {
    voiceId: '30001',
    voiceName: 'katarzyna - polish female',
    instructions: 'Select "Polish (Poland)" → "katarzyna" female voice (Voice ID: 30001)',
    charLimit: CHAR_LIMITS.pl
  }
};

// Languages to regenerate (others will be preserved)
const REGENERATE_LANGUAGES = ['de', 'fr'];

function createSmartBatches(words, languageCode) {
  const charLimit = CHAR_LIMITS[languageCode] || 1000;
  const targetLimit = Math.floor(charLimit * SAFETY_MARGIN);

  const batches = [];
  let currentBatch = [];
  let currentLength = 0;

  for (const word of words) {
    // Each word with double line break: "word\n\n"
    const wordWithBreak = word + '\n\n';
    const wordLength = wordWithBreak.length;

    // Check if adding this word would exceed the limit
    if (currentLength + wordLength > targetLimit && currentBatch.length > 0) {
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

  // Add remaining words
  if (currentBatch.length > 0) {
    batches.push({
      words: [...currentBatch],
      charCount: currentLength
    });
  }

  return batches;
}

function deleteLanguageBatches(languageCode) {
  const files = fs.readdirSync(BATCHES_DIR);
  const pattern = new RegExp(`^batch-${languageCode}-\\d+\\.txt$`);

  let deletedCount = 0;
  files.forEach(file => {
    if (pattern.test(file)) {
      fs.unlinkSync(path.join(BATCHES_DIR, file));
      deletedCount++;
    }
  });

  return deletedCount;
}

function prepareBatches() {
  console.log('📦 LingXM Batch Preparation for TTSMaker (Smart Batching)\n');
  console.log('=' .repeat(60) + '\n');

  // Load batch manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ batch-manifest.json not found!');
    console.log('   Run: node scripts/extract-vocabulary.js first\n');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  // Create batches directory if needed
  if (!fs.existsSync(BATCHES_DIR)) {
    fs.mkdirSync(BATCHES_DIR, { recursive: true });
    console.log('✅ Created directory: audio-raw/batches/\n');
  }

  // Load existing batch mapping (to preserve non-regenerated languages)
  let existingMapping = {};
  if (fs.existsSync(MAPPING_PATH)) {
    existingMapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  }

  // Prepare new mapping (start with existing, will overwrite regenerated languages)
  const batchMapping = { ...existingMapping };
  const downloadInstructions = [];
  const statistics = {
    regenerated: {},
    preserved: {}
  };

  let totalBatchFiles = 0;
  let totalWords = 0;

  // Process each language
  for (const [lang, data] of Object.entries(manifest)) {
    const shouldRegenerate = REGENERATE_LANGUAGES.includes(lang);
    const charLimit = CHAR_LIMITS[lang] || 1000;

    if (shouldRegenerate) {
      console.log(`🔄 REGENERATING ${data.languageName} (${charLimit} char limit)...`);

      // Delete old batch files
      const deleted = deleteLanguageBatches(lang);
      if (deleted > 0) {
        console.log(`   🗑️  Deleted ${deleted} old batch files`);
      }

      // Remove old mappings
      Object.keys(batchMapping).forEach(key => {
        if (key.startsWith(`batch-${lang}-`)) {
          delete batchMapping[key];
        }
      });

      // Extract all words from manifest batches
      const allWords = [];
      data.batches.forEach(batch => {
        batch.words.forEach(w => allWords.push(w.word));
      });

      // Create smart batches based on character limit
      const smartBatches = createSmartBatches(allWords, lang);

      // Generate new batch files
      smartBatches.forEach((batch, index) => {
        const batchNum = String(index + 1).padStart(3, '0');
        const batchFilename = `batch-${lang}-${batchNum}.txt`;
        const batchPath = path.join(BATCHES_DIR, batchFilename);

        // Generate batch text with double line breaks
        const batchText = batch.words.join('\n\n');

        // Write batch text file
        fs.writeFileSync(batchPath, batchText, 'utf8');

        // Create mapping entry
        const mp3Filename = `batch-${lang}-${batchNum}.mp3`;
        batchMapping[mp3Filename] = batch.words.map(word => ({
          word: word,
          hash: generateHash(word),
          filename: generateFilename(word, lang)
        }));

        totalBatchFiles++;
        totalWords += batch.words.length;

        // Show character count status
        const status = batch.charCount <= charLimit ? '✓' : '⚠️';
        console.log(`   ${status} ${batchFilename}: ${batch.words.length} words, ${batch.charCount} chars`);
      });

      statistics.regenerated[lang] = {
        oldCount: data.batches.length,
        newCount: smartBatches.length,
        totalWords: allWords.length,
        charLimit: charLimit
      };

      // Add download instruction for this language
      downloadInstructions.push({
        language: data.languageName,
        voiceConfig: VOICE_CONFIG[lang],
        batches: smartBatches.length,
        files: smartBatches.map((b, i) => `batch-${lang}-${String(i + 1).padStart(3, '0')}`),
        regenerated: true
      });

      console.log(`   📊 Total: ${allWords.length} words in ${smartBatches.length} batches (was ${data.batches.length})\n`);

    } else {
      console.log(`✅ PRESERVING ${data.languageName} (${charLimit} char limit)...`);

      // Count existing batch files
      const files = fs.readdirSync(BATCHES_DIR);
      const pattern = new RegExp(`^batch-${lang}-\\d+\\.txt$`);
      const existingBatches = files.filter(f => pattern.test(f));

      if (existingBatches.length > 0) {
        console.log(`   📁 Found ${existingBatches.length} existing batch files (unchanged)`);

        statistics.preserved[lang] = {
          batchCount: existingBatches.length,
          totalWords: data.totalWords,
          charLimit: charLimit
        };

        // Add download instruction for preserved language
        downloadInstructions.push({
          language: data.languageName,
          voiceConfig: VOICE_CONFIG[lang],
          batches: existingBatches.length,
          files: existingBatches.map(f => path.basename(f, '.txt')),
          regenerated: false
        });

        totalBatchFiles += existingBatches.length;
        totalWords += data.totalWords;
      } else {
        console.log(`   ⚠️  No existing batch files found`);
      }

      console.log('');
    }
  }

  // Save batch mapping
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(batchMapping, null, 2));
  console.log(`✅ Batch mapping updated: audio-raw/batch-mapping.json\n`);

  // Generate instructions
  generateInstructions(downloadInstructions, totalBatchFiles, totalWords, statistics);

  console.log('=' .repeat(60));
  console.log('✅ BATCH PREPARATION COMPLETE\n');

  console.log(`📊 Summary:`);

  if (Object.keys(statistics.regenerated).length > 0) {
    console.log(`\n   🔄 REGENERATED LANGUAGES:`);
    for (const [lang, stats] of Object.entries(statistics.regenerated)) {
      console.log(`      ${lang.toUpperCase()}: ${stats.oldCount} batches → ${stats.newCount} batches (${stats.totalWords} words, ${stats.charLimit} char limit)`);
    }
  }

  if (Object.keys(statistics.preserved).length > 0) {
    console.log(`\n   ✅ PRESERVED LANGUAGES:`);
    for (const [lang, stats] of Object.entries(statistics.preserved)) {
      console.log(`      ${lang.toUpperCase()}: ${stats.batchCount} batches (${stats.totalWords} words, ${stats.charLimit} char limit)`);
    }
  }

  console.log(`\n   TOTAL: ${totalBatchFiles} batch files, ${totalWords} words\n`);

  console.log('📋 Next Steps:');
  console.log('   1. Read: audio-raw/INSTRUCTIONS.md');
  console.log('   2. Open: https://ttsmaker.com');
  console.log('   3. Copy-paste batches and download MP3s');
  console.log('   4. Place MP3s in audio-raw/');
  console.log('   5. Run: npm run split-audio\n');
}

function generateInstructions(downloadInstructions, totalBatches, totalWords, statistics) {
  const lines = [];

  lines.push('# TTSMaker Audio Generation Instructions\n');
  lines.push(`Generated: ${new Date().toISOString()}\n`);
  lines.push('---\n');

  lines.push('## Overview\n');
  lines.push(`You need to generate **${totalBatches} batch audio files** containing **${totalWords} words** total.\n`);
  lines.push(`**Estimated time:** ${Math.ceil(totalBatches * 2)} minutes (2 min per batch)\n`);

  // Show regeneration info
  if (Object.keys(statistics.regenerated).length > 0) {
    lines.push('### ⚠️ Note: Some Batches Were Regenerated\n');
    for (const [lang, stats] of Object.entries(statistics.regenerated)) {
      lines.push(`- **${lang.toUpperCase()}**: Re-split into ${stats.newCount} smaller batches (was ${stats.oldCount}) to fit ${stats.charLimit} character limit\n`);
    }
  }

  lines.push('---\n');

  lines.push('## General Workflow\n');
  lines.push('For each batch file in `audio-raw/batches/`:\n');
  lines.push('1. Open the .txt file');
  lines.push('2. Copy all text (Cmd+A, Cmd+C)');
  lines.push('3. Go to https://ttsmaker.com');
  lines.push('4. Paste text into the text box');
  lines.push('5. Select the correct voice (see language sections below)');
  lines.push('6. Click "Convert to Speech"');
  lines.push('7. Click "Download"');
  lines.push('8. **IMPORTANT:** Rename downloaded file to match batch name');
  lines.push('   - Example: `ttsmaker-file-2025-01-15-1234.mp3` → `batch-de-001.mp3`');
  lines.push('9. Move renamed file to `audio-raw/`');
  lines.push('10. Repeat for next batch\n');
  lines.push('---\n');

  lines.push('## Language-Specific Instructions\n');

  downloadInstructions.forEach(({ language, voiceConfig, batches, files, regenerated }) => {
    const status = regenerated ? ' (REGENERATED)' : '';
    lines.push(`### ${language}${status}\n`);
    lines.push(`**Voice:** ${voiceConfig.voiceName}\n`);
    lines.push(`**Voice ID:** ${voiceConfig.voiceId}\n`);
    lines.push(`**Character Limit:** ${voiceConfig.charLimit} chars per batch\n`);
    lines.push(`**Batches:** ${batches}\n`);
    lines.push(`**Selection:** ${voiceConfig.instructions}\n`);
    lines.push('**Files to process:**\n');
    files.forEach(file => {
      lines.push(`- [ ] ${file}.txt → ${file}.mp3`);
    });
    lines.push('\n');
  });

  lines.push('---\n');

  lines.push('## Important Notes\n');
  lines.push('- **File naming is critical!** The split script expects exact batch names.');
  lines.push('- **Voice selection must be exact** for consistent quality.');
  lines.push('- TTSMaker is free but may have rate limits. If blocked, wait 10 minutes.');
  lines.push('- Double line breaks in text files create pauses for word splitting.');
  lines.push('- Download all batches before running the split script.');
  lines.push('- German and French use smaller batches (1000 char limit)');
  lines.push('- Polish, Arabic, Italian use larger batches (3000 char limit)\n');

  lines.push('---\n');

  lines.push('## Checklist Progress\n');
  lines.push(`- [ ] Downloaded all ${totalBatches} batch MP3 files`);
  lines.push('- [ ] Renamed all files correctly (batch-XX-YYY.mp3)');
  lines.push('- [ ] Moved all files to audio-raw/');
  lines.push('- [ ] Verified file count matches batch count');
  lines.push('- [ ] Ready to run split script\n');

  lines.push('---\n');

  lines.push('## After Completion\n');
  lines.push('When all MP3 files are in `audio-raw/`, run:\n');
  lines.push('```bash');
  lines.push('npm run split-audio');
  lines.push('```\n');
  lines.push('This will automatically split the batch files into individual word audio files.\n');

  fs.writeFileSync(INSTRUCTIONS_PATH, lines.join('\n'));
  console.log(`✅ Instructions updated: audio-raw/INSTRUCTIONS.md\n`);
}

// Run preparation
try {
  prepareBatches();
} catch (error) {
  console.error('\n❌ PREPARATION FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
}
