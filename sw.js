// Q-Notes service worker: la app arranca sin internet (Local-First)
const V='qn-shell-v5';
const SHELL=['./','index.html','manifest.webmanifest','favicon.svg','favicon.png','icon-192.png','icon-512.png','apple-touch-icon.png'];
const LIBS=[
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.2.4/dexie.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(V);
    // Cada archivo por separado: si uno falla, los demás se guardan igual
    await Promise.all([...SHELL,...LIBS].map(u=>c.add(u).catch(()=>{})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())if(k!==V)await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(u.hostname.endsWith('supabase.co'))return; // la API nunca se cachea
  const cdn=u.hostname==='cdn.jsdelivr.net'||u.hostname==='cdnjs.cloudflare.com';
  if(cdn){ // librerías con versión fija: primero caché
    e.respondWith(caches.match(r).then(h=>h||fetch(r).then(n=>{const cp=n.clone();caches.open(V).then(c=>c.put(r,cp));return n})));
    return;
  }
  if(u.origin===location.origin){ // la app: primero red (recibe actualizaciones), si no hay señal usa la copia guardada
    e.respondWith(fetch(r).then(n=>{if(n.ok){const cp=n.clone();caches.open(V).then(c=>c.put(r,cp))}return n})
      .catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||(r.mode==='navigate'?caches.match('index.html'):Response.error()))));
  }
});
