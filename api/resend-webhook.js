// Función de Vercel que recibe los avisos de Resend (webhook): entregado, abierto, clic, rebotado.
// Actualiza el correo correspondiente en la colección "correos" para que el panel muestre si el cliente lo abrió.
// Variables de entorno en Vercel: RESEND_WEBHOOK_SECRET (el "Signing secret" del webhook en Resend), FIREBASE_SERVICE_ACCOUNT.
const crypto = require("crypto");
const { db, FieldValue } = require("./_firestore");
const { leerAjustes, armarAlerta, avisarme } = require("./_agenda");

// Orden de avance: un "entregado" que llega tarde no pisa un "abierto"
const NIVEL = { enviado: 0, entregado: 1, abierto: 2, clic: 3 };
const EVENTOS = {
  "email.delivered": "entregado",
  "email.opened": "abierto",
  "email.clicked": "clic",
  "email.bounced": "rebotado",
  "email.complained": "spam"
};
// Estados que te avisan por correo (las aperturas no: iPhone las marca solas)
const ALERTAS = ["clic", "rebotado", "spam"];

const leerCuerpo = async (req) => {
  const partes = [];
  for await (const parte of req) partes.push(parte);
  return Buffer.concat(partes).toString("utf8");
};

// Firma de Resend (formato Svix): HMAC-SHA256 de "id.timestamp.cuerpo" con el secreto, en base64
function firmaValida(req, cuerpo) {
  const secreto = process.env.RESEND_WEBHOOK_SECRET;
  const id = req.headers["svix-id"], ts = req.headers["svix-timestamp"], firmas = req.headers["svix-signature"];
  if (!secreto || !id || !ts || !firmas) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 5 * 60) return false; // evita reenvíos de avisos viejos
  const esperada = crypto
    .createHmac("sha256", Buffer.from(secreto.replace(/^whsec_/, ""), "base64"))
    .update(`${id}.${ts}.${cuerpo}`)
    .digest();
  return String(firmas).split(" ").some((f) => {
    const [version, valor] = f.split(",");
    const recibida = Buffer.from(valor || "", "base64");
    return version === "v1" && recibida.length === esperada.length && crypto.timingSafeEqual(recibida, esperada);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }
  const cuerpo = await leerCuerpo(req);
  if (!firmaValida(req, cuerpo)) return res.status(401).json({ ok: false, error: "Firma inválida" });

  let evento;
  try { evento = JSON.parse(cuerpo); } catch { return res.status(400).json({ ok: false }); }
  const estado = EVENTOS[evento.type];
  const emailId = evento.data?.email_id;
  if (!estado || !emailId) return res.status(200).json({ ok: true, ignorado: true });

  const snap = await db().collection("correos").where("resendId", "==", emailId).limit(1).get();
  if (snap.empty) return res.status(200).json({ ok: true, ignorado: true }); // correo que no salió del panel

  const ref = snap.docs[0].ref;
  const actual = snap.docs[0].data();
  const cambios = { ultimoEvento: FieldValue.serverTimestamp() };
  if (estado === "abierto") {
    cambios.aperturas = FieldValue.increment(1);
    cambios.ultimaApertura = FieldValue.serverTimestamp();
  }
  if (estado === "clic") cambios.ultimaApertura = FieldValue.serverTimestamp();
  // Rebote y spam se muestran siempre y no se pisan; el resto solo si avanza
  const fijo = actual.estado && !(actual.estado in NIVEL);
  if (!fijo && (!(estado in NIVEL) || NIVEL[estado] > (NIVEL[actual.estado] ?? 0))) cambios.estado = estado;
  await ref.update(cambios);

  // Alerta por correo la primera vez que el cliente hace clic o que el correo no llega (Agenda → Avisos por correo)
  if (cambios.estado && ALERTAS.includes(estado)) {
    try {
      const base = db();
      const [ajustes, cliente] = await Promise.all([
        leerAjustes(base), base.collection("clientes").doc(actual.clienteId).get().then((d) => d.data())
      ]);
      if (ajustes.alertas && cliente) {
        const { asunto, html } = armarAlerta(estado, actual, actual.clienteId, cliente);
        await avisarme(asunto, html);
      }
    } catch (err) {
      console.error("No se pudo enviar la alerta", err); // El estado del correo ya quedó guardado
    }
  }
  res.status(200).json({ ok: true });
};
