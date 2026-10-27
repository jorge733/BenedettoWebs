// Función de Vercel que usa la Agenda del panel para los avisos por correo.
// POST { tareaId }               → programa, cambia o cancela el recordatorio de la tarea según cómo quedó guardada.
// POST { tareaId, borrar: true } → cancela su recordatorio y elimina la tarea.
// POST { brief: "ver" }          → devuelve el brief de hoy (asunto y HTML) sin enviarlo.
// POST { brief: "enviar" }       → envía el brief de hoy ahora, para probarlo.
// Solo responde a quien inició sesión en el panel. Variables: FIREBASE_SERVICE_ACCOUNT, RESEND_API_KEY.
const { usuario } = require("./_sesion");
const { db } = require("./_firestore");
const { leerAjustes, sincronizarRecordatorio, datosBrief, armarBrief, avisarme } = require("./_agenda");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }
  try {
    if (!(await usuario(req))) return res.status(401).json({ ok: false, error: "Inicia sesión en el panel" });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: "No se pudo validar la sesión" });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ ok: false, error: "Datos inválidos" }); }
  }
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Correo no configurado (falta RESEND_API_KEY)" });

  try {
    const base = db();

    if (body.brief === "ver" || body.brief === "enviar") {
      const { asunto, html, vacio } = armarBrief(await datosBrief(base));
      if (body.brief === "ver") return res.status(200).json({ ok: true, asunto, html, vacio });
      const { id } = await avisarme(asunto, html);
      return res.status(200).json({ ok: true, asunto, id });
    }

    const tareaId = String(body.tareaId || "");
    if (!/^[\w-]{6,64}$/.test(tareaId)) return res.status(400).json({ ok: false, error: "Tarea inválida" });
    const ref = base.collection("tareas").doc(tareaId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(200).json({ ok: true, recordatorio: null });
    const tarea = snap.data();

    if (body.borrar) {
      await sincronizarRecordatorio(ref, { ...tarea, hecha: true }, { recordatorios: false });
      await ref.delete();
      return res.status(200).json({ ok: true, borrada: true });
    }

    const [ajustes, cliente] = await Promise.all([
      leerAjustes(base),
      tarea.clienteId ? base.collection("clientes").doc(tarea.clienteId).get().then((d) => d.data()) : null
    ]);
    const recordatorio = await sincronizarRecordatorio(ref, tarea, ajustes, cliente);
    res.status(200).json({ ok: true, recordatorio });
  } catch (err) {
    console.error(err);
    res.status(502).json({ ok: false, error: "No se pudo programar el aviso: " + err.message });
  }
};
