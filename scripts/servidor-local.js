// Servidor para ver las cartas en tu computador, igual que en Vercel.
// Uso: npm run carta   → abre http://localhost:3000/carta/cafe-almendra
const http = require("http");
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const PUERTO = Number(process.env.PORT) || 3000;
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon"
};

http.createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  // Igual que vercel.json: /carta/nombre-del-local → plantilla
  if (/^\/carta\/[a-z0-9-]+\/?$/i.test(ruta) && !/^\/carta\/clientes\/?$/.test(ruta)) ruta = "/carta/index.html";
  if (ruta.endsWith("/")) ruta += "index.html";
  const archivo = path.normalize(path.join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  fs.readFile(archivo, (err, datos) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("No encontrado"); }
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(archivo).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(datos);
  });
}).listen(PUERTO, () => {
  const clientes = fs.readdirSync(path.join(RAIZ, "carta/clientes")).filter((c) => !c.startsWith("_") && !c.startsWith("."));
  console.log("\n  Cartas disponibles:");
  clientes.forEach((c) => console.log(`  → http://localhost:${PUERTO}/carta/${c}`));
  console.log("\n  Para detener el servidor presiona Ctrl + C\n");
});
