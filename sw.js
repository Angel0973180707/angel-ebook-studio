self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// 開發期間：不攔截 fetch
self.addEventListener('fetch', () => {});