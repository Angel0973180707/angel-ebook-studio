/* Angel Ebook Studio - Service Worker (simple) */
const CACHE = 'angel-ebook-studio-v1-3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './app/main.js',
  './app/state/store.js',
  './app/views/bookshelf.js',
  './app/views/editor.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  evt.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try{
      return await fetch(req);
    }catch(e){
      return cached || new Response('offline', { status: 200, headers: { 'Content-Type': 'text/plain' }});
    }
  })());
});
