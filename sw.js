// Q-Notes service worker: red primero (siempre la versión más nueva) y caché como respaldo sin conexión
const C = 'qn-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'favicon.svg', 'favicon.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || !u.protocol.startsWith('http') || u.hostname.endsWith('supabase.co')) return;
  const cross = u.origin !== location.origin;
  if (cross) { // librerías de CDN: caché primero (cargan al instante y funcionan sin internet)
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(x => { const c = x.clone(); caches.open(C).then(k => k.put(r, c)).catch(() => {}); return x; })));
    return;
  }
  e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(C).then(k => k.put(r, c)).catch(() => {}); return x; })
    .catch(() => caches.match(r).then(m => m || caches.match('./') || caches.match('index.html'))));
});
