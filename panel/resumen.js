// Resumen: ventas aprobadas por mes menos el costo de IA, como la hoja "Resumen mensual" del Excel
import { db, exigirSesion, collection, doc, getDoc, getDocs, setDoc, html, clp, numero } from "./firebase.js";

const $ = (id) => document.getElementById(id);
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ajustesRef = doc(db, "ajustes", "finanzas");
// Con signo y en rojo si es negativo: clp() deja vacío el 0 y no pone el "−"
const pesos = (n) => (n < 0 ? "−" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("es-CL");
const conSigno = (n) => `<span class="${n < 0 ? "negativo" : n > 0 ? "positivo" : ""}">${pesos(n)}</span>`;

await exigirSesion();
$("app").hidden = false;

const [snap, ajustes] = await Promise.all([getDocs(collection(db, "clientes")), getDoc(ajustesRef)]);
const clientes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
let costoIA = ajustes.data()?.costoIA ?? 107000;
$("costoIA").value = clp(costoIA);

const hoy = new Date();
const anios = new Set([hoy.getFullYear()]);
clientes.forEach((c) => c.aprobada && anios.add(Number(c.aprobada.slice(0, 4))));
$("anio").innerHTML = [...anios].sort((a, b) => b - a).map((a) => `<option>${a}</option>`).join("");

function pintar() {
  const anio = Number($("anio").value);
  // "aprobada" viene del input de fecha: "2026-03-14"
  const filas = MESES.map((nombre, i) => {
    const delMes = clientes.filter((c) => c.aprobada?.startsWith(`${anio}-${String(i + 1).padStart(2, "0")}`) && numero(c.monto));
    const ventas = delMes.reduce((s, c) => s + numero(c.monto), 0);
    return { nombre, i, delMes, ventas, resultado: ventas - costoIA };
  });
  const ventasAnio = filas.reduce((s, f) => s + f.ventas, 0);
  const resultadoAnio = ventasAnio - costoIA * 12;
  const esteAnio = anio === hoy.getFullYear();
  const mesActual = esteAnio ? filas[hoy.getMonth()] : null;
  const hastaHoy = esteAnio ? filas.slice(0, hoy.getMonth() + 1) : anio < hoy.getFullYear() ? filas : [];
  const resultadoHastaHoy = hastaHoy.reduce((s, f) => s + f.resultado, 0);

  $("cifras").innerHTML = [
    ["Ventas aprobadas " + anio, pesos(ventasAnio), `${filas.reduce((s, f) => s + f.delMes.length, 0)} proyectos`],
    mesActual && [`Resultado de ${mesActual.nombre.toLowerCase()}`, conSigno(mesActual.resultado), `${pesos(mesActual.ventas)} en ventas`],
    hastaHoy.length && ["Resultado a la fecha", conSigno(resultadoHastaHoy), esteAnio ? `enero a ${mesActual.nombre.toLowerCase()}` : "año completo"],
    ["Resultado anual estimado", conSigno(resultadoAnio), `con ${pesos(costoIA * 12)} de IA`]
  ].filter(Boolean).map(([t, v, s], i) =>
    `<div class="cifra" style="animation-delay:${i * 0.06}s"><span>${t}</span><strong>${v}</strong><small>${s}</small></div>`).join("");

  $("meses").innerHTML = filas.map((f) => {
    const clase = esteAnio && f.i === hoy.getMonth() ? "actual" : esteAnio && f.i > hoy.getMonth() || anio > hoy.getFullYear() ? "futuro" : "";
    const mes = f.delMes.length ? `<button aria-expanded="false" data-mes="${f.i}">${f.nombre}</button>` : f.nombre;
    const detalle = f.delMes.map((c) => `<a href="cliente.html?id=${c.id}">${html(c.negocio || c.nombre)}</a> ${clp(numero(c.monto))}`).join(" · ");
    return `<tr class="${clase}"><td>${mes}</td><td>${pesos(f.ventas)}</td><td>${pesos(costoIA)}</td><td>${conSigno(f.resultado)}</td></tr>
      <tr class="detalle" data-detalle="${f.i}" hidden><td colspan="4">${detalle}</td></tr>`;
  }).join("");
  $("totales").innerHTML = `<tr><td>Total anual</td><td>${pesos(ventasAnio)}</td><td>${pesos(costoIA * 12)}</td><td>${conSigno(resultadoAnio)}</td></tr>`;

  // Clientes con monto que no aparecen en ningún mes porque les falta la fecha de aprobación
  const sinFecha = clientes.filter((c) => numero(c.monto) && !c.aprobada);
  $("aviso").innerHTML = sinFecha.length
    ? `Sin fecha de aprobación (no se cuentan): ${sinFecha.map((c) => `<a href="cliente.html?id=${c.id}">${html(c.negocio || c.nombre)}</a>`).join(", ")}.`
    : "";
}

$("anio").addEventListener("change", pintar);
$("meses").addEventListener("click", (e) => {
  const boton = e.target.closest("[data-mes]");
  if (!boton) return;
  const abierto = boton.getAttribute("aria-expanded") !== "true";
  boton.setAttribute("aria-expanded", abierto);
  $("meses").querySelector(`[data-detalle="${boton.dataset.mes}"]`).hidden = !abierto;
});

$("costoIA").addEventListener("change", async () => {
  costoIA = numero($("costoIA").value);
  $("costoIA").value = clp(costoIA);
  pintar();
  try {
    await setDoc(ajustesRef, { costoIA }, { merge: true });
    $("msgAjustes").className = "mensaje ok";
    $("msgAjustes").textContent = "Guardado ✓";
  } catch (err) {
    $("msgAjustes").className = "mensaje error";
    $("msgAjustes").textContent = "No se pudo guardar: " + err.message;
  }
});

pintar();
