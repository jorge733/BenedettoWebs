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

// ===== Vista previa: maqueta según tipo de negocio =====
const escapar = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const iniciales = (nombre) =>
  nombre.split(/\s+/).filter((p) => /^[\p{L}\p{N}]/u.test(p)).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "★";

// Texto blanco u oscuro sobre el color elegido, para que siempre se lea
const textoSobre = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#111827" : "#ffffff";
};

const COLORES = [
  { nombre: "Terracota", hex: "#c2410c" },
  { nombre: "Verde azulado", hex: "#0f766e" },
  { nombre: "Rosado", hex: "#db2777" },
  { nombre: "Azul", hex: "#2563eb" },
  { nombre: "Morado", hex: "#7c3aed" },
  { nombre: "Verde", hex: "#15803d" },
  { nombre: "Negro", hex: "#111827" }
];

const nav3 = (n, items, cta) => `
  <div class="mk-nav">
    <span class="mk-logo"><i>${iniciales(n)}</i><b>${n}</b></span>
    <span class="mk-menu">${items.map((i) => `<span>${i}</span>`).join("")}</span>
    <span class="mk-btn">${cta}</span>
  </div>`;
const pie = (n, extra) => `<div class="mk-foot"><span>© ${new Date().getFullYear()} ${n}</span><span>${extra}</span></div><div class="mk-wa">💬</div>`;

const RUBROS = [
  {
    id: "restaurante", icono: "☕", nombre: "Restaurante / Café", ejemplo: "Café Luna", color: "#c2410c", clase: "mk-food",
    render: (n) => `
      ${nav3(n, ["Carta", "Nosotros", "Ubicación"], "Reservar")}
      <div class="mk-hero">
        <div class="mk-emojis">☕ 🥐 🍰</div>
        <h3 class="mk-hero-t">${n}</h3>
        <p>Café de especialidad, pastelería casera y desayunos todo el día en el corazón de Providencia.</p>
        <div class="mk-actions"><span class="mk-btn">Ver la carta</span><span class="mk-btn mk-btn-line">Reservar mesa</span></div>
      </div>
      <div class="mk-sec">
        <span class="mk-eyebrow">Nuestra carta</span>
        <h4>Lo más pedido</h4>
        <div class="mk-menu-list">
          ${[["Café latte", "$2.800"], ["Cappuccino", "$3.000"], ["Croissant de mantequilla", "$2.200"], ["Torta de zanahoria", "$3.500"], ["Sándwich ave palta", "$5.900"], ["Jugo natural", "$2.900"]]
            .map(([p, v]) => `<div class="mk-item"><span>${p}</span><i></i><b>${v}</b></div>`).join("")}
        </div>
      </div>
      <div class="mk-sec mk-info">
        <div class="mk-card"><span class="mk-ico">🕗</span><strong>Horario</strong><p>Lun a sáb · 8:00 a 20:00</p></div>
        <div class="mk-card"><span class="mk-ico">📍</span><strong>Dirección</strong><p>Av. Providencia 1234, Santiago</p></div>
        <div class="mk-card"><span class="mk-ico">🛵</span><strong>Delivery</strong><p>Pedidos por WhatsApp</p></div>
      </div>
      ${pie(n, "Instagram · WhatsApp")}`
  },
  {
    id: "profesional", icono: "🩺", nombre: "Profesional independiente", ejemplo: "Camila Rojas Psicóloga", color: "#0f766e", clase: "mk-pro",
    render: (n) => `
      ${nav3(n, ["Servicios", "Sobre mí", "Opiniones"], "Agendar hora")}
      <div class="mk-hero">
        <div>
          <span class="mk-eyebrow">Atención presencial y online</span>
          <h3 class="mk-hero-t">Te acompaño a sentirte mejor, a tu ritmo.</h3>
          <p>Terapia para adultos y parejas, con un enfoque cercano y basado en evidencia. Atiendo en Ñuñoa y por videollamada a todo Chile.</p>
          <div class="mk-actions"><span class="mk-btn">Agendar primera sesión</span><span class="mk-btn mk-btn-line">Conocer más</span></div>
        </div>
        <div class="mk-avatar">${iniciales(n)}</div>
      </div>
      <div class="mk-sec mk-band">
        <span class="mk-eyebrow">Servicios</span>
        <h4>¿En qué te puedo ayudar?</h4>
        <div class="mk-grid">
          <div class="mk-card"><span class="mk-ico">🧠</span><h4>Terapia individual</h4><p>Ansiedad, estrés y autoestima. Sesiones de 50 minutos.</p><span class="mk-price">$35.000</span></div>
          <div class="mk-card"><span class="mk-ico">💞</span><h4>Terapia de pareja</h4><p>Mejoren su comunicación y resuelvan conflictos juntos.</p><span class="mk-price">$45.000</span></div>
          <div class="mk-card"><span class="mk-ico">💻</span><h4>Sesión online</h4><p>Desde donde estés, con la misma calidad de atención.</p><span class="mk-price">$32.000</span></div>
        </div>
      </div>
      <div class="mk-sec">
        <span class="mk-eyebrow">Opiniones</span>
        <h4>Lo que dicen mis pacientes</h4>
        <div class="mk-grid">
          <div class="mk-card"><span class="mk-stars">★★★★★</span><p class="mk-quote">"Me sentí escuchada desde la primera sesión."</p></div>
          <div class="mk-card"><span class="mk-stars">★★★★★</span><p class="mk-quote">"Muy profesional y cercana. La recomiendo."</p></div>
          <div class="mk-card"><span class="mk-stars">★★★★★</span><p class="mk-quote">"Agendar fue facilísimo por WhatsApp."</p></div>
        </div>
      </div>
      ${pie(n, "Reembolso con Isapre y Fonasa")}`
  },
  {
    id: "tienda", icono: "🛍️", nombre: "Tienda / Emprendimiento", ejemplo: "Tienda Lila", color: "#db2777", clase: "mk-shop",
    render: (n) => `
      <div class="mk-strip">🚚 Despachos a todo Chile · Envío gratis sobre $30.000</div>
      ${nav3(n, ["Productos", "Nosotros", "Contacto"], "🛒 Carrito (0)")}
      <div class="mk-hero">
        <div>
          <span class="mk-eyebrow">Nueva colección</span>
          <h3 class="mk-hero-t">Hecho a mano, pensado para tu casa.</h3>
          <p>Velas, jabones y decoración artesanal de productores chilenos.</p>
          <div class="mk-actions"><span class="mk-btn">Ver productos</span></div>
        </div>
        <span class="mk-big">🕯️</span>
      </div>
      <div class="mk-sec">
        <span class="mk-eyebrow">Destacados</span>
        <h4>Lo más vendido</h4>
        <div class="mk-grid mk-grid-4">
          ${[["🕯️", "Vela de soya", "$8.990"], ["🧼", "Jabón artesanal", "$4.500"], ["🧺", "Canasto de mimbre", "$15.990"], ["🌵", "Set de suculentas", "$12.000"]]
            .map(([e, p, v]) => `<div class="mk-card mk-prod"><div class="mk-pic">${e}</div><div><h4>${p}</h4><span class="mk-price">${v}</span><span class="mk-add">Agregar</span></div></div>`).join("")}
        </div>
      </div>
      ${pie(n, "Pagos con débito, crédito y transferencia")}`
  },
  {
    id: "tecnico", icono: "🔧", nombre: "Servicios técnicos", ejemplo: "Gasfitería Pérez", color: "#2563eb", clase: "mk-tech",
    render: (n) => `
      ${nav3(n, ["Servicios", "Comunas", "Contacto"], "📞 Llamar")}
      <div class="mk-hero">
        <span class="mk-badge">Atención 24/7</span>
        <h3 class="mk-hero-t">Gasfitería y reparaciones a domicilio</h3>
        <p>Llegamos rápido a tu casa o negocio. Presupuesto sin costo y trabajos con garantía.</p>
        <div class="mk-actions"><span class="mk-btn">📞 Llamar ahora</span><span class="mk-btn mk-btn-line">Cotizar por WhatsApp</span></div>
      </div>
      <div class="mk-trust"><span>✓ +10 años de experiencia</span><span>✓ Presupuesto gratis</span><span>✓ Garantía escrita</span></div>
      <div class="mk-sec">
        <span class="mk-eyebrow">Servicios</span>
        <h4>¿Qué necesitas reparar?</h4>
        <div class="mk-grid">
          <div class="mk-card"><span class="mk-ico">🚿</span><h4>Destapes</h4><p>Lavaplatos, baños y desagües.</p></div>
          <div class="mk-card"><span class="mk-ico">🔥</span><h4>Calefont</h4><p>Mantención, reparación e instalación.</p></div>
          <div class="mk-card"><span class="mk-ico">💧</span><h4>Filtraciones</h4><p>Detección y reparación de fugas.</p></div>
        </div>
      </div>
      <div class="mk-sec">
        <h4>Comunas donde atendemos</h4>
        <div class="mk-tags">${["Santiago", "Ñuñoa", "Providencia", "Maipú", "La Florida", "Puente Alto", "Las Condes"].map((c) => `<span>${c}</span>`).join("")}</div>
      </div>
      ${pie(n, "Lunes a domingo · Región Metropolitana")}`
  }
];

const pv = {
  types: document.getElementById("pvTypes"),
  colors: document.getElementById("pvColors"),
  name: document.getElementById("pvName"),
  frame: document.getElementById("pvFrame"),
  screen: document.getElementById("pvScreen"),
  url: document.getElementById("pvUrl"),
  cta: document.getElementById("pvCta")
};
const estado = { rubro: RUBROS[0], color: RUBROS[0].color };

pv.types.innerHTML = RUBROS.map(
  (r) => `<button type="button" class="pv-type" data-rubro="${r.id}" aria-pressed="false"><span>${r.icono}</span>${r.nombre}</button>`
).join("");
pv.colors.innerHTML = COLORES.map(
  (c) => `<button type="button" class="pv-color" data-color="${c.hex}" style="background:${c.hex}" aria-label="${c.nombre}" title="${c.nombre}" aria-pressed="false"></button>`
).join("");

const marcar = (grupo, attr, valor) =>
  grupo.querySelectorAll(`[${attr}]`).forEach((b) => {
    const activo = b.getAttribute(attr) === valor;
    b.classList.toggle("is-active", activo);
    b.setAttribute("aria-pressed", activo);
  });

const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "tunegocio";

const pintar = (reiniciar) => {
  const { rubro, color } = estado;
  const nombreReal = pv.name.value.trim();
  const nombre = escapar(nombreReal || rubro.ejemplo);
  if (reiniciar) {
    pv.screen.innerHTML = `<div class="mk ${rubro.clase}">${rubro.render(nombre)}</div>`;
    pv.screen.scrollTop = 0;
  } else {
    // Solo cambia nombre o color: actualiza sin reiniciar la animación ni el scroll
    const tmp = document.createElement("div");
    tmp.innerHTML = rubro.render(nombre);
    pv.screen.firstElementChild.replaceChildren(...tmp.childNodes);
  }
  const mk = pv.screen.firstElementChild;
  mk.style.setProperty("--a", color);
  mk.style.setProperty("--on-a", textoSobre(color));
  pv.screen.setAttribute("aria-label", `Ejemplo de página web de ${rubro.nombre.toLowerCase()} para ${nombreReal || rubro.ejemplo}`);
  pv.url.textContent = `${slug(nombreReal || rubro.ejemplo)}.cl`;
  pv.name.placeholder = `Ej: ${rubro.ejemplo}`;

  const colorNombre = (COLORES.find((c) => c.hex === color) || {}).nombre;
  const texto =
    `Hola Santiago, vi la vista previa de BenedettoWebs y quiero una página así.\n\n` +
    `Tipo de negocio: ${rubro.nombre}\n` +
    (nombreReal ? `Nombre: ${nombreReal}\n` : "") +
    (colorNombre ? `Color: ${colorNombre}` : "");
  if (CONTACTO.whatsapp) {
    pv.cta.href = waLink(texto);
    pv.cta.target = "_blank";
    pv.cta.rel = "noopener";
  }
};

pv.types.addEventListener("click", (e) => {
  const b = e.target.closest("[data-rubro]");
  if (!b) return;
  estado.rubro = RUBROS.find((r) => r.id === b.dataset.rubro);
  estado.color = estado.rubro.color;
  marcar(pv.types, "data-rubro", estado.rubro.id);
  marcar(pv.colors, "data-color", estado.color);
  pintar(true);
});
pv.colors.addEventListener("click", (e) => {
  const b = e.target.closest("[data-color]");
  if (!b) return;
  estado.color = b.dataset.color;
  marcar(pv.colors, "data-color", estado.color);
  pintar(false);
});
pv.name.addEventListener("input", () => pintar(false));
document.querySelectorAll("[data-device]").forEach((b) =>
  b.addEventListener("click", () => {
    marcar(b.parentElement, "data-device", b.dataset.device);
    pv.frame.classList.toggle("is-phone", b.dataset.device === "phone");
  })
);

marcar(pv.types, "data-rubro", estado.rubro.id);
marcar(pv.colors, "data-color", estado.color);
pintar(true);

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
