(function () {
  "use strict";

  var db = null;
  var form = document.getElementById("enc-mapa-form");
  var listEl = document.getElementById("encargado-mapa-list");
  var emptyEl = document.getElementById("encargado-mapa-empty");
  var pickerEl = document.getElementById("enc-mapa-picker");
  var latInput = document.getElementById("enc-mapa-lat");
  var lngInput = document.getElementById("enc-mapa-lng");
  var tipoSelect = document.getElementById("enc-mapa-tipo");
  var radioField = document.getElementById("enc-mapa-radio-field");
  var radioInput = document.getElementById("enc-mapa-radio");
  var workspace = document.getElementById("encargado-workspace");

  var showAlert = null;
  var getSession = null;
  var picker = null;
  var puntosById = new Map();
  var sectionWatcherBound = false;

  function escapeHtml(str) {
    return window.MuniMapa ? window.MuniMapa.escapeHtml(str) : String(str || "");
  }

  function initDb() {
    if (!window.MuniFirebase || !window.MuniFirebase.isConfigured()) return false;
    window.MuniFirebase.init();
    db = window.MuniFirebase.db();
    return !!db;
  }

  function isWorkspaceVisible() {
    return workspace && !workspace.hidden;
  }

  function showPickerError(message) {
    if (!pickerEl) return;
    pickerEl.innerHTML =
      '<p class="muni-mapa-picker-error">' + escapeHtml(message) + "</p>";
  }

  function syncRadioField() {
    if (!tipoSelect || !radioField) return;
    var tipo = tipoSelect.value;
    radioField.hidden = tipo !== "contenedor";
    var obraField = document.getElementById("enc-mapa-obra-field");
    var fiField = document.getElementById("enc-mapa-fecha-inicio-field");
    var ffField = document.getElementById("enc-mapa-fecha-fin-field");
    if (obraField) obraField.hidden = tipo !== "obra";
    if (fiField) fiField.hidden = tipo !== "actividad";
    if (ffField) ffField.hidden = tipo !== "actividad";
    if (radioInput && tipo === "contenedor" && !radioInput.value) radioInput.value = "50";
  }

  function initPickerMap() {
    if (!pickerEl) return;
    if (!window.L) {
      showPickerError("No se cargó Leaflet. Volvé a subir el portal completo (carpeta vendor/leaflet incluida).");
      return;
    }
    if (!window.MuniMapa) {
      showPickerError("No se cargó el módulo del mapa (muni-mapa-core.js). Recargá con Ctrl+F5.");
      return;
    }

    if (picker && picker.map) {
      window.MuniMapa.fixMapSize(picker.map, pickerEl);
      return;
    }

    var lat = latInput && latInput.value ? parseFloat(latInput.value) : null;
    var lng = lngInput && lngInput.value ? parseFloat(lngInput.value) : null;
    var tipo = tipoSelect ? tipoSelect.value : "actividad";
    var radio = radioInput && radioInput.value ? parseFloat(radioInput.value) : 0;

    picker = window.MuniMapa.initPicker(pickerEl, {
      lat: lat,
      lng: lng,
      tipo: tipo,
      radioMetros: radio,
      onChange: function (newLat, newLng) {
        if (latInput) latInput.value = newLat.toFixed(6);
        if (lngInput) lngInput.value = newLng.toFixed(6);
      },
    });

    if (picker && picker.map) {
      window.MuniMapa.fixMapSize(picker.map, pickerEl);
    }
  }

  function ensurePickerMap() {
    if (!isWorkspaceVisible() || !pickerEl) return;
    if (picker && picker.map) {
      window.MuniMapa.fixMapSize(picker.map, pickerEl);
      return;
    }
    if (window.MuniMapa && window.MuniMapa.watchWhenVisible) {
      window.MuniMapa.watchWhenVisible(pickerEl, initPickerMap);
    } else {
      initPickerMap();
    }
  }

  function bindSectionWatcher() {
    if (sectionWatcherBound) return;
    sectionWatcherBound = true;

    document.addEventListener("muni-panel-section-open", function (e) {
      if (e.detail && e.detail.id === "seccion-mapa") {
        ensurePickerMap();
      }
    });

    document.querySelectorAll('[href="#seccion-mapa"]').forEach(function (link) {
      link.addEventListener("click", function () {
        setTimeout(ensurePickerMap, 500);
      });
    });

    if (location.hash === "#seccion-mapa") {
      setTimeout(ensurePickerMap, 600);
    }
  }

  function refreshPickerCircle() {
    if (!picker || !latInput || !lngInput) return;
    var lat = parseFloat(latInput.value);
    var lng = parseFloat(lngInput.value);
    var radio = radioInput && radioInput.value ? parseFloat(radioInput.value) : 0;
    var tipo = tipoSelect ? tipoSelect.value : "actividad";
    if (window.MuniMapa.isValidCoord(lat, lng)) {
      picker.setPoint(lat, lng, radio, tipo);
    }
  }

  async function loadMyPuntos(uid, areaSlug) {
    if (!db || !listEl) return;
    var snap = await db
      .collection("mapa_puntos")
      .where("areaSlug", "==", areaSlug)
      .where("createdBy", "==", uid)
      .get();
    var items = [];
    snap.forEach(function (doc) {
      var data = doc.data();
      items.push({ id: doc.id, data: data });
    });
    items.sort(function (a, b) {
      var ta = a.data.updatedAt && a.data.updatedAt.toMillis ? a.data.updatedAt.toMillis() : 0;
      var tb = b.data.updatedAt && b.data.updatedAt.toMillis ? b.data.updatedAt.toMillis() : 0;
      return tb - ta;
    });

    puntosById.clear();
    if (emptyEl) emptyEl.hidden = items.length > 0;
    if (!items.length) {
      listEl.innerHTML = "";
      return;
    }

    listEl.innerHTML = items
      .map(function (row) {
        puntosById.set(row.id, row);
        var d = row.data;
        var estado = window.MuniPortal
          ? window.MuniPortal.estadoPublicacionLabel(d.estadoPublicacion)
          : d.estadoPublicacion;
        var tipo = window.MuniMapa.tipoInfo(d.tipoMapa);
        return (
          '<article class="muni-enc-item">' +
          '<div class="muni-enc-item-main">' +
          '<h3 class="muni-enc-item-title">' +
          escapeHtml(tipo.icon + " " + (d.titulo || "Punto")) +
          "</h3>" +
          (d.descripcion ? '<p class="muni-enc-item-bajada">' + escapeHtml(d.descripcion) + "</p>" : "") +
          '<div class="muni-enc-item-meta">' +
          '<span class="muni-panel-badge muni-panel-badge--' +
          escapeHtml(d.estadoPublicacion) +
          '">' +
          escapeHtml(estado) +
          "</span>" +
          (d.barrio ? '<span class="muni-enc-item-date">' + escapeHtml(d.barrio) + "</span>" : "") +
          "</div></div></article>"
        );
      })
      .join("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!initDb() || !form) return;
    var session = getSession ? getSession() : null;
    if (!session || !session.user || !session.area) {
      if (showAlert) showAlert("error", "No hay sesión activa.");
      return;
    }

    var fd = new FormData(form);
    var lat = parseFloat(fd.get("lat"));
    var lng = parseFloat(fd.get("lng"));
    if (!window.MuniMapa.isValidCoord(lat, lng)) {
      if (showAlert) showAlert("error", "Marcá la ubicación en el mapa (clic en el punto).");
      return;
    }

    var tipoMapa = String(fd.get("tipoMapa") || "actividad");
    var radioMetros = fd.get("radioMetros") ? parseFloat(fd.get("radioMetros")) : null;

    var payload = {
      titulo: String(fd.get("titulo") || "").trim(),
      descripcion: String(fd.get("descripcion") || "").trim(),
      tipoMapa: tipoMapa,
      lat: lat,
      lng: lng,
      barrio: String(fd.get("barrio") || "").trim(),
      areaSlug: session.area.slug,
      areaNombre: session.area.nombre,
      estadoPublicacion: "pendiente",
      createdBy: session.user.uid,
      updatedAt: window.MuniFirebase.serverTimestamp(),
    };
    if (radioMetros > 0 && tipoMapa === "contenedor") {
      payload.radioMetros = radioMetros;
    }
    if (tipoMapa === "obra") {
      payload.estadoObra = fd.get("estadoObra") || "en_curso";
    }
    if (tipoMapa === "actividad") {
      var fi = String(fd.get("fechaInicio") || "").trim();
      var ff = String(fd.get("fechaFin") || "").trim();
      if (fi) payload.fechaInicio = fi;
      if (ff) payload.fechaFin = ff || fi;
    }

    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      payload.createdAt = window.MuniFirebase.serverTimestamp();
      await db.collection("mapa_puntos").add(payload);
      if (showAlert) showAlert("ok", "Punto enviado al mapa. Quedó pendiente de aprobación del administrador.");
      form.reset();
      if (latInput) latInput.value = "";
      if (lngInput) lngInput.value = "";
      syncRadioField();
      initPickerMap();
      await loadMyPuntos(session.user.uid, session.area.slug);
    } catch (err) {
      if (showAlert) showAlert("error", (err && err.message) || "No se pudo guardar el punto.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  window.EncargadoMapa = {
    bind: function (options) {
      showAlert = options && options.showAlert;
      getSession = options && options.getSession;

      syncRadioField();
      bindSectionWatcher();

      if (tipoSelect) {
        tipoSelect.addEventListener("change", function () {
          syncRadioField();
          refreshPickerCircle();
        });
      }
      if (radioInput) radioInput.addEventListener("change", refreshPickerCircle);
      if (form) form.addEventListener("submit", onSubmit);
    },
    refresh: function (uid, areaSlug) {
      if (!initDb()) return Promise.resolve();
      setTimeout(ensurePickerMap, 500);
      return loadMyPuntos(uid, areaSlug);
    },
  };
})();
