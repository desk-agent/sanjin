// Service Worker for 三斤 PWA
// Enables offline use and app installation

const CACHE_NAME = 'sanjin-v2'
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)

  // Skip cross-origin requests (APIs, images from other sites)
  if (url.origin !== self.location.origin) {
    return
  }

  // Network-first for navigation requests (HTML)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    )
    return
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(req, copy))
        return res
      })
    })
  )
})
