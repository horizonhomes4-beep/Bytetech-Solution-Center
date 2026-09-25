// Bump this on every release. `activate` deletes caches that do not match, so a
// new version is what forces clients off the old cache-first copies of
// styles.css / app.js and onto the freshly deployed ones.
const VERSION='v16';
const SHELL_CACHE=`mathcloud-jamb-${VERSION}-shell`;
const RUNTIME_CACHE=`mathcloud-jamb-${VERSION}-runtime`;
const CACHES=[SHELL_CACHE,RUNTIME_CACHE];
// The full app shell: every student page plus every shared asset it depends on.
// Precaching all of these means the app (not just the offline notice) still opens
// with no connection, right down to a student's dashboard and stored progress views.
const SHELL=[
  './student/index.html','./student/register.html','./student/dashboard.html',
  './student/topics.html','./student/lesson.html','./student/practice.html',
  './student/mock.html','./student/results.html','./student/official-resources.html',
  './shared/styles.css','./shared/app.js','./shared/app-config.js',
  './shared/firebase-config.js','./shared/mathjax-renderer.js','./shared/calculator.js',
  './assets/logo.png','./offline.html'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(SHELL_CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>!CACHES.includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});

function isStaticAsset(url){
  return /\.(css|js|png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf)$/i.test(url.pathname);
}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return;

  // Navigations (opening a page/link): try the network first for the freshest shell,
  // fall back to the cached page, then to the offline screen. This keeps every cached
  // student page — not just the dashboard — reachable with no connection.
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request).then(r=>{
        const copy=r.clone();caches.open(SHELL_CACHE).then(c=>c.put(e.request,copy));
        return r;
      }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./offline.html')))
    );
    return;
  }

  // Static assets (CSS/JS/images): cache-first for instant, reliable offline loading,
  // refreshing the cache in the background whenever the network is available.
  if(isStaticAsset(url)){
    e.respondWith(
      caches.match(e.request).then(cached=>{
        const network=fetch(e.request).then(r=>{
          const copy=r.clone();caches.open(SHELL_CACHE).then(c=>c.put(e.request,copy));
          return r;
        }).catch(()=>cached);
        return cached||network;
      })
    );
    return;
  }

  // Everything else same-origin: network-first with a cache fallback.
  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request))
  );
});
