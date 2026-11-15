# Agente de WhatsApp (configurar una sola vez)

El agente responde solo el WhatsApp del negocio con Claude: atiende a interesados (precios, proceso, junta los datos para cotizar) y a clientes del panel (toma pedidos de cambios). Cuando algo te necesita, te llega un correo y una tarea ⚡ en la agenda.

- Código: `api/whatsapp.js` (la función) y `api/_agente-whatsapp.js` (lo que sabe y cómo habla: **edítalo si cambian precios o condiciones**).
- Conversaciones: Firestore → colección `whatsapp` (un documento por número, con sus `mensajes`).
- Si respondes tú desde la app, el agente **se calla 12 horas en ese chat**.
- **Apagarlo:** Firestore → `ajustes` → documento `whatsapp` → campo `activo` (booleano) en `false`. Vuelve con `true` o borrando el campo.

## 1. El número nuevo

1. Compra un chip nuevo y regístralo en la app **WhatsApp Business** (no la normal) en un celular. Ponle el nombre "BenedettoWebs", la foto y el horario.
2. Úsalo unos días de forma normal antes de conectarlo: Meta pide que el número tenga algo de actividad para la coexistencia.

## 2. La app en Meta

1. Entra a [developers.facebook.com](https://developers.facebook.com) con tu cuenta de Facebook → **Mis apps → Crear app** → caso de uso **"Conectarse con clientes a través de WhatsApp"** → asóciala a un portafolio comercial (créalo si no tienes, a nombre de BenedettoWebs).
2. En **WhatsApp → Configuración de la API**, agrega el número:
   - Si aparece la opción de **conectar un número que ya usa la app WhatsApp Business** (coexistencia), elígela y escanea el código QR desde la app del celular. Así sigues viendo y respondiendo desde tu celular, y el agente también responde.
   - Si no aparece, avísale a Claude antes de seguir: sin coexistencia el número deja de funcionar en la app y hay que ver las conversaciones de otra forma.
3. Copia el **Identificador del número de teléfono** → será `WHATSAPP_PHONE_NUMBER_ID`.
4. **Configuración de la app → Básica** → **Clave secreta de la app** → será `WHATSAPP_APP_SECRET`.

## 3. Token permanente

El token de la página de inicio dura 24 horas; hace falta uno que no venza.

1. [business.facebook.com](https://business.facebook.com) → **Configuración → Usuarios → Usuarios del sistema → Agregar** (rol administrador).
2. **Asignar activos:** tu app (control total) y tu cuenta de WhatsApp (control total).
3. **Generar token** → elige la app → caducidad **Nunca** → permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
4. Ese token será `WHATSAPP_TOKEN`. No lo pegues en el chat ni en el repositorio.

## 4. Clave de Claude

1. [console.anthropic.com](https://console.anthropic.com) → **Settings → API Keys → Create Key** (nombre: `whatsapp`).
2. Carga saldo en **Billing** (con US$10 parte bien) y pon un límite mensual en **Limits** para dormir tranquilo.
3. Esa clave será `ANTHROPIC_API_KEY`.

Costo aproximado: unos US$0,01 a 0,02 por respuesta. Responder a quien te escribe primero (dentro de 24 horas) es gratis en WhatsApp.

## 5. Variables en Vercel

Proyecto de benedettowebs.cl → **Settings → Environment Variables** (Production), agrega:

| Variable | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | la clave del paso 4 |
| `WHATSAPP_TOKEN` | el token del paso 3 |
| `WHATSAPP_PHONE_NUMBER_ID` | del paso 2.3 |
| `WHATSAPP_APP_SECRET` | del paso 2.4 |
| `WHATSAPP_VERIFY_TOKEN` | una palabra inventada por ti, por ejemplo `bw-agente-2026` |

Después haz **Redeploy** (o un push) para que las tome.

## 6. Conectar el webhook

1. En Meta: **WhatsApp → Configuración → Webhook → Editar**.
   - URL de devolución de llamada: `https://www.benedettowebs.cl/api/whatsapp`
   - Token de verificación: el mismo `WHATSAPP_VERIFY_TOKEN`.
   - **Verificar y guardar**.
2. En **Campos del webhook**, suscribe **`messages`** y, si usas coexistencia, **`smb_message_echoes`** (así el agente sabe cuándo respondiste tú).
3. Publica la app (**Modo: Activo**). Para eso Meta pide una URL de política de privacidad: puedes usar la de tu web si tienes una, o pedirle a Claude que la cree.

## 7. Probar

1. Desde tu WhatsApp personal, escríbele "hola" al número nuevo: debería responder en unos 5 a 10 segundos.
2. Pídele una cotización con datos: te tiene que llegar el correo "💬 WhatsApp: …" y una tarea en la agenda.
3. Responde tú desde la app WhatsApp Business y vuelve a escribir desde el personal: el agente no debería meterse.
4. Si no responde: Vercel → proyecto → **Logs**, filtra por `/api/whatsapp`.

## 8. Cuando quede andando

- Cambia el número en la web (`index.html`, `api/cotizar.js`, `api/_plantillas.js` y los documentos) si quieres que los nuevos interesados le escriban al agente.
- Revisa las primeras conversaciones y ajusta `api/_agente-whatsapp.js` con lo que veas.
