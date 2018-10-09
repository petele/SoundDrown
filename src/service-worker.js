self.addEventListener('install', (event) => {
  // eslint-disable-next-line no-console
  console.info('service-worker', 'install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // eslint-disable-next-line no-console
  console.info('service-worker', 'activate');
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request));
});
