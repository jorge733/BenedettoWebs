/* =========================================================
   Carta digital — Benedetto Webs
   Plantilla común para todos los clientes.
   Lee /carta/clientes/<local>/datos.json y arma la carta.
   ========================================================= */
(() => {
  "use strict";

  const RUTA_CLIENTES = "/carta/clientes/";
  const ZONA_HORARIA = "America/Santiago";
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const DIAS_NOMBRE = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const DIAS_CORTO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Tipografías con estilo listas para usar en "tipografia" del datos.json
  const FUENTES = {
    "fraunces": "Fraunces:opsz,wght@9..144,600;9..144,700",
    "playfair display": "Playfair+Display:wght@600;700",
    "dm serif display": "DM+Serif+Display",
    "lora": "Lora:wght@600;700",
    "outfit": "Outfit:wght@600;700",
    "poppins": "Poppins:wght@600;700",
    "bricolage grotesque": "Bricolage+Grotesque:wght@600;700",
    "josefin sans": "Josefin+Sans:wght@600;700"
  };

  // Etiquetas conocidas (se escriben en minúscula, con o sin tilde)
  const ETIQUETAS = {
    "vegetariano": { texto: "Vegetariano", icono: "hoja" },
    "vegano": { texto: "Vegano", icono: "brote" },
    "sin gluten": { texto: "Sin gluten", icono: "espiga" },
    "sin lactosa": { texto: "Sin lactosa", icono: "gota" },
    "picante": { texto: "Picante", icono: "aji" },
    "nuevo": { texto: "Nuevo", icono: "chispa" }
  };

  const ICONOS = {
    whatsapp: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.2.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.5-.3Z" fill="currentColor" stroke="none"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
    mapa: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
    estrella: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" fill="currentColor" stroke="none"/>',
    hoja: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19 13 11"/>',
    brote: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6Z"/><path d="M12 14c0-3-2-5-6-5 0 3 2 5 6 5Z"/>',
    espiga: '<path d="M12 21V8"/><path d="M12 8c-2-1-3-3-3-5 2 0 3 2 3 5Zm0 0c2-1 3-3 3-5-2 0-3 2-3 5Z"/><path d="M12 13c-2-.5-3.5-2-3.5-4 2 0 3.5 1.5 3.5 4Zm0 0c2-.5 3.5-2 3.5-4-2 0-3.5 1.5-3.5 4Z"/><path d="M4 4l16 16"/>',
    gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M4 4l16 16"/>',
    aji: '<path d="M14 6c4 1 6 5 4 9-2 4-8 6-13 5 5-2 6-6 6-9 0-2 1-4 3-5Z"/><path d="M14 6c0-2 1-3 3-3"/>',
    chispa: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    taza: '<path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6Z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c-1 1 1 2 0 4M12 3c-1 1 1 2 0 4"/>'
  };

  const icono = (nombre, clase = "icono") =>
    `<svg class="${clase}" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[nombre] || ""}</svg>`;

  // ---------- Utilidades ----------
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const normalizar = (t) =>
    String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

  // Acepta 4500, "4500", "4.500" o "$4.500"
  const aNumero = (p) => {
    if (typeof p === "number") return p;
    const n = Number(String(p ?? "").replace(/[^\d]/g, ""));
    return Number.isFinite(n) && String(p ?? "").match(/\d/) ? n : null;
  };
  const formatoPrecio = (p) => {
    const n = aNumero(p);
    return n === null ? "" : "$" + new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n);
  };

  const slugDe = (t) => normalizar(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const rutaArchivo = (base, archivo) => {
    if (!archivo) return "";
    if (/^(https?:)?\/\//.test(archivo) || archivo.startsWith("/")) return archivo;
    return base + archivo.replace(/^\.?\//, "");
  };

  // ---------- Colores ----------
  const hexARgb = (hex) => {
    let h = String(hex || "").replace("#", "").trim();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const luminancia = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const textoSobre = (hex) => {
    const rgb = hexARgb(hex);
    if (!rgb) return "#ffffff";
    return luminancia(rgb) > 0.45 ? "#1d1611" : "#ffffff";
  };

  const aplicarColores = (c = {}) => {
    const raiz = document.documentElement.style;
    const principal = hexARgb(c.principal) ? c.principal : "#2A1D15";
    const acento = hexARgb(c.acento) ? c.acento : "#B8652F";
    const fondo = hexARgb(c.fondo) ? c.fondo : "#F7F3EE";
    const texto = hexARgb(c.texto) ? c.texto : "#221A14";
    raiz.setProperty("--principal", principal);
    raiz.setProperty("--sobre-principal", textoSobre(principal));
    raiz.setProperty("--acento", acento);
    raiz.setProperty("--sobre-acento", textoSobre(acento));
    raiz.setProperty("--fondo", fondo);
    raiz.setProperty("--texto", texto);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", principal);
  };

  const cargarFuente = (nombre) => {
    if (!nombre) return;
    const clave = normalizar(nombre);
    const familia = FUENTES[clave] || encodeURIComponent(nombre).replace(/%20/g, "+");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${familia}&display=swap`;
    document.head.appendChild(link);
    document.documentElement.style.setProperty("--fuente-titulos", `"${nombre}", Georgia, "Times New Roman", serif`);
  };

  // ---------- Horario ----------
  const aMinutos = (hhmm) => {
    const m = String(hhmm).trim().match(/^(\d{1,2})[:.](\d{2})$/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  // "08:00 - 20:00" o "12:00 - 15:00, 19:00 - 23:30" o "cerrado"
  const leerRangos = (texto) => {
    if (!texto || /cerrad/i.test(texto)) return [];
    return String(texto)
      .split(/[,;]|\s+y\s+/)
      .map((r) => r.trim().split(/\s*(?:-|–|\ba\b)\s*/))
      .map(([a, c]) => ({ abre: aMinutos(a), cierra: aMinutos(c) }))
      .filter((r) => r.abre !== null && r.cierra !== null);
  };
  const leerHorario = (h = {}) => {
    const porClave = {};
    Object.entries(h).forEach(([k, v]) => (porClave[normalizar(k)] = v));
    return DIAS.map((d) => {
      const original = porClave[d];
      return { texto: original ? String(original) : "", rangos: leerRangos(original) };
    });
  };
  const horaTexto = (min) => {
    const m = ((min % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  };
  const rangoTexto = (dia) =>
    dia.rangos.length ? dia.rangos.map((r) => `${horaTexto(r.abre)} – ${horaTexto(r.cierra)}`).join(" · ") : "Cerrado";

  const ahoraEnChile = () => {
    const partes = new Intl.DateTimeFormat("en-US", {
      timeZone: ZONA_HORARIA, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
    const dia = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday);
    return { dia, minutos: Number(p.hour) * 60 + Number(p.minute) };
  };

  const estadoAbierto = (semana) => {
    if (!semana.some((d) => d.rangos.length)) return null;
    const { dia, minutos } = ahoraEnChile();
    // ¿Abierto ahora? (incluye horarios que pasan la medianoche)
    for (const r of semana[dia].rangos) {
      const fin = r.cierra <= r.abre ? r.cierra + 1440 : r.cierra;
      if (minutos >= r.abre && minutos < fin) {
        return { abierto: true, pronto: fin - minutos <= 30, texto: `Abierto · hasta las ${horaTexto(r.cierra)}` };
      }
    }
    const ayer = semana[(dia + 6) % 7];
    for (const r of ayer.rangos) {
      if (r.cierra <= r.abre && minutos < r.cierra) {
        return { abierto: true, pronto: r.cierra - minutos <= 30, texto: `Abierto · hasta las ${horaTexto(r.cierra)}` };
      }
    }
    // Próxima apertura
    const hoyProx = semana[dia].rangos.find((r) => r.abre > minutos);
    if (hoyProx) return { abierto: false, texto: `Cerrado · abre hoy a las ${horaTexto(hoyProx.abre)}` };
    for (let i = 1; i <= 7; i++) {
      const d = (dia + i) % 7;
      if (semana[d].rangos.length) {
        const cuando = i === 1 ? "mañana" : `el ${DIAS_NOMBRE[d].toLowerCase()}`;
        return { abierto: false, texto: `Cerrado · abre ${cuando} a las ${horaTexto(semana[d].rangos[0].abre)}` };
      }
    }
    return null;
  };

  // Agrupa días seguidos con el mismo horario: "Lunes a jueves", "Sábado y domingo"
  const agruparHorario = (semana) => {
    const grupos = [];
    semana.forEach((d, i) => {
      const t = rangoTexto(d);
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.texto === t && ultimo.hasta === i - 1) ultimo.hasta = i;
      else grupos.push({ desde: i, hasta: i, texto: t });
    });
    return grupos.map((g) => {
      let dias = DIAS_NOMBRE[g.desde];
      if (g.hasta === g.desde + 1) dias += " y " + DIAS_NOMBRE[g.hasta].toLowerCase();
      else if (g.hasta > g.desde) dias += " a " + DIAS_NOMBRE[g.hasta].toLowerCase();
      return { ...g, dias };
    });
  };

  // ---------- Enlaces ----------
  const enlaceWhatsapp = (num, mensaje) => {
    const n = String(num || "").replace(/\D/g, "");
    if (!n) return "";
    return `https://wa.me/${n}${mensaje ? "?text=" + encodeURIComponent(mensaje) : ""}`;
  };
  const enlaceInstagram = (u) => {
    if (!u) return "";
    if (/^https?:\/\//.test(u)) return u;
    return `https://www.instagram.com/${String(u).replace(/^@/, "").trim()}/`;
  };
  const enlaceMapa = (datos) =>
    datos.mapa || (datos.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(datos.direccion)}` : "");

  // ---------- Render ----------
  const app = document.getElementById("app");
  const dialogo = document.getElementById("detalle");
  const contenidoDialogo = document.getElementById("detalle-contenido");

  const etiquetasHTML = (lista = []) => {
    if (!Array.isArray(lista) || !lista.length) return "";
    return `<ul class="etiquetas">${lista
      .map((e) => {
        const conocida = ETIQUETAS[normalizar(e)];
        const clase = "et-" + slugDe(e);
        return `<li class="etiqueta ${clase}">${conocida ? icono(conocida.icono, "icono-et") : ""}${esc(conocida ? conocida.texto : e)}</li>`;
      })
      .join("")}</ul>`;
  };

  const precioHTML = (p) => {
    if (Array.isArray(p.variantes) && p.variantes.length) {
      return `<div class="precio precio-variantes">${p.variantes
        .map((v) => `<span><small>${esc(v.nombre)}</small> ${esc(formatoPrecio(v.precio))}</span>`)
        .join("")}</div>`;
    }
    const t = formatoPrecio(p.precio);
    return t ? `<div class="precio">${esc(t)}</div>` : "";
  };

  const productoHTML = (p, id, base, categoria = "") => {
    const foto = rutaArchivo(base, p.foto);
    const clases = ["producto", foto ? "con-foto" : "sin-foto", p.agotado ? "agotado" : "", p.destacado ? "destacado" : ""]
      .filter(Boolean)
      .join(" ");
    const busqueda = normalizar([p.nombre, p.descripcion, categoria, ...(p.etiquetas || [])].join(" "));
    return `
      <article class="${clases}" data-busqueda="${esc(busqueda)}" data-id="${id}">
        <div class="producto-texto">
          <h3 class="producto-nombre">${esc(p.nombre)}</h3>
          ${p.destacado || p.agotado ? `<div class="marcas">
            ${p.destacado ? `<span class="marca marca-destacado">${icono("estrella", "icono-et")}Recomendado</span>` : ""}
            ${p.agotado ? `<span class="marca marca-agotado">Agotado</span>` : ""}
          </div>` : ""}
          ${p.descripcion ? `<p class="producto-desc">${esc(p.descripcion)}</p>` : ""}
          <div class="producto-pie">
            ${precioHTML(p)}
            ${etiquetasHTML(p.etiquetas)}
          </div>
        </div>
        ${foto ? `<button class="producto-foto" type="button" data-abrir="${id}" aria-label="Ver foto de ${esc(p.nombre)}">
          <img src="${esc(foto)}" alt="" loading="lazy" decoding="async" width="200" height="200">
        </button>` : ""}
      </article>`;
  };

  const destacadoHTML = (p, id, base, i) => {
    const foto = rutaArchivo(base, p.foto);
    return `
      <button class="tarjeta-destacada ${p.agotado ? "agotado" : ""}" type="button" data-abrir="${id}">
        <span class="tarjeta-imagen ${foto ? "" : "tarjeta-sin-foto"}">
          ${foto
            ? `<img src="${esc(foto)}" alt="" loading="${i < 2 ? "eager" : "lazy"}" decoding="async" width="400" height="400">`
            : `<span class="monograma" aria-hidden="true">${esc((p.nombre || "?").trim().charAt(0))}</span>`}
          ${p.agotado ? `<span class="marca marca-agotado">Agotado</span>` : ""}
        </span>
        <span class="tarjeta-texto">
          <span class="tarjeta-nombre">${esc(p.nombre)}</span>
          <span class="tarjeta-precio">${esc(p.variantes?.length ? "desde " + formatoPrecio(Math.min(...p.variantes.map((v) => aNumero(v.precio) ?? Infinity))) : formatoPrecio(p.precio))}</span>
        </span>
      </button>`;
  };

  const render = (datos, slug) => {
    const base = `${RUTA_CLIENTES}${slug}/`;
    aplicarColores(datos.colores);
    cargarFuente(datos.tipografia);

    document.title = `${datos.nombre} · Carta`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = `Carta de ${datos.nombre}${datos.descripcion ? ": " + datos.descripcion : ""}`;
    if (datos.logo) {
      const ico = document.querySelector('link[rel="icon"]');
      ico.href = rutaArchivo(base, datos.logo);
      ico.removeAttribute("type");
    }

    const semana = leerHorario(datos.horario);
    const estado = estadoAbierto(semana);
    const grupos = agruparHorario(semana);
    const hoy = ahoraEnChile().dia;

    const wa = enlaceWhatsapp(datos.whatsapp, datos.mensajeWhatsapp || `Hola ${datos.nombre}, vi su carta digital y quiero hacer una consulta.`);
    const ig = enlaceInstagram(datos.instagram);
    const mapa = enlaceMapa(datos);
    const acciones = [
      wa && `<a class="accion accion-wa" href="${esc(wa)}" target="_blank" rel="noopener">${icono("whatsapp")}<span>WhatsApp</span></a>`,
      ig && `<a class="accion" href="${esc(ig)}" target="_blank" rel="noopener">${icono("instagram")}<span>Instagram</span></a>`,
      mapa && `<a class="accion" href="${esc(mapa)}" target="_blank" rel="noopener">${icono("mapa")}<span>Cómo llegar</span></a>`
    ].filter(Boolean);

    // Productos con id único
    const productos = [];
    const categorias = (datos.categorias || []).map((c, ci) => {
      const id = "cat-" + (slugDe(c.nombre) || ci);
      const items = (c.productos || c.platos || []).map((p) => {
        const pid = productos.length;
        productos.push(p);
        return { p, pid };
      });
      return { ...c, id, items };
    });
    const destacados = productos.map((p, pid) => ({ p, pid })).filter(({ p }) => p.destacado);

    const urlBenedetto = `https://www.benedettowebs.cl/?utm_source=carta&utm_medium=referral&utm_campaign=${encodeURIComponent(slug)}`;

    app.innerHTML = `
      ${datos.demo ? `<div class="banda-demo">
        <span>Carta de demostración</span>
        <a href="${esc(urlBenedetto)}" target="_blank" rel="noopener">¿Quieres una para tu local? →</a>
      </div>` : ""}

      <header class="cabecera">
        <div class="cabecera-fondo" aria-hidden="true"></div>
        <div class="cabecera-contenido">
          ${datos.logo ? `<img class="logo" src="${esc(rutaArchivo(base, datos.logo))}" alt="Logo de ${esc(datos.nombre)}" width="96" height="96" fetchpriority="high">` : ""}
          <h1 class="nombre-local">${esc(datos.nombre)}</h1>
          ${datos.descripcion ? `<p class="lema">${esc(datos.descripcion)}</p>` : ""}
          ${estado ? `<p class="estado ${estado.abierto ? (estado.pronto ? "estado-pronto" : "estado-abierto") : "estado-cerrado"}">
            <span class="punto" aria-hidden="true"></span>${esc(estado.pronto ? estado.texto.replace("Abierto", "Cierra pronto") : estado.texto)}
          </p>` : ""}
          ${semana[hoy].texto ? `<p class="hoy">${icono("reloj", "icono-mini")}Hoy ${esc(DIAS_NOMBRE[hoy].toLowerCase())}: ${esc(rangoTexto(semana[hoy]))}</p>` : ""}
        </div>
        ${acciones.length ? `<nav class="acciones acciones-${acciones.length}" aria-label="Contacto">${acciones.join("")}</nav>` : ""}
      </header>

      <div class="barra" id="barra">
        <label class="buscador">
          ${icono("lupa", "icono-buscar")}
          <input id="buscar" type="search" placeholder="Buscar en la carta" autocomplete="off" enterkeyhint="search" aria-label="Buscar en la carta">
          <button type="button" class="limpiar" id="limpiar" aria-label="Borrar búsqueda" hidden>${icono("cerrar", "icono-mini")}</button>
        </label>
        <nav class="chips" id="chips" aria-label="Categorías">
          ${categorias.map((c) => `<a class="chip" href="#${c.id}" data-cat="${c.id}">${esc(c.nombre)}</a>`).join("")}
        </nav>
      </div>

      <main class="carta" id="carta">
        ${destacados.length ? `<section class="seccion-destacados" id="destacados" aria-labelledby="titulo-destacados">
          <h2 class="titulo-destacados" id="titulo-destacados">${icono("estrella", "icono-mini")}Recomendados de la casa</h2>
          <div class="carrusel">${destacados.map(({ p, pid }, i) => destacadoHTML(p, pid, base, i)).join("")}</div>
        </section>` : ""}

        <p class="sin-resultados" id="sin-resultados" hidden></p>

        ${categorias.map((c, i) => `
          <section class="categoria" id="${c.id}" aria-labelledby="${c.id}-t">
            <div class="categoria-cabecera">
              <span class="categoria-numero" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
              <h2 class="categoria-nombre" id="${c.id}-t">${esc(c.nombre)}</h2>
              ${c.descripcion ? `<p class="categoria-desc">${esc(c.descripcion)}</p>` : ""}
            </div>
            <div class="productos">${c.items.map(({ p, pid }) => productoHTML(p, pid, base, c.nombre)).join("")}</div>
          </section>`).join("")}

        ${datos.nota ? `<p class="nota">${esc(datos.nota)}</p>` : ""}
      </main>

      <section class="info" aria-labelledby="titulo-info">
        <h2 id="titulo-info" class="info-titulo">Visítanos</h2>
        ${datos.direccion ? `<p class="info-direccion">${icono("mapa", "icono-mini")}${esc(datos.direccion)}</p>` : ""}
        ${grupos.some((g) => g.texto !== "Cerrado") ? `<dl class="horario">
          ${grupos.map((g) => `<div class="${hoy >= g.desde && hoy <= g.hasta ? "es-hoy" : ""}"><dt>${esc(g.dias)}</dt><dd>${esc(g.texto)}</dd></div>`).join("")}
        </dl>` : ""}
        ${acciones.length ? `<div class="acciones acciones-info acciones-${acciones.length}">${acciones.join("")}</div>` : ""}
      </section>

      <footer class="pie">
        <a href="${esc(urlBenedetto)}" target="_blank" rel="noopener">Carta digital por <strong>Benedetto Webs</strong></a>
      </footer>
    `;

    document.body.classList.remove("cargando");
    activarInteracciones(productos, base);
  };

  // ---------- Detalle (foto grande) ----------
  const abrirDetalle = (p, base) => {
    const foto = rutaArchivo(base, p.foto);
    contenidoDialogo.innerHTML = `
      ${foto ? `<img class="detalle-foto" src="${esc(foto)}" alt="${esc(p.nombre)}">` : `<div class="detalle-foto detalle-sin-foto" aria-hidden="true"><span class="monograma">${esc((p.nombre || "?").charAt(0))}</span></div>`}
      <div class="detalle-texto">
        <h2 id="detalle-nombre">${esc(p.nombre)}</h2>
        ${p.agotado ? `<span class="marca marca-agotado">Agotado por hoy</span>` : ""}
        ${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ""}
        <div class="producto-pie">${precioHTML(p)}${etiquetasHTML(p.etiquetas)}</div>
      </div>`;
    if (typeof dialogo.showModal === "function") dialogo.showModal();
    else dialogo.setAttribute("open", "");
  };

  // ---------- Búsqueda, categorías fijas y scroll ----------
  const activarInteracciones = (productos, base) => {
    const barra = document.getElementById("barra");
    const chips = [...document.querySelectorAll(".chip")];
    const secciones = [...document.querySelectorAll(".categoria")];
    const input = document.getElementById("buscar");
    const limpiar = document.getElementById("limpiar");
    const sinResultados = document.getElementById("sin-resultados");
    const destacados = document.getElementById("destacados");

    const medirBarra = () =>
      document.documentElement.style.setProperty("--alto-barra", barra.offsetHeight + "px");
    medirBarra();
    window.addEventListener("resize", medirBarra);

    // Abrir detalle
    document.getElementById("app").addEventListener("click", (e) => {
      const b = e.target.closest("[data-abrir]");
      if (b) abrirDetalle(productos[Number(b.dataset.abrir)], base);
    });
    dialogo.addEventListener("click", (e) => {
      if (e.target === dialogo) dialogo.close();
    });

    // Chip activo según la sección visible
    let activo = null;
    const marcarChip = (id) => {
      if (id === activo) return;
      activo = id;
      chips.forEach((c) => {
        const si = c.dataset.cat === id;
        c.classList.toggle("activo", si);
        if (si) c.setAttribute("aria-current", "true");
        else c.removeAttribute("aria-current");
        if (si) {
          const nav = c.parentElement;
          nav.scrollTo({ left: c.offsetLeft - nav.clientWidth / 2 + c.clientWidth / 2, behavior: "smooth" });
        }
      });
    };
    let pendiente = false;
    const alHacerScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        barra.classList.toggle("fija", barra.getBoundingClientRect().top <= 0.5);
        const limite = barra.offsetHeight + 80;
        let actual = null;
        for (const s of secciones) {
          if (s.hidden) continue;
          if (s.getBoundingClientRect().top - limite <= 0) actual = s.id;
        }
        // Al llegar al final de la página, marcar la última categoría
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
          const visibles = secciones.filter((s) => !s.hidden);
          if (visibles.length) actual = visibles[visibles.length - 1].id;
        }
        marcarChip(actual);
      });
    };
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    alHacerScroll();

    chips.forEach((c) =>
      c.addEventListener("click", (e) => {
        e.preventDefault();
        const s = document.getElementById(c.dataset.cat);
        if (!s) return;
        const y = s.getBoundingClientRect().top + window.scrollY - barra.offsetHeight + 4;
        window.scrollTo({ top: y, behavior: "smooth" });
        marcarChip(c.dataset.cat);
      })
    );

    // Buscador
    const filtrar = () => {
      const q = normalizar(input.value);
      const palabras = q.split(/\s+/).filter(Boolean);
      limpiar.hidden = !q;
      let total = 0;
      secciones.forEach((s) => {
        let visibles = 0;
        s.querySelectorAll(".producto").forEach((p) => {
          const ok = palabras.every((w) => p.dataset.busqueda.includes(w));
          p.hidden = !ok;
          if (ok) visibles++;
        });
        s.hidden = visibles === 0;
        total += visibles;
        const chip = chips.find((c) => c.dataset.cat === s.id);
        if (chip) chip.hidden = visibles === 0;
      });
      if (destacados) destacados.hidden = !!q;
      sinResultados.hidden = !(q && total === 0);
      if (q && total === 0) sinResultados.textContent = `No encontramos “${input.value.trim()}”. Prueba con otra palabra.`;
      alHacerScroll();
    };
    let espera;
    input.addEventListener("input", () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        filtrar();
        // Llevar la vista al inicio de los resultados
        const carta = document.getElementById("carta");
        const y = carta.getBoundingClientRect().top + window.scrollY - barra.offsetHeight;
        if (input.value && window.scrollY > y) window.scrollTo({ top: y });
      }, 120);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
    });
    limpiar.addEventListener("click", () => {
      input.value = "";
      filtrar();
      input.focus();
    });
  };

  // ---------- Errores amables ----------
  const mostrarError = (titulo, detalle) => {
    document.body.classList.remove("cargando");
    document.title = "Carta no encontrada";
    app.innerHTML = `
      <div class="error">
        ${icono("taza", "icono-error")}
        <h1>${esc(titulo)}</h1>
        <p>${esc(detalle)}</p>
        <a class="boton-error" href="https://www.benedettowebs.cl/">Ir a Benedetto Webs</a>
      </div>`;
  };

  // ---------- Inicio ----------
  const obtenerSlug = () => {
    const q = new URLSearchParams(location.search).get("local");
    if (q) return q.toLowerCase();
    const m = location.pathname.match(/^\/carta\/([a-z0-9-]+)\/?$/i);
    return m ? m[1].toLowerCase() : null;
  };

  const iniciar = async () => {
    const slug = obtenerSlug();
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      mostrarError("Falta el nombre del local", "Abre la carta desde su código QR o con una dirección como /carta/cafe-almendra.");
      return;
    }
    let res;
    try {
      res = await fetch(`${RUTA_CLIENTES}${slug}/datos.json`, { cache: "no-cache" });
    } catch {
      mostrarError("Sin conexión", "No pudimos cargar la carta. Revisa tu internet e inténtalo de nuevo.");
      return;
    }
    if (!res.ok) {
      mostrarError("No encontramos esta carta", "Puede que la dirección esté mal escrita o que la carta ya no esté disponible.");
      return;
    }
    const texto = await res.text();
    let datos;
    try {
      datos = JSON.parse(texto);
    } catch (e) {
      mostrarError("La carta tiene un error", `El archivo datos.json de “${slug}” tiene un error de formato. Revísalo con “npm run revisar”. (${e.message})`);
      return;
    }
    render(datos, slug);
  };

  iniciar();
})();
