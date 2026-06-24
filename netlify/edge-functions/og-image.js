import {
  DEFAULT_IMAGE,
  absoluteAssetUrl,
  fetchTrabajo,
  loadFirebaseApiKey,
} from "../lib/muni-firestore.js";

const WHATSAPP_MAX_BYTES = 300000;

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

async function serveAsset(origin, path) {
  const assetUrl = absoluteAssetUrl(origin, path);
  const res = await fetch(assetUrl, { headers: { Accept: "image/*" } });
  if (!res.ok) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", res.headers.get("content-type") || "image/png");
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Access-Control-Allow-Origin", "*");

  return new Response(await res.arrayBuffer(), { status: 200, headers: headers });
}

export default async (request, context) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return serveAsset(url.origin, DEFAULT_IMAGE);

  const apiKey = await loadFirebaseApiKey(url.origin);
  const noticia = await fetchTrabajo(id, apiKey);
  if (!noticia || !noticia.imagen) {
    return serveAsset(url.origin, DEFAULT_IMAGE);
  }

  const imageUrl = noticia.imagen.replace(/^http:\/\//i, "https://");
  const imageRes = await fetch(requestWithoutRange(new Request(imageUrl)));

  if (!imageRes.ok) {
    return serveAsset(url.origin, DEFAULT_IMAGE);
  }

  const bytes = new Uint8Array(await imageRes.arrayBuffer());
  if (bytes.byteLength > WHATSAPP_MAX_BYTES) {
    return serveAsset(url.origin, DEFAULT_IMAGE);
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    imageRes.headers.get("content-type") || "image/jpeg",
  );
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.delete("content-range");
  headers.delete("Content-Range");
  headers.delete("accept-ranges");
  headers.delete("Accept-Ranges");

  return new Response(bytes, { status: 200, headers: headers });
};
