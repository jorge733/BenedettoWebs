// Genera el código QR de cada carta en PNG (para imprimir) y SVG (para diseñar).
// Uso: npm run qr                (todos los clientes)
//      npm run qr cafe-almendra  (solo uno)
// La dirección base se cambia en carta/config.json
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const RAIZ = path.join(__dirname, "..");
const CARPETA = path.join(RAIZ, "carta", "clientes");
const { urlBase } = JSON.parse(fs.readFileSync(path.join(RAIZ, "carta", "config.json"), "utf8"));
const base = String(urlBase || "").replace(/\/+$/, "");

const OPCIONES = {
  errorCorrectionLevel: "Q", // resiste manchas o un logo encima
  margin: 4,                 // borde blanco necesario para que escanee bien
  color: { dark: "#000000", light: "#FFFFFF" }
};

async function generar(slug) {
  const dir = path.join(CARPETA, slug);
  if (!fs.existsSync(path.join(dir, "datos.json"))) {
    console.log(`✗ ${slug}: no tiene datos.json, lo salto.`);
    return;
  }
  const url = `${base}/${slug}`;
  const salida = path.join(dir, "qr");
  fs.mkdirSync(salida, { recursive: true });
  const png = path.join(salida, `qr-${slug}.png`);
  const svg = path.join(salida, `qr-${slug}.svg`);
  await QRCode.toFile(png, url, { ...OPCIONES, type: "png", width: 2000 }); // ~17 cm a 300 dpi
  fs.writeFileSync(svg, await QRCode.toString(url, { ...OPCIONES, type: "svg" }));
  console.log(`✓ ${slug}\n   apunta a: ${url}\n   ${path.relative(RAIZ, png)}\n   ${path.relative(RAIZ, svg)}`);
}

(async () => {
  if (!/^https?:\/\//.test(base)) {
    console.log('✗ Revisa "urlBase" en carta/config.json (debe empezar con https://).');
    process.exit(1);
  }
  const pedido = process.argv[2];
  const clientes = pedido
    ? [pedido]
    : fs.readdirSync(CARPETA).filter((c) => !c.startsWith("_") && !c.startsWith(".") && fs.statSync(path.join(CARPETA, c)).isDirectory());
  for (const c of clientes) await generar(c);
})();
