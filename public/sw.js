const CACHE = 'tech2048-v5';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./offline.html'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL))) });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE && caches.delete(k))))) });
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (_) {
        const cache = await caches.open(CACHE);
        const hit = await cache.match('./index.html');
        return hit || cache.match('./offline.html');
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (req.method === 'GET' && new URL(req.url).origin === self.location.origin) { cache.put(req, fresh.clone()) }
      return fresh;
    } catch (_) {
      if (req.headers.get('accept')?.includes('text/html')) return cache.match('./offline.html');
      throw _;
    }
  })());
});