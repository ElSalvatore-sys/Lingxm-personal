#!/usr/bin/env node
// Audio Splitting Script - Split batch MP3s into individual word files
// Uses ffmpeg silence detection to split audio at word boundaries

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { generateHash } from './hash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_RAW_DIR = path.join(__dirname, '../audio-raw');
const AUDIO_OUTPUT_DIR = path.join(__dirname, '../public/audio');
const MAPPING_PATH = path.join(AUDIO_RAW_DIR, 'batch-mapping.json');
const ERRORS_LOG_PATH = path.join(AUDIO_RAW_DIR, 'errors.log');
const REPORT_PATH = path.join(AUDIO_RAW_DIR, 'split-report.json');

// Silence detection parameters
const SILENCE_THRESHOLD = '-40dB';  // Noise threshold
const SILENCE_DURATION = '0.3';     // Minimum silence duration in seconds

class AudioSplitter {
  constructor() {
    this.stats = {
      total: 0,
      processed: 0,
      failed: 0,
      filesCreated: 0,
      errors: []
    };
    this.startTime = Date.now();
  }

  // Find all batch MP3 files
  findBatchFiles() {
    const languages = ['de', 'en', 'ar', 'fr', 'it', 'pl'];
    const batchFiles = [];

    for (const lang of languages) {
      const langDir = path.join(AUDIO_RAW_DIR, lang);
      if (!fs.existsSync(langDir)) continue;

      const files = fs.readdirSync(langDir)
        .filter(f => f.startsWith('batch-') && f.endsWith('.mp3'))
        .map(f => ({
          path: path.join(langDir, f),
          filename: f,
          language: lang
        }));

      batchFiles.push(...files);
    }

    return batchFiles.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  // Detect silence points using ffmpeg
  detectSilence(inputPath) {
    try {
      const cmd = `ffmpeg -i "${inputPath}" -af silencedetect=n=${SILENCE_THRESHOLD}:d=${SILENCE_DURATION} -f null - 2>&1`;
      const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

      // Parse silence_start and silence_end from output
      const silenceStarts = [];
      const silenceEnds = [];

      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('silence_start:')) {
          const match = line.match(/silence_start: ([\d.]+)/);
          if (match) silenceStarts.push(parseFloat(match[1]));
        }
        if (line.includes('silence_end:')) {
          const match = line.match(/silence_end: ([\d.]+)/);
          if (match) silenceEnds.push(parseFloat(match[1]));
        }
      }

      return { silenceStarts, silenceEnds };
    } catch (error) {
      console.error(`   ❌ Silence detection failed: ${error.message}`);
      return null;
    }
  }

  // Calculate segment boundaries from silence detection
  calculateSegments(silenceData, audioDuration) {
    const { silenceStarts, silenceEnds } = silenceData;
    const segments = [];

    if (silenceStarts.length === 0 && silenceEnds.length === 0) {
      // No silence detected - treat as single segment
      return [{ start: 0, end: audioDuration }];
    }

    let currentStart = 0;

    for (let i = 0; i < silenceStarts.length; i++) {
      const silenceStart = silenceStarts[i];
      const silenceEnd = silenceEnds[i] || silenceStart + 0.3;

      // Segment ends at start of silence
      if (silenceStart > currentStart + 0.1) { // Minimum 0.1s segment
        segments.push({
          start: currentStart,
          end: silenceStart
        });
      }

      // Next segment starts after silence
      currentStart = silenceEnd;
    }

    // Add final segment if audio continues after last silence
    if (currentStart < audioDuration - 0.1) {
      segments.push({
        start: currentStart,
        end: audioDuration
      });
    }

    return segments;
  }

  // Get audio duration
  getAudioDuration(inputPath) {
    try {
      const cmd = `ffmpeg -i "${inputPath}" 2>&1 | grep Duration`;
      const output = execSync(cmd, { encoding: 'utf8' });
      const match = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);

      if (match) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseFloat(match[3]);
        return hours * 3600 + minutes * 60 + seconds;
      }
    } catch (error) {
      console.error(`   ⚠️  Could not determine duration: ${error.message}`);
    }
    return 0;
  }

  // Extract audio segment
  extractSegment(inputPath, start, end, outputPath) {
    try {
      const duration = end - start;
      const cmd = `ffmpeg -i "${inputPath}" -ss ${start} -t ${duration} -acodec copy "${outputPath}" -y 2>&1`;
      execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
      return true;
    } catch (error) {
      console.error(`   ❌ Segment extraction failed: ${error.message}`);
      return false;
    }
  }

  // Process a single batch file
  processBatch(batchFile, mapping) {
    const { path: inputPath, filename, language } = batchFile;

    console.log(`\n📦 Processing ${filename}... (${this.stats.processed + 1}/${this.stats.total})`);

    // Get expected words from mapping
    const mp3Filename = filename;
    const expectedWords = mapping[mp3Filename];

    if (!expectedWords) {
      console.log(`   ⚠️  No mapping found for ${mp3Filename}, skipping`);
      this.stats.failed++;
      return;
    }

    console.log(`   📝 Expected: ${expectedWords.length} words`);

    // Detect silence points
    console.log(`   🔍 Detecting silence...`);
    const silenceData = this.detectSilence(inputPath);

    if (!silenceData) {
      this.logError(filename, 'Silence detection failed');
      this.stats.failed++;
      return;
    }

    // Get audio duration
    const duration = this.getAudioDuration(inputPath);
    console.log(`   ⏱️  Duration: ${duration.toFixed(2)}s`);

    // Calculate segments
    const segments = this.calculateSegments(silenceData, duration);
    console.log(`   ✂️  Found ${segments.length} segments`);

    // Check if segment count matches word count
    if (segments.length !== expectedWords.length) {
      const diff = Math.abs(segments.length - expectedWords.length);
      console.log(`   ⚠️  Mismatch: ${segments.length} segments vs ${expectedWords.length} words (diff: ${diff})`);

      if (diff > 7) {
        this.logError(filename, `Large mismatch: ${segments.length} segments vs ${expectedWords.length} words`);
        this.stats.failed++;
        return;
      }

      console.log(`   ⚡ Attempting to proceed with best match...`);
    }

    // Create output directory
    const outputDir = path.join(AUDIO_OUTPUT_DIR, language);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extract and save each segment
    let successCount = 0;
    const minCount = Math.min(segments.length, expectedWords.length);

    for (let i = 0; i < minCount; i++) {
      const segment = segments[i];
      const wordData = expectedWords[i];
      const outputPath = path.join(AUDIO_OUTPUT_DIR, wordData.filename);

      if (this.extractSegment(inputPath, segment.start, segment.end, outputPath)) {
        successCount++;
        this.stats.filesCreated++;
      }
    }

    console.log(`   ✅ Extracted ${successCount}/${expectedWords.length} words`);
    this.stats.processed++;
  }

  // Log error to file
  logError(filename, reason) {
    const error = `${new Date().toISOString()} | ${filename} | ${reason}`;
    this.stats.errors.push({ filename, reason, timestamp: new Date().toISOString() });

    fs.appendFileSync(ERRORS_LOG_PATH, error + '\n');
  }

  // Generate final report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: ((Date.now() - this.startTime) / 1000).toFixed(1) + 's',
      statistics: this.stats,
      errors: this.stats.errors
    };

    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    return report;
  }

  // Main execution
  async run() {
    console.log('🎵 LingXM Audio Splitting System\n');
    console.log('=' .repeat(60) + '\n');

    // Check prerequisites
    if (!fs.existsSync(MAPPING_PATH)) {
      console.error('❌ batch-mapping.json not found!');
      console.log('   Run: npm run prepare-batches first\n');
      process.exit(1);
    }

    // Load mapping
    const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
    console.log('✅ Loaded batch mapping\n');

    // Find all batch files
    const batchFiles = this.findBatchFiles();
    this.stats.total = batchFiles.length;

    if (batchFiles.length === 0) {
      console.error('❌ No batch MP3 files found in audio-raw/');
      console.log('   Expected files like: audio-raw/de/batch-de-001.mp3\n');
      process.exit(1);
    }

    console.log(`📂 Found ${batchFiles.length} batch files:\n`);
    batchFiles.forEach(f => console.log(`   - ${f.filename}`));

    // Clear old errors log
    if (fs.existsSync(ERRORS_LOG_PATH)) {
      fs.unlinkSync(ERRORS_LOG_PATH);
    }

    console.log('\n🚀 Starting audio splitting...\n');
    console.log('=' .repeat(60));

    // Process each batch
    for (const batchFile of batchFiles) {
      try {
        this.processBatch(batchFile, mapping);
      } catch (error) {
        console.error(`\n❌ Fatal error processing ${batchFile.filename}:`, error.message);
        this.logError(batchFile.filename, `Fatal error: ${error.message}`);
        this.stats.failed++;
      }
    }

    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 FINAL SUMMARY\n');

    const report = this.generateReport();

    console.log(`⏱️  Total time: ${report.duration}`);
    console.log(`📦 Batches processed: ${this.stats.processed}/${this.stats.total}`);
    console.log(`✅ Files created: ${this.stats.filesCreated}`);
    console.log(`❌ Failed batches: ${this.stats.failed}`);

    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors logged to: ${ERRORS_LOG_PATH}`);
      console.log(`\n❌ Problem batches:`);
      this.stats.errors.forEach(err => {
        console.log(`   - ${err.filename}: ${err.reason}`);
      });
      console.log(`\n💡 Fix with: node scripts/split-audio-single.js <batch-file>`);
    }

    console.log(`\n📄 Full report saved to: ${REPORT_PATH}`);
    console.log(`\n✅ Audio splitting complete!\n`);

    if (this.stats.failed > 0) {
      process.exit(1);
    }
  }
}

// Run splitter
const splitter = new AudioSplitter();
splitter.run().catch(error => {
  console.error('\n❌ SPLITTING FAILED:', error);
  process.exit(1);
});
