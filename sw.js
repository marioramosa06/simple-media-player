const cacheName = "static";
const assets = [
    "/",
    "/index.html",
    "/manifest.json",
    "/css/style.css",
    "/images/icons/icon-72x72.png",
    "/images/icons/icon-96x96.png",
    "/images/icons/icon-128x128.png",
    "/images/icons/icon-144x144.png",
    "/images/icons/icon-152x152.png",
    "/images/icons/icon-192x192.png",
    "/images/icons/icon-384x384.png",
    "/images/icons/icon-512x512.png",
    "/images/next.svg",
    "/images/open.svg",
    "/images/pause.svg",
    "/images/play.svg",
    "/images/prev.svg",
    "/images/list.svg",
    "/images/volume.svg",
    "/images/volume-mute.svg",
    "/js/app.js",
    "/js/functions.js",
    "/js/variables.js",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            cache.addAll(assets);
        })
    );
});

self.addEventListener("activate", function (event) {
    console.log(event);
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});