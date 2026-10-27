// Menú lateral compartido por las páginas del panel (en el celular queda como barra arriba)
import { auth, signOut, html } from "./firebase.js";

const icono = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICONOS = {
  clientes: icono('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  agenda: icono('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>'),
  resumen: icono('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>'),
  documentos: icono('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>'),
  salir: icono('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>')
};

const SECCIONES = [
  ["clientes", "Clientes", "/panel/"],
  ["agenda", "Agenda", "/panel/agenda.html"],
  ["resumen", "Resumen", "/panel/resumen.html"],
  ["documentos", "Plantillas", "/documentos/"]
];

// activo: "clientes", "agenda" o "resumen"
export function montarMenu(activo) {
  const menu = document.getElementById("menu");
  const correo = auth.currentUser?.email || "";
  menu.innerHTML = `
    <a class="menu-logo" href="/panel/"><img src="../img/logo/logo-fondo-claro.svg" alt="BenedettoWebs"></a>
    <span class="menu-titulo">Panel</span>
    <div class="menu-links">
      ${SECCIONES.map(([id, nombre, href]) =>
        `<a href="${href}"${id === activo ? ' aria-current="page"' : ""}>${ICONOS[id]}<span>${nombre}</span></a>`).join("")}
    </div>
    <div class="menu-pie">
      <span class="menu-avatar" aria-hidden="true">${html((correo[0] || "S").toUpperCase())}</span>
      <span class="menu-correo" title="${html(correo)}">${html(correo)}</span>
      <button class="menu-salir" id="salir" title="Cerrar sesión" aria-label="Cerrar sesión">${ICONOS.salir}</button>
    </div>`;
  menu.querySelector("#salir").addEventListener("click", async () => {
    await signOut(auth);
    location.href = "/panel/";
  });
}
