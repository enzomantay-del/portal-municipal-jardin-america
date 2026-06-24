export const PROJECT_ID = "portal-municipal-jardin";
export const DEFAULT_IMAGE = "/assets/logo-municipalidad.png";

function firestoreString(fields, key) {
  return fields && fields[key] && fields[key].stringValue ? fields[key].stringValue : "";
}

function parseTrabajo(doc) {
  if (!doc || !doc.fields) return null;
  if (firestoreString(doc.fields, "estadoPublicacion") !== "publicado") return null;
  const name = doc.name || "";
  const id = name.split("/").pop();
  return {
    id: id,
    titulo: firestoreString(doc.fields, "titulo"),
    bajada: firestoreString(doc.fields, "bajada"),
    imagen: firestoreString(doc.fields, "imagenUrl"),
    fechaPublicacion: firestoreString(doc.fields, "fechaPublicacion"),
  };
}

export async function loadFirebaseApiKey(origin) {
  const envKey = Deno.env.get("FIREBASE_API_KEY");
  if (envKey) return envKey;

  try {
    const res = await fetch(origin + "/js/firebase-config.js", {
      headers: { Accept: "text/javascript,*/*" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const keyMatch = text.match(/apiKey:\s*"([^"]+)"/);
    return keyMatch ? keyMatch[1] : null;
  } catch (_err) {
    return null;
  }
}

export async function fetchTrabajo(id, apiKey) {
  if (!apiKey || !id) return null;

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    PROJECT_ID +
    "/databases/(default)/documents/trabajos/" +
    encodeURIComponent(id) +
    "?key=" +
    encodeURIComponent(apiKey);

  const res = await fetch(url);
  if (!res.ok) return null;
  return parseTrabajo(await res.json());
}

export function ogImageProxyUrl(origin, noticiaId) {
  return origin + "/og-image?id=" + encodeURIComponent(noticiaId);
}

export function absoluteAssetUrl(origin, path) {
  if (!path) return origin + DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(path)) {
    return path.replace(/^http:\/\//i, "https://");
  }
  return origin + (path.startsWith("/") ? path : "/" + path);
}
