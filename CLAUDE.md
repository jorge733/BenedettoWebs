# BenedettoWebs

Proyecto de Santiago Benedetto (BenedettoWebs, La Reina, Santiago): páginas web para negocios del barrio desde $30.000, pago único.

Este repositorio es **la web de BenedettoWebs**, su **panel privado** (`panel/`), los **documentos** (`documentos/`), las funciones de Vercel (`api/`) y las **demos para prospectos** (`demos/`). Se publica solo en https://www.benedettowebs.cl con cada push a `main` (Vercel, tarda 30 a 45 segundos).

**Los sitios de clientes NO van en este repositorio.** Cada cliente tiene su propia carpeta en `C:\Users\saben\Clientes\<slug>\`, con su propio repositorio y proyecto en Vercel (ver "De demo a cliente").

## Reglas de trabajo

- Todo en español de Chile, con tono cercano.
- Commit y push solo cuando Santiago lo pida. Nunca incluir `posts$f.png` (archivo suelto que no es del proyecto).
- Todo lo que está en este repositorio queda publicado en benedettowebs.cl, salvo lo que está en `.vercelignore`. Nunca poner aquí datos privados de clientes (RUT, correos, montos, claves).
- Antes de dar algo por listo: revisar en computador (1366×850) y celular (390×844), sin que nada se salga de la pantalla y sin errores en consola.

## Demos para prospectos (`demos/<slug>/`)

Una demo es una propuesta para un negocio que todavía no es cliente, idealmente uno sin web o con la web caída o anticuada.

- **Siempre inmersiva desde la primera versión:** escena propia del rubro en la portada que reacciona al mouse y al scroll, barra de avance, contadores, apariciones al bajar, un recorrido que avanza con el scroll y al menos una sección interactiva ligada al negocio. Los dibujos deben verse reales, no de juguete.
- **Solo datos reales** (ficha de Google, web anterior, reseñas). Lo que no se pudo confirmar se marca como "en la versión final".
- **Incluye:**
  - aviso de demo arriba y botón "Comparar" con el comparador antes/ahora (`comparar/antes-*.png` y `comparar/ahora-*.png`, en celular y computador);
  - `og.png` de 1200×630 y `noindex`;
  - modo `?captura` (sin aviso ni botón, con las animaciones en su estado final) y respeto a `prefers-reduced-motion`.
- **El formulario de WhatsApp** muestra un aviso en la demo; el envío real queda comentado.
- **Al terminarla**, sumarla al inicio de `DEMOS` en `panel/demos.js` con el mensaje de contacto y el seguimiento.

## De demo a cliente

Cuando un negocio dice que sí, se sigue este orden. El panel y los documentos ya existen; no hay que inventar nada nuevo.

1. **Panel → Demos:** cambiar la demo a "Aceptó" y usar "+ Crear ficha de cliente". La ficha parte en estado **Cotizando**.
2. **Cotización y acuerdo:**
   - Llenar `documentos/cotizacion.html` y `documentos/acuerdo.html`. El acuerdo usa 50% al firmar y 50% al aprobar, 2 rondas de cambios, dominio a nombre del cliente y 30 días de garantía.
   - El acuerdo lo firma también el apoderado de Santiago.
   - Mandarlos con la plantilla de correo **2 · Envío de cotización** y guardar los PDF en la ficha.
3. **Anticipo pagado:** pasar la ficha a **En desarrollo**, mandar **4 · Bienvenida e inicio** y pedir el material: logo, fotos, precios, textos y lo que la demo dejó como "en la versión final". Si se demora, mandar **5 · Contenido pendiente**.
4. **Crear la carpeta del cliente** (esto lo hace Claude desde esta sesión):
   - Crear `C:\Users\saben\Clientes\<slug>\` y copiar ahí la demo (`index.html` y sus imágenes, sin `comparar/`).
   - Copiar `proceso/CLAUDE-cliente.md` como `CLAUDE.md` y llenarlo con los datos del cliente.
   - Iniciar git, crear su repositorio en GitHub y conectarlo a un proyecto nuevo de Vercel.
5. **Convertir la demo en sitio final** (lista completa en `proceso/CLAUDE-cliente.md`): quitar el aviso, el comparador y el `noindex`, activar WhatsApp de verdad y poner fotos, datos reales y URLs del dominio del cliente.
6. **Revisión:** mandar el link de vista previa de Vercel con **6 · Avance para revisión**. Son 2 rondas de cambios; lo demás se cotiza aparte.
7. **Dominio:**
   - Registrado en NIC Chile a nombre del cliente. Santiago solo conecta los DNS a Vercel.
   - Anotar en la ficha la fecha "Dominio vence": el cron `api/recordatorios-dominio.js` avisa solo 30 y 7 días antes.
8. **Publicación:**
   - Conectar el dominio y probar en celular y computador, incluido el botón de WhatsApp.
   - Pedir al cliente que ponga la web en "Sitio web" de su ficha de Google.
   - Mandar **7 · Web publicada y saldo** y, con el pago, **7b · Envío de acta de entrega** (`documentos/acta.html`; nunca claves en el acta).
   - Pasar la ficha a **Entregado**.
9. **Después:**
   - Durante 30 días de garantía, corregir errores de funcionamiento sin costo.
   - Al mes, mandar **9 · Pedir reseña**.
   - Sumar el sitio al portafolio (`README.md` y la sección `#portafolio` de `index.html`, con captura en `img/portafolio/`) si el cliente está de acuerdo.

## Sesiones de Claude

- **Esta carpeta (BenedettoWebs):** demos nuevas, cambios a la web, al panel y a los documentos, y el paso 4 de arriba, que crea la carpeta de cada cliente.
- **Una sesión por cliente**, abierta en `C:\Users\saben\Clientes\<slug>\` y con el nombre del negocio. Ahí se hacen sus cambios, sus revisiones y su publicación. Su `CLAUDE.md` dice en qué etapa va.
