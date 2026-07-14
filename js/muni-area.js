(function () {
  "use strict";

  function phoneDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function toIntlPhone(value) {
    var digits = phoneDigits(value);
    if (!digits) return "";
    if (digits.indexOf("54") === 0) return digits;
    return "54" + digits;
  }

  function renderEncargadoBlock(M, area) {
    var isIntendencia = area.slug === "intendencia";
    var showContacto = !isIntendencia && area.contacto;
    if (!area.responsable && !showContacto && !area.fotoEncargado) return "";

    var cargoLabel = isIntendencia ? "Intendente:" : "Encargado:";

    var photoHtml = area.fotoEncargado
      ? '<img class="muni-area-encargado-photo" src="' +
        M.escapeHtml(area.fotoEncargado) +
        '" alt="Foto de ' +
        M.escapeHtml(area.responsable || (isIntendencia ? "intendente" : "encargado")) +
        '" width="56" height="56" loading="lazy" decoding="async">'
      : "";

    return (
      '<div class="muni-area-encargado">' +
      photoHtml +
      '<div class="muni-area-encargado-info">' +
      (area.responsable
        ? "<div><strong>" + cargoLabel + "</strong> " + M.escapeHtml(area.responsable) + "</div>"
        : "") +
      (showContacto
        ? "<div><strong>Contacto:</strong> " + M.escapeHtml(area.contacto) + "</div>"
        : "") +
      "</div></div>"
    );
  }

  /** Botón de llamada directa: lo más rápido ante una emergencia real. */
  function renderEmergenciaCta(M, area) {
    if (area.slug !== "defensa-civil") return "";
    var display = area.contacto || "3743-614457";
    var intl = toIntlPhone(display);
    if (intl.length < 10) return "";

    var telHref = "tel:+" + intl;
    var waHref =
      "https://wa.me/" +
      intl +
      "?text=" +
      encodeURIComponent("Hola, necesito contactar a Defensa Civil de Jardín América por una emergencia.");

    return (
      '<div class="muni-area-emergencia" role="region" aria-label="Contacto de emergencia">' +
      '<p class="muni-area-emergencia-kicker">Ante una emergencia</p>' +
      "<p>Si hay riesgo inmediato, llamá ahora. Es la forma más rápida de pedir ayuda.</p>" +
      '<div class="muni-area-emergencia-actions">' +
      '<a class="muni-btn muni-btn--emergencia" href="' +
      telHref +
      '">Llamar ' +
      M.escapeHtml(display) +
      "</a>" +
      '<a class="muni-btn muni-btn--emergencia-wa" href="' +
      waHref +
      '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
      "</div>" +
      "</div>"
    );
  }

  function mapIconSvg() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16M16 6v16"/></svg>'
    );
  }

  function docIconSvg() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>'
    );
  }

  function linkIconSvg() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>'
    );
  }

  function turismoIconSvg() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/></svg>'
    );
  }

  function resourceIcon(kind) {
    if (kind === "map") return mapIconSvg();
    if (kind === "link") return linkIconSvg();
    if (kind === "turismo") return turismoIconSvg();
    return docIconSvg();
  }

  function downloadIconSvg() {
    return (
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>'
    );
  }

  function chevronSvg() {
    return (
      '<svg class="muni-doc-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M6 9l6 6 6-6"/></svg>'
    );
  }

  function getDocumentoContenido(doc) {
    var catalog = window.MUNI_DOCUMENTOS_CONTENIDO || {};
    if (doc.id && catalog[doc.id]) return catalog[doc.id];
    if (doc.contenidoId && catalog[doc.contenidoId]) return catalog[doc.contenidoId];
    return null;
  }

  function renderDocumentPanel(M, doc) {
    if (!doc || !doc.url || !doc.titulo) return "";
    var content = getDocumentoContenido(doc);
    var downloadName = String(doc.url).split("/").pop() || "documento.pdf";
    var docId = "doc-" + (doc.id || downloadName.replace(/\W+/g, "-"));
    var bodyHtml = "";

    if (content && content.html) {
      bodyHtml = '<div class="muni-doc-body">' + content.html + "</div>";
    } else {
      bodyHtml =
        '<div class="muni-doc-viewer-wrap">' +
        '<p class="muni-doc-viewer-note">Al abrir se muestra el documento original. También podés descargarlo.</p>' +
        '<iframe class="muni-doc-viewer" data-pdf-src="' +
        M.escapeHtml(doc.url) +
        '#toolbar=1" title="' +
        M.escapeHtml(doc.titulo) +
        '" loading="lazy"></iframe>' +
        "</div>";
    }

    return (
      '<details class="muni-doc-item" id="' +
      M.escapeHtml(docId) +
      '">' +
      '<summary class="muni-doc-item-summary">' +
      '<span class="muni-doc-item-summary-main">' +
      docIconSvg() +
      '<span class="muni-doc-item-title">' +
      M.escapeHtml(doc.titulo) +
      "</span>" +
      chevronSvg() +
      "</span>" +
      '<a class="muni-btn muni-btn--ghost muni-doc-download" href="' +
      M.escapeHtml(doc.url) +
      '" download="' +
      M.escapeHtml(downloadName) +
      '" target="_blank" rel="noopener noreferrer" data-doc-download>' +
      downloadIconSvg() +
      "PDF</a>" +
      "</summary>" +
      '<div class="muni-doc-item-body">' +
      bodyHtml +
      "</div>" +
      "</details>"
    );
  }

  function renderDocumentosSection(M, area, options) {
    options = options || {};
    var docs = (area.documentos || []).filter(function (doc) {
      return doc && doc.url && doc.titulo;
    });
    if (!docs.length) return "";
    var count = docs.length;
    var summaryLabel =
      "Documentos y normativa (" + count + (count === 1 ? " documento" : " documentos") + ")";

    return (
      '<div class="muni-area-recursos-group muni-area-documentos-group">' +
      (options.hideHeading ? "" : "") +
      '<details class="muni-doc-menu">' +
      '<summary class="muni-doc-menu-summary">' +
      '<span class="muni-doc-menu-summary-text">' +
      chevronSvg() +
      "<span>" +
      M.escapeHtml(summaryLabel) +
      "</span></span>" +
      '<span class="muni-doc-menu-hint">Tocá para ver u ocultar</span>' +
      "</summary>" +
      '<div class="muni-doc-menu-body">' +
      '<p class="muni-area-documentos-lead">Elegí un documento para leerlo acá o descargar el PDF. No se abren solos para no saturar la página.</p>' +
      '<div class="muni-doc-panels">' +
      docs
        .map(function (doc) {
          return renderDocumentPanel(M, doc);
        })
        .join("") +
      "</div></div></details></div>"
    );
  }

  function bindDocumentMenus(root) {
    if (!root || root._muniDocMenusBound) return;
    root._muniDocMenusBound = true;

    root.addEventListener("click", function (e) {
      var download = e.target.closest("[data-doc-download]");
      if (download) e.stopPropagation();
    });

    root.addEventListener("toggle", function (e) {
      var details = e.target;
      if (!details || details.tagName !== "DETAILS" || !details.open) return;

      if (details.classList.contains("muni-doc-item")) {
        var iframe = details.querySelector("iframe[data-pdf-src]");
        if (iframe && !iframe.getAttribute("src")) {
          iframe.setAttribute("src", iframe.getAttribute("data-pdf-src"));
        }
      }
    }, true);
  }

  function openDocumentoFromHash() {
    var hash = (window.location.hash || "").replace(/^#/, "");
    if (!hash || hash.indexOf("doc-") !== 0) return;
    var item = document.getElementById(hash);
    if (!item) return;
    var menu = item.closest(".muni-doc-menu");
    if (menu) menu.open = true;
    item.open = true;
    var iframe = item.querySelector("iframe[data-pdf-src]");
    if (iframe && !iframe.getAttribute("src")) {
      iframe.setAttribute("src", iframe.getAttribute("data-pdf-src"));
    }
    setTimeout(function () {
      item.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function renderResourceLink(M, item) {
    var attrs = item.externo || item.isPdf ? ' target="_blank" rel="noopener noreferrer"' : "";
    return (
      "<li>" +
      '<a class="muni-area-recurso-link" href="' +
      M.escapeHtml(item.url) +
      '"' +
      attrs +
      ">" +
      resourceIcon(item.icon) +
      "<span>" +
      M.escapeHtml(item.titulo) +
      "</span>" +
      "</a></li>"
    );
  }

  function renderResourceGroup(M, group) {
    if (!group.items.length) return "";
    if (group.id === "documentos") return "";
    return (
      '<div class="muni-area-recursos-group">' +
      "<h3>" +
      M.escapeHtml(group.label) +
      "</h3>" +
      '<ul class="muni-area-recursos-list">' +
      group.items
        .map(function (item) {
          return renderResourceLink(M, item);
        })
        .join("") +
      "</ul></div>"
    );
  }

  function collectAreaResourceGroups(area) {
    var groups = [
      { id: "mapas", label: "Mapas", items: [] },
      { id: "documentos", label: "Documentos y normativa", items: [] },
      { id: "enlaces", label: "Enlaces", items: [] },
    ];
    var byId = {};
    groups.forEach(function (group) {
      byId[group.id] = group;
    });

    if (area.mapasUrl) {
      byId.mapas.items.push({
        url: area.mapasUrl,
        titulo: "Mapas municipales",
        icon: "map",
        externo: String(area.mapasUrl).indexOf("http") === 0,
      });
    }

    if (area.mapaBarriosUrl) {
      byId.mapas.items.push({
        url: area.mapaBarriosUrl,
        titulo: "Mapa de barrios",
        icon: "map",
        externo: true,
      });
    }

    (area.documentos || []).forEach(function (doc) {
      if (!doc || !doc.url || !doc.titulo) return;
      byId.documentos.items.push(doc);
    });

    if (area.webExterna) {
      byId.enlaces.items.push({
        url: area.webExterna,
        titulo: "Información turística",
        icon: "turismo",
        externo: true,
      });
    }

    if (area.folletoUrl) {
      byId.enlaces.items.push({
        url: area.folletoUrl,
        titulo: "Folleto turístico",
        icon: "doc",
        externo: String(area.folletoUrl).indexOf("http") === 0,
      });
    }

    (area.enlaces || []).forEach(function (link) {
      if (!link || !link.url || !link.titulo) return;
      byId.enlaces.items.push({
        url: link.url,
        titulo: link.titulo,
        icon: link.tipo === "turismo" ? "turismo" : "link",
        externo: link.externo != null ? !!link.externo : String(link.url).indexOf("http") === 0,
      });
    });

    return groups.filter(function (group) {
      return group.items.length;
    });
  }

  function renderAreaRecursos(M, area) {
    var groups = collectAreaResourceGroups(area);
    var hasDocs = (area.documentos || []).length > 0;
    var linkGroups = groups.filter(function (g) {
      return g.id !== "documentos";
    });
    var onlyDocs = hasDocs && !linkGroups.length;

    if (!groups.length) {
      return "";
    }

    var sectionTitle = onlyDocs
      ? "Documentos y normativa"
      : linkGroups.length === 1 && !hasDocs
        ? linkGroups[0].label
        : "Recursos";

    var introHtml = area.recursosIntro
      ? '<p class="muni-area-recursos-intro">' + M.escapeHtml(area.recursosIntro) + "</p>"
      : "";

    var linksHtml = "";
    if (linkGroups.length === 1 && !hasDocs) {
      linksHtml =
        '<ul class="muni-area-recursos-list">' +
        linkGroups[0].items
          .map(function (item) {
            return renderResourceLink(M, item);
          })
          .join("") +
        "</ul>";
    } else {
      linksHtml = linkGroups
        .map(function (group) {
          return renderResourceGroup(M, group);
        })
        .join("");
    }

    return (
      '<section class="muni-area-recursos" aria-label="' +
      M.escapeHtml(sectionTitle) +
      '">' +
      "<h2>" +
      M.escapeHtml(sectionTitle) +
      "</h2>" +
      introHtml +
      linksHtml +
      renderDocumentosSection(M, area, { hideHeading: onlyDocs }) +
      "</section>"
    );
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var M = window.MuniPortal;
    if (!M) return;

    var slug = M.getQueryParam("area");
    var content = document.getElementById("muni-area-content");

    if (content) {
      content.innerHTML =
        '<div class="muni-content-band"><div class="muni-container"><p class="muni-empty" role="status">Cargando área…</p></div></div>';
    }

    var payload = await M.bootstrapPublicData();
    M.setData(payload);
    M.initNav(null, slug);

    var area = slug ? M.getArea(slug) : null;

    if (!area) {
      document.title = "Área no encontrada | Municipalidad de Jardín América";
      if (content) {
        content.innerHTML =
          '<div class="muni-content-band"><div class="muni-container">' +
          '<p class="muni-back-link"><a href="index.html">← Volver al inicio</a></p>' +
          '<p class="muni-empty">No encontramos el área solicitada.</p>' +
          "</div></div>";
      }
      return;
    }

    document.title = area.nombre + " | Municipalidad de Jardín América";

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", area.descripcion);

    var hero = document.getElementById("muni-area-hero");
    if (hero) {
      hero.innerHTML =
        '<div class="muni-container muni-area-hero-inner">' +
        '<div class="muni-area-hero-icon">' + M.renderAreaIcon(area.slug, "muni-icon muni-icon--lg") + "</div>" +
        "<div>" +
        "<h1>" + M.escapeHtml(area.nombre) + "</h1>" +
        '<p class="muni-area-hero-desc">' + M.escapeHtml(area.descripcion) + "</p>" +
        renderEncargadoBlock(M, area) +
        renderEmergenciaCta(M, area) +
        "</div>" +
        "</div>";
    }

    var noticias = M.getNoticiasByArea(area.slug);
    var recursosSection = renderAreaRecursos(M, area);

    if (content) {
      content.innerHTML =
        '<div class="muni-content-band"><div class="muni-container">' +
        '<p class="muni-back-link"><a href="index.html">← Volver al portal</a></p>' +
        recursosSection +
        '<div class="muni-layout">' +
        "<div>" +
        '<div class="muni-section-label"><h2>Novedades de ' + M.escapeHtml(area.nombre) + "</h2></div>" +
        '<div id="muni-area-news-grid"></div>' +
        "</div>" +
        '<aside class="muni-sidebar">' +
        '<div class="muni-sidebar-block"><h3>Otras áreas</h3>' + M.renderAreaLinks(area.slug) + "</div>" +
        '<div class="muni-sidebar-block"><h3>Más leídas</h3>' +
        M.renderSidebarList(M.getTopNoticiasByViews(5), 5, {
          showViews: true,
          emptyText: "Todavía no hay lecturas registradas.",
        }) +
        "</div></aside></div></div></div>";
      var areaGrid = document.getElementById("muni-area-news-grid");
      if (areaGrid) {
        M.mountNoticiasGridWithOlderCollapse(areaGrid, noticias, {
          renderCard: M.renderCard,
          emptyText: "Esta área todavía no publicó novedades.",
          recentDays: 15,
        });
      }
      bindDocumentMenus(content);
      openDocumentoFromHash();
      window.addEventListener("hashchange", openDocumentoFromHash);
    }
  });
})();
