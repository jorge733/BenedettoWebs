// Service worker del panel: permite instalarlo como app y abrirlo sin conexión.
// Siempre intenta la red primero (así cada push a main se ve al tiro) y usa la copia guardada solo si no hay internet.
// Los datos (Firebase) y /api/ nunca se guardan aquí.
const CACHE = "panel-v1";
const BASE = [
  "/panel/", "/panel/agenda.html", "/panel/demos.html", "/panel/resumen.html", "/panel/cliente.html",
  "/panel/panel.css", "/panel/firebase.js", "/panel/menu.js", "/panel/pwa.js",
  "/documentos/doc.css", "/img/logo/logo-fondo-claro.svg", "/favicon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
      }
      return res;
    } catch (err) {
      const guardada = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
      if (guardada) return guardada;
      if (req.mode === "navigate") return (await caches.match("/panel/")) || Response.error();
      throw err;
    }
  })());
});
