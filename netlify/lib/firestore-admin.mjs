import crypto from "node:crypto";
import { PROJECT_ID } from "./muni-firestore.js";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function getServiceAccount() {
  var raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

  var tokenCache = { value: null, expiresAt: 0, scopeKey: "" };

export function hasFirestoreAdmin() {
  return !!getServiceAccount();
}

async function getAccessTokenForScope(scope) {
  var scopeKey = scope || "https://www.googleapis.com/auth/datastore";
  if (tokenCache.value && tokenCache.scopeKey === scopeKey && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.value;
  }

  var sa = getServiceAccount();
  if (!sa || !sa.client_email || !sa.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no configurado en Netlify.");
  }

  var now = Math.floor(Date.now() / 1000);
  var header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  var payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: scopeKey,
    })
  );
  var signInput = header + "." + payload;
  var signature = crypto.createSign("RSA-SHA256").update(signInput).sign(sa.private_key, "base64url");
  var jwt = signInput + "." + signature;

  var res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    var errText = await res.text();
    throw new Error("OAuth token " + res.status + ": " + errText.slice(0, 200));
  }

  var data = await res.json();
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
    scopeKey: scopeKey,
  };
  return data.access_token;
}

export async function getAccessToken() {
  return getAccessTokenForScope("https://www.googleapis.com/auth/datastore");
}

export function getStorageBucket() {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.STORAGE_BUCKET ||
    PROJECT_ID + ".appspot.com"
  );
}

/** Sube bytes (Buffer) a Firebase Storage y devuelve URL de descarga con token. */
export async function uploadBytesToStorage(objectPath, buffer, contentType) {
  var bucket = getStorageBucket();
  var token = await getAccessTokenForScope(
    "https://www.googleapis.com/auth/devstorage.read_write https://www.googleapis.com/auth/cloud-platform"
  );
  var downloadToken = crypto.randomBytes(16).toString("hex");
  var uploadUrl =
    "https://storage.googleapis.com/upload/storage/v1/b/" +
    encodeURIComponent(bucket) +
    "/o?uploadType=media&name=" +
    encodeURIComponent(objectPath);

  var res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": contentType || "application/octet-stream",
    },
    body: buffer,
  });

  if (!res.ok) {
    var errText = await res.text();
    throw new Error("Storage upload " + res.status + ": " + errText.slice(0, 220));
  }

  var patchUrl =
    "https://storage.googleapis.com/storage/v1/b/" +
    encodeURIComponent(bucket) +
    "/o/" +
    encodeURIComponent(objectPath) +
    "?fields=name,metadata";

  await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    }),
  });

  return (
    "https://firebasestorage.googleapis.com/v0/b/" +
    encodeURIComponent(bucket) +
    "/o/" +
    encodeURIComponent(objectPath) +
    "?alt=media&token=" +
    encodeURIComponent(downloadToken)
  );
}

function docPath(collection, docId) {
  return "projects/" + PROJECT_ID + "/databases/(default)/documents/" + collection + "/" + docId;
}

export async function getDocument(collection, docId) {
  var token = await getAccessToken();
  var url =
    "https://firestore.googleapis.com/v1/" + docPath(collection, encodeURIComponent(docId));

  var res = await fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error("Firestore get " + res.status);
  }
  return res.json();
}

export async function commitWrites(writes) {
  var token = await getAccessToken();
  var res = await fetch(
    "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents:commit",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ writes: writes }),
    }
  );

  if (!res.ok) {
    var errText = await res.text();
    throw new Error("Firestore commit " + res.status + ": " + errText.slice(0, 300));
  }
  return res.json();
}

export function hashFingerprint(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 32);
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(function (item) {
          return toFirestoreValue(item);
        }),
      },
    };
  }
  if (typeof value === "object") {
    var fields = {};
    Object.keys(value).forEach(function (key) {
      if (value[key] !== undefined) {
        fields[key] = toFirestoreValue(value[key]);
      }
    });
    return { mapValue: { fields: fields } };
  }
  return { stringValue: String(value) };
}

export function toFirestoreFields(obj) {
  var fields = {};
  Object.keys(obj || {}).forEach(function (key) {
    if (obj[key] !== undefined) {
      fields[key] = toFirestoreValue(obj[key]);
    }
  });
  return fields;
}

export async function createDocument(collection, docId, data) {
  var id = docId || crypto.randomBytes(12).toString("hex");
  await commitWrites([
    {
      update: {
        name: docPath(collection, id),
        fields: toFirestoreFields(data),
      },
      currentDocument: { exists: false },
    },
  ]);
  return id;
}

export async function documentExists(collection, docId) {
  return !!(await getDocument(collection, docId));
}

function parseFirestoreValue(value) {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return parseInt(value.integerValue, 10);
  if ("doubleValue" in value) return value.doubleValue;
  if ("nullValue" in value) return null;
  if (value.mapValue && value.mapValue.fields) {
    return parseFirestoreFields(value.mapValue.fields);
  }
  if (value.arrayValue && value.arrayValue.values) {
    return value.arrayValue.values.map(parseFirestoreValue);
  }
  return null;
}

export function parseFirestoreFields(fields) {
  var out = {};
  Object.keys(fields || {}).forEach(function (key) {
    out[key] = parseFirestoreValue(fields[key]);
  });
  return out;
}

export function parseFirestoreDocument(raw) {
  if (!raw || !raw.fields) return null;
  return parseFirestoreFields(raw.fields);
}

export async function deleteDocument(collection, docId) {
  await commitWrites([
    {
      delete: docPath(collection, docId),
    },
  ]);
}

export async function incrementTrabajoField(trabajoId, fieldPath) {
  return commitWrites([
    {
      transform: {
        document: docPath("trabajos", trabajoId),
        fieldTransforms: [
          {
            fieldPath: fieldPath,
            increment: { integerValue: "1" },
          },
        ],
      },
    },
  ]);
}

export async function recordView(trabajoId, fingerprint) {
  var fp = hashFingerprint(fingerprint);
  var today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  var markerId = "view_" + trabajoId + "_" + fp + "_" + today;

  if (await getDocument("engagement_fingerprints", markerId)) {
    return { recorded: false, reason: "already_viewed" };
  }

  await commitWrites([
    {
      update: {
        name: docPath("engagement_fingerprints", markerId),
        fields: {
          tipo: { stringValue: "view" },
          trabajoId: { stringValue: trabajoId },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      },
      currentDocument: { exists: false },
    },
    {
      transform: {
        document: docPath("trabajos", trabajoId),
        fieldTransforms: [{ fieldPath: "viewsCount", increment: { integerValue: "1" } }],
      },
    },
  ]);

  return { recorded: true };
}

export async function recordLike(trabajoId, fingerprint) {
  var fp = hashFingerprint(fingerprint);
  var markerId = "like_" + trabajoId + "_" + fp;

  if (await getDocument("engagement_fingerprints", markerId)) {
    return { recorded: false, reason: "already_liked" };
  }

  await commitWrites([
    {
      update: {
        name: docPath("engagement_fingerprints", markerId),
        fields: {
          tipo: { stringValue: "like" },
          trabajoId: { stringValue: trabajoId },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      },
      currentDocument: { exists: false },
    },
    {
      transform: {
        document: docPath("trabajos", trabajoId),
        fieldTransforms: [{ fieldPath: "likesCount", increment: { integerValue: "1" } }],
      },
    },
  ]);

  return { recorded: true };
}
