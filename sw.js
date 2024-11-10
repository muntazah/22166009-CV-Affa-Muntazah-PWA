const CACHE_NAME = "feedback-cache-v2";
const urlsToCache = [
    '/',
    '/index.html',
    // Tambahkan URL lain yang perlu dicache di sini
];

self.addEventListener('install', (event) => {
    console.log('Installing new Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('Caching files');
                // Melakukan caching setiap URL satu per satu
                for (const url of urlsToCache) {
                    try {
                        await cache.add(url);
                        console.log(`Cached: ${url}`);
                    } catch (error) {
                        console.error(`Failed to cache ${url}:`, error);
                    }
                }
            })
            .catch((error) => console.error('Caching process encountered an error:', error))
    );
});

self.addEventListener('activate', (event) => {
    console.log('Activating new Service Worker...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log(`Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).catch((error) => console.error('Activation failed:', error))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Kembalikan cache jika ditemukan, jika tidak ambil dari jaringan
                return response || fetch(event.request);
            })
            .catch((error) => console.error('Fetching failed:', error))
    );
});
