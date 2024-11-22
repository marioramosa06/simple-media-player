const cacheName = 'static'
const assets = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/images/logo192.jpg',
    '/images/logo512.jpg',
    '/images/next.svg',
    '/images/open.svg',
    '/images/pause.svg',
    '/images/play.svg',
    '/images/prev.svg',
    '/js/script.js'
]
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName)
            .then(cache => {
                cache.addAll(assets);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
