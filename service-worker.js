// Service worker — Chez Fady Cosmétique
// Met en cache la coquille de l'application pour un fonctionnement hors-ligne
// une fois la première visite effectuée. Toutes les données restent en
// localStorage / Firebase ; ce fichier ne gère que les fichiers statiques
// (HTML, manifest, icônes).
//
// IMPORTANT : à chaque mise à jour de l'application, incrémenter CACHE_NAME
// (v2, v3...) pour forcer tous les appareils à récupérer la dernière version.

const CACHE_NAME = "chezfady-cache-v2";
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

// Stratégie "réseau d'abord" pour la page principale (index.html) : si une
// connexion est disponible, on va TOUJOURS chercher la dernière version en
// ligne (essentiel pour que la synchronisation et les mises à jour de code
// fonctionnent immédiatement). Le cache ne sert de secours qu'en l'absence
// totale de réseau.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isAppShellDoc = event.request.mode === "navigate" || event.request.url.endsWith("/index.html") || event.request.url.endsWith("/");

  if (isAppShellDoc) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Pour le reste (icônes, manifest) : cache d'abord, réseau en secours.
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

