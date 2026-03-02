const CACHE = 'shiftaty-v20260301000700';
const OFFLINE_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(OFFLINE_ASSETS.map(a => c.add(a).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHTML = e.request.headers.get('accept')?.includes('text/html');
  e.respondWith(
    isHTML
      ? fetch(e.request).then(res => {
          if (res && res.status === 200) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => caches.match(e.request))
      : caches.match(e.request).then(cached => {
          const net = fetch(e.request).then(res => {
            if (res && res.status === 200) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
            return res;
          }).catch(() => cached);
          return cached || net;
        })
  );
});
