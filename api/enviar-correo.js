// Función de Vercel: el panel envía correos a clientes con las plantillas de api/_plantillas.js.
// GET  → lista de plantillas y sus campos.
// POST → { plantilla, para, datos, enviar, seguimiento }: con enviar=false devuelve la vista previa; con true envía con Resend.
//        Si es una cotización y seguimiento=true, deja programados los correos de SEGUIMIENTOS.
// POST → { cancelar: [ids] }: cancela seguimientos programados que todavía no se envían.
// Solo responde a quien inició sesión en el panel con una de las cuentas permitidas.
// Variables de entorno en Vercel: RESEND_API_KEY (la misma del formulario de cotización).
const { catalogo, camposDe, armar, PLANTILLAS } = require("./_plantillas");

const PERMITIDOS = ["sabenedettoa@gmail.com", "sabenedettoa@benedettowebs.cl"];
const REMITENTE = "Santiago Benedetto <sabenedettoa@benedettowebs.cl>";
const COPIA = "sabenedettoa@benedettowebs.cl";
// Clave pública de la app web de Firebase (la misma de panel/firebase.js): solo sirve para validar la sesión
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyDnNaJWH3PMpex5B3vlCMPR96CHZRSXDqI";
// Correos que salen solos después de enviar una cotización (días después, a las 10:00 aprox. de Chile)
const SEGUIMIENTOS = [
  { dias: 3, plantilla: "seguimiento" },
  { dias: 7, plantilla: "seguimiento2" }
];

const correoValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

// Valida el token de sesión de Firebase con Google y devuelve el correo de quien lo envió
async function usuario(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });
  if (!r.ok) return null;
  const u = (await r.json()).users?.[0];
  return u?.emailVerified && PERMITIDOS.includes(u.email) ? u.email : null;
}

const resend = (ruta, cuerpo) =>
  fetch(`https://api.resend.com${ruta}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: cuerpo && JSON.stringify(cuerpo)
  }).then(async (r) => {
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
    return r.json();
  });

// Copia oculta a tu correo para que el envío quede en tu bandeja
const enviar = (para, asunto, html, extra = {}) =>
  resend("/emails", { from: REMITENTE, to: para, bcc: COPIA, reply_to: COPIA, subject: asunto, html, ...extra });

async function programarSeguimientos(para, datos) {
  const fecha = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", timeZone: "America/Santiago" });
  const programados = [];
  for (const s of SEGUIMIENTOS) {
    const cuando = new Date();
    cuando.setUTCDate(cuando.getUTCDate() + s.dias);
    cuando.setUTCHours(13, 0, 0, 0);
    const { asunto, html } = armar(s.plantilla, { nombre: datos.nombre, negocio: datos.negocio, fecha });
    try {
      const { id } = await enviar(para, asunto, html, { scheduled_at: cuando.toISOString() });
      programados.push({ id, asunto, fecha: cuando.toISOString() });
    } catch (err) {
      console.error(err);
    }
  }
  return programados;
}

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }
  try {
    if (!(await usuario(req))) return res.status(401).json({ ok: false, error: "Inicia sesión en el panel" });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: "No se pudo validar la sesión" });
  }

  if (req.method === "GET") return res.status(200).json({ ok: true, plantillas: catalogo() });

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ ok: false, error: "Datos inválidos" }); }
  }
  if (!process.env.RESEND_API_KEY && (body.enviar || body.cancelar)) {
    console.error("Falta RESEND_API_KEY");
    return res.status(500).json({ ok: false, error: "Correo no configurado" });
  }

  if (Array.isArray(body.cancelar)) {
    const ids = body.cancelar.map(String).filter((id) => /^[\w-]{8,64}$/.test(id)).slice(0, 10);
    const cancelados = [];
    for (const id of ids) {
      try {
        await resend(`/emails/${id}/cancel`);
        cancelados.push(id);
      } catch (err) {
        console.error(err); // Ya se envió o ya estaba cancelado
      }
    }
    return res.status(200).json({ ok: true, cancelados });
  }

  const id = String(body.plantilla || "");
  if (!Object.hasOwn(PLANTILLAS, id)) return res.status(400).json({ ok: false, error: "Plantilla desconocida" });

  const datos = Object.fromEntries(
    camposDe(id).map((c) => [c.id, String(body.datos?.[c.id] ?? "").trim().slice(0, 3000)])
  );
  const { asunto, html, faltan } = armar(id, datos);
  if (!body.enviar) return res.status(200).json({ ok: true, asunto, html, faltan });

  const para = String(body.para || "").trim();
  if (!correoValido(para)) return res.status(400).json({ ok: false, error: "El correo del cliente no es válido" });
  if (faltan.length) return res.status(400).json({ ok: false, error: "Falta completar: " + faltan.join(", ") });

  let enviado;
  try {
    enviado = await enviar(para, asunto, html);
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: "No se pudo enviar el correo" });
  }
  // Si fallan los seguimientos, la cotización igual se envió
  const seguimientos = id === "cotizacion" && body.seguimiento ? await programarSeguimientos(para, datos) : [];
  res.status(200).json({ ok: true, asunto, id: enviado.id, seguimientos });
};
