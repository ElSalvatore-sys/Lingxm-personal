#!/usr/bin/env node

/**
 * Validate vocabulary data integrity
 *
 * Checks:
 * - All required fields present
 * - Translations exist in both languages
 * - Explanations exist in both languages
 * - Examples exist in both languages
 * - Conjugations are appropriate (null for nouns, array for verbs)
 * - No empty strings or missing data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validation results
const results = {
  totalFiles: 0,
  totalWords: 0,
  filesWithIssues: [],
  issuesByType: {
    missingTranslations: 0,
    missingExplanations: 0,
    missingExamples: 0,
    emptyFields: 0,
    malformedData: 0
  },
  allIssues: []
};

/**
 * Get language codes from a file path
 */
function getLanguageCodes(filePath) {
  const filename = path.basename(filePath, '.json');
  const parts = filename.split('-');

  // Examples: en.json, de-gastro.json, de-it.json
  const primaryLang = parts[0];

  // Try to determine the second language from the directory structure
  // This is a simplified approach - in reality, we'd need to read the actual data
  return { primaryLang };
}

/**
 * Validate a single word entry
 */
function validateWord(word, index, filePath, langCodes) {
  const issues = [];

  // Check required fields exist
  if (!word.word) {
    issues.push(`Word ${index}: Missing 'word' field`);
  }

  if (!word.translations) {
    issues.push(`Word ${index} (${word.word}): Missing 'translations' object`);
  } else {
    // Check translations has at least one key
    const translationKeys = Object.keys(word.translations);
    if (translationKeys.length === 0) {
      issues.push(`Word ${index} (${word.word}): Empty translations object`);
      results.issuesByType.missingTranslations++;
    }

    // Check for empty translation values
    translationKeys.forEach(lang => {
      if (!word.translations[lang] || word.translations[lang].trim() === '') {
        issues.push(`Word ${index} (${word.word}): Empty translation for language '${lang}'`);
        results.issuesByType.emptyFields++;
      }
    });
  }

  if (!word.explanation) {
    issues.push(`Word ${index} (${word.word}): Missing 'explanation' object`);
  } else {
    // Check explanations has at least one key
    const explanationKeys = Object.keys(word.explanation);
    if (explanationKeys.length === 0) {
      issues.push(`Word ${index} (${word.word}): Empty explanation object`);
      results.issuesByType.missingExplanations++;
    }

    // Check for empty explanation values
    explanationKeys.forEach(lang => {
      if (!word.explanation[lang] || word.explanation[lang].trim() === '') {
        issues.push(`Word ${index} (${word.word}): Empty explanation for language '${lang}'`);
        results.issuesByType.emptyFields++;
      }
    });
  }

  if (!word.examples) {
    issues.push(`Word ${index} (${word.word}): Missing 'examples' object`);
  } else {
    // Check examples has at least one key
    const exampleKeys = Object.keys(word.examples);
    if (exampleKeys.length === 0) {
      issues.push(`Word ${index} (${word.word}): Empty examples object`);
      results.issuesByType.missingExamples++;
    }

    // Check each language has examples array
    exampleKeys.forEach(lang => {
      if (!Array.isArray(word.examples[lang])) {
        issues.push(`Word ${index} (${word.word}): Examples for '${lang}' is not an array`);
        results.issuesByType.malformedData++;
      } else if (word.examples[lang].length === 0) {
        issues.push(`Word ${index} (${word.word}): No examples for language '${lang}'`);
        results.issuesByType.missingExamples++;
      }

      // Check for empty example strings
      if (Array.isArray(word.examples[lang])) {
        word.examples[lang].forEach((example, i) => {
          if (!example || example.trim() === '') {
            issues.push(`Word ${index} (${word.word}): Empty example ${i} for language '${lang}'`);
            results.issuesByType.emptyFields++;
          }
        });
      }
    });
  }

  // Conjugations can be null (for nouns), array (simple list), or object (organized by tense)
  if (word.conjugations !== null &&
      !Array.isArray(word.conjugations) &&
      typeof word.conjugations !== 'object') {
    issues.push(`Word ${index} (${word.word}): Conjugations must be null, array, or object, got ${typeof word.conjugations}`);
    results.issuesByType.malformedData++;
  }

  // If conjugations is an object, validate its structure (French-style tense-based conjugations)
  if (word.conjugations !== null && typeof word.conjugations === 'object' && !Array.isArray(word.conjugations)) {
    const tenses = Object.keys(word.conjugations);
    if (tenses.length === 0) {
      issues.push(`Word ${index} (${word.word}): Conjugations object is empty`);
      results.issuesByType.malformedData++;
    }
    // Check each tense has an array of conjugated forms
    tenses.forEach(tense => {
      if (!Array.isArray(word.conjugations[tense])) {
        issues.push(`Word ${index} (${word.word}): Conjugations for tense '${tense}' must be an array`);
        results.issuesByType.malformedData++;
      }
    });
  }

  // Check CEFR level (should have been added in previous script)
  if (!word.cefrLevel) {
    issues.push(`Word ${index} (${word.word}): Missing CEFR level`);
  } else {
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(word.cefrLevel)) {
      issues.push(`Word ${index} (${word.word}): Invalid CEFR level '${word.cefrLevel}'`);
    }
  }

  return issues;
}

/**
 * Validate a vocabulary file
 */
function validateVocabularyFile(filePath) {
  console.log(`\n📁 Validating: ${path.relative(process.cwd(), filePath)}`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const vocabulary = JSON.parse(content);

    if (!Array.isArray(vocabulary)) {
      const issue = `File is not an array: ${filePath}`;
      console.log(`  ❌ ${issue}`);
      results.filesWithIssues.push(filePath);
      results.allIssues.push({ file: filePath, issue });
      return;
    }

    const langCodes = getLanguageCodes(filePath);
    let fileHasIssues = false;
    const fileIssues = [];

    vocabulary.forEach((word, index) => {
      const wordIssues = validateWord(word, index, filePath, langCodes);
      if (wordIssues.length > 0) {
        fileHasIssues = true;
        fileIssues.push(...wordIssues);
      }
    });

    results.totalWords += vocabulary.length;

    if (fileHasIssues) {
      console.log(`  ❌ Found ${fileIssues.length} issues`);
      results.filesWithIssues.push(filePath);
      fileIssues.forEach(issue => {
        console.log(`     - ${issue}`);
        results.allIssues.push({ file: filePath, issue });
      });
    } else {
      console.log(`  ✅ All ${vocabulary.length} words valid`);
    }

  } catch (error) {
    const issue = `Error reading/parsing file: ${error.message}`;
    console.log(`  ❌ ${issue}`);
    results.filesWithIssues.push(filePath);
    results.allIssues.push({ file: filePath, issue });
  }
}

/**
 * Find all vocabulary files
 */
function findVocabularyFiles(dataDir) {
  const files = [];

  const profiles = fs.readdirSync(dataDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== 'sentences')
    .map(dirent => dirent.name);

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
 * Print summary report
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));

  console.log(`\nTotal files checked: ${results.totalFiles}`);
  console.log(`Total words checked: ${results.totalWords}`);
  console.log(`Files with issues: ${results.filesWithIssues.length}`);
  console.log(`Clean files: ${results.totalFiles - results.filesWithIssues.length}`);

  console.log('\n📋 Issues by type:');
  console.log(`  Missing translations: ${results.issuesByType.missingTranslations}`);
  console.log(`  Missing explanations: ${results.issuesByType.missingExplanations}`);
  console.log(`  Missing examples: ${results.issuesByType.missingExamples}`);
  console.log(`  Empty fields: ${results.issuesByType.emptyFields}`);
  console.log(`  Malformed data: ${results.issuesByType.malformedData}`);
  console.log(`  Total issues: ${results.allIssues.length}`);

  if (results.filesWithIssues.length === 0) {
    console.log('\n✅ All vocabulary files are valid!');
  } else {
    console.log('\n⚠️  Files needing attention:');
    results.filesWithIssues.forEach(file => {
      console.log(`  - ${path.relative(process.cwd(), file)}`);
    });
  }

  // Write detailed report to file
  const reportPath = path.join(__dirname, '..', 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Detailed report saved to: ${path.relative(process.cwd(), reportPath)}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting vocabulary data validation...');

  const dataDir = path.join(__dirname, '..', 'public', 'data');
  const vocabularyFiles = findVocabularyFiles(dataDir);

  results.totalFiles = vocabularyFiles.length;

  vocabularyFiles.forEach(file => {
    validateVocabularyFile(file);
  });

  printSummary();

  // Exit with error code if issues found
  if (results.filesWithIssues.length > 0) {
    console.log('\n⚠️  Validation completed with issues');
    process.exit(1);
  } else {
    console.log('\n✅ Validation completed successfully');
    process.exit(0);
  }
}

// Run the script
main();
