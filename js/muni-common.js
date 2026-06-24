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

  function isTrabajoFinalizado(estadoObra) {
    return estadoObra === "finalizado";
  }

  function byObraThenDateDesc(a, b) {
    var aFinal = isTrabajoFinalizado(a.estadoObra);
    var bFinal = isTrabajoFinalizado(b.estadoObra);
    if (aFinal !== bFinal) return aFinal ? 1 : -1;

    var av = a.publicadoEn || a.fechaPublicacion || "";
    var bv = b.publicadoEn || b.fechaPublicacion || "";
    if (av === bv) return 0;
    return av > bv ? -1 : 1;
  }

  function getNoticiasByArea(areaSlug) {
    return (DATA.noticias || [])
      .filter(function (n) {
        return n.areaSlug === areaSlug;
      })
      .sort(byObraThenDateDesc);
  }

  function getAllNoticiasSorted() {
    return (DATA.noticias || []).slice().sort(byObraThenDateDesc);
  }

  function todayIsoArgentina() {
    if (window.MuniApi && window.MuniApi.todayIsoArgentina) {
      return window.MuniApi.todayIsoArgentina();
    }
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  }

  function daysAgoIsoArgentina(days) {
    var parts = todayIsoArgentina().split("-");
    var dt = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    dt.setDate(dt.getDate() - days);
    return dt.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  }

  function noticiaReferenceDate(noticia) {
    if (!noticia) return "";
    if (noticia.fechaPublicacion) return String(noticia.fechaPublicacion).slice(0, 10);
    if (noticia.publicadoEn) return String(noticia.publicadoEn).slice(0, 10);
    return "";
  }

  function isNoticiaRecent(noticia, days) {
    days = days || 15;
    var fecha = noticiaReferenceDate(noticia);
    if (!fecha) return true;
    return fecha >= daysAgoIsoArgentina(days);
  }

  function splitNoticiasByRecency(noticias, days) {
    var recent = [];
    var older = [];
    (noticias || []).forEach(function (n) {
      if (isNoticiaRecent(n, days)) recent.push(n);
      else older.push(n);
    });
    return { recent: recent, older: older };
  }

  function mountNoticiasGridWithOlderCollapse(container, noticias, options) {
    if (!container) return;
    options = options || {};
    var days = options.recentDays || 15;
    var expanded = false;
    var split = splitNoticiasByRecency(noticias, days);
    var emptyText = options.emptyText || "Todavía no hay novedades publicadas.";

    function paint() {
      var html = "";
      if (split.recent.length) {
        html += '<div class="muni-news-grid">' + split.recent.map(options.renderCard).join("") + "</div>";
      } else if (!split.older.length) {
        html += '<p class="muni-empty">' + escapeHtml(emptyText) + "</p>";
      }

      if (split.older.length) {
        html +=
          '<div class="muni-noticias-older-wrap">' +
          '<button type="button" class="muni-btn muni-btn--ghost muni-noticias-older-toggle" data-noticias-older-toggle aria-expanded="' +
          (expanded ? "true" : "false") +
          '">' +
          (expanded
            ? "Ocultar novedades anteriores (" + split.older.length + ")"
            : "Ver " + split.older.length + " novedades anteriores (más de " + days + " días)") +
          "</button>" +
          '<div class="muni-noticias-older-list"' +
          (expanded ? "" : " hidden") +
          ">" +
          '<div class="muni-news-grid">' +
          split.older.map(options.renderCard).join("") +
          "</div></div></div>";
      }

      container.innerHTML = html;
    }

    if (!container._muniOlderToggleBound) {
      container._muniOlderToggleBound = true;
      container.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-noticias-older-toggle]");
        if (!btn || !container.contains(btn)) return;
        expanded = !expanded;
        paint();
      });
    }

    paint();
  }

  function getTopNoticiasByViews(limit, excludeId) {
    return getAllNoticiasSorted()
      .filter(function (n) {
        return !excludeId || n.id !== excludeId;
      })
      .slice()
      .sort(function (a, b) {
        var av = Number(a.viewsCount) || 0;
        var bv = Number(b.viewsCount) || 0;
        if (bv !== av) return bv - av;
        return byObraThenDateDesc(a, b);
      })
      .slice(0, limit || 6);
  }

  function formatEngagementCount(value) {
    var n = Number(value) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
    return String(n);
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
      juventud: "juventud",
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
      '<img src="' + escapeHtml(img) + '" alt="" loading="lazy" decoding="async" width="480" height="300">' +
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
      '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(noticia.titulo) + '" fetchpriority="high" decoding="async" width="900" height="560">' +
      "</div>" +
      '<div class="muni-hero-body">' +
      (area
        ? '<p class="muni-hero-kicker">' +
          renderAreaIcon(area.slug, "muni-hero-kicker-icon") +
          "<span>" + escapeHtml(area.nombre) + "</span></p>"
        : "") +
      '<h3 class="muni-hero-title"><a href="' + noticiaUrl(noticia) + '">' + escapeHtml(noticia.titulo) + "</a></h3>" +
      '<p class="muni-hero-excerpt">' + escapeHtml(noticia.bajada) + "</p>" +
      '<div class="muni-portal-hero-actions">' +
      '<a class="muni-btn muni-btn--primary" href="' + noticiaUrl(noticia) + '">Leer novedad</a>' +
      "</div>" +
      renderMeta(noticia, area) +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function renderSidebarList(noticias, limit, options) {
    options = options || {};
    var items = noticias.slice(0, limit || 5);
    if (!items.length) {
      return '<p class="muni-empty">' + escapeHtml(options.emptyText || "No hay novedades recientes.") + "</p>";
    }
    return (
      '<ul class="muni-sidebar-list">' +
      items
        .map(function (n) {
          var views = Number(n.viewsCount) || 0;
          var statsHtml =
            options.showViews && views > 0
              ? '<div class="muni-sidebar-stat"><span aria-hidden="true">👁</span> ' +
                escapeHtml(formatEngagementCount(views)) +
                " lecturas</div>"
              : "";
          return (
            "<li>" +
            '<a href="' + noticiaUrl(n) + '">' + escapeHtml(n.titulo) + "</a>" +
            '<div class="muni-meta"><time datetime="' + escapeHtml(n.fechaPublicacion) + '">' +
            escapeHtml(formatDate(n.fechaPublicacion)) +
            "</time></div>" +
            statsHtml +
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
      '<li><a href="eventos.html" data-nav="eventos">Eventos</a></li>' +
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
      '<li><a href="index.html#contacto" data-nav="contacto">Contacto</a></li>';

    return html;
  }

  function bindNavDropdowns() {
    document.querySelectorAll(".muni-nav-dropdown").forEach(function (wrap) {
      var details = wrap.querySelector(".muni-nav-details");
      if (!details || details.dataset.bound) return;
      details.dataset.bound = "1";

      details.addEventListener("toggle", function () {
        if (!details.open) return;
        document.querySelectorAll(".muni-nav-details").forEach(function (other) {
          if (other !== details) other.open = false;
        });
      });

      wrap.addEventListener("mouseenter", function () {
        if (window.matchMedia("(min-width: 993px)").matches) {
          details.open = true;
        }
      });

      wrap.addEventListener("mouseleave", function () {
        if (window.matchMedia("(min-width: 993px)").matches) {
          details.open = false;
        }
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

  function initStaffLinks() {
    var html =
      '<li><a href="encargado.html">Panel encargados</a></li>' +
      '<li><a href="admin.html">Administración</a></li>';
    var topbar = document.querySelector(".muni-topbar-links");
    if (topbar && !topbar.dataset.staffLinks) {
      topbar.dataset.staffLinks = "1";
      topbar.insertAdjacentHTML("beforeend", html);
    }
    var footer = document.querySelector(".muni-footer-nav");
    if (footer && !footer.dataset.staffLinks) {
      footer.dataset.staffLinks = "1";
      footer.insertAdjacentHTML("beforeend", html);
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
    initStaffLinks();
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

  function formatEventoDateLong(iso) {
    if (!iso) return "";
    try {
      var s = String(iso).slice(0, 10);
      var parts = s.split("-");
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (_e) {
      return iso;
    }
  }

  function todayIsoArgentina() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  }

  function parseIsoDate(iso) {
    var s = String(iso || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var p = s.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function isoFromLocalDate(d) {
    if (!d) return "";
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function filterEventosByPeriod(eventos, period) {
    var list = eventos || [];
    if (!period || period === "todos") return list.slice();
    var todayDate = parseIsoDate(todayIsoArgentina());
    if (!todayDate) return list.slice();

    if (period === "mes") {
      var y = todayDate.getFullYear();
      var m = todayDate.getMonth();
      return list.filter(function (ev) {
        var d = parseIsoDate(ev.fechaEvento);
        return d && d.getFullYear() === y && d.getMonth() === m;
      });
    }

    if (period === "finde") {
      var day = todayDate.getDay();
      var sat = new Date(todayDate);
      if (day === 0) sat.setDate(sat.getDate() - 1);
      else if (day !== 6) sat.setDate(sat.getDate() + (6 - day));
      var sun = new Date(sat);
      sun.setDate(sun.getDate() + 1);
      var satIso = isoFromLocalDate(sat);
      var sunIso = isoFromLocalDate(sun);
      return list.filter(function (ev) {
        var f = String(ev.fechaEvento || "").slice(0, 10);
        return f === satIso || f === sunIso;
      });
    }

    return list.slice();
  }

  function buildGoogleCalendarUrl(ev) {
    var title = ev.titulo || "Evento municipal";
    var area = getArea(ev.areaSlug);
    if (area) title = title + " — " + area.nombre;
    var date = String(ev.fechaEvento || "").slice(0, 10).replace(/-/g, "");
    if (!date) return "";
    var nextDay = date;
    var details = "Evento publicado en el portal municipal de Jardín América.";
    if (ev.imagenUrl) details += " Flyer: " + ev.imagenUrl;
    return (
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(title) +
      "&dates=" + date + "/" + nextDay +
      "&details=" + encodeURIComponent(details)
    );
  }

  function downloadEventoIcs(ev) {
    var title = ev.titulo || "Evento municipal";
    var area = getArea(ev.areaSlug);
    if (area) title = title + " — " + area.nombre;
    var date = String(ev.fechaEvento || "").slice(0, 10).replace(/-/g, "");
    if (!date) return;
    var ics =
      "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Municipalidad Jardin America//Portal//ES\r\n" +
      "BEGIN:VEVENT\r\nUID:" + (ev.id || date) + "@jardinamerica.gov.ar\r\n" +
      "DTSTAMP:" + date + "T120000Z\r\n" +
      "DTSTART;VALUE=DATE:" + date + "\r\n" +
      "SUMMARY:" + title.replace(/[,;\\]/g, " ") + "\r\n" +
      "DESCRIPTION:Evento municipal Jardin America\r\n" +
      "END:VEVENT\r\nEND:VCALENDAR";
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "evento-jardin-america.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function renderEventosSection(eventos) {
    if (!eventos || !eventos.length) return "";

    var cards = eventos
      .map(function (ev, index) {
        var area = getArea(ev.areaSlug);
        var areaName = area ? area.nombre : ev.areaSlug;
        var tagClass = area ? areaTagClass(area.slug) : "muni-card-tag--intendencia";
        var alt = ev.titulo || "Evento — " + areaName;
        var tipoIcon = window.MuniAgendaRender && window.MuniAgendaRender.tipoIcon
          ? window.MuniAgendaRender.tipoIcon(ev.tipoEvento)
          : "📌";
        var visual = ev.imagenUrl
          ? '<img src="' + escapeHtml(ev.imagenUrl) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async" width="270" height="480">'
          : '<div class="muni-evento-flyer-placeholder" aria-hidden="true"><span class="muni-evento-flyer-placeholder-icon">' +
            tipoIcon +
            '</span><p class="muni-evento-flyer-placeholder-title">' +
            escapeHtml(ev.titulo || areaName) +
            "</p></div>";
        return (
          '<article class="muni-evento-card">' +
          '<span class="muni-evento-area ' + tagClass + '">' + escapeHtml(areaName) + "</span>" +
          (ev.imagenUrl
            ? '<button type="button" class="muni-evento-flyer-btn" data-evento-index="' + index + '" aria-label="' +
              escapeHtml("Ampliar flyer: " + alt) + '">'
            : '<div class="muni-evento-flyer-btn muni-evento-flyer-btn--placeholder" aria-hidden="true">') +
          visual +
          (ev.imagenUrl ? '<span class="muni-evento-zoom" aria-hidden="true">Ampliar</span></button>' : "</div>") +
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
      '<p class="muni-eventos-lead">Próximas actividades municipales. Tocá una imagen para verla en grande, o consultá la <a href="eventos.html">agenda completa</a>.</p>' +
      "</div>" +
      '<p class="muni-eventos-more"><a class="muni-btn muni-btn--secondary muni-btn--sm" href="eventos.html">Ver agenda de eventos</a></p>' +
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
    formatEventoDateLong: formatEventoDateLong,
    filterEventosByPeriod: filterEventosByPeriod,
    buildGoogleCalendarUrl: buildGoogleCalendarUrl,
    downloadEventoIcs: downloadEventoIcs,
    getArea: getArea,
    getNoticia: getNoticia,
    getNoticiasByArea: getNoticiasByArea,
    getAllNoticiasSorted: getAllNoticiasSorted,
    splitNoticiasByRecency: splitNoticiasByRecency,
    mountNoticiasGridWithOlderCollapse: mountNoticiasGridWithOlderCollapse,
    getTopNoticiasByViews: getTopNoticiasByViews,
    formatEngagementCount: formatEngagementCount,
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
