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

### Correos del formulario de cotización

El formulario llama a `api/cotizar.js` (función de Vercel), que envía dos correos con [Resend](https://resend.com): un aviso a Santiago con los datos (responder le llega al cliente) y una confirmación al cliente. Las plantillas están en `api/_correos.js`; el correo de destino y el remitente están al inicio de `api/cotizar.js`.

Configuración (una sola vez):

1. Crear una cuenta gratis en resend.com.
2. En **Domains**, agregar `benedettowebs.cl` y copiar los registros DNS que indica (TXT/MX de envío) en el proveedor del dominio. Esperar a que aparezca como *Verified*.
3. En **API Keys**, crear una clave con permiso *Sending access*.
4. En Vercel → proyecto → **Settings → Environment Variables**, agregar `RESEND_API_KEY` con esa clave (Production) y volver a desplegar.

## Sitio publicado

https://www.benedettowebs.cl (Vercel, se actualiza con cada push a `main`).
