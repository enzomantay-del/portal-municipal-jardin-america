/**
 * Crea cuentas de encargado para Obras Públicas y Obras Privadas (Auth + Firestore users).
 * Requiere: firebase login (CLI) o GOOGLE_APPLICATION_CREDENTIALS con rol Firebase Admin.
 *
 * Uso: node scripts/crear-encargados-obras.mjs
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = "portal-municipal-jardin";

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

function initAdmin() {
  if (getApps().length) return;

  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (saPath && existsSync(saPath)) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, "utf8"))) });
    return;
  }

  initializeApp({ projectId: PROJECT_ID });
}

async function ensureUser(auth, db, cfg) {
  var userRecord = null;
  try {
    userRecord = await auth.getUserByEmail(cfg.email);
    console.log("Auth ya existe:", cfg.email, "→", userRecord.uid);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    userRecord = await auth.createUser({
      email: cfg.email,
      password: cfg.password,
      emailVerified: true,
    });
    console.log("Auth creado:", cfg.email, "→", userRecord.uid);
  }

  await auth.updateUser(userRecord.uid, { password: cfg.password, emailVerified: true });

  await db
    .collection("users")
    .doc(userRecord.uid)
    .set(
      {
        role: "encargado",
        email: cfg.email,
        areaSlug: cfg.areaSlug,
        telefonoWhatsapp: cfg.telefonoWhatsapp,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

  console.log("Perfil Firestore users/" + userRecord.uid + " → encargado / " + cfg.areaSlug);
  return userRecord.uid;
}

async function main() {
  initAdmin();
  var auth = getAuth();
  var db = getFirestore();

  console.log("Proyecto:", PROJECT_ID);
  for (var i = 0; i < ENCARGADOS.length; i++) {
    await ensureUser(auth, db, ENCARGADOS[i]);
  }

  console.log("\nListo. Credenciales:");
  ENCARGADOS.forEach(function (c) {
    console.log("  " + c.email + " / " + c.password + "  (" + c.areaSlug + ")");
  });
}

main().catch(function (err) {
  console.error("Error:", err.message || err);
  console.error(
    "\nSi falla por permisos, creá los usuarios manualmente en Firebase Console\n" +
      "y asigná el rol en admin.html → Asignar rol a usuario.\n" +
      "Ver setup-firebase.md sección «Encargados del mapa de obras»."
  );
  process.exit(1);
});
