const CACHE_NAME = 'jump-moniteur-v1';

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll([
            '/moniteur/',
            '/moniteur/app.css',
            '/moniteur/app.js',
            '/assets/logo.png'
        ]))
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
