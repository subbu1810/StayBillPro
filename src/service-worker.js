/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'service-pro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});



// Reference self.__WB_MANIFEST to satisfy Workbox build plugin
// eslint-disable-next-line no-unused-expressions
self.__WB_MANIFEST;


