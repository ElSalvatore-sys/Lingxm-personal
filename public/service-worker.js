// LingXM Personal - Service Worker
// Aggressive cache-busting strategy:
// - HTML: Network-first with immediate version check
// - Assets: Cache-first with versioning
// - Version mismatch: Unregister SW and clear all caches

const CACHE_NAME = 'lingxm-v21';  // Phase 4: Multilingual sentences added (Arabic, French, Italian)

const urlsToCache = [
  '/',
  '/index.html',
  '/src/app.js',
  '/src/config.js',
  '/src/styles/main.css',
  '/src/utils/analytics.js',
  '/src/utils/achievements.js',
  '/src/utils/progress.js',
  '/src/utils/speech.js',
  '/src/utils/database.js',
  '/src/utils/sentenceManager.js',
  '/src/utils/version-check.js',
  '/manifest.json',
  '/logo.svg',
  '/sql-wasm.wasm'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event - network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER cache HTML or version.json - always fetch fresh
  if (event.request.mode === 'navigate' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname === '/version.json' ||
      url.pathname.includes('version.json')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    );
    return;
  }

  // Cache-first strategy for all other assets (CSS, JS, images, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return a fallback response if needed
        return new Response('Service unavailable', { status: 503 });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim clients immediately
  return self.clients.claim();
});

// Message handler for manual cache clearing (called from app)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message');
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    console.log('[Service Worker] Received CLEAR_CACHES message');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
  }
});
