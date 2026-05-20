const CACHE_NAME = 'rolio-v1'
const urlsToCache = [
  '/',
  '/offline.html',
]

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(() => {
        // Continue even if some files fail
      })
    })
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event

  // Skip API calls and non-GET requests
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const cache = caches.open(CACHE_NAME)
          cache.then(c => c.put(request, response.clone()))
        }
        return response
      })
      .catch(() => {
        // Fallback to cache on error
        return caches.match(request).then(cached => {
          return cached || new Response('Offline - Page not available in cache', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
      })
  )
})
