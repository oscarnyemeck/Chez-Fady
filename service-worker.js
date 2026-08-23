// Service worker — Chez Fady Cosmétique
// Met en cache la coquille de l'application pour un fonctionnement hors-ligne
// une fois la première visite effectuée. Toutes les données restent en
// localStorage dans la page elle-même ; ce fichier ne gère que les fichiers
// statiques (HTML, manifest, icônes).

const CACHE_NAME = "chezfady-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stratégie "stale-while-revalidate" : sert le cache immédiatement pour un
// chargement instantané, tout en récupérant la version réseau en arrière-plan
// pour la prochaine visite.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
