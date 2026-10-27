// Agenda del panel: avisos por correo para Santiago (brief diario, recordatorios de tareas y alertas de clientes).
// Lo usan api/agenda.js (desde el panel), api/brief-diario.js (todos los días) y api/resend-webhook.js (alertas).
const { layout, boton, etiqueta, escapar, COLOR, FUENTE, SITIO } = require("./_correos");
const { resend, REMITENTE, COPIA } = require("./_resend");

const ZONA = "America/Santiago";
const DIA = 24 * 60 * 60 * 1000;
const PANEL = `${SITIO}/panel`;
const CATEGORIAS = { Clientes: "👤", Marketing: "📣", Administración: "🧾", Personal: "🌱" };

// Lo que se puede cambiar en Agenda → Avisos por correo (documento ajustes/agenda)
const AJUSTES = { brief: true, briefDias: "habiles", recordatorios: true, antes: 15, alertas: true };
async function leerAjustes(base) {
  const snap = await base.collection("ajustes").doc("agenda").get();
  return { ...AJUSTES, ...(snap.data() || {}) };
}

// ===== Fechas en hora de Chile =====
const hoyChile = (fecha = new Date()) => fecha.toLocaleDateString("en-CA", { timeZone: ZONA }); // "2026-10-27"
const sumarDias = (iso, n) => new Date(Date.parse(iso + "T12:00:00Z") + n * DIA).toISOString().slice(0, 10);
const diasEntre = (desde, hasta) => Math.round((Date.parse(hasta) - Date.parse(desde)) / DIA);
const diaSemana = (iso) => new Date(iso + "T12:00:00Z").getUTCDay(); // 0 domingo
const fechaTexto = (iso, opciones = { weekday: "long", day: "numeric", month: "long" }) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("es-CL", { ...opciones, timeZone: "UTC" });
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Diferencia entre la hora de Chile y UTC en un instante (cambia con el horario de verano)
function desfase(ms) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
  }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
}
// "2026-10-27" + "15:00" en Chile → instante exacto
function instanteChile(fecha, hora) {
  const [a, m, d] = fecha.split("-").map(Number);
  const [h, mi] = hora.split(":").map(Number);
  const local = Date.UTC(a, m - 1, d, h, mi);
  return new Date(local - desfase(local - desfase(local)));
}

// ===== Piezas de los correos =====
const h1 = (t) => `<h1 style="${FUENTE}margin:14px 0 4px;font-size:24px;line-height:1.3;color:${COLOR.texto};">${t}</h1>`;
const seccion = (t, color = COLOR.suave) =>
  `<p style="margin:26px 0 8px;font-size:12px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.08em;">${t}</p>`;
const filas = (items) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLOR.borde};border-radius:12px;border-collapse:separate;">
    ${items.map(([icono, texto, detalle], i) => `
    <tr>
      <td width="40" style="${FUENTE}vertical-align:top;padding:12px 0 12px 14px;font-size:17px;${i ? `border-top:1px solid ${COLOR.borde};` : ""}">${icono}</td>
      <td style="${FUENTE}vertical-align:top;padding:12px 14px 12px 4px;font-size:15px;color:${COLOR.texto};${i ? `border-top:1px solid ${COLOR.borde};` : ""}">${texto}${detalle ? `<br><span style="font-size:13px;color:${COLOR.suave};">${detalle}</span>` : ""}</td>
    </tr>`).join("")}
  </table>`;
const cifras = (datos) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border-collapse:separate;border-spacing:0;">
    <tr>${datos.map(([n, t, color], i) => `
      <td width="${Math.floor(100 / datos.length)}%" style="${FUENTE}padding:14px 12px;background:#f6f7fb;border-radius:12px;text-align:center;${i ? "border-left:6px solid #ffffff;" : ""}">
        <span style="display:block;font-size:26px;font-weight:800;line-height:1.2;color:${color || COLOR.texto};">${n}</span>
        <span style="font-size:12px;color:${COLOR.suave};">${t}</span>
      </td>`).join("")}
    </tr>
  </table>`;
const pieAvisos = `Te llega porque activaste los avisos en tu <a href="${PANEL}/agenda.html" style="color:${COLOR.primario};text-decoration:none;">Agenda</a>. Puedes cambiarlos en "Avisos por correo".`;

const nombreCliente = (c) => escapar(c?.negocio || c?.nombre || "Cliente");
const enlaceCliente = (id, c) => `<a href="${PANEL}/cliente.html?id=${encodeURIComponent(id)}" style="color:${COLOR.texto};font-weight:600;text-decoration:none;">${nombreCliente(c)}</a>`;
const contactoCliente = (c) => {
  const wa = String(c?.telefono || "").replace(/\D/g, "");
  return [
    wa.length >= 8 ? `<a href="https://wa.me/${wa}" style="color:#1a9e52;text-decoration:none;">WhatsApp</a>` : "",
    c?.email ? `<a href="mailto:${escapar(c.email)}" style="color:${COLOR.primario};text-decoration:none;">${escapar(c.email)}</a>` : ""
  ].filter(Boolean).join(" · ");
};

// Correo para Santiago, sin copia oculta (ya le llega a su bandeja)
const avisarme = (asunto, html, extra = {}) =>
  resend("/emails", { from: REMITENTE, to: COPIA, subject: asunto, html, ...extra });

// ===== Recordatorio de una tarea con hora =====
function armarRecordatorio(t, cliente, antes) {
  const cuando = antes ? `En ${antes} minutos` : "Ahora";
  const detalle = [CATEGORIAS[t.categoria] ? t.categoria : "", t.importante ? "Importante" : ""].filter(Boolean).join(" · ");
  const contenido = `
    ${etiqueta("Recordatorio")}
    ${h1(`${t.importante ? "★ " : ""}${escapar(t.titulo)}`)}
    <p style="margin:0 0 20px;color:${COLOR.suave};">${cuando} · ${escapar(fechaTexto(t.fecha))}, ${escapar(t.hora)}${detalle ? ` · ${escapar(detalle)}` : ""}</p>
    ${t.notas ? `<div style="margin:0 0 20px;padding:14px 16px;background:#f6f7fb;border-left:4px solid ${COLOR.primario};border-radius:8px;">${escapar(t.notas).replace(/\n/g, "<br>")}</div>` : ""}
    ${cliente ? filas([["👤", enlaceCliente(t.clienteId, cliente), contactoCliente(cliente)]]) : ""}
    <div style="margin-top:22px;">${boton(`${PANEL}/agenda.html`, "Abrir agenda")}</div>`;
  return {
    asunto: `⏰ ${t.hora} · ${t.titulo}`,
    html: layout({ preheader: `${cuando}: ${t.titulo}`, contenido, pie: pieAvisos })
  };
}

// Deja el recordatorio de la tarea programado en Resend según lo que dice ahora (o lo cancela).
// Resend programa hasta 30 días antes: las tareas más lejanas las programa después el brief diario.
async function sincronizarRecordatorio(ref, t, ajustes, cliente) {
  const antes = Number(ajustes.antes) || 0;
  const cuando = t.fecha && t.hora && !t.hecha && ajustes.recordatorios !== false
    ? new Date(instanteChile(t.fecha, t.hora).getTime() - antes * 60000) : null;
  const vale = cuando && cuando.getTime() > Date.now() + 60000 && cuando.getTime() < Date.now() + 29 * DIA;
  const clave = vale ? [t.titulo, t.notas, t.fecha, t.hora, t.clienteId, t.importante, antes].join("|") : "";
  const actual = t.recordatorio;
  if (actual?.clave && actual.clave === clave) return actual;

  if (actual?.id && Date.parse(actual.fecha) > Date.now()) {
    await resend(`/emails/${actual.id}/cancel`).catch((err) => console.error("No se pudo cancelar", actual.id, err.message));
  }
  let nuevo = null;
  if (vale) {
    const { asunto, html } = armarRecordatorio(t, cliente, antes);
    const { id } = await avisarme(asunto, html, { scheduled_at: cuando.toISOString() });
    nuevo = { id, fecha: cuando.toISOString(), clave };
  }
  if (actual || nuevo) await ref.update({ recordatorio: nuevo });
  return nuevo;
}

// ===== Brief diario =====
// Primera idea sin hacer de posts/ideas.md (la lista de posts de Instagram)
async function ideaInstagram() {
  try {
    const r = await fetch(`${SITIO}/posts/ideas.md`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return "";
    return (await r.text()).match(/^- \[ \] (.+)$/m)?.[1].trim() || "";
  } catch {
    return "";
  }
}

// datos: { hoy, tareas, clientes (con id), correos (recientes, con id), idea }
function armarBrief({ hoy, tareas, clientes, correos, idea = "" }) {
  const porId = Object.fromEntries(clientes.map((c) => [c.id, c]));
  const pendientes = tareas.filter((t) => !t.hecha);
  const lunes = diaSemana(hoy) === 1;
  const fin = sumarDias(hoy, 7);
  const textoTarea = (t) => `${t.importante ? "★ " : ""}${escapar(t.titulo)}`;
  const detalleTarea = (t, conFecha) => [
    conFecha ? fechaTexto(t.fecha, { weekday: "short", day: "numeric", month: "short" }) : "",
    t.hora, t.categoria, porId[t.clienteId] ? nombreCliente(porId[t.clienteId]) : ""
  ].filter(Boolean).join(" · ");
  const porHora = (a, b) => (a.hora || "99").localeCompare(b.hora || "99") || Number(b.importante) - Number(a.importante);

  const atrasadas = pendientes.filter((t) => t.fecha && t.fecha < hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const deHoy = pendientes.filter((t) => t.fecha === hoy).sort(porHora);
  const desarrollo = clientes.filter((c) => c.estado === "En desarrollo");
  const entregasAtrasadas = desarrollo.filter((c) => c.entrega && c.entrega < hoy);
  const entregasHoy = desarrollo.filter((c) => c.entrega === hoy);
  const dominios = clientes.filter((c) => c.vence && c.vence >= hoy && diasEntre(hoy, c.vence) <= 30).sort((a, b) => a.vence.localeCompare(b.vence));
  const seguimientos = clientes.filter((c) => c.estado === "Cotizando").flatMap((c) =>
    (c.seguimientos || []).filter((s) => hoyChile(new Date(s.fecha)) === hoy).map((s) => [c, s]));
  const interes = correos.filter((c) => porId[c.clienteId] && ["abierto", "clic", "rebotado", "spam"].includes(c.estado));

  const sectionAtrasado = [
    ...entregasAtrasadas.map((c) => ["⚠️", `Entrega atrasada de ${enlaceCliente(c.id, c)}`, `Era el ${fechaTexto(c.entrega, { day: "numeric", month: "long" })}`]),
    ...atrasadas.map((t) => ["⏳", textoTarea(t), detalleTarea(t, true)])
  ];
  const sectionHoy = [
    ...entregasHoy.map((c) => ["📦", `Entrega de ${enlaceCliente(c.id, c)}`, "Hoy"]),
    ...deHoy.map((t) => [t.hora ? "🕒" : CATEGORIAS[t.categoria] || "☐", textoTarea(t), detalleTarea(t, false)]),
    ...seguimientos.map(([c, s]) => ["✉️", `Sale el seguimiento a ${enlaceCliente(c.id, c)}`, escapar(s.asunto)]),
    ...dominios.filter((c) => diasEntre(hoy, c.vence) <= 7).map((c) => ["🌐", `Dominio de ${enlaceCliente(c.id, c)} vence ${diasEntre(hoy, c.vence) === 0 ? "hoy" : `en ${diasEntre(hoy, c.vence)} días`}`, escapar(c.sitio || "")])
  ];
  const sectionInteres = interes.map((c) => {
    const cl = porId[c.clienteId];
    const malo = c.estado === "rebotado" || c.estado === "spam";
    const que = malo ? "no recibió" : c.estado === "clic" ? "hizo clic en" : `abrió${c.aperturas > 1 ? ` (${c.aperturas} veces)` : ""}`;
    return [malo ? "🚫" : c.estado === "clic" ? "🔥" : "👀", `${enlaceCliente(c.clienteId, cl)} ${que} “${escapar(c.asunto)}”`, malo ? "Revisa su correo" : contactoCliente(cl)];
  });
  const semana = [];
  for (let i = 1; i <= 6; i++) {
    const dia = sumarDias(hoy, i);
    const cosas = [
      ...desarrollo.filter((c) => c.entrega === dia).map((c) => `📦 Entrega ${nombreCliente(c)}`),
      ...pendientes.filter((t) => t.fecha === dia).sort(porHora).map((t) => `${t.hora ? t.hora + " " : ""}${textoTarea(t)}`),
      ...dominios.filter((c) => c.vence === dia).map((c) => `🌐 Vence dominio ${nombreCliente(c)}`)
    ];
    if (cosas.length) semana.push(["📅", `<strong>${escapar(mayuscula(fechaTexto(dia, { weekday: "long", day: "numeric" })))}</strong>`, cosas.join(" · ")]);
  }
  const dominiosMes = dominios.filter((c) => diasEntre(hoy, c.vence) > 7);
  const sinFecha = pendientes.filter((t) => !t.fecha);

  const vacio = !sectionAtrasado.length && !sectionHoy.length && !sectionInteres.length && !semana.length;
  const resumen = [
    deHoy.length + entregasHoy.length ? `${deHoy.length + entregasHoy.length} para hoy` : "nada agendado para hoy",
    sectionAtrasado.length ? `${sectionAtrasado.length} atrasad${sectionAtrasado.length === 1 ? "a" : "as"}` : "",
    sectionInteres.length ? `${sectionInteres.length} ${sectionInteres.length === 1 ? "cliente movió" : "clientes movieron"} un correo` : ""
  ].filter(Boolean).join(" · ");

  const contenido = `
    ${etiqueta(lunes ? "Tu semana" : "Tu día")}
    ${h1("Buenos días, Santiago")}
    <p style="margin:0;color:${COLOR.suave};">${escapar(mayuscula(fechaTexto(hoy)))}</p>
    ${cifras([
      [deHoy.length + entregasHoy.length, "para hoy"],
      [sectionAtrasado.length, "atrasadas", sectionAtrasado.length ? "#c8372d" : ""],
      [clientes.filter((c) => c.estado === "Cotizando").length, "cotizando"],
      [desarrollo.length, "en desarrollo"]
    ])}
    ${sectionAtrasado.length ? seccion("Atrasado", "#c8372d") + filas(sectionAtrasado) : ""}
    ${seccion("Hoy")}${sectionHoy.length ? filas(sectionHoy) : `<p style="margin:0;color:${COLOR.suave};">No tienes nada agendado para hoy. Buen momento para avanzar en lo pendiente${sinFecha.length ? ` (${sinFecha.length} sin fecha)` : ""}.</p>`}
    ${sectionInteres.length ? seccion(lunes ? "Movimiento del fin de semana" : "Desde ayer") + filas(sectionInteres) : ""}
    ${semana.length ? seccion(lunes ? "Esta semana" : "Próximos días") + filas(semana) : ""}
    ${dominiosMes.length ? seccion("Dominios este mes") + filas(dominiosMes.map((c) => ["🌐", enlaceCliente(c.id, c), `Vence el ${fechaTexto(c.vence, { day: "numeric", month: "long" })} · en ${diasEntre(hoy, c.vence)} días`])) : ""}
    ${idea ? seccion("Idea para Instagram") + filas([["📸", escapar(idea), "La siguiente sin hacer en posts/ideas.md"]]) : ""}
    <div style="margin-top:26px;">${boton(`${PANEL}/agenda.html`, "Abrir agenda")}${boton(`${PANEL}/`, "Ver clientes", COLOR.texto)}</div>`;

  return {
    vacio,
    asunto: `${lunes ? "Tu semana" : "Tu día"} · ${mayuscula(fechaTexto(hoy, { weekday: "long", day: "numeric", month: "short" }).replace(",", ""))} · ${resumen}`,
    html: layout({ preheader: resumen, contenido, pie: pieAvisos })
  };
}

// ===== Alerta: un cliente hizo clic o un correo no llegó (desde el webhook de Resend) =====
function armarAlerta(estado, correo, clienteId, cliente) {
  const malo = estado === "rebotado" || estado === "spam";
  const titulo = malo
    ? `Tu correo a ${nombreCliente(cliente)} ${estado === "spam" ? "fue marcado como spam" : "no llegó"}`
    : `${nombreCliente(cliente)} hizo clic en tu correo`;
  const contenido = `
    ${etiqueta(malo ? "Correo no entregado" : "Cliente interesado")}
    ${h1(titulo)}
    <p style="margin:0 0 20px;color:${COLOR.suave};">“${escapar(correo.asunto)}” · enviado a ${escapar(correo.para || cliente?.email || "")}</p>
    ${filas([["👤", enlaceCliente(clienteId, cliente), contactoCliente(cliente) || "Sin datos de contacto"]])}
    <p style="margin:20px 0 0;">${malo
      ? "Revisa que su dirección esté bien escrita o escríbele por otro medio."
      : "Es buen momento para escribirle: está mirando lo que le enviaste."}</p>
    <div style="margin-top:22px;">${boton(`${PANEL}/cliente.html?id=${encodeURIComponent(clienteId)}`, "Abrir ficha del cliente")}</div>`;
  const plano = titulo.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[e]);
  return { asunto: `${malo ? "⚠️" : "🔥"} ${plano}`, html: layout({ preheader: correo.asunto, contenido, pie: pieAvisos }) };
}

// ===== Lectura desde Firestore =====
// Todo lo que necesita el brief de hoy. Los correos son los que tuvieron movimiento desde el brief anterior
// (24 horas, o desde el viernes si es lunes).
async function datosBrief(base, hoy = hoyChile()) {
  const desde = new Date(Date.now() - (diaSemana(hoy) === 1 ? 3 : 1) * DIA);
  const [tareas, clientes, correos, idea] = await Promise.all([
    base.collection("tareas").get(),
    base.collection("clientes").get(),
    base.collection("correos").where("ultimoEvento", ">=", desde).get(),
    ideaInstagram()
  ]);
  const lista = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { hoy, tareas: lista(tareas), clientes: lista(clientes), correos: lista(correos), idea, refs: tareas.docs };
}

// Programa los recordatorios que faltan (tareas que entraron en los 30 días de Resend) y quita los de tareas listas
async function programarPendientes(datos, ajustes) {
  const porId = Object.fromEntries(datos.clientes.map((c) => [c.id, c]));
  const resultado = { programados: 0, errores: [] };
  for (const ref of datos.refs) {
    const t = ref.data();
    if (!t.fecha || !t.hora || (t.hecha && !t.recordatorio)) continue;
    try {
      const antes = t.recordatorio?.id;
      const nuevo = await sincronizarRecordatorio(ref.ref, t, ajustes, porId[t.clienteId]);
      if (nuevo && nuevo.id !== antes) resultado.programados++;
    } catch (err) {
      console.error(t.titulo, err);
      resultado.errores.push({ tarea: t.titulo, error: err.message });
    }
  }
  return resultado;
}

module.exports = {
  AJUSTES, leerAjustes, hoyChile, sumarDias, diaSemana, instanteChile, datosBrief, programarPendientes,
  avisarme, sincronizarRecordatorio, armarRecordatorio, ideaInstagram, armarBrief, armarAlerta
};
