(function () {
  "use strict";

  var db = null;
  var storage = null;
  var auth = null;
  var flyerForm = document.getElementById("flyer-form");
  var flyerList = document.getElementById("encargado-flyers-list");
  var flyerEmpty = document.getElementById("encargado-flyers-empty");
  var showAlert = null;

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatError(err, fallback) {
    return (err && err.message) || fallback || String(err);
  }

  function initClients() {
    if (!window.MuniFirebase || !window.MuniFirebase.isConfigured()) return false;
    window.MuniFirebase.init();
    auth = window.MuniFirebase.auth();
    db = window.MuniFirebase.db();
    storage = window.MuniFirebase.storage();
    return !!(auth && db && storage);
  }

  function setDefaultEventDate() {
    var input = document.getElementById("flyer-fecha-evento");
    if (input && !input.value && window.MuniApi && window.MuniApi.todayIsoArgentina) {
      var today = window.MuniApi.todayIsoArgentina();
      input.min = today;
    }
  }

  async function uploadFlyer(file, uid) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = "municipal-flyers/" + uid + "/" + Date.now() + "." + ext;
    var ref = storage.ref(path);
    await ref.put(file, { cacheControl: "public,max-age=31536000" });
    return ref.getDownloadURL();
  }

  async function loadMyFlyers(uid, areaSlug) {
    if (!db || !flyerList) return;
    var snap;
    try {
      snap = await db.collection("eventos_flyers").where("createdBy", "==", uid).get();
    } catch (err) {
      if (showAlert) showAlert("error", formatError(err, "No se pudieron cargar tus flyers."));
      return;
    }

    var items = [];
    snap.forEach(function (doc) {
      var data = doc.data();
      if (data.areaSlug !== areaSlug) return;
      var fecha = String(data.fechaEvento || "").slice(0, 10);
      var today =
        window.MuniApi && window.MuniApi.todayIsoArgentina
          ? window.MuniApi.todayIsoArgentina()
          : new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
      if (!fecha || fecha < today) return;
      items.push({ id: doc.id, data: data });
    });
    items.sort(function (a, b) {
      return String(b.data.fechaEvento || "").localeCompare(String(a.data.fechaEvento || ""));
    });

    if (flyerEmpty) flyerEmpty.hidden = items.length > 0;
    if (!items.length) {
      flyerList.innerHTML = "";
      return;
    }

    flyerList.innerHTML = items
      .map(function (row) {
        var d = row.data;
        var estado = window.MuniPortal
          ? window.MuniPortal.estadoPublicacionLabel(d.estadoPublicacion)
          : d.estadoPublicacion;
        return (
          '<article class="muni-enc-flyer-item">' +
          (d.imagenUrl
            ? '<img class="muni-enc-flyer-thumb" src="' + escapeHtml(d.imagenUrl) + '" alt="" width="52" height="92">'
            : "") +
          '<div class="muni-enc-flyer-body">' +
          "<strong>" + escapeHtml(d.titulo || "Flyer de evento") + "</strong>" +
          '<div class="muni-enc-flyer-meta">' +
          "<span>📅 " + escapeHtml(d.fechaEvento || "—") + "</span>" +
          '<span class="muni-panel-badge muni-panel-badge--' + escapeHtml(d.estadoPublicacion) + '">' +
          escapeHtml(estado) +
          "</span></div></div></article>"
        );
      })
      .join("");
  }

  async function onFlyerSubmit(e) {
    e.preventDefault();
    if (!initClients()) return;

    var user = auth.currentUser;
    if (!user) {
      if (showAlert) showAlert("error", "No hay sesión activa.");
      return;
    }

    var profile = await window.MuniApi.getUserProfile(user.uid);
    if (!profile || profile.role !== "encargado" || !profile.areaSlug) {
      if (showAlert) showAlert("error", "No se pudo verificar tu área.");
      return;
    }

    var fd = new FormData(flyerForm);
    var fechaEvento = String(fd.get("fecha_evento") || "").trim();
    var titulo = String(fd.get("titulo") || "").trim();
    var file = fd.get("flyer_archivo");

    if (!fechaEvento) {
      if (showAlert) showAlert("error", "Indicá la fecha del evento.");
      return;
    }
    if (window.MuniApi && fechaEvento < window.MuniApi.todayIsoArgentina()) {
      if (showAlert) showAlert("error", "La fecha del evento no puede ser anterior a hoy.");
      return;
    }
    if (!file || !file.size) {
      if (showAlert) showAlert("error", "Subí el archivo del flyer (vertical).");
      return;
    }

    var submitBtn = flyerForm.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      var imagenUrl = await uploadFlyer(file, user.uid);
      await db.collection("eventos_flyers").add({
        areaSlug: profile.areaSlug,
        titulo: titulo || "Evento municipal",
        imagenUrl: imagenUrl,
        fechaEvento: fechaEvento,
        estadoPublicacion: "pendiente",
        createdBy: user.uid,
        createdAt: window.MuniFirebase.serverTimestamp(),
        updatedAt: window.MuniFirebase.serverTimestamp(),
      });
      if (showAlert) {
        showAlert("ok", "Flyer enviado. Quedó pendiente de aprobación del administrador.");
      }
      flyerForm.reset();
      setDefaultEventDate();
      await loadMyFlyers(user.uid, profile.areaSlug);
    } catch (err) {
      if (showAlert) showAlert("error", formatError(err, "No se pudo guardar el flyer."));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  window.EncargadoFlyers = {
    bind: function (options) {
      showAlert = options && options.showAlert;
      setDefaultEventDate();
      if (flyerForm) flyerForm.addEventListener("submit", onFlyerSubmit);
    },
    refresh: function (uid, areaSlug) {
      if (!initClients()) return Promise.resolve();
      return loadMyFlyers(uid, areaSlug);
    },
  };
})();
