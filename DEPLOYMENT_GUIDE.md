# Foolproof Cache-Busting Deployment Guide

## How the Solution Works

### 4-Layer Defense System

#### Layer 1: Bootstrap Version Check (HTML Page Load)
- **When**: Runs BEFORE service worker registration
- **What**: Checks `/version.json` immediately
- **If mismatch**: Unregisters service workers, clears all caches, hard reloads
- **Why first**: Catches stale HTML before app starts
- **File**: `index.html` (bootstrap script)

#### Layer 2: Service Worker Network-First
- **When**: After service worker registers
- **What**: Network-first for HTML and version.json
- **Fallback**: Uses cache only if network fails
- **Headers**: Aggressive no-cache headers on HTML requests
- **File**: `public/service-worker.js`

#### Layer 3: Runtime Version Check Module
- **When**: Every 60 seconds + when page becomes visible
- **What**: Fetches version.json and compares timestamps
- **If mismatch**: Clears caches, unregisters SW, reloads
- **Offline handling**: Uses localStorage cache for comparison
- **File**: `src/utils/version-check.js`

#### Layer 4: Meta Tag Cache Prevention
- **When**: Always (browser level)
- **What**: HTTP-Equiv and meta cache-control tags
- **Browser support**: All modern browsers including Safari/iOS
- **File**: `index.html` (meta tags in head)

### Build Timestamp Injection

During `npm run build`:
1. Generates unique timestamp: `2024-10-29.1729123456789`
2. Creates `dist/version.json` with metadata
3. Injects timestamp into `dist/index.html` as meta tag
4. Vite config automatically does this via plugin

### Why This Works on iPhone

1. **Bootstrap check** catches stale HTML before app initializes
2. **No-cache headers** prevent iOS from caching HTML aggressively
3. **Service worker unregistration** removes offline caches
4. **Hard reload** uses `window.location.href = window.location.href`
5. **Multiple checks** (bootstrap, periodic, visibility) ensure redundancy

## Deployment Workflow

### Step 1: Verify Git Status
```bash
# On main branch
git status
# Should show: "nothing to commit, working tree clean"

# Verify dev is merged
git log --oneline main | head -5
```

### Step 2: Build Application
```bash
npm run build
```

Expected output:
```
[Vite Config] Generating build version...
[Vite Config] version.json written to: dist/version.json
[Vite Config] Injected version into index.html
```

### Step 3: Check Generated Files
```bash
# Verify version.json exists
cat dist/version.json

# Verify timestamp was injected into HTML
grep "data-build-timestamp" dist/index.html

# Verify meta tags are present
grep "cache-control" dist/index.html
```

### Step 4: Deploy to Production
```bash
# Using Vercel (configured in package.json)
npm run deploy

# Or deploy manually to your server
# Ensure the server returns these headers for index.html:
# Cache-Control: no-cache, no-store, must-revalidate
# Pragma: no-cache
# Expires: 0
```

### Step 5: Verify Deployment
```bash
# Check that version.json is accessible
curl https://your-domain.com/version.json

# Check that index.html has version timestamp
curl https://your-domain.com/ | grep "data-build-timestamp"

# Check cache headers (using curl -I)
curl -I https://your-domain.com/ | grep -i cache-control
```

## Testing on iPhone

### Manual Testing

1. **Load app on iPhone**
   - Open Safari
   - Navigate to your app URL
   - Open DevTools (Develop menu)
   - Check console for: `[Bootstrap] Current build timestamp: XXXXX`

2. **Deploy new build**
   - Run `npm run build`
   - Deploy to server
   - Note the NEW timestamp in dist/version.json

3. **Refresh on iPhone**
   - Pull down to refresh (or hard refresh)
   - Wait 2-3 seconds
   - Check console - should see NEWER timestamp
   - Check that page reloaded (you'll see reload activity)

4. **Verify old content is gone**
   - Check that you see updated content
   - Old cached language details should be gone
   - Profile data should be current

### Debug Console Output

Good signs:
```
[Bootstrap] Version check running...
[Bootstrap] Current build timestamp: 1729123456789
[Bootstrap] Latest version: {timestamp: 1729123456789, ...}
[Version Check] Running latest version
```

Problem signs:
```
[Bootstrap] STALE BUILD DETECTED! Current: 1729000000000 Latest: 1729123456789
[Bootstrap] FORCING HARD RELOAD
[Service Worker] Unregistering service worker
[Bootstrap] Clearing cache: lingxm-v5
```

If you see problem signs, the system is working - it's detecting the stale build and fixing it!

## Server Configuration

### For Vercel (Recommended)
Already configured - Vercel handles cache headers automatically for SPA apps.

### For Other Servers

#### Apache (.htaccess)
```apache
# Disable caching for HTML
<FilesMatch "\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</FilesMatch>

# Allow caching for assets
<FilesMatch "\.(js|css|jpg|png|gif|svg|woff2?)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
```

#### Nginx
```nginx
location / {
    try_files $uri /index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

location ~* \.(js|css|jpg|png|gif|svg|woff2?)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    expires 1y;
}
```

#### Node.js/Express
```javascript
// For index.html
app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile('dist/index.html');
});

// For assets
app.use(express.static('dist', {
  maxAge: '1y',
  etag: false
}));
```

## Troubleshooting

### Issue: Still seeing old version after deployment

**Check 1: Is version.json being served?**
```bash
curl https://your-domain.com/version.json
# Should show new timestamp
```

**Check 2: Is cache header being set?**
```bash
curl -I https://your-domain.com/index.html | grep -i cache
# Should show: no-cache, no-store, must-revalidate
```

**Check 3: Browser cache**
- Hard refresh: CMD+SHIFT+R (Mac) or CTRL+SHIFT+R (Windows)
- iPhone: Settings > Safari > Clear History and Website Data

**Check 4: CloudFlare or CDN caching**
- Disable caching for index.html
- Only cache assets (.js, .css, etc.)

### Issue: Service worker not updating

**Solution 1: Check unregister logic**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Found registrations:', regs.length);
  regs.forEach(reg => console.log(reg.scope));
});
```

**Solution 2: Manually clear**
```javascript
// In browser console
caches.keys().then(names => {
  console.log('Caches:', names);
  names.forEach(name => caches.delete(name));
});
```

### Issue: Continuous reload loop

**Cause**: version.json not updating between builds

**Fix**:
```bash
# Verify version.json timestamp changed
cat dist/version.json
# Should have NEW timestamp

# Verify it's deployed
curl https://your-domain.com/version.json
# Should show NEW timestamp
```

### Issue: iPhone shows blank page

**Possible cause**: Bootstrap script has error

**Fix**:
1. Check browser console for JavaScript errors
2. Verify version.json exists and is valid JSON
3. Hard reset: Settings > Safari > Clear History and Website Data
4. Try in incognito/private mode first

## Performance Impact

- **Bootstrap check**: ~10-50ms (faster with cache)
- **Periodic version checks**: 1 check per 60 seconds
- **No offline impact**: If no network, uses cached version
- **Cache sizes**: Same or smaller (clears old caches)

## Rollback Procedure

If deployed build has issues:

1. **Quick fix**: Deploy new version with fix
   - System automatically detects newer timestamp
   - Users get new version within 60 seconds

2. **Emergency rollback**:
   ```bash
   # Revert last commit
   git revert HEAD
   npm run build
   npm run deploy
   ```

   - Older timestamp will NOT force reload (only newer does)
   - Users with new version will detect mismatch
   - But you should fix the issue ASAP

## Monitoring

### What to watch for

1. **Console errors**: Check browser console for [Bootstrap] or [Version Check] errors
2. **version.json availability**: Ensure endpoint returns valid JSON
3. **Deployment success**: Verify dist/version.json has new timestamp
4. **User reports**: Watch for "still seeing old version" issues

### Debug Mode

Enable extra logging:
```javascript
// In browser console
localStorage.setItem('lingxm_debug', 'true');
location.reload();
```

This will log every version check and cache operation.

## Security Considerations

1. **version.json is public**: This is intentional - it's non-sensitive metadata
2. **Service worker is public**: Required for PWA functionality
3. **No sensitive data in caches**: All user data is in localStorage only
4. **Cache clearing is safe**: Only affects offline functionality temporarily

## FAQ

**Q: Why aggressive cache-busting?**
A: iPhone Safari caches HTML aggressively and doesn't always respect cache headers. This solution uses multiple layers to guarantee fresh content.

**Q: Does this break offline mode?**
A: Temporarily - when new version is deployed, offline users will see reload. But service worker still caches assets for next load.

**Q: What if server is down?**
A: Bootstrap check will timeout gracefully. App will use cached version. User will see last known good version instead of blank page.

**Q: Can I disable version checking?**
A: Not recommended, but you can remove the version-check module import from app.js. Bootstrap check will still run.

**Q: Does this work on Android?**
A: Yes - Chrome and Firefox on Android also cache aggressively. This solution works there too.

## Summary

This solution provides a **foolproof** way to ensure users always get the latest build, even on iPhone with aggressive caching. It uses:

1. Bootstrap timestamp check (catches stale HTML immediately)
2. Aggressive meta tag cache prevention (browser level)
3. Service worker network-first for HTML (reduces reliance on cache)
4. Runtime periodic version checking (catches updates during session)
5. Hard reload with cache clearing (nuclear option when needed)

The system is designed to be transparent to users - they see fresh content without thinking about cache busting.
