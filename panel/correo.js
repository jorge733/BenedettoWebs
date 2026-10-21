// Ficha del cliente: enviar correos con plantilla (los arma y envía api/enviar-correo.js)
import {
  auth, db, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, query, where, serverTimestamp, ms, html, clp, numero
} from "./firebase.js";

const $ = (id) => document.getElementById(id);
const API = "/api/enviar-correo";
const fechaLarga = (d) => d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
const fechaHora = (iso) =>
  new Date(iso).toLocaleString("es-CL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
// Seguimientos de la última cotización que todavía no salen
const pendientes = (c) => (c.seguimientos || []).filter((s) => Date.parse(s.fecha) > Date.now());
let redibujarSeguimientos = () => {};

// Lo que avisa Resend de cada correo (api/resend-webhook.js). Los enviados antes de esto no tienen estado.
const ESTADOS_CORREO = {
  enviado: "Enviado", entregado: "Entregado", abierto: "Abierto", clic: "Hizo clic", rebotado: "No llegó", spam: "Lo marcó como spam"
};
export function etiquetaEstado(c) {
  if (!c.resendId || !ESTADOS_CORREO[c.estado]) return "";
  const veces = c.aperturas > 1 ? ` ${c.aperturas}×` : "";
  const cuando = c.ultimaApertura?.toDate
    ? ` title="Última vez: ${c.ultimaApertura.toDate().toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}"` : "";
  return `<span class="estado-correo" data-estado="${c.estado}"${cuando}>${ESTADOS_CORREO[c.estado]}${c.estado === "abierto" ? veces : ""}</span>`;
}

async function api(metodo, cuerpo) {
  const r = await fetch(API, {
    method: metodo,
    headers: { Authorization: "Bearer " + (await auth.currentUser.getIdToken()), "Content-Type": "application/json" },
    body: cuerpo && JSON.stringify(cuerpo)
  });
  const datos = await r.json().catch(() => ({ ok: false, error: `Error ${r.status}` }));
  if (!datos.ok) throw new Error(datos.error || `Error ${r.status}`);
  return datos;
}

// Cancela en Resend los seguimientos que no han salido (al cambiar de estado, al cancelarlos a mano o al reenviar la cotización).
// Devuelve cuántos había pendientes.
export async function cancelarSeguimientos(clienteId, cliente) {
  const lista = pendientes(cliente);
  if (lista.length) await api("POST", { cancelar: lista.map((s) => s.id) });
  if (!cliente.seguimientos?.length) return 0;
  await updateDoc(doc(db, "clientes", clienteId), { seguimientos: [] });
  cliente.seguimientos = [];
  redibujarSeguimientos();
  return lista.length;
}

// clienteId y funciones que devuelven el cliente y sus documentos actuales (cambian mientras se edita la ficha)
export async function iniciarCorreo(clienteId, verCliente, verDocumentos) {
  const seccion = $("seccionCorreo");
  seccion.hidden = false;
  const aviso = (texto, tipo = "") => {
    $("msgCorreo").className = "mensaje " + tipo;
    $("msgCorreo").textContent = texto;
  };

  let plantillas;
  try {
    plantillas = (await api("GET")).plantillas;
  } catch (err) {
    return aviso("No se pudieron cargar las plantillas: " + err.message, "error");
  }
  const ajustesRef = doc(db, "ajustes", "correos");
  const ajustes = (await getDoc(ajustesRef)).data() || {};
  const valores = {}; // lo escrito en cada plantilla, para no perderlo al cambiar de una a otra

  $("plantilla").innerHTML = plantillas.map((p) => `<option value="${p.id}">${html(p.nombre)}</option>`).join("");
  $("para").value = verCliente().email || "";

  // Datos del cliente con los que se rellenan los campos ("prefill" en api/_plantillas.js)
  function rellenos() {
    const c = verCliente();
    const cot = verDocumentos().find((d) => d.tipo === "cotizacion");
    const total = numero(cot?.total || c.monto);
    return {
      nombre: (c.nombre || "").split(" ")[0],
      negocio: c.negocio || "",
      total: clp(total),
      mitad: clp(total / 2),
      fechaCotizacion: cot?.creado?.toDate ? fechaLarga(cot.creado.toDate()) : "",
      sitio: c.sitio || "",
      vence: c.vence ? fechaLarga(new Date(c.vence + "T12:00")) : "",
      transferencia: ajustes.transferencia || "",
      resena: ajustes.resena || ""
    };
  }

  const actual = () => plantillas.find((p) => p.id === $("plantilla").value);

  function dibujarCampos() {
    const p = actual();
    const r = rellenos();
    valores[p.id] ||= Object.fromEntries(p.campos.map((c) => [c.id, r[c.prefill] ?? c.valor ?? ""]));
    const v = valores[p.id];
    $("filaSeguimiento").hidden = p.id !== "cotizacion";
    for (const c of p.campos) if (c.tipo === "opciones" && !v[c.id]) v[c.id] = c.opciones[0];
    $("camposCorreo").innerHTML = p.campos.map((c) => {
      const nombre = `${html(c.label)}${c.obligatorio ? " *" : ""}`;
      const ancho = c.tipo === "area" ? " ancho" : "";
      let control;
      if (c.tipo === "area") control = `<textarea name="${c.id}">${html(v[c.id])}</textarea>`;
      else if (c.tipo === "opciones") control = `<select name="${c.id}">${c.opciones.map((o) => `<option${o === v[c.id] ? " selected" : ""}>${html(o)}</option>`).join("")}</select>`;
      else control = `<input name="${c.id}" value="${html(v[c.id])}"${c.tipo === "link" ? ' type="url" placeholder="https://…"' : ""}${c.tipo === "monto" ? ' inputmode="numeric" placeholder="$150.000"' : ""}>`;
      return `<label class="campo${ancho}">${nombre} ${control}</label>`;
    }).join("");
    previsualizar();
  }

  let espera, turno = 0;
  async function previsualizar() {
    clearTimeout(espera);
    espera = setTimeout(async () => {
      const mio = ++turno;
      try {
        const r = await api("POST", { plantilla: actual().id, datos: valores[actual().id], enviar: false });
        if (mio !== turno) return;
        $("vistaCorreo").srcdoc = r.html;
        $("asuntoCorreo").textContent = r.asunto;
        aviso(r.faltan.length ? "Falta completar: " + r.faltan.join(", ") : "");
      } catch (err) {
        if (mio === turno) aviso("No se pudo armar la vista previa: " + err.message, "error");
      }
    }, 350);
  }

  $("plantilla").addEventListener("change", dibujarCampos);
  $("camposCorreo").addEventListener("input", (e) => {
    if (!e.target.name) return;
    valores[actual().id][e.target.name] = e.target.value;
    previsualizar();
  });

  $("enviarCorreo").addEventListener("click", async () => {
    const p = actual();
    const para = $("para").value.trim();
    if (!para) return aviso("Escribe el correo del cliente.", "error");
    if (!confirm(`¿Enviar "${$("asuntoCorreo").textContent}" a ${para}?`)) return;
    $("enviarCorreo").disabled = true;
    aviso("Enviando…");
    try {
      const seguimiento = p.id === "cotizacion" && $("seguimiento").checked;
      const r = await api("POST", { plantilla: p.id, para, datos: valores[p.id], enviar: true, seguimiento });
      await addDoc(collection(db, "correos"), {
        clienteId, plantilla: p.id, nombre: p.nombre, asunto: r.asunto, para, resendId: r.id, estado: "enviado", enviado: serverTimestamp()
      });
      // Los datos de transferencia y el link de reseñas se recuerdan para la próxima vez
      const guardar = Object.fromEntries(["transferencia", "resena"].filter((k) => valores[p.id][k]).map((k) => [k, valores[p.id][k]]));
      if (Object.keys(guardar).length) {
        Object.assign(ajustes, guardar);
        await setDoc(ajustesRef, guardar, { merge: true });
      }
      let extra = "";
      if (seguimiento) {
        // Una cotización nueva reemplaza el seguimiento de la anterior
        await cancelarSeguimientos(clienteId, verCliente()).catch(() => {});
        if (r.seguimientos.length) {
          await updateDoc(doc(db, "clientes", clienteId), { seguimientos: r.seguimientos });
          verCliente().seguimientos = r.seguimientos;
          dibujarSeguimientos();
          extra = " · seguimiento programado";
        } else {
          extra = " · ojo: no se pudo programar el seguimiento";
        }
      }
      aviso(`Enviado a ${para} ✓${extra}`, extra.includes("ojo") ? "error" : "ok");
      cargarEnviados();
    } catch (err) {
      aviso("No se pudo enviar: " + err.message, "error");
    } finally {
      $("enviarCorreo").disabled = false;
    }
  });

  function dibujarSeguimientos() {
    const lista = pendientes(verCliente());
    $("cajaSeguimientos").hidden = !lista.length;
    $("seguimientos").innerHTML = lista.map((s) => `<li>
      <div class="doc-info"><strong>${html(s.asunto)}</strong><span>Sale solo el ${html(fechaHora(s.fecha))}</span></div>
    </li>`).join("") + `<li><button class="btn btn-peligro btn-sm" type="button" data-cancelar>Cancelar seguimiento</button></li>`;
  }
  redibujarSeguimientos = dibujarSeguimientos;

  $("seguimientos").addEventListener("click", async (e) => {
    const boton = e.target.closest("[data-cancelar]");
    if (!boton || !confirm("¿Cancelar los correos de seguimiento programados?")) return;
    boton.disabled = true;
    try {
      await cancelarSeguimientos(clienteId, verCliente());
      aviso("Seguimiento cancelado ✓", "ok");
    } catch (err) {
      boton.disabled = false;
      aviso("No se pudo cancelar: " + err.message, "error");
    }
  });

  async function cargarEnviados() {
    const snap = await getDocs(query(collection(db, "correos"), where("clienteId", "==", clienteId)));
    const lista = snap.docs.map((d) => d.data()).sort((a, b) => ms(b.enviado) - ms(a.enviado));
    $("sinEnviados").hidden = lista.length > 0;
    $("enviados").innerHTML = lista.map((c) => `<li>
      <div class="doc-info"><strong>${html(c.asunto)}</strong>
        <span>${html(c.nombre)} · a ${html(c.para)} · ${c.enviado?.toDate ? c.enviado.toDate().toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" }) : "recién"}</span></div>
      ${etiquetaEstado(c)}
    </li>`).join("");
  }

  dibujarCampos();
  dibujarSeguimientos();
  cargarEnviados();
}
