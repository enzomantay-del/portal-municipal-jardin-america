(function () {
  "use strict";

  var API_URL = "/.netlify/functions/bromatologia-tramite";
  var root = document.getElementById("bromo-tramites-root");
  var state = {
    view: "lista",
    tipoId: "",
    lastResult: null,
  };

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getTramites() {
    return (window.MuniBromoTramitesData && window.MuniBromoTramitesData.TRAMITES) || [];
  }

  function getTramite(id) {
    return window.MuniBromoTramitesData ? window.MuniBromoTramitesData.getById(id) : null;
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function () {
        reject(new Error("No se pudo leer el archivo."));
      };
      reader.readAsDataURL(file);
    });
  }

  async function prepareFile(file) {
    if (!file) return null;
    var out = file;
    if (window.MuniImageCompress && file.type && file.type.indexOf("image/") === 0) {
      try {
        out = await window.MuniImageCompress.compressImageFile(file, {
          maxWidth: 1400,
          maxHeight: 1400,
          maxBytes: 220000,
        });
      } catch (_e) {
        out = file;
      }
    }
    if (out.size > 1500000) {
      throw new Error("«" + file.name + "» es muy pesado. Usá una imagen más chica o un PDF liviano.");
    }
    var dataUrl = await fileToDataUrl(out);
    return {
      nombre: file.name,
      contentType: out.type || file.type || "application/octet-stream",
      dataUrl: dataUrl,
      size: out.size,
    };
  }

  function renderLista() {
    var items = getTramites()
      .map(function (t) {
        var badge =
          t.tipo === "info"
            ? '<span class="bromo-badge bromo-badge--info">Solo requisitos</span>'
            : '<span class="bromo-badge bromo-badge--ok">Iniciar online</span>';
        return (
          '<article class="bromo-card">' +
          (window.MuniBromoTramitesData && window.MuniBromoTramitesData.renderIcon
            ? window.MuniBromoTramitesData.renderIcon(t.icono)
            : '<span class="bromo-card-icon" aria-hidden="true"></span>') +
          "<div>" +
          badge +
          "<h2>" +
          escapeHtml(t.titulo) +
          "</h2>" +
          "<p>" +
          escapeHtml(t.resumen) +
          "</p>" +
          '<button type="button" class="muni-btn muni-btn--primary" data-bromo-open="' +
          escapeHtml(t.id) +
          '">' +
          (t.tipo === "info" ? "Ver requisitos" : "Iniciar trámite") +
          "</button>" +
          "</div></article>"
        );
      })
      .join("");

    root.innerHTML =
      '<section class="bromo-intro">' +
      "<h1>Trámites de Bromatología</h1>" +
      "<p>Elegí el trámite. Te guiamos paso a paso. Las solicitudes online generan una nota con membrete municipal para imprimir y archivar.</p>" +
      '<ol class="bromo-how">' +
      "<li><strong>Elegí</strong> el trámite.</li>" +
      "<li><strong>Completá</strong> tus datos y adjuntá lo pedido.</li>" +
      "<li><strong>Enviá</strong> y descargá/imprimí la nota PDF.</li>" +
      "<li><strong>Bromatología</strong> lo recibe en su panel y te contacta.</li>" +
      "</ol>" +
      '<p class="bromo-note">WhatsApp Bromatología: <a href="https://wa.me/543743668062" target="_blank" rel="noopener">3743-668062</a> · ' +
      '<button type="button" class="bromo-linkish" data-open-consultas data-consultas-q="trámites de Bromatología" data-consultas-area="bromatologia">Preguntale a AmiBot</button></p>' +
      "</section>" +
      '<div class="bromo-grid">' +
      items +
      "</div>";
  }

  function renderInfo(tramite) {
    root.innerHTML =
      '<p class="muni-back-link"><button type="button" class="bromo-linkish" data-bromo-back>← Volver a trámites</button></p>' +
      '<section class="bromo-form-wrap">' +
      "<h1>" +
      escapeHtml(tramite.titulo) +
      "</h1>" +
      "<p>" +
      escapeHtml(tramite.notaPresencial || tramite.resumen) +
      "</p>" +
      '<div class="bromo-steps"><h2>Pasos</h2><ol>' +
      (tramite.pasos || [])
        .map(function (p) {
          return "<li>" + escapeHtml(p) + "</li>";
        })
        .join("") +
      "</ol></div>" +
      '<div class="bromo-reqs"><h2>Requisitos</h2><ul>' +
      (tramite.requisitos || [])
        .map(function (r) {
          return "<li>" + escapeHtml(r) + "</li>";
        })
        .join("") +
      "</ul></div>" +
      '<p class="bromo-note">Presentá la documentación en la oficina de Bromatología. Renovación: cada año.</p>' +
      '<a class="muni-btn muni-btn--primary" href="https://wa.me/543743668062?text=' +
      encodeURIComponent("Hola, consulto por libreta sanitaria.") +
      '" target="_blank" rel="noopener">Consultar por WhatsApp</a>' +
      "</section>";
  }

  function renderForm(tramite) {
    var camposHtml = (tramite.campos || [])
      .map(function (c) {
        var input =
          c.type === "textarea"
            ? '<textarea id="campo-' +
              escapeHtml(c.name) +
              '" name="' +
              escapeHtml(c.name) +
              '" rows="3" maxlength="' +
              (c.maxlength || 400) +
              '"' +
              (c.required ? " required" : "") +
              "></textarea>"
            : '<input id="campo-' +
              escapeHtml(c.name) +
              '" name="' +
              escapeHtml(c.name) +
              '" type="' +
              escapeHtml(c.type || "text") +
              '" maxlength="' +
              (c.maxlength || 200) +
              '"' +
              (c.required ? " required" : "") +
              ">";
        return (
          '<div class="muni-field' +
          (c.type === "textarea" ? " muni-field--full" : "") +
          '"><label for="campo-' +
          escapeHtml(c.name) +
          '">' +
          escapeHtml(c.label) +
          (c.required ? " *" : "") +
          "</label>" +
          input +
          "</div>"
        );
      })
      .join("");

    var docsHtml = (tramite.documentos || [])
      .map(function (d) {
        return (
          '<div class="muni-field muni-field--full bromo-doc">' +
          '<label for="doc-' +
          escapeHtml(d.key) +
          '">' +
          escapeHtml(d.label) +
          "</label>" +
          '<input id="doc-' +
          escapeHtml(d.key) +
          '" name="doc_' +
          escapeHtml(d.key) +
          '" type="file" accept="image/*,.pdf,application/pdf">' +
          "</div>"
        );
      })
      .join("");

    root.innerHTML =
      '<p class="muni-back-link"><button type="button" class="bromo-linkish" data-bromo-back>← Volver a trámites</button></p>' +
      '<section class="bromo-form-wrap">' +
      "<h1>" +
      escapeHtml(tramite.titulo) +
      "</h1>" +
      "<p>" +
      escapeHtml(tramite.resumen) +
      "</p>" +
      '<div class="bromo-steps"><h2>Cómo hacerlo</h2><ol>' +
      (tramite.pasos || [])
        .map(function (p) {
          return "<li>" + escapeHtml(p) + "</li>";
        })
        .join("") +
      "</ol></div>" +
      (tramite.avisoExtra
        ? '<p class="bromo-aviso">' + escapeHtml(tramite.avisoExtra) + "</p>"
        : "") +
      '<form id="bromo-form" class="muni-form-grid" novalidate>' +
      '<h2 class="muni-field--full bromo-form-section">1. Tus datos</h2>' +
      '<div class="muni-field"><label for="sol-nombre">Apellido y nombre *</label>' +
      '<input id="sol-nombre" name="nombre" required minlength="3" maxlength="160" autocomplete="name"></div>' +
      '<div class="muni-field"><label for="sol-dni">DNI *</label>' +
      '<input id="sol-dni" name="dni" required minlength="6" maxlength="20" inputmode="numeric"></div>' +
      '<div class="muni-field"><label for="sol-tel">Teléfono / WhatsApp *</label>' +
      '<input id="sol-tel" name="telefono" required minlength="6" maxlength="40" autocomplete="tel"></div>' +
      '<div class="muni-field"><label for="sol-email">Email (opcional)</label>' +
      '<input id="sol-email" name="email" type="email" maxlength="120" autocomplete="email"></div>' +
      '<h2 class="muni-field--full bromo-form-section">2. Datos del trámite</h2>' +
      camposHtml +
      '<h2 class="muni-field--full bromo-form-section">3. Documentación</h2>' +
      '<p class="muni-field--full muni-field-hint">Podés adjuntar fotos o PDF ahora. Lo que no subas figurará en la nota como pendiente de entrega; lo que subas, como entregado (en revisión).</p>' +
      docsHtml +
      '<div class="muni-field muni-field--full"><label class="muni-check-row">' +
      '<input type="checkbox" id="sol-decl" name="declaracion" value="1" required>' +
      "<span>Declaro bajo juramento que los datos y documentos son verdaderos. Entiendo que esto inicia el trámite y que la inspección/pago pueden requerir presencia.</span>" +
      "</label></div>" +
      '<div class="muni-form-actions muni-field--full">' +
      '<button type="submit" class="muni-btn muni-btn--primary" id="bromo-submit">Enviar solicitud</button>' +
      "</div>" +
      '<p id="bromo-form-alert" class="bromo-form-alert" hidden role="status"></p>' +
      "</form></section>";

    var form = document.getElementById("bromo-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        submitForm(tramite, form);
      });
    }
  }

  function showFormAlert(type, message) {
    var el = document.getElementById("bromo-form-alert");
    if (!el) return;
    el.hidden = false;
    el.className = "bromo-form-alert bromo-form-alert--" + type;
    el.textContent = message;
  }

  async function submitForm(tramite, form) {
    var btn = document.getElementById("bromo-submit");
    var decl = document.getElementById("sol-decl");
    if (!decl || !decl.checked) {
      showFormAlert("error", "Tenés que marcar la declaración jurada.");
      return;
    }

    var solicitante = {
      nombre: String(form.nombre.value || "").trim(),
      dni: String(form.dni.value || "").trim(),
      telefono: String(form.telefono.value || "").trim(),
      email: String(form.email.value || "").trim(),
    };

    var valores = {};
    (tramite.campos || []).forEach(function (c) {
      var el = form.elements.namedItem(c.name);
      valores[c.name] = el ? String(el.value || "").trim() : "";
    });

    for (var i = 0; i < (tramite.campos || []).length; i++) {
      var c = tramite.campos[i];
      if (c.required && !valores[c.name]) {
        showFormAlert("error", "Completá el campo: " + c.label);
        return;
      }
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Enviando…";
    }
    showFormAlert("ok", "Preparando archivos y enviando a Bromatología…");

    try {
      var adjuntos = [];
      for (var d = 0; d < (tramite.documentos || []).length; d++) {
        var doc = tramite.documentos[d];
        var input = document.getElementById("doc-" + doc.key);
        var file = input && input.files && input.files[0];
        if (!file) {
          continue;
        }
        var prepared = await prepareFile(file);
        adjuntos.push({
          key: doc.key,
          nombre: prepared.nombre,
          dataUrl: prepared.dataUrl,
        });
      }

      var res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          tipoId: tramite.id,
          titulo: tramite.titulo,
          solicitante: solicitante,
          valores: valores,
          adjuntos: adjuntos,
          declaracionJurada: true,
        }),
      });
      var data = null;
      try {
        data = await res.json();
      } catch (_e) {
        data = null;
      }
      if (!res.ok || !data || !data.ok) {
        throw new Error((data && data.error) || "No se pudo enviar la solicitud.");
      }

      state.lastResult = {
        tramite: tramite,
        solicitante: solicitante,
        valores: valores,
        adjuntos: adjuntos.map(function (a) {
          return { key: a.key, nombre: a.nombre };
        }),
        numero: data.numero,
        id: data.id,
        createdAt: data.createdAt,
      };
      renderExito(state.lastResult);
    } catch (err) {
      showFormAlert("error", err.message || "Error al enviar.");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Enviar solicitud";
      }
    }
  }

  function renderExito(result) {
    root.innerHTML =
      '<section class="bromo-exito">' +
      "<h1>Solicitud enviada</h1>" +
      "<p>Bromatología ya recibió tu pedido.</p>" +
      '<p class="bromo-numero">Número: <strong>' +
      escapeHtml(result.numero) +
      "</strong></p>" +
      "<p>Guardá este número. Podés imprimir o guardar en PDF la nota con membrete municipal.</p>" +
      '<div class="bromo-exito-actions">' +
      '<button type="button" class="muni-btn muni-btn--primary" id="bromo-print">Imprimir / Guardar PDF</button>' +
      '<button type="button" class="muni-btn muni-btn--ghost" data-bromo-back>Volver a trámites</button>' +
      '<a class="muni-btn muni-btn--ghost" href="https://wa.me/543743668062?text=' +
      encodeURIComponent("Hola, envié la solicitud " + result.numero + " por el portal.") +
      '" target="_blank" rel="noopener">Avisar por WhatsApp</a>' +
      "</div></section>";

    var printBtn = document.getElementById("bromo-print");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        if (!window.MuniBromoPdf) return;
        var html = window.MuniBromoPdf.buildLetterHtml({
          tramite: result.tramite,
          solicitante: result.solicitante,
          valores: result.valores,
          adjuntos: result.adjuntos,
          numero: result.numero,
          createdAt: result.createdAt,
          logoSrc: new URL("assets/logo-municipalidad.png", window.location.href).href,
        });
        window.MuniBromoPdf.openPrintWindow(html);
      });
    }
  }

  function openTramite(id) {
    var tramite = getTramite(id);
    if (!tramite) {
      state.view = "lista";
      renderLista();
      return;
    }
    state.tipoId = id;
    state.view = "detalle";
    if (tramite.tipo === "info") renderInfo(tramite);
    else renderForm(tramite);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function init() {
    if (!root) return;
    if (window.MuniPortal && window.MuniPortal.initNav) {
      window.MuniPortal.initNav("");
    }
    if (window.MuniPortal && window.MuniPortal.setTodayLabel) {
      window.MuniPortal.setTodayLabel("muni-fecha-hoy");
    }

    root.addEventListener("click", function (e) {
      var openBtn = e.target.closest("[data-bromo-open]");
      if (openBtn) {
        openTramite(openBtn.getAttribute("data-bromo-open"));
        return;
      }
      if (e.target.closest("[data-bromo-back]")) {
        state.view = "lista";
        state.tipoId = "";
        renderLista();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    var params = new URLSearchParams(window.location.search || "");
    var start = params.get("tramite") || "";
    if (start && getTramite(start)) openTramite(start);
    else renderLista();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
