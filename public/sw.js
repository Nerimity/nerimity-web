const CACHE_NAME = "nerimity-assets";

self.addEventListener("install", () => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activate");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === location.origin;
  const isAssetsRequest = isSameOrigin && url.pathname.startsWith("/assets/");

  const cacheFirst = async (request, shouldWrite) => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) console.log(`Cache hit for ${request.url}`);
    if (cached) return cached;

    const response = await fetch(request);
    if (shouldWrite && response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  };

  event.respondWith(cacheFirst(event.request, isAssetsRequest));
});
