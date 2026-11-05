# Cartas digitales con QR — Benedetto Webs

Cartas para restaurantes y cafés que se abren desde el celular escaneando un QR.
Todos los clientes usan **la misma plantilla**. Cada cliente tiene **su propia carpeta** con un archivo de datos (`datos.json`) y sus imágenes.

Dirección de cada carta: `https://www.benedettowebs.cl/carta/nombre-del-local`
Demo: `https://www.benedettowebs.cl/carta/cafe-almendra`

---

## Cómo está organizado

```
carta/
├── index.html        ← plantilla (la misma para todos, no se toca)
├── carta.css         ← diseño
├── carta.js          ← funciones: buscador, horario, categorías, etc.
├── config.json       ← dirección base que usan los QR (se cambia aquí y en ningún otro lugar)
└── clientes/
    ├── _nuevo-cliente/   ← carpeta modelo para copiar
    └── cafe-almendra/    ← la demo
        ├── datos.json    ← todo el contenido de la carta
        ├── img/          ← logo y fotos
        └── qr/           ← los QR generados (PNG y SVG)
scripts/
├── servidor-local.js ← para ver las cartas en tu computador
├── revisar-cartas.js ← busca errores en los datos.json
└── generar-qr.js     ← crea los QR
```

### Antes de empezar (una sola vez)

1. Instala **Node.js** (versión "LTS") desde https://nodejs.org. Es un programa gratis, se instala como cualquier otro.
2. Abre la carpeta del proyecto en una terminal:
   - En **Windows**: abre la carpeta `BenedettoWebs`, haz clic en la barra de direcciones, escribe `cmd` y presiona Enter.
   - En **Mac**: abre la app *Terminal*, escribe `cd ` (con espacio) y arrastra la carpeta `BenedettoWebs` a la ventana. Presiona Enter.
3. Escribe este comando y presiona Enter (descarga lo necesario para crear los QR):
   ```
   npm install
   ```

---

## 1. Ver la carta

En la terminal escribe:

```
npm run carta
```

Aparecerá una lista de direcciones. Abre en tu navegador: **http://localhost:3000/carta/cafe-almendra**

- Para verla como en un celular: en Chrome presiona `F12` (o clic derecho → *Inspeccionar*) y luego el ícono del celular 📱 arriba a la izquierda.
- Cada vez que guardes un cambio en un `datos.json`, solo recarga la página.
- Para apagar el servidor: haz clic en la terminal y presiona `Ctrl + C`.

> Nota: abrir el archivo `index.html` con doble clic **no funciona**. Siempre usa `npm run carta`.

---

## 2. Agregar un cliente

1. Copia la carpeta `carta/clientes/_nuevo-cliente` y pégala dentro de la misma carpeta `clientes`.
2. Cámbiale el nombre a la copia. **Ese nombre será la dirección de la carta.** Usa solo minúsculas, números y guiones, sin tildes, sin ñ y sin espacios.
   - ✅ `la-picada-de-juan` → `/carta/la-picada-de-juan`
   - ❌ `La Picada de Juán`
3. Pon el logo y las fotos dentro de su carpeta `img/`. Recomendado: fotos cuadradas, en `.jpg` o `.webp`, de unos 800×800 px y de menos de 200 KB cada una (así la carta abre rápido). Puedes achicarlas gratis en https://squoosh.app.
4. Abre `datos.json` con un editor de texto (recomendado: **Visual Studio Code**, gratis) y cambia los datos.
5. Revisa que no haya errores:
   ```
   npm run revisar
   ```
   Si algo está mal, te dirá qué y dónde.
6. Mira cómo quedó con `npm run carta`.

### Qué significa cada dato del `datos.json`

| Dato | Qué es | Ejemplo |
| --- | --- | --- |
| `nombre` | Nombre del local | `"Café Almendra"` |
| `descripcion` | Frase corta bajo el nombre | `"Café de especialidad"` |
| `logo` | Archivo del logo dentro de `img/` | `"img/logo.png"` |
| `colores` | `principal` (encabezado), `acento` (precios y botones), `fondo`, `texto`. Formato `#RRGGBB` | `"#3B2A20"` |
| `tipografia` | Letra de los títulos. Opciones: `Fraunces`, `Playfair Display`, `DM Serif Display`, `Lora`, `Outfit`, `Poppins`, `Bricolage Grotesque`, `Josefin Sans` | `"Lora"` |
| `direccion` | Dirección del local | `"Av. Italia 1450, Providencia"` |
| `mapa` | Enlace de Google Maps (en Maps: *Compartir* → *Copiar vínculo*). Si lo dejas vacío `""`, se usa la dirección | `"https://maps.app.goo.gl/..."` |
| `whatsapp` | Número con +56 | `"+56912345678"` |
| `mensajeWhatsapp` | Texto que aparece escrito al abrir WhatsApp (opcional) | `"Hola, quiero reservar"` |
| `instagram` | Usuario, sin @ | `"cafealmendra"` |
| `horario` | Un día por línea: `"08:00 - 20:00"`, con pausa: `"12:00 - 15:00, 19:00 - 23:00"`, o `"cerrado"` | `"lunes": "08:00 - 20:00"` |
| `nota` | Texto al final de la carta (opcional) | `"Precios con IVA incluido"` |
| `demo` | `true` muestra la franja "Carta de demostración". **Para clientes reales: `false`** | `false` |
| `categorias` | Lista de categorías, cada una con `nombre`, `descripcion` y `productos` | |

Cada **producto** puede tener:

| Dato | Qué es |
| --- | --- |
| `nombre` | Nombre del plato |
| `descripcion` | Descripción corta |
| `precio` | Número **sin punto ni signo $**: `4500` se muestra como **$4.500** |
| `variantes` | En vez de `precio`, para tamaños: `[{ "nombre": "Chico", "precio": 2500 }, { "nombre": "Grande", "precio": 3200 }]` |
| `foto` | Opcional. `"img/lomo.jpg"`. Si no hay foto, borra esa línea |
| `etiquetas` | Opcional: `["vegetariano", "vegano", "sin gluten", "sin lactosa", "picante", "nuevo"]` |
| `destacado` | `true` lo muestra en "Recomendados de la casa" |
| `agotado` | `true` lo muestra en gris con la marca "Agotado" |

**Reglas para no romper el archivo** (son las causas de casi todos los errores):
- Los textos van entre comillas dobles `"así"`. Los números (`4500`) y `true`/`false` van **sin** comillas.
- Entre un dato y el siguiente va una coma `,`. **Después del último dato de una lista no va coma.**
- Si algo falla, `npm run revisar` te dice la línea aproximada.

---

## 3. Cambiar un precio

1. Abre `carta/clientes/nombre-del-local/datos.json`.
2. Busca el plato (`Ctrl + F` en Windows o `Cmd + F` en Mac) y cambia el número:
   ```
   "precio": 3400,   →   "precio": 3600,
   ```
3. Guarda, ejecuta `npm run revisar` y publica (ver punto 5).

Para marcar un plato como agotado, agrega o cambia `"agotado": true,`. Para que vuelva, cámbialo a `false`.
**El QR no cambia**: los clientes verán el precio nuevo con el mismo QR impreso.

---

## 4. Generar el QR

```
npm run qr
```

Crea los QR de **todos** los clientes. Para uno solo: `npm run qr la-picada-de-juan`.

Los archivos quedan en `carta/clientes/nombre-del-local/qr/`:
- `qr-nombre.png`: 2000 × 2000 px, para imprimir (sirve hasta unos 17 cm a buena calidad).
- `qr-nombre.svg`: para diseñar en Canva o Illustrator. Se puede agrandar sin perder calidad.

Consejos para imprimir: tamaño mínimo de 3 × 3 cm, sin recortar el borde blanco, y prueba escanearlo con tu celular antes de imprimir muchos.

**¿Cambia la dirección?** Si las cartas se publican en otro dominio, cambia `urlBase` en `carta/config.json` y vuelve a ejecutar `npm run qr`:
```json
{ "urlBase": "https://www.benedettowebs.cl/carta" }
```
⚠️ Si cambias la dirección, los QR ya impresos dejarán de funcionar. Decide la dirección final antes de imprimir.

---

## 5. Publicar en Vercel

Este proyecto ya está conectado a Vercel (es el mismo sitio de benedettowebs.cl). Cada vez que los cambios llegan a la rama `main` de GitHub, Vercel publica todo solo en 1 o 2 minutos.

**Opción fácil, desde la página de GitHub** (para cambios chicos, como un precio):
1. Entra a tu repositorio en github.com y abre `carta/clientes/nombre-del-local/datos.json`.
2. Haz clic en el lápiz ✏️ (*Edit this file*), haz el cambio y presiona **Commit changes**.
3. Espera 1 a 2 minutos y recarga la carta.

**Para un cliente nuevo** (con imágenes): en GitHub entra a `carta/clientes`, presiona **Add file → Upload files** y arrastra la carpeta completa del cliente (incluida la carpeta `qr`). Luego presiona **Commit changes**.

La configuración que hace funcionar la dirección `/carta/nombre-del-local` está en `vercel.json` (sección `rewrites`). No hay que tocarla al agregar clientes.

---

## Preguntas frecuentes

- **Una carta muestra "No encontramos esta carta".** El nombre de la carpeta no coincide con la dirección, o la carpeta no tiene `datos.json`.
- **Una carta muestra "La carta tiene un error".** Hay un error de comas o comillas en `datos.json`. Ejecuta `npm run revisar`.
- **No se ve una foto.** Revisa que el nombre del archivo en `datos.json` sea exactamente igual al de la carpeta `img/`, incluidas mayúsculas y la extensión (`.jpg` y `.JPG` son distintos).
- **Las fotos de la demo** son dibujos propios, hechos para este proyecto. No tienen derechos de autor de terceros.
