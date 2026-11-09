// Efectos interactivos compartidos por la portada, Herramientas y Ayuda Tecnológica.
// Cada efecto revisa que sus elementos existan, porque no todas las páginas los tienen.
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ===== Barra de progreso de lectura =====
  const barra = document.createElement("div");
  barra.className = "scroll-bar";
  barra.setAttribute("aria-hidden", "true");
  document.body.append(barra);

  let pendiente = false;
  const actualizarBarra = () => {
    pendiente = false;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
  };
  const pedirBarra = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(actualizarBarra);
  };
  window.addEventListener("scroll", pedirBarra, { passive: true });
  window.addEventListener("resize", pedirBarra, { passive: true });
  actualizarBarra();

  // ===== Menú: marca la sección que se está viendo =====
  const enlaces = new Map();
  document.querySelectorAll('.nav-links a[href^="#"]:not(.btn)').forEach((a) => {
    const seccion = document.querySelector(a.getAttribute("href"));
    if (seccion) enlaces.set(seccion, a);
  });
  if (enlaces.size) {
    const espia = new IntersectionObserver(
      (entries) => entries.forEach((e) => enlaces.get(e.target).classList.toggle("active", e.isIntersecting)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    enlaces.forEach((_, seccion) => espia.observe(seccion));
  }

  // ===== Los pasos se encienden uno tras otro =====
  const pasos = new IntersectionObserver(
    (entries) =>
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e, i) => {
          pasos.unobserve(e.target);
          setTimeout(() => e.target.classList.add("lit"), i * 320);
        }),
    { rootMargin: "0px 0px -25% 0px" }
  );
  document.querySelectorAll(".steps li").forEach((li) => pasos.observe(li));

  // ===== El precio se cuenta al aparecer =====
  const precio = document.getElementById("precioNum");
  if (precio) {
    const valor = 30000;
    const contar = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        contar.disconnect();
        const inicio = performance.now();
        const paso = (ahora) => {
          const t = Math.min((ahora - inicio) / 1100, 1);
          const suave = 1 - Math.pow(1 - t, 3);
          precio.textContent = (Math.round((valor * suave) / 100) * 100).toLocaleString("es-CL");
          if (t < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      },
      { threshold: 0.6 }
    );
    contar.observe(precio);
  }

  // ===== Efectos que siguen al cursor (solo con mouse) =====
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const TARJETAS = ".card, .project, .steps li, .price-card, .testimonial";
  const portada = document.querySelector(".hero-intro");
  let actual = null;
  let evento = null;
  let cuadro = 0;

  const soltar = () => {
    if (actual) ["--rx", "--ry"].forEach((v) => actual.style.removeProperty(v));
    actual = null;
  };
  const aplicar = () => {
    cuadro = 0;
    const objetivo = evento.target instanceof Element ? evento.target : null;
    const tarjeta = objetivo && objetivo.closest(TARJETAS);
    if (tarjeta !== actual) soltar();
    if (tarjeta) {
      actual = tarjeta;
      const r = tarjeta.getBoundingClientRect();
      const x = (evento.clientX - r.left) / r.width;
      const y = (evento.clientY - r.top) / r.height;
      tarjeta.style.setProperty("--mx", `${x * 100}%`);
      tarjeta.style.setProperty("--my", `${y * 100}%`);
      tarjeta.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
      tarjeta.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
    }
    if (portada && objetivo && portada.contains(objetivo)) {
      portada.style.setProperty("--px", ((evento.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      portada.style.setProperty("--py", ((evento.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    }
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      evento = e;
      if (!cuadro) cuadro = requestAnimationFrame(aplicar);
    },
    { passive: true }
  );
  document.documentElement.addEventListener("mouseleave", soltar);
})();
