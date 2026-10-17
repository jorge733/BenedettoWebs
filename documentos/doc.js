// Documentos BenedettoWebs: campos editables, fechas, totales y guardar como PDF

const clp = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const soloNumero = (texto) => Number(String(texto).replace(/\D/g, "")) || 0;

// Campos para completar: se editan haciendo clic encima
document.querySelectorAll("[data-campo]").forEach((el) => {
  el.contentEditable = "true";
  el.spellcheck = false;
});

// Fechas automáticas: data-fecha="0" es hoy, "15" es dentro de 15 días
document.querySelectorAll("[data-fecha]").forEach((el) => {
  const d = new Date();
  d.setDate(d.getDate() + Number(el.dataset.fecha));
  el.textContent = d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
});

// Tabla de cotización: filas editables y total automático
const cuerpo = document.querySelector("table.items tbody");

function recalcular() {
  if (!cuerpo) return;
  const total = [...cuerpo.querySelectorAll(".valor")]
    .reduce((suma, celda) => suma + soloNumero(celda.textContent), 0);
  document.querySelectorAll("[data-total]").forEach((el) => (el.textContent = clp(total)));
  document.querySelectorAll("[data-mitad]").forEach((el) => (el.textContent = clp(total / 2)));
}

function prepararFila(fila) {
  fila.querySelectorAll("td:not(.quitar-col)").forEach((td) => (td.contentEditable = "true"));
}

if (cuerpo) {
  cuerpo.querySelectorAll("tr").forEach(prepararFila);
  cuerpo.addEventListener("input", recalcular);
  // Al salir de una celda de valor, darle formato $30.000 (o dejar "Incluido")
  cuerpo.addEventListener("focusout", (e) => {
    const celda = e.target.closest(".valor");
    if (celda && soloNumero(celda.textContent)) celda.textContent = clp(soloNumero(celda.textContent));
  });
  cuerpo.addEventListener("click", (e) => {
    if (e.target.closest(".quitar")) {
      e.target.closest("tr").remove();
      recalcular();
    }
  });
  document.getElementById("agregarFila")?.addEventListener("click", () => {
    const fila = document.createElement("tr");
    fila.innerHTML = '<td>Nuevo ítem</td><td class="valor">$0</td><td class="quitar-col"><button class="quitar" title="Quitar fila">×</button></td>';
    cuerpo.appendChild(fila);
    prepararFila(fila);
    fila.querySelector("td").focus();
    recalcular();
  });
  recalcular();
}

// Bloques opcionales (ej: firma del apoderado)
document.querySelectorAll("[data-mostrar]").forEach((check) => {
  const bloque = document.getElementById(check.dataset.mostrar);
  const aplicar = () => (bloque.hidden = !check.checked);
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
