const DEFAULT_TO = "enzomantay@gmail.com";

const TIPO_LABELS = {
  basurero: "Basurero a cielo abierto",
  alcantarilla: "Alcantarilla tapada",
  arbol: "Árbol caído o riesgo vegetal",
  luminaria: "Luminaria / alumbrado",
  calle: "Calle, bache o vereda",
  contenedor: "Contenedor o recolección",
  otro: "Otro",
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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeText(value, maxLen) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLen);
}

function buildEmailHtml(payload) {
  var rows = [
    ["Tipo", payload.tipoLabel],
    ["Barrio", payload.barrioNombre || payload.barrioId || "—"],
    ["Ubicación", payload.ubicacion],
    ["Descripción", payload.descripcion],
    ["Nombre", payload.nombre],
    ["Teléfono", payload.telefono || "—"],
    ["Email", payload.email || "—"],
    ["Autoriza contacto", payload.consent ? "Sí" : "No"],
    ["Origen", payload.origen || "portal"],
    ["Fecha (AR)", new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Cordoba" })],
  ];

  var trs = rows
    .map(function (row) {
      return (
        "<tr><th style=\"text-align:left;padding:6px 10px;background:#f4f7fa;border:1px solid #dde3ea\">" +
        escapeHtml(row[0]) +
        "</th><td style=\"padding:6px 10px;border:1px solid #dde3ea\">" +
        escapeHtml(row[1]) +
        "</td></tr>"
      );
    })
    .join("");

  return (
    "<div style=\"font-family:Arial,sans-serif;color:#222\">" +
    "<h2 style=\"color:#0d7aa8;margin:0 0 12px\">Nuevo reporte de problema — Portal Municipal</h2>" +
    "<table style=\"border-collapse:collapse;width:100%;max-width:640px\">" +
    trs +
    "</table></div>"
  );
}

async function sendViaResend(to, payload) {
  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, skipped: true };

  var from = process.env.REPORTAR_PROBLEMA_FROM || "Portal Municipal <onboarding@resend.dev>";
  var subject = "[Portal Municipal] " + payload.tipoLabel + " — " + (payload.barrioNombre || "Jardín América");

  var res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from,
      to: [to],
      subject: subject,
      html: buildEmailHtml(payload),
      reply_to: payload.email || undefined,
    }),
  });

  if (!res.ok) {
    var errText = await res.text();
    throw new Error("Resend " + res.status + ": " + errText.slice(0, 200));
  }
  return { ok: true, provider: "resend" };
}

async function sendViaFormSubmit(to, payload) {
  var subject = "[Portal Municipal] " + payload.tipoLabel + " — " + (payload.barrioNombre || "Jardín América");
  var res = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: subject,
      _template: "table",
      _captcha: "false",
      Tipo: payload.tipoLabel,
      Barrio: payload.barrioNombre || payload.barrioId || "—",
      Ubicacion: payload.ubicacion,
      Descripcion: payload.descripcion,
      Nombre: payload.nombre,
      Telefono: payload.telefono || "—",
      Email: payload.email || "—",
      "Autoriza contacto": payload.consent ? "Sí" : "No",
      Origen: payload.origen || "portal",
    }),
  });

  var data = {};
  try {
    data = await res.json();
  } catch (_e) {
    data = {};
  }

  if (!res.ok || data.success === false) {
    throw new Error((data && data.message) || "No se pudo enviar el correo.");
  }
  return { ok: true, provider: "formsubmit" };
}

export default async function handler(req, context) {
  var origin = req.headers.get("origin") || "";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Método no permitido." }, corsHeaders(origin));
  }

  var body;
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse(400, { ok: false, error: "Datos inválidos." }, corsHeaders(origin));
  }

  var nombre = sanitizeText(body.nombre, 120);
  var tipo = sanitizeText(body.tipo, 40);
  var ubicacion = sanitizeText(body.ubicacion, 200);
  var descripcion = sanitizeText(body.descripcion, 1500);

  if (!nombre || nombre.length < 2) {
    return jsonResponse(400, { ok: false, error: "Nombre inválido." }, corsHeaders(origin));
  }
  if (!tipo || !TIPO_LABELS[tipo]) {
    return jsonResponse(400, { ok: false, error: "Tipo de problema inválido." }, corsHeaders(origin));
  }
  if (!ubicacion || ubicacion.length < 4) {
    return jsonResponse(400, { ok: false, error: "Ubicación inválida." }, corsHeaders(origin));
  }
  if (!descripcion || descripcion.length < 10) {
    return jsonResponse(400, { ok: false, error: "Descripción muy corta." }, corsHeaders(origin));
  }

  var payload = {
    nombre: nombre,
    telefono: sanitizeText(body.telefono, 30),
    email: sanitizeText(body.email, 120),
    tipo: tipo,
    tipoLabel: sanitizeText(body.tipoLabel, 80) || TIPO_LABELS[tipo],
    barrioId: sanitizeText(body.barrioId, 80),
    barrioNombre: sanitizeText(body.barrioNombre, 120),
    ubicacion: ubicacion,
    descripcion: descripcion,
    consent: !!body.consent,
    origen: sanitizeText(body.origen, 80) || "portal-municipal",
  };

  var to = process.env.REPORTAR_PROBLEMA_TO || DEFAULT_TO;

  try {
    var result = await sendViaResend(to, payload);
    if (!result.ok) {
      result = await sendViaFormSubmit(to, payload);
    }
    return jsonResponse(200, { ok: true, provider: result.provider }, corsHeaders(origin));
  } catch (err) {
    console.error("reportar-problema", err);
    return jsonResponse(
      502,
      { ok: false, error: "No se pudo enviar el reporte por correo. Intentá más tarde." },
      corsHeaders(origin)
    );
  }
}
