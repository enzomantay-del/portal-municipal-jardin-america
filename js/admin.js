(function () {
  "use strict";

  var auth = null;
  var db = null;
  var storage = null;

  var alertBox = document.getElementById("admin-alert");
  var loginForm = document.getElementById("admin-login-form");
  var authPanel = document.getElementById("admin-auth");
  var workspace = document.getElementById("admin-workspace");
  var authEmail = document.getElementById("admin-email");
  var logoutBtn = document.getElementById("admin-logout");
  var estadoFilter = document.getElementById("admin-estado-filter");
  var refreshBtn = document.getElementById("admin-refresh");
  var listEl = document.getElementById("admin-trabajos-list");
  var emptyEl = document.getElementById("admin-trabajos-empty");
  var seedBtn = document.getElementById("admin-seed-areas");
  var userForm = document.getElementById("admin-user-form");
  var editCard = document.getElementById("admin-edit-card");
  var editForm = document.getElementById("admin-trabajo-form");
  var editTitle = document.getElementById("admin-edit-title");
  var editHelp = document.getElementById("admin-edit-help");
  var cancelEditBtn = document.getElementById("admin-cancel-edit");
  var newTrabajoBtn = document.getElementById("admin-new-trabajo");
  var areaSelect = document.getElementById("admin-area-slug");
  var userAreaSelect = document.getElementById("user-area");
  var estadoPubWrap = document.getElementById("admin-estado-pub-wrap");
  var estadoPubSelect = document.getElementById("admin-estado-publicacion");
  var submitTrabajoBtn = document.getElementById("admin-trabajo-submit");

  var previewModal = document.getElementById("admin-preview");
  var previewBackdrop = document.getElementById("admin-preview-backdrop");
  var previewCloseBtn = document.getElementById("admin-preview-close");
  var previewContent = document.getElementById("admin-preview-content");
  var previewActions = document.getElementById("admin-preview-actions");
  var previewId = null;

  var currentUser = null;
  var areasBySlug = new Map();
  var areasSorted = [];
  var trabajosById = new Map();
  var editingId = null;

  function initClients() {
    if (!window.MuniFirebase || !window.MuniFirebase.isConfigured()) return false;
    window.MuniFirebase.init();
    auth = window.MuniFirebase.auth();
    db = window.MuniFirebase.db();
    storage = window.MuniFirebase.storage();
    return !!(auth && db);
  }

  function showAlert(type, message, asHtml) {
    if (!alertBox) return;
    alertBox.className = "muni-panel-alert muni-panel-alert--" + type;
    if (asHtml) {
      alertBox.innerHTML = message;
    } else {
      alertBox.textContent = message;
    }
    alertBox.hidden = false;
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideAlert() {
    if (alertBox) alertBox.hidden = true;
  }

  function formatFirestoreError(err, fallback) {
    var msg = (err && err.message) || fallback || String(err);
    if (msg.indexOf("permission") !== -1 || msg.indexOf("insufficient") !== -1) {
      return (
        "Permiso denegado en Firestore. Andá a Firebase Console → Firestore → Reglas, " +
        "pegá el contenido de firebase/firestore.rules y publicá. " +
        "Detalle: " + msg
      );
    }
    return msg;
  }

  function setSubmitLoading(loading, loadingLabel) {
    var btn = submitTrabajoBtn || (editForm && editForm.querySelector('[type="submit"]'));
    if (!btn) return;
    if (loading) {
      if (!btn.dataset.defaultLabel) {
        btn.dataset.defaultLabel = btn.textContent;
      }
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.textContent = loadingLabel || "Guardando…";
      return;
    }
    btn.disabled = false;
    btn.classList.remove("is-loading");
    btn.textContent = btn.dataset.defaultLabel || "Guardar novedad";
  }

  function escapeHtml(str) {
    return window.MuniPortal ? window.MuniPortal.escapeHtml(str) : String(str || "");
  }

  function estadoPubLabel(v) {
    return window.MuniPortal ? window.MuniPortal.estadoPublicacionLabel(v) : v;
  }

  function estadoObraLabel(v) {
    return window.MuniPortal ? window.MuniPortal.estadoLabel(v) : v;
  }

  function formatDateLabel(v) {
    return window.MuniPortal ? window.MuniPortal.formatDate(v) : v;
  }

  function closePreview() {
    previewId = null;
    if (previewModal) {
      previewModal.hidden = true;
      previewModal.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "";
  }

  function openPreview(id) {
    var row = trabajosById.get(id);
    if (!row || !previewContent) return;

    previewId = id;
    var d = row.data;
    var areaName = areasBySlug.get(d.areaSlug) || d.areaSlug || "—";
    var img = d.imagenUrl || "";
    var imgBlock = img
      ? '<figure class="muni-article-cover"><img src="' + escapeHtml(img) + '" alt="' + escapeHtml(d.titulo) + '"></figure>'
      : "";

    previewContent.innerHTML =
      '<article class="muni-article">' +
      '<p class="muni-panel-item-kicker">' + escapeHtml(areaName) + "</p>" +
      '<span class="muni-panel-badge muni-panel-badge--' + escapeHtml(d.estadoPublicacion) + '">' +
      estadoPubLabel(d.estadoPublicacion) +
      "</span>" +
      '<header class="muni-article-header">' +
      "<h1 class=\"muni-article-title\">" + escapeHtml(d.titulo) + "</h1>" +
      '<p class="muni-article-lead">' + escapeHtml(d.bajada) + "</p>" +
      "</header>" +
      imgBlock +
      '<dl class="muni-article-info">' +
      "<div><dt>Ubicación</dt><dd>" + escapeHtml(d.ubicacion || "—") + "</dd></div>" +
      "<div><dt>Barrio</dt><dd>" + escapeHtml(d.barrio || "—") + "</dd></div>" +
      "<div><dt>Estado del trabajo</dt><dd>" + escapeHtml(estadoObraLabel(d.estadoObra)) + "</dd></div>" +
      "<div><dt>Fecha</dt><dd>" + escapeHtml(formatDateLabel(d.fechaPublicacion)) + "</dd></div>" +
      "</dl>" +
      '<div class="muni-article-body">' + (d.cuerpo || "<p>—</p>") + "</div>" +
      "</article>";

    if (previewActions) {
      var actionsHtml =
        '<button type="button" class="muni-btn muni-btn--ghost" data-preview-action="editar">Editar</button>';
      if (d.estadoPublicacion === "pendiente") {
        actionsHtml +=
          '<button type="button" class="muni-btn muni-btn--primary" data-preview-action="aprobar">Aprobar y publicar</button>' +
          '<button type="button" class="muni-btn muni-btn--danger" data-preview-action="rechazar">Rechazar</button>';
      } else if (d.estadoPublicacion === "publicado") {
        actionsHtml +=
          '<a class="muni-btn muni-btn--ghost" href="noticia.html?id=' +
          encodeURIComponent(id) +
          '" target="_blank" rel="noopener">Abrir en el portal</a>' +
          '<button type="button" class="muni-btn muni-btn--ghost" data-preview-action="destacar" data-destacada="' +
          (d.destacada ? "1" : "0") +
          '">' +
          (d.destacada ? "Quitar destacada" : "Marcar destacada") +
          "</button>";
      }
      previewActions.innerHTML = actionsHtml;

      previewActions.querySelectorAll("[data-preview-action]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var action = btn.getAttribute("data-preview-action");
          if (action === "editar") {
            closePreview();
            startEditTrabajo(id);
            return;
          }
          handleAction(action, id, btn.getAttribute("data-destacada") === "1").then(function () {
            closePreview();
          });
        });
      });
    }

    if (previewModal) {
      previewModal.hidden = false;
      previewModal.setAttribute("aria-hidden", "false");
    }
    document.body.style.overflow = "hidden";
    if (previewCloseBtn) previewCloseBtn.focus();
  }

  function setWorkspaceVisible(visible) {
    if (authPanel) authPanel.hidden = visible;
    if (workspace) workspace.hidden = !visible;
  }

  async function deactivateRemovedAreas() {
    var removed = window.MUNI_REMOVED_AREA_SLUGS || [];
    if (!removed.length || !db) return;
    var batch = db.batch();
    removed.forEach(function (slug) {
      batch.set(db.collection("areas").doc(slug), { activa: false }, { merge: true });
    });
    await batch.commit();
  }

  async function loadAreasCache() {
    try {
      await deactivateRemovedAreas();
    } catch (err) {
      console.warn("No se pudieron desactivar áreas removidas.", err);
    }

    areasBySlug = new Map();
    areasSorted = [];
    var snap = await db.collection("areas").get();
    snap.forEach(function (doc) {
      var data = doc.data();
      if (data.activa === false) return;
      if ((window.MUNI_REMOVED_AREA_SLUGS || []).indexOf(doc.id) !== -1) return;
      areasSorted.push({
        slug: doc.id,
        nombre: data.nombre || doc.id,
        orden: data.orden != null ? data.orden : 999,
      });
    });
    areasSorted.sort(function (a, b) {
      return a.orden - b.orden;
    });

    var existingSlugs = new Set(areasSorted.map(function (a) { return a.slug; }));
    (window.MUNI_FIREBASE_SEED_AREAS || []).forEach(function (seed) {
      if ((window.MUNI_REMOVED_AREA_SLUGS || []).indexOf(seed.slug) !== -1) return;
      if (seed.activa === false) return;
      if (existingSlugs.has(seed.slug)) return;
      areasSorted.push({
        slug: seed.slug,
        nombre: seed.nombre,
        orden: seed.orden != null ? seed.orden : 999,
      });
    });
    areasSorted.sort(function (a, b) {
      return a.orden - b.orden;
    });

    areasSorted.forEach(function (area) {
      areasBySlug.set(area.slug, area.nombre);
    });
    populateAreaSelects();
  }

  function buildAreaOptions(includeEmpty) {
    var options = [];
    if (includeEmpty) {
      options.push('<option value="">—</option>');
    } else {
      options.push('<option value="">Seleccionar area</option>');
    }
    areasSorted.forEach(function (area) {
      options.push(
        '<option value="' + escapeHtml(area.slug) + '">' + escapeHtml(area.nombre) + "</option>"
      );
    });
    return options.join("");
  }

  function populateAreaSelects() {
    if (areaSelect) areaSelect.innerHTML = buildAreaOptions(false);
    if (userAreaSelect) userAreaSelect.innerHTML = buildAreaOptions(true);
  }

  function updateTrabajoFormMode() {
    var isNew = !editingId;
    if (editTitle) editTitle.textContent = isNew ? "Nueva novedad" : "Editar novedad";
    if (editHelp) {
      editHelp.textContent = isNew
        ? "Carga una novedad en nombre de cualquier area. Podes publicarla directo o dejarla pendiente."
        : "Corregi el contenido antes de aprobar o despues de publicar, si hace falta.";
    }
    if (estadoPubWrap) estadoPubWrap.hidden = !isNew;
    if (submitTrabajoBtn) {
      submitTrabajoBtn.textContent = isNew ? "Guardar novedad" : "Guardar cambios";
    }
  }

  function resetEditForm() {
    editingId = null;
    if (editForm) editForm.reset();
    if (editCard) editCard.hidden = true;
    updateTrabajoFormMode();
  }

  function startNewTrabajo() {
    if (!editForm) return;
    editingId = null;
    if (editCard) editCard.hidden = false;
    editForm.reset();
    updateTrabajoFormMode();
    if (estadoPubSelect) estadoPubSelect.value = "pendiente";
    var today = new Date().toISOString().slice(0, 10);
    if (editForm.fecha_publicacion) editForm.fecha_publicacion.value = today;
    if (editForm.estado_obra) editForm.estado_obra.value = "en_curso";
    if (editCard && editCard.scrollIntoView) {
      editCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function startEditTrabajo(id) {
    var row = trabajosById.get(id);
    if (!row || !editForm) return;

    var t = row.data;
    editingId = id;
    if (editCard) editCard.hidden = false;
    updateTrabajoFormMode();
    if (editTitle) editTitle.textContent = "Editar: " + (t.titulo || "novedad");

    editForm.titulo.value = t.titulo || "";
    editForm.bajada.value = t.bajada || "";
    editForm.cuerpo.value = htmlToPlainText(t.cuerpo);
    editForm.ubicacion.value = t.ubicacion || "";
    editForm.barrio.value = t.barrio || "";
    editForm.estado_obra.value = t.estadoObra || "en_curso";
    editForm.fecha_publicacion.value = t.fechaPublicacion || "";
    editForm.imagen_url.value = t.imagenUrl || "";
    if (areaSelect) areaSelect.value = t.areaSlug || "";
    if (editForm.imagen_archivo) editForm.imagen_archivo.value = "";

    if (editCard && editCard.scrollIntoView) {
      editCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function htmlToPlainText(html) {
    return String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  function buildCuerpoHtml(text) {
    return text
      .split(/\n\s*\n/)
      .map(function (p) {
        return "<p>" + escapeHtml(p.trim()).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  async function saveTrabajoForm(event) {
    event.preventDefault();

    if (!db || !editForm) {
      showAlert("error", "No hay conexión con Firestore. Recargá la página.");
      return;
    }
    if (!currentUser) {
      showAlert("error", "Tu sesión no está activa. Cerrá sesión e ingresá de nuevo como admin.");
      return;
    }

    var isNew = !editingId;
    setSubmitLoading(true, isNew ? "Guardando novedad…" : "Guardando cambios…");

    var fd = new FormData(editForm);
    var payload = {
      titulo: String(fd.get("titulo") || "").trim(),
      bajada: String(fd.get("bajada") || "").trim(),
      cuerpo: buildCuerpoHtml(String(fd.get("cuerpo") || "").trim()),
      areaSlug: String(fd.get("areaSlug") || "").trim(),
      ubicacion: String(fd.get("ubicacion") || "").trim(),
      barrio: String(fd.get("barrio") || "").trim(),
      estadoObra: fd.get("estado_obra"),
      fechaPublicacion: fd.get("fecha_publicacion"),
      imagenUrl: String(fd.get("imagen_url") || "").trim() || null,
      updatedAt: window.MuniFirebase.serverTimestamp(),
      editedByAdmin: currentUser.uid,
    };

    if (!payload.titulo || !payload.bajada || !payload.cuerpo) {
      showAlert("error", "Completá título, bajada y texto de la novedad.");
      setSubmitLoading(false);
      return;
    }

    if (!payload.areaSlug) {
      showAlert("error", "Seleccioná un área. Si no hay áreas, usá «Importar áreas municipales».");
      setSubmitLoading(false);
      return;
    }

    var file = fd.get("imagen_archivo");
    if (file && file.size > 0) {
      try {
        payload.imagenUrl = await uploadImage(file);
      } catch (err) {
        showAlert("error", formatFirestoreError(err, "Error al subir la imagen."));
        setSubmitLoading(false);
        return;
      }
    }

    var estadoPub = "pendiente";
    if (isNew) {
      estadoPub = String(
        (estadoPubSelect && estadoPubSelect.value) || fd.get("estado_publicacion") || "pendiente"
      ).trim();
    }

    try {
      if (isNew) {
        payload.estadoPublicacion = estadoPub;
        payload.createdBy = currentUser.uid;
        payload.createdAt = window.MuniFirebase.serverTimestamp();
        payload.createdByAdmin = true;
        if (estadoPub === "publicado") {
          payload.publishedAt = window.MuniFirebase.serverTimestamp();
        }
        await db.collection("trabajos").add(payload);
        if (estadoFilter) estadoFilter.value = estadoPub;
        resetEditForm();
        showAlert(
          "ok",
          estadoPub === "publicado"
            ? "Listo: la novedad se publicó en el portal."
            : "Listo: la novedad quedó pendiente de aprobación."
        );
      } else {
        await db.collection("trabajos").doc(editingId).update(payload);
        resetEditForm();
        showAlert("ok", "Listo: la novedad se actualizó correctamente.");
      }

      try {
        await loadTrabajos({ source: "server" });
        if (listEl) listEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (loadErr) {
        showAlert(
          "warn",
          "Se guardó, pero no se pudo refrescar la lista. Tocá «Actualizar». " +
            formatFirestoreError(loadErr, "")
        );
      }
    } catch (err) {
      showAlert("error", formatFirestoreError(err, "No se pudo guardar la novedad."));
    } finally {
      setSubmitLoading(false);
    }
  }

  async function uploadImage(file) {
    if (!file || !storage || !currentUser) return null;
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = "municipal-images/" + currentUser.uid + "/" + Date.now() + "." + ext;
    var ref = storage.ref(path);
    await ref.put(file, { cacheControl: "public,max-age=31536000" });
    return ref.getDownloadURL();
  }

  async function refreshSession(user) {
    if (!initClients()) {
      showAlert("warn", "Configurá js/firebase-config.js antes de usar el panel admin.");
      return;
    }

    currentUser = user || auth.currentUser;
    if (!currentUser) {
      setWorkspaceVisible(false);
      return;
    }

    var uid = currentUser.uid;
    var profile = null;
    try {
      if (currentUser.getIdToken) {
        await currentUser.getIdToken(true);
      }
      profile = await window.MuniApi.getUserProfile(uid);
    } catch (err) {
      await auth.signOut();
      var permMsg = (err && err.message) || String(err);
      showAlert(
        "error",
        "No se pudo leer tu perfil en Firestore (UID: " +
          uid +
          "). Publicá las reglas de firebase/firestore.rules en la consola de Firebase. Detalle: " +
          permMsg
      );
      setWorkspaceVisible(false);
      return;
    }

    if (!profile) {
      var diag = window.MuniFirebase.diagnoseUserProfile
        ? await window.MuniFirebase.diagnoseUserProfile(uid)
        : { projectId: window.MuniFirebase.getProjectId && window.MuniFirebase.getProjectId() };
      var projectId = (diag && diag.projectId) || "desconocido";
      var consoleUrl =
        "https://console.firebase.google.com/project/" +
        encodeURIComponent(projectId) +
        "/firestore/databases/-default-/data/~2Fusers~2F" +
        encodeURIComponent(uid);
      await auth.signOut();
      showAlert(
        "error",
        "Firestore no encuentra <code>users/" +
          escapeHtml(uid) +
          "</code> en el proyecto <strong>" +
          escapeHtml(projectId) +
          '</strong>. Abrí la consola en ese proyecto y creá el documento ahí: <a href="' +
          consoleUrl +
          '" target="_blank" rel="noopener">Abrir Firestore del proyecto correcto</a>',
        true
      );
      setWorkspaceVisible(false);
      return;
    }

    if (profile.role !== "admin") {
      await auth.signOut();
      showAlert(
        "error",
        'Tu perfil tiene role "' +
          profile.role +
          '" pero se necesita "admin". Corregilo en Firestore → users → ' +
          uid
      );
      setWorkspaceVisible(false);
      return;
    }

    if (authEmail) authEmail.textContent = currentUser.email || "";
    setWorkspaceVisible(true);
    await loadAreasCache();
    if (window.AdminFlyers) {
      window.AdminFlyers.refreshAreas(areasBySlug, function () {
        return areasSorted;
      });
      try {
        await window.AdminFlyers.load("pendiente");
      } catch (flyerErr) {
        console.warn("AdminFlyers.load", flyerErr);
        showAlert(
          "warn",
          formatFirestoreError(
            flyerErr,
            "No se pudieron listar los flyers. Publicá firebase/firestore.rules si aún no lo hiciste."
          )
        );
      }
    }
    try {
      await loadTrabajos();
    } catch (err) {
      showAlert("error", formatFirestoreError(err, "No se pudieron cargar las novedades."));
    }
  }

  async function loadTrabajos(options) {
    if (!db) return;
    var estado = estadoFilter ? estadoFilter.value : "pendiente";
    var getOptions = options && options.source ? { source: options.source } : undefined;

    var snap;
    try {
      snap = await db
        .collection("trabajos")
        .where("estadoPublicacion", "==", estado)
        .get(getOptions);
    } catch (err) {
      showAlert("error", err.message || "No se pudieron cargar las novedades.");
      return;
    }

    var rows = [];
    trabajosById = new Map();
    snap.forEach(function (doc) {
      var data = doc.data();
      rows.push({ id: doc.id, data: data });
      trabajosById.set(doc.id, { id: doc.id, data: data });
    });

    rows.sort(function (a, b) {
      function ts(data) {
        if (data.updatedAt && data.updatedAt.toMillis) return data.updatedAt.toMillis();
        if (data.createdAt && data.createdAt.toMillis) return data.createdAt.toMillis();
        return 0;
      }
      return ts(b.data) - ts(a.data);
    });

    if (!listEl) return;

    if (!rows.length) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    listEl.innerHTML = rows
      .map(function (row) {
        var d = row.data;
        var areaName = areasBySlug.get(d.areaSlug) || d.areaSlug || "—";
        return (
          '<article class="muni-panel-item muni-panel-item--admin">' +
          "<div>" +
          '<p class="muni-panel-item-kicker">' + escapeHtml(areaName) + "</p>" +
          "<h3>" + escapeHtml(d.titulo) + "</h3>" +
          "<p>" + escapeHtml(d.bajada) + "</p>" +
          '<p class="muni-panel-item-meta">' +
          '<span class="muni-panel-badge muni-panel-badge--' + escapeHtml(d.estadoPublicacion) + '">' +
          estadoPubLabel(d.estadoPublicacion) +
          "</span>" +
          (d.destacada ? " · <strong>Destacada</strong>" : "") +
          "</p>" +
          "</div>" +
          '<div class="muni-panel-item-actions muni-panel-item-actions--stack">' +
          '<button type="button" class="muni-btn muni-btn--ghost" data-action="previsualizar" data-id="' + row.id + '">Vista previa</button>' +
          '<button type="button" class="muni-btn muni-btn--ghost" data-action="editar" data-id="' + row.id + '">Editar</button>' +
          (estado === "pendiente"
            ? '<button type="button" class="muni-btn muni-btn--primary" data-action="aprobar" data-id="' + row.id + '">Aprobar</button>' +
              '<button type="button" class="muni-btn muni-btn--danger" data-action="rechazar" data-id="' + row.id + '">Rechazar</button>'
            : "") +
          (estado === "publicado"
            ? '<button type="button" class="muni-btn muni-btn--ghost" data-action="destacar" data-id="' + row.id + '" data-destacada="' + (d.destacada ? "1" : "0") + '">' +
              (d.destacada ? "Quitar destacada" : "Marcar destacada") +
              "</button>"
            : "") +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    listEl.querySelectorAll("[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-action");
        var id = btn.getAttribute("data-id");
        if (action === "editar") {
          startEditTrabajo(id);
          return;
        }
        if (action === "previsualizar") {
          openPreview(id);
          return;
        }
        handleAction(action, id, btn.getAttribute("data-destacada") === "1");
      });
    });
  }

  async function handleAction(action, id, isDestacada) {
    if (!db || !id) return;

    var patch = { updatedAt: window.MuniFirebase.serverTimestamp() };
    if (action === "aprobar") {
      patch.estadoPublicacion = "publicado";
      patch.publishedAt = window.MuniFirebase.serverTimestamp();
    } else if (action === "rechazar") {
      patch.estadoPublicacion = "rechazado";
    } else if (action === "destacar") {
      patch.destacada = !isDestacada;
    } else {
      return;
    }

    try {
      await db.collection("trabajos").doc(id).update(patch);
      showAlert("ok", "Actualizado correctamente.");
      await loadTrabajos({ source: "server" });
    } catch (err) {
      showAlert("error", err.message || "No se pudo actualizar.");
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();
      if (!initClients()) {
        showAlert("warn", "Configurá Firebase en js/firebase-config.js");
        return;
      }
      var fd = new FormData(loginForm);
      try {
        await auth.signInWithEmailAndPassword(
          String(fd.get("email") || "").trim(),
          String(fd.get("password") || "")
        );
      } catch (err) {
        showAlert("error", err.message || "No se pudo iniciar sesión.");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      if (auth) await auth.signOut();
      currentUser = null;
      setWorkspaceVisible(false);
    });
  }

  if (estadoFilter) estadoFilter.addEventListener("change", function () {
    loadTrabajos().catch(function (err) {
      showAlert("error", err.message || "No se pudieron cargar las novedades.");
    });
  });
  if (refreshBtn) refreshBtn.addEventListener("click", function () {
    loadTrabajos().catch(function (err) {
      showAlert("error", err.message || "No se pudieron cargar las novedades.");
    });
  });

  if (seedBtn) {
    seedBtn.addEventListener("click", async function () {
      try {
        var n = await window.MuniApi.seedAreas();
        showAlert("ok", "Se importaron " + n + " áreas municipales. Educación y otras áreas obsoletas quedaron desactivadas.");
        await loadAreasCache();
      } catch (err) {
        showAlert("error", err.message || "No se pudieron importar las áreas.");
      }
    });
  }

  if (userForm) {
    userForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!db) return;
      var fd = new FormData(userForm);
      var uid = String(fd.get("uid") || "").trim();
      var role = fd.get("role");
      var areaSlug = String(fd.get("areaSlug") || "").trim() || null;
      var email = String(fd.get("email") || "").trim();

      if (!uid) {
        showAlert("error", "Ingresá el UID del usuario (Firebase Console → Authentication → Users).");
        return;
      }

      try {
        await db.collection("users").doc(uid).set(
          {
            role: role,
            areaSlug: role === "encargado" ? areaSlug : null,
            email: email,
            updatedAt: window.MuniFirebase.serverTimestamp(),
          },
          { merge: true }
        );
        showAlert("ok", "Perfil de usuario guardado. El usuario debe cerrar sesión y volver a entrar.");
        userForm.reset();
      } catch (err) {
        showAlert("error", err.message || "No se pudo guardar el perfil.");
      }
    });
  }

  if (newTrabajoBtn) {
    newTrabajoBtn.addEventListener("click", startNewTrabajo);
  }

  if (editForm) {
    editForm.addEventListener("submit", saveTrabajoForm);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetEditForm);
  }

  if (previewCloseBtn) previewCloseBtn.addEventListener("click", closePreview);
  if (previewBackdrop) previewBackdrop.addEventListener("click", closePreview);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && previewModal && !previewModal.hidden) {
      closePreview();
    }
  });

  if (initClients()) {
    auth.onAuthStateChanged(function (user) {
      refreshSession(user);
    });
  } else {
    showAlert("warn", "Configurá js/firebase-config.js para usar el panel admin.");
  }

  if (window.AdminFlyers) {
    window.AdminFlyers.bind({
      showAlert: showAlert,
      escapeHtml: escapeHtml,
      estadoPubLabel: estadoPubLabel,
      formatError: formatFirestoreError,
      getCurrentUser: function () {
        return currentUser;
      },
      getDb: function () {
        return db;
      },
      getStorage: function () {
        return storage;
      },
      getAreasSorted: function () {
        return areasSorted;
      },
      areasBySlug: areasBySlug,
    });
  }
})();
