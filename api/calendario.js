// Función de Vercel: la agenda como calendario .ics para suscribirse desde Google Calendar o el calendario del iPhone.
// GET /api/calendario?t=TOKEN → tareas pendientes con fecha (con su repetición y alarma), entregas y vencimientos de dominio.
// El token lo crea el panel (Agenda → Avisos por correo → Calendario del celular) y se guarda en ajustes/agenda.calendarioToken.
// Cambiar el enlace en el panel deja de funcionar el anterior. Variable de entorno: FIREBASE_SERVICE_ACCOUNT.
const crypto = require("crypto");
const { db } = require("./_firestore");
const { leerAjustes, hoyChile, sumarDias } = require("./_agenda");

const PANEL = "https://www.benedettowebs.cl/panel";
const ZONA = "America/Santiago";
const REGLAS = {
  diaria: "FREQ=DAILY", habiles: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", semanal: "FREQ=WEEKLY",
  quincenal: "FREQ=WEEKLY;INTERVAL=2", mensual: "FREQ=MONTHLY"
};

// Texto dentro de un campo .ics: escapa \ ; , y saltos de línea
const texto = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Líneas de máximo 75 bytes; las que siguen empiezan con un espacio (RFC 5545)
function doblar(linea) {
  const partes = [];
  let actual = "";
  for (const ch of linea) {
    if (Buffer.byteLength(actual + ch) > (partes.length ? 74 : 75)) {
      partes.push(actual);
      actual = "";
    }
    actual += ch;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}
const dia = (iso) => iso.replace(/-/g, "");
const esFecha = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso || "");
const esHora = (h) => /^\d{2}:\d{2}$/.test(h || "");

function evento({ uid, fecha, hora, titulo, notas, repetir, alarma }) {
  const sello = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  return [
    "BEGIN:VEVENT",
    `UID:${uid}@benedettowebs.cl`,
    `DTSTAMP:${sello}`,
    ...(hora
      ? [`DTSTART;TZID=${ZONA}:${dia(fecha)}T${hora.replace(":", "")}00`, "DURATION:PT30M"]
      : [`DTSTART;VALUE=DATE:${dia(fecha)}`, `DTEND;VALUE=DATE:${dia(sumarDias(fecha, 1))}`]),
    `SUMMARY:${texto(titulo)}`,
    notas ? `DESCRIPTION:${texto(notas)}` : "",
    `URL:${PANEL}/agenda.html`,
    REGLAS[repetir] ? `RRULE:${REGLAS[repetir]}` : "",
    ...(alarma !== null && hora
      ? ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${texto(titulo)}`, `TRIGGER:-PT${alarma}M`, "END:VALARM"]
      : []),
    "END:VEVENT"
  ].filter(Boolean);
}

module.exports = async (req, res) => {
  const token = String(req.query?.t || "");
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(404).send("No encontrado");

  let ajustes, tareas, clientes;
  try {
    const base = db();
    [ajustes, tareas, clientes] = await Promise.all([
      leerAjustes(base), base.collection("tareas").get(), base.collection("clientes").get()
    ]);
  } catch (err) {
    console.error(err);
    return res.status(502).send("No se pudo leer la agenda");
  }
  const guardado = Buffer.from(String(ajustes.calendarioToken || ""));
  const recibido = Buffer.from(token);
  if (guardado.length !== recibido.length || !crypto.timingSafeEqual(guardado, recibido)) return res.status(404).send("No encontrado");

  const porId = Object.fromEntries(clientes.docs.map((d) => [d.id, d.data()]));
  const nombre = (c) => c?.negocio || c?.nombre || "Cliente";
  const hoy = hoyChile();
  const alarma = Number(ajustes.antes) || 0;
  const lineas = [];

  for (const d of tareas.docs) {
    const t = d.data();
    if (t.hecha || !esFecha(t.fecha)) continue;
    const c = porId[t.clienteId];
    lineas.push(...evento({
      uid: `tarea-${d.id}`, fecha: t.fecha, hora: esHora(t.hora) ? t.hora : "", repetir: t.repetir, alarma,
      titulo: `${t.importante ? "★ " : ""}${t.titulo}${c ? ` · ${nombre(c)}` : ""}`,
      notas: [t.notas, t.categoria ? `Categoría: ${t.categoria}` : "", c ? `Cliente: ${PANEL}/cliente.html?id=${t.clienteId}` : ""].filter(Boolean).join("\n")
    }));
  }
  for (const [id, c] of Object.entries(porId)) {
    if (c.estado === "En desarrollo" && esFecha(c.entrega)) {
      lineas.push(...evento({ uid: `entrega-${id}-${c.entrega}`, fecha: c.entrega, titulo: `📦 Entrega · ${nombre(c)}`, notas: `${PANEL}/cliente.html?id=${id}` }));
    }
    if (esFecha(c.vence) && c.vence >= sumarDias(hoy, -30)) {
      lineas.push(...evento({ uid: `dominio-${id}-${c.vence}`, fecha: c.vence, titulo: `🌐 Vence dominio · ${nombre(c)}`, notas: [c.sitio, `${PANEL}/cliente.html?id=${id}`].filter(Boolean).join("\n") }));
    }
  }

  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BenedettoWebs//Agenda//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Agenda BenedettoWebs", `X-WR-TIMEZONE:${ZONA}`, "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H",
    ...lineas, "END:VCALENDAR"
  ].map(doblar).join("\r\n") + "\r\n";

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="agenda.ics"');
  res.setHeader("Cache-Control", "private, max-age=300");
  res.status(200).send(ics);
};
