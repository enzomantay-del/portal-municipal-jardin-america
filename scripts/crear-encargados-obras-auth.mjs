/**
 * Crea usuarios Auth (signUp) para encargados de obras.
 * Los perfiles Firestore deben completarse en admin.html (UID impreso abajo).
 *
 * Uso: node scripts/crear-encargados-obras-auth.mjs
 */
const API_KEY = "AIzaSyBNffWqrvuWCdA-QzPu6ZZPOLrzDZ8BoPY";

const ENCARGADOS = [
  {
    email: "obras.publicas@municipalidadjardin.gov.ar",
    password: "ObrasPublicas2026!",
    areaSlug: "obras-publicas",
    telefonoWhatsapp: "5493743667206",
  },
  {
    email: "obras.privadas@municipalidadjardin.gov.ar",
    password: "ObrasPrivadas2026!",
    areaSlug: "obras-privadas",
    telefonoWhatsapp: "5493794358121",
  },
];

async function signUp(email, password) {
  const res = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || res.statusText);
    err.code = data.error?.message;
    throw err;
  }
  return data;
}

async function signIn(email, password) {
  const res = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || res.statusText);
  return data;
}

async function ensureAuthUser(cfg) {
  try {
    const created = await signUp(cfg.email, cfg.password);
    console.log("Creado:", cfg.email, "→ UID:", created.localId);
    return created.localId;
  } catch (err) {
    if (err.code === "EMAIL_EXISTS") {
      const session = await signIn(cfg.email, cfg.password);
      console.log("Ya existía:", cfg.email, "→ UID:", session.localId);
      return session.localId;
    }
    throw err;
  }
}

async function main() {
  console.log("=== Encargados mapa de obras ===\n");
  for (const cfg of ENCARGADOS) {
    const uid = await ensureAuthUser(cfg);
    console.log(
      "  admin.html → Asignar rol: UID=" +
        uid +
        " | rol=encargado | área=" +
        cfg.areaSlug +
        " | email=" +
        cfg.email
    );
    if (cfg.telefonoWhatsapp) {
      console.log("  WhatsApp sugerido:", cfg.telefonoWhatsapp);
    }
    console.log("");
  }
  console.log("Credenciales de acceso (encargado.html):");
  ENCARGADOS.forEach((c) => console.log("  " + c.email + " / " + c.password));
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
