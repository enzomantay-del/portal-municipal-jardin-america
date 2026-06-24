(function () {
  "use strict";

  var VIEW_STORAGE_KEY = "muni-agenda-view-public";

  function runWhenReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function filterByPeriod(M, eventos, period) {
    if (M.filterEventosByPeriod) {
      return M.filterEventosByPeriod(eventos, period);
    }
    return (eventos || []).slice();
  }

  function getStoredViewMode() {
    try {
      var stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "grid" || stored === "calendar" || stored === "timeline") return stored;
    } catch (_e) {
      /* ignore */
    }
    return "timeline";
  }

  function storeViewMode(mode) {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch (_e) {
      /* ignore */
    }
  }

  async function loadAgendaEventos(M) {
    var payload = null;

    try {
      payload = await M.bootstrapPublicData();
    } catch (err) {
      console.warn("Agenda: error al cargar datos del portal.", err);
      payload = {
        source: "error",
        areas: (window.MUNI_DATA && window.MUNI_DATA.areas) || [],
        noticias: [],
        eventosFlyers: [],
      };
    }

    var eventos = (payload && payload.eventosFlyers) || [];

    if (!eventos.length && window.MuniApi && window.MuniApi.loadEventosFlyersPublic) {
      try {
        if (window.MuniFirebase && window.MuniFirebase.init) {
          window.MuniFirebase.init();
        }
        var db = window.MuniFirebase && window.MuniFirebase.db ? window.MuniFirebase.db() : null;
        eventos = await window.MuniApi.loadEventosFlyersPublic(db);
        if (eventos.length && payload) {
          payload.eventosFlyers = eventos;
        }
      } catch (directErr) {
        console.warn("Agenda: carga directa de eventos falló.", directErr);
      }
    }

    M.setData(payload || { areas: [], noticias: [], eventosFlyers: eventos });
    return (M.DATA.eventosFlyers || eventos || []).slice();
  }

  runWhenReady(function () {
    var M = window.MuniPortal;
    var Render = window.MuniAgendaRender;
    if (!M || !Render) return;

    var root = document.getElementById("muni-eventos-agenda");
    var emptyEl = document.getElementById("muni-eventos-agenda-empty");
    var filterEl = document.getElementById("eventos-agenda-filter");
    var viewBtns = document.querySelectorAll("[data-agenda-view-public]");
    var eventos = [];
    var viewMode = getStoredViewMode();
    var calendarCursor = Render.currentMonthCursor({ todayIso: M.todayIsoArgentina || null });
    var mount = null;

    function updateViewButtons() {
      viewBtns.forEach(function (btn) {
        var active = btn.getAttribute("data-agenda-view-public") === viewMode;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });
    }

    function renderAgenda(period) {
      if (!root) return;
      var filtered = filterByPeriod(M, eventos, period || "todos");

      if (!eventos.length) {
        if (mount) {
          mount.destroy();
          mount = null;
        }
        root.innerHTML = "";
        root.className = "muni-agenda-timeline";
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.textContent =
            "Todavía no hay eventos publicados. Volvé pronto o consultá las novedades del portal.";
        }
        return;
      }

      if (!filtered.length) {
        if (mount) {
          mount.destroy();
          mount = null;
        }
        root.innerHTML = "";
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.textContent =
            "No hay eventos en este período. Probá con otro filtro o volvé más adelante.";
        }
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      if (mount) mount.destroy();
      mount = Render.mount(root, {
        events: filtered,
        viewMode: viewMode,
        calendarCursor: calendarCursor,
        escapeHtml: M.escapeHtml.bind(M),
        getArea: M.getArea.bind(M),
        portal: M,
        todayIso: function () {
          return M.todayIsoArgentina ? M.todayIsoArgentina() : window.MuniApi.todayIsoArgentina();
        },
      });
    }

    M.initNav("eventos");
    updateViewButtons();
    if (root) root.innerHTML = '<p class="muni-empty" role="status">Cargando eventos…</p>';

    viewBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-agenda-view-public");
        if (!mode) return;
        viewMode = mode;
        storeViewMode(mode);
        updateViewButtons();
        renderAgenda(filterEl ? filterEl.value : "todos");
      });
    });

    loadAgendaEventos(M)
      .then(function (loaded) {
        eventos = loaded;
        if (filterEl) {
          filterEl.addEventListener("change", function () {
            renderAgenda(filterEl.value);
          });
        }
        renderAgenda(filterEl ? filterEl.value : "todos");
      })
      .catch(function (err) {
        console.warn("Agenda: error al inicializar.", err);
        if (root) {
          root.innerHTML =
            '<p class="muni-empty">No se pudieron cargar los eventos. Recargá la página (Ctrl+F5) o volvé más tarde.</p>';
        }
      });
  });
})();
