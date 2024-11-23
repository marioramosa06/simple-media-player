const cacheName = 'static'
const assets = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/images/logo72.jpg',
    '/images/logo96.jpg',
    '/images/logo128.jpg',
    '/images/logo144.jpg',
    '/images/logo152.jpg',
    '/images/logo192.jpg',
    '/images/logo384.jpg',
    '/images/logo512.jpg',
    '/images/next.svg',
    '/images/open.svg',
    '/images/pause.svg',
    '/images/play.svg',
    '/images/prev.svg',
    '/images/list.svg',
    '/images/volume.svg',
    '/images/volume-mute.svg',
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

self.addEventListener('activate', function(event) {
    console.log(event);
    
})

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
