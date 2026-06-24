(function () {
  "use strict";

  var TIPO_LABELS = {
    basurero: "Basurero a cielo abierto",
    alcantarilla: "Alcantarilla tapada",
    arbol: "Árbol caído o riesgo vegetal",
    luminaria: "Luminaria / alumbrado",
    calle: "Calle, bache o vereda",
    contenedor: "Contenedor o recolección",
    otro: "Otro",
  };

  function getConfig() {
    return window.REPORTAR_CONFIG || {};
  }

  function getCampanaConfig() {
    return window.CAMPANA_CONFIG || {};
  }

  function campanaApiUrl(path) {
    var cfg = getCampanaConfig();
    var base = String(cfg.apiBase || "").replace(/\/$/, "");
    var key = String(cfg.publicKey || "").trim();
    if (!base) throw new Error("No hay API de barrios configurada.");
    return base + path + (key ? "?k=" + encodeURIComponent(key) : "");
  }

  function showAlert(el, type, message) {
    if (!el) return;
    el.hidden = false;
    el.className = "muni-avisos-alert muni-avisos-alert--" + type;
    el.textContent = message;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function tipoLabel(key) {
    return TIPO_LABELS[key] || key || "Problema reportado";
  }

  async function loadBarrios() {
    var select = document.getElementById("reportar-barrio");
    if (!select) return;

    try {
      var res = await fetch(campanaApiUrl("/api/public/barrios"));
      var data = await res.json();

      if (!res.ok || !data.ok || !Array.isArray(data.barrios)) {
        throw new Error((data && data.error) || "No se pudieron cargar los barrios.");
      }

      select.innerHTML = '<option value="">Elegí barrio…</option>';
      data.barrios.forEach(function (barrio) {
        var option = document.createElement("option");
        option.value = barrio.id;
        option.textContent = barrio.nombre;
        select.appendChild(option);
      });
      select.disabled = false;
    } catch (err) {
      console.warn("Reportar: barrios", err);
      select.innerHTML = '<option value="">No se pudieron cargar — escribí el barrio abajo</option>';
      select.disabled = false;
      select.removeAttribute("required");
      var ubicacion = document.getElementById("reportar-ubicacion");
      if (ubicacion) {
        ubicacion.placeholder = "Incluí barrio, calle y referencia (Ej: Barrio Centro, San Martín 500)";
      }
    }
  }

  function barrioNombreFromSelect(select) {
    if (!select || !select.value) return "";
    var opt = select.options[select.selectedIndex];
    return opt ? opt.textContent : "";
  }

  async function submitReporte(payload) {
    var cfg = getConfig();
    var url = cfg.apiUrl || "/.netlify/functions/reportar-problema";
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    var data = {};
    try {
      data = await res.json();
    } catch (_e) {
      data = {};
    }
    if (!res.ok || !data.ok) {
      throw new Error((data && data.error) || "No se pudo enviar el reporte. Intentá de nuevo más tarde.");
    }
    return data;
  }

  function bindForm() {
    var form = document.getElementById("muni-reportar-form");
    var alertEl = document.getElementById("muni-reportar-alert");
    var submitBtn = document.getElementById("reportar-submit");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (alertEl) alertEl.hidden = true;

      var fd = new FormData(form);
      var nombre = String(fd.get("nombre") || "").trim();
      var telefono = normalizePhone(fd.get("telefono"));
      var email = String(fd.get("email") || "").trim();
      var tipo = String(fd.get("tipo") || "").trim();
      var barrioSelect = document.getElementById("reportar-barrio");
      var barrioId = String(fd.get("barrioId") || "").trim();
      var barrioNombre = barrioNombreFromSelect(barrioSelect);
      var ubicacion = String(fd.get("ubicacion") || "").trim();
      var descripcion = String(fd.get("descripcion") || "").trim();
      var consent = !!fd.get("consent");

      if (!nombre || nombre.length < 2) {
        showAlert(alertEl, "error", "Ingresá tu nombre.");
        return;
      }
      if (!tipo) {
        showAlert(alertEl, "error", "Seleccioná el tipo de problema.");
        return;
      }
      if (barrioSelect && barrioSelect.required && !barrioId) {
        showAlert(alertEl, "error", "Seleccioná el barrio.");
        return;
      }
      if (!ubicacion || ubicacion.length < 4) {
        showAlert(alertEl, "error", "Indicá la ubicación o una referencia.");
        return;
      }
      if (!descripcion || descripcion.length < 10) {
        showAlert(alertEl, "error", "Describí el problema con al menos 10 caracteres.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando…";
      }

      try {
        await submitReporte({
          nombre: nombre,
          telefono: telefono,
          email: email,
          tipo: tipo,
          tipoLabel: tipoLabel(tipo),
          barrioId: barrioId,
          barrioNombre: barrioNombre,
          ubicacion: ubicacion,
          descripcion: descripcion,
          consent: consent,
          origen: "portal-municipal-reportar-problema",
        });
        form.reset();
        if (barrioSelect && barrioSelect.options.length > 1) {
          barrioSelect.selectedIndex = 0;
        }
        showAlert(
          alertEl,
          "ok",
          "¡Gracias! Recibimos tu reporte. El equipo municipal lo revisará y, si dejaste contacto, podrá comunicarse con vos."
        );
      } catch (err) {
        showAlert(alertEl, "error", err.message || "No se pudo enviar el reporte.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Enviar reporte";
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.MuniPortal && window.MuniPortal.initNav) {
      window.MuniPortal.initNav("inicio");
    }
    loadBarrios();
    bindForm();
  });
})();
