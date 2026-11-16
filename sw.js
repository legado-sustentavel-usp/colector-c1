/**
 * Service Worker para Colector Campo C1 — FAPESP 2026/26432-4
 *
 * Estrategia: Cache-first (offline-first).
 * El colector es un archivo unico, asi que solo cacheamos el HTML y el manifest.
 * Cuando haya red, actualiza el cache en background (stale-while-revalidate).
 */
const CACHE_NAME = "colector-c1-v3";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./jsQR.min.js",
  "./icon-192.png",
  "./icon-512.png"
];

// Install: pre-cachear assets criticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first con actualizacion en background
self.addEventListener("fetch", (event) => {
  // Solo interceptar GET requests del mismo origen
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Si esta en cache, devolver inmediatamente y actualizar en background
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // Si falla la red, ya tenemos el cached

      return cached || fetchPromise;
    })
  );
});
