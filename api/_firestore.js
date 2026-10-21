// Acceso a Firestore desde las funciones de Vercel, con permisos de administrador (no pasa por firestore.rules).
// Variable de entorno en Vercel: FIREBASE_SERVICE_ACCOUNT, con el JSON completo de la clave de la cuenta de servicio
// (Firebase → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada).
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

function db() {
  if (!getApps().length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error("Falta FIREBASE_SERVICE_ACCOUNT");
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return getFirestore();
}

module.exports = { db, FieldValue, Timestamp };
