import { defineConfig } from 'vite'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Generate version before building
const generateBuildVersion = () => {
  console.log('[Vite Config] Generating build version...');
  
  const buildTimestamp = Date.now();
  const buildDate = new Date().toISOString();
  const buildVersion = buildDate.split('T')[0] + '.' + buildTimestamp;
  
  const versionData = {
    timestamp: buildTimestamp,
    date: buildDate,
    version: buildVersion,
    branch: process.env.GIT_BRANCH || 'unknown'
  };
  
  return { buildTimestamp, buildDate, buildVersion, versionData };
};

export default defineConfig({
  root: '.',
  publicDir: 'public',  // Explicit: ensures public/ folder assets are copied to dist/
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    copyPublicDir: true,  // Ensure public/ directory is copied during build
    rollupOptions: {
      output: {
        // Ensure index.html doesn't get hashed so it remains cacheable
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  // Hook into build start to generate version
  plugins: [
    {
      name: 'build-version-generator',
      apply: 'build',
      enforce: 'pre',
      async resolveId(id) {
        if (id === 'virtual-version-data') {
          return id;
        }
      },
      async load(id) {
        if (id === 'virtual-version-data') {
          const { versionData } = generateBuildVersion();
          return 'export const versionData = ' + JSON.stringify(versionData) + ';';
        }
      },
      writeBundle() {
        console.log('[Vite Config] Generating version.json in dist...');
        const { versionData } = generateBuildVersion();
        const distDir = path.join(process.cwd(), 'dist');
        
        // Ensure dist exists
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        
        // Write version.json
        const versionFile = path.join(distDir, 'version.json');
        fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
        console.log('[Vite Config] version.json written to:', versionFile);
        
        // Inject into dist/index.html
        const indexHtmlPath = path.join(distDir, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          let htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
          
          // Inject build timestamp as data attribute on html element
          htmlContent = htmlContent.replace(
            /<html[^>]*>/i,
            (match) => match.replace('>', ' data-build-timestamp="' + versionData.timestamp + '" data-build-version="' + versionData.version + '">')
          );
          
          // Also inject as meta tags
          htmlContent = htmlContent.replace(
            /<meta name="viewport"[^>]*>/,
            (match) => match + '\n    <meta name="build-timestamp" content="' + versionData.timestamp + '">\n    <meta name="build-version" content="' + versionData.version + '">'
          );
          
          fs.writeFileSync(indexHtmlPath, htmlContent, 'utf-8');
          console.log('[Vite Config] Injected version into index.html');
        }
      }
    }
  ]
})
