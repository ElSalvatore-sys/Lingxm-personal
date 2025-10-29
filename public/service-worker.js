// LingXM Personal - Service Worker
// Enables offline support and fast loading through caching

const CACHE_NAME = 'lingxm-v5';  // Network-first strategy for HTML
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

  // Network-first strategy for HTML files (always get fresh HTML)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we got a valid response, cache it and return
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Network failed, fall back to cache
          return caches.match(event.request);
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
