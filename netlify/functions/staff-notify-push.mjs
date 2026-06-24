import {
  hasFcmAdmin,
  listFcmTokensForUser,
  sendFcmMessage,
} from "../lib/fcm-admin.mjs";
import { assertStaffUser, verifyFirebaseIdToken } from "../lib/firebase-auth-verify.mjs";

function jsonResponse(status, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function sanitizeIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(function (id) {
      return String(id || "").trim();
    })
    .filter(function (id) {
      return id.length > 0 && id.length <= 128;
    })
    .slice(0, 50);
}

export default async function handler(req, context) {
  var origin = req.headers.get("origin") || "*";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Método no permitido." }, corsHeaders(origin));
  }

  if (!hasFcmAdmin()) {
    return jsonResponse(
      503,
      {
        ok: false,
        error: "Push no configurado: falta FIREBASE_SERVICE_ACCOUNT_JSON en Netlify.",
      },
      corsHeaders(origin)
    );
  }

  var authHeader = req.headers.get("authorization") || "";
  var idToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  var verified = await verifyFirebaseIdToken(idToken);
  if (!verified.ok) {
    return jsonResponse(401, { ok: false, error: verified.error }, corsHeaders(origin));
  }

  var staffCheck = await assertStaffUser(verified.uid);
  if (!staffCheck.ok) {
    return jsonResponse(403, { ok: false, error: staffCheck.error }, corsHeaders(origin));
  }

  var body;
  try {
    body = await req.json();
  } catch (_err) {
    return jsonResponse(400, { ok: false, error: "JSON inválido." }, corsHeaders(origin));
  }

  var recipientIds = sanitizeIds(body.recipientIds);
  if (!recipientIds.length) {
    return jsonResponse(400, { ok: false, error: "Sin destinatarios." }, corsHeaders(origin));
  }

  var title = String(body.title || "Nuevo aviso municipal").trim().slice(0, 120);
  var message = String(body.body || "").trim().slice(0, 500);
  var url = String(body.url || "/").trim().slice(0, 500);

  var enviados = 0;
  var fallidos = 0;
  var sinToken = 0;

  for (var i = 0; i < recipientIds.length; i++) {
    var userId = recipientIds[i];
    var tokens = await listFcmTokensForUser(userId);
    if (!tokens.length) {
      sinToken += 1;
      continue;
    }
    for (var j = 0; j < tokens.length; j++) {
      var result = await sendFcmMessage(tokens[j], {
        title: title,
        body: message,
        url: url,
        tag: "agenda-" + Date.now(),
      });
      if (result.ok) enviados += 1;
      else fallidos += 1;
    }
  }

  return jsonResponse(
    200,
    {
      ok: true,
      enviados: enviados,
      fallidos: fallidos,
      sinToken: sinToken,
    },
    corsHeaders(origin)
  );
}

export const config = {
  path: "/.netlify/functions/staff-notify-push",
};
