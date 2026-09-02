/**
 * Borra historias de prensa vencidas (Firestore + Storage).
 * Corre a diario (UTC). También se puede purgar al abrir el panel admin.
 */
import {
  hasFirestoreAdmin,
  runCollectionQuery,
  parseFirestoreDocument,
  deleteDocument,
  deleteStorageObject,
} from "../lib/firestore-admin.mjs";

export const config = {
  schedule: "15 6 * * *", // ~03:15 Argentina (UTC-3)
};

function docIdFromName(name) {
  if (!name) return "";
  var parts = String(name).split("/");
  return parts[parts.length - 1] || "";
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "string") {
    var t = Date.parse(value);
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof value === "object" && value.seconds != null) {
    return Number(value.seconds) * 1000;
  }
  return 0;
}

export default async function handler(req) {
  if (!hasFirestoreAdmin()) {
    console.warn("purge-prensa-historias: sin FIREBASE_SERVICE_ACCOUNT_JSON");
    return;
  }

  var nowIso = new Date().toISOString();
  var rows = await runCollectionQuery({
    from: [{ collectionId: "prensa_historias" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "expiresAt" },
        op: "LESS_THAN",
        value: { timestampValue: nowIso },
      },
    },
    limit: 100,
  });

  var purged = 0;
  for (var i = 0; i < (rows || []).length; i++) {
    var row = rows[i];
    if (!row || !row.document) continue;
    var id = docIdFromName(row.document.name);
    var data = parseFirestoreDocument(row.document) || {};
    if (!id) continue;
    if (toMillis(data.expiresAt) > Date.now()) continue;

    try {
      if (data.storagePath) {
        await deleteStorageObject(data.storagePath);
      }
      if (data.posterStoragePath) {
        await deleteStorageObject(data.posterStoragePath);
      }
      await deleteDocument("prensa_historias", id);
      purged += 1;
    } catch (err) {
      console.warn("purge-prensa-historias fail", id, err && err.message ? err.message : err);
    }
  }

  console.log("purge-prensa-historias: eliminadas " + purged);
  try {
    if (req && req.json) await req.json();
  } catch (_e) {
    /* scheduled body opcional */
  }
}
