import { getDocument } from "./fcm-admin.mjs";

function getApiKey() {
  return process.env.FIREBASE_API_KEY || "";
}

export async function verifyFirebaseIdToken(idToken) {
  if (!idToken) return { ok: false, error: "Token ausente." };

  var apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: "FIREBASE_API_KEY no configurada en Netlify." };

  var res = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: idToken }),
    }
  );

  var data = await res.json();
  if (!res.ok || !data.users || !data.users.length) {
    return { ok: false, error: (data && data.error && data.error.message) || "Token inválido." };
  }

  var user = data.users[0];
  return {
    ok: true,
    uid: user.localId,
    email: user.email || "",
  };
}

export async function assertStaffUser(uid) {
  var doc = await getDocument("users", uid);
  if (!doc || !doc.fields) return { ok: false, error: "Usuario no encontrado." };

  var role = doc.fields.role && doc.fields.role.stringValue;
  if (role !== "admin" && role !== "encargado") {
    return { ok: false, error: "Solo staff municipal puede enviar avisos push." };
  }
  return { ok: true, role: role };
}
