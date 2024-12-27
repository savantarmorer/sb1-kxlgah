const CACHE_NAME = 'cepac-play-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/gavel.svg',
  '/apple-touch-icon.png'
];

// Install event - cache initial resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache what we can, ignore failures
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => 
              console.warn(`Failed to cache ${url}:`, err)
            )
          )
        );
      })
  );
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
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Ignore module requests and Vite dev server requests
  if (event.request.url.includes('/@vite') || 
      event.request.url.includes('node_modules') ||
      event.request.url.includes('src/') ||
      event.request.url.includes('localhost:5173')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
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