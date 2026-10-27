// Sesión del panel en las funciones de Vercel: valida el token de Firebase que manda el navegador.
const PERMITIDOS = ["sabenedettoa@gmail.com", "sabenedettoa@benedettowebs.cl"];
// Clave pública de la app web de Firebase (la misma de panel/firebase.js): solo sirve para validar la sesión
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyDnNaJWH3PMpex5B3vlCMPR96CHZRSXDqI";

// Valida el token de sesión de Firebase con Google y devuelve el correo de quien lo envió
async function usuario(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });
  if (!r.ok) return null;
  const u = (await r.json()).users?.[0];
  return u?.emailVerified && PERMITIDOS.includes(u.email) ? u.email : null;
}

module.exports = { usuario, PERMITIDOS };
