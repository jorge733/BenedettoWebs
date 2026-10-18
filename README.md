# BenedettoWebs

Sitio web promocional de **BenedettoWebs**, el emprendimiento de **Santiago Benedetto** (16 años), apasionado por la tecnología, que diseña y desarrolla páginas web a medida desde **$30.000 en un pago único**, según el contenido que el cliente necesite.

## Portafolio

- [listadecompras.website](https://listadecompras.website)
- [ehda.cl](https://ehda.cl)
- [inversionespellegrini.cl](https://inversionespellegrini.cl)
- [negramora.cl](https://negramora.cl)
- [dosanillos.cl](https://dosanillos.cl)
- [uniluva.com](https://uniluva.com)
- [serviceplanet.cl](https://serviceplanet.cl)
- [academicamichelangelo.site](https://academicamichelangelo.site)

## Estructura

| Archivo | Descripción |
| --- | --- |
| `index.html` | Contenido de la página |
| `styles.css` | Estilos y diseño responsive |
| `script.js` | Menú, animaciones y contacto |
| `favicon.svg` | Ícono del sitio |

## Configurar contacto

Edita el objeto `CONTACTO` al inicio de `script.js` con tu WhatsApp, correo e Instagram. Los botones y el formulario se activan automáticamente.

## Sitio publicado

https://www.benedettowebs.cl (Vercel, se actualiza con cada push a `main`).

## Vistas previas para clientes

Cada cliente puede ver su sitio antes de publicarlo en `benedettowebs.cl/vista-previa/<cliente>`, con botones para verlo como computador, tablet o celular y un botón para responder por WhatsApp. Estas páginas no aparecen en Google (`noindex` + `robots.txt`) ni están enlazadas desde el sitio: solo las ve quien tenga el link.

Para agregar un cliente:

1. Copia la carpeta `vista-previa/ejemplo` con el nombre del cliente, por ejemplo `vista-previa/panaderia-sol`.
2. En su `index.html`, cambia `cliente: "..."` por el nombre del negocio.
3. Reemplaza el contenido de `sitio/` con los archivos del sitio propuesto (debe tener su propio `index.html`).
4. Haz push a `main` y envía el link: `https://www.benedettowebs.cl/vista-previa/panaderia-sol`.

Cuando el cliente apruebe y el sitio quede en su dominio, borra su carpeta.
