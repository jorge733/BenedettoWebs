// Función de Vercel: agente de WhatsApp de BenedettoWebs.
// Recibe los mensajes desde la API de WhatsApp de Meta (webhook), responde con Claude y guarda todo en Firestore
// (colección "whatsapp", un documento por número con la subcolección "mensajes").
// Cuando el agente detecta algo que necesita a Santiago, le manda un correo y crea una tarea en la agenda.
// Si Santiago responde en persona desde la app WhatsApp Business (coexistencia), el agente se pausa en ese chat.
//
// Variables de entorno en Vercel:
//   ANTHROPIC_API_KEY          clave de la API de Claude (console.anthropic.com)
//   WHATSAPP_TOKEN             token permanente del usuario del sistema en Meta Business
//   WHATSAPP_PHONE_NUMBER_ID   "Identificador del número de teléfono" en WhatsApp → Configuración de la API
//   WHATSAPP_APP_SECRET        "Clave secreta de la app" (Configuración de la app → Básica), para validar la firma
//   WHATSAPP_VERIFY_TOKEN      texto inventado por ti, el mismo que pones al configurar el webhook en Meta
//   FIREBASE_SERVICE_ACCOUNT, RESEND_API_KEY (ya existen)
// Interruptor general: documento ajustes/whatsapp con { activo: false } apaga el agente sin tocar el código.
// La guía para configurarlo está en proceso/WHATSAPP.md.
const crypto = require("crypto");
const Anthropic = require("@anthropic-ai/sdk");
const { db, FieldValue } = require("./_firestore");
const { avisarme, crearTareaAuto, hoyChile } = require("./_agenda");
const { escapar } = require("./_correos");
const { INSTRUCCIONES, FORMATO } = require("./_agente-whatsapp");

const GRAPH = "https://graph.facebook.com/v23.0";
const HORA = 60 * 60 * 1000;
const PAUSA_SI_RESPONDES = 12 * HORA; // tras un mensaje tuyo desde la app, el agente no responde ese chat por 12 horas
const ESPERA_RAFAGA = 4000;           // espera para juntar varios mensajes seguidos en una sola respuesta
const HISTORIAL = 40;                 // mensajes anteriores que lee el agente
const AVISO_CADA = HORA;              // no más de un correo por chat cada hora

const leerCuerpo = async (req) => {
  const partes = [];
  for await (const parte of req) partes.push(parte);
  return Buffer.concat(partes).toString("utf8");
};

// Firma de Meta: "sha256=" + HMAC-SHA256 del cuerpo con la clave secreta de la app
function firmaValida(req, cuerpo) {
  const secreto = process.env.WHATSAPP_APP_SECRET;
  const firma = String(req.headers["x-hub-signature-256"] || "");
  if (!secreto || !firma.startsWith("sha256=")) return false;
  const esperada = crypto.createHmac("sha256", secreto).update(cuerpo).digest();
  const recibida = Buffer.from(firma.slice(7), "hex");
  return recibida.length === esperada.length && crypto.timingSafeEqual(recibida, esperada);
}

const digitos = (s) => String(s || "").replace(/\D/g, "");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Texto que guarda y lee el agente para cada tipo de mensaje
function textoDe(m) {
  switch (m.type) {
    case "text": return m.text?.body || "";
    case "button": return m.button?.text || "";
    case "interactive": return m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || "";
    case "image": return `[Envió una foto${m.image?.caption ? ` con el texto: "${m.image.caption}"` : ""}. No puedes verla; Santiago sí.]`;
    case "video": return `[Envió un video${m.video?.caption ? ` con el texto: "${m.video.caption}"` : ""}. No puedes verlo; Santiago sí.]`;
    case "document": return `[Envió un archivo${m.document?.filename ? ` (${m.document.filename})` : ""}. No puedes abrirlo; Santiago sí.]`;
    case "audio": return "[Envió un audio. No puedes escucharlo: pídele con amabilidad que lo escriba, o dile que Santiago lo escucha.]";
    case "sticker": return "[Envió un sticker.]";
    case "location": return "[Envió una ubicación.]";
    case "contacts": return "[Envió un contacto.]";
    case "reaction": return null; // las reacciones no se responden
    default: return `[Envió un mensaje de tipo ${m.type}.]`;
  }
}

async function enviarWhatsApp(para, texto) {
  const r = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: para, type: "text", text: { body: texto } })
  });
  if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${await r.text()}`);
  const datos = await r.json();
  return datos.messages?.[0]?.id;
}

// Busca si el número es de un cliente del panel (compara los últimos 8 dígitos)
async function buscarCliente(base, wa) {
  const fin = digitos(wa).slice(-8);
  const snap = await base.collection("clientes").get();
  const doc = snap.docs.find((d) => digitos(d.data().telefono).slice(-8) === fin);
  return doc ? { id: doc.id, ...doc.data() } : null;
}

// Historial de Firestore → mensajes para Claude (debe partir con la persona)
function armarConversacion(docs) {
  const mensajes = docs.map((d) => {
    const m = d.data();
    if (m.de === "persona") return { role: "user", content: m.texto };
    if (m.de === "santiago") return { role: "assistant", content: `[Mensaje de Santiago, en persona]: ${m.texto}` };
    return { role: "assistant", content: m.texto };
  });
  while (mensajes.length && mensajes[0].role !== "user") mensajes.shift();
  return mensajes;
}

function datosConversacion({ cliente, perfil, wa }) {
  const ahora = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "full", timeStyle: "short" });
  const lineas = [`Fecha y hora en Chile: ${ahora}.`, `Nombre del perfil de WhatsApp: ${perfil || "(sin nombre)"}. Número: +${wa}.`];
  if (cliente) {
    // Solo lo necesario para atenderlo: nada de RUT, montos ni correos
    lineas.push(
      `Es cliente de BenedettoWebs. Nombre: ${cliente.nombre || "(sin nombre)"}. Negocio: ${cliente.negocio || "(sin dato)"}.`,
      `Estado del proyecto: ${cliente.estado || "(sin dato)"}.${cliente.sitio ? ` Sitio: ${cliente.sitio}.` : ""}${cliente.entrega ? ` Fecha de entrega: ${cliente.entrega}.` : ""}`
    );
  } else {
    lineas.push("No está en la lista de clientes: trátalo como alguien interesado en una web.");
  }
  return lineas.join("\n");
}

async function preguntarAClaude(conversacion, datos) {
  const claude = new Anthropic(); // usa ANTHROPIC_API_KEY
  const r = await claude.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // si el modelo rechaza por seguridad, la API reintenta con otro modelo
    output_config: { effort: "low", format: FORMATO },
    system: [
      { type: "text", text: INSTRUCCIONES, cache_control: { type: "ephemeral" } },
      { type: "text", text: `## Datos de esta conversación\n${datos}` }
    ],
    messages: conversacion
  });
  if (r.stop_reason === "refusal") return { respuesta: "", avisar: true, motivo: "El agente no pudo responder este mensaje; revísalo tú." };
  const texto = r.content.find((b) => b.type === "text")?.text || "";
  const salida = JSON.parse(texto);
  return { respuesta: String(salida.respuesta || "").trim(), avisar: !!salida.avisar, motivo: String(salida.motivo || "").trim() };
}

async function avisarASantiago(base, refChat, chat, { wa, perfil, cliente, motivo, ultimo }) {
  const quien = cliente?.negocio || cliente?.nombre || perfil || `+${wa}`;
  const tarea = crearTareaAuto(base, `auto-wa-${wa}-${hoyChile()}`, {
    titulo: `WhatsApp: responder a ${quien}`, fecha: hoyChile(), importante: true,
    ...(cliente ? { clienteId: cliente.id } : {}), auto: "whatsapp", notas: motivo
  }).catch((err) => console.error("No se pudo crear la tarea", err));

  const ultimoAviso = chat.ultimoAviso?.toMillis?.() || 0;
  if (Date.now() - ultimoAviso < AVISO_CADA) return tarea;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2937">
    <p><b>${escapar(quien)}</b> (+${escapar(wa)})${cliente ? " · cliente" : " · interesado"}</p>
    <p>${escapar(motivo)}</p>
    <p style="color:#6b7280">Último mensaje: “${escapar(ultimo)}”</p>
    <p><a href="https://wa.me/${escapar(wa)}" style="color:#1a9e52">Abrir el chat en WhatsApp</a></p></div>`;
  await Promise.all([
    tarea,
    avisarme(`💬 WhatsApp: ${quien}`, html).catch((err) => console.error("No se pudo enviar el aviso", err)),
    refChat.set({ ultimoAviso: FieldValue.serverTimestamp() }, { merge: true })
  ]);
}

// Mensaje que llega de una persona
async function atenderMensaje(base, m, contactos) {
  const texto = textoDe(m);
  if (texto === null) return;
  const wa = digitos(m.from);
  const perfil = contactos.find((c) => digitos(c.wa_id) === wa)?.profile?.name || "";
  const refChat = base.collection("whatsapp").doc(wa);
  const refMensaje = refChat.collection("mensajes").doc(m.id);

  // Meta reenvía el aviso si tardamos: si el mensaje ya está guardado, no se responde dos veces
  try {
    await refMensaje.create({ de: "persona", texto, tipo: m.type, fecha: new Date() });
  } catch (err) {
    if (err.code === 6) return; // ALREADY_EXISTS
    throw err;
  }
  await refChat.set({ perfil, ultimo: texto, actualizado: FieldValue.serverTimestamp(), sinLeer: FieldValue.increment(1) }, { merge: true });

  // Si la persona manda varios mensajes seguidos, responde solo el aviso del último, con todo junto
  // (y si lo último es un mensaje tuyo, el agente no se mete)
  await espera(ESPERA_RAFAGA);
  const masNuevo = await refChat.collection("mensajes").orderBy("fecha", "desc").limit(1).get();
  if (masNuevo.docs[0]?.id !== m.id) return;

  const [ajustes, chatSnap, cliente, historial] = await Promise.all([
    base.collection("ajustes").doc("whatsapp").get(),
    refChat.get(),
    buscarCliente(base, wa),
    refChat.collection("mensajes").orderBy("fecha", "desc").limit(HISTORIAL).get()
  ]);
  const chat = chatSnap.data() || {};
  if (ajustes.data()?.activo === false) return;
  if ((chat.pausadoHasta?.toMillis?.() || 0) > Date.now()) return; // Santiago está atendiendo este chat
  if (cliente && chat.clienteId !== cliente.id) await refChat.set({ clienteId: cliente.id }, { merge: true });

  const conversacion = armarConversacion(historial.docs.slice().reverse());
  const { respuesta, avisar, motivo } = await preguntarAClaude(conversacion, datosConversacion({ cliente, perfil, wa }));

  if (respuesta) {
    const id = await enviarWhatsApp(wa, respuesta);
    await refChat.collection("mensajes").doc(id || `agente-${Date.now()}`).set({ de: "agente", texto: respuesta, tipo: "text", fecha: new Date() });
    await refChat.set({ ultimo: respuesta, actualizado: FieldValue.serverTimestamp() }, { merge: true });
  }
  if (avisar) await avisarASantiago(base, refChat, chat, { wa, perfil, cliente, motivo: motivo || "Revisa esta conversación.", ultimo: texto });
}

// Mensaje que mandaste tú desde la app WhatsApp Business (coexistencia): se guarda y se pausa el agente en ese chat
async function registrarMensajeTuyo(base, e) {
  const wa = digitos(e.to);
  if (!wa) return;
  const refChat = base.collection("whatsapp").doc(wa);
  const refMensaje = refChat.collection("mensajes").doc(e.id);
  if ((await refMensaje.get()).exists) return; // es una respuesta del agente
  await refMensaje.set({ de: "santiago", texto: textoDe(e) || "", tipo: e.type, fecha: new Date(Number(e.timestamp) * 1000 || Date.now()) });
  await refChat.set({
    pausadoHasta: new Date(Date.now() + PAUSA_SI_RESPONDES), sinLeer: 0,
    ultimo: textoDe(e) || "", actualizado: FieldValue.serverTimestamp()
  }, { merge: true });
}

module.exports = async (req, res) => {
  // Verificación del webhook (Meta la hace una vez al configurarlo)
  if (req.method === "GET") {
    const { "hub.mode": modo, "hub.verify_token": token, "hub.challenge": reto } = req.query || {};
    if (modo === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) return res.status(200).send(reto);
    return res.status(403).send("No autorizado");
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  const cuerpo = await leerCuerpo(req);
  if (!firmaValida(req, cuerpo)) return res.status(401).json({ ok: false, error: "Firma inválida" });

  let aviso;
  try { aviso = JSON.parse(cuerpo); } catch { return res.status(400).json({ ok: false, error: "JSON inválido" }); }

  try {
    const base = db();
    const tareas = [];
    for (const entrada of aviso.entry || []) {
      for (const cambio of entrada.changes || []) {
        const v = cambio.value || {};
        if (v.metadata?.phone_number_id && v.metadata.phone_number_id !== process.env.WHATSAPP_PHONE_NUMBER_ID) continue;
        if (cambio.field === "messages") {
          for (const m of v.messages || []) tareas.push(atenderMensaje(base, m, v.contacts || []));
        } else if (cambio.field === "smb_message_echoes") {
          for (const e of v.message_echoes || []) tareas.push(registrarMensajeTuyo(base, e));
        }
        // "statuses" (enviado, leído) y el resto no se usan
      }
    }
    const resultados = await Promise.allSettled(tareas);
    resultados.filter((r) => r.status === "rejected").forEach((r) => console.error(r.reason));
  } catch (err) {
    console.error(err);
  }
  // Siempre 200: si no, Meta reintenta y termina desactivando el webhook
  return res.status(200).json({ ok: true });
};
