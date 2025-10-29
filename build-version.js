// Build Version Generator
// Generates a version.json file with build timestamp
// This file is checked on every page load to detect stale caches

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version = {
  buildTime: new Date().toISOString(),
  timestamp: Date.now(),
  version: '5.0.0'
};

const distPath = path.join(__dirname, 'dist', 'version.json');

// Ensure dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.mkdirSync(path.join(__dirname, 'dist'));
}

fs.writeFileSync(distPath, JSON.stringify(version, null, 2));

console.log('[Build] Generated version.json:');
console.log(`  Build Time: ${version.buildTime}`);
console.log(`  Timestamp: ${version.timestamp}`);
console.log(`  Version: ${version.version}`);
