#!/usr/bin/env node

/**
 * Add CEFR metadata to all vocabulary files
 *
 * This script adds a "cefrLevel" field to each vocabulary word
 * based on its position in the file and the file's progression pattern.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define CEFR progression patterns for different file types
const PROGRESSION_PATTERNS = {
  // Standard A1-B1 progression (180 words total)
  'standard-beginner': [
    { level: 'A1', start: 0, end: 59 },
    { level: 'A2', start: 60, end: 119 },
    { level: 'B1', start: 120, end: 179 }
  ],

  // IT/Tech A2-C1 progression (180 words total)
  'tech-advanced': [
    { level: 'A2', start: 0, end: 44 },
    { level: 'B1', start: 45, end: 89 },
    { level: 'B2', start: 90, end: 134 },
    { level: 'C1', start: 135, end: 179 }
  ],

  // Gastronomy B1-C2 progression (180 words total)
  'gastro-advanced': [
    { level: 'B1', start: 0, end: 44 },
    { level: 'B2', start: 45, end: 89 },
    { level: 'C1', start: 90, end: 134 },
    { level: 'C2', start: 135, end: 179 }
  ],

  // Academic/Advanced C1-C2 only (180 words total)
  'academic-advanced': [
    { level: 'C1', start: 0, end: 89 },
    { level: 'C2', start: 90, end: 179 }
  ],

  // Italian A1-A2 progression (180 words total)
  'beginner-only': [
    { level: 'A1', start: 0, end: 89 },
    { level: 'A2', start: 90, end: 179 }
  ]
};

// Map files to their progression patterns
const FILE_PATTERNS = {
  // IT/Tech files
  'kafel/de-it.json': 'tech-advanced',

  // Gastronomy files
  'jawad/de-gastro.json': 'gastro-advanced',
  'salman/de-gastro.json': 'gastro-advanced',

  // Advanced academic files (need to be reversed later, but add metadata first)
  'hassan/en.json': 'academic-advanced',
  'hassan/de.json': 'academic-advanced',
  'hassan/ar.json': 'academic-advanced',
  'dmitri/en.json': 'academic-advanced',

  // Italian beginner files
  'ameeno/it.json': 'beginner-only',
  'valeria/it.json': 'beginner-only',

  // Russian A1-B1 (uses standard-beginner)
  'dmitri/ru.json': 'standard-beginner',

  // All other files use standard-beginner pattern
  'default': 'standard-beginner'
};

/**
 * Get CEFR level for a word based on its index and file pattern
 */
function getCEFRLevel(index, pattern) {
  const progression = PROGRESSION_PATTERNS[pattern];

  for (const range of progression) {
    if (index >= range.start && index <= range.end) {
      return range.level;
    }
  }

  // Fallback to B1 if not found
  return 'B1';
}

/**
 * Get progression pattern for a file
 */
function getFilePattern(filePath) {
  // Extract relative path from public/data/
  const relativePath = filePath.split('public/data/')[1];

  // Check if file has a specific pattern
  if (FILE_PATTERNS[relativePath]) {
    return FILE_PATTERNS[relativePath];
  }

  // Use default pattern
  return FILE_PATTERNS.default;
}

/**
 * Process a single vocabulary file
 */
function processVocabularyFile(filePath) {
  console.log(`Processing: ${filePath}`);

  // Read the file
  const content = fs.readFileSync(filePath, 'utf-8');
  const vocabulary = JSON.parse(content);

  // Get the progression pattern for this file
  const pattern = getFilePattern(filePath);
  console.log(`  Pattern: ${pattern}`);

  // Add CEFR level to each word
  let addedCount = 0;
  vocabulary.forEach((word, index) => {
    if (!word.cefrLevel) {
      word.cefrLevel = getCEFRLevel(index, pattern);
      addedCount++;
    }
  });

  console.log(`  Added CEFR levels to ${addedCount} words`);

  // Write back to file with pretty formatting
  fs.writeFileSync(filePath, JSON.stringify(vocabulary, null, 2), 'utf-8');

  return addedCount;
}

/**
 * Find all vocabulary files (exclude sentence files)
 */
function findVocabularyFiles(dataDir) {
  const files = [];

  // Read all profile directories
  const profiles = fs.readdirSync(dataDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== 'sentences')
    .map(dirent => dirent.name);

  // Get all JSON files from each profile directory
  profiles.forEach(profile => {
    const profileDir = path.join(dataDir, profile);
    const jsonFiles = fs.readdirSync(profileDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(profileDir, file));

    files.push(...jsonFiles);
  });

  return files;
}

/**
 * Main execution
 */
function main() {
  const dataDir = path.join(__dirname, '..', 'public', 'data');

  console.log('🔍 Finding vocabulary files...\n');
  const vocabularyFiles = findVocabularyFiles(dataDir);
  console.log(`Found ${vocabularyFiles.length} vocabulary files\n`);

  console.log('📝 Adding CEFR metadata...\n');
  let totalAdded = 0;

  vocabularyFiles.forEach(file => {
    const added = processVocabularyFile(file);
    totalAdded += added;
  });

  console.log('\n✅ Complete!');
  console.log(`   Total words updated: ${totalAdded}`);
  console.log(`   Total files processed: ${vocabularyFiles.length}`);
}

// Run the script
main();
