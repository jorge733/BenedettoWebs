// Guardado de documentos en el panel: si la plantilla se abre con ?doc=ID, carga la versión
// guardada (o la completa con los datos del cliente) y guarda cada cambio solo.
// Sin ?doc= la plantilla funciona igual que antes, sin conectarse a nada.
const id = new URLSearchParams(location.search).get("doc");

if (id) {
  const { db, exigirSesion, doc, getDoc, updateDoc, serverTimestamp, TIPOS } = await import("./firebase.js");
  await exigirSesion();

  const ref = doc(db, "documentos", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    alert("Este documento no existe o fue eliminado.");
    location.href = "/panel/";
    throw new Error("Documento no encontrado");
  }
  const d = snap.data();
  const hoja = document.querySelector(".hoja");

  if (d.html) {
    hoja.innerHTML = d.html;
  } else {
    // Documento nuevo: datos del cliente, número y referencias a la última cotización
    const poner = (selector, valor) => valor && document.querySelectorAll(selector).forEach((el) => (el.textContent = valor));
    for (const [campo, valor] of Object.entries(d.datos || {})) poner(`[data-cliente="${campo}"]`, valor);
    poner("[data-numero]", d.numero);
    poner('[data-ref="cotizacion"]', d.cotizacion);
    poner('[data-ref="total"]', d.total);
  }
  // Los bloques opcionales quedan como se guardaron
  document.querySelectorAll("[data-mostrar]").forEach((check) => {
    check.checked = !document.getElementById(check.dataset.mostrar).hidden;
  });

  // Barra: volver a la ficha del cliente y mostrar el estado del guardado
  const volver = document.querySelector(".barra .volver");
  volver.href = `/panel/cliente.html?id=${d.clienteId}`;
  volver.textContent = "← Cliente";
  const estado = Object.assign(document.createElement("span"), { className: "guardado", textContent: "Guardado ✓" });
  volver.after(estado);
  document.title = `${TIPOS[d.tipo].nombre} ${TIPOS[d.tipo].prefijo} ${d.numero} · Panel`;

  let pendiente = false;
  let espera;

  async function guardar() {
    clearTimeout(espera);
    pendiente = false;
    estado.className = "guardado";
    estado.textContent = "Guardando…";
    const texto = (sel) => document.querySelector(sel)?.textContent.trim();
    const cambios = { html: hoja.innerHTML, actualizado: serverTimestamp() };
    const titulo = texto("[data-nombre-archivo]");
    if (titulo && !/^\[/.test(titulo)) cambios.titulo = titulo;
    if (d.tipo === "cotizacion" && texto("[data-total]")) cambios.total = texto("[data-total]");
    try {
      await updateDoc(ref, cambios);
      if (!pendiente) estado.textContent = "Guardado ✓";
    } catch (err) {
      pendiente = true;
      estado.className = "guardado error";
      estado.textContent = "No se guardó: " + err.message;
    }
  }

  const programar = () => {
    pendiente = true;
    estado.className = "guardado";
    estado.textContent = "Cambios sin guardar…";
    clearTimeout(espera);
    espera = setTimeout(guardar, 1200);
  };
  new MutationObserver(programar).observe(hoja, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["hidden"] });

  // Ctrl+S guarda al tiro; al cerrar con cambios pendientes, avisa
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      guardar();
    }
  });
  window.addEventListener("beforeunload", (e) => {
    if (pendiente) e.preventDefault();
  });

  if (!d.html) guardar();
}
