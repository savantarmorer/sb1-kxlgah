const CACHE_NAME = 'cepac-play-v1';

// Only cache static assets
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/gavel.svg',
  '/apple-touch-icon.png',
  '/assets/',
  '/avatars/',
  '/images/'
];

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
  // Activate worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control immediately
  event.waitUntil(clients.claim());
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip development-related requests
  const url = new URL(event.request.url);
  if (
    url.hostname === 'localhost' ||
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('ws')
  ) {
    return;
  }

  // Handle static asset requests
  const isStaticAsset = urlsToCache.some(path => 
    url.pathname.startsWith(path) || url.pathname === path
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }

          return fetch(event.request.clone()).then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
        })
    );
  }
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