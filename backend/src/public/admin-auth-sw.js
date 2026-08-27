let adminToken = null;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  if (event.data?.type === 'set-admin-token') adminToken = event.data.token || null;
  if (event.data?.type === 'clear-admin-token') adminToken = null;
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isProtectedAdminRequest = url.origin === self.location.origin
    && url.pathname.startsWith('/admin/')
    && !['/admin/login', '/admin/logout'].includes(url.pathname);
  if (!isProtectedAdminRequest || !adminToken) return;

  const headers = new Headers(event.request.headers);
  headers.set('Authorization', `Bearer ${adminToken}`);
  event.respondWith(fetch(new Request(event.request, { headers })));
});
