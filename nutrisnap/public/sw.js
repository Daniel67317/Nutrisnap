/* Service worker de NutriSnap.

   Escrito a mano en vez de usar vite-plugin-pwa: la app no necesita
   precachear un manifiesto de build, sólo sobrevivir a una conexión mala.
   Menos dependencias, menos que se rompa.

   Estrategia:
   - Navegación (HTML): red primero, caché de reserva. Así una versión nueva
     se ve al instante, pero sin señal la app sigue abriendo.
   - Assets (JS/CSS/imágenes): caché primero. Vite les pone hash en el
     nombre, así que un archivo cacheado nunca queda obsoleto.
   - Peticiones a otros dominios y todo lo que no sea GET: sin tocar.
*/

const CACHE = 'nutrisnap-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
