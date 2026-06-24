(function () {
  "use strict";

  var TIPO_LABELS = {
    reunion: "Reunión",
    actividad: "Actividad",
    obra: "Obra / operativo",
    feria: "Feria / evento cultural",
    capacitacion: "Capacitación",
    otro: "Otro",
  };

  var TIPO_ICONS = {
    reunion: "📋",
    actividad: "🎯",
    obra: "🏗️",
    feria: "🎪",
    capacitacion: "📚",
    otro: "📌",
  };

  var MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  function esc(options, value) {
    if (options && options.escapeHtml) return options.escapeHtml(value);
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function todayIso(options) {
    if (options && options.todayIso) return options.todayIso();
    if (window.MuniApi && window.MuniApi.todayIsoArgentina) return window.MuniApi.todayIsoArgentina();
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  }

  function parseIsoParts(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
    var p = iso.slice(0, 10).split("-");
    return { y: +p[0], m: +p[1], d: +p[2] };
  }

  function isoToDate(iso) {
    var p = parseIsoParts(iso);
    if (!p) return null;
    return new Date(p.y, p.m - 1, p.d);
  }

  function daysBetween(fromIso, toIso) {
    var a = isoToDate(fromIso);
    var b = isoToDate(toIso);
    if (!a || !b) return null;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function daysUntilStart(fechaInicio, options) {
    return daysBetween(todayIso(options), fechaInicio);
  }

  function tipoLabel(key) {
    return TIPO_LABELS[key] || key || "Evento";
  }

  function tipoIcon(key) {
    return TIPO_ICONS[key] || TIPO_ICONS.otro;
  }

  function eventInicio(ev) {
    return ev.fechaInicio || ev.fechaEvento || ev.fecha || "";
  }

  function eventFin(ev) {
    var inicio = eventInicio(ev);
    var fin = ev.fechaFin || inicio;
    return fin >= inicio ? fin : inicio;
  }

  function formatFechaCorta(iso) {
    var p = parseIsoParts(iso);
    if (!p) return iso || "";
    return p.d + " " + MESES[p.m - 1].slice(0, 3);
  }

  function formatFechaLarga(iso) {
    var p = parseIsoParts(iso);
    if (!p) return iso || "";
    var dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    var dt = new Date(p.y, p.m - 1, p.d);
    return dias[dt.getDay()] + " " + p.d + " de " + MESES[p.m - 1] + " " + p.y;
  }

  function formatRangoFecha(inicio, fin, hora) {
    if (!inicio) return "";
    var finReal = fin && fin >= inicio ? fin : inicio;
    var texto =
      inicio === finReal
        ? formatFechaLarga(inicio)
        : formatFechaCorta(inicio) +
          " → " +
          formatFechaCorta(finReal) +
          " (" +
          formatFechaLarga(inicio).split(" ").slice(1).join(" ") +
          " al " +
          formatFechaLarga(finReal).split(" ").slice(1).join(" ") +
          ")";
    if (hora) texto += " · " + hora + " hs";
    return texto;
  }

  function formatRangoCorto(inicio, fin) {
    if (!inicio) return "";
    var finReal = fin && fin >= inicio ? fin : inicio;
    if (inicio === finReal) return formatFechaCorta(inicio);
    return formatFechaCorta(inicio) + " – " + formatFechaCorta(finReal);
  }

  function monthGroupKey(iso) {
    var p = parseIsoParts(iso);
    if (!p) return "Sin fecha";
    return MESES[p.m - 1] + " " + p.y;
  }

  function isoForDay(y, monthIndex, day) {
    return y + "-" + String(monthIndex + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
  }

  function eventCoversDay(ev, iso) {
    return eventInicio(ev) <= iso && eventFin(ev) >= iso;
  }

  function isEnCurso(ev, today) {
    return eventInicio(ev) <= today && eventFin(ev) >= today;
  }

  function eventStatus(ev, today, options) {
    if (isEnCurso(ev, today)) return { key: "curso", label: "En curso", className: "muni-agenda-badge--curso" };
    var d = daysUntilStart(eventInicio(ev), options);
    if (d === null) return null;
    if (d === 0) return { key: "hoy", label: "Hoy", className: "muni-agenda-badge--hoy" };
    if (d === 1) return { key: "manana", label: "Mañana", className: "muni-agenda-badge--proximo" };
    if (d === 7) return { key: "semana", label: "Falta 1 semana", className: "muni-agenda-badge--semana" };
    if (d > 0 && d <= 7) return { key: "proximo", label: "En " + d + " días", className: "muni-agenda-badge--proximo" };
    return null;
  }

  function cardHighlightClasses(ev, today, prefix, options) {
    var status = eventStatus(ev, today, options);
    var cls = prefix + " " + prefix + "--" + esc(options, ev.tipoEvento || "otro");
    if (status && (status.key === "proximo" || status.key === "semana" || status.key === "hoy" || status.key === "manana")) {
      cls += " " + prefix + "--highlight";
    }
    if (isEnCurso(ev, today)) cls += " " + prefix + "--curso";
    return cls;
  }

  function areaNameFor(ev, options) {
    if (ev.areaNombre) return ev.areaNombre;
    if (options && options.getArea) {
      var area = options.getArea(ev.areaSlug);
      if (area) return area.nombre;
    }
    return ev.areaSlug || "";
  }

  function publicActionsHtml(ev, options) {
    var M = options && options.portal;
    if (!M) return "";
    var gcal = M.buildGoogleCalendarUrl ? M.buildGoogleCalendarUrl(ev) : "";
    var html =
      '<div class="muni-agenda-card-actions muni-agenda-card-actions--public">' +
      (ev.imagenUrl
        ? '<a class="muni-btn muni-btn--ghost muni-btn--sm" href="' +
          esc(options, ev.imagenUrl) +
          '" target="_blank" rel="noopener noreferrer">Ver flyer</a>'
        : "") +
      (gcal
        ? '<a class="muni-btn muni-btn--ghost muni-btn--sm" href="' +
          esc(options, gcal) +
          '" target="_blank" rel="noopener noreferrer">Google Calendar</a>'
        : "") +
      '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-agenda-ics="' +
      esc(options, ev.id) +
      '">Descargar .ics</button>' +
      "</div>";
    return html;
  }

  function imagenThumbHtml(ev, options) {
    if (!ev.imagenUrl) return "";
    var title = ev.titulo || "Evento";
    return (
      '<a class="muni-agenda-card-flyer" href="' +
      esc(options, ev.imagenUrl) +
      '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' +
      esc(options, ev.imagenUrl) +
      '" alt="Flyer: ' +
      esc(options, title) +
      '" loading="lazy" decoding="async" width="72" height="128">' +
      "</a>"
    );
  }

  function renderEventCard(ev, today, options) {
    var status = eventStatus(ev, today, options);
    var badge = status
      ? '<span class="muni-agenda-badge ' + status.className + '">' + esc(options, status.label) + "</span>"
      : "";

    return (
      '<article class="' +
      cardHighlightClasses(ev, today, "muni-agenda-card", options) +
      '">' +
      '<div class="muni-agenda-card-date">' +
      '<span class="muni-agenda-card-date-range">' +
      esc(options, formatRangoCorto(eventInicio(ev), eventFin(ev))) +
      "</span>" +
      (ev.hora ? '<span class="muni-agenda-card-time">' + esc(options, ev.hora) + "</span>" : "") +
      "</div>" +
      '<div class="muni-agenda-card-body">' +
      '<div class="muni-agenda-card-top">' +
      '<span class="muni-agenda-card-icon" aria-hidden="true">' +
      tipoIcon(ev.tipoEvento) +
      "</span>" +
      '<span class="muni-agenda-card-area">' +
      esc(options, areaNameFor(ev, options)) +
      "</span>" +
      badge +
      "</div>" +
      "<h3 class=\"muni-agenda-card-title\">" +
      esc(options, ev.titulo) +
      "</h3>" +
      '<p class="muni-agenda-card-meta">' +
      esc(options, tipoLabel(ev.tipoEvento)) +
      " · " +
      esc(options, ev.lugar || "") +
      "</p>" +
      (ev.descripcion ? '<p class="muni-agenda-card-desc">' + esc(options, ev.descripcion) + "</p>" : "") +
      imagenThumbHtml(ev, options) +
      publicActionsHtml(ev, options) +
      "</div></article>"
    );
  }

  function renderGridTile(ev, today, options) {
    var status = eventStatus(ev, today, options);
    var badge = status
      ? '<span class="muni-agenda-badge ' + status.className + '">' + esc(options, status.label) + "</span>"
      : "";

    return (
      '<article class="' +
      cardHighlightClasses(ev, today, "muni-agenda-tile", options) +
      '">' +
      (ev.imagenUrl
        ? '<div class="muni-agenda-tile-flyer"><img src="' +
          esc(options, ev.imagenUrl) +
          '" alt="" loading="lazy" decoding="async"></div>'
        : "") +
      '<div class="muni-agenda-tile-hero">' +
      '<span class="muni-agenda-tile-icon" aria-hidden="true">' +
      tipoIcon(ev.tipoEvento) +
      "</span>" +
      '<span class="muni-agenda-tile-type">' +
      esc(options, tipoLabel(ev.tipoEvento)) +
      "</span>" +
      badge +
      "</div>" +
      '<div class="muni-agenda-tile-body">' +
      "<h3 class=\"muni-agenda-tile-title\">" +
      esc(options, ev.titulo) +
      "</h3>" +
      '<p class="muni-agenda-tile-area">' +
      esc(options, areaNameFor(ev, options)) +
      "</p>" +
      '<ul class="muni-agenda-tile-meta">' +
      "<li><span aria-hidden=\"true\">📅</span> " +
      esc(options, formatRangoFecha(eventInicio(ev), eventFin(ev), ev.hora)) +
      "</li>" +
      "<li><span aria-hidden=\"true\">📍</span> " +
      esc(options, ev.lugar || "") +
      "</li></ul>" +
      (ev.descripcion ? '<p class="muni-agenda-tile-desc">' + esc(options, ev.descripcion) + "</p>" : "") +
      publicActionsHtml(ev, options) +
      "</div></article>"
    );
  }

  function renderTimelineView(events, today, options) {
    var groups = {};
    events.forEach(function (ev) {
      var key = monthGroupKey(eventInicio(ev));
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });

    var html = "";
    Object.keys(groups)
      .sort(function (a, b) {
        return (eventInicio(groups[a][0]) || "").localeCompare(eventInicio(groups[b][0]) || "");
      })
      .forEach(function (monthKey) {
        html +=
          '<section class="muni-agenda-month">' +
          "<h3 class=\"muni-agenda-month-title\">" +
          esc(options, monthKey) +
          "</h3>" +
          '<div class="muni-agenda-month-cards">' +
          groups[monthKey]
            .map(function (ev) {
              return renderEventCard(ev, today, options);
            })
            .join("") +
          "</div></section>";
      });
    return html;
  }

  function renderGridView(events, today, options) {
    return events
      .map(function (ev) {
        return renderGridTile(ev, today, options);
      })
      .join("");
  }

  function renderCalendarView(events, today, options, calendarCursor) {
    if (!calendarCursor) {
      var p = parseIsoParts(today);
      calendarCursor = p ? { y: p.y, m: p.m - 1 } : { y: new Date().getFullYear(), m: new Date().getMonth() };
    }
    var y = calendarCursor.y;
    var m = calendarCursor.m;
    var first = new Date(y, m, 1);
    var startOffset = first.getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var cells = [];
    var i;

    for (i = 0; i < startOffset; i += 1) cells.push({ empty: true });
    for (i = 1; i <= daysInMonth; i += 1) cells.push({ y: y, m: m, d: i });
    while (cells.length % 7 !== 0) cells.push({ empty: true });

    var weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    var gridHtml = cells
      .map(function (cell) {
        if (cell.empty) {
          return '<div class="muni-agenda-cal-day muni-agenda-cal-day--pad" aria-hidden="true"></div>';
        }
        var iso = isoForDay(cell.y, cell.m, cell.d);
        var isToday = iso === today;
        var dayEvents = events.filter(function (ev) {
          return eventCoversDay(ev, iso);
        });
        var chips = dayEvents
          .slice(0, 3)
          .map(function (ev) {
            return (
              '<span class="muni-agenda-cal-chip muni-agenda-cal-chip--' +
              esc(options, ev.tipoEvento || "otro") +
              '" title="' +
              esc(options, ev.titulo) +
              '">' +
              esc(options, ev.titulo) +
              "</span>"
            );
          })
          .join("");
        var more =
          dayEvents.length > 3
            ? '<span class="muni-agenda-cal-more">+' + (dayEvents.length - 3) + " más</span>"
            : "";

        return (
          '<div class="muni-agenda-cal-day' +
          (isToday ? " muni-agenda-cal-day--today" : "") +
          '">' +
          '<span class="muni-agenda-cal-day-num">' +
          cell.d +
          "</span>" +
          '<div class="muni-agenda-cal-day-events">' +
          chips +
          more +
          "</div></div>"
        );
      })
      .join("");

    return (
      '<div class="muni-agenda-cal">' +
      '<div class="muni-agenda-cal-head">' +
      '<button type="button" class="muni-agenda-cal-nav" data-cal-prev aria-label="Mes anterior">‹</button>' +
      "<h3>" +
      esc(options, MESES[m] + " " + y) +
      "</h3>" +
      '<button type="button" class="muni-agenda-cal-nav" data-cal-next aria-label="Mes siguiente">›</button>' +
      '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-cal-today>Hoy</button>' +
      "</div>" +
      '<div class="muni-agenda-cal-weekdays">' +
      weekdays
        .map(function (wd) {
          return "<span>" + wd + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="muni-agenda-cal-grid">' +
      gridHtml +
      "</div></div>"
    );
  }

  function containerClassForMode(viewMode) {
    if (viewMode === "grid") return "muni-agenda-grid";
    if (viewMode === "calendar") return "muni-agenda-calendar-wrap";
    return "muni-agenda-timeline";
  }

  function renderHtml(events, viewMode, calendarCursor, options) {
    var today = todayIso(options);
    if (viewMode === "grid") return renderGridView(events, today, options);
    if (viewMode === "calendar") return renderCalendarView(events, today, options, calendarCursor);
    return renderTimelineView(events, today, options);
  }

  function addMonths(cursor, delta) {
    var d = new Date(cursor.y, cursor.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  }

  function currentMonthCursor(options) {
    var p = parseIsoParts(todayIso(options));
    if (!p) {
      var now = new Date();
      return { y: now.getFullYear(), m: now.getMonth() };
    }
    return { y: p.y, m: p.m - 1 };
  }

  function mount(root, config) {
    if (!root) return null;

    var events = (config && config.events) || [];
    var viewMode = (config && config.viewMode) || "timeline";
    var calendarCursor = (config && config.calendarCursor) || currentMonthCursor(config);
    var options = {
      escapeHtml: config && config.escapeHtml,
      getArea: config && config.getArea,
      portal: config && config.portal,
      todayIso: config && config.todayIso,
    };

    function paint() {
      root.className = containerClassForMode(viewMode);
      if (!events.length) {
        root.innerHTML = "";
        return;
      }
      root.innerHTML = renderHtml(events, viewMode, calendarCursor, options);
    }

    paint();

    function onClick(e) {
      if (viewMode !== "calendar") return;
      if (e.target.closest("[data-cal-prev]")) {
        calendarCursor = addMonths(calendarCursor, -1);
        paint();
        return;
      }
      if (e.target.closest("[data-cal-next]")) {
        calendarCursor = addMonths(calendarCursor, 1);
        paint();
        return;
      }
      if (e.target.closest("[data-cal-today]")) {
        calendarCursor = currentMonthCursor(options);
        paint();
      }
    }

    function onIcs(e) {
      var btn = e.target.closest("[data-agenda-ics]");
      if (!btn || !options.portal) return;
      var id = btn.getAttribute("data-agenda-ics");
      var ev = events.find(function (item) {
        return item.id === id;
      });
      if (ev && options.portal.downloadEventoIcs) options.portal.downloadEventoIcs(ev);
    }

    root.addEventListener("click", onClick);
    root.addEventListener("click", onIcs);

    return {
      setEvents: function (next) {
        events = next || [];
        paint();
      },
      setViewMode: function (mode) {
        if (mode !== "timeline" && mode !== "grid" && mode !== "calendar") return;
        viewMode = mode;
        paint();
      },
      destroy: function () {
        root.removeEventListener("click", onClick);
        root.removeEventListener("click", onIcs);
      },
    };
  }

  window.MuniAgendaRender = {
    mount: mount,
    renderHtml: renderHtml,
    containerClassForMode: containerClassForMode,
    currentMonthCursor: currentMonthCursor,
    tipoIcon: tipoIcon,
    tipoLabel: tipoLabel,
  };
})();
