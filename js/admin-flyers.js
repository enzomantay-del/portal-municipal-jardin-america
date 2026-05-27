(function () {
  "use strict";

  var db = null;
  var storage = null;
  var areasBySlug = new Map();
  var flyersById = new Map();
  var showAlert = null;
  var escapeHtml = null;
  var estadoPubLabel = null;
  var getAreasSorted = null;
  var getCurrentUser = null;
  var getDb = null;
  var getStorage = null;
  var formatError = null;

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
    if (getCurrentUser) {
      return getCurrentUser();
    }
    if (window.MuniFirebase && window.MuniFirebase.auth()) {
      return window.MuniFirebase.auth().currentUser;
    }
    return null;
  }

  function flyerErrorMessage(err, fallback) {
    var msg = (err && err.message) || fallback || String(err);
    var code = (err && err.code) || "";

    if (err && err._flyerStep === "firestore" || /firestore|eventos_flyers/i.test(msg + code)) {
      return (
        "Permiso denegado al guardar el flyer en Firestore. " +
        "Andá a Firebase Console → Firestore Database → Reglas, pegá firebase/firestore.rules y publicá. " +
        "Detalle: " + msg
      );
    }

    if (/storage|upload|storage\/unauthorized/i.test(msg + code)) {
      return (
        "Permiso denegado al subir la imagen a Storage. " +
        "Andá a Firebase Console → Storage → Reglas (bucket portal-municipal-jardin.firebasestorage.app), " +
        "pegá firebase/storage.rules y publicá. Detalle: " + msg
      );
    }

    if (/permission|insufficient/i.test(msg + code)) {
      return (
        "Permiso denegado. Publicá las dos reglas: " +
        "Firestore (firebase/firestore.rules) y Storage (firebase/storage.rules). Detalle: " + msg
      );
    }

    return formatError ? formatError(err, fallback) : msg;
  }

  function setFlyerSubmitLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      if (!btn.dataset.defaultLabel) {
        btn.dataset.defaultLabel = btn.textContent;
      }
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.textContent = "Guardando flyer…";
      return;
    }
    btn.disabled = false;
    btn.classList.remove("is-loading");
    btn.textContent = btn.dataset.defaultLabel || "Guardar flyer";
  }

  function todayIso() {
    if (window.MuniApi && window.MuniApi.todayIsoArgentina) {
      return window.MuniApi.todayIsoArgentina();
    }
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  }

  async function uploadFlyer(file, uid) {
    var auth = window.MuniFirebase && window.MuniFirebase.auth ? window.MuniFirebase.auth() : null;
    if (auth && auth.currentUser && auth.currentUser.getIdToken) {
      await auth.currentUser.getIdToken(true);
    }

    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = "municipal-flyers/" + uid + "/" + Date.now() + "." + ext;
    var ref = storage.ref(path);
    var bucket =
      window.MuniFirebase && window.MuniFirebase.getStorageBucket
        ? window.MuniFirebase.getStorageBucket()
        : "desconocido";
    var uploadTask = ref.put(file, { cacheControl: "public,max-age=31536000" });
    var timeoutMs = 120000;

    try {
      return await Promise.race([
        uploadTask.then(function () {
          return ref.getDownloadURL();
        }),
        new Promise(function (_resolve, reject) {
          setTimeout(function () {
            reject(
              new Error(
                "La subida del flyer tardó demasiado. Verificá tu conexión y que Storage esté habilitado en Firebase."
              )
            );
          }, timeoutMs);
        }),
      ]);
    } catch (err) {
      if (err && /storage\/unauthorized|permission/i.test(String(err.code || err.message))) {
        err.message =
          (err.message || "storage/unauthorized") +
          " [bucket=" +
          bucket +
          ", uid=" +
          uid +
          ", path=" +
          path +
          "]";
      }
      throw err;
    }
  }

  function buildAreaOptions(selected) {
    var areas = getAreasSorted ? getAreasSorted() : [];
    if (!areas.length) {
      return '<option value="">Importá las áreas municipales primero</option>';
    }
    var html = '<option value="">Seleccioná un área</option>';
    html += areas
      .map(function (area) {
        return (
          '<option value="' + escapeHtml(area.slug) + '"' +
          (area.slug === selected ? " selected" : "") +
          ">" + escapeHtml(area.nombre) + "</option>"
        );
      })
      .join("");
    return html;
  }

  function renderFlyerRow(id, d) {
    var areaName = areasBySlug.get(d.areaSlug) || d.areaSlug || "—";
    var actions =
      '<button type="button" class="muni-btn muni-btn--ghost" data-flyer-preview="' + escapeHtml(id) + '">Vista previa</button>';
    if (d.estadoPublicacion === "pendiente") {
      actions +=
        ' <button type="button" class="muni-btn muni-btn--primary" data-flyer-approve="' + escapeHtml(id) + '">Publicar</button>' +
        ' <button type="button" class="muni-btn muni-btn--danger" data-flyer-reject="' + escapeHtml(id) + '">Rechazar</button>';
    } else if (d.estadoPublicacion === "publicado") {
      actions +=
        ' <button type="button" class="muni-btn muni-btn--danger" data-flyer-unpublish="' + escapeHtml(id) + '">Quitar del portal</button>';
    }
    actions += ' <button type="button" class="muni-btn muni-btn--ghost" data-flyer-delete="' + escapeHtml(id) + '">Eliminar</button>';

    return (
      '<div class="muni-panel-row">' +
      '<div class="muni-panel-row-main">' +
      (d.imagenUrl
        ? '<img class="muni-flyer-thumb" src="' + escapeHtml(d.imagenUrl) + '" alt="" width="54" height="96">'
        : "") +
      "<div>" +
      "<strong>" + escapeHtml(d.titulo || "Flyer de evento") + "</strong>" +
      '<div class="muni-meta">' +
      "<span>" + escapeHtml(areaName) + "</span>" +
      "<span>Evento: " + escapeHtml(d.fechaEvento || "—") + "</span>" +
      '<span class="muni-panel-badge muni-panel-badge--' + escapeHtml(d.estadoPublicacion) + '">' +
      escapeHtml(estadoPubLabel(d.estadoPublicacion)) +
      "</span></div></div></div>" +
      '<div class="muni-panel-row-actions">' + actions + "</div></div>"
    );
  }

  async function loadFlyers(estado) {
    var listEl = document.getElementById("admin-flyers-list");
    var emptyEl = document.getElementById("admin-flyers-empty");
    if (!resolveClients() || !listEl) {
      throw new Error("Firebase no está listo para cargar flyers.");
    }

    var snap = await db.collection("eventos_flyers").where("estadoPublicacion", "==", estado).get();
    var rows = [];
    flyersById = new Map();
    snap.forEach(function (doc) {
      var data = doc.data();
      flyersById.set(doc.id, { id: doc.id, data: data });
      rows.push({ id: doc.id, data: data });
    });
    rows.sort(function (a, b) {
      return String(a.data.fechaEvento || "").localeCompare(String(b.data.fechaEvento || ""));
    });

    if (emptyEl) emptyEl.hidden = rows.length > 0;
    listEl.innerHTML = rows.length ? rows.map(function (r) { return renderFlyerRow(r.id, r.data); }).join("") : "";
  }

  async function patchFlyer(id, patch) {
    if (!resolveClients()) {
      throw new Error("Firebase no está listo.");
    }
    patch.updatedAt = window.MuniFirebase.serverTimestamp();
    await db.collection("eventos_flyers").doc(id).update(patch);
  }

  function resetFlyerForm(form) {
    if (!form) return;
    form.reset();
    var fileInput = document.getElementById("admin-flyer-archivo");
    if (fileInput) fileInput.value = "";
    populateAreaSelect();
  }

  function bindFlyerListActions() {
    var listEl = document.getElementById("admin-flyers-list");
    if (!listEl) return;

    listEl.addEventListener("click", async function (e) {
      var t = e.target.closest("[data-flyer-approve],[data-flyer-reject],[data-flyer-unpublish],[data-flyer-delete],[data-flyer-preview]");
      if (!t) return;

      var id =
        t.getAttribute("data-flyer-approve") ||
        t.getAttribute("data-flyer-reject") ||
        t.getAttribute("data-flyer-unpublish") ||
        t.getAttribute("data-flyer-delete") ||
        t.getAttribute("data-flyer-preview");
      if (!id) return;

      var row = flyersById.get(id);
      if (!row) return;

      if (t.hasAttribute("data-flyer-preview")) {
        var w = window.open("", "_blank");
        if (w) {
          w.document.write('<img src="' + row.data.imagenUrl + '" style="max-width:100%;height:auto;display:block;margin:0 auto;background:#111">');
        }
        return;
      }

      try {
        if (t.hasAttribute("data-flyer-approve")) {
          await patchFlyer(id, { estadoPublicacion: "publicado" });
          if (showAlert) showAlert("ok", "Flyer publicado en el portal.");
        } else if (t.hasAttribute("data-flyer-reject")) {
          await patchFlyer(id, { estadoPublicacion: "rechazado" });
          if (showAlert) showAlert("ok", "Flyer rechazado.");
        } else if (t.hasAttribute("data-flyer-unpublish")) {
          await patchFlyer(id, { estadoPublicacion: "rechazado" });
          if (showAlert) showAlert("ok", "Flyer retirado del portal.");
        } else if (t.hasAttribute("data-flyer-delete")) {
          if (!window.confirm("¿Eliminar este flyer permanentemente?")) return;
          await db.collection("eventos_flyers").doc(id).delete();
          if (showAlert) showAlert("ok", "Flyer eliminado.");
        }
        var filter = document.getElementById("admin-flyers-filter");
        await loadFlyers(filter ? filter.value : "pendiente");
      } catch (err) {
        if (showAlert) showAlert("error", flyerErrorMessage(err, "No se pudo actualizar el flyer."));
      }
    });
  }

  async function onAdminFlyerSubmit(e) {
    e.preventDefault();

    var form = document.getElementById("admin-flyer-form");
    if (!form) {
      if (showAlert) showAlert("error", "No se encontró el formulario de flyers.");
      return;
    }

    if (!resolveClients()) {
      if (showAlert) showAlert("error", "Firebase no está configurado. Revisá js/firebase-config.js.");
      return;
    }

    var user = resolveUser();
    if (!user) {
      if (showAlert) showAlert("error", "Sesión expirada. Cerrá sesión e ingresá de nuevo como administrador.");
      return;
    }

    var fd = new FormData(form);
    var areaSlug = String(fd.get("areaSlug") || "").trim();
    var fechaEvento = String(fd.get("fecha_evento") || "").trim();
    var titulo = String(fd.get("titulo") || "").trim();
    var estado = String(fd.get("estado_publicacion") || "publicado").trim();
    var file = fd.get("flyer_archivo");

    if (!areaSlug) {
      if (showAlert) showAlert("error", "Seleccioná el área del evento. Si no hay áreas, usá «Importar áreas municipales» arriba.");
      return;
    }
    if (!fechaEvento) {
      if (showAlert) showAlert("error", "Indicá la fecha del evento.");
      return;
    }
    if (fechaEvento < todayIso()) {
      if (showAlert) showAlert("error", "La fecha del evento no puede ser anterior a hoy.");
      return;
    }
    if (!file || typeof file.size !== "number" || !file.size) {
      if (showAlert) showAlert("error", "Subí el archivo del flyer (imagen vertical).");
      return;
    }

    var submitBtn = form.querySelector('[type="submit"]');
    setFlyerSubmitLoading(submitBtn, true);

    try {
      var imagenUrl;
      try {
        imagenUrl = await uploadFlyer(file, user.uid);
      } catch (uploadErr) {
        throw uploadErr;
      }

      try {
        await db.collection("eventos_flyers").add({
          areaSlug: areaSlug,
          titulo: titulo || "Evento municipal",
          imagenUrl: imagenUrl,
          fechaEvento: fechaEvento,
          estadoPublicacion: estado,
          createdBy: user.uid,
          createdAt: window.MuniFirebase.serverTimestamp(),
          updatedAt: window.MuniFirebase.serverTimestamp(),
        });
      } catch (saveErr) {
        saveErr._flyerStep = "firestore";
        throw saveErr;
      }

      resetFlyerForm(form);

      var filter = document.getElementById("admin-flyers-filter");
      if (filter) filter.value = estado;

      try {
        await loadFlyers(estado);
      } catch (listErr) {
        console.warn("AdminFlyers.load after save", listErr);
      }

      if (showAlert) {
        showAlert(
          "ok",
          estado === "publicado"
            ? "Flyer publicado. Debería verse en el portal tras recargar (Ctrl+F5)."
            : "Flyer guardado como pendiente. Cambiá el filtro de abajo para verlo."
        );
      }
    } catch (err) {
      console.error("Admin flyer save", err);
      if (showAlert) showAlert("error", flyerErrorMessage(err, "No se pudo guardar el flyer."));
    } finally {
      setFlyerSubmitLoading(submitBtn, false);
    }
  }

  function populateAreaSelect() {
    var select = document.getElementById("admin-flyer-area");
    if (select) select.innerHTML = buildAreaOptions("");
    var dateInput = document.getElementById("admin-flyer-fecha");
    if (dateInput) dateInput.min = todayIso();
  }

  window.AdminFlyers = {
    bind: function (options) {
      showAlert = options.showAlert;
      escapeHtml = options.escapeHtml;
      estadoPubLabel = options.estadoPubLabel;
      getAreasSorted = options.getAreasSorted;
      getCurrentUser = options.getCurrentUser || null;
      getDb = options.getDb || null;
      getStorage = options.getStorage || null;
      formatError = options.formatError || null;
      areasBySlug = options.areasBySlug || new Map();

      populateAreaSelect();
      bindFlyerListActions();

      var form = document.getElementById("admin-flyer-form");
      if (form) {
        form.setAttribute("novalidate", "novalidate");
        form.addEventListener("submit", onAdminFlyerSubmit);
      }

      var filter = document.getElementById("admin-flyers-filter");
      var refresh = document.getElementById("admin-flyers-refresh");
      if (filter) {
        filter.addEventListener("change", function () {
          loadFlyers(filter.value).catch(function (err) {
            if (showAlert) showAlert("error", flyerErrorMessage(err, "Error al cargar flyers."));
          });
        });
      }
      if (refresh) {
        refresh.addEventListener("click", function () {
          loadFlyers(filter ? filter.value : "pendiente").catch(function (err) {
            if (showAlert) showAlert("error", flyerErrorMessage(err, "Error al cargar flyers."));
          });
        });
      }
    },
    refreshAreas: function (map, sortedFn) {
      areasBySlug = map || areasBySlug;
      getAreasSorted = sortedFn || getAreasSorted;
      populateAreaSelect();
    },
    load: function (estado) {
      return loadFlyers(estado || "pendiente");
    },
  };
})();
