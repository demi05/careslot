// CareSlot service worker. Deliberately conservative: only ever caches
// public, non-authenticated pages (landing, login, register, forgot
// password, offline) plus static assets (JS/CSS/images/fonts). Dashboard,
// appointments, and every other signed-in page are NEVER cached — this
// runs on shared/low-end devices in the exact low-connectivity settings
// this project targets, and caching another patient's dashboard HTML
// would leak it to the next person who opens the app on that device.

const CACHE_NAME = "careslot-cache-v1";
const OFFLINE_URL = "/offline";
const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_PATHS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request, url));
    return;
  }

  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(handleAsset(request));
  }
});

async function handleNavigate(request, url) {
  const isPublic = PUBLIC_PATHS.includes(url.pathname);

  try {
    const response = await fetch(request);
    if (isPublic) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (isPublic) {
      const cached = await caches.match(request);
      if (cached) return cached;
    }
    const offline = await caches.match(OFFLINE_URL);
    return offline || Response.error();
  }
}

async function handleAsset(request) {
  const cached = await caches.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    })
    .catch(() => cached);
  return cached || networkFetch;
}
