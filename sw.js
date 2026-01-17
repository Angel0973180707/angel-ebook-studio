/* Angel Ebook Studio Service Worker */
const VERSION = 'v1.1.0';
const CACHE = `aes-${VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './app/main.js',
  './app/core/constants.js',
  './app/core/store.js',
  './app/core/utils.js',
  './app/features/bookshelf/bookshelf.logic.js',
  './app/features/bookshelf/bookshelf.view.js',
  './app/features/editor/editor.logic.js',
  './app/features/editor/editor.view.js',
  './app/features/ai/ai.logic.js',
  './app/features/ai/ai.view.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k.startsWith('aes-') && k !== CACHE) ? caches.delete(k) : Promise.resolve()));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match('./index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  // Assets: cache-first, revalidate
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    const cache = await caches.open(CACHE);
    cache.put(req, res.clone());
    return res;
  })());
});
