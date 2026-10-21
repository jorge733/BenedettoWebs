// Función de Vercel que corre sola una vez al día (vercel.json → crons).
// Revisa la fecha "Dominio vence" de cada cliente y le envía la plantilla "dominio" 30 y 7 días antes.
// Cada aviso sale una sola vez por fecha de vencimiento: si renuevas y cambias la fecha en el panel, vuelven a salir el próximo año.
// Con ?prueba=1 solo responde lo que enviaría, sin enviar nada.
// Variables de entorno en Vercel: CRON_SECRET (Vercel la usa para llamar a esta función), FIREBASE_SERVICE_ACCOUNT, RESEND_API_KEY.
const { armar } = require("./_plantillas");
const { enviar } = require("./_resend");
const { db, FieldValue } = require("./_firestore");

const AVISOS = [30, 7]; // días antes del vencimiento
const DIA = 24 * 60 * 60 * 1000;
const correoValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e || "");
// "2027-10-20" → "20 de octubre de 2027"
const fechaLarga = (iso) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

module.exports = async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }
  const prueba = String(req.query?.prueba || "") === "1";
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" }); // "2026-10-21"

  const base = db();
  const snap = await base.collection("clientes").get();
  const enviados = [], omitidos = [], errores = [];

  for (const docCliente of snap.docs) {
    const c = docCliente.data();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.vence || "")) continue;
    const dias = Math.round((Date.parse(c.vence) - Date.parse(hoy)) / DIA);
    // El aviso más cercano que ya corresponde: a 25 días toca el de 30, a 5 días el de 7
    const aviso = AVISOS.filter((a) => dias >= 0 && dias <= a).sort((a, b) => a - b)[0];
    if (!aviso) continue;
    const ya = c.avisosDominio?.vence === c.vence ? c.avisosDominio.enviados || [] : [];
    if (ya.includes(aviso)) continue;

    const quien = c.negocio || c.nombre || docCliente.id;
    if (!correoValido(c.email) || !c.sitio) {
      omitidos.push({ cliente: quien, dias, motivo: !c.sitio ? "sin sitio web" : "sin correo" });
      continue;
    }
    const { asunto, html } = armar("dominio", {
      nombre: (c.nombre || "").split(" ")[0] || "¿cómo estás?",
      negocio: c.negocio || "",
      dominio: c.sitio,
      vence: fechaLarga(c.vence)
    });
    if (prueba) {
      enviados.push({ cliente: quien, para: c.email, dias, aviso, asunto });
      continue;
    }
    try {
      const { id } = await enviar(c.email, asunto, html);
      await docCliente.ref.update({ avisosDominio: { vence: c.vence, enviados: [...ya, aviso] } });
      await base.collection("correos").add({
        clienteId: docCliente.id, plantilla: "dominio", nombre: `Aviso automático (${aviso} días)`,
        asunto, para: c.email, resendId: id, estado: "enviado", automatico: true, enviado: FieldValue.serverTimestamp()
      });
      enviados.push({ cliente: quien, para: c.email, dias, aviso });
    } catch (err) {
      console.error(quien, err);
      errores.push({ cliente: quien, error: err.message });
    }
  }

  console.log(JSON.stringify({ hoy, prueba, enviados, omitidos, errores }));
  res.status(200).json({ ok: errores.length === 0, hoy, prueba, enviados, omitidos, errores });
};
