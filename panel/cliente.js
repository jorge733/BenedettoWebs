// Ficha del cliente: datos, documentos guardados y creación de documentos nuevos
import {
  db, TIPOS, ESTADOS, exigirSesion, siguienteNumero,
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp,
  ms, fechaCorta, html
} from "./firebase.js";

const $ = (id) => document.getElementById(id);
const form = $("formCliente");
let id = new URLSearchParams(location.search).get("id");
let cliente = {};
let documentos = [];

$("estado").innerHTML = ESTADOS.map((e) => `<option>${e}</option>`).join("");
$("nuevos").innerHTML = Object.entries(TIPOS)
  .map(([tipo, t]) => `<button class="btn btn-ghost btn-sm" data-nuevo="${tipo}">+ ${t.nombre}</button>`).join("");

await exigirSesion();
$("app").hidden = false;

if (id) {
  const snap = await getDoc(doc(db, "clientes", id));
  if (!snap.exists()) {
    alert("Este cliente no existe o fue eliminado.");
    location.href = "./";
    throw new Error("Cliente no encontrado");
  }
  cliente = snap.data();
  for (const [campo, valor] of Object.entries(cliente)) if (form.elements[campo]) form.elements[campo].value = valor;
  mostrarCliente();
  await cargarDocumentos();
}

function mostrarCliente() {
  const nombre = cliente.negocio || cliente.nombre || "Nuevo cliente";
  $("titulo").textContent = nombre;
  document.title = `${nombre} · Panel BenedettoWebs`;
  $("estadoActual").hidden = !cliente.estado;
  $("estadoActual").textContent = cliente.estado;
  $("estadoActual").dataset.estado = cliente.estado;
  $("seccionDocs").hidden = $("zonaBorrar").hidden = !id;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
  $("msgCliente").className = "mensaje";
  $("msgCliente").textContent = "Guardando…";
  try {
    if (id) {
      await updateDoc(doc(db, "clientes", id), { ...datos, actualizado: serverTimestamp() });
    } else {
      const ref = await addDoc(collection(db, "clientes"), { ...datos, creado: serverTimestamp(), actualizado: serverTimestamp() });
      id = ref.id;
      history.replaceState(null, "", `?id=${id}`);
      await cargarDocumentos();
    }
    cliente = { ...cliente, ...datos };
    mostrarCliente();
    $("msgCliente").className = "mensaje ok";
    $("msgCliente").textContent = "Guardado ✓";
  } catch (err) {
    $("msgCliente").className = "mensaje error";
    $("msgCliente").textContent = "No se pudo guardar: " + err.message;
  }
});

async function cargarDocumentos() {
  const snap = await getDocs(query(collection(db, "documentos"), where("clienteId", "==", id)));
  documentos = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b.creado) - ms(a.creado));
  $("sinDocs").hidden = documentos.length > 0;
  $("docs").innerHTML = documentos.map((d) => {
    const t = TIPOS[d.tipo];
    const detalle = [d.total, d.cotizacion && d.tipo !== "cotizacion" ? `Cotización ${d.cotizacion}` : ""].filter(Boolean).join(" · ");
    return `<li>
      <div class="doc-info"><strong>${t.nombre} ${t.prefijo} ${html(d.numero)}</strong>
        <span>${html(detalle)}${detalle ? " · " : ""}editado ${fechaCorta(d.actualizado || d.creado)}</span></div>
      <a class="btn btn-sm" href="${t.pagina}?doc=${d.id}">Abrir</a>
      <button class="btn btn-peligro btn-sm" data-borrar="${d.id}">Eliminar</button>
    </li>`;
  }).join("");
}

// Documento nuevo: se crea con los datos del cliente y la última cotización, y se abre la plantilla
$("nuevos").addEventListener("click", async (e) => {
  const boton = e.target.closest("[data-nuevo]");
  if (!boton) return;
  const tipo = boton.dataset.nuevo;
  boton.disabled = true;
  try {
    const ultimaCot = documentos.find((d) => d.tipo === "cotizacion");
    const numero = await siguienteNumero(tipo);
    const datos = Object.fromEntries(["nombre", "negocio", "email", "telefono", "rut", "sitio"].map((k) => [k, cliente[k] || ""]));
    const ref = await addDoc(collection(db, "documentos"), {
      clienteId: id, tipo, numero,
      cotizacion: tipo === "cotizacion" ? numero : ultimaCot?.numero || "",
      total: tipo === "cotizacion" ? "" : ultimaCot?.total || "",
      datos, html: "",
      creado: serverTimestamp(), actualizado: serverTimestamp()
    });
    await updateDoc(doc(db, "clientes", id), { actualizado: serverTimestamp() });
    location.href = `${TIPOS[tipo].pagina}?doc=${ref.id}`;
  } catch (err) {
    alert("No se pudo crear el documento: " + err.message);
    boton.disabled = false;
  }
});

$("docs").addEventListener("click", async (e) => {
  const boton = e.target.closest("[data-borrar]");
  if (!boton || !confirm("¿Eliminar este documento? No se puede deshacer.")) return;
  await deleteDoc(doc(db, "documentos", boton.dataset.borrar));
  await cargarDocumentos();
});

$("borrarCliente").addEventListener("click", async () => {
  const nombre = cliente.negocio || cliente.nombre;
  if (prompt(`Esto elimina a ${nombre} y sus ${documentos.length} documentos para siempre. Escribe ELIMINAR para confirmar.`) !== "ELIMINAR") return;
  const batch = writeBatch(db);
  documentos.forEach((d) => batch.delete(doc(db, "documentos", d.id)));
  batch.delete(doc(db, "clientes", id));
  await batch.commit();
  location.href = "./";
});
