/**
 * Panel Encargado — solicitudes de trámites de Bromatología.
 */
(function () {
  "use strict";

  var db = null;
  var listEl = document.getElementById("encargado-bromo-list");
  var emptyEl = document.getElementById("encargado-bromo-empty");
  var detailEl = document.getElementById("encargado-bromo-detail");
  var filterEl = document.getElementById("encargado-bromo-filter");
  var refreshBtn = document.getElementById("encargado-bromo-refresh");
  var statsEl = document.getElementById("encargado-bromo-stats");

  var showAlert = null;
  var getSession = null;
  var itemsById = new Map();
  var selectedId = "";
  var filterEstado = "todas";

  var ESTADOS = [
    { id: "recibida", label: "Recibida" },
    { id: "en_revision", label: "En revisión" },
    { id: "pendiente_docs", label: "Falta documentación" },
    { id: "aprobada", label: "Aprobada / en curso" },
    { id: "rechazada", label: "Rechazada" },
    { id: "archivada", label: "Archivada" },
  ];

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initDb() {
    if (!window.MuniFirebase || !window.MuniFirebase.isConfigured()) return false;
    window.MuniFirebase.init();
    db = window.MuniFirebase.db();
    return !!db;
  }

  function estadoLabel(id) {
    for (var i = 0; i < ESTADOS.length; i++) {
      if (ESTADOS[i].id === id) return ESTADOS[i].label;
    }
    return id || "—";
  }

  function formatFecha(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Cordoba",
      });
    } catch (_e) {
      return String(iso);
    }
  }

  function getTramiteMeta(tipoId) {
    if (window.MuniBromoTramitesData && window.MuniBromoTramitesData.getById) {
      return window.MuniBromoTramitesData.getById(tipoId) || null;
    }
    return null;
  }

  function waLink(telefono, numero) {
    var digits = String(telefono || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.indexOf("54") !== 0) digits = "54" + digits;
    var text = encodeURIComponent(
      "Hola, te escribo de Bromatología (Municipalidad de Jardín América) por tu solicitud " +
        (numero || "") +
        "."
    );
    return "https://wa.me/" + digits + "?text=" + text;
  }

  function renderStats(items) {
    if (!statsEl) return;
    var counts = {
      recibida: 0,
      en_revision: 0,
      pendiente_docs: 0,
      total: items.length,
    };
    items.forEach(function (it) {
      var e = (it.data && it.data.estado) || "";
      if (counts[e] != null) counts[e] += 1;
    });
    statsEl.innerHTML =
      '<div class="muni-enc-stats">' +
      '<div class="muni-enc-stat muni-enc-stat--pendiente"><span class="muni-enc-stat-n">' +
      counts.recibida +
      '</span><span class="muni-enc-stat-l">Nuevas</span></div>' +
      '<div class="muni-enc-stat"><span class="muni-enc-stat-n">' +
      counts.en_revision +
      '</span><span class="muni-enc-stat-l">En revisión</span></div>' +
      '<div class="muni-enc-stat"><span class="muni-enc-stat-n">' +
      counts.pendiente_docs +
      '</span><span class="muni-enc-stat-l">Falta docs</span></div>' +
      '<div class="muni-enc-stat muni-enc-stat--total"><span class="muni-enc-stat-n">' +
      counts.total +
      '</span><span class="muni-enc-stat-l">Total</span></div>' +
      "</div>";
  }

  function filteredItems() {
    var all = Array.from(itemsById.values());
    if (filterEstado === "todas") return all;
    return all.filter(function (it) {
      return (it.data.estado || "") === filterEstado;
    });
  }

  function renderList() {
    if (!listEl) return;
    var items = filteredItems();
    renderStats(Array.from(itemsById.values()));

    if (!items.length) {
      listEl.innerHTML = "";
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent =
          filterEstado === "todas"
            ? "Todavía no hay solicitudes online."
            : "No hay solicitudes con ese estado.";
      }
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    listEl.innerHTML = items
      .map(function (it) {
        var d = it.data || {};
        var sol = d.solicitante || {};
        var active = it.id === selectedId ? " is-active" : "";
        return (
          '<button type="button" class="bromo-enc-row' +
          active +
          '" data-bromo-id="' +
          escapeHtml(it.id) +
          '">' +
          '<span class="bromo-enc-row-main">' +
          "<strong>" +
          escapeHtml(d.numero || "—") +
          "</strong> · " +
          escapeHtml(d.titulo || d.tipoId || "Trámite") +
          "</span>" +
          '<span class="bromo-enc-row-meta">' +
          '<span class="bromo-enc-pill bromo-enc-pill--' +
          escapeHtml(d.estado || "recibida") +
          '">' +
          escapeHtml(estadoLabel(d.estado)) +
          "</span>" +
          " " +
          escapeHtml(sol.nombre || "") +
          " · " +
          escapeHtml(formatFecha(d.createdAt)) +
          "</span></button>"
        );
      })
      .join("");
  }

  function renderDetail(id) {
    if (!detailEl) return;
    selectedId = id || "";
    var item = id ? itemsById.get(id) : null;
    if (!item) {
      detailEl.innerHTML =
        '<p class="muni-empty">Elegí una solicitud de la lista para ver el detalle.</p>';
      renderList();
      return;
    }

    var d = item.data || {};
    var sol = d.solicitante || {};
    var valores = d.valores || {};
    var meta = getTramiteMeta(d.tipoId);
    var campos = (meta && meta.campos) || [];
    var wa = waLink(sol.telefono, d.numero);

    var camposHtml = Object.keys(valores)
      .map(function (key) {
        var label = key;
        for (var i = 0; i < campos.length; i++) {
          if (campos[i].name === key) {
            label = campos[i].label;
            break;
          }
        }
        return (
          "<tr><th>" +
          escapeHtml(label) +
          "</th><td>" +
          escapeHtml(valores[key]) +
          "</td></tr>"
        );
      })
      .join("");

    var adjuntosHtml = (d.adjuntos || [])
      .map(function (a) {
        return (
          "<li><a href=\"" +
          escapeHtml(a.url || "#") +
          '" target="_blank" rel="noopener">' +
          escapeHtml(a.nombre || a.key) +
          "</a></li>"
        );
      })
      .join("");

    var estadoOptions = ESTADOS.map(function (e) {
      return (
        '<option value="' +
        e.id +
        '"' +
        (d.estado === e.id ? " selected" : "") +
        ">" +
        escapeHtml(e.label) +
        "</option>"
      );
    }).join("");

    detailEl.innerHTML =
      '<article class="bromo-enc-detail">' +
      "<header>" +
      "<h3>" +
      escapeHtml(d.numero || "") +
      " — " +
      escapeHtml(d.titulo || "") +
      "</h3>" +
      "<p>Recibida: " +
      escapeHtml(formatFecha(d.createdAt)) +
      " · Actualizada: " +
      escapeHtml(formatFecha(d.updatedAt)) +
      "</p>" +
      "</header>" +
      '<div class="bromo-enc-detail-grid">' +
      "<section><h4>Solicitante</h4>" +
      "<p><strong>" +
      escapeHtml(sol.nombre) +
      "</strong><br>DNI " +
      escapeHtml(sol.dni) +
      "<br>Tel. " +
      escapeHtml(sol.telefono) +
      (sol.email ? "<br>" + escapeHtml(sol.email) : "") +
      "</p>" +
      (wa
        ? '<a class="muni-btn muni-btn--primary" href="' +
          wa +
          '" target="_blank" rel="noopener">WhatsApp al solicitante</a>'
        : "") +
      "</section>" +
      "<section><h4>Datos del trámite</h4>" +
      (camposHtml
        ? "<table class=\"bromo-enc-table\"><tbody>" + camposHtml + "</tbody></table>"
        : "<p class=\"muni-field-hint\">Sin campos adicionales.</p>") +
      "</section>" +
      "<section><h4>Documentos adjuntos</h4>" +
      (adjuntosHtml
        ? "<ul>" + adjuntosHtml + "</ul>"
        : "<p class=\"muni-field-hint\">No adjuntaron archivos.</p>") +
      "</section>" +
      "</div>" +
      '<form id="bromo-enc-update" class="muni-form-grid bromo-enc-update">' +
      '<div class="muni-field"><label for="bromo-enc-estado">Estado</label>' +
      '<select id="bromo-enc-estado" name="estado">' +
      estadoOptions +
      "</select></div>" +
      '<div class="muni-field muni-field--full"><label for="bromo-enc-notas">Notas internas</label>' +
      '<textarea id="bromo-enc-notas" name="notas" rows="3" maxlength="2000">' +
      escapeHtml(d.notasInternas || "") +
      "</textarea>" +
      '<p class="muni-field-hint">Solo las ve el área (no el solicitante).</p></div>' +
      '<div class="muni-form-actions muni-field--full">' +
      '<button type="submit" class="muni-btn muni-btn--primary">Guardar cambios</button>' +
      '<button type="button" class="muni-btn muni-btn--ghost" id="bromo-enc-print">Imprimir / PDF membrete</button>' +
      "</div></form></article>";

    var form = document.getElementById("bromo-enc-update");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        saveUpdate(item.id);
      });
    }
    var printBtn = document.getElementById("bromo-enc-print");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        printSolicitud(item);
      });
    }
    renderList();
  }

  function printSolicitud(item) {
    if (!window.MuniBromoPdf) {
      if (showAlert) showAlert("warn", "No se cargó el módulo de PDF. Recargá con Ctrl+F5.");
      return;
    }
    var d = item.data || {};
    var meta = getTramiteMeta(d.tipoId) || {
      titulo: d.titulo,
      campos: Object.keys(d.valores || {}).map(function (k) {
        return { name: k, label: k };
      }),
      documentos: [],
      notaIntro: "Solicitud de trámite de Bromatología.",
    };
    var html = window.MuniBromoPdf.buildLetterHtml({
      tramite: meta,
      solicitante: d.solicitante || {},
      valores: d.valores || {},
      adjuntos: d.adjuntos || [],
      numero: d.numero,
      createdAt: d.createdAt,
      logoSrc: new URL("assets/logo-municipalidad.png", window.location.href).href,
    });
    window.MuniBromoPdf.openPrintWindow(html);
  }

  async function saveUpdate(id) {
    if (!db || !id) return;
    var session = getSession ? getSession() : null;
    var estado = document.getElementById("bromo-enc-estado");
    var notas = document.getElementById("bromo-enc-notas");
    try {
      await db
        .collection("bromatologia_tramites")
        .doc(id)
        .update({
          estado: estado ? estado.value : "recibida",
          notasInternas: notas ? String(notas.value || "").trim().slice(0, 2000) : "",
          updatedAt: new Date().toISOString(),
          reviewedBy: session && session.user ? session.user.uid : "",
        });
      var item = itemsById.get(id);
      if (item) {
        item.data.estado = estado ? estado.value : item.data.estado;
        item.data.notasInternas = notas ? String(notas.value || "").trim() : "";
        item.data.updatedAt = new Date().toISOString();
      }
      if (showAlert) showAlert("ok", "Solicitud actualizada.");
      renderDetail(id);
    } catch (err) {
      console.error(err);
      if (showAlert) {
        showAlert(
          "error",
          "No se pudo guardar. Revisá las reglas de Firestore. " + (err.message || "")
        );
      }
    }
  }

  async function loadSolicitudes() {
    if (!db || !listEl) return;
    try {
      var snap = await db
        .collection("bromatologia_tramites")
        .where("areaSlug", "==", "bromatologia")
        .get();
      itemsById.clear();
      snap.forEach(function (doc) {
        itemsById.set(doc.id, { id: doc.id, data: doc.data() || {} });
      });
      var sorted = Array.from(itemsById.values()).sort(function (a, b) {
        return String(b.data.createdAt || "").localeCompare(String(a.data.createdAt || ""));
      });
      itemsById.clear();
      sorted.forEach(function (it) {
        itemsById.set(it.id, it);
      });
      if (selectedId && !itemsById.has(selectedId)) selectedId = "";
      renderList();
      if (selectedId) renderDetail(selectedId);
      else if (!detailEl || !detailEl.querySelector(".bromo-enc-detail")) {
        renderDetail("");
      }
    } catch (err) {
      console.error(err);
      if (showAlert) {
        showAlert(
          "error",
          "No se pudieron cargar las solicitudes. Publicá las reglas de Firestore actualizadas. " +
            (err.message || "")
        );
      }
    }
  }

  function bindUi() {
    if (listEl) {
      listEl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-bromo-id]");
        if (!btn) return;
        renderDetail(btn.getAttribute("data-bromo-id"));
      });
    }
    if (filterEl) {
      filterEl.addEventListener("change", function () {
        filterEstado = filterEl.value || "todas";
        renderList();
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        loadSolicitudes();
      });
    }
  }

  function bind(opts) {
    opts = opts || {};
    showAlert = opts.showAlert || null;
    getSession = opts.getSession || null;
    if (!initDb()) return;
    bindUi();
  }

  function refresh() {
    if (!initDb()) return;
    return loadSolicitudes();
  }

  window.EncargadoBromo = {
    bind: bind,
    refresh: refresh,
  };
})();
