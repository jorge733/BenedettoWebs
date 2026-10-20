// Ficha del cliente: enviar correos con plantilla (los arma y envía api/enviar-correo.js)
import {
  auth, db, collection, doc, getDoc, getDocs, addDoc, setDoc, query, where, serverTimestamp, ms, html
} from "./firebase.js";

const $ = (id) => document.getElementById(id);
const API = "/api/enviar-correo";
const clp = (n) => (n ? "$" + Math.round(n).toLocaleString("es-CL") : "");
const numero = (v) => Number(String(v ?? "").replace(/\D/g, ""));
const fechaLarga = (d) => d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

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
    const total = numero(cot?.total);
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
      const r = await api("POST", { plantilla: p.id, para, datos: valores[p.id], enviar: true });
      await addDoc(collection(db, "correos"), {
        clienteId, plantilla: p.id, nombre: p.nombre, asunto: r.asunto, para, enviado: serverTimestamp()
      });
      // Los datos de transferencia y el link de reseñas se recuerdan para la próxima vez
      const guardar = Object.fromEntries(["transferencia", "resena"].filter((k) => valores[p.id][k]).map((k) => [k, valores[p.id][k]]));
      if (Object.keys(guardar).length) {
        Object.assign(ajustes, guardar);
        await setDoc(ajustesRef, guardar, { merge: true });
      }
      aviso(`Enviado a ${para} ✓`, "ok");
      cargarEnviados();
    } catch (err) {
      aviso("No se pudo enviar: " + err.message, "error");
    } finally {
      $("enviarCorreo").disabled = false;
    }
  });

  async function cargarEnviados() {
    const snap = await getDocs(query(collection(db, "correos"), where("clienteId", "==", clienteId)));
    const lista = snap.docs.map((d) => d.data()).sort((a, b) => ms(b.enviado) - ms(a.enviado));
    $("sinEnviados").hidden = lista.length > 0;
    $("enviados").innerHTML = lista.map((c) => `<li>
      <div class="doc-info"><strong>${html(c.asunto)}</strong>
        <span>${html(c.nombre)} · a ${html(c.para)} · ${c.enviado?.toDate ? c.enviado.toDate().toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" }) : "recién"}</span></div>
    </li>`).join("");
  }

  dibujarCampos();
  cargarEnviados();
}
