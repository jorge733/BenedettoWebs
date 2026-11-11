// Demos: propuestas armadas para negocios que todavía no son clientes, con su seguimiento
import { db, exigirSesion, collection, doc, getDocs, setDoc, serverTimestamp, html } from "./firebase.js";
import { montarMenu } from "./menu.js";

const $ = (id) => document.getElementById(id);
const SITIO = "https://www.benedettowebs.cl";

// Lista de demos publicadas en /demos/. Para agregar una nueva, súmala aquí.
// whatsapp: número sin "+" ni espacios (vacío si no lo tenemos todavía)
const DEMOS = [
  {
    id: "maxcar",
    negocio: "MaxCar",
    rubro: "Taller mecánico",
    direccion: "Av. Larraín 6062, La Reina",
    caso: "Web de plantilla (2024)",
    whatsapp: "56994335006",
    creada: "2026-11-11",
    mensaje: `Hola, ¿cómo están? Soy Santiago Benedetto, vecino de La Reina, y hago páginas web para negocios del barrio con BenedettoWebs.

Vi su página y les armé una propuesta para que les lleguen más cotizaciones desde el celular: el horario y el WhatsApp a la vista desde el inicio, un formulario para cotizar con la patente y el modelo del auto, y una sección para quienes vienen por un rechazo en la revisión técnica.

En la demo hay un botón abajo que dice "Comparar". Ahí pueden ver su página actual y la nueva lado a lado, en celular y en computador.`,
    seguimiento: "Hola de nuevo. ¿Alcanzaron a ver la propuesta? Si quieren, paso por el taller y se la muestro en 5 minutos. Las páginas parten en $30.000, pago único, y mantienen su dominio maxcar.cl."
  },
  {
    id: "lapetluqueria",
    negocio: "La PetLuquería",
    rubro: "Peluquería canina",
    direccion: "Príncipe de Gales 7434, La Reina",
    caso: "Web desactualizada",
    whatsapp: "56998117319",
    creada: "2026-11-11",
    mensaje: `Hola, ¿cómo están? Soy Santiago Benedetto, vecino de La Reina, y hago páginas web para negocios del barrio con BenedettoWebs.

Revisando su página desde el celular, vi que el banner de la portada sale cortado y que no aparecen los servicios ni el horario a la vista. Así que les armé una propuesta de cómo podría verse, usando su información: el horario, que no usan sedantes, los productos de la tienda y la reserva de horas directo por WhatsApp.

En la demo hay un botón abajo que dice "Comparar". Ahí pueden ver su página actual y la nueva lado a lado, en celular y en computador.`,
    seguimiento: "Hola de nuevo. ¿Alcanzaron a ver la propuesta? Si quieren, paso por la peluquería y se la muestro en 5 minutos. Las páginas parten en $30.000, pago único, y les ayudo a cambiar la actual sin perder su dominio lapetluqueria.cl."
  },
  {
    id: "republica-animal",
    negocio: "República Animal",
    rubro: "Clínica veterinaria",
    direccion: "Av. Echeñique 6401, Local 1, La Reina",
    caso: "Sin web (dominio caído)",
    whatsapp: "",
    creada: "2026-11-11",
    mensaje: `Hola, ¿cómo están? Soy Santiago Benedetto, vecino de La Reina, y hago páginas web para negocios del barrio con BenedettoWebs.

Buscando veterinarias en la comuna vi que República Animal no tiene una página que funcione: el dominio que aparece en internet ya no carga. Así que les armé una demo de cómo se podría ver, con servicios, horario, mapa y un formulario para que los clientes pidan hora directo por WhatsApp.

Los textos y horarios son de ejemplo. Si les gusta, la ajusto con sus datos reales, fotos y logo.`,
    seguimiento: "Hola de nuevo. ¿Alcanzaron a ver la demo? Si quieren, paso por la clínica y se la muestro en 5 minutos. Las páginas parten en $30.000, pago único."
  }
];

const ESTADOS_DEMO = ["Por enviar", "Enviada", "Respondió", "Interesado", "Aceptó", "Descartada"];
const DIAS_SEGUIMIENTO = 3;
const enlace = (d) => `${SITIO}/demos/${d.id}/`;

let datos = {}; // estado guardado en Firestore por id de demo
let filtro = "Todas";

await exigirSesion();
$("app").hidden = false;
montarMenu("demos");

// ===== Aviso flotante =====
let tAviso;
function aviso(texto, error) {
  const t = $("toast");
  t.className = "toast visible" + (error ? " error" : "");
  t.textContent = texto;
  clearTimeout(tAviso);
  tAviso = setTimeout(() => t.classList.remove("visible"), 2600);
}

async function copiar(texto, que) {
  try {
    await navigator.clipboard.writeText(texto);
    aviso(`${que} copiado ✓`);
  } catch {
    aviso("No se pudo copiar. Selecciona el texto y cópialo a mano.", true);
  }
}

// ===== Fechas =====
const hoyISO = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
const diasDesde = (iso) => Math.floor((new Date(hoyISO()) - new Date(iso)) / 86400000);
const fechaLarga = (iso) => new Date(iso + "T12:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" });

const estadoDe = (d) => datos[d.id]?.estado || "Por enviar";
const tocaSeguimiento = (d) => {
  const g = datos[d.id] || {};
  return estadoDe(d) === "Enviada" && g.enviada && !g.seguimientoEnviado && diasDesde(g.enviada) >= DIAS_SEGUIMIENTO;
};

// ===== Cargar =====
async function cargar() {
  $("lista").innerHTML = '<div class="demo-card esqueleto"></div>'.repeat(2);
  try {
    const snap = await getDocs(collection(db, "demos"));
    datos = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
  } catch (err) {
    aviso("No se pudo leer el seguimiento: " + err.message, true);
  }
  pintar();
}

async function guardar(id, cambios) {
  datos[id] = { ...datos[id], ...cambios };
  try {
    await setDoc(doc(db, "demos", id), { ...cambios, actualizado: serverTimestamp() }, { merge: true });
    aviso("Guardado ✓");
  } catch (err) {
    aviso("No se pudo guardar: " + err.message, true);
  }
}

// ===== Pintar =====
function cifras() {
  const cuenta = (...e) => DEMOS.filter((d) => e.includes(estadoDe(d))).length;
  const enviadas = DEMOS.filter((d) => estadoDe(d) !== "Por enviar").length;
  const respuestas = cuenta("Respondió", "Interesado", "Aceptó");
  const seguimientos = DEMOS.filter(tocaSeguimiento).length;
  $("cifras").innerHTML = [
    ["Demos armadas", DEMOS.length, `${cuenta("Por enviar")} por enviar`],
    ["Enviadas", enviadas, seguimientos ? `${seguimientos} toca${seguimientos > 1 ? "n" : ""} seguimiento` : "al día con los seguimientos"],
    ["Respondieron", respuestas, enviadas ? `${Math.round((respuestas / enviadas) * 100)}% de las enviadas` : "todavía sin envíos"],
    ["Aceptaron", cuenta("Aceptó"), "pasan a Clientes"]
  ].map(([t, v, s], i) =>
    `<div class="cifra" style="animation-delay:${i * 0.06}s"><span>${t}</span><strong>${v}</strong><small>${s}</small></div>`).join("");
}

function tarjeta(d) {
  const g = datos[d.id] || {};
  const estado = estadoDe(d);
  const url = enlace(d);
  const wa = d.whatsapp
    ? `<a class="btn btn-sm" href="https://wa.me/${d.whatsapp}?text=${encodeURIComponent(d.mensaje + "\n\n" + url)}" target="_blank" rel="noopener" data-accion="whatsapp">WhatsApp</a>`
    : `<span class="demo-sin-wa" title="Agrega el número en panel/demos.js">Sin WhatsApp</span>`;
  const alerta = tocaSeguimiento(d)
    ? `<div class="demo-alerta">Enviada hace ${diasDesde(g.enviada)} días sin respuesta: toca seguimiento.
         <button class="btn btn-sm btn-ghost" data-accion="copiar-seguimiento">Copiar seguimiento</button>
         <button class="btn btn-sm btn-ghost" data-accion="seguimiento-listo">Ya lo mandé</button></div>`
    : "";
  return `
  <article class="demo-card" data-id="${d.id}" data-estado="${html(estado)}">
    <a class="demo-preview" href="${url}" target="_blank" rel="noopener" aria-label="Abrir demo de ${html(d.negocio)}">
      <img src="/demos/${d.id}/og.png" alt="" loading="lazy">
    </a>
    <div class="demo-cuerpo">
      <div class="demo-titulo">
        <div>
          <h3>${html(d.negocio)}</h3>
          <p>${html(d.rubro)} · ${html(d.direccion)}</p>
        </div>
        <span class="estado demo-estado">${html(estado)}</span>
      </div>
      <div class="demo-tags"><span>${html(d.caso)}</span><span>Creada ${fechaLarga(d.creada)}</span>${g.enviada ? `<span>Enviada ${fechaLarga(g.enviada)}</span>` : ""}</div>
      ${alerta}
      <div class="demo-acciones">
        <a class="btn btn-sm btn-ghost" href="${url}" target="_blank" rel="noopener">Abrir</a>
        <button class="btn btn-sm btn-ghost" data-accion="copiar-link">Copiar link</button>
        <button class="btn btn-sm btn-ghost" data-accion="copiar-mensaje">Copiar mensaje</button>
        ${wa}
      </div>
      <details class="demo-seguimiento">
        <summary>Seguimiento y notas</summary>
        <div class="demo-campos">
          <label class="campo">Estado
            <select data-campo="estado">${ESTADOS_DEMO.map((e) => `<option${e === estado ? " selected" : ""}>${e}</option>`).join("")}</select>
          </label>
          <label class="campo">Fecha de envío <input type="date" data-campo="enviada" value="${html(g.enviada || "")}"></label>
          <label class="campo ancho">Notas <textarea data-campo="notas" placeholder="Ej: hablé con la dueña, quiere verlo con su socio">${html(g.notas || "")}</textarea></label>
        </div>
        ${estado === "Aceptó" ? `<a class="btn btn-sm" href="cliente.html">+ Crear ficha de cliente</a>` : ""}
      </details>
    </div>
  </article>`;
}

function pintar() {
  cifras();
  const cuenta = (e) => DEMOS.filter((d) => estadoDe(d) === e).length;
  $("chips").innerHTML = ["Todas", ...ESTADOS_DEMO]
    .filter((e) => e === "Todas" || cuenta(e))
    .map((e) => `<button class="chip" data-filtro="${e}" aria-pressed="${e === filtro}">${e}<b>${e === "Todas" ? DEMOS.length : cuenta(e)}</b></button>`)
    .join("");

  // Primero las que tocan seguimiento, después por fecha de creación
  const visibles = DEMOS
    .filter((d) => filtro === "Todas" || estadoDe(d) === filtro)
    .sort((a, b) => tocaSeguimiento(b) - tocaSeguimiento(a) || b.creada.localeCompare(a.creada));
  $("lista").innerHTML = visibles.map(tarjeta).join("");
  $("vacio").hidden = visibles.length > 0;
  $("vacio").textContent = "No hay demos en este estado.";
}

// ===== Eventos =====
$("chips").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-filtro]");
  if (!chip) return;
  filtro = chip.dataset.filtro;
  pintar();
});

$("lista").addEventListener("click", async (e) => {
  const boton = e.target.closest("[data-accion]");
  if (!boton) return;
  const d = DEMOS.find((x) => x.id === boton.closest("[data-id]").dataset.id);
  const accion = boton.dataset.accion;
  if (accion === "copiar-link") copiar(enlace(d), "Link");
  if (accion === "copiar-mensaje") copiar(`${d.mensaje}\n\n${enlace(d)}`, "Mensaje");
  if (accion === "copiar-seguimiento") copiar(d.seguimiento, "Seguimiento");
  if (accion === "seguimiento-listo") {
    await guardar(d.id, { seguimientoEnviado: hoyISO() });
    pintar();
  }
  // Al abrir WhatsApp con el mensaje, se marca como enviada si todavía no lo estaba
  if (accion === "whatsapp" && estadoDe(d) === "Por enviar") {
    await guardar(d.id, { estado: "Enviada", enviada: datos[d.id]?.enviada || hoyISO() });
    pintar();
  }
});

$("lista").addEventListener("change", async (e) => {
  const campo = e.target.dataset.campo;
  // La fecha se guarda al salir del campo: el navegador avisa "change" con cada número
  // del año (0002, 0020...) y volver a dibujar la tarjeta cortaba lo que estabas escribiendo
  if (!campo || campo === "enviada") return;
  const id = e.target.closest("[data-id]").dataset.id;
  const cambios = { [campo]: e.target.value };
  // Al marcarla como enviada sin fecha, se pone la de hoy
  if (campo === "estado" && e.target.value === "Enviada" && !datos[id]?.enviada) cambios.enviada = hoyISO();
  await guardar(id, cambios);
  if (campo !== "notas") {
    pintar();
    // Deja abierto el bloque de seguimiento de la tarjeta que se editó
    const abierta = $("lista").querySelector(`[data-id="${id}"] details`);
    if (abierta) abierta.open = true;
  }
});

$("lista").addEventListener("focusout", async (e) => {
  if (e.target.dataset.campo !== "enviada") return;
  const id = e.target.closest("[data-id]").dataset.id;
  const valor = e.target.value;
  if (valor === (datos[id]?.enviada || "")) return;
  if (valor && Number(valor.slice(0, 4)) < 2020) return aviso("Revisa el año de la fecha de envío.", true);
  await guardar(id, { enviada: valor });
  pintar();
  const abierta = $("lista").querySelector(`[data-id="${id}"] details`);
  if (abierta) abierta.open = true;
});

cargar();
