// Service worker for the installed (home-screen) reader. Built by tools/build_site.py.
// Page: network first, so a new chapter shows up the moment you're online; the cached copy
// is the offline fallback. Images, icons and fonts: cache first, they never change in place.
const VERSION = 'bac28afaab43';
const CACHE = 'sal-' + VERSION;
// Images get their own cache, versioned by their bytes, so a text-only rebuild doesn't re-download them.
const IMG_CACHE = 'sal-img-913355b66007';
const CORE = ['./', 'cover.webp', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
// Every chapter illustration and thumbnail (~8 MB). Only fetched once the reader is installed
// (the page asks via postMessage), so a one-off visitor in a browser tab doesn't pay for it.
const IMAGES = ["img/ch-01.webp", "img/ch-02.webp", "img/ch-03.webp", "img/ch-04.webp", "img/ch-05.webp", "img/ch-06.webp", "img/ch-07.webp", "img/ch-08.webp", "img/ch-09.webp", "img/ch-10.webp", "img/ch-11.webp", "img/ch-12.webp", "img/ch-13.webp", "img/ch-14.webp", "img/ch-15.webp", "img/ch-16.webp", "img/ch-17.webp", "img/ch-18.webp", "img/ch-19.webp", "img/ch-20.webp", "img/ch-21.webp", "img/ch-22.webp", "img/ch-23.webp", "img/ch-24.webp", "img/ch-25.webp", "img/ch-26.webp", "img/ch-27.webp", "img/ch-28.webp", "img/ch-29.webp", "img/ch-30.webp", "img/ch-31.webp", "img/ch-32.webp", "img/ch-33.webp", "img/ch-34.webp", "img/ch-35.webp", "img/th-01.webp", "img/th-02.webp", "img/th-03.webp", "img/th-04.webp", "img/th-05.webp", "img/th-06.webp", "img/th-07.webp", "img/th-08.webp", "img/th-09.webp", "img/th-10.webp", "img/th-11.webp", "img/th-12.webp", "img/th-13.webp", "img/th-14.webp", "img/th-15.webp", "img/th-16.webp", "img/th-17.webp", "img/th-18.webp", "img/th-19.webp", "img/th-20.webp", "img/th-21.webp", "img/th-22.webp", "img/th-23.webp", "img/th-24.webp", "img/th-25.webp", "img/th-26.webp", "img/th-27.webp", "img/th-28.webp", "img/th-29.webp", "img/th-30.webp", "img/th-31.webp", "img/th-32.webp", "img/th-33.webp", "img/th-34.webp", "img/th-35.webp"];

async function cacheImages() {
  const c = await caches.open(IMG_CACHE);
  // One at a time, skipping what's already there; a failed image is retried on the next launch.
  for (const src of IMAGES) {
    if (await c.match(src)) continue;
    try { const res = await fetch(src); if (res.ok) await c.put(src, res) } catch (e) { return }
  }
}

self.addEventListener('message', e => {
  if (e.data === 'cache-images') e.waitUntil(cacheImages());
});

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('sal-') && k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k))))
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
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(url.pathname.includes('/img/') ? IMG_CACHE : CACHE).then(c => c.put(req, copy)) }
    return res;
  })));
});
