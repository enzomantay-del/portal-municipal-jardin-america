(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderMapCard(mapa, index) {
    var alt = mapa.titulo + " — Municipalidad de Jardín América (" + mapa.version + ")";
    return (
      '<article class="muni-mapas-card" data-map-index="' +
      index +
      '">' +
      '<button type="button" class="muni-mapas-thumb" data-map-open="' +
      index +
      '" aria-label="Ampliar ' +
      escapeHtml(mapa.titulo) +
      '">' +
      '<img src="' +
      escapeHtml(mapa.archivo) +
      '" alt="' +
      escapeHtml(alt) +
      '" loading="lazy" decoding="async">' +
      "</button>" +
      '<div class="muni-mapas-card-body">' +
      "<h2>" +
      escapeHtml(mapa.titulo) +
      "</h2>" +
      '<p class="muni-mapas-version">' +
      escapeHtml(mapa.version) +
      "</p>" +
      "<p>" +
      escapeHtml(mapa.descripcion) +
      "</p>" +
      '<div class="muni-mapas-card-actions">' +
      '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-map-open="' +
      index +
      '">Ver en grande</button>' +
      '<a class="muni-btn muni-btn--secondary muni-btn--sm" href="' +
      escapeHtml(mapa.archivo) +
      '" download="' +
      escapeHtml(mapa.nombreDescarga) +
      '">' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>' +
      "Descargar</a>" +
      "</div>" +
      "</div></article>"
    );
  }

  function initLightbox(catalog) {
    var lightbox = document.getElementById("muni-mapas-lightbox");
    if (!lightbox) return;

    var img = lightbox.querySelector(".muni-lightbox-img");
    var caption = lightbox.querySelector(".muni-lightbox-caption");
    var closeBtn = lightbox.querySelector("[data-map-lightbox-close]");
    var prevBtn = lightbox.querySelector("[data-map-lightbox-prev]");
    var nextBtn = lightbox.querySelector("[data-map-lightbox-next]");
    var downloadBtn = lightbox.querySelector("[data-map-lightbox-download]");
    var active = 0;

    function show(index) {
      var mapa = catalog[index];
      if (!mapa || !img) return;
      active = index;
      img.src = mapa.archivo;
      img.alt = mapa.titulo + " — Municipalidad de Jardín América";
      if (caption) {
        caption.textContent = mapa.titulo + " · " + mapa.version;
      }
      if (downloadBtn) {
        downloadBtn.href = mapa.archivo;
        downloadBtn.setAttribute("download", mapa.nombreDescarga);
      }
      lightbox.hidden = false;
      document.body.classList.add("muni-lightbox-open");
    }

    function hide() {
      lightbox.hidden = true;
      document.body.classList.remove("muni-lightbox-open");
      if (img) img.removeAttribute("src");
    }

    document.addEventListener("click", function (event) {
      var openBtn = event.target.closest("[data-map-open]");
      if (openBtn) {
        var idx = Number(openBtn.getAttribute("data-map-open"));
        if (!Number.isNaN(idx)) show(idx);
      }
    });

    if (closeBtn) closeBtn.addEventListener("click", hide);
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        show((active - 1 + catalog.length) % catalog.length);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        show((active + 1) % catalog.length);
      });
    }

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) hide();
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;
      if (event.key === "Escape") hide();
      if (event.key === "ArrowLeft") show((active - 1 + catalog.length) % catalog.length);
      if (event.key === "ArrowRight") show((active + 1) % catalog.length);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("muni-mapas-grid");
    var catalog = window.MUNI_MAPAS_CATALOG || [];
    if (!grid || !catalog.length) return;

    grid.innerHTML = catalog.map(renderMapCard).join("");
    initLightbox(catalog);
  });
})();
