// Revisa que los datos.json de cada cliente estén bien escritos.
// Uso: npm run revisar              (todos los clientes)
//      npm run revisar cafe-almendra (solo uno)
const fs = require("fs");
const path = require("path");

const CARPETA = path.join(__dirname, "..", "carta", "clientes");
const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const sinTilde = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const esPrecio = (p) => (typeof p === "number" && p >= 0) || (typeof p === "string" && /^\$?\s*[\d.]+$/.test(p.trim()));

function lineaDelError(texto, mensaje) {
  const m = mensaje.match(/position (\d+)/);
  if (!m) return "";
  return ` (cerca de la línea ${texto.slice(0, Number(m[1])).split("\n").length})`;
}

function revisar(slug) {
  const errores = [];
  const avisos = [];
  const dir = path.join(CARPETA, slug);
  if (!slug.startsWith("_") && !/^[a-z0-9-]+$/.test(slug)) errores.push(`El nombre de la carpeta "${slug}" solo puede tener minúsculas, números y guiones (sin tildes, ñ ni espacios).`);
  const archivo = path.join(dir, "datos.json");
  if (!fs.existsSync(archivo)) return { errores: ["No existe el archivo datos.json"], avisos };
  const texto = fs.readFileSync(archivo, "utf8");
  let d;
  try { d = JSON.parse(texto); } catch (e) {
    return { errores: [`Error de formato${lineaDelError(texto, e.message)}. Revisa comas, comillas y llaves. Detalle: ${e.message}`], avisos };
  }
  const existe = (rel, que) => {
    if (!rel || /^https?:\/\//.test(rel) || rel.startsWith("/")) return;
    if (!fs.existsSync(path.join(dir, rel))) errores.push(`No encuentro la imagen ${que}: "${rel}"`);
  };
  if (!d.nombre) errores.push('Falta "nombre".');
  if (d.logo) existe(d.logo, "del logo"); else avisos.push('No tiene "logo".');
  ["principal", "acento", "fondo", "texto"].forEach((k) => {
    const c = d.colores?.[k];
    if (c && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) errores.push(`El color "${k}" debe ser como #3B2A20 (está "${c}").`);
  });
  if (d.whatsapp && String(d.whatsapp).replace(/\D/g, "").length < 11) avisos.push('El WhatsApp debería incluir el código de Chile, por ejemplo "+56912345678".');
  if (d.horario) {
    Object.entries(d.horario).forEach(([dia, v]) => {
      if (!DIAS.includes(sinTilde(dia))) errores.push(`Día desconocido en horario: "${dia}".`);
      else if (!/cerrad/i.test(v) && !/^\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}(\s*,\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})*\s*$/.test(v))
        errores.push(`Horario de ${dia} mal escrito: "${v}". Usa "08:00 - 20:00", "12:00 - 15:00, 19:00 - 23:00" o "cerrado".`);
    });
  } else avisos.push('No tiene "horario".');
  if (!Array.isArray(d.categorias) || !d.categorias.length) errores.push('Falta "categorias" con al menos una categoría.');
  let total = 0;
  (d.categorias || []).forEach((c, i) => {
    const donde = `Categoría ${i + 1} (${c.nombre || "sin nombre"})`;
    if (!c.nombre) errores.push(`${donde}: falta "nombre".`);
    const lista = c.productos || [];
    if (!lista.length) avisos.push(`${donde}: no tiene productos.`);
    lista.forEach((p, j) => {
      total++;
      const donde2 = `${donde} → producto ${j + 1} (${p.nombre || "sin nombre"})`;
      if (!p.nombre) errores.push(`${donde2}: falta "nombre".`);
      if (Array.isArray(p.variantes) && p.variantes.length) {
        p.variantes.forEach((v) => { if (!esPrecio(v.precio)) errores.push(`${donde2}: precio de "${v.nombre}" debe ser un número, por ejemplo 4500.`); });
      } else if (!esPrecio(p.precio)) errores.push(`${donde2}: el precio debe ser un número sin puntos, por ejemplo 4500.`);
      if (p.foto) existe(p.foto, `de ${p.nombre}`);
      ["agotado", "destacado"].forEach((k) => {
        if (k in p && typeof p[k] !== "boolean") errores.push(`${donde2}: "${k}" debe ser true o false (sin comillas).`);
      });
      if (p.etiquetas && !Array.isArray(p.etiquetas)) errores.push(`${donde2}: "etiquetas" debe ir entre corchetes, por ejemplo ["vegetariano"].`);
    });
  });
  return { errores, avisos, total };
}

const pedido = process.argv[2];
const clientes = pedido ? [pedido] : fs.readdirSync(CARPETA).filter((c) => !c.startsWith(".") && fs.statSync(path.join(CARPETA, c)).isDirectory());
let hayErrores = false;
for (const c of clientes) {
  if (!fs.existsSync(path.join(CARPETA, c))) { console.log(`✗ No existe la carpeta carta/clientes/${c}`); hayErrores = true; continue; }
  const { errores, avisos, total } = revisar(c);
  if (errores.length) {
    hayErrores = true;
    console.log(`\n✗ ${c}: ${errores.length} error(es)`);
    errores.forEach((e) => console.log("   - " + e));
  } else console.log(`\n✓ ${c}: todo bien (${total} productos)`);
  avisos.forEach((a) => console.log("   aviso: " + a));
}
console.log("");
process.exitCode = hayErrores ? 1 : 0;
module.exports = { revisar };
