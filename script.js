// ===== Configuración de contacto =====
// Completa estos datos para activar los botones de WhatsApp, correo e Instagram.
// whatsapp: número con código de país, sin "+" ni espacios (ej: "56912345678").
const CONTACTO = {
  whatsapp: "",
  email: "",
  instagram: "" // usuario sin "@"
};

const MENSAJE_BASE = "Hola Santiago, vi BenedettoWebs y quiero cotizar una página web.";

// ===== Enlaces de contacto =====
const waLink = (texto) =>
  `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(texto)}`;
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

// ===== Formulario: arma el mensaje y abre WhatsApp o correo =====
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const texto =
    `${MENSAJE_BASE}\n\n` +
    `Nombre: ${data.get("nombre")}\n` +
    (data.get("negocio") ? `Negocio: ${data.get("negocio")}\n` : "") +
    `Lo que necesito: ${data.get("mensaje")}`;

  if (CONTACTO.whatsapp) {
    window.open(waLink(texto), "_blank", "noopener");
  } else if (CONTACTO.email) {
    window.location.href = mailLink(texto);
  } else {
    alert("Pronto habilitaremos el contacto. ¡Gracias por tu interés!");
  }
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
