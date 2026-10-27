// Función de Vercel que corre sola cada mañana (vercel.json → crons, 11:00 UTC = 8:00 en Chile con horario de verano).
// 1. Te envía el brief del día: tareas, entregas, seguimientos, dominios y clientes que abrieron tus correos.
//    Si no hay nada que contar, o es fin de semana y elegiste "solo días hábiles", no se envía.
// 2. Programa en Resend los recordatorios de tareas con hora que todavía no estaban (Resend acepta hasta 30 días antes).
// Con ?prueba=1 solo responde lo que haría, sin enviar ni programar nada.
// Variables de entorno en Vercel: CRON_SECRET, FIREBASE_SERVICE_ACCOUNT, RESEND_API_KEY.
const { db } = require("./_firestore");
const { leerAjustes, hoyChile, diaSemana, datosBrief, programarPendientes, armarBrief, avisarme } = require("./_agenda");

module.exports = async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }
  const prueba = String(req.query?.prueba || "") === "1";
  const base = db();
  const hoy = hoyChile();
  const [ajustes, datos] = await Promise.all([leerAjustes(base), datosBrief(base, hoy)]);

  const findeSemana = [0, 6].includes(diaSemana(hoy));
  const brief = armarBrief(datos);
  let estado;
  if (!ajustes.brief) estado = "desactivado";
  else if (findeSemana && ajustes.briefDias === "habiles") estado = "fin de semana";
  else if (brief.vacio) estado = "sin novedades";
  else if (prueba) estado = "se enviaría";
  else {
    try {
      await avisarme(brief.asunto, brief.html);
      estado = "enviado";
    } catch (err) {
      console.error(err);
      estado = "error: " + err.message;
    }
  }

  const recordatorios = prueba ? "prueba: no se programan" : await programarPendientes(datos, ajustes);
  const resultado = { hoy, prueba, brief: estado, asunto: brief.asunto, recordatorios };
  console.log(JSON.stringify(resultado));
  res.status(200).json({ ok: !String(estado).startsWith("error"), ...resultado });
};
