const C='qn-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.hostname.endsWith('supabase.co')||!u.protocol.startsWith('http'))return;
e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(C).then(k=>k.put(r,c)).catch(()=>{});return x}).catch(()=>caches.match(r).then(m=>m||caches.match('./'))))});
