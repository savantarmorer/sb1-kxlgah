const CACHE_NAME = 'cepac-play-v4';
const RUNTIME_CACHE = 'runtime-cache';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/gavel.svg',
  '/apple-touch-icon.png'
];

// Skip waiting and claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Install event - cache initial resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => 
              console.warn(`Failed to cache ${url}:`, err)
            )
          )
        );
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - network first strategy for all requests
self.addEventListener('fetch', event => {
  // Network first strategy for all requests
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Don't cache non-GET requests
        if (event.request.method !== 'GET') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the successful response
        caches.open(RUNTIME_CACHE)
          .then(cache => {
            cache.put(event.request, responseToCache);
          })
          .catch(err => {
            console.warn('Cache put error:', err);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // If no cache match, return a 504 error
            return new Response('Network error', {
              status: 504,
              statusText: 'Network error',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/gavel.svg',
    badge: '/gavel.svg'
  };

  event.waitUntil(
    self.registration.showNotification('CepaC Play', options)
  );
}); 