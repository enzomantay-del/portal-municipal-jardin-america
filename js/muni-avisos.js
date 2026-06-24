(function () {
  "use strict";

  var NOTAS_PORTAL = "Portal municipal — recibir avisos.";

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

  async function loadBarrios() {
    var select = document.getElementById("avisos-barrio");
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
      select.innerHTML = '<option value="">No se pudieron cargar los barrios</option>';
      select.disabled = true;
      console.error("Barrios campaña:", err);
    }
  }

  function bindAvisosForm() {
    var form = document.getElementById("muni-avisos-form");
    var alertEl = document.getElementById("muni-avisos-alert");
    if (!form) return;

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
        var res = await fetch(campanaApiUrl("/api/public/contactos"), {
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

  document.addEventListener("DOMContentLoaded", function () {
    var cfg = getCampanaConfig();
    var mapaLink = document.getElementById("avisos-barrio-mapa");
    if (mapaLink && cfg.barriosMapaUrl) {
      mapaLink.href = cfg.barriosMapaUrl;
    }
    bindAvisosForm();
    scheduleBarriosLoad();
  });

  function scheduleBarriosLoad() {
    var section = document.getElementById("recibir-avisos");
    if (!section || !("IntersectionObserver" in window)) {
      loadBarrios();
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          observer.disconnect();
          loadBarrios();
        }
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(section);
  }
})();
