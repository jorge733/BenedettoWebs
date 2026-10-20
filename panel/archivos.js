// Archivos subidos (PDF, Word, imágenes…) guardados en Firestore, sin Firebase Storage
// (Storage exige el plan Blaze con tarjeta). Cada archivo se parte en trozos de ~900 KB,
// porque un documento de Firestore no puede pasar de 1 MB: documentos/{id}/partes/000, 001…
import { db, collection, doc, getDocs, setDoc, writeBatch, Bytes } from "./firebase.js";

const TROZO = 900 * 1024;
export const MAXIMO = 15 * 1024 * 1024;

const partes = (docId) => collection(db, "documentos", docId, "partes");

export async function subirPartes(docId, archivo, alAvanzar = () => {}) {
  const datos = new Uint8Array(await archivo.arrayBuffer());
  const total = Math.max(1, Math.ceil(datos.length / TROZO));
  for (let i = 0; i < total; i++) {
    const trozo = datos.subarray(i * TROZO, (i + 1) * TROZO);
    await setDoc(doc(partes(docId), String(i).padStart(3, "0")), { datos: Bytes.fromUint8Array(trozo) });
    alAvanzar((i + 1) / total);
  }
  return total;
}

export async function bajarArchivo(docId, tipo) {
  const snap = await getDocs(partes(docId));
  const trozos = snap.docs.sort((a, b) => a.id.localeCompare(b.id)).map((d) => d.data().datos.toUint8Array());
  return new Blob(trozos, { type: tipo || "application/octet-stream" });
}

// Agrega al lote el borrado de las partes de un documento (el documento principal lo borra quien llama)
export async function borrarPartes(docId, lote = writeBatch(db)) {
  const snap = await getDocs(partes(docId));
  snap.docs.forEach((d) => lote.delete(d.ref));
  return lote;
}

export const peso = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
