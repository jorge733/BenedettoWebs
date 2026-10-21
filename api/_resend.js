// Envío con Resend, compartido por las funciones que mandan correos a clientes.
// Variables de entorno en Vercel: RESEND_API_KEY.
const REMITENTE = "Santiago Benedetto <sabenedettoa@benedettowebs.cl>";
const COPIA = "sabenedettoa@benedettowebs.cl";

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

module.exports = { REMITENTE, COPIA, resend, enviar };
