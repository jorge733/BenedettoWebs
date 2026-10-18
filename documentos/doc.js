// Documentos BenedettoWebs: campos editables, fechas, totales y guardar como PDF
// Todo se busca en el momento (no al cargar), porque el panel puede reemplazar la hoja por una versión guardada.

const clp = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const soloNumero = (texto) => Number(String(texto).replace(/\D/g, "")) || 0;
const tabla = () => document.querySelector("table.items tbody");

// Campos para completar: se editan haciendo clic encima
document.querySelectorAll("[data-campo]").forEach((el) => {
  el.contentEditable = "true";
  el.spellcheck = false;
});

// Fechas automáticas: data-fecha="0" es hoy, "15" es dentro de 15 días (solo si están vacías)
document.querySelectorAll("[data-fecha]").forEach((el) => {
  if (el.textContent.trim()) return;
  const d = new Date();
  d.setDate(d.getDate() + Number(el.dataset.fecha));
  el.textContent = d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
});

// Tabla de cotización: filas editables y total automático
function recalcular() {
  const cuerpo = tabla();
  if (!cuerpo) return;
  const total = [...cuerpo.querySelectorAll(".valor")]
    .reduce((suma, celda) => suma + soloNumero(celda.textContent), 0);
  document.querySelectorAll("[data-total]").forEach((el) => (el.textContent = clp(total)));
  document.querySelectorAll("[data-mitad]").forEach((el) => (el.textContent = clp(total / 2)));
}

function prepararFila(fila) {
  fila.querySelectorAll("td:not(.quitar-col)").forEach((td) => (td.contentEditable = "true"));
}

tabla()?.querySelectorAll("tr").forEach(prepararFila);
document.addEventListener("input", (e) => {
  if (e.target.closest?.("table.items tbody")) recalcular();
});
// Al salir de una celda de valor, darle formato $30.000 (o dejar "Incluido")
document.addEventListener("focusout", (e) => {
  const celda = e.target.closest?.("table.items tbody .valor");
  if (celda && soloNumero(celda.textContent)) celda.textContent = clp(soloNumero(celda.textContent));
});
document.addEventListener("click", (e) => {
  if (e.target.closest(".items .quitar")) {
    e.target.closest("tr").remove();
    recalcular();
  }
});
document.getElementById("agregarFila")?.addEventListener("click", () => {
  const fila = document.createElement("tr");
  fila.innerHTML = '<td>Nuevo ítem</td><td class="valor">$0</td><td class="quitar-col"><button class="quitar" title="Quitar fila">×</button></td>';
  tabla().appendChild(fila);
  prepararFila(fila);
  // Deja seleccionado "Nuevo ítem" para escribir encima
  const celda = fila.querySelector("td");
  celda.focus();
  getSelection().selectAllChildren(celda);
  recalcular();
});
recalcular();

// Bloques opcionales (ej: firma del apoderado)
document.querySelectorAll("[data-mostrar]").forEach((check) => {
  const aplicar = () => (document.getElementById(check.dataset.mostrar).hidden = !check.checked);
  check.addEventListener("change", aplicar);
  aplicar();
});

// Guardar como PDF: el nombre del archivo sale del título de la página
document.getElementById("imprimir")?.addEventListener("click", () => {
  const pendientes = [...document.querySelectorAll("[data-campo]")]
    .filter((el) => /^\[.*\]$/.test(el.textContent.trim()));
  if (pendientes.length) {
    pendientes[0].focus();
    if (!confirm(`Quedan ${pendientes.length} campos sin completar (los que están entre [ ]). ¿Guardar igual?`)) return;
  }
  const cliente = document.querySelector("[data-nombre-archivo]")?.textContent.trim();
  const titulo = document.title;
  if (cliente && !/^\[/.test(cliente)) document.title = `${titulo.split(" · ")[0]} - ${cliente}`;
  window.print();
  document.title = titulo;
});
