# [Nombre del negocio]

Sitio web de un cliente de BenedettoWebs (Santiago Benedetto). Esta carpeta es solo de este cliente: su propio repositorio y su propio proyecto en Vercel.
El proceso completo está en `C:\Users\saben\BenedettoWebs\CLAUDE.md` ("De demo a cliente").

## Cliente

- **Negocio:** [Nombre] · [rubro] · [dirección]
- **Contacto:** [nombre de la persona] · WhatsApp [+56 9 ...]. El correo y el RUT están en la ficha del panel; no se escriben aquí.
- **Demo de origen:** https://www.benedettowebs.cl/demos/[slug]/
- **Dominio:** [dominio.cl] · a nombre del cliente en NIC Chile · vence [aaaa-mm-dd] (anotado en la ficha del panel)
- **Vista previa:** [https://<proyecto>.vercel.app]
- **Repositorio:** [https://github.com/...]

## Lo acordado (ver cotización y acuerdo en la ficha del panel)

- **Precio:** $[30.000], 50% al firmar y 50% al aprobar el sitio.
- **Incluye:** [secciones acordadas]
- **Rondas de cambios:** 2. Usadas: [0]
- **Plazo:** [7] días hábiles desde el anticipo y el contenido. Fecha estimada: [aaaa-mm-dd]
- **No incluye (se cotiza aparte):** [ ]

## Etapa actual

[Cotizando / Esperando contenido / En desarrollo / En revisión / Publicado / Garantía hasta aaaa-mm-dd]

## Material

- [ ] Logo en buena calidad
- [ ] Fotos reales (local, equipo, productos o trabajos)
- [ ] Precios y servicios actualizados
- [ ] Datos que la demo dejó como "en la versión final": [lista]
- [ ] WhatsApp y horario confirmados

## De demo a sitio final

- [ ] Quitar el aviso de demo (`.aviso-demo`), el botón "Comparar", el modal del comparador y la carpeta `comparar/`
- [ ] Cambiar `noindex, nofollow` por `index, follow`
- [ ] `canonical`, `og:url` y `og:image` con el dominio del cliente
- [ ] Hacer una `og.png` nueva, sin "Propuesta de diseño · Demo"
- [ ] Activar el envío real a WhatsApp (`window.open("https://wa.me/...")`) y quitar el aviso de demo del formulario
- [ ] Quitar los textos "en la versión final" y poner el contenido real (fotos, reseñas, equipo, precios)
- [ ] Cambiar el pie a "Diseño y desarrollo: BenedettoWebs" con el link a benedettowebs.cl
- [ ] Agregar `robots.txt` y `sitemap.xml` con el dominio del cliente
- [ ] Revisar en computador (1366×850) y celular (390×844): nada se sale de la pantalla y no hay errores en consola
- [ ] Probar el botón y el formulario de WhatsApp con el cliente

## Publicación

- [ ] DNS del dominio apuntando a Vercel, con `www` y sin `www`
- [ ] El cliente puso la web en "Sitio web" de su ficha de Google
- [ ] Correo "7 · Web publicada y saldo" y, con el pago, "7b · Envío de acta de entrega"
- [ ] Ficha del panel en "Entregado"

## Historial

- [aaaa-mm-dd] [qué se hizo]

## Reglas

- Commit y push solo cuando Santiago lo pida.
- Nunca escribir claves, RUT ni datos de pago en este repositorio.
- Cambios fuera de lo acordado: avisar a Santiago antes de hacerlos, porque se cotizan aparte.
