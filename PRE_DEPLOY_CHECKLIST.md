# Pre-Deployment Checklist

Use this checklist before every deployment to ensure cache-busting is working correctly.

## Git Verification

- [ ] Confirm you're on `main` branch: `git branch`
- [ ] Confirm working tree is clean: `git status`
- [ ] Check dev branch is merged: `git log --oneline main | grep dev`
- [ ] No uncommitted changes: `git status`

## Code Review

- [ ] `src/utils/version-check.js` exists
- [ ] `index.html` has cache-control meta tags (search for "cache-control")
- [ ] `index.html` has bootstrap version check script (search for "[Bootstrap]")
- [ ] `vite.config.js` has version generation plugin
- [ ] `public/service-worker.js` updated with network-first for HTML

## Build Verification

```bash
# Clean build
rm -rf dist/
npm run build

# Check version.json
cat dist/version.json
# Should show: { "timestamp": XXXXX, "version": "2024-XX-XX.XXXXX", ... }

# Check HTML injection
grep "data-build-timestamp" dist/index.html
# Should show: data-build-timestamp="XXXXX"

# Check version is accessible
npm run preview &
sleep 2
curl http://localhost:4173/version.json
kill %1
```

## Pre-Deploy Checks

- [ ] `dist/version.json` file exists
- [ ] `dist/index.html` contains `data-build-timestamp`
- [ ] `dist/index.html` contains cache-control meta tags
- [ ] Timestamp is numeric and reasonable (current Unix timestamp in milliseconds)
- [ ] No TypeScript/JavaScript errors in dist/

## Deployment

- [ ] Run: `npm run deploy`
- [ ] Wait for deployment to complete
- [ ] Verify deployment succeeded (check Vercel dashboard or logs)

## Post-Deploy Verification (CRITICAL)

```bash
# Replace YOUR_DOMAIN with your actual domain
YOUR_DOMAIN="your-domain.com"

# 1. Check version.json is served
curl https://${YOUR_DOMAIN}/version.json
# Should show valid JSON with timestamp

# 2. Check HTML has version tag
curl https://${YOUR_DOMAIN}/ | grep "data-build-timestamp"
# Should show timestamp attribute

# 3. Check cache headers
curl -I https://${YOUR_DOMAIN}/ | grep -i cache-control
# Should show: no-cache, no-store, must-revalidate

# 4. Test in browser
# Open app in browser
# Open DevTools Console (F12)
# Should see: [Bootstrap] Current build timestamp: XXXXX
# Should see: [Bootstrap] Latest version: {timestamp: ...}
```

## Device Testing (iPhone)

- [ ] Load app on iPhone Safari
- [ ] Check console shows version check (Develop > Console)
- [ ] Deploy new build to production
- [ ] Refresh page on iPhone
- [ ] Should see new timestamp in console
- [ ] Should see updated content (no stale cache)
- [ ] Check that language details are current (not old)

## Common Issues

### Issue: version.json returns 404
- [ ] Verify `dist/version.json` exists locally
- [ ] Check deployment logs for errors
- [ ] Verify public directory was copied to dist

### Issue: HTML doesn't have timestamp
- [ ] Run `npm run build` again
- [ ] Check vite.config.js has plugin
- [ ] Check index.html for syntax errors

### Issue: Cache headers not being set
- [ ] For Vercel: Automatic (no action needed)
- [ ] For other hosting: Check server configuration
- [ ] For CloudFlare: Disable caching for index.html

### Issue: Still seeing old version on iPhone
- [ ] Force quit the Safari app
- [ ] Settings > Safari > Clear History and Website Data
- [ ] Restart iPhone
- [ ] Try in private/incognito mode
- [ ] Check console for errors

## Rollback Plan

If something goes wrong:

1. **Quick fix** (app has minor issue):
   ```bash
   # Fix the issue
   git add .
   git commit -m "fix: [description]"
   npm run build
   npm run deploy
   ```
   Users will get new version automatically within 60 seconds.

2. **Emergency revert** (critical issue):
   ```bash
   git revert HEAD
   npm run build
   npm run deploy
   ```
   Note: Don't revert to older version (users won't be forced to update).
   Instead, fix the issue and deploy new version.

## Performance Validation

After deployment, monitor:

- [ ] App loads normally
- [ ] No infinite reload loops
- [ ] Service worker registers successfully
- [ ] No console errors
- [ ] Check DevTools > Application > Cache Storage

## Sign-Off

- [ ] All checks passed
- [ ] Deployment successful
- [ ] Device testing successful
- [ ] No critical issues reported
- [ ] Users receiving latest build

---

Date: __________
Deployed by: __________
Version: __________
Build timestamp: __________
