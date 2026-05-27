(function () {
  "use strict";

  var auth = null;
  var db = null;
  var storage = null;

  var alertBox = document.getElementById("encargado-alert");
  var loginForm = document.getElementById("encargado-login-form");
  var authPanel = document.getElementById("encargado-auth");
  var workspace = document.getElementById("encargado-workspace");
  var authEmail = document.getElementById("encargado-email");
  var logoutBtn = document.getElementById("encargado-logout");
  var areaLabel = document.getElementById("encargado-area-name");
  var trabajoForm = document.getElementById("trabajo-form");
  var trabajosList = document.getElementById("encargado-trabajos");
  var trabajosEmpty = document.getElementById("encargado-trabajos-empty");
  var formTitle = document.getElementById("trabajo-form-title");
  var cancelEditBtn = document.getElementById("trabajo-cancel-edit");

  var currentUser = null;
  var userProfile = null;
  var userArea = null;
  var editingId = null;
  var trabajosById = new Map();
  var sessionToken = 0;
  var lastAuthUid = null;
  var sessionReady = false;
  var authNullTimer = null;
  var AUTH_NULL_DELAY_MS = 1200;
  var manualLogout = false;

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
  }

  function hideAlert() {
    if (alertBox) alertBox.hidden = true;
  }

  function formatError(error, fallback) {
    return (error && error.message) || fallback;
  }

  function setWorkspaceVisible(visible) {
    if (authPanel) authPanel.hidden = visible;
    if (workspace) workspace.hidden = !visible;
  }

  function resolveAuthUser(user) {
    if (user) return user;
    if (auth && auth.currentUser) return auth.currentUser;
    return null;
  }

  function clearAuthNullTimer() {
    if (authNullTimer) {
      clearTimeout(authNullTimer);
      authNullTimer = null;
    }
  }

  function confirmSignedOut() {
    if (manualLogout) {
      manualLogout = false;
      return;
    }
    if (auth && auth.currentUser) return;

    sessionToken += 1;
    if (sessionReady || lastAuthUid) {
      showAlert("warn", "Tu sesion finalizo. Volve a ingresar con tu email y contrasena.");
    }
    lastAuthUid = null;
    sessionReady = false;
    currentUser = null;
    userProfile = null;
    userArea = null;
    setWorkspaceVisible(false);
  }

  function scheduleSignedOutCheck() {
    clearAuthNullTimer();
    authNullTimer = setTimeout(function () {
      authNullTimer = null;
      confirmSignedOut();
    }, AUTH_NULL_DELAY_MS);
  }

  function handleAuthChange(user) {
    if (!initClients()) {
      showAlert("warn", "Configura js/firebase-config.js antes de usar el panel de encargados.");
      return;
    }

    var resolved = resolveAuthUser(user);
    if (resolved) {
      clearAuthNullTimer();
      refreshSession(resolved).catch(function (err) {
        console.error("refreshSession", err);
        showAlert("error", "Error al verificar la sesion: " + formatError(err, "Error desconocido"));
      });
      return;
    }

    if (sessionReady || lastAuthUid) {
      scheduleSignedOutCheck();
      return;
    }

    confirmSignedOut();
  }

  async function resolveUserArea(areaSlug) {
    if (!db || !areaSlug) return null;
    try {
      var snap = await db.collection("areas").doc(areaSlug).get({ source: "server" });
      if (!snap.exists) return null;
      return window.MuniApi.mapArea(snap.id, snap.data());
    } catch (err) {
      console.error("resolveUserArea", err);
      return null;
    }
  }

  async function refreshSession(user) {
    user = resolveAuthUser(user);
    if (!user) return;

    if (sessionReady && user.uid === lastAuthUid && userArea && userProfile) {
      currentUser = user;
      return;
    }

    var token = ++sessionToken;
    currentUser = user;
    var uid = currentUser.uid;

    var profile = null;
    try {
      profile = await window.MuniApi.getUserProfile(uid);
      if (!profile && token === sessionToken) {
        await new Promise(function (resolve) {
          setTimeout(resolve, 400);
        });
        profile = await window.MuniApi.getUserProfile(uid);
      }
    } catch (err) {
      if (token !== sessionToken) return;
      showAlert(
        "error",
        "No se pudo leer tu perfil en Firestore. Publica las reglas de firebase/firestore.rules. Detalle: " +
          formatError(err, "Error de permisos")
      );
      setWorkspaceVisible(false);
      return;
    }

    if (token !== sessionToken) return;

    if (!profile) {
      showAlert(
        "error",
        "No existe users/" +
          uid +
          " en Firestore. Pedile al administrador que te asigne rol encargado con tu UID."
      );
      setWorkspaceVisible(false);
      return;
    }

    if (profile.role !== "encargado") {
      manualLogout = true;
      await auth.signOut();
      if (token !== sessionToken) return;
      showAlert(
        "error",
        'Tu perfil tiene role "' + profile.role + '". Se necesita "encargado" para usar este panel.'
      );
      setWorkspaceVisible(false);
      return;
    }

    if (!profile.areaSlug) {
      showAlert(
        "error",
        "Tu usuario no tiene area asignada (areaSlug vacio). El administrador debe asignarte un area desde admin.html."
      );
      setWorkspaceVisible(false);
      return;
    }

    userProfile = profile;
    userArea = await resolveUserArea(profile.areaSlug);
    if (token !== sessionToken) return;

    if (!userArea) {
      showAlert(
        "error",
        'No se encontro el area "' +
          profile.areaSlug +
          '" en Firestore. El administrador debe hacer clic en "Importar areas municipales" en admin.html.'
      );
      setWorkspaceVisible(false);
      return;
    }

    if (authEmail) authEmail.textContent = currentUser.email || "";
    if (areaLabel) areaLabel.textContent = userArea.nombre;
    setWorkspaceVisible(true);
    lastAuthUid = uid;
    sessionReady = true;
    hideAlert();
    await loadMyTrabajos(token);
    if (window.EncargadoFlyers) {
      await window.EncargadoFlyers.refresh(uid, profile.areaSlug);
    }
  }

  async function loadMyTrabajos(token) {
    if (!db || !userArea) return;

    var snap;
    try {
      snap = await db
        .collection("trabajos")
        .where("areaSlug", "==", userArea.slug)
        .orderBy("updatedAt", "desc")
        .get();
    } catch (err) {
      if (token != null && token !== sessionToken) return;
      var needsIndex =
        (err && err.code === "failed-precondition") ||
        (err && err.message && err.message.indexOf("index") !== -1);
      if (!needsIndex) {
        showAlert("error", formatError(err, "No se pudieron cargar tus novedades."));
        return;
      }
      try {
        snap = await db.collection("trabajos").where("areaSlug", "==", userArea.slug).get();
      } catch (fallbackErr) {
        showAlert("error", formatError(fallbackErr, "No se pudieron cargar tus novedades."));
        return;
      }
    }

    if (token != null && token !== sessionToken) return;

    trabajosById = new Map();
    var rows = [];
    snap.forEach(function (doc) {
      var data = doc.data();
      var row = {
        id: doc.id,
        titulo: data.titulo,
        bajada: data.bajada,
        estadoPublicacion: data.estadoPublicacion,
        estadoObra: data.estadoObra,
        fechaPublicacion: data.fechaPublicacion,
        updatedAt: data.updatedAt,
      };
      rows.push(row);
      trabajosById.set(doc.id, { id: doc.id, data: data });
    });

    rows.sort(function (a, b) {
      var ta = a.updatedAt && a.updatedAt.toMillis ? a.updatedAt.toMillis() : 0;
      var tb = b.updatedAt && b.updatedAt.toMillis ? b.updatedAt.toMillis() : 0;
      return tb - ta;
    });

    if (!trabajosList) return;
    if (!rows.length) {
      trabajosList.innerHTML = "";
      if (trabajosEmpty) trabajosEmpty.hidden = false;
      return;
    }
    if (trabajosEmpty) trabajosEmpty.hidden = true;

    trabajosList.innerHTML = rows
      .map(function (row) {
        return (
          '<article class="muni-panel-item">' +
          "<div>" +
          "<h3>" + escapeHtml(row.titulo) + "</h3>" +
          '<p class="muni-panel-item-meta">' +
          '<span class="muni-status muni-status--' + escapeHtml(row.estadoObra) + '">' +
          estadoObraLabel(row.estadoObra) +
          "</span> ? " +
          '<span class="muni-panel-badge muni-panel-badge--' + escapeHtml(row.estadoPublicacion) + '">' +
          estadoPubLabel(row.estadoPublicacion) +
          "</span>" +
          "</p>" +
          "</div>" +
          '<div class="muni-panel-item-actions">' +
          '<button type="button" class="muni-btn muni-btn--ghost" data-edit="' + row.id + '">Editar</button>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    trabajosList.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startEdit(btn.getAttribute("data-edit"));
      });
    });
  }

  function escapeHtml(str) {
    return window.MuniPortal ? window.MuniPortal.escapeHtml(str) : String(str || "");
  }

  function estadoObraLabel(v) {
    return window.MuniPortal ? window.MuniPortal.estadoLabel(v) : v;
  }

  function estadoPubLabel(v) {
    return window.MuniPortal ? window.MuniPortal.estadoPublicacionLabel(v) : v;
  }

  function resetForm() {
    editingId = null;
    if (trabajoForm) trabajoForm.reset();
    if (formTitle) formTitle.textContent = "Nueva novedad";
    if (cancelEditBtn) cancelEditBtn.hidden = true;
    var today = new Date().toISOString().slice(0, 10);
    var fp = trabajoForm && trabajoForm.querySelector('[name="fecha_publicacion"]');
    if (fp && !fp.value) fp.value = today;
  }

  function startEdit(id) {
    var row = trabajosById.get(id);
    if (!row || !trabajoForm) return;

    var t = row.data;
    editingId = id;
    if (formTitle) formTitle.textContent = "Editar novedad";
    if (cancelEditBtn) cancelEditBtn.hidden = false;

    trabajoForm.titulo.value = t.titulo;
    trabajoForm.bajada.value = t.bajada;
    trabajoForm.cuerpo.value = String(t.cuerpo || "").replace(/<[^>]+>/g, "\n").trim();
    trabajoForm.ubicacion.value = t.ubicacion || "";
    trabajoForm.barrio.value = t.barrio || "";
    trabajoForm.estado_obra.value = t.estadoObra;
    trabajoForm.fecha_publicacion.value = t.fechaPublicacion;
    trabajoForm.imagen_url.value = t.imagenUrl || "";
    trabajoForm.scrollIntoView({ behavior: "smooth" });
  }

  async function uploadImage(file) {
    var liveUser = resolveAuthUser(currentUser);
    if (!file || !storage || !liveUser) return null;
    currentUser = liveUser;
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = "municipal-images/" + currentUser.uid + "/" + Date.now() + "." + ext;
    var ref = storage.ref(path);
    await ref.put(file, { cacheControl: "public,max-age=31536000" });
    return ref.getDownloadURL();
  }

  function buildCuerpoHtml(text) {
    return text
      .split(/\n\s*\n/)
      .map(function (p) {
        return "<p>" + escapeHtml(p.trim()).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  async function saveTrabajo(event) {
    event.preventDefault();
    clearAuthNullTimer();

    var liveUser = resolveAuthUser(currentUser);
    if (!db || !userArea || !liveUser) {
      showAlert("error", "No hay sesion activa. Espera un momento e intenta de nuevo sin recargar la pagina.");
      return;
    }
    currentUser = liveUser;

    var submitBtn = trabajoForm && trabajoForm.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    var fd = new FormData(trabajoForm);
    var payload = {
      areaSlug: userArea.slug,
      titulo: String(fd.get("titulo") || "").trim(),
      bajada: String(fd.get("bajada") || "").trim(),
      cuerpo: buildCuerpoHtml(String(fd.get("cuerpo") || "").trim()),
      ubicacion: String(fd.get("ubicacion") || "").trim(),
      barrio: String(fd.get("barrio") || "").trim(),
      estadoObra: fd.get("estado_obra"),
      fechaPublicacion: fd.get("fecha_publicacion"),
      estadoPublicacion: "pendiente",
      imagenUrl: String(fd.get("imagen_url") || "").trim() || null,
      createdBy: currentUser.uid,
      updatedAt: window.MuniFirebase.serverTimestamp(),
    };

    var file = fd.get("imagen_archivo");
    if (file && file.size > 0) {
      try {
        payload.imagenUrl = await uploadImage(file);
      } catch (err) {
        showAlert("error", formatError(err, "Error al subir la imagen."));
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
    }

    liveUser = resolveAuthUser(currentUser);
    if (!liveUser) {
      showAlert("error", "La sesion se interrumpio al guardar. Volv? a ingresar y revisa si la novedad qued? en Mis novedades.");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    currentUser = liveUser;
    payload.createdBy = currentUser.uid;

    try {
      if (editingId) {
        await db.collection("trabajos").doc(editingId).update(payload);
      } else {
        payload.createdAt = window.MuniFirebase.serverTimestamp();
        await db.collection("trabajos").add(payload);
      }
    } catch (err) {
      showAlert("error", formatError(err, "No se pudo guardar la novedad."));
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    showAlert(
      "ok",
      editingId
        ? "Novedad actualizada. Quedo pendiente de aprobacion."
        : "Novedad enviada. Quedo pendiente de aprobacion del administrador."
    );
    resetForm();
    await loadMyTrabajos(sessionToken);
    if (submitBtn) submitBtn.disabled = false;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();
      clearAuthNullTimer();
      if (!initClients()) {
        showAlert("warn", "Configura Firebase en js/firebase-config.js");
        return;
      }
      var fd = new FormData(loginForm);
      try {
        await auth.signInWithEmailAndPassword(
          String(fd.get("email") || "").trim(),
          String(fd.get("password") || "")
        );
      } catch (err) {
        showAlert("error", formatError(err, "No se pudo iniciar sesion."));
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      clearAuthNullTimer();
      manualLogout = true;
      sessionToken += 1;
      lastAuthUid = null;
      sessionReady = false;
      if (auth) await auth.signOut();
      currentUser = null;
      userProfile = null;
      userArea = null;
      setWorkspaceVisible(false);
      resetForm();
    });
  }

  if (trabajoForm) {
    trabajoForm.addEventListener("submit", saveTrabajo);
    resetForm();
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetForm);
  }

  if (initClients()) {
    auth.onAuthStateChanged(handleAuthChange);
  } else {
    showAlert("warn", "Configura js/firebase-config.js para usar el panel de encargados.");
  }

  if (window.EncargadoFlyers) {
    window.EncargadoFlyers.bind({ showAlert: showAlert });
  }
})();
