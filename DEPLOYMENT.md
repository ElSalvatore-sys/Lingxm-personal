# LingXM Personal - Deployment Guide

## 📱 PWA Features

LingXM Personal is now a fully-functional Progressive Web App with:

- ✅ **Installable on iPhone** - Add to Home Screen for native app experience
- ✅ **Works Offline** - Service Worker caches essential files
- ✅ **Fast Loading** - Intelligent caching strategy
- ✅ **App-like Experience** - No browser UI, full-screen mode
- ✅ **Auto-updates** - Service Worker handles updates seamlessly

## 🎨 Logo & Icons

The app includes a beautiful minimal logo representing language learning:
- **Design**: Three overlapping circles (language connections meeting in the center)
- **Colors**: Gradient from #667eea (blue) to #764ba2 (purple)
- **Format**: SVG (vector) at `/public/logo.svg`

### Generate PNG Icons

**Option 1: Using ImageMagick (Recommended)**
```bash
# Install ImageMagick
brew install imagemagick

# Run the icon generation script
./scripts/generate-icons.sh
```

**Option 2: Online Converter**
1. Go to [CloudConvert](https://cloudconvert.com/svg-to-png)
2. Upload `public/logo.svg`
3. Download each size: 72, 96, 128, 144, 152, 192, 384, 512
4. Save to `public/icons/`
5. Name format: `icon-{SIZE}x{SIZE}.png`

## 🚀 Deploy to Vercel

### Prerequisites

1. **Install Vercel CLI** globally:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```
   - Choose your preferred login method (GitHub, GitLab, Email)
   - Complete authentication in browser

### First-Time Deployment

1. **Generate Icons** (if not done yet):
   ```bash
   ./scripts/generate-icons.sh
   # OR use online converter
   ```

2. **Build the Project**:
   ```bash
   npm run build
   ```
   - This creates an optimized production build in `/dist`
   - Vite bundles all assets, minifies code, and optimizes performance

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```
   - First time: Answer setup questions
     - **Project name**: lingxm-personal (or your choice)
     - **Directory**: . (current directory)
     - **Build command**: npm run build (auto-detected)
     - **Output directory**: dist (auto-detected)
   - Vercel will deploy and give you a URL like: `https://lingxm-personal.vercel.app`

4. **Save the URL** - Share it or bookmark it!

### Quick Deploy Script

For convenience, you can use the npm script:

```bash
npm run deploy
```

This runs `vercel --prod` automatically.

### Update Deployment

After making changes:

```bash
# 1. Build latest changes
npm run build

# 2. Deploy
npm run deploy

# OR combine both:
npm run build && npm run deploy
```

Vercel will:
- Detect changes
- Build the new version
- Deploy with zero downtime
- Keep old version until new one is ready

## 📲 Install on iPhone

### Step-by-Step Guide

1. **Open the App**:
   - Open Safari on iPhone
   - Navigate to your Vercel URL: `https://your-app.vercel.app`

2. **Add to Home Screen**:
   - Tap the **Share** button (square with arrow up)
   - Scroll down and tap **"Add to Home Screen"**

3. **Customize (Optional)**:
   - Name: "LingXM" (default)
   - Tap **"Add"** in the top-right corner

4. **Launch**:
   - App icon appears on home screen with your logo!
   - Tap to open - runs in full-screen mode (no Safari UI)
   - Works offline after first visit

### iPhone Features

- ✅ Full-screen mode (no browser bars)
- ✅ Custom app icon (your logo)
- ✅ Splash screen on launch
- ✅ Stays in recent apps like native app
- ✅ Works offline after caching
- ✅ Dark status bar integration

## 🌐 Custom Domain (Optional)

Want a custom domain like `lingxm.com`?

### 1. Purchase Domain

Buy from:
- [Namecheap](https://www.namecheap.com)
- [Google Domains](https://domains.google)
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)

### 2. Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **lingxm-personal**
3. Go to **Settings** → **Domains**
4. Click **"Add Domain"**
5. Enter your domain: `lingxm.com`

### 3. Configure DNS

Vercel will show you DNS records to add:

**For root domain (lingxm.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Add these records in your domain registrar's DNS settings.

### 4. Verify & Deploy

- Vercel will verify DNS (may take 24-48 hours)
- Once verified, your app will be live at your custom domain!
- HTTPS is automatic (free SSL from Let's Encrypt)

## 🔄 Development Workflow

### Local Development

```bash
# Start dev server
npm run dev

# Opens at http://localhost:3000
# Hot reload enabled - changes appear instantly
```

### Test PWA Locally

```bash
# Build production version
npm run build

# Preview production build
npm run preview

# Opens at http://localhost:4173
# Test service worker, caching, offline mode
```

### Test on Phone (Local Network)

1. Find your local IP:
   ```bash
   ipconfig getifaddr en0  # macOS
   # Example: 192.168.1.100
   ```

2. Start dev server:
   ```bash
   npm run dev -- --host
   ```

3. On iPhone Safari:
   - Navigate to: `http://192.168.1.100:3000`
   - Test mobile experience before deploying

## 🐛 Troubleshooting

### Service Worker Not Updating

```bash
# In browser DevTools Console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister())
})

# Then hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Icons Not Showing

1. Check if icons are generated: `ls public/icons/`
2. Generate if missing: `./scripts/generate-icons.sh`
3. Rebuild: `npm run build`
4. Redeploy: `npm run deploy`

### Vercel Build Failed

Check build logs in Vercel dashboard. Common fixes:
- Ensure `npm run build` works locally
- Check `vercel.json` syntax
- Verify all dependencies in `package.json`

### Offline Mode Not Working

1. Visit app once while online (to cache assets)
2. Check Service Worker registration:
   ```javascript
   // Browser DevTools Console:
   navigator.serviceWorker.ready.then(reg => console.log('Ready:', reg))
   ```
3. Check cached files:
   - DevTools → Application → Cache Storage → lingxm-v1

## 📊 Monitoring

### Vercel Analytics (Free)

- Real-time visitor stats
- Performance metrics
- Geographical data
- Enable in: Vercel Dashboard → Project → Analytics

### Lighthouse Audit

Test PWA quality:

1. Open DevTools in Chrome
2. Go to **Lighthouse** tab
3. Select **Progressive Web App**
4. Click **Analyze page load**

Target scores:
- ✅ PWA: 100
- ✅ Performance: 90+
- ✅ Accessibility: 95+
- ✅ Best Practices: 95+

## 🎉 You're Done!

Your language learning app is now:
- 📱 Installable on any device
- 🚀 Deployed globally on Vercel's CDN
- ⚡ Lightning-fast with caching
- 🌐 Accessible offline
- 🔒 Secure with HTTPS

**Next Steps**:
1. Generate icons (if not done)
2. Deploy: `npm run deploy`
3. Test on iPhone
4. Share your Vercel URL!

---

**Questions?** Check [Vercel Documentation](https://vercel.com/docs) or [PWA Guide](https://web.dev/progressive-web-apps/)
