// Plantillas HTML de los correos de cotización.
// Usan tablas y estilos en línea porque Gmail, Outlook y Apple Mail no soportan CSS moderno.

const SITIO = "https://www.benedettowebs.cl";
const LOGO = `${SITIO}/img/correo/logo.png`;
const COLOR = { primario: "#6c63ff", secundario: "#00d4ff", texto: "#1a1f36", suave: "#5b6480", fondo: "#eef1f8", borde: "#e3e7f1" };
const FUENTE = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

const escapar = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const conSaltos = (s) => escapar(s).replace(/\r?\n/g, "<br>");

const boton = (href, texto, color = COLOR.primario) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:4px 6px 4px 0;">
    <tr><td style="background:${color};border-radius:10px;">
      <a href="${escapar(href)}" style="${FUENTE}display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${texto}</a>
    </td></tr>
  </table>`;

const filas = (datos) =>
  datos
    .map(
      ([label, valor], i) => `
    <tr>
      <td style="${FUENTE}padding:12px 16px;width:38%;vertical-align:top;font-size:13px;color:${COLOR.suave};font-weight:600;${i ? `border-top:1px solid ${COLOR.borde};` : ""}">${escapar(label)}</td>
      <td style="${FUENTE}padding:12px 16px;vertical-align:top;font-size:15px;color:${COLOR.texto};${i ? `border-top:1px solid ${COLOR.borde};` : ""}">${conSaltos(valor)}</td>
    </tr>`
    )
    .join("");

const tablaDatos = (datos) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLOR.borde};border-radius:12px;border-collapse:separate;">
    ${filas(datos)}
  </table>`;

const layout = ({ preheader, contenido, pie }) => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>BenedettoWebs</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.fondo};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapar(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.fondo};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">
        <tr><td style="height:6px;line-height:6px;font-size:0;background:${COLOR.primario};background-image:linear-gradient(90deg,${COLOR.primario},${COLOR.secundario});">&nbsp;</td></tr>
        <tr><td style="padding:28px 32px 8px;">
          <a href="${SITIO}"><img src="${LOGO}" width="200" alt="BenedettoWebs" style="display:block;border:0;width:200px;height:auto;"></a>
        </td></tr>
        <tr><td style="${FUENTE}padding:16px 32px 32px;color:${COLOR.texto};font-size:15px;line-height:1.6;">
          ${contenido}
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td align="center" style="${FUENTE}padding:20px 24px;color:${COLOR.suave};font-size:12px;line-height:1.6;">
          ${pie}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const etiqueta = (texto) =>
  `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:#f0efff;color:${COLOR.primario};font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${texto}</span>`;

// Correo que le llega a Santiago con la nueva solicitud
function correoAviso(c) {
  const datos = [
    ["Nombre", c.nombre],
    ["Negocio", c.negocio],
    ["Correo", c.email],
    ["WhatsApp", c.telefono],
    ["Tipo de página", c.tipo],
    ["Quiere incluir", c.incluir],
    ["Plazo", c.plazo],
    ["Contenido listo", c.contenido]
  ].filter(([, v]) => v);

  const wa = c.telefono.replace(/\D/g, "");
  const saludo = `Hola ${c.nombre}, soy Santiago de BenedettoWebs. Recibí tu solicitud de cotización.`;
  const botones =
    boton(`mailto:${c.email}?subject=${encodeURIComponent("Tu cotización de página web - BenedettoWebs")}`, "Responder por correo") +
    (wa.length >= 8 ? boton(`https://wa.me/${wa}?text=${encodeURIComponent(saludo)}`, "Escribir por WhatsApp", "#25d366") : "");

  const contenido = `
    ${etiqueta("Nueva cotización")}
    <h1 style="${FUENTE}margin:14px 0 6px;font-size:24px;line-height:1.3;color:${COLOR.texto};">${escapar(c.nombre)}${c.negocio ? ` <span style="color:${COLOR.suave};font-weight:400;">· ${escapar(c.negocio)}</span>` : ""}</h1>
    <p style="margin:0 0 22px;color:${COLOR.suave};">Llegó una solicitud desde el formulario de benedettowebs.cl.</p>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${COLOR.suave};text-transform:uppercase;letter-spacing:.06em;">Su proyecto</p>
    <div style="margin:0 0 24px;padding:16px 18px;background:#f6f7fb;border-left:4px solid ${COLOR.primario};border-radius:8px;font-size:15px;">${conSaltos(c.mensaje)}</div>
    ${tablaDatos(datos)}
    <div style="margin-top:24px;">${botones}</div>`;

  return layout({
    preheader: `${c.nombre}${c.negocio ? " · " + c.negocio : ""}: ${c.mensaje.slice(0, 90)}`,
    contenido,
    pie: `Puedes responder directamente a este correo y le llegará a ${escapar(c.email)}.`
  });
}

// Correo de confirmación que le llega al cliente
function correoConfirmacion(c, contacto) {
  const resumen = [
    ["Tipo de página", c.tipo],
    ["Quiere incluir", c.incluir],
    ["Plazo", c.plazo],
    ["Tu proyecto", c.mensaje]
  ].filter(([, v]) => v);
  const wa = contacto.whatsapp.replace(/\D/g, "");

  const paso = (n, titulo, texto) => `
    <tr>
      <td width="40" style="vertical-align:top;padding:0 0 14px;">
        <div style="${FUENTE}width:30px;height:30px;line-height:30px;border-radius:50%;background:${COLOR.primario};color:#fff;text-align:center;font-weight:700;font-size:14px;">${n}</div>
      </td>
      <td style="${FUENTE}vertical-align:top;padding:4px 0 14px;font-size:15px;color:${COLOR.texto};"><strong>${titulo}</strong><br><span style="color:${COLOR.suave};">${texto}</span></td>
    </tr>`;

  const contenido = `
    ${etiqueta("Solicitud recibida")}
    <h1 style="${FUENTE}margin:14px 0 10px;font-size:24px;line-height:1.3;color:${COLOR.texto};">¡Gracias, ${escapar(c.nombre.split(" ")[0])}!</h1>
    <p style="margin:0 0 22px;">Recibí tu solicitud de cotización${c.negocio ? ` para <strong>${escapar(c.negocio)}</strong>` : ""}. La reviso y te respondo a la brevedad con un precio cerrado y un plazo estimado.</p>
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${COLOR.suave};text-transform:uppercase;letter-spacing:.06em;">Qué sigue</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
      ${paso(1, "Reviso tu solicitud", "Veo lo que necesitas y, si me falta algo, te pregunto.")}
      ${paso(2, "Te envío la cotización", "Un precio cerrado según el contenido de tu sitio, desde $30.000.")}
      ${paso(3, "Diseño y publico tu web", "Te muestro avances y ajustamos lo que necesites antes de publicar.")}
    </table>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${COLOR.suave};text-transform:uppercase;letter-spacing:.06em;">Lo que me contaste</p>
    ${tablaDatos(resumen)}
    <p style="margin:24px 0 10px;">¿Quieres agregar algo o prefieres conversarlo? Responde este correo o escríbeme:</p>
    ${wa ? boton(`https://wa.me/${wa}?text=${encodeURIComponent(`Hola Santiago, soy ${c.nombre}. Te acabo de enviar una solicitud de cotización.`)}`, "Escribir por WhatsApp", "#25d366") : ""}
    ${boton(`${SITIO}/#portafolio`, "Ver mi portafolio")}
    <p style="margin:26px 0 0;">Saludos,<br><strong>Santiago Benedetto</strong><br><span style="color:${COLOR.suave};">BenedettoWebs · Páginas web en Chile</span></p>`;

  return layout({
    preheader: "Recibí tu solicitud. Te respondo a la brevedad con un precio cerrado.",
    contenido,
    pie: `Recibiste este correo porque pediste una cotización en <a href="${SITIO}" style="color:${COLOR.suave};">benedettowebs.cl</a>.<br>
      <a href="https://www.instagram.com/${escapar(contacto.instagram)}" style="color:${COLOR.primario};text-decoration:none;">@${escapar(contacto.instagram)}</a> en Instagram`
  });
}

const texto = (c) =>
  [
    ["Nombre", c.nombre], ["Negocio", c.negocio], ["Correo", c.email], ["WhatsApp", c.telefono],
    ["Tipo de página", c.tipo], ["Quiere incluir", c.incluir], ["Plazo", c.plazo],
    ["Contenido listo", c.contenido], ["Proyecto", c.mensaje]
  ].filter(([, v]) => v).map(([l, v]) => `${l}: ${v}`).join("\n");

module.exports = { correoAviso, correoConfirmacion, texto };
