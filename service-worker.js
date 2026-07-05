const CACHE_NAME = 'sisrural-v84-consolidacao';
const APP_SHELL=['./','./index.html','./offline.html','./manifest.webmanifest','./config.firebase.js','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL).catch(()=>{})));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(resp=>{const copy=resp.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});return resp;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./offline.html'))));});
