/* ─────────────────────────────────────────
   Net Worth Dashboard — Service Worker
   Caches all app files for offline use
───────────────────────────────────────── */

const CACHE_NAME = 'net-worth-v6';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './NetWorthIcon.svg',
  './manifest.json'
];

/* ── INSTALL: cache all files ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/* ── ACTIVATE: clean up old caches ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/* ── FETCH: serve from cache, fall back to network ── */
self.addEventListener('fetch', function(event) {
  /* Always go to network for live FX/gold API calls */
  if (
    event.request.url.includes('frankfurter.app') ||
    event.request.url.includes('metals.live') ||
    event.request.url.includes('coinbase.com') ||
    event.request.url.includes('fonts.googleapis.com') ||
    event.request.url.includes('cdnjs.cloudflare.com')
  ) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  /* App shell: cache first, network fallback */
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(event.request).then(function(networkResponse) {
        /* Cache any new files we fetched */
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
