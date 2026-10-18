// Panel BenedettoWebs: conexión con Firebase (inicio de sesión y base de datos Firestore)
// Pega aquí la configuración de tu app web: Firebase → Configuración del proyecto → Tus apps → Web.
// Estos datos no son secretos: lo que protege la información son las reglas de firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyDnNaJWH3PMpex5B3vlCMPR96CHZRSXDqI",
  authDomain: "benedettowebs-panel.firebaseapp.com",
  projectId: "benedettowebs-panel",
  storageBucket: "benedettowebs-panel.firebasestorage.app",
  messagingSenderId: "840827016119",
  appId: "1:840827016119:web:5008e7a7dcc855698bce32"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, writeBatch, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export { onAuthStateChanged, signOut };
export { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp };

export const configurado = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
const app = configurado ? initializeApp(firebaseConfig) : null;
export const auth = app && getAuth(app);
export const db = app && getFirestore(app);

// Cuentas de Google que pueden entrar (las mismas que en firestore.rules)
export const CORREOS = ["sabenedettoa@gmail.com", "sabenedettoa@benedettowebs.cl"];
export const entrarConGoogle = () =>
  signInWithPopup(auth, new GoogleAuthProvider().setCustomParameters({ prompt: "select_account" }));

// Tipos de documento: página de la plantilla y prefijo del número
export const TIPOS = {
  cotizacion: { nombre: "Cotización", prefijo: "COT", pagina: "/documentos/cotizacion.html" },
  acuerdo: { nombre: "Acuerdo de trabajo", prefijo: "ACU", pagina: "/documentos/acuerdo.html" },
  acta: { nombre: "Acta de entrega", prefijo: "ACT", pagina: "/documentos/acta.html" }
};

export const ESTADOS = ["Cotizando", "En desarrollo", "Entregado", "Pausado"];

// Espera la sesión; si no hay, manda al inicio de sesión y vuelve a esta página después
export function exigirSesion() {
  if (!configurado) {
    location.href = "/panel/";
    return new Promise(() => {});
  }
  return new Promise((resolver) => {
    const parar = onAuthStateChanged(auth, (usuario) => {
      parar();
      if (usuario) return resolver(usuario);
      location.href = "/panel/?volver=" + encodeURIComponent(location.pathname + location.search);
    });
  });
}

// Número correlativo por tipo y año: 2026-001, 2026-002...
export async function siguienteNumero(tipo) {
  const anio = new Date().getFullYear();
  const ref = doc(db, "contadores", `${tipo}-${anio}`);
  const n = await runTransaction(db, async (t) => {
    const actual = (await t.get(ref)).data()?.n || 0;
    t.set(ref, { n: actual + 1 });
    return actual + 1;
  });
  return `${anio}-${String(n).padStart(3, "0")}`;
}

export const ms = (fecha) => fecha?.toMillis?.() ?? 0;
export const fechaCorta = (fecha) =>
  fecha?.toDate ? fecha.toDate().toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }) : "—";

// Escapa texto antes de ponerlo en HTML
export const html = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
