// ===== Visor de vista previa para clientes =====
// Cada cliente tiene su carpeta en /vista-previa/<cliente>/ con:
//   index.html  → copia de ejemplo/index.html con su VISTA_PREVIA configurado
//   sitio/      → los archivos del sitio propuesto (su propio index.html, css, imágenes...)

const WHATSAPP = "56932698141";

const config = window.VISTA_PREVIA || {};

// La carpeta del cliente, con "/" final aunque la URL llegue sin ella
// (benedettowebs.cl/vista-previa/ejemplo y .../ejemplo/ deben funcionar igual).
const carpeta = location.pathname.replace(/index\.html$/, "").replace(/\/?$/, "/");

document.title = `Vista previa: ${config.cliente || "tu sitio"} | BenedettoWebs`;
document.getElementById("nombreCliente").textContent = config.cliente || "Tu sitio web";

const iframe = document.getElementById("sitio");
iframe.src = carpeta + "sitio/index.html";
iframe.title = `Vista previa del sitio de ${config.cliente || "tu negocio"}`;

document.getElementById("abrirSitio").href = carpeta + "sitio/index.html";

const mensaje = `Hola Santiago, vi la vista previa del sitio de ${config.cliente || "mi negocio"} y `;
document.getElementById("responder").href =
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

// ===== Selector de dispositivo =====
const botones = document.querySelectorAll(".dispositivos button");
botones.forEach((boton) => {
  boton.addEventListener("click", () => {
    document.body.dataset.dispositivo = boton.dataset.dispositivo;
    botones.forEach((b) => b.setAttribute("aria-pressed", b === boton));
  });
});
