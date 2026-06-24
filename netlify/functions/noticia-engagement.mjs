import { loadFirebaseApiKey, fetchTrabajo } from "../lib/muni-firestore.js";
import { hasFirestoreAdmin, recordLike, recordView } from "../lib/firestore-admin.mjs";

function jsonResponse(status, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function sanitizeId(value) {
  return String(value || "")
    .trim()
    .replace(/[^\w-]/g, "")
    .slice(0, 128);
}

function sanitizeFingerprint(value) {
  return String(value || "")
    .trim()
    .slice(0, 80);
}

export default async function handler(req) {
  var origin = req.headers.get("origin") || "";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Método no permitido" }, corsHeaders(origin));
  }

  if (!hasFirestoreAdmin()) {
    return jsonResponse(
      503,
      {
        ok: false,
        error: "Engagement no configurado. Agregá FIREBASE_SERVICE_ACCOUNT_JSON en Netlify.",
      },
      corsHeaders(origin)
    );
  }

  var payload = {};
  try {
    payload = await req.json();
  } catch (_err) {
    return jsonResponse(400, { ok: false, error: "JSON inválido" }, corsHeaders(origin));
  }

  var action = String(payload.action || "").trim();
  var trabajoId = sanitizeId(payload.id);
  var fingerprint = sanitizeFingerprint(payload.fingerprint);

  if (!trabajoId || !fingerprint) {
    return jsonResponse(400, { ok: false, error: "Faltan id o fingerprint" }, corsHeaders(origin));
  }

  if (action !== "view" && action !== "like") {
    return jsonResponse(400, { ok: false, error: "Acción inválida" }, corsHeaders(origin));
  }

  var siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://portal-municipal-jardin.netlify.app";
  var apiKey = await loadFirebaseApiKey(siteUrl);
  var trabajo = await fetchTrabajo(trabajoId, apiKey);

  if (!trabajo) {
    return jsonResponse(404, { ok: false, error: "Novedad no encontrada o no publicada" }, corsHeaders(origin));
  }

  try {
    var result = action === "view" ? await recordView(trabajoId, fingerprint) : await recordLike(trabajoId, fingerprint);

    return jsonResponse(
      200,
      {
        ok: true,
        action: action,
        recorded: result.recorded,
        reason: result.reason || null,
      },
      corsHeaders(origin)
    );
  } catch (err) {
    console.error("noticia-engagement", err);
    return jsonResponse(
      500,
      { ok: false, error: err.message || "Error al registrar interacción" },
      corsHeaders(origin)
    );
  }
}
