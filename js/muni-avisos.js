(function () {
  "use strict";

  if (window.__MUNI_AVISOS_BOOTED) return;
  window.__MUNI_AVISOS_BOOTED = true;

  var NOTAS_PORTAL = "Portal municipal — recibir avisos.";
  var FETCH_TIMEOUT_MS = 20000;

  function getCampanaConfig() {
    return window.CAMPANA_CONFIG || {};
  }

  function buildApiQuery() {
    var cfg = getCampanaConfig();
    var key = String(cfg.publicKey || "").trim();
    return key ? "?k=" + encodeURIComponent(key) : "";
  }

  function campanaApiUrl(path) {
    var cfg = getCampanaConfig();
    var base = String(cfg.apiBase || "").replace(/\/$/, "");
    if (!base) throw new Error("La campaña municipal no está configurada.");
    return base + path + buildApiQuery();
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function showFormAlert(el, type, message) {
    if (!el) return;
    el.hidden = false;
    el.className = "muni-avisos-alert muni-avisos-alert--" + type;
    el.textContent = message;
  }

  function fetchWithTimeout(url, options) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = null;
    var opts = options ? Object.assign({}, options) : {};
    if (ctrl) {
      opts.signal = ctrl.signal;
      timer = setTimeout(function () {
        try {
          ctrl.abort();
        } catch (e) {}
      }, FETCH_TIMEOUT_MS);
    }
    return fetch(url, opts).finally(function () {
      if (timer) clearTimeout(timer);
    });
  }

  async function loadBarrios() {
    var select = document.getElementById("avisos-barrio");
    if (!select) return;
    if (select.getAttribute("data-loaded") === "1") return;

    select.innerHTML = '<option value="">Cargando barrios…</option>';
    select.disabled = true;

    try {
      var cfg = getCampanaConfig();
      if (!String(cfg.apiBase || "").trim() || !String(cfg.publicKey || "").trim()) {
        throw new Error("Falta la configuración de campaña en el portal.");
      }
      var res = await fetchWithTimeout(campanaApiUrl("/api/public/barrios"));
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
      select.setAttribute("data-loaded", "1");
      select.removeAttribute("aria-invalid");
    } catch (err) {
      select.innerHTML = '<option value="">No se pudieron cargar los barrios</option>';
      select.disabled = true;
      select.setAttribute("aria-invalid", "true");
      console.error("Barrios campaña:", err);
      var alertEl = document.getElementById("muni-avisos-alert");
      showFormAlert(
        alertEl,
        "error",
        "No se pudieron cargar los barrios. Recargá la página. Si sigue fallando, avisá al administrador del portal."
      );
    }
  }

  function bindAvisosForm() {
    var form = document.getElementById("muni-avisos-form");
    var alertEl = document.getElementById("muni-avisos-alert");
    if (!form || form.getAttribute("data-bound") === "1") return;
    form.setAttribute("data-bound", "1");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (alertEl) alertEl.hidden = true;

      var fd = new FormData(form);
      var nombre = String(fd.get("nombre") || "").trim();
      var apellido = String(fd.get("apellido") || "").trim();
      var telefono = normalizePhone(fd.get("telefono"));
      var barrioId = String(fd.get("barrioId") || "").trim();
      var consent = fd.get("consent");

      if (!nombre || nombre.length < 2) {
        showFormAlert(alertEl, "error", "Ingresá tu nombre.");
        return;
      }
      if (!apellido || apellido.length < 2) {
        showFormAlert(alertEl, "error", "Ingresá tu apellido.");
        return;
      }
      if (!telefono || telefono.length < 10) {
        showFormAlert(
          alertEl,
          "error",
          "Ingresá un número de WhatsApp válido (con código de área)."
        );
        return;
      }
      if (!barrioId) {
        showFormAlert(alertEl, "error", "Elegí tu barrio.");
        return;
      }
      if (!consent) {
        showFormAlert(alertEl, "error", "Necesitamos tu autorización para enviarte avisos.");
        return;
      }

      var payload = {
        nombre: nombre,
        apellido: apellido,
        telefono: telefono,
        barrioId: barrioId,
        referenteId: null,
        notas: NOTAS_PORTAL,
      };

      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando…";
      }

      try {
        var res = await fetchWithTimeout(campanaApiUrl("/api/public/contactos"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        var data = await res.json();

        if (data.duplicado && data.existente) {
          var existente = data.existente;
          var extra =
            existente.nombre +
            " " +
            existente.apellido +
            " · " +
            existente.barrio;
          if (existente.referente) {
            extra += " · cargado por " + existente.referente;
          }
          showFormAlert(
            alertEl,
            "warn",
            (data.error || "Este contacto ya está en la base.") + " " + extra
          );
          return;
        }

        if (!res.ok || !data.ok) {
          throw new Error((data && data.error) || "No se pudo registrar tu contacto.");
        }

        form.reset();
        var barrioSelect = document.getElementById("avisos-barrio");
        if (barrioSelect) {
          barrioSelect.selectedIndex = 0;
        }
        showFormAlert(
          alertEl,
          "ok",
          "¡Listo! Te sumamos a la base de contactos del municipio."
        );
      } catch (err) {
        showFormAlert(
          alertEl,
          "error",
          (err && err.message) ||
            "No se pudo registrar tu contacto. Probá de nuevo en unos minutos."
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Quiero recibir avisos";
        }
      }
    });
  }

  function initAvisos() {
    var cfg = getCampanaConfig();
    var mapaLink = document.getElementById("avisos-barrio-mapa");
    if (mapaLink && cfg.barriosMapaUrl) {
      mapaLink.href = cfg.barriosMapaUrl;
    }
    bindAvisosForm();
    loadBarrios();
  }

  function bootWhenConfigReady() {
    var tries = 0;
    function attempt() {
      var cfg = getCampanaConfig();
      if (String(cfg.apiBase || "").trim() && String(cfg.publicKey || "").trim()) {
        initAvisos();
        return;
      }
      tries += 1;
      if (tries >= 60) {
        initAvisos();
        return;
      }
      setTimeout(attempt, 50);
    }
    attempt();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootWhenConfigReady);
  } else {
    bootWhenConfigReady();
  }
})();
