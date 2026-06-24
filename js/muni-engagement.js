(function () {
  "use strict";

  function getFingerprint() {
    var key = "muni_engagement_fp";
    try {
      var fp = localStorage.getItem(key);
      if (fp) return fp;
      fp =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "fp_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, fp);
      return fp;
    } catch (_err) {
      return "fp_anon";
    }
  }

  function hashFingerprintFallback(value) {
    var str = String(value || "");
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8) + str.length;
  }

  async function hashFingerprint(value) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      try {
        var buf = await window.crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(String(value || ""))
        );
        return Array.from(new Uint8Array(buf))
          .map(function (b) {
            return b.toString(16).padStart(2, "0");
          })
          .join("")
          .slice(0, 32);
      } catch (_err) {
        /* fallback below */
      }
    }
    return hashFingerprintFallback(value);
  }

  function firebaseConfig() {
    return window.FIREBASE_CONFIG || null;
  }

  function firestoreDocUrl(collection, docId) {
    var cfg = firebaseConfig();
    if (!cfg || !cfg.projectId) return null;
    return (
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(cfg.projectId) +
      "/databases/(default)/documents/" +
      encodeURIComponent(collection) +
      "/" +
      encodeURIComponent(docId)
    );
  }

  function firestoreHeaders() {
    var cfg = firebaseConfig();
    return {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": cfg && cfg.apiKey ? cfg.apiKey : "",
    };
  }

  function parseFirestoreIntField(fields, name) {
    if (!fields || !fields[name]) return 0;
    var value = fields[name];
    if (value.integerValue != null) return Number(value.integerValue) || 0;
    if (value.doubleValue != null) return Number(value.doubleValue) || 0;
    return 0;
  }

  async function restGetEngagement(trabajoId) {
    var url = firestoreDocUrl("trabajo_engagement", trabajoId);
    if (!url) return { exists: false, likes: 0, views: 0 };

    var res = await fetch(url, { headers: firestoreHeaders() });
    if (res.status === 404) {
      return { exists: false, likes: 0, views: 0 };
    }
    if (!res.ok) {
      throw new Error("No se pudo leer contadores (" + res.status + ").");
    }

    var doc = await res.json();
    return {
      exists: true,
      likes: parseFirestoreIntField(doc.fields, "likesCount"),
      views: parseFirestoreIntField(doc.fields, "viewsCount"),
    };
  }

  async function restCreateFingerprint(markerId, tipo, trabajoId) {
    var url = firestoreDocUrl("engagement_fingerprints", markerId);
    if (!url) throw new Error("Firebase no configurado.");

    var res = await fetch(url + "?currentDocument.exists=false", {
      method: "PATCH",
      headers: firestoreHeaders(),
      body: JSON.stringify({
        fields: {
          tipo: { stringValue: tipo },
          trabajoId: { stringValue: trabajoId },
        },
      }),
    });

    if (res.ok) return { created: true };

    var body = "";
    try {
      body = await res.text();
    } catch (_err) {
      /* ignore */
    }

    if (res.status === 409 || body.indexOf("ALREADY_EXISTS") !== -1) {
      return { created: false, reason: "already_" + tipo };
    }
    if (res.status === 403 || body.indexOf("PERMISSION_DENIED") !== -1) {
      throw { code: "permission-denied", message: "Permiso denegado al registrar huella." };
    }
    throw new Error("No se pudo registrar la huella (" + res.status + ").");
  }

  async function restWriteEngagement(trabajoId, likes, views, exists) {
    var url = firestoreDocUrl("trabajo_engagement", trabajoId);
    if (!url) throw new Error("Firebase no configurado.");

    var payload = {
      fields: {
        likesCount: { integerValue: String(likes) },
        viewsCount: { integerValue: String(views) },
      },
    };

    var requestUrl = url;
    if (exists) {
      requestUrl +=
        "?updateMask.fieldPaths=likesCount&updateMask.fieldPaths=viewsCount&currentDocument.exists=true";
    } else {
      requestUrl += "?currentDocument.exists=false";
    }

    var res = await fetch(requestUrl, {
      method: "PATCH",
      headers: firestoreHeaders(),
      body: JSON.stringify(payload),
    });

    if (res.ok) return;

    var body = "";
    try {
      body = await res.text();
    } catch (_err) {
      /* ignore */
    }

    if (res.status === 403 || body.indexOf("PERMISSION_DENIED") !== -1) {
      throw { code: "permission-denied", message: "Permiso denegado al guardar contadores." };
    }
    throw new Error("No se pudo guardar contadores (" + res.status + ").");
  }

  function hasLikedLocal(trabajoId) {
    try {
      return localStorage.getItem("muni_like_" + trabajoId) === "1";
    } catch (_err) {
      return false;
    }
  }

  function markLikedLocal(trabajoId) {
    try {
      localStorage.setItem("muni_like_" + trabajoId, "1");
    } catch (_err) {
      /* ignore */
    }
  }

  function hasViewedSession(trabajoId) {
    try {
      return sessionStorage.getItem("muni_view_" + trabajoId) === "1";
    } catch (_err) {
      return false;
    }
  }

  function markViewedSession(trabajoId) {
    try {
      sessionStorage.setItem("muni_view_" + trabajoId, "1");
    } catch (_err) {
      /* ignore */
    }
  }

  function bumpNoticiaCount(trabajoId, field) {
    var M = window.MuniPortal;
    if (!M || !M.DATA || !M.DATA.noticias) return;
    M.DATA.noticias.forEach(function (n) {
      if (n.id === trabajoId) {
        n[field] = (Number(n[field]) || 0) + 1;
      }
    });
  }

  function todayArgentinaIso() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  }

  async function runEngagement(trabajoId, tipo, markerId) {
    if (!firebaseConfig() || !firebaseConfig().projectId || !firebaseConfig().apiKey) {
      throw new Error("Firebase no configurado.");
    }

    try {
      var marker = await restCreateFingerprint(markerId, tipo, trabajoId);
      if (!marker.created) {
        return { ok: true, recorded: false, reason: marker.reason };
      }

      var engagement = await restGetEngagement(trabajoId);
      var likes = engagement.likes;
      var views = engagement.views;
      if (tipo === "like") {
        likes += 1;
      } else {
        views += 1;
      }

      await restWriteEngagement(trabajoId, likes, views, engagement.exists);
      return { ok: true, recorded: true };
    } catch (err) {
      if (err && err.code === "permission-denied") {
        return {
          ok: false,
          status: 403,
          error:
            "Firebase rechazó guardar el me gusta. Publicá las reglas nuevas en Firestore → Reglas. Si seguís logueado en el panel admin, probá en una ventana de incógnito.",
        };
      }
      return { ok: false, status: 500, error: (err && err.message) || "Error al guardar." };
    }
  }

  async function trackView(trabajoId) {
    if (!trabajoId || hasViewedSession(trabajoId)) return { skipped: true };
    markViewedSession(trabajoId);

    var fp = await hashFingerprint(getFingerprint());
    var markerId = "view_" + trabajoId + "_" + fp + "_" + todayArgentinaIso();
    var result = await runEngagement(trabajoId, "view", markerId);
    if (result.ok && result.recorded) {
      bumpNoticiaCount(trabajoId, "viewsCount");
    }
    return result;
  }

  async function trackLike(trabajoId) {
    if (!trabajoId) return { ok: false };
    if (hasLikedLocal(trabajoId)) return { ok: true, already: true };

    var fp = await hashFingerprint(getFingerprint());
    var markerId = "like_" + trabajoId + "_" + fp;
    var result = await runEngagement(trabajoId, "like", markerId);

    if (result.ok && (result.recorded || result.reason === "already_like")) {
      markLikedLocal(trabajoId);
      if (result.recorded) {
        bumpNoticiaCount(trabajoId, "likesCount");
      }
      return { ok: true, recorded: !!result.recorded, already: result.reason === "already_like" };
    }
    return result;
  }

  function renderLikeButton(noticia) {
    var likes = Number(noticia.likesCount) || 0;
    var views = Number(noticia.viewsCount) || 0;
    var liked = hasLikedLocal(noticia.id);

    return (
      '<div class="muni-article-engagement" data-engagement-root="' +
      noticia.id +
      '">' +
      '<div class="muni-article-stats" aria-label="Estadísticas de la novedad">' +
      '<span class="muni-article-stat"><span aria-hidden="true">👁</span> <span data-engagement-views>' +
      views +
      "</span> lecturas</span>" +
      '<span class="muni-article-stat"><span aria-hidden="true">❤</span> <span data-engagement-likes>' +
      likes +
      "</span> me gusta</span>" +
      "</div>" +
      '<button type="button" class="muni-like-btn' +
      (liked ? " is-liked" : "") +
      '" data-like-btn data-trabajo-id="' +
      noticia.id +
      '" aria-pressed="' +
      (liked ? "true" : "false") +
      '">' +
      '<span aria-hidden="true">' +
      (liked ? "❤" : "🤍") +
      "</span> " +
      (liked ? "Te gusta" : "Me gusta") +
      "</button>" +
      "</div>"
    );
  }

  function showEngagementError(result) {
    if (!result || result.ok) return;
    alert(result.error || "No se pudo registrar. Probá de nuevo en unos segundos.");
  }

  function bindLikeButtons(root) {
    if (!root) return;
    root.querySelectorAll("[data-like-btn]").forEach(function (btn) {
      if (btn._muniLikeBound) return;
      btn._muniLikeBound = true;
      btn.addEventListener("click", async function () {
        if (btn.classList.contains("is-liked") || btn.disabled) return;
        btn.disabled = true;
        var trabajoId = btn.getAttribute("data-trabajo-id");
        try {
          var result = await trackLike(trabajoId);
          if (result.ok) {
            btn.classList.add("is-liked");
            btn.setAttribute("aria-pressed", "true");
            btn.innerHTML = '<span aria-hidden="true">❤</span> Te gusta';
            var wrap = btn.closest("[data-engagement-root]");
            var likesEl = wrap && wrap.querySelector("[data-engagement-likes]");
            if (likesEl && result.recorded) {
              likesEl.textContent = String((Number(likesEl.textContent) || 0) + 1);
            }
          } else {
            btn.disabled = false;
            showEngagementError(result);
          }
        } catch (err) {
          btn.disabled = false;
          showEngagementError({ ok: false, error: err && err.message });
        }
      });
    });
  }

  window.MuniEngagement = {
    trackView: trackView,
    trackLike: trackLike,
    renderLikeButton: renderLikeButton,
    bindLikeButtons: bindLikeButtons,
    hasLikedLocal: hasLikedLocal,
  };
})();
