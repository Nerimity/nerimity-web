const CACHE_NAME = "nerimity-assets";

self.addEventListener("install", () => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activate");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", async (event) => {
  
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === location.origin;
  const isAssetsRequest = isSameOrigin && url.pathname.startsWith("/assets/");

  if (!isAssetsRequest) {
    return;
  }
  event.respondWith(
    (async () => {

      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response && response.ok && response.status === 200) {
        cache.put(event.request, response.clone());
      }
      return response;
    })()
  );
});
