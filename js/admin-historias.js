(function () {
  "use strict";

  var VIGENCIA_DIAS = 7;
  var MAX_BYTES = 35 * 1024 * 1024;
  var MAX_DURATION_SEC = 90;

  var db = null;
  var storage = null;
  var showAlert = null;
  var escapeHtml = null;
  var formatError = null;
  var getCurrentUser = null;
  var getDb = null;
  var getStorage = null;

  function resolveClients() {
    if (getDb && getStorage) {
      db = getDb();
      storage = getStorage();
    } else if (window.MuniFirebase && window.MuniFirebase.isConfigured()) {
      window.MuniFirebase.init();
      db = window.MuniFirebase.db();
      storage = window.MuniFirebase.storage();
    }
    return !!(db && storage);
  }

  function resolveUser() {
    if (getCurrentUser) return getCurrentUser();
    if (window.MuniFirebase && window.MuniFirebase.auth()) {
      return window.MuniFirebase.auth().currentUser;
    }
    return null;
  }

  /** Compatibilidad: Admin usa showAlert(type, message). */
  function alertMsg(type, message) {
    var text = String(message || "");
    var status = document.getElementById("admin-historias-status");
    if (status) {
      status.hidden = false;
      status.className =
        "muni-panel-alert muni-panel-alert--" +
        (type === "ok" || type === "error" || type === "warn" ? type : "error");
      status.textContent = text;
      try {
        status.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (_e) {}
    }
    if (showAlert) showAlert(type, text);
  }

  function historiaErrorMessage(err, fallback) {
    var msg = (err && err.message) || fallback || String(err);
    var code = (err && err.code) || "";
    var blob = String(msg + " " + code).toLowerCase();

    if (/storage|upload|unauthorized|permission/i.test(blob) && /storage|upload/i.test(blob)) {
      return (
        "No se pudo subir el video a Storage. " +
        "En Firebase Console → Storage → Reglas, publicá el archivo firebase/storage.rules " +
        "(debe incluir municipal-historias). Detalle: " +
        msg
      );
    }
    if (/firestore|permission|insufficient|prensa_historias/i.test(blob)) {
      return (
        "No se pudo guardar en Firestore. " +
        "En Firebase Console → Firestore → Reglas, publicá firebase/firestore.rules " +
        "(debe incluir prensa_historias). Detalle: " +
        msg
      );
    }
    if (/index|failed_precondition/i.test(blob)) {
      return (
        "Falta un índice en Firestore. Abrí el link del error en la consola (F12) o publicá firebase/firestore.indexes.json. Detalle: " +
        msg
      );
    }
    return formatError ? formatError(err, fallback || msg) : msg;
  }

  function toDate(value) {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    if (typeof value === "string" || typeof value === "number") {
      var d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (value.seconds != null) return new Date(Number(value.seconds) * 1000);
    return null;
  }

  function formatFecha(value) {
    var d = toDate(value);
    if (!d) return "—";
    return d.toLocaleString("es-AR", {
      timeZone: "America/Argentina/Cordoba",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isVigente(data) {
    var exp = toDate(data && data.expiresAt);
    return !!(exp && exp.getTime() > Date.now());
  }

  async function deleteStorageUrl(url) {
    if (!url || !storage || !storage.refFromURL) return;
    try {
      await storage.refFromURL(url).delete();
    } catch (_err) {
      /* archivo ya borrado u otro bucket */
    }
  }

  async function purgeExpired(rows) {
    if (!rows || !rows.length || !db) return 0;
    var purged = 0;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      try {
        await deleteStorageUrl(row.data && row.data.videoUrl);
        await deleteStorageUrl(row.data && row.data.posterUrl);
        await db.collection("prensa_historias").doc(row.id).delete();
        purged += 1;
      } catch (err) {
        console.warn("AdminHistorias.purgeExpired", row.id, err);
      }
    }
    return purged;
  }

  function readVideoMeta(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      var settled = false;
      function done(meta) {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        resolve(meta);
      }
      video.onloadedmetadata = function () {
        var duration = Number(video.duration);
        if (!Number.isFinite(duration) || duration < 0) duration = 0;
        done({
          duration: duration,
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
        });
      };
      video.onerror = function () {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo leer el video. Probá exportarlo como MP4 (H.264)."));
      };
      setTimeout(function () {
        if (!settled) {
          done({ duration: 0, width: 0, height: 0 });
        }
      }, 10000);
      video.src = url;
    });
  }

  function makePosterBlob(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      var done = false;
      function finish(blob) {
        if (done) return;
        done = true;
        URL.revokeObjectURL(url);
        resolve(blob || null);
      }
      video.onloadeddata = function () {
        try {
          video.currentTime = Math.min(0.2, (video.duration || 1) * 0.05);
        } catch (_e) {
          finish(null);
        }
      };
      video.onseeked = function () {
        try {
          var canvas = document.createElement("canvas");
          var w = video.videoWidth || 720;
          var h = video.videoHeight || 1280;
          var maxW = 540;
          var scale = Math.min(1, maxW / w);
          canvas.width = Math.max(2, Math.round(w * scale));
          canvas.height = Math.max(2, Math.round(h * scale));
          var ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            function (blob) {
              finish(blob);
            },
            "image/jpeg",
            0.72
          );
        } catch (_e) {
          finish(null);
        }
      };
      video.onerror = function () {
        finish(null);
      };
      setTimeout(function () {
        finish(null);
      }, 8000);
      video.src = url;
    });
  }

  async function uploadBytes(path, blobOrFile, contentType) {
    var auth = window.MuniFirebase && window.MuniFirebase.auth ? window.MuniFirebase.auth() : null;
    if (auth && auth.currentUser && auth.currentUser.getIdToken) {
      await auth.currentUser.getIdToken(true);
    }
    var ref = storage.ref(path);
    var task = ref.put(blobOrFile, {
      contentType: contentType || blobOrFile.type || "application/octet-stream",
      cacheControl: "public,max-age=604800",
    });
    var timeoutMs = Math.max(180000, Math.round((blobOrFile.size || 0) / 50));
    try {
      await Promise.race([
        task,
        new Promise(function (_resolve, reject) {
          setTimeout(function () {
            reject(
              new Error(
                "La subida tardó demasiado (" +
                  Math.round(timeoutMs / 1000) +
                  " s). Revisá la conexión o usá un video más liviano."
              )
            );
          }, timeoutMs);
        }),
      ]);
    } catch (err) {
      if (err && /storage\/unauthorized|permission/i.test(String(err.code || err.message))) {
        err.message =
          (err.message || "storage/unauthorized") +
          " [path=" +
          path +
          "]";
      }
      throw err;
    }
    return ref.getDownloadURL();
  }

  function setSubmitLoading(btn, loading, label) {
    if (!btn) return;
    if (loading) {
      if (!btn.dataset.defaultLabel) btn.dataset.defaultLabel = btn.textContent;
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.textContent = label || "Subiendo…";
      return;
    }
    btn.disabled = false;
    btn.classList.remove("is-loading");
    btn.textContent = btn.dataset.defaultLabel || "Publicar historia";
  }

  function renderList(rows) {
    var list = document.getElementById("admin-historias-list");
    var empty = document.getElementById("admin-historias-empty");
    if (!list) return;

    if (!rows.length) {
      list.innerHTML = "";
      if (empty) {
        empty.hidden = false;
        empty.textContent = "Todavía no hay historias vigentes.";
      }
      return;
    }
    if (empty) empty.hidden = true;

    list.innerHTML = rows
      .map(function (row) {
        var d = row.data || {};
        var vigente = isVigente(d);
        return (
          '<article class="muni-panel-card muni-historias-admin-card" data-historia-id="' +
          escapeHtml(row.id) +
          '">' +
          '<div class="muni-historias-admin-thumb">' +
          (d.posterUrl
            ? '<img src="' + escapeHtml(d.posterUrl) + '" alt="" loading="lazy" decoding="async">'
            : '<span class="muni-historias-admin-thumb-fallback">Video</span>') +
          "</div>" +
          '<div class="muni-historias-admin-body">' +
          "<h4>" +
          escapeHtml(d.titulo || "Sin título") +
          "</h4>" +
          "<p>Publicado: " +
          escapeHtml(formatFecha(d.createdAt)) +
          "</p>" +
          "<p>Vence: <strong>" +
          escapeHtml(formatFecha(d.expiresAt)) +
          "</strong>" +
          (vigente ? "" : " · vencida") +
          "</p>" +
          '<div class="muni-historias-admin-actions">' +
          '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-historia-delete="' +
          escapeHtml(row.id) +
          '">Eliminar</button>' +
          "</div>" +
          "</div></article>"
        );
      })
      .join("");
  }

  async function loadHistorias() {
    if (!resolveClients() || !db) {
      alertMsg("error", "Firebase no está disponible. Recargá la página e ingresá de nuevo.");
      return;
    }
    try {
      var snap = await db.collection("prensa_historias").orderBy("createdAt", "desc").limit(40).get();
      var rows = [];
      var expired = [];
      snap.forEach(function (doc) {
        var data = doc.data() || {};
        var row = { id: doc.id, data: data };
        if (!isVigente(data)) expired.push(row);
        else rows.push(row);
      });

      var purged = await purgeExpired(expired);
      if (purged) {
        alertMsg("ok", "Se eliminaron " + purged + " historia(s) vencida(s).");
      }
      renderList(rows);
    } catch (err) {
      console.error("AdminHistorias.load", err);
      alertMsg("error", historiaErrorMessage(err, "No se pudo cargar la lista de historias."));
      renderList([]);
    }
  }

  async function deleteHistoria(id) {
    if (!db || !id) return;
    var doc = await db.collection("prensa_historias").doc(id).get();
    if (doc.exists) {
      var data = doc.data() || {};
      await deleteStorageUrl(data.videoUrl);
      await deleteStorageUrl(data.posterUrl);
    }
    await db.collection("prensa_historias").doc(id).delete();
  }

  function bindForm() {
    var form = document.getElementById("admin-historia-form");
    if (!form || form.dataset.bound) return;
    form.dataset.bound = "1";

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!resolveClients()) {
        alertMsg(
          "error",
          "Firebase Storage no está disponible. Recargá la página y verificá js/firebase-config.js."
        );
        return;
      }
      var user = resolveUser();
      if (!user || !user.uid) {
        alertMsg("error", "Tenés que iniciar sesión como administrador.");
        return;
      }

      var tituloInput = document.getElementById("admin-historia-titulo");
      var fileInput = document.getElementById("admin-historia-archivo");
      var submitBtn = document.getElementById("admin-historia-submit");
      var file = fileInput && fileInput.files && fileInput.files[0];
      var titulo = tituloInput ? String(tituloInput.value || "").trim().slice(0, 120) : "";

      if (!file) {
        alertMsg("error", "Elegí un video vertical (MP4).");
        return;
      }
      // Algunos celulares mandan type vacío: se acepta por extensión.
      var looksVideo =
        /^video\//i.test(file.type || "") ||
        /\.(mp4|webm|mov|m4v|3gp)$/i.test(file.name || "");
      if (!looksVideo) {
        alertMsg("error", "El archivo tiene que ser un video (MP4 / MOV).");
        return;
      }
      if (file.size > MAX_BYTES) {
        alertMsg(
          "error",
          "El video supera " +
            Math.round(MAX_BYTES / (1024 * 1024)) +
            " MB. Comprimilo antes de subirlo (recomendado menos de 20 MB)."
        );
        return;
      }

      setSubmitLoading(submitBtn, true, "Analizando video…");
      alertMsg("warn", "Analizando el video…");
      try {
        var meta = await readVideoMeta(file);
        if (meta.duration > MAX_DURATION_SEC) {
          throw new Error(
            "El video dura más de " +
              MAX_DURATION_SEC +
              " segundos (" +
              Math.round(meta.duration) +
              " s). Usá un corte corto tipo historia."
          );
        }
        // Orientación: solo aviso si es claramente horizontal (no bloquea si hay rotación de cámara).
        if (meta.width > 0 && meta.height > 0 && meta.width > meta.height * 1.25) {
          alertMsg(
            "warn",
            "El archivo parece horizontal. Se va a publicar igual; para historias conviene vertical."
          );
        }

        setSubmitLoading(submitBtn, true, "Generando vista previa…");
        var posterBlob = await makePosterBlob(file);

        var stamp = Date.now();
        var ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
        if (ext === "mov") ext = "mov";
        var videoPath = "municipal-historias/" + user.uid + "/" + stamp + "." + ext;
        var posterPath = "municipal-historias/" + user.uid + "/" + stamp + "-poster.jpg";
        var contentType = file.type || (ext === "mov" ? "video/quicktime" : "video/mp4");

        setSubmitLoading(submitBtn, true, "Subiendo video…");
        alertMsg("warn", "Subiendo video (" + Math.round(file.size / (1024 * 1024)) + " MB). No cierres esta pestaña…");
        var videoUrl = await uploadBytes(videoPath, file, contentType);
        var posterUrl = "";
        if (posterBlob) {
          setSubmitLoading(submitBtn, true, "Subiendo miniatura…");
          posterUrl = await uploadBytes(posterPath, posterBlob, "image/jpeg");
        }

        var now = new Date();
        var expires = new Date(now.getTime() + VIGENCIA_DIAS * 24 * 60 * 60 * 1000);
        var Timestamp = firebase.firestore.Timestamp;
        var FieldValue = firebase.firestore.FieldValue;

        setSubmitLoading(submitBtn, true, "Guardando…");
        await db.collection("prensa_historias").add({
          titulo: titulo,
          videoUrl: videoUrl,
          posterUrl: posterUrl || "",
          storagePath: videoPath,
          posterStoragePath: posterUrl ? posterPath : "",
          contentType: contentType,
          sizeBytes: file.size,
          durationSeconds: Math.round(meta.duration || 0),
          width: meta.width || 0,
          height: meta.height || 0,
          estadoPublicacion: "publicado",
          createdBy: user.uid,
          createdAt: FieldValue.serverTimestamp(),
          expiresAt: Timestamp.fromDate(expires),
        });

        form.reset();
        alertMsg(
          "ok",
          "Historia publicada. Se mostrará ~" + VIGENCIA_DIAS + " días en el inicio y luego se borrará sola."
        );
        await loadHistorias();
      } catch (err) {
        console.error(err);
        alertMsg("error", historiaErrorMessage(err, "No se pudo publicar la historia."));
      } finally {
        setSubmitLoading(submitBtn, false);
      }
    });

    var list = document.getElementById("admin-historias-list");
    if (list && !list.dataset.bound) {
      list.dataset.bound = "1";
      list.addEventListener("click", async function (e) {
        var btn = e.target.closest("[data-historia-delete]");
        if (!btn) return;
        var id = btn.getAttribute("data-historia-delete");
        if (!id) return;
        if (!window.confirm("¿Eliminar esta historia ahora?")) return;
        try {
          await deleteHistoria(id);
          alertMsg("ok", "Historia eliminada.");
          await loadHistorias();
        } catch (err) {
          alertMsg("error", historiaErrorMessage(err, "No se pudo eliminar."));
        }
      });
    }

    var refresh = document.getElementById("admin-historias-refresh");
    if (refresh && !refresh.dataset.bound) {
      refresh.dataset.bound = "1";
      refresh.addEventListener("click", function () {
        loadHistorias().catch(function (err) {
          alertMsg("error", historiaErrorMessage(err, "Error al actualizar."));
        });
      });
    }
  }

  window.AdminHistorias = {
    bind: function (opts) {
      opts = opts || {};
      showAlert = opts.showAlert || showAlert;
      escapeHtml =
        opts.escapeHtml ||
        function (s) {
          return String(s == null ? "" : s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        };
      formatError = opts.formatError || formatError;
      getCurrentUser = opts.getCurrentUser || getCurrentUser;
      getDb = opts.getDb || getDb;
      getStorage = opts.getStorage || getStorage;
      bindForm();
    },
    load: function () {
      return loadHistorias();
    },
  };
})();
