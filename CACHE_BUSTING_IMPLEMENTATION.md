# Foolproof Cache-Busting Solution for LingXM Personal

## Problem Statement
iPhone users see old cached versions even after new builds. Previous solutions failed because:
1. Old HTML remains cached even with network-first strategy
2. Service Worker caching still uses old HTML when network fails
3. Query parameters don't work on cached HTML
4. iOS aggressively caches HTML despite meta tags

## Solution Architecture

### Three-Layer Defense System

#### Layer 1: Build Timestamp Injection (Build Time)
- Generate unique timestamp during `npm run build`
- Inject into HTML as a data attribute
- Served in `version.json` for comparison

#### Layer 2: Aggressive Metadata (HTML)
- Cache-Control headers (server-side)
- No-cache meta tags
- Pragma and Expires headers

#### Layer 3: Runtime Version Check (JavaScript)
- Check for latest version on EVERY page load
- Compare build timestamps
- Force hard refresh if mismatch detected
- Unregister old service workers

#### Layer 4: Service Worker Bypass (Optional Nuclear Option)
- Disable SW for HTML completely
- Keep SW only for assets
- Trade offline support for guaranteed fresh HTML

## Implementation Steps

### Step 1: Create Build Script Hook
File: `build-version.js` - Generates version.json during build

### Step 2: Update Vite Config
File: `vite.config.js` - Runs version generation before build

### Step 3: Inject Version into HTML
File: `index.html` - Add data-build-timestamp attribute

### Step 4: Create Version Check Module
File: `src/utils/version-check.js` - Runtime version verification

### Step 5: Update Main App
File: `src/app.js` - Initialize version check on load

### Step 6: Aggressive Service Worker
File: `public/service-worker.js` - Network-first with aggressive cache busting

### Step 7: Update HTML Meta Tags
File: `index.html` - Add aggressive cache prevention headers

## Git Workflow

1. Verify dev branch is merged to main
2. Build with new version timestamp
3. Deploy new version with cache-busting headers
4. Existing cached HTML will detect version mismatch
5. Old app will force refresh and load new build

## Testing on iPhone

1. Load app normally
2. Note current version in console
3. Deploy new build
4. Refresh page on iPhone
5. Should see new version loaded
6. No old cached content visible

## Fallback Chain

1. Check version.json (network)
2. If network fails, check localStorage
3. If mismatch, force hard reload
4. Service worker unregisters itself
5. Browser clears all LingXM caches
6. Page reloads with fresh content
