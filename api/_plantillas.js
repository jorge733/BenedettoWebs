// Plantillas de correos a clientes que se envían desde el panel (api/enviar-correo.js).
// Cada plantilla define sus campos (el panel arma el formulario con ellos), el asunto y el cuerpo.
const { layout, boton, tablaDatos, etiqueta, escapar, conSaltos, COLOR, FUENTE, SITIO } = require("./_correos");

const WHATSAPP = "56932698141";
const INSTAGRAM = "benedettowebs";

// Valor de un campo, o "[Etiqueta]" si está vacío (solo pasa en la vista previa: al enviar se exigen)
const valor = (d, campo) => d[campo.id] || `[${campo.label}]`;
const clp = (v) => {
  const n = Number(String(v ?? "").replace(/\D/g, ""));
  return n ? "$" + n.toLocaleString("es-CL") : "";
};
const montoDe = (d, f) => clp(d.monto) || `[${f.monto.label}]`;
const enlace = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

const titulo = (t) => `<h1 style="${FUENTE}margin:14px 0 10px;font-size:24px;line-height:1.3;color:${COLOR.texto};">${t}</h1>`;
const parrafo = (t, margen = "0 0 18px") => `<p style="margin:${margen};">${t}</p>`;
const seccion = (t) => `<p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${COLOR.suave};text-transform:uppercase;letter-spacing:.06em;">${t}</p>`;
const nota = (t, color = COLOR.primario) =>
  `<div style="margin:0 0 22px;padding:16px 18px;background:#f6f7fb;border-left:4px solid ${color};border-radius:8px;">${t}</div>`;
const etiquetaColor = (texto, fondo, color) =>
  `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${fondo};color:${color};font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${texto}</span>`;
const destacado = (arriba, grande, abajo = "") => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-radius:14px;border-collapse:separate;background:${COLOR.primario};background-image:linear-gradient(135deg,${COLOR.primario},${COLOR.secundario});">
    <tr><td align="center" style="${FUENTE}padding:22px 16px;color:#ffffff;">
      <span style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${arriba}</span><br>
      <span style="font-size:30px;font-weight:800;line-height:1.35;">${grande}</span>${abajo ? `<br><span style="font-size:13px;">${abajo}</span>` : ""}
    </td></tr>
  </table>`;
const lista = (items) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
    ${items.map(([icono, texto]) => `
    <tr>
      <td width="36" style="vertical-align:top;padding:0 0 10px;font-size:18px;">${icono}</td>
      <td style="${FUENTE}vertical-align:top;padding:1px 0 10px;font-size:15px;color:${COLOR.texto};">${texto}</td>
    </tr>`).join("")}
  </table>`;
const paso = (n, t, texto) => `
  <tr>
    <td width="40" style="vertical-align:top;padding:0 0 14px;">
      <div style="${FUENTE}width:30px;height:30px;line-height:30px;border-radius:50%;background:${COLOR.primario};color:#fff;text-align:center;font-weight:700;font-size:14px;">${n}</div>
    </td>
    <td style="${FUENTE}vertical-align:top;padding:4px 0 14px;font-size:15px;color:${COLOR.texto};"><strong>${t}</strong><br><span style="color:${COLOR.suave};">${texto}</span></td>
  </tr>`;
const botonWhatsApp = (texto) => boton(`https://wa.me/${WHATSAPP}`, texto, "#25d366");
const firma = (despedida = "Saludos,") =>
  `<p style="margin:26px 0 0;">${despedida}<br><strong>Santiago Benedetto</strong><br><span style="color:${COLOR.suave};">BenedettoWebs · Páginas web en Chile</span></p>`;
const pie = `<a href="${SITIO}" style="color:${COLOR.suave};">benedettowebs.cl</a> ·
  <a href="https://wa.me/${WHATSAPP}" style="color:${COLOR.primario};text-decoration:none;">WhatsApp +56 9 3269 8141</a> ·
  <a href="https://www.instagram.com/${INSTAGRAM}" style="color:${COLOR.primario};text-decoration:none;">@${INSTAGRAM}</a>`;

// Campos que se repiten. "prefill" es la clave que el panel usa para rellenarlo con datos del cliente.
const C = {
  monto: (label, prefill) => ({ id: "monto", label, tipo: "monto", prefill, obligatorio: true }),
  transferencia: { id: "transferencia", label: "Datos de transferencia", tipo: "area", prefill: "transferencia", obligatorio: true },
  drive: { id: "drive", label: "Link de la carpeta Drive", tipo: "link" }
};

const PLANTILLAS = {
  solicitud: {
    nombre: "1 · Respuesta a solicitud",
    campos: [],
    asunto: () => "Recibí tu solicitud de cotización · BenedettoWebs",
    cuerpo: (d, e) => `
      ${etiqueta("Solicitud recibida")}
      ${titulo(`¡Hola, ${e.nombre}! 👋`)}
      ${parrafo(`Muchas gracias por escribirme y por pensar en BenedettoWebs para la página de <strong>${e.negocio}</strong>. Para darte un <strong>precio cerrado</strong> y un plazo realista, me ayudaría saber un poco más:`, "0 0 22px")}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
        ${paso(1, "Secciones", "¿Qué te gustaría tener? Inicio, servicios, galería, contacto…")}
        ${paso(2, "Referencias", "¿Hay alguna página que te guste como inspiración?")}
        ${paso(3, "Dominio", "¿Ya tienes tunegocio.cl o necesitas conseguirlo?")}
        ${paso(4, "Contenido", "¿Cuentas con textos, fotos y logo, o hay que trabajar en eso?")}
      </table>
      ${parrafo("Puedes responder este correo o, si te acomoda más, lo conversamos por WhatsApp:", "0 0 10px")}
      ${botonWhatsApp("Escribirme por WhatsApp")}
      ${parrafo("Apenas tenga esa información te envío la cotización, <strong>gratis y sin compromiso</strong>.", "22px 0 0")}
      ${firma()}`
  },

  cotizacion: {
    nombre: "2 · Envío de cotización",
    campos: [
      { id: "incluye", label: "Qué incluye", tipo: "area", obligatorio: true },
      C.monto("Precio total", "total"),
      { id: "plazo", label: "Plazo estimado", tipo: "texto", valor: "10 días hábiles desde que tenga el contenido", obligatorio: true }
    ],
    asunto: (d) => `Cotización página web${d.negocio ? " para " + d.negocio : ""}`,
    cuerpo: (d, e, f) => {
      const total = Number(String(d.monto).replace(/\D/g, ""));
      const mitad = total ? clp(Math.round(total / 2)) : "[50%]";
      return `
      ${etiqueta("Tu cotización")}
      ${titulo(`Hola, ${e.nombre}`)}
      ${parrafo(`Gracias por la información. Aquí tienes la propuesta para la página web de <strong>${e.negocio}</strong>.`, "0 0 22px")}
      ${destacado("Precio total · pago único", escapar(montoDe(d, f)), "CLP · sin mensualidades")}
      <div style="margin:0 0 22px;">${tablaDatos([
        ["Incluye", valor(d, f.incluye)],
        ["Forma de pago", `50% al comenzar (${mitad})\n50% al entregar (${mitad})`],
        ["Plazo estimado", valor(d, f.plazo)],
        ["Dominio", "Lo compras a tu nombre en NIC Chile (cerca de $10.000 al año) y yo lo conecto"],
        ["Validez", "15 días"]
      ])}</div>
      ${nota("✨ Antes de publicar ajustamos todo lo que necesites a partir de los avances.")}
      ${parrafo("Si estás de acuerdo, respóndeme este correo y te envío el acuerdo de trabajo y los datos para el primer pago.", "0 0 10px")}
      ${boton(`https://wa.me/${WHATSAPP}`, "¿Dudas? Conversemos")}
      ${firma()}`;
    }
  },

  seguimiento: {
    nombre: "3 · Seguimiento de cotización",
    campos: [{ id: "fecha", label: "Fecha de la cotización", tipo: "texto", prefill: "fechaCotizacion", obligatorio: true }],
    asunto: () => "¿Pudiste revisar la cotización?",
    cuerpo: (d, e) => `
      ${etiqueta("Seguimiento")}
      ${titulo(`Hola, ${e.nombre}, ¿cómo estás?`)}
      ${parrafo(`Te escribo para saber si alcanzaste a revisar la cotización que te envié el <strong>${e.fecha}</strong> para la página de <strong>${e.negocio}</strong>.`)}
      ${nota("Si tienes dudas, quieres <strong>ajustar el alcance</strong> o prefieres <strong>partir con una versión más simple</strong>, lo conversamos sin problema y adapto la propuesta a lo que necesitas.", COLOR.secundario)}
      ${botonWhatsApp("Conversemos por WhatsApp")}
      ${firma("Quedo atento. Saludos,")}`
  },

  seguimiento2: {
    nombre: "3b · Segundo seguimiento",
    campos: [{ id: "fecha", label: "Fecha de la cotización", tipo: "texto", prefill: "fechaCotizacion", obligatorio: true }],
    asunto: () => "¿Seguimos con tu página web?",
    cuerpo: (d, e) => `
      ${etiqueta("Seguimiento")}
      ${titulo(`Hola, ${e.nombre}`)}
      ${parrafo(`Te escribo por última vez sobre la cotización del <strong>${e.fecha}</strong> para la página de <strong>${e.negocio}</strong>. Te recuerdo que tiene una validez de <strong>15 días</strong>.`)}
      ${nota("Si por ahora no es el momento, no hay ningún problema: cuando quieras retomarlo, respóndeme este correo y lo vemos.", COLOR.secundario)}
      ${botonWhatsApp("Conversemos por WhatsApp")}
      ${firma("Un saludo,")}`
  },

  bienvenida: {
    nombre: "4 · Bienvenida e inicio",
    campos: [
      C.monto("Anticipo recibido", "mitad"),
      { id: "entrega", label: "Entrega estimada", tipo: "texto", obligatorio: true },
      C.drive
    ],
    asunto: () => "¡Comenzamos! Próximos pasos para tu página web",
    cuerpo: (d, e, f) => `
      ${etiquetaColor("✓ Proyecto confirmado", "#e6faf0", "#139a5b")}
      ${titulo(`¡Bienvenido/a, ${e.nombre}! 🚀`)}
      ${parrafo(`Confirmo que recibí el primer pago de <strong>${escapar(montoDe(d, f))}</strong>. Tu proyecto ya está reservado y comenzamos a trabajar en la página de <strong>${e.negocio}</strong>.`, "0 0 22px")}
      ${seccion("Lo que necesito de ti")}
      ${lista([
        ["🎨", "<strong>Logo</strong> <span style=\"color:#5b6480;\">· idealmente en PNG o SVG</span>"],
        ["✍️", "<strong>Textos</strong> <span style=\"color:#5b6480;\">· quiénes son, servicios o productos</span>"],
        ["📸", "<strong>Fotos</strong> <span style=\"color:#5b6480;\">· de tu negocio, productos o equipo</span>"],
        ["📍", "<strong>Contacto</strong> <span style=\"color:#5b6480;\">· WhatsApp, correo, dirección y redes</span>"],
        ["💡", "<strong>Referencias</strong> <span style=\"color:#5b6480;\">· colores o páginas que te gusten</span>"]
      ])}
      ${d.drive ? `<div style="margin:0 0 22px;">${boton(enlace(d.drive), "📁 Subir mi contenido")}</div>` : parrafo("Puedes enviármelo respondiendo este correo o por WhatsApp.", "0 0 22px")}
      ${nota(`<strong>Entrega estimada:</strong> ${e.entrega}, contando desde que reciba el contenido. Te iré mostrando avances para que ajustemos los detalles. Si te falta algo, avísame y lo resolvemos.`)}
      ${firma()}`
  },

  pendiente: {
    nombre: "5 · Contenido pendiente",
    campos: [{ id: "pendiente", label: "Qué falta", tipo: "area", obligatorio: true }, C.drive],
    asunto: () => "Contenido pendiente para tu página web",
    cuerpo: (d, e, f) => `
      ${etiquetaColor("Contenido pendiente", "#fff4e0", "#c27a00")}
      ${titulo(`Hola, ${e.nombre}, ¿cómo vas?`)}
      ${parrafo(`Para seguir avanzando con la página de <strong>${e.negocio}</strong> y mantener la fecha de entrega, todavía me falta:`)}
      <div style="margin:0 0 22px;padding:16px 18px;background:#fffaf0;border:1px solid #ffe2a8;border-radius:12px;">📌 ${conSaltos(valor(d, f.pendiente))}</div>
      ${parrafo("Si te complica alguna parte (por ejemplo, redactar los textos), cuéntame y te propongo una alternativa.", "0 0 10px")}
      ${d.drive ? boton(enlace(d.drive), "📁 Subir contenido") : botonWhatsApp("Enviarlo por WhatsApp")}
      ${firma()}`
  },

  avance: {
    nombre: "6 · Avance para revisión",
    campos: [{ id: "vista", label: "Link de la vista previa", tipo: "link", obligatorio: true }],
    asunto: () => "Avance de tu página web para revisión",
    cuerpo: (d, e) => `
      ${etiqueta("Avance listo")}
      ${titulo(`¡Mira cómo va tu página, ${e.nombre}! 👀`)}
      ${parrafo(`Ya tengo un avance de la web de <strong>${e.negocio}</strong>. Revísala desde el <strong>celular y el computador</strong>:`, "0 0 10px")}
      <div style="margin:0 0 22px;">${boton(d.vista ? enlace(d.vista) : SITIO, "Ver vista previa →")}</div>
      ${seccion("Fíjate especialmente en")}
      ${lista([["✅", "Textos y datos de contacto"], ["✅", "Fotos y su orden"], ["✅", "Colores y estilo general"]])}
      ${nota("💬 Envíame <strong>todos los cambios juntos</strong> respondiendo este correo, así los aplico de una vez. Si está todo bien, ¡pasamos a publicar!")}
      ${firma()}`
  },

  publicada: {
    nombre: "7 · Web publicada y saldo",
    campos: [
      { id: "dominio", label: "Dominio", tipo: "texto", prefill: "sitio", obligatorio: true },
      { id: "resumen", label: "Lo que queda funcionando", tipo: "area", obligatorio: true },
      C.monto("Saldo pendiente", "mitad"),
      C.transferencia,
      { id: "vence", label: "Dominio vence", tipo: "texto", prefill: "vence" }
    ],
    asunto: () => "🎉 Tu página web ya está publicada",
    cuerpo: (d, e, f) => {
      const dominio = String(d.dominio || "").replace(/^https?:\/\//i, "").replace(/\/$/, "");
      return `
      ${etiquetaColor("● En línea", "#e6faf0", "#139a5b")}
      ${titulo(`¡Tu página ya está publicada, ${e.nombre}! 🎉`)}
      ${parrafo(`La web de <strong>${e.negocio}</strong> ya está en internet, lista para recibir clientes.`)}
      ${destacado("Tu sitio", dominio ? `<a href="${escapar(enlace(dominio))}" style="color:#ffffff;text-decoration:none;font-size:24px;">${escapar(dominio)}</a>` : escapar(`[${f.dominio.label}]`))}
      ${seccion("Lo que queda funcionando")}
      ${nota(`${conSaltos(valor(d, f.resumen))}<br>Sitio adaptado a celulares y optimizado para Google.`)}
      ${seccion("Cierre del proyecto")}
      <div style="margin:0 0 22px;">${tablaDatos([
        ["Saldo pendiente", `${montoDe(d, f)} (50% final)`],
        ["Transferencia", valor(d, f.transferencia)]
      ])}</div>
      ${seccion("Consejos para sacarle provecho")}
      ${lista([
        ["📣", "Comparte el link en tu Instagram, WhatsApp y Google Maps."],
        ["📅", `Renueva tu dominio cada año en NIC Chile${d.vence ? ` (vence el <strong>${e.vence}</strong>)` : ""}.`]
      ])}
      ${parrafo("Fue un gusto trabajar contigo. Cualquier duda, sigo disponible.", "0")}
      ${firma()}`;
    }
  },

  pago: {
    nombre: "8 · Recordatorio de pago",
    campos: [
      { id: "concepto", label: "Concepto", tipo: "opciones", opciones: ["Anticipo (50%)", "Saldo final (50%)"], obligatorio: true },
      C.monto("Monto", "mitad"),
      C.transferencia
    ],
    asunto: (d) => `Recordatorio de pago · Página web${d.negocio ? " " + d.negocio : ""}`,
    cuerpo: (d, e, f) => `
      ${etiqueta("Recordatorio de pago")}
      ${titulo(`Hola, ${e.nombre}, ¿cómo estás?`)}
      ${parrafo(`Te escribo para recordarte que está pendiente el siguiente pago de la página web de <strong>${e.negocio}</strong>:`)}
      <div style="margin:0 0 22px;">${tablaDatos([
        ["Concepto", valor(d, f.concepto)],
        ["Monto", montoDe(d, f)],
        ["Transferencia", valor(d, f.transferencia)]
      ])}</div>
      ${nota("Si ya lo realizaste, envíame el comprobante y disculpa la molestia 🙏. Si necesitas coordinar otra fecha, lo conversamos.", COLOR.secundario)}
      ${firma()}`
  },

  resena: {
    nombre: "9 · Pedir reseña",
    campos: [{ id: "resena", label: "Link para dejar reseña", tipo: "link", prefill: "resena" }],
    asunto: () => "¿Me ayudas con una reseña? 🙏",
    cuerpo: (d, e) => `
      ${etiquetaColor("★★★★★ Tu opinión", "#fff4e0", "#c27a00")}
      ${titulo(`Hola, ${e.nombre} 😊`)}
      ${parrafo(`Espero que la página de <strong>${e.negocio}</strong> te esté funcionando muy bien.`)}
      ${parrafo("Como estoy partiendo con BenedettoWebs, tu opinión me ayuda muchísimo a que otros emprendedores confíen en mi trabajo. ¿Me dejarías una reseña breve? Te toma <strong>menos de un minuto</strong>.", "0 0 10px")}
      ${d.resena ? `<div style="margin:0 0 22px;">${boton(enlace(d.resena), "⭐ Dejar mi reseña")}</div>` : ""}
      ${nota(`${d.resena ? "Si prefieres, también puedes" : "Puedes"} <strong>responder este correo</strong> con un par de líneas y la publico en mi web junto a tu nombre y el de tu negocio.`)}
      ${firma("¡Muchas gracias!")}`
  }
};

// Campos que tienen todas las plantillas, antes de los propios
const COMUNES = [
  { id: "nombre", label: "Nombre (saludo)", tipo: "texto", prefill: "nombre", obligatorio: true },
  { id: "negocio", label: "Negocio", tipo: "texto", prefill: "negocio" }
];

const camposDe = (id) => [...COMUNES, ...PLANTILLAS[id].campos];

// Lo que el panel necesita para armar el formulario
const catalogo = () =>
  Object.entries(PLANTILLAS).map(([id, p]) => ({ id, nombre: p.nombre, campos: camposDe(id) }));

// Arma asunto y HTML. "d" son los valores sin escapar; "e" los mismos, escapados y con [Etiqueta] si faltan.
function armar(id, d) {
  const p = PLANTILLAS[id];
  const campos = camposDe(id);
  const f = Object.fromEntries(campos.map((c) => [c.id, c]));
  const e = Object.fromEntries(campos.map((c) => [c.id, escapar(valor(d, c))]));
  e.negocio = escapar(d.negocio || "tu negocio");
  const faltan = campos.filter((c) => c.obligatorio && !String(d[c.id] ?? "").trim()).map((c) => c.label);
  return {
    asunto: p.asunto(d),
    html: layout({ preheader: p.asunto(d), contenido: p.cuerpo(d, e, f), pie }),
    faltan
  };
}

module.exports = { PLANTILLAS, catalogo, camposDe, armar };
