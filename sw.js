/* v1.4 cache */
const CACHE_NAME = 'angel-ebook-cache-v1-4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './app/main.js',
  './app/views/editor.js',
  './app/state/store.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k!==CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      return res;
    }))
  );
});
