(function () {
  "use strict";

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
        '<p class="muni-area-contact">' +
        "<strong>Responsable:</strong> " + M.escapeHtml(area.responsable) +
        " · <strong>Contacto:</strong> " + M.escapeHtml(area.contacto) +
        "</p>" +
        "</div>" +
        "</div>";
    }

    var noticias = M.getNoticiasByArea(area.slug);

    if (content) {
      content.innerHTML =
        '<div class="muni-content-band"><div class="muni-container">' +
        '<p class="muni-back-link"><a href="index.html">← Volver al portal</a></p>' +
        '<div class="muni-layout">' +
        "<div>" +
        '<div class="muni-section-label"><h2>Novedades de ' + M.escapeHtml(area.nombre) + "</h2></div>" +
        (noticias.length
          ? '<div class="muni-news-grid">' + noticias.map(M.renderCard).join("") + "</div>"
          : '<p class="muni-empty">Esta área todavía no publicó novedades.</p>') +
        "</div>" +
        '<aside class="muni-sidebar">' +
        '<div class="muni-sidebar-block"><h3>Otras áreas</h3>' + M.renderAreaLinks(area.slug) + "</div>" +
        '<div class="muni-sidebar-block"><h3>Últimas del portal</h3>' +
        M.renderSidebarList(M.getAllNoticiasSorted(), 5) +
        "</div></aside></div></div></div>";
    }
  });
})();
