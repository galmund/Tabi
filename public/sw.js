const VERSION = "tabi-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const ROUTES = ["/", "/days", "/bookings", "/ideas", "/todos", "/settings"];
const PRECACHE = [
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/icon.svg",
  "/offline.html",
];
const RESAVE_AFTER_MS = 20_000;

let lastSaved = 0;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function cacheFirst(request) {
  return caches.match(request).then(
    (hit) =>
      hit ||
      fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
  );
}

async function savePage(path, response) {
  const cache = await caches.open(PAGE_CACHE);
  await cache.put(path, response);
}

async function saveAssetsOf(html) {
  const cache = await caches.open(STATIC_CACHE);
  const assets = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? []);
  await Promise.all(
    [...assets].map(async (asset) => {
      if (await cache.match(asset)) return;
      const response = await fetch(asset);
      if (response.ok) await cache.put(asset, response);
    })
  );
}

async function saveForOffline() {
  if (Date.now() - lastSaved < RESAVE_AFTER_MS) return;
  lastSaved = Date.now();
  await Promise.all(
    ROUTES.map(async (path) => {
      try {
        const response = await fetch(path, { credentials: "same-origin", cache: "no-store" });
        if (!response.ok || response.redirected) return;
        const html = await response.clone().text();
        await savePage(path, response);
        await saveAssetsOf(html);
      } catch {
        lastSaved = 0;
      }
    })
  );
}

self.addEventListener("message", (event) => {
  if (event.data === "save-for-offline") event.waitUntil(saveForOffline());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || PRECACHE.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.search === "" && ROUTES.includes(url.pathname)) {
            const copy = response.clone();
            savePage(url.pathname, copy);
          }
          return response;
        })
        .catch(async () => {
          const pages = await caches.open(PAGE_CACHE);
          return (await pages.match(url.pathname)) ?? (await caches.match("/offline.html"));
        })
    );
  }
});
