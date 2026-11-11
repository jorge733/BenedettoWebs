// Agenda: convierte lo que escribes en el campo rápido en una tarea.
// "Llamar a Daniela mañana 15:00 ! #clientes" → { titulo: "Llamar a Daniela", fecha: mañana, hora: "15:00", importante, categoría }
export const DIA = 24 * 60 * 60 * 1000;
export const CATEGORIAS = { Clientes: "👤", Marketing: "📣", Administración: "🧾", Personal: "🌱" };
const ETIQUETAS = {
  cliente: "Clientes", clientes: "Clientes", marketing: "Marketing", instagram: "Marketing",
  admin: "Administración", administracion: "Administración", "administración": "Administración", personal: "Personal"
};
const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const sinTildes = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

// Fechas "2026-10-27" en hora local
export const sumar = (iso, n) => new Date(Date.parse(iso + "T12:00:00") + n * DIA).toLocaleDateString("en-CA");
const diaDe = (iso) => new Date(iso + "T12:00:00").getDay(); // 0 domingo

// ===== Tareas que se repiten =====
// Una tarea repetida es una sola: al completarla, su fecha salta a la próxima vez (ver siguiente()).
export const REPETIR = { diaria: "Todos los días", habiles: "De lunes a viernes", semanal: "Cada semana", quincenal: "Cada 2 semanas", mensual: "Cada mes" };
export function textoRepetir(t) {
  if (!t.repetir || !t.fecha) return "";
  const dia = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][diaDe(t.fecha)];
  if (t.repetir === "semanal") return `Todos los ${dia === "sábado" || dia === "domingo" ? dia + "s" : dia}`;
  if (t.repetir === "quincenal") return `Cada 2 semanas (${dia})`;
  if (t.repetir === "mensual") return `El ${Number(t.fecha.slice(8))} de cada mes`;
  return REPETIR[t.repetir] || "";
}
// La próxima fecha después de "iso" según la repetición
export function siguiente(iso, repetir) {
  if (repetir === "diaria") return sumar(iso, 1);
  if (repetir === "habiles") return sumar(iso, diaDe(iso) === 5 ? 3 : diaDe(iso) === 6 ? 2 : 1);
  if (repetir === "semanal") return sumar(iso, 7);
  if (repetir === "quincenal") return sumar(iso, 14);
  if (repetir === "mensual") {
    const [a, m, d] = iso.split("-").map(Number);
    const ultimo = new Date(a, m + 1, 0).getDate(); // último día del mes siguiente
    return new Date(a, m, Math.min(d, ultimo), 12).toLocaleDateString("en-CA");
  }
  return "";
}
// ¿La tarea cae en "dia"? (incluye las próximas repeticiones, para la vista de la semana)
export function ocurre(t, dia) {
  if (!t.fecha || dia < t.fecha) return false;
  if (dia === t.fecha) return true;
  if (!t.repetir) return false;
  const n = Math.round((Date.parse(dia + "T12:00:00") - Date.parse(t.fecha + "T12:00:00")) / DIA);
  if (t.repetir === "diaria") return true;
  if (t.repetir === "habiles") return diaDe(dia) !== 0 && diaDe(dia) !== 6;
  if (t.repetir === "semanal") return n % 7 === 0;
  if (t.repetir === "quincenal") return n % 14 === 0;
  if (t.repetir === "mensual") {
    let f = t.fecha;
    while (f < dia) f = siguiente(f, "mensual");
    return f === dia;
  }
  return false;
}

export function interpretar(texto, hoy, clientes = []) {
  let resto = ` ${texto} `;
  const quitar = (re) => {
    const m = resto.match(re);
    if (m) resto = resto.replace(m[0], " ");
    return m;
  };
  const t = { titulo: "", fecha: "", hora: "", categoria: "", clienteId: "", importante: false, notas: "", repetir: "" };

  // Repetición: "todos los lunes", "cada martes", "todos los días", "cada día hábil", "cada semana", "cada mes"
  let r;
  if (quitar(/\s(?:todos\s+los\s+d[ií]as\s+h[aá]biles|cada\s+d[ií]a\s+h[aá]bil|de\s+lunes\s+a\s+viernes|d[ií]as\s+h[aá]biles)(?=\s)/i)) {
    t.repetir = "habiles";
    t.fecha = [0, 6].includes(diaDe(hoy)) ? sumar(hoy, diaDe(hoy) === 6 ? 2 : 1) : hoy;
  } else if (quitar(/\s(?:todos\s+los\s+d[ií]as|cada\s+d[ií]a|diariamente)(?=\s)/i)) {
    t.repetir = "diaria";
    t.fecha = hoy;
  } else if ((r = quitar(/\s(?:todos\s+los|cada)\s+(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bados?|domingos?)(?=\s)/i))) {
    t.repetir = "semanal";
    t.fecha = sumar(hoy, (DIAS.findIndex((d) => sinTildes(r[1]).startsWith(d.slice(0, 3))) - diaDe(hoy) + 7) % 7);
  } else if (quitar(/\s(?:cada\s+2\s+semanas|cada\s+dos\s+semanas|quincenalmente)(?=\s)/i)) t.repetir = "quincenal";
  else if (quitar(/\s(?:cada\s+semana|todas\s+las\s+semanas|semanalmente)(?=\s)/i)) t.repetir = "semanal";
  else if (quitar(/\s(?:cada\s+mes|todos\s+los\s+meses|mensualmente)(?=\s)/i)) t.repetir = "mensual";

  if (quitar(/\s!+(?=\s)/)) t.importante = true;
  const cat = quitar(/\s#([\wáéíóúñ]+)(?=\s)/i);
  if (cat) t.categoria = ETIQUETAS[cat[1].toLowerCase()] || "";

  // Hora: "15:00", "15.30", "15h", "a las 15", "a las 3" (de 1 a 7 se entiende de la tarde)
  let h;
  if ((h = quitar(/\s(?:a las\s)?([01]?\d|2[0-3])[:.]([0-5]\d)\s?(?:h|hrs|horas)?(?=\s)/i))) t.hora = `${h[1].padStart(2, "0")}:${h[2]}`;
  else if ((h = quitar(/\s(?:a las\s)?([01]?\d|2[0-3])\s?(?:h|hrs|horas)(?=\s)/i))) t.hora = `${h[1].padStart(2, "0")}:00`;
  else if ((h = quitar(/\sa las\s([01]?\d|2[0-3])(?=\s)/i))) {
    const n = Number(h[1]);
    t.hora = `${String(n >= 1 && n <= 7 ? n + 12 : n).padStart(2, "0")}:00`;
  }

  // Fecha: hoy, mañana, pasado mañana, en 3 días, el jueves, 12/11 o 12/11/2026
  let f;
  if (quitar(/\spasado\s+ma[ñn]ana(?=\s)/i)) t.fecha = sumar(hoy, 2);
  else if (quitar(/\sma[ñn]ana(?=\s)/i)) t.fecha = sumar(hoy, 1);
  else if (quitar(/\shoy(?=\s)/i)) t.fecha = hoy;
  else if ((f = quitar(/\sen\s(\d{1,2})\sd[ií]as?(?=\s)/i))) t.fecha = sumar(hoy, Number(f[1]));
  else if ((f = quitar(/\s(?:el\s|este\s|pr[oó]ximo\s)?(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)(?=\s)/i))) {
    const objetivo = DIAS.indexOf(sinTildes(f[1]));
    const actual = new Date(hoy + "T12:00:00").getDay();
    t.fecha = sumar(hoy, ((objetivo - actual + 7) % 7) || 7);
  } else if ((f = quitar(/\s(?:el\s)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?(?=\s)/))) {
    const anioHoy = Number(hoy.slice(0, 4));
    const anio = f[3] ? Number(f[3].length === 2 ? "20" + f[3] : f[3]) : anioHoy;
    let iso = `${anio}-${f[2].padStart(2, "0")}-${f[1].padStart(2, "0")}`;
    if (!f[3] && iso < hoy) iso = `${anioHoy + 1}${iso.slice(4)}`; // "3/1" escrito en diciembre es el próximo año
    const valida = new Date(iso + "T12:00:00");
    if (!Number.isNaN(valida.getTime()) && valida.toLocaleDateString("en-CA") === iso) t.fecha = iso;
  }
  if ((t.hora || t.repetir) && !t.fecha) t.fecha = hoy;

  t.titulo = resto.replace(/\s+/g, " ").trim().replace(/\s(el|para|a las|a la)$/i, "");
  t.titulo = t.titulo.charAt(0).toUpperCase() + t.titulo.slice(1);

  // Si el texto nombra a un cliente (por su negocio o nombre completo), queda asociado
  const bajo = sinTildes(texto);
  const nombra = (n) => n && n.trim().length > 2 &&
    new RegExp(`(^|[^a-z0-9])${sinTildes(n.trim()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`).test(bajo);
  const c = clientes.find((c) => [c.negocio, c.nombre].some(nombra));
  if (c) {
    t.clienteId = c.id;
    if (!t.categoria) t.categoria = "Clientes";
  }
  return t;
}
