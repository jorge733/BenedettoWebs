// Función de Vercel: recibe el formulario de cotización y envía dos correos con Resend.
// Variables de entorno en Vercel: RESEND_API_KEY (obligatoria).
const { correoAviso, correoConfirmacion, texto } = require("./_correos");

const CONTACTO = {
  email: "sabenedettoa@benedettowebs.cl",
  whatsapp: "+56932698141",
  instagram: "benedettowebs"
};
const REMITENTE = "Santiago de BenedettoWebs <cotizaciones@benedettowebs.cl>";

const LIMITES = { nombre: 80, negocio: 120, email: 120, telefono: 30, tipo: 80, incluir: 300, plazo: 60, contenido: 60, mensaje: 3000 };
const limpiar = (v, max) => String(Array.isArray(v) ? v.join(", ") : v ?? "").trim().slice(0, max);
const correoValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

const enviar = (correo) =>
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(correo)
  }).then(async (r) => {
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  });

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ ok: false, error: "Datos inválidos" }); }
  }
  // Campo trampa: si viene lleno es un bot, respondemos ok sin enviar nada
  if (body._honey) return res.status(200).json({ ok: true });

  const c = Object.fromEntries(Object.entries(LIMITES).map(([k, max]) => [k, limpiar(body[k], max)]));
  if (!c.nombre || !c.mensaje || !correoValido(c.email)) {
    return res.status(400).json({ ok: false, error: "Faltan datos o el correo no es válido" });
  }
  if (!process.env.RESEND_API_KEY) {
    console.error("Falta RESEND_API_KEY");
    return res.status(500).json({ ok: false, error: "Correo no configurado" });
  }

  try {
    await enviar({
      from: REMITENTE,
      to: CONTACTO.email,
      reply_to: c.email,
      subject: `Nueva cotización: ${c.nombre}${c.negocio ? " · " + c.negocio : ""}`,
      html: correoAviso(c),
      text: texto(c)
    });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: "No se pudo enviar" });
  }

  // La confirmación al cliente es un extra: si falla, la solicitud igual llegó
  try {
    await enviar({
      from: REMITENTE,
      to: c.email,
      reply_to: CONTACTO.email,
      subject: "Recibí tu solicitud de cotización · BenedettoWebs",
      html: correoConfirmacion(c, CONTACTO),
      text: `¡Gracias, ${c.nombre}! Recibí tu solicitud de cotización y te respondo a la brevedad con un precio cerrado.\n\n${texto(c)}\n\nSantiago Benedetto · BenedettoWebs\nWhatsApp: ${CONTACTO.whatsapp}`
    });
  } catch (err) {
    console.error(err);
  }

  res.status(200).json({ ok: true });
};
