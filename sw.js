// Service worker for the installed (home-screen) reader. Built by tools/build_site.py.
// Page: network first, so a new chapter shows up the moment you're online; the cached copy
// is the offline fallback. Images, icons and fonts: cache first, they never change in place.
const VERSION = 'bbc43bee9266';
const CACHE = 'sal-' + VERSION;
const CORE = ['./', 'cover.webp', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('sal-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)) }
      return res;
    }).catch(() => caches.match('./')));
    return;
  }

  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) }
    return res;
  })));
});
