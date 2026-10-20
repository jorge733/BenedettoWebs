// Función de Vercel: el panel envía correos a clientes con las plantillas de api/_plantillas.js.
// GET  → lista de plantillas y sus campos.
// POST → { plantilla, para, datos, enviar }: con enviar=false devuelve la vista previa; con true envía con Resend.
// Solo responde a quien inició sesión en el panel con una de las cuentas permitidas.
// Variables de entorno en Vercel: RESEND_API_KEY (la misma del formulario de cotización).
const { catalogo, camposDe, armar, PLANTILLAS } = require("./_plantillas");

const PERMITIDOS = ["sabenedettoa@gmail.com", "sabenedettoa@benedettowebs.cl"];
const REMITENTE = "Santiago Benedetto <sabenedettoa@benedettowebs.cl>";
const COPIA = "sabenedettoa@benedettowebs.cl";
// Clave pública de la app web de Firebase (la misma de panel/firebase.js): solo sirve para validar la sesión
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyDnNaJWH3PMpex5B3vlCMPR96CHZRSXDqI";

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
  if (!process.env.RESEND_API_KEY) {
    console.error("Falta RESEND_API_KEY");
    return res.status(500).json({ ok: false, error: "Correo no configurado" });
  }

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    // Copia oculta a tu correo para que el envío quede en tu bandeja
    body: JSON.stringify({ from: REMITENTE, to: para, bcc: COPIA, reply_to: COPIA, subject: asunto, html })
  });
  if (!r.ok) {
    console.error(`Resend ${r.status}: ${await r.text()}`);
    return res.status(502).json({ ok: false, error: "No se pudo enviar el correo" });
  }
  res.status(200).json({ ok: true, asunto, id: (await r.json()).id });
};
