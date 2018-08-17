const cacheName = 'res-v1';

// Static asset to cache
const filesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/js/main.js',
    '/js/dbhelper.js',
    '/js/restaurant_info.js',
    '/js/sw-registration.js',
    '/css/styles.css',
    '/img/1-800_2x.jpg',
    '/img/2-800_2x.jpg',
    '/img/3-800_2x.jpg',
    '/img/4-800_2x.jpg',
    '/img/5-800_2x.jpg',
    '/img/6-800_2x.jpg',
    '/img/7-800_2x.jpg',
    '/img/8-800_2x.jpg',
    '/img/9-800_2x.jpg',
    '/img/10-800_2x.jpg',
];

/**
 * When SW is installed : cache all files
 */
self.addEventListener('install', (e) => {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(cacheName).then( (cache) => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(filesToCache);
        }).catch(error => {
            console.log('Caches open failed: ' + error);
        })
    );
});

/**
 * When SW activated : Delete old caches
 */
self.addEventListener('activate', (e) => {
    // console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then( (keyList) => {
            return Promise.all(keyList.map( (key) => {
                if ( key !== cacheName && !key.startsWith('res-')) {
                    // console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    // For taking control immediately on the first load
    return self.clients.claim();
});

/**
 * Intercept all requests ans response with cache correspondence url data
 * Fetch from Net and save the result in cache to serve it after
 * Response to special request with optimise response
 */
self.addEventListener('fetch', (e) => {
    let request = e.request;
    let requestUrl = new URL(request.url);
    
    const customResponse = '/restaurant.html';
    if (requestUrl.pathname.startsWith(customResponse))
        request = customResponse;

    // console.log('fetch', request);    

    e.respondWith(
        caches.match(request).then( (response) => {
            // console.log('Response from cache', response);
            if (response) return response;
            return fetch(request).then((response) => {
                return caches.open(cacheName).then((cache) => {
                    // console.log('Add to cache & return response from NET');
                    cache.put(request.url, response.clone());
                    return response;
                })
            }).catch(error => {
                // console.log('fallback', request.url);
                if (request.url.indexOf('/img/') >= 0)
                    return caches.match(`${request.url.substring(0, request.url.indexOf('-'))}-800_2x.jpg`);
            });
        })
    );
});

// listen for the "message" event, and call
// skipWaiting if you get the appropriate message
self.addEventListener('message', (event) => {
    if (event.data.action == 'skipWaiting') {
        this.self.skipWaiting();
    }
});