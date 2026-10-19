// ===== Configuración de contacto =====
// Completa estos datos para activar los botones de WhatsApp, correo e Instagram.
// whatsapp: número con código de país, sin "+" ni espacios (ej: "56912345678").
const CONTACTO = {
  whatsapp: "+56932698141",
  email: "sabenedettoa@benedettowebs.cl",
  instagram: "benedettowebs" // usuario sin "@"
};

const MENSAJE_BASE = "Hola Santiago, vi BenedettoWebs y quiero cotizar una página web.";

// ===== Enlaces de contacto =====
const waLink = (texto) =>
  `https://wa.me/${CONTACTO.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
const mailLink = (texto) =>
  `mailto:${CONTACTO.email}?subject=${encodeURIComponent("Cotización página web - BenedettoWebs")}&body=${encodeURIComponent(texto)}`;

const contactLinks = document.getElementById("contactLinks");
const items = [];
if (CONTACTO.whatsapp) {
  items.push({ icon: "💬", title: "WhatsApp", sub: "Respuesta rápida", href: waLink(MENSAJE_BASE) });
}
if (CONTACTO.email) {
  items.push({ icon: "✉️", title: "Correo", sub: CONTACTO.email, href: mailLink(MENSAJE_BASE) });
}
if (CONTACTO.instagram) {
  items.push({ icon: "📸", title: "Instagram", sub: "@" + CONTACTO.instagram, href: `https://instagram.com/${CONTACTO.instagram}` });
}
contactLinks.hidden = items.length === 0;
contactLinks.innerHTML = items
  .map(
    (i) => `<a href="${i.href}" target="_blank" rel="noopener"><span class="ci">${i.icon}</span><span>${i.title}<small>${i.sub}</small></span></a>`
  )
  .join("");

const waFloat = document.getElementById("waFloat");
if (CONTACTO.whatsapp) {
  waFloat.href = waLink(MENSAJE_BASE);
  waFloat.target = "_blank";
  waFloat.rel = "noopener";
}

// ===== Formulario: envía la cotización al correo (api/cotizar.js con Resend) =====
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const formSubmit = document.getElementById("formSubmit");
const formWa = document.getElementById("formWa");

const CAMPOS = [
  ["nombre", "Nombre"], ["negocio", "Negocio"], ["email", "Correo"], ["telefono", "WhatsApp"],
  ["tipo", "Tipo de página"], ["incluir", "Quiere incluir"], ["plazo", "Plazo"],
  ["contenido", "Contenido listo"], ["mensaje", "Proyecto"]
];
const leerFormulario = () => {
  const data = new FormData(contactForm);
  return CAMPOS.map(([k, label]) => [label, data.getAll(k).join(", ").trim()]).filter(([, v]) => v);
};
const textoFormulario = () =>
  `${MENSAJE_BASE}\n\n` + leerFormulario().map(([l, v]) => `${l}: ${v}`).join("\n");

if (CONTACTO.whatsapp) {
  formWa.target = "_blank";
  formWa.rel = "noopener";
  formWa.addEventListener("click", () => (formWa.href = waLink(textoFormulario())));
} else {
  formWa.parentElement.hidden = true;
}

const setStatus = (msg, tipo = "") => {
  formStatus.textContent = msg;
  formStatus.className = "form-status " + tipo;
};

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const requeridos = [...contactForm.querySelectorAll("[required]")];
  requeridos.forEach((el) => el.classList.toggle("invalid", !el.checkValidity()));
  const primero = requeridos.find((el) => !el.checkValidity());
  if (primero) {
    setStatus(primero.type === "email" && primero.value ? "Revisa que el correo esté bien escrito." : "Completa los campos marcados con *.", "error");
    primero.focus();
    return;
  }
  if (contactForm._honey.value) return;

  const data = new FormData(contactForm);
  const cuerpo = Object.fromEntries(CAMPOS.map(([k]) => [k, data.getAll(k).join(", ").trim()]));

  formSubmit.disabled = true;
  formSubmit.textContent = "Enviando…";
  setStatus("");
  try {
    const res = await fetch("/api/cotizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(json.error);
    contactForm.reset();
    setStatus("¡Listo! Recibí tu solicitud. Te llegó un correo de confirmación y te respondo a la brevedad.", "ok");
  } catch {
    setStatus("No se pudo enviar. Inténtalo de nuevo o escríbeme por WhatsApp.", "error");
  } finally {
    formSubmit.disabled = false;
    formSubmit.textContent = "Enviar solicitud";
  }
});
contactForm.addEventListener("input", (e) => {
  if (e.target.classList.contains("invalid") && e.target.checkValidity()) e.target.classList.remove("invalid");
});

// ===== Navegación =====
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

// ===== Animaciones al hacer scroll =====
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();
