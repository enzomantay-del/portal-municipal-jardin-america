(function () {
  "use strict";

  var MAX = 5;
  var host = null;
  var form = null;

  function field(name) {
    if (!form) return null;
    return form.elements[name] || form[name] || null;
  }

  function slotHtml(index) {
    var n = index + 1;
    return (
      '<div class="muni-trabajo-imagen-slot" data-imagen-slot="' +
      n +
      '">' +
      '<div class="muni-trabajo-imagen-slot-head">' +
      "<strong>Imagen " +
      n +
      "</strong>" +
      '<div class="muni-trabajo-imagen-slot-actions">' +
      '<label class="muni-trabajo-imagen-portada">' +
      '<input type="radio" name="imagen_portada" value="' +
      n +
      '"' +
      (n === 1 ? " checked" : "") +
      "> Portada</label>" +
      '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-imagen-clear="' +
      n +
      '">Quitar</button>' +
      "</div></div>" +
      '<div class="muni-field">' +
      '<label for="admin-imagen-url-' +
      n +
      '">URL (opcional)</label>' +
      '<input id="admin-imagen-url-' +
      n +
      '" name="imagen_url_' +
      n +
      '" type="url" placeholder="https://...">' +
      '<input type="hidden" name="imagen_existente_' +
      n +
      '" value="">' +
      "</div>" +
      '<div class="muni-field">' +
      '<label for="admin-imagen-archivo-' +
      n +
      '">Subir archivo</label>' +
      '<input id="admin-imagen-archivo-' +
      n +
      '" name="imagen_archivo_' +
      n +
      '" type="file" accept="image/*" capture="environment">' +
      "</div>" +
      '<div class="muni-field muni-field--full">' +
      '<label for="admin-imagen-leyenda-' +
      n +
      '">Leyenda (opcional)</label>' +
      '<input id="admin-imagen-leyenda-' +
      n +
      '" name="imagen_leyenda_' +
      n +
      '" type="text" maxlength="220" placeholder="Texto breve debajo de la imagen">' +
      "</div>" +
      '<div class="muni-trabajo-imagen-preview" data-imagen-preview="' +
      n +
      '" hidden></div>' +
      "</div>"
    );
  }

  function renderHost() {
    if (!host) return;
    var slots = [];
    for (var i = 0; i < MAX; i++) {
      slots.push(slotHtml(i));
    }
    host.innerHTML = slots.join("");
    bindPreviewListeners();
  }

  function updatePreview(slotIndex) {
    if (!host || !form) return;
    var n = slotIndex;
    var preview = host.querySelector('[data-imagen-preview="' + n + '"]');
    if (!preview) return;

    var existingEl = field("imagen_existente_" + n);
    var urlEl = field("imagen_url_" + n);
    var fileInput = field("imagen_archivo_" + n);
    var existing = existingEl ? String(existingEl.value || "").trim() : "";
    var urlField = urlEl ? String(urlEl.value || "").trim() : "";
    var src = urlField || existing;

    if (fileInput && fileInput.files && fileInput.files[0]) {
      preview.hidden = false;
      preview.innerHTML =
        '<img src="" alt="Vista previa imagen ' +
        n +
        '" class="muni-trabajo-imagen-preview-img">' +
        '<p class="muni-field-hint">Nueva imagen seleccionada (se subirá al guardar)</p>';
      var img = preview.querySelector("img");
      if (img) {
        img.src = URL.createObjectURL(fileInput.files[0]);
      }
      return;
    }

    if (src) {
      preview.hidden = false;
      preview.innerHTML =
        '<img src="' +
        src.replace(/"/g, "&quot;") +
        '" alt="Vista previa imagen ' +
        n +
        '" class="muni-trabajo-imagen-preview-img">';
      return;
    }

    preview.hidden = true;
    preview.innerHTML = "";
  }

  function clearSlot(n) {
    var urlEl = field("imagen_url_" + n);
    var existingEl = field("imagen_existente_" + n);
    var leyendaEl = field("imagen_leyenda_" + n);
    var fileInput = field("imagen_archivo_" + n);
    if (urlEl) urlEl.value = "";
    if (existingEl) existingEl.value = "";
    if (leyendaEl) leyendaEl.value = "";
    if (fileInput) fileInput.value = "";
    updatePreview(n);
  }

  function bindPreviewListeners() {
    if (!host || !form) return;
    for (var n = 1; n <= MAX; n++) {
      (function (slotN) {
        var urlInput = field("imagen_url_" + slotN);
        var fileInput = field("imagen_archivo_" + slotN);
        if (urlInput) {
          urlInput.addEventListener("input", function () {
            updatePreview(slotN);
          });
        }
        if (fileInput) {
          fileInput.addEventListener("change", function () {
            updatePreview(slotN);
          });
        }
      })(n);
    }
    host.querySelectorAll("[data-imagen-clear]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        clearSlot(parseInt(btn.getAttribute("data-imagen-clear"), 10));
      });
    });
  }

  function ensureReady() {
    if (!host) host = document.getElementById("admin-trabajo-imagenes-list");
    if (!form) form = document.getElementById("admin-trabajo-form");
    if (!host || !form) return false;
    if (!host.querySelector("[data-imagen-slot]")) {
      renderHost();
    }
    return !!(field("imagen_archivo_1") && field("imagen_existente_1"));
  }

  function fillSlots(imagenes) {
    if (!ensureReady()) return;
    var list = Array.isArray(imagenes)
      ? imagenes
      : window.MuniNoticiaImagenes
        ? window.MuniNoticiaImagenes.normalizeImagenes(imagenes || {})
        : [];

    for (var n = 1; n <= MAX; n++) {
      var item = list[n - 1] || null;
      var urlEl = field("imagen_url_" + n);
      var existingEl = field("imagen_existente_" + n);
      var leyendaEl = field("imagen_leyenda_" + n);
      var fileInput = field("imagen_archivo_" + n);
      if (!urlEl || !existingEl) continue;
      urlEl.value = "";
      existingEl.value = item && item.url ? item.url : "";
      if (leyendaEl) leyendaEl.value = item && item.leyenda ? item.leyenda : "";
      if (fileInput) fileInput.value = "";
      updatePreview(n);
    }

    var portadaIndex = 1;
    list.forEach(function (item, i) {
      if (item && item.portada) portadaIndex = i + 1;
    });
    var radio = form.querySelector('input[name="imagen_portada"][value="' + portadaIndex + '"]');
    if (radio) radio.checked = true;
  }

  function clearSlots() {
    fillSlots([]);
    var first = form && form.querySelector('input[name="imagen_portada"][value="1"]');
    if (first) first.checked = true;
  }

  async function collectImagenes(uploadImageFn) {
    if (!ensureReady()) return { imagenes: [], imagenUrl: null };

    var portadaValue = parseInt(
      (form.querySelector('input[name="imagen_portada"]:checked') || {}).value || "1",
      10
    );
    var imagenes = [];

    for (var n = 1; n <= MAX; n++) {
      var urlEl = field("imagen_url_" + n);
      var existingEl = field("imagen_existente_" + n);
      var leyendaEl = field("imagen_leyenda_" + n);
      var fileInput = field("imagen_archivo_" + n);
      var url = urlEl ? String(urlEl.value || "").trim() : "";
      var existing = existingEl ? String(existingEl.value || "").trim() : "";
      var leyenda = leyendaEl ? String(leyendaEl.value || "").trim() : "";
      var file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      if (file && file.size > 0) {
        url = await uploadImageFn(file);
        if (!url) {
          throw new Error("No se pudo subir la imagen " + n + ".");
        }
      } else if (!url) {
        url = existing;
      }

      if (!url) continue;

      imagenes.push({
        url: url,
        leyenda: leyenda,
        portada: n === portadaValue,
      });
    }

    if (imagenes.length && !imagenes.some(function (img) { return img.portada; })) {
      imagenes[0].portada = true;
    }

    var cover = imagenes.find(function (img) { return img.portada; });
    return {
      imagenes: imagenes,
      imagenUrl: cover ? cover.url : imagenes[0] ? imagenes[0].url : null,
    };
  }

  window.AdminTrabajoImagenes = {
    bind: function (options) {
      host = document.getElementById(options.hostId || "admin-trabajo-imagenes-list");
      form = document.getElementById(options.formId || "admin-trabajo-form");
      renderHost();
    },
    ensureReady: ensureReady,
    fillSlots: fillSlots,
    clearSlots: clearSlots,
    collectImagenes: collectImagenes,
  };
})();
