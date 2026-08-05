/**
 * AmiBot + Gemini: responde solo con el contexto municipal enviado por el cliente.
 * Requiere GEMINI_API_KEY en Netlify (Site settings → Environment variables).
 */

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

/** Limpia comillas/espacios que a veces quedan al pegar la clave en Netlify. */
function sanitizeApiKey(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
}

function isInvalidApiKeyError(message) {
  var msg = String(message || "").toLowerCase();
  return (
    msg.indexOf("api key not valid") !== -1 ||
    msg.indexOf("api_key_invalid") !== -1 ||
    msg.indexOf("invalid api key") !== -1 ||
    msg.indexOf("api key expired") !== -1 ||
    (msg.indexOf("permission denied") !== -1 && msg.indexOf("api key") !== -1)
  );
}

function sanitizeUrl(value) {
  var url = sanitizeText(value, 300);
  if (!url) return "";
  if (/^(https?:\/\/|\/|mailto:|tel:)/i.test(url)) return url;
  return "";
}

function normalizeContext(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 14).map(function (item) {
    item = item || {};
    var enlaces = Array.isArray(item.enlaces) ? item.enlaces : [];
    return {
      id: sanitizeText(item.id, 80),
      titulo: sanitizeText(item.titulo, 180),
      categoria: sanitizeText(item.categoria, 40),
      resumen: sanitizeText(item.resumen, 320),
      texto: sanitizeText(item.texto, 1100),
      enlaces: enlaces.slice(0, 4).map(function (link) {
        link = link || {};
        return {
          titulo: sanitizeText(link.titulo, 120),
          url: sanitizeUrl(link.url),
        };
      }).filter(function (link) {
        return link.titulo && link.url;
      }),
    };
  }).filter(function (item) {
    return item.titulo || item.texto || item.resumen;
  });
}

function buildContextBlock(context) {
  if (!context.length) {
    return "(Sin fichas municipales disponibles en esta consulta.)";
  }
  return context
    .map(function (item, index) {
      var lines = [
        "### Ficha " + (index + 1) + " [" + (item.id || "sin-id") + "]",
        "Título: " + (item.titulo || "—"),
        "Categoría: " + (item.categoria || "—"),
      ];
      if (item.resumen) lines.push("Resumen: " + item.resumen);
      if (item.texto) lines.push("Detalle: " + item.texto);
      if (item.enlaces && item.enlaces.length) {
        lines.push(
          "Enlaces: " +
            item.enlaces
              .map(function (l) {
                return l.titulo + " → " + l.url;
              })
              .join(" | ")
        );
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

function extractAnswerText(data) {
  try {
    var parts = (((data || {}).candidates || [])[0] || {}).content || {};
    var texts = (parts.parts || [])
      .map(function (p) {
        return p && p.text ? String(p.text) : "";
      })
      .filter(Boolean);
    return texts.join("\n").trim();
  } catch (_err) {
    return "";
  }
}

function collectSugerencias(context) {
  var out = [];
  var seen = {};
  context.forEach(function (item) {
    (item.enlaces || []).forEach(function (link) {
      if (!link.url || seen[link.url]) return;
      seen[link.url] = true;
      out.push({ titulo: link.titulo, url: link.url });
    });
  });
  return out.slice(0, 5);
}

async function callGemini(apiKey, model, prompt) {
  var url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  var res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              "Sos AmiBot, el asistente virtual del portal de la Municipalidad de Jardín América (Misiones, Argentina). " +
              "Respondé siempre en español rioplatense, claro y breve (máximo 180 palabras). " +
              "Usá SOLO la información del CONTEXTO MUNICIPAL. No inventes trámites, horarios, costos, direcciones ni fechas. " +
              "Si el dato no está en el contexto, decí que no lo tenés confirmado y sugerí contactar Mesa de entrada por WhatsApp al 3743-509860 " +
              "o usar los enlaces del portal. Podés mencionar enlaces del contexto con su nombre. No uses markdown complejo ni tablas; párrafos cortos.",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 700,
      },
    }),
  });

  var raw = await res.text();
  var data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (_err) {
    data = null;
  }

  if (!res.ok) {
    var msg =
      (data && data.error && data.error.message) ||
      ("Gemini HTTP " + res.status + ": " + String(raw || "").slice(0, 180));
    var err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  var answer = extractAnswerText(data);
  if (!answer) {
    throw new Error("Gemini no devolvió texto útil.");
  }
  return answer;
}

export default async function handler(req) {
  var origin = req.headers.get("origin") || "";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Método no permitido." }, corsHeaders(origin));
  }

  // Solo GEMINI_API_KEY (no usar FIREBASE_API_KEY / GOOGLE_API_KEY: son otras claves).
  var apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY || "");
  if (!apiKey) {
    return jsonResponse(
      503,
      {
        ok: false,
        unavailable: true,
        error:
          "AmiBot con IA todavía no está configurado. Cargá GEMINI_API_KEY en Netlify (clave de Google AI Studio) y volvé a publicar el sitio.",
      },
      corsHeaders(origin)
    );
  }

  if (apiKey.length < 20 || apiKey.indexOf("AIza") !== 0) {
    return jsonResponse(
      503,
      {
        ok: false,
        unavailable: true,
        error:
          "La clave GEMINI_API_KEY no parece válida. Tiene que ser una API key de Google AI Studio (suele empezar con AIza…). No uses la clave de Firebase.",
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

  var question = sanitizeText(body && body.question, 400);
  if (question.length < 3) {
    return jsonResponse(
      400,
      { ok: false, error: "Escribí una pregunta un poco más completa." },
      corsHeaders(origin)
    );
  }

  var context = normalizeContext(body && body.context);
  var prompt =
    "Pregunta del vecino:\n" +
    question +
    "\n\nCONTEXTO MUNICIPAL (fichas del portal):\n" +
    buildContextBlock(context);

  var preferred = sanitizeText(process.env.GEMINI_MODEL, 80) || "gemini-2.5-flash";
  var models = [preferred, "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];
  var tried = {};
  var lastError = null;

  for (var i = 0; i < models.length; i++) {
    var model = models[i];
    if (!model || tried[model]) continue;
    tried[model] = true;
    try {
      var answer = await callGemini(apiKey, model, prompt);
      return jsonResponse(
        200,
        {
          ok: true,
          answer: answer,
          model: model,
          sugerencias: collectSugerencias(context),
        },
        corsHeaders(origin)
      );
    } catch (err) {
      lastError = err;
      console.warn("amibot-gemini model fail", model, err && err.message);
      // Si el modelo no existe / fue deprecado, probar el siguiente.
      if (err && (err.status === 404 || err.status === 400)) continue;
      break;
    }
  }

  var failMsg =
    (lastError && lastError.message) ||
    "No se pudo consultar Gemini. Probá de nuevo en unos minutos.";

  if (isInvalidApiKeyError(failMsg)) {
    return jsonResponse(
      401,
      {
        ok: false,
        unavailable: true,
        error:
          "Google rechazó la API key. En Netlify cargá una clave nueva de https://aistudio.google.com/apikey como GEMINI_API_KEY (sin comillas), scopes Production, y hacé Redeploy. No uses la clave de Firebase.",
      },
      corsHeaders(origin)
    );
  }

  return jsonResponse(
    502,
    {
      ok: false,
      error: failMsg,
    },
    corsHeaders(origin)
  );
}
