const CACHE = 'shiftaty-v20260305';
const OFFLINE_ASSETS = [
  '/shiftat/',
  '/shiftat/index.html',
  '/shiftat/manifest.json',
  '/shiftat/icon-192.png',
  '/shiftat/icon-512.png'
];

// ── Install: cache everything ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(OFFLINE_ASSETS.map(a => c.add(a).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for HTML (standalone launch) ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isHTML = e.request.headers.get('accept')?.includes('text/html');
  const isNavigation = e.request.mode === 'navigate';

  // HTML / navigation — cache first للفتح السريع المستقل
  if (isHTML || isNavigation) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        // رجّع الـ cache فوراً وحدّث في الخلفية
        const fetchPromise = fetch(e.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // باقي الأصول — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
