const CACHE_NAME = 'mqtt-monitor-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/mqtt@5.3.5/dist/mqtt.min.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})))
          .catch(err => {
            console.log('Error al cachear algunos recursos:', err);
            // Cachear al menos los recursos locales críticos
            return cache.addAll([
              './',
              './index.html',
              './styles.css',
              './app.js'
            ]);
          });
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepción de peticiones
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retornar del cache si existe
        if (response) {
          return response;
        }

        // Clonar la petición
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Verificar si la respuesta es válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar la respuesta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});
