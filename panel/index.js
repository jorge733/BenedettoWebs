// Panel: inicio de sesión y lista de clientes
import {
  configurado, auth, db, ESTADOS, CORREOS, onAuthStateChanged, entrarConGoogle, signOut,
  collection, getDocs, query, where, ms, fechaCorta, html, clp, numero
} from "./firebase.js";
import { etiquetaEstado } from "./correo.js";

const $ = (id) => document.getElementById(id);
let clientes = [];
let filtro = "Todos";

const avisoLogin = (texto, error) => {
  $("msgLogin").className = "mensaje" + (error ? " error" : "");
  $("msgLogin").textContent = texto;
};

if (!configurado) {
  $("sinConfig").hidden = false;
} else {
  onAuthStateChanged(auth, (usuario) => {
    // Otra cuenta de Google: se cierra la sesión (las reglas de Firestore tampoco la dejarían leer nada)
    if (usuario && !CORREOS.includes(usuario.email)) {
      signOut(auth);
      return avisoLogin(`La cuenta ${usuario.email} no tiene acceso a este panel.`, true);
    }
    $("login").hidden = !!usuario;
    $("app").hidden = !usuario;
    if (!usuario) return;
    const volver = new URLSearchParams(location.search).get("volver");
    if (volver?.startsWith("/")) return location.replace(volver);
    cargar();
  });
}

$("entrar").addEventListener("click", async () => {
  avisoLogin("Abriendo Google…");
  try {
    await entrarConGoogle();
  } catch (err) {
    avisoLogin(err.code === "auth/popup-closed-by-user" ? "" : "No se pudo entrar: " + err.message, true);
  }
});

$("salir").addEventListener("click", () => signOut(auth));

async function cargar() {
  $("lista").innerHTML = '<div class="cliente-card esqueleto"></div>'.repeat(3);
  try {
    const snap = await getDocs(collection(db, "clientes"));
    clientes = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => ms(b.actualizado) - ms(a.actualizado));
    pintar();
    resumen();
  } catch (err) {
    $("lista").innerHTML = "";
    $("vacio").hidden = false;
    $("vacio").textContent = "No se pudieron cargar los clientes: " + err.message;
  }
}

function pintar() {
  const cuenta = (estado) => clientes.filter((c) => c.estado === estado).length;
  $("chips").innerHTML = ["Todos", ...ESTADOS]
    .map((e) => `<button class="chip" data-filtro="${e}" aria-pressed="${e === filtro}">${e}<b>${e === "Todos" ? clientes.length : cuenta(e)}</b></button>`)
    .join("");

  const texto = $("buscar").value.trim().toLowerCase();
  const visibles = clientes.filter((c) =>
    (filtro === "Todos" || c.estado === filtro) &&
    [c.nombre, c.negocio, c.email, c.rut].join(" ").toLowerCase().includes(texto));

  $("lista").innerHTML = visibles.map((c) => `
    <a class="cliente-card" href="cliente.html?id=${c.id}">
      <h3>${html(c.negocio || c.nombre || "Sin nombre")}</h3>
      <p>${html(c.negocio ? c.nombre : c.email)}</p>
      <div class="pie"><span class="estado" data-estado="${html(c.estado)}">${html(c.estado)}</span><span>${fechaCorta(c.actualizado)}</span></div>
    </a>`).join("");

  $("vacio").hidden = visibles.length > 0;
  $("vacio").textContent = clientes.length ? "Ningún cliente coincide con la búsqueda." : "Aún no tienes clientes. Crea el primero con “+ Nuevo cliente”.";
}

// Al escribir no se repite la cascada de tarjetas en cada tecla; al cambiar de filtro, sí
$("buscar").addEventListener("input", () => {
  $("lista").classList.add("quieta");
  pintar();
});
$("chips").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-filtro]");
  if (!chip) return;
  filtro = chip.dataset.filtro;
  $("lista").classList.remove("quieta");
  pintar();
});

// Resumen arriba de la lista: cifras del mes y lo que necesita atención (dominios, entregas, correos abiertos)
const DIA = 24 * 60 * 60 * 1000;
const hoyISO = () => new Date().toLocaleDateString("en-CA"); // "2026-10-21"
const diasHasta = (iso) => Math.round((Date.parse(iso) - Date.parse(hoyISO())) / DIA);
const fechaISO = (iso) => new Date(iso + "T12:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" });
const enDias = (d) => (d === 0 ? "hoy" : d === 1 ? "mañana" : d === -1 ? "ayer" : d < 0 ? `hace ${-d} días` : `en ${d} días`);
const nombreDe = (c) => html(c?.negocio || c?.nombre || "Cliente");

async function resumen() {
  const hoy = new Date();
  const mes = hoyISO().slice(0, 7);
  const mesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15).toLocaleDateString("en-CA").slice(0, 7);
  const ventas = (m) => clientes.filter((c) => c.aprobada?.startsWith(m) && numero(c.monto));
  const suma = (lista) => lista.reduce((s, c) => s + numero(c.monto), 0);
  const delMes = ventas(mes), pasado = suma(ventas(mesPasado));

  const cotizando = clientes.filter((c) => c.estado === "Cotizando");
  const conSeguimiento = cotizando.filter((c) => (c.seguimientos || []).some((s) => Date.parse(s.fecha) > Date.now())).length;
  const desarrollo = clientes.filter((c) => c.estado === "En desarrollo");
  const proxima = desarrollo.filter((c) => c.entrega && diasHasta(c.entrega) >= 0).sort((a, b) => a.entrega.localeCompare(b.entrega))[0];
  const aprobados = clientes.filter((c) => c.aprobada).length;
  const dominios = clientes.filter((c) => c.vence && diasHasta(c.vence) >= 0 && diasHasta(c.vence) <= 60)
    .sort((a, b) => a.vence.localeCompare(b.vence));

  const mesNombre = hoy.toLocaleDateString("es-CL", { month: "long" });
  $("cifras").innerHTML = [
    [`Ventas de ${mesNombre}`, clp(suma(delMes)) || "$0", `${delMes.length} ${delMes.length === 1 ? "proyecto" : "proyectos"} · mes pasado ${clp(pasado) || "$0"}`],
    ["Cotizaciones abiertas", cotizando.length, conSeguimiento ? `${conSeguimiento} con seguimiento programado` : "esperando respuesta"],
    ["En desarrollo", desarrollo.length, proxima ? `próxima entrega ${fechaISO(proxima.entrega)} · ${nombreDe(proxima)}` : "sin entregas próximas"],
    ["Tasa de cierre", clientes.length ? Math.round((aprobados / clientes.length) * 100) + "%" : "—", `${aprobados} de ${clientes.length} clientes aprobaron`],
    ["Dominios por vencer", dominios.length, dominios[0] ? `${nombreDe(dominios[0])} ${enDias(diasHasta(dominios[0].vence))}` : "ninguno en 60 días"]
  ].map(([t, v, s], i) =>
    `<div class="cifra" style="animation-delay:${i * 0.05}s"><span>${t}</span><strong>${v}</strong><small>${s}</small></div>`).join("");

  // Para atender: [orden, ícono, texto, clienteId, etiqueta]
  const porId = Object.fromEntries(clientes.map((c) => [c.id, c]));
  const items = [];
  for (const c of dominios.filter((c) => diasHasta(c.vence) <= 30)) {
    const d = diasHasta(c.vence);
    items.push([d, "⏰", `Dominio de <strong>${nombreDe(c)}</strong> vence el ${fechaISO(c.vence)} (${enDias(d)})`, c.id]);
  }
  for (const c of desarrollo.filter((c) => c.entrega && diasHasta(c.entrega) <= 7)) {
    const d = diasHasta(c.entrega);
    items.push([d, d < 0 ? "⚠️" : "📦", `${d < 0 ? "Entrega atrasada" : "Entrega"} de <strong>${nombreDe(c)}</strong>: ${fechaISO(c.entrega)} (${enDias(d)})`, c.id]);
  }
  try {
    // Correos abiertos, con clic o que no llegaron en la última semana (los avisa Resend)
    const desde = new Date(Date.now() - 7 * DIA);
    const snap = await getDocs(query(collection(db, "correos"), where("ultimoEvento", ">=", desde)));
    for (const d of snap.docs) {
      const c = d.data();
      if (!["abierto", "clic", "rebotado", "spam"].includes(c.estado) || !porId[c.clienteId]) continue;
      const malo = c.estado === "rebotado" || c.estado === "spam";
      const cuando = (c.ultimaApertura || c.ultimoEvento).toDate();
      const texto = malo
        ? `El correo “${html(c.asunto)}” a <strong>${nombreDe(porId[c.clienteId])}</strong> no llegó: revisa su dirección`
        : `<strong>${nombreDe(porId[c.clienteId])}</strong> abrió “${html(c.asunto)}” · ${cuando.toLocaleString("es-CL", { weekday: "short", hour: "2-digit", minute: "2-digit" })}`;
      // Lo más reciente primero, pero después de lo urgente (dominios y entregas de hoy)
      items.push([malo ? -100 : 0.5 + (Date.now() - cuando) / DIA, malo ? "⚠️" : "👀", texto, c.clienteId, etiquetaEstado(c)]);
    }
  } catch (err) {
    console.error("No se pudieron cargar los correos recientes", err);
  }

  items.sort((a, b) => a[0] - b[0]);
  $("atender").hidden = !items.length;
  $("listaAtender").innerHTML = items.slice(0, 8).map(([, icono, texto, id, etiqueta = ""]) => `<li>
    <span class="atender-icono">${icono}</span>
    <div class="doc-info">${texto}</div>
    ${etiqueta}
    <a class="btn btn-ghost btn-sm" href="cliente.html?id=${id}">Ver</a>
  </li>`).join("");
}
