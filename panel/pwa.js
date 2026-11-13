// Panel como app instalable: registra el service worker y ofrece el botón "Instalar app"
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("/panel/sw.js", { scope: "/panel/" }).catch(() => {});
}

export const esApp = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
if (esApp) document.documentElement.classList.add("es-app");

// Chrome y Edge avisan cuando se puede instalar; Safari no (ahí se instala con Compartir → Agregar a inicio)
let aviso = null;
const botones = new Set();
const pintar = () => botones.forEach((b) => (b.hidden = !aviso));
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  aviso = e;
  pintar();
});
addEventListener("appinstalled", () => {
  aviso = null;
  pintar();
});

export function botonInstalar(boton) {
  botones.add(boton);
  boton.hidden = !aviso;
  boton.addEventListener("click", async () => {
    if (!aviso) return;
    aviso.prompt();
    await aviso.userChoice;
    aviso = null;
    pintar();
  });
}
