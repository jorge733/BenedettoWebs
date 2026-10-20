// Ficha del cliente: datos, documentos subidos y correos
import {
  db, TIPOS, ESTADOS, exigirSesion,
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, query, where, writeBatch, serverTimestamp,
  ms, fechaCorta, html, clp, numero
} from "./firebase.js";
import { subirPartes, bajarArchivo, borrarPartes, peso, MAXIMO } from "./archivos.js";
import { iniciarCorreo } from "./correo.js";

const $ = (id) => document.getElementById(id);
const form = $("formCliente");
let id = new URLSearchParams(location.search).get("id");
let cliente = {};
let documentos = [];

// Tipos para los archivos subidos: los de las plantillas antiguas más "Otro"
const NOMBRES = { ...Object.fromEntries(Object.entries(TIPOS).map(([k, t]) => [k, t.nombre])), otro: "Otro" };

$("estado").innerHTML = ESTADOS.map((e) => `<option>${e}</option>`).join("");
$("tipoDoc").innerHTML = Object.entries(NOMBRES).map(([k, n]) => `<option value="${k}">${n}</option>`).join("");

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
  iniciarCorreo(id, () => cliente, () => documentos);
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
  datos.monto = form.elements.monto.value = clp(numero(datos.monto));
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
      iniciarCorreo(id, () => cliente, () => documentos);
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
    if (d.archivo) {
      const detalle = [NOMBRES[d.tipo], d.total, peso(d.archivo.peso), `subido ${fechaCorta(d.creado)}`].filter(Boolean).join(" · ");
      return `<li>
      <div class="doc-info"><strong>${html(d.nombre)}</strong><span>${html(detalle)}</span></div>
      <button class="btn btn-sm" data-ver="${d.id}">Ver</button>
      <button class="btn btn-ghost btn-sm" data-bajar="${d.id}">Descargar</button>
      <button class="btn btn-peligro btn-sm" data-borrar="${d.id}">Eliminar</button>
    </li>`;
    }
    // Documentos hechos antes con las plantillas de la web
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

// Subir documento: el archivo se elige o se arrastra, y el nombre se propone desde el archivo
const avisoDocs = (texto, tipo = "") => {
  $("msgDocs").className = "mensaje " + tipo;
  $("msgDocs").textContent = texto;
};

function elegir(archivo) {
  if (!archivo) return;
  $("zonaTexto").textContent = `${archivo.name} · ${peso(archivo.size)}`;
  $("zona").classList.add("lista");
  if (!$("nombreDoc").value) $("nombreDoc").value = archivo.name.replace(/\.[^.]+$/, "");
  if (/cotiz/i.test(archivo.name)) $("tipoDoc").value = "cotizacion";
  else if (/acuerdo|contrato/i.test(archivo.name)) $("tipoDoc").value = "acuerdo";
  else if (/acta/i.test(archivo.name)) $("tipoDoc").value = "acta";
  avisoDocs(archivo.size > MAXIMO ? "El archivo pasa de 15 MB. Comprímelo o súbelo en partes." : "", archivo.size > MAXIMO ? "error" : "");
}

$("archivo").addEventListener("change", () => elegir($("archivo").files[0]));
["dragenter", "dragover"].forEach((ev) => $("zona").addEventListener(ev, (e) => { e.preventDefault(); $("zona").classList.add("encima"); }));
["dragleave", "drop"].forEach((ev) => $("zona").addEventListener(ev, () => $("zona").classList.remove("encima")));
$("zona").addEventListener("drop", (e) => {
  e.preventDefault();
  if (!e.dataTransfer.files.length) return;
  $("archivo").files = e.dataTransfer.files;
  elegir(e.dataTransfer.files[0]);
});

$("formSubir").addEventListener("submit", async (e) => {
  e.preventDefault();
  const archivo = $("archivo").files[0];
  if (!archivo || archivo.size > MAXIMO) return elegir(archivo);
  const ref = doc(collection(db, "documentos"));
  $("subir").disabled = true;
  $("avance").hidden = false;
  $("avance").value = 0;
  avisoDocs("Subiendo…");
  try {
    const partes = await subirPartes(ref.id, archivo, (p) => ($("avance").value = p));
    // El documento principal se guarda al final, así no aparece en la lista uno a medio subir
    await setDoc(ref, {
      clienteId: id,
      tipo: $("tipoDoc").value,
      nombre: $("nombreDoc").value.trim(),
      total: $("totalDoc").value.trim(),
      archivo: { nombre: archivo.name, tipo: archivo.type, peso: archivo.size, partes },
      creado: serverTimestamp(), actualizado: serverTimestamp()
    });
    await updateDoc(doc(db, "clientes", id), { actualizado: serverTimestamp() });
    $("formSubir").reset();
    $("zonaTexto").textContent = "Elige un archivo o arrástralo aquí";
    $("zona").classList.remove("lista");
    avisoDocs("Subido ✓", "ok");
    await cargarDocumentos();
  } catch (err) {
    borrarPartes(ref.id).then((lote) => lote.commit()).catch(() => {});
    avisoDocs("No se pudo subir: " + err.message, "error");
  } finally {
    $("subir").disabled = false;
    $("avance").hidden = true;
  }
});

$("docs").addEventListener("click", async (e) => {
  const boton = e.target.closest("[data-ver], [data-bajar], [data-borrar]");
  if (!boton) return;
  const d = documentos.find((x) => x.id === (boton.dataset.ver || boton.dataset.bajar || boton.dataset.borrar));

  if (boton.dataset.borrar) {
    if (!confirm("¿Eliminar este documento? No se puede deshacer.")) return;
    const lote = await borrarPartes(d.id);
    lote.delete(doc(db, "documentos", d.id));
    await lote.commit();
    return cargarDocumentos();
  }

  // La ventana se abre antes de descargar, si no el navegador la bloquea como ventana emergente
  const ventana = boton.dataset.ver ? window.open("", "_blank") : null;
  const texto = boton.textContent;
  boton.disabled = true;
  boton.textContent = "Cargando…";
  try {
    const url = URL.createObjectURL(await bajarArchivo(d.id, d.archivo.tipo));
    if (ventana) {
      ventana.location.href = url;
    } else {
      const a = Object.assign(document.createElement("a"), { href: url, download: d.archivo.nombre });
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    ventana?.close();
    alert("No se pudo abrir el documento: " + err.message);
  } finally {
    boton.disabled = false;
    boton.textContent = texto;
  }
});

$("borrarCliente").addEventListener("click", async () => {
  const nombre = cliente.negocio || cliente.nombre;
  if (prompt(`Esto elimina a ${nombre} y sus ${documentos.length} documentos para siempre. Escribe ELIMINAR para confirmar.`) !== "ELIMINAR") return;
  // Un lote por documento: con sus partes, todos juntos podrían pasar el límite de 500 operaciones
  for (const d of documentos) {
    const lote = await borrarPartes(d.id);
    lote.delete(doc(db, "documentos", d.id));
    await lote.commit();
  }
  await writeBatch(db).delete(doc(db, "clientes", id)).commit();
  location.href = "./";
});
