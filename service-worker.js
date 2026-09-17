const CACHE_NAME = 'gia-pha-v1';
const PRECACHE_ASSETS = [
    './index.html', 
    './css/main.css', 
    './css/theme-traditional.css', 
    './css/theme-modern.css', 
    './css/tree.css', 
    './css/components.css', 
    './js/app.js', 
    './js/data.js', 
    './js/theme.js', 
    './js/dashboard.js', 
    './js/tree.js', 
    './js/member-detail.js', 
    './js/memorial.js', 
    './js/lunar-calendar.js', 
    './js/export.js', 
    './js/pwa.js', 
    './data/data.json'
];

// Lắng nghe sự kiện install để pre-cache các tài nguyên quan trọng
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Lắng nghe sự kiện activate để dọn dẹp cache cũ
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Lắng nghe sự kiện fetch để áp dụng các chiến lược cache
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Bỏ qua các request không phải GET
    if (event.request.method !== 'GET') return;

    // Chiến lược Network-first (với cache fallback) cho index.html để luôn có phiên bản mới nhất
    if (url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Chiến lược Cache-first (với network fallback) cho CSS, JS, images, fonts, và JSON data
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request).then(networkResponse => {
                    // Cache lại response mới nếu hợp lệ
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return networkResponse;
                }).catch(error => {
                    console.error('Fetch failed:', error);
                    // Có thể trả về trang offline custom nếu cần ở đây
                });
            })
    );
});
