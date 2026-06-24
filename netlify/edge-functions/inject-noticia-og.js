import {
  DEFAULT_IMAGE,
  fetchTrabajo,
  loadFirebaseApiKey,
  ogImageProxyUrl,
} from "../lib/muni-firestore.js";

const SITE_NAME = "Municipalidad de Jardín América";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeMetaContent(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function imageMimeType(url) {
  if (/\.png(\?|$)/i.test(url)) return "image/png";
  if (/\.webp(\?|$)/i.test(url)) return "image/webp";
  return "image/jpeg";
}

function buildMetaBlock(noticia, pageUrl, origin) {
  const title = noticia.titulo || "Novedad municipal";
  const desc =
    noticia.bajada || "Novedad de gestión de la Municipalidad de Jardín América.";
  const image = noticia.imagen
    ? ogImageProxyUrl(origin, noticia.id)
    : origin + DEFAULT_IMAGE;
  const imageType = imageMimeType(image);
  const fullTitle = escapeHtml(title) + " | " + SITE_NAME;
  const updated =
    noticia.fechaPublicacion && /^\d{4}-\d{2}-\d{2}/.test(noticia.fechaPublicacion)
      ? noticia.fechaPublicacion.slice(0, 10) + "T12:00:00-03:00"
      : "";

  let block =
    "<title>" +
    fullTitle +
    "</title>\n" +
    '<link rel="canonical" href="' +
    escapeHtml(pageUrl) +
    '">\n' +
    '<meta name="description" content="' +
    escapeHtml(desc) +
    '">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:site_name" content="' +
    SITE_NAME +
    '">\n' +
    '<meta property="og:locale" content="es_AR">\n' +
    '<meta property="og:title" content="' +
    escapeHtml(title) +
    '">\n' +
    '<meta property="og:description" content="' +
    escapeHtml(desc) +
    '">\n' +
    '<meta property="og:url" content="' +
    escapeHtml(pageUrl) +
    '">\n' +
    '<meta property="og:image" content="' +
    escapeMetaContent(image) +
    '">\n' +
    '<meta property="og:image:secure_url" content="' +
    escapeMetaContent(image) +
    '">\n' +
    '<meta property="og:image:type" content="' +
    imageType +
    '">\n' +
    '<meta property="og:image:alt" content="' +
    escapeHtml(title) +
    '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' +
    escapeHtml(title) +
    '">\n' +
    '<meta name="twitter:description" content="' +
    escapeHtml(desc) +
    '">\n' +
    '<meta name="twitter:image" content="' +
    escapeMetaContent(image) +
    '">';

  if (updated) {
    block +=
      '\n<meta property="article:published_time" content="' +
      escapeHtml(updated) +
      '">\n' +
      '<meta property="og:updated_time" content="' +
      escapeHtml(updated) +
      '">';
  }

  return block;
}

function injectMeta(html, metaBlock) {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, "");
  out = out.replace(/<meta\s+name="description"[^>]*>/gi, "");
  out = out.replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "");
  out = out.replace(/<meta\s+property="article:[^"]+"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, "");
  out = out.replace(/<link\s+rel="canonical"[^>]*>/gi, "");
  return out.replace("</head>", metaBlock + "\n</head>");
}

function requestWithoutRange(request) {
  if (!request.headers.has("range") && !request.headers.has("Range")) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.delete("range");
  headers.delete("Range");
  headers.delete("if-range");
  headers.delete("If-Range");

  return new Request(request.url, {
    method: request.method,
    headers: headers,
  });
}

function isHtmlResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}

export default async (request, context) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return context.next();

  const response = await context.next(requestWithoutRange(request));

  if (response.status !== 200 && response.status !== 206) return response;
  if (!isHtmlResponse(response)) return response;

  const apiKey = await loadFirebaseApiKey(url.origin);
  const noticia = await fetchTrabajo(id, apiKey);
  if (!noticia) return response;

  const html = await response.text();
  if (!html || html.indexOf("</head>") === -1) return response;

  const pageUrl = url.origin + url.pathname + "?id=" + encodeURIComponent(id);
  const injected = injectMeta(html, buildMetaBlock(noticia, pageUrl, url.origin));
  const headers = new Headers(response.headers);

  headers.set("Content-Type", "text/html; charset=UTF-8");
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.delete("content-range");
  headers.delete("Content-Range");
  headers.delete("accept-ranges");
  headers.delete("Accept-Ranges");

  return new Response(injected, {
    status: 200,
    headers: headers,
  });
};
