/**
 * Carga diferida de scripts no críticos del portal (home / área).
 * Mejora Time to Interactive sin quitar funciones visibles.
 */
(function () {
  "use strict";

  var loaded = {};

  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () {
        resolve(true);
      };
      s.onerror = function () {
        resolve(false);
      };
      document.body.appendChild(s);
    });
    return loaded[src];
  }

  function loadParallel(list) {
    return Promise.all(
      list.map(function (src) {
        return loadScript(src);
      })
    );
  }

  var KNOWLEDGE = "js/muni-consultas-conocimiento.js?v=20260721mesa";

  var SECONDARY = [
    "js/muni-radio-config.js?v=20260713perf",
    "js/muni-radio.js?v=20260713perf",
    "js/campana-config.js?v=20260524",
    "js/muni-avisos.js?v=20260524",
    "js/muni-anuncio.js?v=20260521",
    "js/muni-agenda-render.js?v=20260625",
    "js/muni-eventos.js?v=20260524",
  ];

  var AREA_SECONDARY = [
    "js/muni-radio-config.js?v=20260713perf",
    "js/muni-radio.js?v=20260713perf",
  ];

  function schedule(fn, timeout) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(fn, { timeout: timeout || 2500 });
    } else {
      setTimeout(fn, Math.min(timeout || 1200, 1200));
    }
  }

  function afterKnowledge() {
    if (window.MuniConsultasKnowledge && window.MuniConsultasKnowledge.refreshLiveObras) {
      window.MuniConsultasKnowledge.refreshLiveObras(false).catch(function () {});
    }
  }

  function boot() {
    var isArea = /area\.html/i.test(window.location.pathname || "");
    var list = isArea ? AREA_SECONDARY : SECONDARY;

    // Conocimiento de AmiBot: justo después del primer pintado (botón ya está).
    setTimeout(function () {
      loadScript("js/muni-contactos-data.js?v=20260721mesa")
        .then(function () {
          return loadScript(KNOWLEDGE);
        })
        .then(afterKnowledge);
    }, 120);

    schedule(function () {
      loadParallel(list)
        .then(function () {
          var M = window.MuniPortal;
          if (window.MuniEventos && M && M.DATA) {
            window.MuniEventos.mountEventos(M.DATA.eventosFlyers || []);
          }
          if (window.MuniAnuncio && window.MuniAnuncio.mountAnuncioEntrada) {
            window.MuniAnuncio.mountAnuncioEntrada();
          }
        })
        .catch(function () {});
    }, 2800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.MuniLazy = { loadScript: loadScript, loadMany: loadParallel, loadParallel: loadParallel };
})();
