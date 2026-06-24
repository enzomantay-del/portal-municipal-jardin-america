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

var tokenCache = { value: null, expiresAt: 0, scope: "" };

export function hasFcmAdmin() {
  return !!getServiceAccount();
}

export async function getGoogleAccessToken(scope) {
  scope = scope || "https://www.googleapis.com/auth/cloud-platform";
  if (tokenCache.value && tokenCache.scope === scope && Date.now() < tokenCache.expiresAt - 60000) {
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
      scope: scope,
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
    scope: scope,
  };
  return data.access_token;
}

function docPath(collection, docId) {
  return "projects/" + PROJECT_ID + "/databases/(default)/documents/" + collection + "/" + docId;
}

function parseStringField(fields, name) {
  if (!fields || !fields[name] || fields[name].stringValue == null) return "";
  return String(fields[name].stringValue);
}

export async function getDocument(collection, docId) {
  var token = await getGoogleAccessToken();
  var url = "https://firestore.googleapis.com/v1/" + docPath(collection, encodeURIComponent(docId));

  var res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  if (res.status === 404) return null;
  if (!res.ok) {
    var errText = await res.text();
    throw new Error("Firestore get " + res.status + ": " + errText.slice(0, 200));
  }
  return res.json();
}

export async function listFcmTokensForUser(userId) {
  var token = await getGoogleAccessToken();
  var parent =
    "projects/" +
    PROJECT_ID +
    "/databases/(default)/documents/users/" +
    encodeURIComponent(userId) +
    "/fcm_tokens";
  var url = "https://firestore.googleapis.com/v1/" + parent;

  var res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  if (res.status === 404) return [];
  if (!res.ok) {
    var errText = await res.text();
    throw new Error("Firestore list tokens " + res.status + ": " + errText.slice(0, 200));
  }

  var data = await res.json();
  var tokens = [];
  (data.documents || []).forEach(function (doc) {
    var fcm = parseStringField(doc.fields, "token");
    if (fcm) tokens.push(fcm);
  });
  return tokens;
}

export async function sendFcmMessage(deviceToken, payload) {
  var accessToken = await getGoogleAccessToken();
  var url =
    "https://fcm.googleapis.com/v1/projects/" + encodeURIComponent(PROJECT_ID) + "/messages:send";

  var message = {
    token: deviceToken,
    notification: {
      title: String(payload.title || "Portal municipal").slice(0, 120),
      body: String(payload.body || "").slice(0, 500),
    },
    data: {
      title: String(payload.title || "").slice(0, 120),
      body: String(payload.body || "").slice(0, 500),
      url: String(payload.url || "/").slice(0, 500),
      tag: String(payload.tag || "muni-staff").slice(0, 64),
    },
    webpush: {
      fcm_options: {
        link: String(payload.url || "/").slice(0, 500),
      },
    },
  };

  var res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message }),
  });

  if (!res.ok) {
    var errText = await res.text();
    return { ok: false, error: errText.slice(0, 300) };
  }
  return { ok: true };
}
