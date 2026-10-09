// ShopLI Admin PWA Service Worker (Production-Ready)
const CACHE_NAME = "shopli-admin-v4";
const NAVIGATION_TIMEOUT_MS = 6000;

const PRECACHE_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-48x48.png",
  "/icons/icon-192x192.png",
  "/icons/icon-256x256.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/shopli_snbg.svg",
  "/offline.html",
];

// Helper con timeout para evitar cuelgues indefinidos en WebKit / iOS
function fetchWithTimeout(request, timeoutMs = NAVIGATION_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(request, { signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

// 1. Instalación: Cachear assets estáticos iniciales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activación: Limpieza de cachés antiguas y tomar control inmediato
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Estrategia de Fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Regla de seguridad y finanzas: Las llamadas de API, webhooks y auth NUNCA se cachean
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    request.method !== "GET"
  ) {
    return;
  }

  // A) Cache First para Chunks estáticos de Next.js, fuentes e imágenes
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/splash/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // B) Network First con Timeout para navegación (HTML del App Shell)
  // Intenta la red para mantener datos frescos, pero si excede el timeout, está offline o falla, sirve desde caché
  if (request.mode === "navigate") {
    event.respondWith(
      fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS)
        .then((networkResponse) => {
          // Solo cachear si es 200 y no fue redirigida (ej. no guardar HTML de /login bajo /dashboard)
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            !networkResponse.redirected
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // 1. Intentar servir la ruta exacta desde la caché si ya fue visitada
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // 2. Si no existe, intentar servir la página de inicio del dashboard
          const dashboardResponse = await caches.match("/dashboard/inicio");
          if (dashboardResponse) {
            return dashboardResponse;
          }
          // 3. Fallback controlado: servir la pantalla offline amigable
          const offlineFallback = await caches.match("/offline.html");
          if (offlineFallback) {
            return offlineFallback;
          }
          return new Response("Sin conexión", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        })
    );
  }
});
