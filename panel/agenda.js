// Agenda: brief del día, tareas, próximos 7 días y avisos por correo (los envía api/agenda.js y api/brief-diario.js)
import {
  auth, db, exigirSesion, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, query, where, serverTimestamp, ms, html
} from "./firebase.js";
import { montarMenu } from "./menu.js";
import { interpretar, sumar, CATEGORIAS, DIA } from "./agenda-texto.js";

const $ = (id) => document.getElementById(id);

let clientes = [], tareas = [], correos = [], ajustes = {};
let filtro = "Todas", editando = null;

// ===== Fechas (el navegador está en hora de Chile) =====
const hoyISO = () => new Date().toLocaleDateString("en-CA");
const entre = (desde, hasta) => Math.round((Date.parse(hasta + "T12:00:00") - Date.parse(desde + "T12:00:00")) / DIA);
const fecha = (iso, op = { weekday: "short", day: "numeric", month: "short" }) => new Date(iso + "T12:00:00").toLocaleDateString("es-CL", op);
const cuandoEs = (iso) => {
  const d = entre(hoyISO(), iso);
  const texto = d === 0 ? "Hoy" : d === 1 ? "Mañana" : d === -1 ? "Ayer" : d < 0 ? `Hace ${-d} días` : d < 7 ? fecha(iso, { weekday: "long" }) : fecha(iso);
  return texto[0].toUpperCase() + texto.slice(1);
};
const porId = () => Object.fromEntries(clientes.map((c) => [c.id, c]));
const nombre = (c) => c?.negocio || c?.nombre || "Cliente";

// ===== Carga =====
await exigirSesion();
$("app").hidden = false;
montarMenu("agenda");
saludar();

const ajustesRef = doc(db, "ajustes", "agenda");
try {
  const desde = new Date(Date.now() - (new Date().getDay() === 1 ? 3 : 1) * DIA);
  const [snapClientes, snapTareas, snapAjustes, snapCorreos] = await Promise.all([
    getDocs(collection(db, "clientes")),
    getDocs(collection(db, "tareas")),
    getDoc(ajustesRef),
    getDocs(query(collection(db, "correos"), where("ultimoEvento", ">=", desde))).catch(() => ({ docs: [] }))
  ]);
  clientes = snapClientes.docs.map((d) => ({ id: d.id, ...d.data() }));
  tareas = snapTareas.docs.map((d) => ({ id: d.id, ...d.data() }));
  correos = snapCorreos.docs.map((d) => ({ id: d.id, ...d.data() }));
  ajustes = { brief: true, briefDias: "habiles", recordatorios: true, antes: 15, alertas: true, ...(snapAjustes.data() || {}) };
} catch (err) {
  $("briefResumen").textContent = "No se pudo cargar la agenda: " + err.message;
  throw err;
}
$("selCliente").innerHTML = `<option value="">Sin cliente</option>` +
  [...clientes].sort((a, b) => nombre(a).localeCompare(nombre(b))).map((c) => `<option value="${c.id}">${html(nombre(c))}</option>`).join("");
$("selCategoria").innerHTML = `<option value="">Sin categoría</option>` + Object.keys(CATEGORIAS).map((c) => `<option>${c}</option>`).join("");
function pintarTodo() {
  pintarBrief();
  pintarTareas();
  pintarSemana();
}

function saludar() {
  const h = new Date().getHours();
  $("saludo").textContent = `${h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches"}, Santiago`;
  const texto = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("fechaHoy").textContent = texto[0].toUpperCase() + texto.slice(1);
}

// ===== Brief del día =====
function pintarBrief() {
  const hoy = hoyISO();
  const pendientes = tareas.filter((t) => !t.hecha);
  const atrasadas = pendientes.filter((t) => t.fecha && t.fecha < hoy);
  const deHoy = pendientes.filter((t) => t.fecha === hoy);
  const semana = pendientes.filter((t) => t.fecha > hoy && t.fecha <= sumar(hoy, 6));
  const desarrollo = clientes.filter((c) => c.estado === "En desarrollo");
  const cotizando = clientes.filter((c) => c.estado === "Cotizando");
  const ids = porId();

  // [orden, ícono, texto, clienteId, detalle]
  const items = [];
  for (const c of desarrollo.filter((c) => c.entrega && c.entrega <= sumar(hoy, 2))) {
    const d = entre(hoy, c.entrega);
    items.push([d, d < 0 ? "⚠️" : "📦", `${d < 0 ? "Entrega atrasada" : "Entrega"} de <strong>${html(nombre(c))}</strong>`, c.id, cuandoEs(c.entrega)]);
  }
  for (const c of cotizando) for (const s of c.seguimientos || []) {
    if (new Date(s.fecha).toLocaleDateString("en-CA") === hoy && Date.parse(s.fecha) > Date.now() - DIA)
      items.push([0.2, "✉️", `Sale el seguimiento a <strong>${html(nombre(c))}</strong>`, c.id, html(s.asunto)]);
  }
  for (const c of clientes.filter((c) => c.vence && c.vence >= hoy && entre(hoy, c.vence) <= 14)) {
    items.push([entre(hoy, c.vence), "🌐", `Dominio de <strong>${html(nombre(c))}</strong> vence`, c.id, cuandoEs(c.vence)]);
  }
  for (const c of correos) {
    if (!ids[c.clienteId] || !["abierto", "clic", "rebotado", "spam"].includes(c.estado)) continue;
    const malo = c.estado === "rebotado" || c.estado === "spam";
    const que = malo ? "no recibió" : c.estado === "clic" ? "hizo clic en" : "abrió";
    items.push([malo ? -50 : 0.5, malo ? "🚫" : c.estado === "clic" ? "🔥" : "👀",
      `<strong>${html(nombre(ids[c.clienteId]))}</strong> ${que} “${html(c.asunto)}”`, c.clienteId,
      (c.ultimaApertura || c.ultimoEvento)?.toDate?.().toLocaleString("es-CL", { weekday: "short", hour: "2-digit", minute: "2-digit" }) || ""]);
  }
  items.sort((a, b) => a[0] - b[0]);

  const partes = [
    deHoy.length ? `<strong>${deHoy.length} ${deHoy.length === 1 ? "tarea" : "tareas"} para hoy</strong>` : "Nada agendado para hoy",
    atrasadas.length ? `<span class="negativo">${atrasadas.length} atrasada${atrasadas.length === 1 ? "" : "s"}</span>` : "",
    items.length ? `${items.length} ${items.length === 1 ? "aviso" : "avisos"}` : ""
  ].filter(Boolean);
  $("briefResumen").innerHTML = partes.join(" · ");

  const proxima = deHoy.filter((t) => t.hora && t.hora >= new Date().toTimeString().slice(0, 5)).sort((a, b) => a.hora.localeCompare(b.hora))[0];
  $("cifras").innerHTML = [
    ["Para hoy", deHoy.length, proxima ? `próxima: ${proxima.hora} · ${html(proxima.titulo)}` : deHoy.length ? "sin horas fijas" : "día libre"],
    ["Atrasadas", atrasadas.length, atrasadas.length ? `la más antigua: ${cuandoEs(atrasadas.map((t) => t.fecha).sort()[0]).toLowerCase()}` : "al día ✓"],
    ["Próximos 6 días", semana.length, `${pendientes.filter((t) => !t.fecha).length} sin fecha`],
    ["Proyectos activos", desarrollo.length, `${cotizando.length} ${cotizando.length === 1 ? "cotización abierta" : "cotizaciones abiertas"}`]
  ].map(([t, v, s], i) =>
    `<div class="cifra${t === "Atrasadas" && v ? " alerta" : ""}" style="animation-delay:${i * 0.05}s"><span>${t}</span><strong>${v}</strong><small>${s}</small></div>`).join("");

  $("briefLista").hidden = !items.length;
  $("briefLista").innerHTML = items.slice(0, 6).map(([, icono, texto, id, detalle]) => `<li>
    <span class="atender-icono">${icono}</span>
    <div class="doc-info">${texto}${detalle ? `<span>${html(detalle)}</span>` : ""}</div>
    <a class="btn btn-ghost btn-sm" href="cliente.html?id=${id}">Ver</a>
  </li>`).join("");
}

// Primera idea sin hacer de la lista de posts de Instagram
async function cargarIdea() {
  try {
    const r = await fetch("/posts/ideas.md", { cache: "no-store" });
    const idea = r.ok && (await r.text()).match(/^- \[ \] (.+)$/m)?.[1];
    if (!idea) return;
    $("idea").hidden = false;
    $("idea").innerHTML = `📸 <span>Idea para Instagram:</span> <strong>${html(idea)}</strong>
      <button class="btn btn-ghost btn-sm" type="button" id="agendarIdea">Agendar para hoy</button>`;
    $("agendarIdea").addEventListener("click", () =>
      guardar({ titulo: `Post de Instagram: ${idea}`, fecha: hoyISO(), hora: "", categoria: "Marketing", clienteId: "", importante: false, notas: "" }));
  } catch {}
}

// ===== Tareas =====
const GRUPOS = [
  ["atrasadas", "Atrasadas", (t, h) => t.fecha && t.fecha < h],
  ["hoy", "Hoy", (t, h) => t.fecha === h],
  ["manana", "Mañana", (t, h) => t.fecha === sumar(h, 1)],
  ["semana", "Esta semana", (t, h) => t.fecha > sumar(h, 1) && t.fecha <= sumar(h, 6)],
  ["despues", "Más adelante", (t, h) => t.fecha > sumar(h, 6)],
  ["sinfecha", "Sin fecha", (t) => !t.fecha]
];
const ordenar = (a, b) => (a.fecha || "9").localeCompare(b.fecha || "9") || Number(!!b.importante) - Number(!!a.importante) ||
  (a.hora || "99").localeCompare(b.hora || "99") || ms(a.creado) - ms(b.creado);

function filaTarea(t, grupo) {
  const c = porId()[t.clienteId];
  const aviso = t.recordatorio?.fecha && Date.parse(t.recordatorio.fecha) > Date.now();
  const meta = [
    t.hora ? `<span class="pill hora">${t.hora}</span>` : "",
    t.fecha && !["hoy", "manana"].includes(grupo) ? `<span class="meta-fecha${grupo === "atrasadas" ? " negativo" : ""}">${cuandoEs(t.fecha)}</span>` : "",
    t.categoria ? `<span class="pill">${CATEGORIAS[t.categoria] || ""} ${html(t.categoria)}</span>` : "",
    c ? `<a class="pill pill-cliente" href="cliente.html?id=${c.id}">${html(nombre(c))}</a>` : "",
    aviso ? `<span class="pill" title="Te llega un correo a las ${new Date(t.recordatorio.fecha).toTimeString().slice(0, 5)}">🔔 aviso</span>` : "",
    t.notas ? `<span class="pill" title="${html(t.notas)}">📝</span>` : ""
  ].filter(Boolean).join("");
  return `<li class="tarea${t.hecha ? " lista" : ""}${t.importante ? " importante" : ""}" data-id="${t.id}">
    <button class="check" type="button" data-check aria-label="${t.hecha ? "Marcar como pendiente" : "Completar"}: ${html(t.titulo)}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></button>
    <div class="doc-info"><strong>${t.importante ? '<span class="estrella" title="Importante">★</span> ' : ""}${html(t.titulo)}</strong>${meta ? `<span class="metas">${meta}</span>` : ""}</div>
  </li>`;
}

function pintarTareas() {
  const hoy = hoyISO();
  const visibles = tareas.filter((t) => filtro === "Todas" || t.categoria === filtro);
  const pendientes = visibles.filter((t) => !t.hecha).sort(ordenar);
  const cuenta = (cat) => tareas.filter((t) => !t.hecha && (cat === "Todas" || t.categoria === cat)).length;
  $("filtroCategorias").innerHTML = ["Todas", ...Object.keys(CATEGORIAS)].map((cat) =>
    `<button class="chip" type="button" data-cat="${cat}" aria-pressed="${cat === filtro}">${cat === "Todas" ? "Todas" : CATEGORIAS[cat] + " " + cat}<b>${cuenta(cat)}</b></button>`).join("");

  $("grupos").innerHTML = GRUPOS.map(([id, titulo, cumple]) => {
    const lista = pendientes.filter((t) => cumple(t, hoy));
    if (!lista.length) return "";
    return `<h3 class="sub-panel grupo-${id}">${titulo} <b>${lista.length}</b></h3>
      <ul class="docs tareas">${lista.map((t) => filaTarea(t, id)).join("")}</ul>`;
  }).join("");
  $("sinTareas").hidden = pendientes.length > 0;
  $("sinTareas").textContent = filtro === "Todas" ? "No tienes tareas pendientes. Agrega la primera arriba." : `No hay tareas pendientes de ${filtro}.`;

  // Completadas de los últimos 30 días
  const hechas = visibles.filter((t) => t.hecha && Date.now() - ms(t.hechaEl) < 30 * DIA).sort((a, b) => ms(b.hechaEl) - ms(a.hechaEl));
  $("verHechas").hidden = !hechas.length;
  const abiertas = $("verHechas").getAttribute("aria-expanded") === "true";
  $("verHechas").textContent = `${abiertas ? "Ocultar" : "Ver"} completadas (${hechas.length})`;
  $("hechas").hidden = !abiertas || !hechas.length;
  $("hechas").innerHTML = hechas.map((t) => filaTarea(t, "hechas")).join("");
}

$("verHechas").addEventListener("click", () => {
  $("verHechas").setAttribute("aria-expanded", $("verHechas").getAttribute("aria-expanded") !== "true");
  pintarTareas();
});
$("filtroCategorias").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-cat]");
  if (!chip) return;
  filtro = chip.dataset.cat;
  pintarTareas();
});

// Clic en el círculo: completar. Clic en el resto de la fila: editar.
for (const lista of [$("grupos"), $("hechas"), $("semana")]) {
  lista.addEventListener("click", async (e) => {
    if (e.target.closest("a")) return;
    const fila = e.target.closest("[data-id]");
    if (!fila) return;
    const t = tareas.find((x) => x.id === fila.dataset.id);
    if (!t) return;
    if (!e.target.closest("[data-check]")) return abrirTarea(t);
    fila.classList.add(t.hecha ? "volviendo" : "completando");
    await new Promise((r) => setTimeout(r, t.hecha ? 150 : 380));
    t.hecha = !t.hecha;
    t.hechaEl = t.hecha ? { toMillis: () => Date.now() } : null;
    pintarTodo();
    try {
      await updateDoc(doc(db, "tareas", t.id), { hecha: t.hecha, hechaEl: t.hecha ? serverTimestamp() : null, actualizado: serverTimestamp() });
      if (t.hecha) aviso(`Lista: ${t.titulo}`, () => deshacer(t));
      if (t.recordatorio || (t.fecha && t.hora)) await sincronizar(t);
    } catch (err) {
      aviso("No se pudo guardar: " + err.message, null, true);
    }
  });
}
// "Deshacer" del aviso al completar una tarea
async function deshacer(t) {
  t.hecha = false;
  t.hechaEl = null;
  pintarTodo();
  await updateDoc(doc(db, "tareas", t.id), { hecha: false, hechaEl: null, actualizado: serverTimestamp() });
  if (t.fecha && t.hora) await sincronizar(t);
}

// ===== Agregar rápido (agenda-texto.js entiende fechas, horas, ! y #categoría) =====
$("rapida").addEventListener("submit", async (e) => {
  e.preventDefault();
  const texto = $("textoRapido").value.trim();
  if (!texto) return abrirTarea(null);
  const t = interpretar(texto, hoyISO(), clientes);
  if (!t.titulo) return abrirTarea(null, t);
  $("textoRapido").value = "";
  await guardar(t);
});

// ===== Crear, editar y borrar =====
function abrirTarea(t, base = {}) {
  editando = t;
  const f = $("formTarea");
  const datos = t || { titulo: "", fecha: hoyISO(), hora: "", clienteId: "", categoria: "", notas: "", importante: false, ...base };
  for (const campo of ["titulo", "fecha", "hora", "clienteId", "categoria", "notas"]) f.elements[campo].value = datos[campo] || "";
  f.elements.importante.checked = !!datos.importante;
  $("tituloModal").textContent = t ? "Editar tarea" : "Nueva tarea";
  $("borrarTarea").hidden = !t;
  notaRecordatorio();
  $("modalTarea").showModal();
  f.elements.titulo.focus();
}
function notaRecordatorio() {
  const f = $("formTarea");
  const conHora = f.elements.fecha.value && f.elements.hora.value;
  $("notaRecordatorio").textContent = !conHora ? "Ponle fecha y hora si quieres que te llegue un recordatorio por correo."
    : ajustes.recordatorios === false ? "Los recordatorios por correo están desactivados (Avisos por correo)."
    : `Te llega un correo ${Number(ajustes.antes) ? `${ajustes.antes} minutos antes` : "a la hora exacta"}.`;
}
$("formTarea").addEventListener("input", notaRecordatorio);

$("modalTarea").addEventListener("close", async () => {
  const accion = $("modalTarea").returnValue;
  $("modalTarea").returnValue = "";
  const f = $("formTarea");
  if (accion === "borrar" && editando) {
    if (!confirm(`¿Eliminar “${editando.titulo}”?`)) return;
    const t = editando;
    tareas = tareas.filter((x) => x !== t);
    pintarTodo();
    try {
      await api({ tareaId: t.id, borrar: true });
      aviso("Tarea eliminada");
    } catch (err) {
      tareas.push(t);
      pintarTodo();
      aviso("No se pudo eliminar: " + err.message, null, true);
    }
    return;
  }
  if (accion !== "guardar") return;
  const datos = {
    titulo: f.elements.titulo.value.trim(), fecha: f.elements.fecha.value, hora: f.elements.fecha.value ? f.elements.hora.value : "",
    clienteId: f.elements.clienteId.value, categoria: f.elements.categoria.value, notas: f.elements.notas.value.trim(),
    importante: f.elements.importante.checked
  };
  if (datos.titulo) await guardar(datos, editando);
});

async function guardar(datos, t = null) {
  try {
    if (t) {
      Object.assign(t, datos);
      await updateDoc(doc(db, "tareas", t.id), { ...datos, actualizado: serverTimestamp() });
    } else {
      const ref = await addDoc(collection(db, "tareas"), { ...datos, hecha: false, creado: serverTimestamp(), actualizado: serverTimestamp() });
      t = { id: ref.id, ...datos, hecha: false, creado: { toMillis: () => Date.now() } };
      tareas.push(t);
    }
    pintarTodo();
    const conAviso = datos.fecha && datos.hora;
    aviso(`${t === editando ? "Guardada" : "Agregada"}: ${datos.titulo}${datos.fecha ? ` · ${cuandoEs(datos.fecha).toLowerCase()}${datos.hora ? " " + datos.hora : ""}` : ""}`);
    if (conAviso || t.recordatorio) await sincronizar(t);
  } catch (err) {
    aviso("No se pudo guardar: " + err.message, null, true);
  }
}

// Le pide al servidor que programe, cambie o cancele el correo de recordatorio de la tarea
async function sincronizar(t) {
  try {
    const r = await api({ tareaId: t.id });
    t.recordatorio = r.recordatorio;
    pintarTareas();
  } catch (err) {
    aviso("La tarea se guardó, pero no se pudo programar el recordatorio: " + err.message, null, true);
  }
}

async function api(cuerpo) {
  const r = await fetch("/api/agenda", {
    method: "POST",
    headers: { Authorization: "Bearer " + (await auth.currentUser.getIdToken()), "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo)
  });
  const datos = await r.json().catch(() => ({ ok: false, error: `Error ${r.status}` }));
  if (!datos.ok) throw new Error(datos.error || `Error ${r.status}`);
  return datos;
}

// ===== Próximos 7 días =====
function pintarSemana() {
  const hoy = hoyISO();
  $("semana").innerHTML = Array.from({ length: 7 }, (_, i) => {
    const dia = sumar(hoy, i);
    const cosas = [
      ...clientes.filter((c) => c.estado === "En desarrollo" && c.entrega === dia)
        .map((c) => `<li class="evento entrega"><a href="cliente.html?id=${c.id}">📦 Entrega · ${html(nombre(c))}</a></li>`),
      ...clientes.filter((c) => c.vence === dia).map((c) => `<li class="evento"><a href="cliente.html?id=${c.id}">🌐 Vence dominio · ${html(nombre(c))}</a></li>`),
      ...tareas.filter((t) => t.fecha === dia && !t.hecha).sort(ordenar)
        .map((t) => `<li class="evento${t.importante ? " importante" : ""}" data-id="${t.id}">${t.hora ? `<b>${t.hora}</b> ` : ""}${html(t.titulo)}</li>`)
    ];
    const etiqueta = i === 0 ? "Hoy" : i === 1 ? "Mañana" : fecha(dia, { weekday: "long" });
    return `<li class="dia${i === 0 ? " es-hoy" : ""}${cosas.length ? "" : " libre"}">
      <div class="dia-cab"><span>${etiqueta}</span><small>${fecha(dia, { day: "numeric", month: "short" })}</small></div>
      ${cosas.length ? `<ul>${cosas.join("")}</ul>` : `<p>Libre</p>`}
    </li>`;
  }).join("");
}

// ===== Avisos por correo =====
const formAvisos = $("formAvisos");
$("abrirAvisos").addEventListener("click", () => {
  for (const campo of ["brief", "recordatorios", "alertas"]) formAvisos.elements[campo].checked = ajustes[campo] !== false;
  formAvisos.elements.briefDias.value = ajustes.briefDias;
  formAvisos.elements.antes.value = String(ajustes.antes);
  $("msgAvisos").textContent = "";
  dependientes();
  $("modalAvisos").showModal();
});
function dependientes() {
  formAvisos.elements.briefDias.disabled = !formAvisos.elements.brief.checked;
  formAvisos.elements.antes.disabled = !formAvisos.elements.recordatorios.checked;
}
formAvisos.addEventListener("change", async () => {
  dependientes();
  ajustes = {
    ...ajustes,
    brief: formAvisos.elements.brief.checked, briefDias: formAvisos.elements.briefDias.value,
    recordatorios: formAvisos.elements.recordatorios.checked, antes: Number(formAvisos.elements.antes.value),
    alertas: formAvisos.elements.alertas.checked
  };
  const msg = $("msgAvisos");
  try {
    await setDoc(ajustesRef, ajustes, { merge: true });
    msg.className = "mensaje ok";
    msg.textContent = "Guardado ✓";
  } catch (err) {
    msg.className = "mensaje error";
    msg.textContent = "No se pudo guardar: " + err.message;
  }
});

async function botonBrief(boton, accion) {
  const texto = boton.textContent;
  boton.disabled = true;
  boton.textContent = accion === "ver" ? "Armando…" : "Enviando…";
  const msg = $("msgAvisos");
  try {
    const r = await api({ brief: accion });
    if (accion === "ver") {
      $("asuntoBrief").textContent = r.vacio ? "Hoy no llegaría: no hay nada que contar" : r.asunto;
      $("vistaBrief").srcdoc = r.html;
      $("modalBrief").showModal();
    } else {
      msg.className = "mensaje ok";
      msg.textContent = "Enviado ✓ Revisa tu bandeja";
    }
  } catch (err) {
    msg.className = "mensaje error";
    msg.textContent = err.message;
  } finally {
    boton.disabled = false;
    boton.textContent = texto;
  }
}
$("verBrief").addEventListener("click", (e) => botonBrief(e.currentTarget, "ver"));
$("enviarBrief").addEventListener("click", (e) => botonBrief(e.currentTarget, "enviar"));

// Cerrar los diálogos al hacer clic fuera
for (const d of document.querySelectorAll("dialog")) d.addEventListener("click", (e) => { if (e.target === d) d.close(); });

// ===== Avisos en pantalla =====
let temporizador;
function aviso(texto, alDeshacer, error = false) {
  let caja = document.querySelector(".toast");
  if (!caja) caja = document.body.appendChild(Object.assign(document.createElement("div"), { className: "toast", role: "status" }));
  caja.classList.toggle("error", error);
  caja.innerHTML = `<span>${html(texto)}</span>${alDeshacer ? '<button type="button">Deshacer</button>' : ""}`;
  caja.querySelector("button")?.addEventListener("click", () => {
    caja.classList.remove("visible");
    alDeshacer();
  });
  requestAnimationFrame(() => caja.classList.add("visible"));
  clearTimeout(temporizador);
  temporizador = setTimeout(() => caja.classList.remove("visible"), error ? 7000 : 4000);
}

pintarTodo();
cargarIdea();

// A medianoche (o al volver a la pestaña otro día) cambian "hoy" y "mañana"
let diaPintado = hoyISO();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && hoyISO() !== diaPintado) {
    diaPintado = hoyISO();
    saludar();
    pintarTodo();
  }
});
