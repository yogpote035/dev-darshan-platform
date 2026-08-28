let adminToken = null;
const DB_NAME = 'dev-darshan-admin-auth';
const STORE_NAME = 'tokens';
const TOKEN_KEY = 'admin-token';

const openDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const persistToken = async (token) => {
  adminToken = token || null;
  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(adminToken, TOKEN_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
};

const loadToken = async () => {
  if (adminToken) return adminToken;
  const database = await openDatabase();
  const token = await new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(TOKEN_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  adminToken = token;
  return token;
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  if (event.data?.type === 'set-admin-token') {
    event.waitUntil(persistToken(event.data.token).then(() => event.ports[0]?.postMessage({ success: true })));
  }
  if (event.data?.type === 'clear-admin-token') {
    event.waitUntil(persistToken(null).then(() => event.ports[0]?.postMessage({ success: true })));
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isProtectedAdminRequest = url.origin === self.location.origin
    && url.pathname.startsWith('/admin/')
    && !['/admin/login', '/admin/logout'].includes(url.pathname);
  if (!isProtectedAdminRequest) return;
  event.respondWith((async () => {
    const token = await loadToken();
    if (!token) return fetch(event.request);
    const headers = new Headers(event.request.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(new Request(event.request, { headers }));
  })());
});
