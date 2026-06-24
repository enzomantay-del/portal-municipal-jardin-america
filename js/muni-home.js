(function () {
  "use strict";

  function getHomeNavPage() {
    var hash = (window.location.hash || "").replace("#", "");
    if (hash === "ultimas-novedades") return "noticias";
    if (hash === "proximos-eventos") return "eventos";
    if (hash === "contacto") return "contacto";
    if (hash === "recibir-avisos") return "avisos";
    return "inicio";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var M = window.MuniPortal;
    if (!M) return;

    M.initNav(getHomeNavPage());
    M.showLoading("muni-news-grid");

    var payload = await M.bootstrapPublicData();
    M.setData(payload);
    M.initNav(getHomeNavPage());

    window.addEventListener("hashchange", function () {
      M.initNav(getHomeNavPage());
    });

    var banner = document.getElementById("muni-data-banner");
    if (banner && payload.source === "demo") {
      banner.hidden = false;
      banner.textContent =
        "Modo demostración: configurá js/firebase-config.js para ver contenido real desde Firebase.";
    } else if (banner && payload.source === "error") {
      banner.hidden = false;
      banner.textContent =
        "Error al cargar el portal desde Firebase: " + (payload.error || "revisá la consola (F12).") +
        " Se muestran datos de respaldo.";
    } else if (banner && payload.source === "partial") {
      banner.hidden = false;
      banner.className = "muni-demo-banner";
      banner.textContent =
        "Conectado a Firebase: se recuperaron las novedades publicadas. Flyers de eventos no disponibles hasta publicar reglas nuevas.";
    } else if (banner && payload.source === "firebase" && !(payload.noticias || []).length) {
      banner.hidden = false;
      banner.className = "muni-demo-banner";
      banner.textContent =
        "Conectado a Firebase: todavía no hay novedades publicadas, o recargá la página (Ctrl+F5).";
    }

    var destacada = M.getDestacada();
    var heroEl = document.getElementById("muni-hero");
    if (heroEl) {
      heroEl.innerHTML = destacada
        ? M.renderHero(destacada)
        : '<p class="muni-empty">Todavía no hay novedades publicadas.</p>';
    }

    var all = M.getAllNoticiasSorted();
    var rest = destacada ? all.filter(function (n) { return n.id !== destacada.id; }) : all;

    var gridEl = document.getElementById("muni-news-grid");
    if (gridEl) {
      M.mountNoticiasGridWithOlderCollapse(gridEl, rest, {
        renderCard: M.renderCard,
        emptyText: "Todavía no hay novedades publicadas.",
        recentDays: 15,
      });
    }

    var sidebarEl = document.getElementById("muni-sidebar-mas-leidas");
    if (sidebarEl) {
      sidebarEl.innerHTML = M.renderSidebarList(M.getTopNoticiasByViews(6), 6, {
        showViews: true,
        emptyText: "Todavía no hay lecturas registradas.",
      });
    }

    var areasSidebar = document.getElementById("muni-sidebar-areas");
    if (areasSidebar) {
      areasSidebar.innerHTML = M.renderAreaLinks();
    }

    var stripEl = document.getElementById("muni-areas-strip-grid");
    if (stripEl) {
      stripEl.innerHTML = M.renderAreasStrip();
    }

    if (window.MuniAccesos) {
      window.MuniAccesos.mountAccesos();
    }

    if (window.MuniEventos) {
      var eventos = M.DATA.eventosFlyers || [];
      var mountEventos = function () {
        window.MuniEventos.mountEventos(eventos);
      };
      if ("requestIdleCallback" in window) {
        requestIdleCallback(mountEventos, { timeout: 1500 });
      } else {
        setTimeout(mountEventos, 0);
      }
    }

    if (window.MuniAnuncio && window.MuniAnuncio.mountAnuncioEntrada) {
      window.MuniAnuncio.mountAnuncioEntrada();
    }
  });
})();
