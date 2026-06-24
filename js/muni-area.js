(function () {
  "use strict";

  function renderEncargadoBlock(M, area) {
    var isIntendencia = area.slug === "intendencia";
    var showContacto = !isIntendencia && area.contacto;
    if (!area.responsable && !showContacto && !area.fotoEncargado) return "";

    var cargoLabel = isIntendencia ? "Intendente:" : "Responsable:";

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

  function mapIconSvg() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16M16 6v16"/></svg>'
    );
  }

  function renderAreaActions(M, area) {
    var buttons = [];

    if (area.webExterna) {
      buttons.push(
        '<a class="muni-btn muni-btn--turismo" href="' +
          M.escapeHtml(area.webExterna) +
          '" target="_blank" rel="noopener noreferrer">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/></svg>' +
          "Información turística</a>"
      );
    }

    if (area.folletoUrl) {
      buttons.push(
        '<a class="muni-btn muni-btn--folleto" href="' +
          M.escapeHtml(area.folletoUrl) +
          '">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>' +
          "Folleto turístico</a>"
      );
    }

    if (area.mapasUrl) {
      buttons.push(
        '<a class="muni-btn muni-btn--mapas" href="' +
          M.escapeHtml(area.mapasUrl) +
          '">' +
          mapIconSvg() +
          "Mapas municipales</a>"
      );
    }

    if (area.mapaBarriosUrl) {
      buttons.push(
        '<a class="muni-btn muni-btn--mapas" href="' +
          M.escapeHtml(area.mapaBarriosUrl) +
          '" target="_blank" rel="noopener noreferrer">' +
          mapIconSvg() +
          "Mapa de barrios</a>"
      );
    }

    if (!buttons.length) return "";
    return '<div class="muni-area-actions">' + buttons.join("") + "</div>";
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
        renderAreaActions(M, area) +
        "</div>" +
        "</div>";
    }

    var noticias = M.getNoticiasByArea(area.slug);
    var mapasTeaser =
      area.slug === "obras-privadas"
        ? '<section class="muni-mapas-teaser" aria-label="Mapas y planos">' +
          '<div class="muni-mapas-teaser-inner">' +
          "<div>" +
          "<h2>Mapas y planos</h2>" +
          "<p>Consultá los planos oficiales del municipio y el mapa interactivo de barrios de Jardín América en OpenStreetMap.</p>" +
          "</div>" +
          '<div class="muni-mapas-teaser-actions">' +
          '<a class="muni-btn muni-btn--mapas" href="mapas-municipales.html">' +
          mapIconSvg() +
          "Mapas municipales</a>" +
          (area.mapaBarriosUrl
            ? '<a class="muni-btn muni-btn--mapas" href="' +
              M.escapeHtml(area.mapaBarriosUrl) +
              '" target="_blank" rel="noopener noreferrer">' +
              mapIconSvg() +
              "Mapa de barrios</a>"
            : "") +
          "</div></div></section>"
        : "";

    if (content) {
      content.innerHTML =
        '<div class="muni-content-band"><div class="muni-container">' +
        '<p class="muni-back-link"><a href="index.html">← Volver al portal</a></p>' +
        mapasTeaser +
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
    }
  });
})();
