(function () {
  "use strict";

  var DOC_ID = "anuncio_entrada";
  var db = null;
  var storage = null;
  var showAlert = null;
  var escapeHtml = null;
  var formatError = null;
  var getCurrentUser = null;
  var getDb = null;
  var getStorage = null;

  var form = null;
  var activoInput = null;
  var tituloInput = null;
  var enlaceInput = null;
  var archivoInput = null;
  var previewImg = null;
  var previewEmpty = null;
  var submitBtn = null;
  var deactivateBtn = null;

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

  function setSubmitLoading(loading) {
    if (!submitBtn) return;
    if (loading) {
      if (!submitBtn.dataset.defaultLabel) {
        submitBtn.dataset.defaultLabel = submitBtn.textContent;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando…";
      return;
    }
    submitBtn.disabled = false;
    submitBtn.textContent = submitBtn.dataset.defaultLabel || "Publicar anuncio";
  }

  function updatePreview(url, titulo) {
    if (previewImg) {
      if (url) {
        previewImg.src = url;
        previewImg.alt = titulo || "Vista previa del anuncio";
        previewImg.hidden = false;
      } else {
        previewImg.removeAttribute("src");
        previewImg.hidden = true;
      }
    }
    if (previewEmpty) previewEmpty.hidden = !!url;
  }

  async function loadCurrent() {
    if (!resolveClients()) return;
    var snap = await db.collection("portal_config").doc(DOC_ID).get();
    if (!snap.exists) {
      updatePreview("", "");
      return;
    }
    var data = snap.data();
    if (activoInput) activoInput.checked = !!data.activo;
    if (tituloInput) tituloInput.value = data.titulo || "";
    if (enlaceInput) enlaceInput.value = data.enlaceUrl || "";
    updatePreview(data.imagenUrl || "", data.titulo || "");
  }

  async function uploadImage(file, uid) {
    var auth = window.MuniFirebase && window.MuniFirebase.auth ? window.MuniFirebase.auth() : null;
    if (auth && auth.currentUser && auth.currentUser.getIdToken) {
      await auth.currentUser.getIdToken(true);
    }

    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = "portal-anuncios/" + uid + "/" + Date.now() + "." + ext;
    var ref = storage.ref(path);
    await ref.put(file, { contentType: file.type || "image/jpeg" });
    return ref.getDownloadURL();
  }

  async function saveAnuncio(e) {
    if (e) e.preventDefault();
    if (!resolveClients()) {
      showAlert("warn", "Firebase no está configurado.");
      return;
    }

    var user = resolveUser();
    if (!user) {
      showAlert("error", "Tenés que iniciar sesión como administrador.");
      return;
    }

    var activo = activoInput ? activoInput.checked : false;
    var titulo = tituloInput ? String(tituloInput.value || "").trim() : "";
    var enlaceUrl = enlaceInput ? String(enlaceInput.value || "").trim() : "";
    var file = archivoInput && archivoInput.files && archivoInput.files[0] ? archivoInput.files[0] : null;

    var snap = await db.collection("portal_config").doc(DOC_ID).get();
    var current = snap.exists ? snap.data() : {};
    var imagenUrl = current.imagenUrl || "";

    if (!imagenUrl && !file) {
      showAlert("error", "Subí una imagen para el anuncio.");
      return;
    }

    setSubmitLoading(true);
    try {
      if (file) {
        var compressed = file;
        if (window.MuniImageCompress && window.MuniImageCompress.compressImageFile) {
          compressed = await window.MuniImageCompress.compressImageFile(file, {
            maxWidth: 1400,
            maxHeight: 1800,
            quality: 0.88,
          });
        }
        imagenUrl = await uploadImage(compressed, user.uid);
      }

      var version = String(Date.now());
      var payload = {
        activo: activo,
        imagenUrl: imagenUrl,
        titulo: titulo || "Anuncio municipal",
        enlaceUrl: enlaceUrl,
        version: version,
        updatedAt: window.MuniFirebase.serverTimestamp(),
        updatedBy: user.uid,
      };

      await db.collection("portal_config").doc(DOC_ID).set(payload, { merge: true });
      updatePreview(imagenUrl, payload.titulo);
      if (archivoInput) archivoInput.value = "";
      showAlert(
        "ok",
        activo
          ? "Anuncio publicado. Los visitantes lo verán al entrar al portal (hasta que lo cierren)."
          : "Anuncio guardado pero desactivado. No se mostrará en el portal."
      );
    } catch (err) {
      console.error("saveAnuncio", err);
      showAlert("error", formatError ? formatError(err, "No se pudo guardar el anuncio.") : err.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function deactivateAnuncio() {
    if (!resolveClients()) return;
    if (!window.confirm("¿Desactivar el anuncio? Dejará de mostrarse en la página de inicio.")) return;
    try {
      await db.collection("portal_config").doc(DOC_ID).set(
        {
          activo: false,
          version: String(Date.now()),
          updatedAt: window.MuniFirebase.serverTimestamp(),
        },
        { merge: true }
      );
      if (activoInput) activoInput.checked = false;
      showAlert("ok", "Anuncio desactivado.");
    } catch (err) {
      showAlert("error", formatError ? formatError(err, "No se pudo desactivar.") : err.message);
    }
  }

  function bind(options) {
    showAlert = options.showAlert;
    escapeHtml = options.escapeHtml;
    formatError = options.formatError;
    getCurrentUser = options.getCurrentUser;
    getDb = options.getDb;
    getStorage = options.getStorage;

    form = document.getElementById("admin-anuncio-form");
    activoInput = document.getElementById("admin-anuncio-activo");
    tituloInput = document.getElementById("admin-anuncio-titulo");
    enlaceInput = document.getElementById("admin-anuncio-enlace");
    archivoInput = document.getElementById("admin-anuncio-archivo");
    previewImg = document.getElementById("admin-anuncio-preview-img");
    previewEmpty = document.getElementById("admin-anuncio-preview-empty");
    submitBtn = document.getElementById("admin-anuncio-submit");
    deactivateBtn = document.getElementById("admin-anuncio-deactivate");

    if (form) form.addEventListener("submit", saveAnuncio);
    if (deactivateBtn) deactivateBtn.addEventListener("click", deactivateAnuncio);
    if (archivoInput) {
      archivoInput.addEventListener("change", function () {
        var file = archivoInput.files && archivoInput.files[0];
        if (!file) return;
        var url = URL.createObjectURL(file);
        updatePreview(url, tituloInput ? tituloInput.value : "");
      });
    }

    loadCurrent().catch(function (err) {
      console.warn("No se pudo cargar el anuncio actual.", err);
    });
  }

  window.AdminAnuncio = { bind: bind, refresh: loadCurrent };
})();
