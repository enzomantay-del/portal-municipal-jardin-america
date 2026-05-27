(function () {
  "use strict";

  var DATA = { areas: [], noticias: [], eventosFlyers: [] };

  function setData(payload) {
    var areas = payload.areas || [];
    if (window.MuniApi && window.MuniApi.mergeAreasWithSeed) {
      areas = window.MuniApi.mergeAreasWithSeed(areas);
    } else if (window.MuniApi && window.MuniApi.filterVisibleAreas) {
      areas = window.MuniApi.filterVisibleAreas(areas);
    }
    DATA.areas = areas;
    DATA.noticias = payload.noticias || [];
    var eventos = payload.eventosFlyers || [];
    if (window.MuniApi && window.MuniApi.filterEventosActivos) {
      eventos = window.MuniApi.filterEventosActivos(eventos);
    }
    DATA.eventosFlyers = eventos;
    window.MuniPortal.DATA = DATA;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      var s = String(iso).slice(0, 10);
      var parts = s.split("-");
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (_e) {
      return iso;
    }
  }

  function getArea(slug) {
    return (DATA.areas || []).find(function (a) {
      return a.slug === slug;
    });
  }

  function getNoticia(idOrSlug) {
    return (DATA.noticias || []).find(function (n) {
      return n.id === idOrSlug || n.slug === idOrSlug;
    });
  }

  function getNoticiasByArea(areaSlug) {
    return (DATA.noticias || [])
      .filter(function (n) {
        return n.areaSlug === areaSlug;
      })
      .sort(byDateDesc);
  }

  function byDateDesc(a, b) {
    return new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion);
  }

  function getAllNoticiasSorted() {
    return (DATA.noticias || []).slice().sort(byDateDesc);
  }

  function getDestacada() {
    var sorted = getAllNoticiasSorted();
    var found = sorted.find(function (n) {
      return n.destacada;
    });
    return found || sorted[0] || null;
  }

  function estadoLabel(estado) {
    var map = {
      en_curso: "En curso",
      finalizado: "Finalizado",
      planificado: "Planificado",
    };
    return map[estado] || estado;
  }

  function estadoPublicacionLabel(estado) {
    var map = {
      borrador: "Borrador",
      pendiente: "Pendiente de aprobación",
      publicado: "Publicado",
      rechazado: "Rechazado",
    };
    return map[estado] || estado;
  }

  function noticiaUrl(noticia) {
    return "noticia.html?id=" + encodeURIComponent(noticia.id);
  }

  function areaUrl(area) {
    return "area.html?area=" + encodeURIComponent(area.slug);
  }

  function areaTagClass(slug) {
    if (slug.indexOf("obras") === 0) return "muni-card-tag--obras";
    var key = slug.replace(/-/g, "_").split("_")[0];
    var map = {
      intendencia: "intendencia",
      salud: "salud",
      zoonosis: "zoonosis",
      accion: "accion_social",
      oficina: "oficina_trabajo",
      turismo: "turismo",
      deportes: "deportes",
      ambiente: "ambiente",
      cultura: "cultura",
      concejo: "concejo",
    };
    return "muni-card-tag--" + (map[key] || "intendencia");
  }

  function placeholderImage(area) {
    var color = area && area.color ? area.color.replace("#", "") : "1ba3d4";
    return (
      "https://placehold.co/900x560/" + color + "/ffffff?text=" +
      encodeURIComponent(area ? area.nombre : "Municipalidad")
    );
  }

  function renderMeta(noticia, area) {
    return (
      '<div class="muni-meta">' +
      '<time datetime="' + escapeHtml(noticia.fechaPublicacion) + '">' +
      escapeHtml(formatDate(noticia.fechaPublicacion)) +
      "</time>" +
      (area
        ? '<span><a href="' + areaUrl(area) + '">' + escapeHtml(area.nombre) + "</a></span>"
        : "") +
      '<span class="muni-status muni-status--' + escapeHtml(noticia.estadoObra) + '">' +
      escapeHtml(estadoLabel(noticia.estadoObra)) +
      "</span>" +
      "</div>"
    );
  }

  function renderCard(noticia) {
    var area = getArea(noticia.areaSlug);
    var img = noticia.imagen || placeholderImage(area);
    return (
      '<article class="muni-card">' +
      '<a href="' + noticiaUrl(noticia) + '" class="muni-card-media" tabindex="-1" aria-hidden="true">' +
      '<img src="' + escapeHtml(img) + '" alt="" loading="lazy" width="480" height="300">' +
      "</a>" +
      (area
        ? '<a class="muni-card-tag ' + areaTagClass(area.slug) + '" href="' + areaUrl(area) + '">' +
          escapeHtml(area.nombre) +
          "</a>"
        : "") +
      '<h3 class="muni-card-title"><a href="' + noticiaUrl(noticia) + '">' + escapeHtml(noticia.titulo) + "</a></h3>" +
      '<p class="muni-card-excerpt">' + escapeHtml(noticia.bajada) + "</p>" +
      renderMeta(noticia, area) +
      "</article>"
    );
  }

  function renderHero(noticia) {
    if (!noticia) return "";
    var area = getArea(noticia.areaSlug);
    var img = noticia.imagen || placeholderImage(area);
    return (
      '<section class="muni-featured" aria-label="Noticia destacada">' +
      '<div class="muni-section-label muni-section-label--compact">' +
      '<h2>Destacado</h2>' +
      "</div>" +
      '<div class="muni-hero">' +
      '<div class="muni-hero-media">' +
      '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(noticia.titulo) + '" width="900" height="560">' +
      "</div>" +
      '<div class="muni-hero-body">' +
      (area
        ? '<p class="muni-hero-kicker">' +
          renderAreaIcon(area.slug, "muni-hero-kicker-icon") +
          "<span>" + escapeHtml(area.nombre) + "</span></p>"
        : "") +
      '<h3 class="muni-hero-title"><a href="' + noticiaUrl(noticia) + '">' + escapeHtml(noticia.titulo) + "</a></h3>" +
      '<p class="muni-hero-excerpt">' + escapeHtml(noticia.bajada) + "</p>" +
      '<a class="muni-btn muni-btn--primary" href="' + noticiaUrl(noticia) + '">Leer novedad</a>' +
      renderMeta(noticia, area) +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function renderSidebarList(noticias, limit) {
    var items = noticias.slice(0, limit || 5);
    if (!items.length) {
      return '<p class="muni-empty">No hay novedades recientes.</p>';
    }
    return (
      '<ul class="muni-sidebar-list">' +
      items
        .map(function (n) {
          return (
            "<li>" +
            '<a href="' + noticiaUrl(n) + '">' + escapeHtml(n.titulo) + "</a>" +
            '<div class="muni-meta"><time datetime="' + escapeHtml(n.fechaPublicacion) + '">' +
            escapeHtml(formatDate(n.fechaPublicacion)) +
            "</time></div>" +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function renderAreaLinks(activeSlug) {
    return (
      '<div class="muni-area-links">' +
      (DATA.areas || [])
        .map(function (area) {
          var count = getNoticiasByArea(area.slug).length;
          return (
            '<a class="muni-area-link' + (area.slug === activeSlug ? " is-active" : "") + '" href="' + areaUrl(area) + '">' +
            '<span class="muni-area-dot" style="background:' + escapeHtml(area.color) + '"></span>' +
            "<span>" + escapeHtml(area.nombre) + " (" + count + ")</span>" +
            "</a>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderAreaIcon(slug, className) {
    if (window.MuniIcons && window.MuniIcons.renderAreaIcon) {
      return window.MuniIcons.renderAreaIcon(slug, className);
    }
    return '<span class="' + (className || "muni-icon") + '" aria-hidden="true"></span>';
  }

  function renderAreasStrip() {
    return (
      '<div class="muni-areas-grid">' +
      (DATA.areas || [])
        .map(function (area) {
          var count = getNoticiasByArea(area.slug).length;
          return (
            '<a class="muni-area-tile" href="' + areaUrl(area) + '">' +
            renderAreaIcon(area.slug, "muni-area-tile-icon") +
            '<span class="muni-area-tile-name">' + escapeHtml(area.nombre) + "</span>" +
            '<span class="muni-area-tile-count">' + count + " novedad" + (count !== 1 ? "es" : "") + "</span>" +
            "</a>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  var NAV_PRIMARY_AREAS = {
    intendencia: "Intendencia",
    "concejo-deliberante": "Concejo Deliberante",
  };

  function getNavAreas() {
    var areas = DATA.areas.length
      ? DATA.areas.slice()
      : (window.MUNI_FIREBASE_SEED_AREAS || (window.MUNI_DATA && window.MUNI_DATA.areas)) || [];
    if (window.MuniApi && window.MuniApi.mergeAreasWithSeed) {
      areas = window.MuniApi.mergeAreasWithSeed(areas);
    } else if (window.MuniApi && window.MuniApi.filterVisibleAreas) {
      areas = window.MuniApi.filterVisibleAreas(areas);
    }
    return areas.slice().sort(function (a, b) {
      return (a.orden != null ? a.orden : 99) - (b.orden != null ? b.orden : 99);
    });
  }

  function buildNavListHtml(activePage, activeAreaSlug) {
    var html =
      '<li><a href="index.html" data-nav="inicio">Inicio</a></li>' +
      '<li><a href="index.html#proximos-eventos" data-nav="eventos">Próximos eventos</a></li>' +
      '<li><a href="index.html#ultimas-novedades" data-nav="noticias">Novedades</a></li>' +
      '<li><a href="area.html?area=intendencia" data-nav-area="intendencia">Intendencia</a></li>' +
      '<li><a href="area.html?area=concejo-deliberante" data-nav-area="concejo-deliberante">Concejo Deliberante</a></li>';

    var dropdownAreas = getNavAreas().filter(function (area) {
      return !NAV_PRIMARY_AREAS[area.slug];
    });

    if (dropdownAreas.length) {
      html +=
        '<li class="muni-nav-dropdown">' +
        '<details class="muni-nav-details">' +
        '<summary class="muni-nav-dropdown-trigger">Áreas municipales</summary>' +
        '<ul class="muni-nav-dropdown-menu">';
      dropdownAreas.forEach(function (area) {
        html +=
          '<li><a href="' +
          areaUrl(area) +
          '" data-nav-area="' +
          escapeHtml(area.slug) +
          '">' +
          escapeHtml(area.nombre) +
          "</a></li>";
      });
      html += "</ul></details></li>";
    }

    html +=
      '<li><a href="index.html#contacto" data-nav="contacto">Contacto</a></li>' +
      '<li><a href="index.html#recibir-avisos" class="muni-nav-cta" data-nav="avisos">Recibir avisos</a></li>';

    return html;
  }

  function bindNavDropdowns() {
    document.querySelectorAll(".muni-nav-details").forEach(function (details) {
      if (details.dataset.bound) return;
      details.dataset.bound = "1";
      details.addEventListener("toggle", function () {
        if (!details.open) return;
        document.querySelectorAll(".muni-nav-details").forEach(function (other) {
          if (other !== details) other.open = false;
        });
      });
    });
  }

  function applyNavActive(activePage, activeAreaSlug) {
    document.querySelectorAll(".muni-nav-list a, .muni-nav-dropdown-trigger").forEach(function (link) {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
    });

    if (activeAreaSlug) {
      var areaLink = document.querySelector('.muni-nav-list a[data-nav-area="' + activeAreaSlug + '"]');
      if (areaLink) {
        areaLink.classList.add("is-active");
        areaLink.setAttribute("aria-current", "page");
        var dropdown = areaLink.closest(".muni-nav-details");
        if (dropdown) {
          dropdown.open = true;
          var trigger = dropdown.querySelector(".muni-nav-dropdown-trigger");
          if (trigger) trigger.classList.add("is-active");
        }
      }
      return;
    }

    if (activePage) {
      document.querySelectorAll('.muni-nav-list a[data-nav="' + activePage + '"]').forEach(function (link) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      });
    }
  }

  function initNav(activePage, activeAreaSlug) {
    var toggle = document.getElementById("muni-nav-toggle");
    var nav = document.getElementById("muni-nav");

    function closeMobileNav() {
      if (!nav) return;
      nav.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    if (toggle && nav && !toggle.dataset.bound) {
      toggle.dataset.bound = "1";
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    if (nav && !nav.dataset.boundClose) {
      nav.dataset.boundClose = "1";
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) closeMobileNav();
      });
    }

    if (!window._muniNavResizeBound) {
      window._muniNavResizeBound = true;
      window.addEventListener("resize", function () {
        if (window.matchMedia("(min-width: 993px)").matches) closeMobileNav();
      });
    }

    var dateEl = document.getElementById("muni-fecha-hoy");
    if (dateEl) {
      var compactDate = window.matchMedia("(max-width: 480px)").matches;
      dateEl.textContent = new Date().toLocaleDateString(
        "es-AR",
        compactDate
          ? { weekday: "short", day: "numeric", month: "short", year: "numeric" }
          : { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      );
    }

    var list = document.getElementById("muni-nav-list");
    if (list) {
      list.innerHTML = buildNavListHtml(activePage, activeAreaSlug);
      bindNavDropdowns();
    }

    applyNavActive(activePage, activeAreaSlug);
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function showLoading(containerId) {
    var el = document.getElementById(containerId);
    if (el) {
      el.innerHTML = '<p class="muni-empty" role="status">Cargando novedades…</p>';
    }
  }

  function formatEventoDate(iso) {
    if (!iso) return "";
    try {
      var s = String(iso).slice(0, 10);
      var parts = s.split("-");
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("es-AR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch (_e) {
      return iso;
    }
  }

  function renderEventosSection(eventos) {
    if (!eventos || !eventos.length) return "";

    var cards = eventos
      .map(function (ev, index) {
        var area = getArea(ev.areaSlug);
        var areaName = area ? area.nombre : ev.areaSlug;
        var tagClass = area ? areaTagClass(area.slug) : "muni-card-tag--intendencia";
        var alt = ev.titulo || "Flyer de evento — " + areaName;
        return (
          '<article class="muni-evento-card">' +
          '<span class="muni-evento-area ' + tagClass + '">' + escapeHtml(areaName) + "</span>" +
          '<button type="button" class="muni-evento-flyer-btn" data-evento-index="' + index + '" aria-label="' +
          escapeHtml("Ampliar flyer: " + alt) + '">' +
          '<img src="' + escapeHtml(ev.imagenUrl) + '" alt="' + escapeHtml(alt) + '" loading="lazy" width="270" height="480">' +
          '<span class="muni-evento-zoom" aria-hidden="true">Ampliar</span>' +
          "</button>" +
          '<time class="muni-evento-date" datetime="' + escapeHtml(ev.fechaEvento) + '">' +
          escapeHtml(formatEventoDate(ev.fechaEvento)) +
          "</time>" +
          "</article>"
        );
      })
      .join("");

    return (
      '<section class="muni-eventos-strip" id="proximos-eventos" aria-labelledby="titulo-eventos">' +
      '<div class="muni-container">' +
      '<div class="muni-eventos-head">' +
      '<div class="muni-section-label muni-section-label--compact">' +
      '<h2 id="titulo-eventos">Próximos eventos</h2>' +
      "</div>" +
      '<p class="muni-eventos-lead">Flyers oficiales de actividades municipales. Tocá una imagen para verla en grande.</p>' +
      "</div>" +
      '<div class="muni-eventos-scroller-wrap">' +
      '<button type="button" class="muni-eventos-nav muni-eventos-nav--prev" data-eventos-prev aria-label="Eventos anteriores">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>' +
      "</button>" +
      '<div class="muni-eventos-scroller" id="muni-eventos-scroller" tabindex="0">' +
      cards +
      "</div>" +
      '<button type="button" class="muni-eventos-nav muni-eventos-nav--next" data-eventos-next aria-label="Siguientes eventos">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
      "</button>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  async function bootstrapPublicData() {
    if (window.MuniApi && window.MuniApi.isConfigured()) {
      try {
        return await window.MuniApi.loadPublicPortalData();
      } catch (err) {
        console.warn("Error al cargar portal desde Firebase; intentando recuperar novedades.", err);
        var noticias = [];
        try {
          if (window.MuniApi.loadTrabajosPublic) {
            noticias = await window.MuniApi.loadTrabajosPublic();
          }
        } catch (trabajosErr) {
          console.warn("No se pudieron cargar novedades desde Firebase.", trabajosErr);
        }
        if (noticias.length) {
          return {
            source: "partial",
            error: (err && err.message) || String(err),
            areas: window.MUNI_DATA.areas,
            noticias: noticias,
            eventosFlyers: [],
          };
        }
        return {
          source: "error",
          error: (err && err.message) || String(err),
          areas: window.MUNI_DATA.areas,
          noticias: window.MUNI_DATA.noticias || [],
          eventosFlyers: (window.MUNI_DATA && window.MUNI_DATA.eventosFlyers) || [],
        };
      }
    }
    return {
      source: "demo",
      areas: window.MUNI_DATA.areas,
      noticias: window.MUNI_DATA.noticias,
      eventosFlyers: (window.MUNI_DATA && window.MUNI_DATA.eventosFlyers) || [],
    };
  }

  window.MuniPortal = {
    DATA: DATA,
    setData: setData,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    formatEventoDate: formatEventoDate,
    getArea: getArea,
    getNoticia: getNoticia,
    getNoticiasByArea: getNoticiasByArea,
    getAllNoticiasSorted: getAllNoticiasSorted,
    getDestacada: getDestacada,
    estadoLabel: estadoLabel,
    estadoPublicacionLabel: estadoPublicacionLabel,
    areaTagClass: areaTagClass,
    placeholderImage: placeholderImage,
    noticiaUrl: noticiaUrl,
    areaUrl: areaUrl,
    renderCard: renderCard,
    renderHero: renderHero,
    renderAreaIcon: renderAreaIcon,
    renderSidebarList: renderSidebarList,
    renderAreaLinks: renderAreaLinks,
    renderAreasStrip: renderAreasStrip,
    renderEventosSection: renderEventosSection,
    renderMeta: renderMeta,
    initNav: initNav,
    getQueryParam: getQueryParam,
    showLoading: showLoading,
    bootstrapPublicData: bootstrapPublicData,
  };
})();
