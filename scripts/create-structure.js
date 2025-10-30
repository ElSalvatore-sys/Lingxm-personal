#!/usr/bin/env node
// Create folder structure for TTSMaker audio workflow

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LANGUAGES = ['de', 'en', 'ar', 'fr', 'it', 'pl'];

const FOLDERS = [
  'audio-raw',
  ...LANGUAGES.map(lang => `audio-raw/${lang}`),
  'public/audio',
  ...LANGUAGES.map(lang => `public/audio/${lang}`)
];

function createStructure() {
  console.log('📁 Creating folder structure for TTSMaker workflow\n');

  let created = 0;
  let existed = 0;

  for (const folder of FOLDERS) {
    const fullPath = path.join(__dirname, '..', folder);

    if (fs.existsSync(fullPath)) {
      console.log(`   ✓ ${folder}/ (already exists)`);
      existed++;
    } else {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   ✅ ${folder}/ (created)`);
      created++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created} folders`);
  console.log(`   Existed: ${existed} folders`);

  console.log(`\n📂 Project Structure:`);
  console.log(`   audio-raw/          ← Put downloaded TTSMaker batch MP3s here`);
  console.log(`     ├── de/`);
  console.log(`     ├── en/`);
  console.log(`     ├── ar/`);
  console.log(`     ├── fr/`);
  console.log(`     ├── it/`);
  console.log(`     └── pl/`);
  console.log(`   `);
  console.log(`   public/audio/       ← Final split individual word MP3s go here`);
  console.log(`     ├── de/`);
  console.log(`     ├── en/`);
  console.log(`     ├── ar/`);
  console.log(`     ├── fr/`);
  console.log(`     ├── it/`);
  console.log(`     └── pl/`);

  console.log(`\n✅ Folder structure ready!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Run extraction: node scripts/extract-vocabulary.js`);
  console.log(`   2. Open helper tool: open scripts/generate-helper.html`);
  console.log(`   3. Generate audio on TTSMaker.com`);
  console.log(`   4. Split MP3s and organize files\n`);
}

// Run
try {
  createStructure();
} catch (error) {
  console.error('❌ Error creating structure:', error.message);
  process.exit(1);
}
