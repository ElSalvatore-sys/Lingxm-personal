#!/usr/bin/env node
// Vocabulary Extractor for TTSMaker Generation
// Scans all profile vocabulary files and creates organized batches

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VOICE_CONFIG = {
  'de': {
    limit: 1000,
    voiceId: '289',
    voiceName: 'audwin - standard männerstimme',
    url: 'https://ttsmaker.com'
  },
  'en': {
    limit: 1000,
    voiceId: '148',
    voiceName: 'alayna - united states female',
    url: 'https://ttsmaker.com'
  },
  'ar': {
    limit: 3000,
    voiceId: '700621',
    voiceName: 'نور - syria female',
    url: 'https://ttsmaker.com'
  },
  'fr': {
    limit: 3000,
    voiceId: '130011',
    voiceName: 'charline - belgium female',
    url: 'https://ttsmaker.com'
  },
  'it': {
    limit: 3000,
    voiceId: '140002',
    voiceName: 'elsa - italy female',
    url: 'https://ttsmaker.com'
  },
  'pl': {
    limit: 3000,
    voiceId: '30001',
    voiceName: 'katarzyna - polish female',
    url: 'https://ttsmaker.com'
  }
};

// Vocabulary files by profile
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

// Generate hash matching audioManager.js logic
function generateHash(text) {
  let hash = 0;
  const str = text.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

// Extract language code from filename
function getLanguageCode(filename) {
  // de.json → de, de-gastro.json → de, de-it.json → de
  const baseName = path.basename(filename, '.json');
  return baseName.split('-')[0];
}

// Main extraction function
function extractVocabulary() {
  console.log('🔍 Scanning vocabulary files...\n');

  // Store words by language (using Map to preserve metadata)
  const wordsByLanguage = {};
  Object.keys(VOICE_CONFIG).forEach(lang => {
    wordsByLanguage[lang] = new Map(); // word -> {hash, sources}
  });

  let totalFilesScanned = 0;
  let totalEntriesScanned = 0;

  // Scan all vocabulary files
  for (const filePath of PROFILE_FILES) {
    const fullPath = path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const langCode = getLanguageCode(filePath);
      const profile = path.basename(path.dirname(fullPath));

      totalFilesScanned++;
      totalEntriesScanned += data.length;

      data.forEach(entry => {
        if (entry.word) {
          const word = entry.word.trim();
          const hash = generateHash(word);

          if (wordsByLanguage[langCode]) {
            if (!wordsByLanguage[langCode].has(word)) {
              wordsByLanguage[langCode].set(word, {
                hash: hash,
                sources: []
              });
            }
            wordsByLanguage[langCode].get(word).sources.push(profile);
          }
        }
      });

      console.log(`✅ ${profile}/${path.basename(filePath)}: ${data.length} words`);
    } catch (error) {
      console.error(`❌ Error reading ${filePath}:`, error.message);
    }
  }

  console.log(`\n📊 Scanned ${totalFilesScanned} files, ${totalEntriesScanned} total entries\n`);

  // Create batches per language
  const batches = {};
  let totalUniqueWords = 0;
  let totalBatches = 0;

  for (const [lang, wordsMap] of Object.entries(wordsByLanguage)) {
    const words = Array.from(wordsMap.keys()).sort();
    const config = VOICE_CONFIG[lang];

    if (words.length === 0) continue;

    totalUniqueWords += words.length;

    // Create batches (100 words per batch for easy management)
    const WORDS_PER_BATCH = 100;
    const langBatches = [];

    for (let i = 0; i < words.length; i += WORDS_PER_BATCH) {
      const batchWords = words.slice(i, i + WORDS_PER_BATCH);
      langBatches.push({
        batchNumber: Math.floor(i / WORDS_PER_BATCH) + 1,
        words: batchWords.map(word => ({
          word: word,
          hash: wordsMap.get(word).hash,
          sources: wordsMap.get(word).sources
        })),
        textForTTS: batchWords.join('\n'),
        charCount: batchWords.join('\n').length
      });
    }

    batches[lang] = {
      languageName: lang.toUpperCase(),
      totalWords: words.length,
      totalBatches: langBatches.length,
      voiceId: config.voiceId,
      voiceName: config.voiceName,
      ttsUrl: config.url,
      batches: langBatches
    };

    totalBatches += langBatches.length;

    console.log(`📦 ${lang.toUpperCase()}: ${words.length} unique words → ${langBatches.length} batches (100 words each)`);
  }

  // Save batch manifest
  const manifestPath = path.join(__dirname, 'batch-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(batches, null, 2));

  console.log(`\n✅ Batch manifest saved to: scripts/batch-manifest.json`);

  // Generate human-readable report
  generateReport(batches, totalUniqueWords, totalBatches);

  return batches;
}

// Generate markdown report
function generateReport(batches, totalUniqueWords, totalBatches) {
  const lines = [];

  lines.push('# LingXM Vocabulary Analysis Report\n');
  lines.push(`Generated: ${new Date().toISOString()}\n`);
  lines.push('---\n');

  lines.push('## Summary\n');
  lines.push(`- **Total Unique Words:** ${totalUniqueWords}`);
  lines.push(`- **Total Batches:** ${totalBatches} (100 words per batch)`);
  lines.push(`- **Languages:** ${Object.keys(batches).length}`);
  lines.push(`- **Estimated Manual Work:** ${Math.ceil(totalBatches * 2)} minutes copy-paste + splitting time\n`);

  lines.push('---\n');
  lines.push('## Breakdown by Language\n');

  for (const [lang, data] of Object.entries(batches)) {
    lines.push(`### ${data.languageName}\n`);
    lines.push(`- **Unique Words:** ${data.totalWords}`);
    lines.push(`- **Batches:** ${data.totalBatches}`);
    lines.push(`- **Voice:** ${data.voiceName} (ID: ${data.voiceId})`);
    lines.push(`- **TTSMaker URL:** ${data.ttsUrl}\n`);

    lines.push('**Batch Details:**\n');
    data.batches.forEach(batch => {
      lines.push(`- Batch ${batch.batchNumber}: ${batch.words.length} words, ${batch.charCount} characters`);
    });
    lines.push('\n');
  }

  lines.push('---\n');
  lines.push('## Next Steps\n');
  lines.push('1. ✅ Vocabulary extracted and batches created');
  lines.push('2. ⏳ Create folder structure (run: `node scripts/create-structure.js`)');
  lines.push('3. ⏳ Generate audio using TTSMaker helper tool');
  lines.push('4. ⏳ Split batch MP3s into individual word files');
  lines.push('5. ⏳ Organize files and deploy\n');

  const reportPath = path.join(__dirname, 'VOCABULARY_REPORT.md');
  fs.writeFileSync(reportPath, lines.join('\n'));

  console.log(`📄 Report saved to: scripts/VOCABULARY_REPORT.md\n`);
}

// Run extraction
console.log('🎵 LingXM TTSMaker Audio Generation - Vocabulary Extraction\n');
console.log('=' .repeat(60) + '\n');

try {
  const batches = extractVocabulary();

  console.log('\n' + '='.repeat(60));
  console.log('✅ EXTRACTION COMPLETE\n');
  console.log('📂 Next: Create project structure');
  console.log('   Run: node scripts/create-structure.js\n');
} catch (error) {
  console.error('\n❌ EXTRACTION FAILED:', error.message);
  process.exit(1);
}
