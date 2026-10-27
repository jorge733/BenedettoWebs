# Configurar el panel (una sola vez, ~10 minutos)

El panel guarda tus clientes y documentos en **Firebase**, con el plan gratis (Spark). No necesitas tarjeta.

## 1. Crear el proyecto

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google.
2. **Crear un proyecto** → nombre `benedettowebs-panel` → puedes desactivar Google Analytics → **Crear**.

## 2. Activar el inicio de sesión

1. Menú **Compilación → Authentication → Comenzar**.
2. En **Método de acceso**, activa **Google** → correo de asistencia: el tuyo → **Guardar**.
3. En **Configuración → Dominios autorizados**, agrega `benedettowebs.cl` y `www.benedettowebs.cl`.

> Entras con tu cuenta de Google, sin clave nueva. Solo tienen acceso `sabenedettoa@gmail.com` y `sabenedettoa@benedettowebs.cl`: si quieres otra, agrégala en `firestore.rules` y en `CORREOS` de `panel/firebase.js`.

## 3. Crear la base de datos

1. Menú **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: `southamerica-west1 (Santiago)` → **Iniciar en modo de producción**.
3. Pestaña **Reglas**: borra lo que hay, pega todo el contenido de `firestore.rules` (en la raíz del proyecto) y **Publicar**.

## 4. Conectar la web

1. Engranaje ⚙ → **Configuración del proyecto** → abajo en **Tus apps**, el ícono **</>** (Web).
2. Nombre `panel`, sin Firebase Hosting → **Registrar app**.
3. Copia los valores de `firebaseConfig` (apiKey, authDomain, projectId…) y pásamelos, o pégalos tú en `panel/firebase.js`.

Listo: entra a `www.benedettowebs.cl/panel` con tu correo y clave.

## Cómo se usa

- **Clientes**: crea un cliente con sus datos y su estado (Cotizando, En desarrollo, Entregado, Pausado).
- **Documentos**: dentro del cliente, sube el archivo que hiciste fuera (PDF, Word, Excel, imágenes…, hasta 15 MB): elígelo o arrástralo, indica el tipo (cotización, acuerdo, acta u otro) y, si es una cotización, el total, que se usa para rellenar los correos. Después puedes verlo, descargarlo o eliminarlo. Los archivos se guardan dentro de Firestore en partes de ~900 KB, así no hace falta Firebase Storage (que exige el plan Blaze con tarjeta); el plan gratis permite 1 GB en total.
- **Venta**: en la ficha de cada cliente anota el monto aprobado, la fecha en que aprobó la cotización y la fecha de entrega.
- **Resumen**: el botón "Resumen" muestra, como el Excel de control mensual, las ventas aprobadas de cada mes (según la fecha de aprobación), el costo mensual de IA y el resultado estimado, con el total del año. El costo de IA se cambia ahí mismo y se recuerda. Toca un mes para ver qué clientes lo componen; abajo avisa qué clientes tienen monto pero no fecha de aprobación.
- **Documentos antiguos**: los que se hicieron antes con las plantillas de la web siguen apareciendo en la lista y se abren con "Abrir".
- **Correos**: en la ficha del cliente, "Enviar correo" tiene 10 plantillas con diseño (respuesta, cotización, dos de seguimiento, bienvenida, contenido pendiente, avance, web publicada, recordatorio de pago y reseña). Se rellenan con los datos del cliente y su última cotización, muestran una vista previa y se envían desde `sabenedettoa@benedettowebs.cl` con copia oculta a ese mismo correo. Los datos de transferencia y el link de reseñas se recuerdan después del primer envío. Las plantillas están en `api/_plantillas.js` y usan la misma `RESEND_API_KEY` del formulario de cotización.
- **Seguimiento automático**: al enviar la plantilla de cotización, la casilla "Programar seguimiento automático" (marcada por defecto) deja agendados en Resend dos correos: "¿Pudiste revisar la cotización?" a los 3 días y "¿Seguimos con tu página web?" a los 7, cerca de las 10:00. Aparecen en la ficha como "Seguimiento programado". Se cancelan solos si cambias el estado del cliente a cualquiera distinto de "Cotizando" o si envías una cotización nueva; si el cliente te respondió por otro lado, usa el botón "Cancelar seguimiento".

- **Inicio**: arriba de la lista de clientes están las cifras del mes (ventas, cotizaciones abiertas, proyectos en desarrollo, tasa de cierre y dominios por vencer) y "Para atender": dominios que vencen en 30 días, entregas de la semana o atrasadas, y correos que el cliente abrió o que no le llegaron en los últimos 7 días.
- **Aperturas**: en "Correos enviados" cada correo muestra si fue entregado, abierto (y cuántas veces), si hizo clic o si no llegó. Lo avisa Resend; los correos enviados antes de activar esto no tienen estado.
- **Aviso de dominio**: todos los días a las 10:00 aprox. se revisa la fecha "Dominio vence" de cada cliente. A los 30 y a los 7 días antes le llega al cliente el correo "Tu dominio vence pronto" (con copia oculta para ti) y queda en sus correos enviados. Necesita que el cliente tenga correo y sitio web. Cuando renueve, cambia la fecha en su ficha y el próximo año vuelve a avisarse solo. También puedes enviarlo a mano con la plantilla "10 · Renovación de dominio".

## Aperturas y aviso de dominio (una sola vez, ~10 minutos)

Estas dos funciones escriben en Firestore desde el servidor, así que necesitan una clave de administrador de Firebase.

1. **Clave de Firebase**: Firebase → ⚙ Configuración del proyecto → **Cuentas de servicio** → **Generar nueva clave privada**. Se descarga un archivo `.json`. En Vercel → proyecto → **Settings → Environment Variables**, crea `FIREBASE_SERVICE_ACCOUNT` y pega como valor **todo el contenido** del archivo. Después borra el archivo de tu computador: con esa clave se puede leer y cambiar toda la base de datos.
2. **Clave del aviso diario**: en Vercel crea `CRON_SECRET` con una clave larga inventada (por ejemplo, 40 letras y números al azar). Vercel la usa para llamar a `api/recordatorios-dominio.js`.
3. **Seguimiento en Resend**: Resend → **Domains** → `benedettowebs.cl` → activa **Open tracking** y **Click tracking**.
4. **Webhook en Resend**: Resend → **Webhooks** → **Add webhook**. URL `https://www.benedettowebs.cl/api/resend-webhook`, eventos `email.delivered`, `email.opened`, `email.clicked`, `email.bounced` y `email.complained`. Copia el **Signing secret** (empieza con `whsec_`) y en Vercel créalo como `RESEND_WEBHOOK_SECRET`.
5. En Vercel → **Deployments**, vuelve a desplegar el último para que tome las variables.

Para revisar el aviso de dominio sin enviar nada: Vercel → **Settings → Cron Jobs** muestra la tarea y su historial; sus resultados aparecen en **Logs**.

> Las aperturas son aproximadas: algunos correos (por ejemplo, en iPhone) se marcan como abiertos aunque la persona no los haya leído, y otros bloquean las imágenes y no avisan. Los clics sí son confiables.

## Agenda y avisos por correo

- **Agenda** (menú lateral): arriba el brief del día (lo atrasado, lo de hoy, entregas, seguimientos que salen hoy, dominios y clientes que abrieron o hicieron clic en tus correos) y la siguiente idea sin hacer de `posts/ideas.md`. Abajo tus tareas agrupadas en Atrasadas, Hoy, Mañana, Esta semana, Más adelante y Sin fecha, y a la derecha los próximos 7 días.
- **Agregar rápido**: escribe en una línea, por ejemplo "Llamar a Daniela mañana 15:00 !". Entiende hoy, mañana, pasado mañana, en 3 días, los días de la semana, 12/11, horas como 15:00, 15h o "a las 3" (de 1 a 7 se toma como de la tarde), `!` para importante y #marketing, #admin, #personal o #clientes. Si el texto nombra a un cliente (por su negocio o su nombre completo), queda asociado. Toca una tarea para editarla y el círculo para completarla.
- **Avisos por correo** (botón arriba en la Agenda), a `sabenedettoa@benedettowebs.cl`:
  - **Brief diario**: a las 11:00 UTC (8:00 en Chile con horario de verano, 7:00 en invierno; en el plan gratis de Vercel puede llegar hasta una hora después). Lunes a viernes o todos los días. Si no hay nada que contar, no llega. "Ver el brief de hoy" y "Enviármelo ahora" sirven para probarlo.
  - **Recordatorios**: las tareas con fecha y hora dejan programado un correo en Resend (5, 15, 30 o 60 minutos antes). Si cambias, completas o eliminas la tarea, se reprograma o se cancela. Resend programa hasta 30 días antes: las más lejanas las programa el brief de cada mañana cuando entran en ese plazo, que también aplica el cambio si modificas la anticipación.
  - **Alertas**: al momento, la primera vez que un cliente hace clic en un correo del panel o cuando un correo no le llega. Las envía el mismo webhook de Resend de las aperturas.
- No necesita configuración nueva: usa las mismas `RESEND_API_KEY`, `CRON_SECRET` y `FIREBASE_SERVICE_ACCOUNT`. Las tareas se guardan en la colección `tareas` y los ajustes en `ajustes/agenda`. La tarea diaria está en `vercel.json` (`/api/brief-diario`); en Vercel → Settings → Cron Jobs ves su historial, y llamándola con `?prueba=1` responde lo que haría sin enviar nada.

## Respaldo

Firestore no borra nada por su cuenta, pero si eliminas un cliente desde el panel se eliminan también sus documentos y no se pueden recuperar.
