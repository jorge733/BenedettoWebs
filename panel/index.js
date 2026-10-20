// Panel: inicio de sesión y lista de clientes
import {
  configurado, auth, db, ESTADOS, CORREOS, onAuthStateChanged, entrarConGoogle, signOut,
  collection, getDocs, ms, fechaCorta, html
} from "./firebase.js";

const $ = (id) => document.getElementById(id);
let clientes = [];
let filtro = "Todos";

const avisoLogin = (texto, error) => {
  $("msgLogin").className = "mensaje" + (error ? " error" : "");
  $("msgLogin").textContent = texto;
};

if (!configurado) {
  $("sinConfig").hidden = false;
} else {
  onAuthStateChanged(auth, (usuario) => {
    // Otra cuenta de Google: se cierra la sesión (las reglas de Firestore tampoco la dejarían leer nada)
    if (usuario && !CORREOS.includes(usuario.email)) {
      signOut(auth);
      return avisoLogin(`La cuenta ${usuario.email} no tiene acceso a este panel.`, true);
    }
    $("login").hidden = !!usuario;
    $("app").hidden = !usuario;
    if (!usuario) return;
    const volver = new URLSearchParams(location.search).get("volver");
    if (volver?.startsWith("/")) return location.replace(volver);
    cargar();
  });
}

$("entrar").addEventListener("click", async () => {
  avisoLogin("Abriendo Google…");
  try {
    await entrarConGoogle();
  } catch (err) {
    avisoLogin(err.code === "auth/popup-closed-by-user" ? "" : "No se pudo entrar: " + err.message, true);
  }
});

$("salir").addEventListener("click", () => signOut(auth));

async function cargar() {
  $("lista").innerHTML = '<div class="cliente-card esqueleto"></div>'.repeat(3);
  try {
    const snap = await getDocs(collection(db, "clientes"));
    clientes = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => ms(b.actualizado) - ms(a.actualizado));
    pintar();
  } catch (err) {
    $("lista").innerHTML = "";
    $("vacio").hidden = false;
    $("vacio").textContent = "No se pudieron cargar los clientes: " + err.message;
  }
}

function pintar() {
  const cuenta = (estado) => clientes.filter((c) => c.estado === estado).length;
  $("chips").innerHTML = ["Todos", ...ESTADOS]
    .map((e) => `<button class="chip" data-filtro="${e}" aria-pressed="${e === filtro}">${e}<b>${e === "Todos" ? clientes.length : cuenta(e)}</b></button>`)
    .join("");

  const texto = $("buscar").value.trim().toLowerCase();
  const visibles = clientes.filter((c) =>
    (filtro === "Todos" || c.estado === filtro) &&
    [c.nombre, c.negocio, c.email, c.rut].join(" ").toLowerCase().includes(texto));

  $("lista").innerHTML = visibles.map((c) => `
    <a class="cliente-card" href="cliente.html?id=${c.id}">
      <h3>${html(c.negocio || c.nombre || "Sin nombre")}</h3>
      <p>${html(c.negocio ? c.nombre : c.email)}</p>
      <div class="pie"><span class="estado" data-estado="${html(c.estado)}">${html(c.estado)}</span><span>${fechaCorta(c.actualizado)}</span></div>
    </a>`).join("");

  $("vacio").hidden = visibles.length > 0;
  $("vacio").textContent = clientes.length ? "Ningún cliente coincide con la búsqueda." : "Aún no tienes clientes. Crea el primero con “+ Nuevo cliente”.";
}

// Al escribir no se repite la cascada de tarjetas en cada tecla; al cambiar de filtro, sí
$("buscar").addEventListener("input", () => {
  $("lista").classList.add("quieta");
  pintar();
});
$("chips").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-filtro]");
  if (!chip) return;
  filtro = chip.dataset.filtro;
  $("lista").classList.remove("quieta");
  pintar();
});
