(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    var M = window.MuniPortal;
    if (!M) return;

    M.initNav("noticias");

    var id = M.getQueryParam("id");
    var main = document.getElementById("muni-noticia-main");
    if (main) {
      main.innerHTML = '<div class="muni-container"><p class="muni-empty" role="status">Cargando novedad…</p></div>';
    }

    var payload = await M.bootstrapPublicData();
    M.setData(payload);
    M.initNav("noticias");

    var noticia = id ? M.getNoticia(id) : null;

    if (!noticia && id && window.MuniApi && window.MuniApi.isConfigured()) {
      noticia = await window.MuniApi.loadTrabajoById(id);
      if (noticia) {
        var merged = payload.noticias.slice();
        if (!merged.find(function (n) { return n.id === noticia.id; })) {
          merged.push(noticia);
        }
        M.setData({ areas: payload.areas, noticias: merged });
      }
    }

    if (!noticia) {
      document.title = "Noticia no encontrada | Municipalidad de Jardín América";
      if (main) {
        main.innerHTML =
          '<div class="muni-container">' +
          '<p class="muni-back-link"><a href="index.html">← Volver al inicio</a></p>' +
          '<p class="muni-empty">No encontramos la novedad solicitada.</p>' +
          "</div>";
      }
      return;
    }

    var area = M.getArea(noticia.areaSlug);
    document.title = noticia.titulo + " | Municipalidad de Jardín América";

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", noticia.bajada);

    var img = noticia.imagen || M.placeholderImage(area);
    if (window.MuniShare) {
      window.MuniShare.setNoticiaSocialMeta(noticia);
    }

    var related = M.getNoticiasByArea(noticia.areaSlug)
      .filter(function (n) { return n.id !== noticia.id; })
      .slice(0, 4);

    if (main) {
      main.innerHTML =
        '<div class="muni-container"><div class="muni-layout">' +
        '<article class="muni-article">' +
        (area
          ? '<p class="muni-back-link"><a href="' + M.areaUrl(area) + '">← ' + M.escapeHtml(area.nombre) + "</a></p>"
          : '<p class="muni-back-link"><a href="index.html">← Volver al portal</a></p>') +
        '<header class="muni-article-header">' +
        (area
          ? '<a class="muni-card-tag ' + M.areaTagClass(area.slug) + '" href="' + M.areaUrl(area) + '">' +
            M.escapeHtml(area.nombre) + "</a>"
          : "") +
        "<h1 class=\"muni-article-title\">" + M.escapeHtml(noticia.titulo) + "</h1>" +
        '<p class="muni-article-lead">' + M.escapeHtml(noticia.bajada) + "</p>" +
        M.renderMeta(noticia, area) +
        "</header>" +
        '<figure class="muni-article-cover"><img src="' + M.escapeHtml(img) + '" alt="' + M.escapeHtml(noticia.titulo) + '" fetchpriority="high" decoding="async"></figure>' +
        '<dl class="muni-article-info">' +
        "<div><dt>Ubicación</dt><dd>" + M.escapeHtml(noticia.ubicacion) + "</dd></div>" +
        "<div><dt>Barrio</dt><dd>" + M.escapeHtml(noticia.barrio) + "</dd></div>" +
        "<div><dt>Estado</dt><dd>" + M.escapeHtml(M.estadoLabel(noticia.estadoObra)) + "</dd></div>" +
        "<div><dt>Publicado</dt><dd>" + M.escapeHtml(M.formatDate(noticia.fechaPublicacion)) + "</dd></div>" +
        "</dl>" +
        '<div class="muni-article-body">' + noticia.cuerpo + "</div>" +
        (window.MuniEngagement ? window.MuniEngagement.renderLikeButton(noticia) : "") +
        '<div data-share-article-footer></div>' +
        "</article>" +
        '<aside class="muni-sidebar">' +
        (related.length
          ? '<div class="muni-sidebar-block"><h3>Más de ' + M.escapeHtml(area ? area.nombre : "esta área") + "</h3>" +
            M.renderSidebarList(related, 4) + "</div>"
          : "") +
        '<div class="muni-sidebar-block"><h3>Más leídas</h3>' +
        M.renderSidebarList(M.getTopNoticiasByViews(5, noticia.id), 5, {
          showViews: true,
          emptyText: "Todavía no hay lecturas registradas.",
        }) +
        "</div></aside></div></div>";
      if (window.MuniShare) {
        window.MuniShare.mountArticleShare(main, noticia);
      }
      if (window.MuniEngagement) {
        window.MuniEngagement.bindLikeButtons(main);
        window.MuniEngagement.trackView(noticia.id).then(function (result) {
          if (!result || result.skipped) return;
          if (result.ok && result.recorded) {
            var viewsEl = main.querySelector("[data-engagement-views]");
            if (viewsEl) {
              viewsEl.textContent = String((Number(viewsEl.textContent) || 0) + 1);
            }
          } else if (!result.ok) {
            console.warn("MuniEngagement.trackView", result.error || result);
          }
        });
      }
    }
  });
})();
