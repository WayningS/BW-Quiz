const CACHE_NAME = "bw-quiz-scoreboard-test-v6";
const NETWORK_TIMEOUT_MS = 3000;
const APP_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./fragen.json",
  "./manifest.webmanifest",
  "./icon.svg"
];

const QUESTION_CACHE_URL = new URL("./fragen.json", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("bw-quiz-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith("/fragen.json")) {
    event.respondWith(networkFirst(request, QUESTION_CACHE_URL));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, new URL("./index.html", self.registration.scope).href));
    return;
  }

  event.respondWith(networkFirst(request, request));
});

async function networkFirst(request, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  const networkResponse = fetch(request).then(async (response) => {
    if (response && response.ok) {
      await cache.put(cacheKey, response.clone());
    }

    return response;
  });

  networkResponse.catch(() => {});
  const timeout = timeoutAfter(NETWORK_TIMEOUT_MS);

  try {
    return await Promise.race([networkResponse, timeout.promise]);
  } catch (error) {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) return cachedResponse;

    if (cacheKey !== request) {
      const requestCache = await cache.match(request);
      if (requestCache) return requestCache;
    }

    return networkResponse;
  } finally {
    timeout.cancel();
  }
}

function timeoutAfter(milliseconds) {
  let timeoutId;

  return {
    promise: new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => reject(new Error("network-timeout")), milliseconds);
    }),
    cancel() {
      clearTimeout(timeoutId);
    }
  };
}
