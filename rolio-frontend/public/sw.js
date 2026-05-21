// Service Worker for ROLIO PWA
const CACHE_VERSION = 'rolio-v1'
const CACHE_NAME = `${CACHE_VERSION}-cache`

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-dark-32x32.png',
  '/icon-light-32x32.png',
  '/apple-icon.png'
]

// Install event - cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // If some assets fail to cache, continue anyway
        return Promise.resolve()
      })
    }).then(() => {
      self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      self.clients.claim()
    })
  )
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only cache GET requests
  if (request.method !== 'GET') {
    return
  }

  // Don't cache API calls - always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html').catch(() => {
          return new Response('Offline - API not available', { status: 503 })
        })
      })
    )
    return
  }

  // Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Don't cache redirects or errors
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clone the response
        const responseClone = response.clone()

        // Cache successful responses
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone)
        })

        return response
      })
      .catch(() => {
        // Return cached version if network fails
        return caches.match(request).then(response => {
          return response || new Response('Offline', { status: 503 })
        })
      })
  )
})

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
