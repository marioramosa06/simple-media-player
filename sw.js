const cacheName = "static-v5";
const assets = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./css/remixicon.css",
  "./css/remixicon.woff2",
  "./css/remixicon.woff2?t=1729600608771",
  "./images/icons/icon-72x72.png",
  "./images/icons/icon-96x96.png",
  "./images/icons/icon-128x128.png",
  "./images/icons/icon-144x144.png",
  "./images/icons/icon-152x152.png",
  "./images/icons/icon-192x192.png",
  "./images/icons/icon-384x384.png",
  "./images/icons/icon-512x512.png",
  "./js/app.js",
  "./js/functions.js",
  "./js/variables.js",
  "./js/settings-utils.js",
  "./js/player-utils.js",
  "./js/volume-utils.js",
  "./js/visualizer-utils.js",
  "./js/visualizer.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(assets))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== cacheName)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches
            .open(cacheName)
            .then((cache) => cache.put(event.request, responseClone))
            .catch(() => {});
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
