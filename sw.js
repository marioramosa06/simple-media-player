self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('my-cache')
            .then(cache => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/manifest.json',
                    '/css/style.css',
                    '/css/fonts/remixicon.css',
                    '//css/fonts/remixicon.woff',
                    '/css/fonts/remixicon.woff2',
                    '/images/logo192.jpg',
                    '/images/logo512.jpg',
                    '/js/script.js'
                    // ... autres fichiers
                ]);
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
