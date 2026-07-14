/**
 * Carga diferida de scripts no críticos del portal (home / área).
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

  function loadMany(list) {
    return list.reduce(function (chain, src) {
      return chain.then(function () {
        return loadScript(src);
      });
    }, Promise.resolve());
  }

  var SECONDARY = [
    "js/muni-whatsapp.js?v=20260713perf",
    "js/muni-radio-config.js?v=20260713perf",
    "js/muni-radio.js?v=20260713perf",
    "js/campana-config.js?v=20260524",
    "js/muni-avisos.js?v=20260524",
    "js/muni-anuncio.js?v=20260521",
    "js/muni-agenda-render.js?v=20260625",
    "js/muni-eventos.js?v=20260524",
  ];

  var AREA_SECONDARY = [
    "js/muni-whatsapp.js?v=20260713perf",
    "js/muni-radio-config.js?v=20260713perf",
    "js/muni-radio.js?v=20260713perf",
  ];

  function schedule(fn) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(fn, { timeout: 2500 });
    } else {
      setTimeout(fn, 1200);
    }
  }

  function boot() {
    var isArea = /area\.html/i.test(window.location.pathname || "");
    var list = isArea ? AREA_SECONDARY : SECONDARY;

    schedule(function () {
      loadMany(list)
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
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.MuniLazy = { loadScript: loadScript, loadMany: loadMany };
})();
