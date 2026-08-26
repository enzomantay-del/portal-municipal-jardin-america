import crypto from "node:crypto";
import {
  hasFirestoreAdmin,
  createDocument,
  uploadBytesToStorage,
} from "../lib/firestore-admin.mjs";

var ALLOWED_TIPOS = {
  "habilitacion-negocio": true,
  "evento-publico": true,
  "transporte-alimentos": true,
  "remis-taxi": true,
  "cambio-domicilio": true,
};

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

function sanitizeText(value, maxLen) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLen);
}

function sanitizeKey(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 60);
}

function yearNow() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" }).slice(0, 4);
}

function buildNumero() {
  var stamp = Date.now().toString(36).toUpperCase().slice(-5);
  var rnd = crypto.randomBytes(2).toString("hex").toUpperCase();
  return "BR-" + yearNow() + "-" + stamp + rnd;
}

function parseDataUrl(dataUrl) {
  var m = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { contentType: m[1], base64: m[2] };
}

export default async function handler(req) {
  var origin = req.headers.get("origin") || "";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Método no permitido." }, corsHeaders(origin));
  }

  if (!hasFirestoreAdmin()) {
    return jsonResponse(
      503,
      {
        ok: false,
        error:
          "El servidor no tiene configurada la cuenta de servicio de Firebase. Pedile al administrador que cargue FIREBASE_SERVICE_ACCOUNT_JSON en Netlify.",
      },
      corsHeaders(origin)
    );
  }

  var body;
  try {
    body = await req.json();
  } catch (_err) {
    return jsonResponse(400, { ok: false, error: "Pedido inválido." }, corsHeaders(origin));
  }

  var tipoId = sanitizeKey(body && body.tipoId);
  if (!ALLOWED_TIPOS[tipoId]) {
    return jsonResponse(400, { ok: false, error: "Tipo de trámite no válido." }, corsHeaders(origin));
  }

  var solicitante = {
    nombre: sanitizeText(body.solicitante && body.solicitante.nombre, 160),
    dni: sanitizeText(body.solicitante && body.solicitante.dni, 20),
    telefono: sanitizeText(body.solicitante && body.solicitante.telefono, 40),
    email: sanitizeText(body.solicitante && body.solicitante.email, 120),
  };

  if (solicitante.nombre.length < 3 || solicitante.dni.length < 6 || solicitante.telefono.length < 6) {
    return jsonResponse(
      400,
      { ok: false, error: "Completá nombre, DNI y teléfono del solicitante." },
      corsHeaders(origin)
    );
  }

  if (!body.declaracionJurada) {
    return jsonResponse(
      400,
      { ok: false, error: "Debés aceptar la declaración jurada para enviar la solicitud." },
      corsHeaders(origin)
    );
  }

  var valores = {};
  var rawValores = (body && body.valores) || {};
  Object.keys(rawValores).forEach(function (key) {
    var cleanKey = sanitizeKey(key);
    if (!cleanKey) return;
    valores[cleanKey] = sanitizeText(rawValores[key], 400);
  });

  var numero = buildNumero();
  var docId = crypto.randomBytes(12).toString("hex");
  var adjuntosIn = Array.isArray(body.adjuntos) ? body.adjuntos.slice(0, 12) : [];
  var adjuntos = [];

  for (var i = 0; i < adjuntosIn.length; i++) {
    var item = adjuntosIn[i] || {};
    var key = sanitizeKey(item.key);
    var nombre = sanitizeText(item.nombre, 160) || key || "archivo";
    var parsed = parseDataUrl(item.dataUrl);
    if (!key || !parsed) continue;
    if (parsed.base64.length > 5_500_000) {
      return jsonResponse(
        400,
        {
          ok: false,
          error:
            "El archivo «" +
            nombre +
            "» es demasiado pesado. Subí una foto más liviana o un PDF más chico (máximo 4 MB).",
        },
        corsHeaders(origin)
      );
    }
    try {
      var buffer = Buffer.from(parsed.base64, "base64");
      if (buffer.length > 4_000_000) {
        return jsonResponse(
          400,
          {
            ok: false,
            error: "El archivo «" + nombre + "» supera el tamaño permitido (máximo 4 MB).",
          },
          corsHeaders(origin)
        );
      }
      var ext = "bin";
      if (parsed.contentType.indexOf("jpeg") !== -1 || parsed.contentType.indexOf("jpg") !== -1) ext = "jpg";
      else if (parsed.contentType.indexOf("png") !== -1) ext = "png";
      else if (parsed.contentType.indexOf("webp") !== -1) ext = "webp";
      else if (parsed.contentType.indexOf("pdf") !== -1) ext = "pdf";

      var objectPath =
        "bromatologia-tramites/" + docId + "/" + key + "-" + Date.now() + "." + ext;
      var url = await uploadBytesToStorage(objectPath, buffer, parsed.contentType);
      adjuntos.push({
        key: key,
        nombre: nombre,
        contentType: parsed.contentType,
        url: url,
        size: buffer.length,
      });
    } catch (upErr) {
      console.error("bromo upload", upErr);
      return jsonResponse(
        502,
        {
          ok: false,
          error:
            "No se pudo guardar el archivo «" +
            nombre +
            "». Probá de nuevo o con un archivo más liviano.",
        },
        corsHeaders(origin)
      );
    }
  }

  var nowIso = new Date().toISOString();
  var payload = {
    numero: numero,
    tipoId: tipoId,
    titulo: sanitizeText(body.titulo, 160) || tipoId,
    areaSlug: "bromatologia",
    estado: "recibida",
    solicitante: solicitante,
    valores: valores,
    adjuntos: adjuntos,
    declaracionJurada: true,
    notasInternas: "",
    createdAt: nowIso,
    updatedAt: nowIso,
    origen: "portal-web",
  };

  try {
    await createDocument("bromatologia_tramites", docId, payload);
  } catch (err) {
    console.error("bromo create", err);
    return jsonResponse(
      502,
      { ok: false, error: "No se pudo guardar la solicitud. Intentá más tarde." },
      corsHeaders(origin)
    );
  }

  return jsonResponse(
    200,
    {
      ok: true,
      id: docId,
      numero: numero,
      createdAt: nowIso,
    },
    corsHeaders(origin)
  );
}
