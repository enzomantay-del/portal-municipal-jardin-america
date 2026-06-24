(function () {
  "use strict";

  var db = null;
  var form = document.getElementById("admin-mapa-form");
  var listEl = document.getElementById("admin-mapa-list");
  var emptyEl = document.getElementById("admin-mapa-empty");
  var filterEl = document.getElementById("admin-mapa-filter");
  var refreshBtn = document.getElementById("admin-mapa-refresh");
  var pickerEl = document.getElementById("admin-mapa-picker");
  var latInput = document.getElementById("admin-mapa-lat");
  var lngInput = document.getElementById("admin-mapa-lng");
  var tipoSelect = document.getElementById("admin-mapa-tipo");
  var radioField = document.getElementById("admin-mapa-radio-field");
  var radioInput = document.getElementById("admin-mapa-radio");
  var areaSelect = document.getElementById("admin-mapa-area");
  var editIdInput = document.getElementById("admin-mapa-edit-id");
  var formTitleEl = document.getElementById("admin-mapa-form-title");
  var formHelpEl = document.getElementById("admin-mapa-form-help");
  var submitBtn = document.getElementById("admin-mapa-submit");
  var cancelEditBtn = document.getElementById("admin-mapa-cancel-edit");

  var showAlert = null;
  var escapeHtml = null;
  var estadoPubLabel = null;
  var getAreasSorted = null;
  var getCurrentUser = null;
  var getDb = null;
  var formatError = null;
  var areasBySlug = new Map();
  var puntosById = new Map();
  var picker = null;
  var sectionWatcherBound = false;
  var workspace = document.getElementById("admin-workspace");
  var editingId = null;

  function resolveDb() {
    if (getDb) db = getDb();
    else if (window.MuniFirebase && window.MuniFirebase.isConfigured()) {
      window.MuniFirebase.init();
      db = window.MuniFirebase.db();
    }
    return !!db;
  }

  function syncRadioField() {
    if (!tipoSelect) return;
    var tipo = tipoSelect.value;
    if (radioField) radioField.hidden = tipo !== "contenedor";
    var obraField = document.getElementById("admin-mapa-obra-field");
    var fiField = document.getElementById("admin-mapa-fecha-inicio-field");
    var ffField = document.getElementById("admin-mapa-fecha-fin-field");
    if (obraField) obraField.hidden = tipo !== "obra";
    if (fiField) fiField.hidden = tipo !== "actividad";
    if (ffField) ffField.hidden = tipo !== "actividad";
  }

  function isWorkspaceVisible() {
    return workspace && !workspace.hidden;
  }

  function showPickerError(message) {
    if (!pickerEl) return;
    var esc = escapeHtml || function (s) {
      return s;
    };
    pickerEl.innerHTML = '<p class="muni-mapa-picker-error">' + esc(message) + "</p>";
  }

  function destroyPicker() {
    picker = null;
    if (pickerEl && pickerEl._leaflet_map) {
      pickerEl._leaflet_map.remove();
      pickerEl._leaflet_map = null;
    }
    if (pickerEl) pickerEl.innerHTML = "";
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
    picker = window.MuniMapa.initPicker(pickerEl, {
      lat: lat,
      lng: lng,
      tipo: tipoSelect ? tipoSelect.value : "actividad",
      radioMetros: radioInput && radioInput.value ? parseFloat(radioInput.value) : 0,
      onChange: function (newLat, newLng) {
        if (latInput) latInput.value = newLat.toFixed(6);
        if (lngInput) lngInput.value = newLng.toFixed(6);
      },
    });
    if (picker && picker.map) {
      window.MuniMapa.fixMapSize(picker.map, pickerEl);
    }
  }

  function reloadPickerMap() {
    destroyPicker();
    initPickerMap();
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

  function populateAreas() {
    if (!areaSelect || !getAreasSorted) return;
    var areas = getAreasSorted();
    areaSelect.innerHTML = areas
      .map(function (a) {
        return (
          '<option value="' +
          (escapeHtml ? escapeHtml(a.slug) : a.slug) +
          '">' +
          (escapeHtml ? escapeHtml(a.nombre) : a.nombre) +
          "</option>"
        );
      })
      .join("");
  }

  function setEditMode(active) {
    if (cancelEditBtn) cancelEditBtn.hidden = !active;
    if (submitBtn) submitBtn.textContent = active ? "Guardar cambios" : "Guardar punto";
    if (formTitleEl) formTitleEl.textContent = active ? "Editar punto" : "Cargar punto";
    if (formHelpEl) {
      formHelpEl.textContent = active
        ? "Modificá los datos y la ubicación. Los cambios aplican aunque el punto lo haya cargado un encargado."
        : "Completá el formulario y marcá la ubicación en el mapa.";
    }
  }

  function clearEditMode() {
    editingId = null;
    if (editIdInput) editIdInput.value = "";
    setEditMode(false);
    if (form) form.reset();
    if (latInput) latInput.value = "";
    if (lngInput) lngInput.value = "";
    syncRadioField();
    reloadPickerMap();
  }

  function startEdit(id) {
    var row = puntosById.get(id);
    if (!row || !form) return;
    var d = row.data;

    editingId = id;
    if (editIdInput) editIdInput.value = id;
    setEditMode(true);

    if (tipoSelect) tipoSelect.value = d.tipoMapa || "actividad";
    if (areaSelect && d.areaSlug) areaSelect.value = d.areaSlug;
    if (form.titulo) form.titulo.value = d.titulo || "";
    if (form.descripcion) form.descripcion.value = d.descripcion || "";
    if (form.barrio) form.barrio.value = d.barrio || "";
    if (form.estado_publicacion) form.estado_publicacion.value = d.estadoPublicacion || "pendiente";

    var estadoObra = document.getElementById("admin-mapa-estado-obra");
    if (estadoObra) estadoObra.value = d.estadoObra || "en_curso";

    var fi = document.getElementById("admin-mapa-fecha-inicio");
    var ff = document.getElementById("admin-mapa-fecha-fin");
    if (fi) fi.value = d.fechaInicio || "";
    if (ff) ff.value = d.fechaFin || "";

    if (radioInput) {
      radioInput.value = d.radioMetros != null && d.radioMetros > 0 ? String(d.radioMetros) : "";
    }

    if (latInput && d.lat != null) latInput.value = Number(d.lat).toFixed(6);
    if (lngInput && d.lng != null) lngInput.value = Number(d.lng).toFixed(6);

    syncRadioField();
    reloadPickerMap();

    var block = document.getElementById("admin-mapa-form-title");
    if (block && block.scrollIntoView) {
      block.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderRow(id, data) {
    var esc = escapeHtml || function (s) {
      return s;
    };
    var estado = estadoPubLabel ? estadoPubLabel(data.estadoPublicacion) : data.estadoPublicacion;
    var tipo = window.MuniMapa.tipoInfo(data.tipoMapa);
    var areaNombre = areasBySlug.get(data.areaSlug) || data.areaNombre || data.areaSlug;
    return (
      '<article class="muni-panel-item muni-mapa-admin-row">' +
      "<div>" +
      "<h3>" +
      esc(tipo.icon + " " + (data.titulo || "Punto")) +
      "</h3>" +
      '<p class="muni-panel-item-meta">' +
      esc(window.MuniMapa.tipoLabel(data.tipoMapa)) +
      " · " +
      esc(areaNombre) +
      (data.barrio ? " · " + esc(data.barrio) : "") +
      "</p>" +
      '<span class="muni-panel-badge muni-panel-badge--' +
      esc(data.estadoPublicacion) +
      '">' +
      esc(estado) +
      "</span>" +
      "</div>" +
      '<div class="muni-panel-item-actions muni-panel-item-actions--stack">' +
      '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-mapa-action="editar" data-id="' +
      esc(id) +
      '">Editar</button>' +
      (data.estadoPublicacion !== "publicado"
        ? '<button type="button" class="muni-btn muni-btn--primary muni-btn--sm" data-mapa-action="publicar" data-id="' +
          esc(id) +
          '">Publicar</button>'
        : "") +
      (data.estadoPublicacion === "pendiente"
        ? '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-mapa-action="rechazar" data-id="' +
          esc(id) +
          '">Rechazar</button>'
        : "") +
      '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-mapa-action="eliminar" data-id="' +
      esc(id) +
      '">Eliminar</button>' +
      "</div></article>"
    );
  }

  async function loadList(estado) {
    if (!resolveDb() || !listEl) return;
    estado = estado || (filterEl ? filterEl.value : "publicado");

    var snap;
    if (estado === "todos") {
      snap = await db.collection("mapa_puntos").get();
    } else {
      snap = await db.collection("mapa_puntos").where("estadoPublicacion", "==", estado).get();
    }
    var rows = [];
    puntosById.clear();
    snap.forEach(function (doc) {
      rows.push({ id: doc.id, data: doc.data() });
      puntosById.set(doc.id, { id: doc.id, data: doc.data() });
    });
    rows.sort(function (a, b) {
      return String(b.data.updatedAt || "").localeCompare(String(a.data.updatedAt || ""));
    });

    if (emptyEl) emptyEl.hidden = rows.length > 0;
    listEl.innerHTML = rows.length ? rows.map(function (r) { return renderRow(r.id, r.data); }).join("") : "";
  }

  async function updateEstado(id, estado) {
    await db.collection("mapa_puntos").doc(id).update({
      estadoPublicacion: estado,
      updatedAt: window.MuniFirebase.serverTimestamp(),
    });
  }

  function buildPayload(fd, user, isUpdate) {
    var lat = parseFloat(fd.get("lat"));
    var lng = parseFloat(fd.get("lng"));
    var areaSlug = String(fd.get("areaSlug") || "");
    var tipoMapa = String(fd.get("tipoMapa") || "actividad");
    var payload = {
      titulo: String(fd.get("titulo") || "").trim(),
      descripcion: String(fd.get("descripcion") || "").trim(),
      tipoMapa: tipoMapa,
      lat: lat,
      lng: lng,
      barrio: String(fd.get("barrio") || "").trim(),
      areaSlug: areaSlug,
      areaNombre: areasBySlug.get(areaSlug) || areaSlug,
      estadoPublicacion: String(fd.get("estado_publicacion") || "publicado").trim(),
      updatedAt: window.MuniFirebase.serverTimestamp(),
    };

    if (tipoMapa === "contenedor") {
      var radio = fd.get("radioMetros");
      if (radio) payload.radioMetros = parseFloat(radio);
      else if (isUpdate && window.firebase && firebase.firestore && firebase.firestore.FieldValue) {
        payload.radioMetros = firebase.firestore.FieldValue.delete();
      }
    } else if (isUpdate && window.firebase && firebase.firestore && firebase.firestore.FieldValue) {
      payload.radioMetros = firebase.firestore.FieldValue.delete();
    }

    if (tipoMapa === "obra") {
      payload.estadoObra = fd.get("estadoObra") || "en_curso";
    } else if (isUpdate && window.firebase && firebase.firestore && firebase.firestore.FieldValue) {
      payload.estadoObra = firebase.firestore.FieldValue.delete();
    }

    if (tipoMapa === "actividad") {
      var fi = String(fd.get("fechaInicio") || "").trim();
      var ff = String(fd.get("fechaFin") || "").trim();
      if (fi) {
        payload.fechaInicio = fi;
        payload.fechaFin = ff || fi;
      } else if (isUpdate && window.firebase && firebase.firestore && firebase.firestore.FieldValue) {
        payload.fechaInicio = firebase.firestore.FieldValue.delete();
        payload.fechaFin = firebase.firestore.FieldValue.delete();
      }
    } else if (isUpdate && window.firebase && firebase.firestore && firebase.firestore.FieldValue) {
      payload.fechaInicio = firebase.firestore.FieldValue.delete();
      payload.fechaFin = firebase.firestore.FieldValue.delete();
    }

    if (!isUpdate) {
      payload.createdBy = user.uid;
      payload.createdAt = window.MuniFirebase.serverTimestamp();
    }

    return payload;
  }

  async function onListClick(e) {
    var btn = e.target.closest("[data-mapa-action]");
    if (!btn || !resolveDb()) return;
    var id = btn.getAttribute("data-id");
    var action = btn.getAttribute("data-mapa-action");
    if (!id) return;

    try {
      if (action === "editar") {
        startEdit(id);
        return;
      }
      if (action === "publicar") {
        await updateEstado(id, "publicado");
        if (showAlert) showAlert("ok", "Punto publicado en el mapa.");
      } else if (action === "rechazar") {
        await updateEstado(id, "rechazado");
        if (showAlert) showAlert("ok", "Punto rechazado.");
      } else if (action === "eliminar") {
        if (!window.confirm("¿Eliminar este punto del mapa?")) return;
        await db.collection("mapa_puntos").doc(id).delete();
        if (showAlert) showAlert("ok", "Punto eliminado.");
        if (editingId === id) clearEditMode();
      }
      await loadList();
    } catch (err) {
      if (showAlert) showAlert("error", (formatError ? formatError(err) : err.message) || "No se pudo actualizar.");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!resolveDb() || !form) return;
    var user = getCurrentUser ? getCurrentUser() : null;
    if (!user) {
      if (showAlert) showAlert("error", "No hay sesión activa.");
      return;
    }

    var fd = new FormData(form);
    var lat = parseFloat(fd.get("lat"));
    var lng = parseFloat(fd.get("lng"));
    if (!window.MuniMapa.isValidCoord(lat, lng)) {
      if (showAlert) showAlert("error", "Marcá la ubicación en el mapa.");
      return;
    }

    var isUpdate = !!editingId;
    var payload = buildPayload(fd, user, isUpdate);
    var btn = submitBtn || form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;

    try {
      if (isUpdate) {
        await db.collection("mapa_puntos").doc(editingId).update(payload);
        if (showAlert) showAlert("ok", "Punto actualizado.");
      } else {
        await db.collection("mapa_puntos").add(payload);
        if (showAlert) showAlert("ok", "Punto guardado.");
      }
      clearEditMode();
      await loadList();
    } catch (err) {
      if (showAlert) showAlert("error", (formatError ? formatError(err) : err.message) || "No se pudo guardar.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  window.AdminMapa = {
    bind: function (options) {
      showAlert = options.showAlert;
      escapeHtml = options.escapeHtml;
      estadoPubLabel = options.estadoPubLabel;
      getAreasSorted = options.getAreasSorted;
      getCurrentUser = options.getCurrentUser;
      getDb = options.getDb;
      formatError = options.formatError;
      areasBySlug = options.areasBySlug || new Map();

      populateAreas();
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
      if (listEl) listEl.addEventListener("click", onListClick);
      if (cancelEditBtn) cancelEditBtn.addEventListener("click", clearEditMode);
      if (filterEl) {
        filterEl.addEventListener("change", function () {
          loadList(filterEl.value);
        });
      }
      if (refreshBtn) {
        refreshBtn.addEventListener("click", function () {
          loadList();
        });
      }
    },
    refreshAreas: function (map, sortedFn) {
      areasBySlug = map || areasBySlug;
      getAreasSorted = sortedFn || getAreasSorted;
      populateAreas();
    },
    load: function (estado) {
      if (!resolveDb()) return Promise.resolve();
      setTimeout(ensurePickerMap, 500);
      return loadList(estado || "publicado");
    },
  };
})();
