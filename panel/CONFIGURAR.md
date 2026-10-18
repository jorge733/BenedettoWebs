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
- **Documentos**: dentro del cliente, crea una cotización, un acuerdo o un acta. Se abre la plantilla ya completa con los datos del cliente y un número correlativo (2026-001, 2026-002…). El acuerdo y el acta toman el número y el total de la última cotización.
- **Guardado**: cada cambio se guarda solo (arriba dice "Guardado ✓"). También puedes apretar Ctrl+S.
- **PDF**: "Guardar PDF" funciona igual que antes, para enviarlo al cliente.

## Respaldo

Firestore no borra nada por su cuenta, pero si eliminas un cliente desde el panel se eliminan también sus documentos y no se pueden recuperar.
