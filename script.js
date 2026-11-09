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

// ===== Intro de la portada: sitios de ejemplo que se construyen solos =====
// Los rubros, marcas y mensajes son ficticios: solo ilustran lo que puede tener cada negocio.
const RUBROS = [
  { palabra: "negocio", url: "tunegocio.cl", marca: "Tu Negocio", titulo: "Tus clientes te buscan", bajada: "Todo lo que ofreces, en un solo lugar.", cta: "Cotizar", c1: "Servicios", c2: "Galería", c3: "Contacto", icono: "✨", mensaje: "Hola, ¿me puedes cotizar?", color1: "#6c63ff", color2: "#00d4ff" },
  { palabra: "pastelería", url: "tupasteleria.cl", marca: "Dulce Antojo", titulo: "Tortas para celebrar", bajada: "Hechas a mano y a tu pedido.", cta: "Encargar torta", c1: "Tortas", c2: "Cupcakes", c3: "Eventos", icono: "🎂", mensaje: "¿Hacen tortas para 20 personas?", color1: "#ff5c93", color2: "#ffb36b" },
  { palabra: "taller", url: "tutaller.cl", marca: "Taller Ruta Sur", titulo: "Tu auto en buenas manos", bajada: "Mantención y diagnóstico sin vueltas.", cta: "Agendar revisión", c1: "Mantención", c2: "Frenos", c3: "Diagnóstico", icono: "🔧", mensaje: "¿Tienen hora para el viernes?", color1: "#f2600c", color2: "#f9b233" },
  { palabra: "consulta", url: "tuconsulta.cl", marca: "Centro Aire", titulo: "Un espacio para ti", bajada: "Atención presencial y online.", cta: "Reservar hora", c1: "Terapia", c2: "Talleres", c3: "Online", icono: "🌿", mensaje: "Quisiera reservar una hora", color1: "#0f9d8a", color2: "#6ee7a8" },
  { palabra: "restaurante", url: "turestaurante.cl", marca: "La Mesa Larga", titulo: "Cocina casera de verdad", bajada: "Almuerzos todos los días.", cta: "Ver la carta", c1: "Almuerzos", c2: "Carta", c3: "Delivery", icono: "🍲", mensaje: "¿Tienen mesa para 6 hoy?", color1: "#dc3545", color2: "#f59e0b" },
  { palabra: "tienda", url: "tutienda.cl", marca: "Tienda Norte", titulo: "Lo que buscas, a un clic", bajada: "Envíos a todo Chile.", cta: "Comprar ahora", c1: "Novedades", c2: "Ofertas", c3: "Envíos", icono: "🛍️", mensaje: "¿Hacen envíos a Temuco?", color1: "#7c4dff", color2: "#ec4899" }
];

(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const hero = document.getElementById("inicio");
  const palabra = document.getElementById("heroWord");
  const url = document.getElementById("mockUrl");
  const toast = document.getElementById("mockToast");
  const maquetas = hero.querySelectorAll(".mock");

  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
  const borrar = async (el, ms) => {
    while (el.textContent) {
      el.textContent = el.textContent.slice(0, -1);
      await pausa(ms);
    }
  };
  const escribir = async (el, texto, ms) => {
    for (let i = 1; i <= texto.length; i++) {
      el.textContent = texto.slice(0, i);
      await pausa(ms);
    }
  };
  const cambiarPalabra = async (texto) => {
    if (palabra.textContent === texto) return;
    await borrar(palabra, 40);
    await pausa(120);
    await escribir(palabra, texto, 75);
  };
  const pintar = (r) => {
    hero.querySelectorAll("[data-m]").forEach((el) => (el.textContent = r[el.dataset.m]));
    maquetas.forEach((m) => {
      m.style.setProperty("--c1", r.color1);
      m.style.setProperty("--c2", r.color2);
    });
  };

  // No gastar batería si la portada no está a la vista
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);

  const ciclo = async () => {
    for (let i = 0; ; i = (i + 1) % RUBROS.length) {
      while (!visible || document.hidden) await pausa(400);
      const rubro = RUBROS[i];

      toast.classList.remove("show");
      maquetas.forEach((m) => m.classList.add("skeleton"));
      await borrar(url, 18);
      pintar(rubro);
      await Promise.all([cambiarPalabra(rubro.palabra), escribir(url, rubro.url, 55)]);
      await pausa(250);

      maquetas.forEach((m) => m.classList.remove("skeleton"));
      await pausa(2300);
      toast.classList.add("show");
      await pausa(2900);
    }
  };
  ciclo();
})();

document.getElementById("year").textContent = new Date().getFullYear();
