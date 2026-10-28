// Wealthly service worker.
// Caches only the static app shell (HTML, JS, CSS, fonts, icons) so the app
// installs and opens offline. API responses carry personal financial data and
// are never cached: /api/* always goes straight to the network.
const VERSION = "v1";
const SHELL_CACHE = `wealthly-shell-${VERSION}`;
const SHELL_URLS = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("wealthly-") && k !== SHELL_CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Never touch API, auth, or websocket traffic.
  if (sameOrigin && (url.pathname.startsWith("/api") || url.pathname.startsWith("/ws"))) return;

  // Page navigations: network first, fall back to the cached shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // Hashed build assets, fonts and icons: cache first, then network.
  const cacheable =
    (sameOrigin && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/"))) ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com";
  if (!cacheable) return;

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok || res.type === "opaque") {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
