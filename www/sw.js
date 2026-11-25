/* FOOTBALL RIVALS: versioned static assets only; rooms and accounts stay live. */
const CACHE='football-rivals-pwa-fr142-bundled';
const OFFLINE='/offline.html',MAX_ENTRIES=160;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([OFFLINE,'/assets/pwa/icon-192.png'])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('football-rivals-pwa-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));
});
async function asset(req){
 const cache=await caches.open(CACHE),hit=await cache.match(req);if(hit)return hit;
 const result=await fetch(req);
 if(result.ok&&result.type!=='opaque'){
  try{await cache.put(req,result.clone());const keys=await cache.keys();if(keys.length>MAX_ENTRIES)await cache.delete(keys.find(x=>!new URL(x.url).pathname.endsWith('/offline.html'))||keys[0])}catch{}
 }
 return result;
}
async function freshCode(req){
 let cache=null;try{cache=await caches.open(CACHE)}catch{}
 try{const response=await fetch(req,{cache:'no-cache'});if(cache&&response.ok&&response.type!=='opaque')try{await cache.put(req,response.clone());const keys=await cache.keys();if(keys.length>MAX_ENTRIES)await cache.delete(keys.find(x=>!new URL(x.url).pathname.endsWith('/offline.html'))||keys[0])}catch{}return response}
 catch(error){const cached=cache&&await cache.match(req);if(cached)return cached;throw error}
}
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).catch(async()=>await caches.match(OFFLINE)||new Response('Internet connection is required.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})));
  return;
 }
 if(/\.(js|css)$/i.test(url.pathname)){event.respondWith(freshCode(req));return;}
 if(url.searchParams.get('frb')==='football-rivals-arena-bundled1124-bibo21_vercel_app'&&/\.(webp|avif)$/i.test(url.pathname))event.respondWith(asset(req));
});

