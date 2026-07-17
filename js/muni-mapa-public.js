(function () {
  "use strict";

  var map = null;
  var markersLayer = null;
  var circlesLayer = null;
  var userLayer = null;
  var allPuntos = [];
  var activeTipos = new Set(["obra", "contenedor", "actividad"]);
  var activeBarrio = "";
  var soloObrasEnCurso = false;
  var userMarker = null;

  function applyObrasCursoFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var hash = String(window.location.hash || "").replace(/^#/, "");
      if (params.get("obras") === "curso" || hash === "obras-curso" || hash === "obras") {
        soloObrasEnCurso = true;
        activeTipos = new Set(["obra"]);
      }
    } catch (_e) {}
  }

  function $(id) {
    return document.getElementById(id);
  }

  function collectBarrios(puntos) {
    var set = new Set();
    (puntos || []).forEach(function (p) {
      var b = String(p.barrio || "").trim();
      if (b) set.add(b);
    });
    return Array.from(set).sort(function (a, b) {
      return a.localeCompare(b, "es");
    });
  }

  function renderBarrioFilter(barrios) {
    var select = $("mapa-public-barrio");
    if (!select) return;
    var current = activeBarrio;
    select.innerHTML =
      '<option value="">Todos los barrios</option>' +
      barrios
        .map(function (b) {
          return (
            '<option value="' +
            window.MuniMapa.escapeHtml(b) +
            '">' +
            window.MuniMapa.escapeHtml(b) +
            "</option>"
          );
        })
        .join("");
    select.value = current;
    if (!select._muniBound) {
      select._muniBound = true;
      select.addEventListener("change", function () {
        activeBarrio = select.value || "";
        refreshMarkers();
      });
    }
  }

  function renderFilters() {
    var wrap = $("mapa-public-filters");
    if (!wrap || !window.MuniMapa) return;
    wrap.innerHTML = Object.keys(window.MuniMapa.TIPO_MAPA)
      .map(function (key) {
        var info = window.MuniMapa.tipoInfo(key);
        return (
          '<button type="button" class="muni-mapa-filter is-active" data-tipo="' +
          key +
          '" aria-pressed="true">' +
          info.icon +
          " " +
          window.MuniMapa.escapeHtml(info.label) +
          "</button>"
        );
      })
      .join("");

    wrap.querySelectorAll("[data-tipo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tipo = btn.getAttribute("data-tipo");
        if (activeTipos.has(tipo)) {
          activeTipos.delete(tipo);
          btn.classList.remove("is-active");
          btn.setAttribute("aria-pressed", "false");
        } else {
          activeTipos.add(tipo);
          btn.classList.add("is-active");
          btn.setAttribute("aria-pressed", "true");
        }
        refreshMarkers();
      });
    });

    var obrasBtn = $("mapa-public-obras-curso");
    if (obrasBtn && !obrasBtn._muniBound) {
      obrasBtn._muniBound = true;
      obrasBtn.addEventListener("click", function () {
        soloObrasEnCurso = !soloObrasEnCurso;
        obrasBtn.classList.toggle("is-active", soloObrasEnCurso);
        obrasBtn.setAttribute("aria-pressed", soloObrasEnCurso ? "true" : "false");
        if (soloObrasEnCurso) {
          activeTipos = new Set(["obra"]);
          wrap.querySelectorAll("[data-tipo]").forEach(function (btn) {
            var on = btn.getAttribute("data-tipo") === "obra";
            btn.classList.toggle("is-active", on);
            btn.setAttribute("aria-pressed", on ? "true" : "false");
          });
        }
        refreshMarkers();
      });
    }

    if (soloObrasEnCurso && obrasBtn) {
      obrasBtn.classList.add("is-active");
      obrasBtn.setAttribute("aria-pressed", "true");
      wrap.querySelectorAll("[data-tipo]").forEach(function (btn) {
        var on = btn.getAttribute("data-tipo") === "obra";
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }

  function matchesFilters(p) {
    if (!window.MuniMapa.isPuntoVisibleEnMapaPublico(p)) return false;
    if (!activeTipos.has(p.tipoMapa)) return false;
    if (activeBarrio && String(p.barrio || "").trim() !== activeBarrio) return false;
    if (soloObrasEnCurso) {
      if (p.tipoMapa !== "obra") return false;
      if (p.estadoObra === "finalizado") return false;
    }
    return true;
  }

  function refreshMarkers() {
    if (!map || !markersLayer || !window.MuniMapa || !window.L) return;
    markersLayer.clearLayers();
    circlesLayer.clearLayers();

    var visible = allPuntos.filter(matchesFilters);

    var countEl = $("mapa-public-count");
    if (countEl) {
      countEl.textContent =
        visible.length === 0
          ? "Sin puntos en el mapa"
          : visible.length === 1
            ? "1 punto en el mapa"
            : visible.length + " puntos en el mapa";
    }

    visible.forEach(function (p) {
      window.MuniMapa.addPuntoToMap(map, markersLayer, window.L, p, circlesLayer);
    });

    if (visible.length === 1 && !userMarker) {
      map.setView([visible[0].lat, visible[0].lng], 15);
    } else if (visible.length > 1 && window.L.latLngBounds && !userMarker) {
      var bounds = window.L.latLngBounds(
        visible.map(function (p) {
          return [p.lat, p.lng];
        })
      );
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
    }
  }

  function showUserLocation(lat, lng) {
    if (!map || !window.L) return;
    if (!userLayer) userLayer = window.L.layerGroup().addTo(map);
    userLayer.clearLayers();
    userMarker = window.L.circleMarker([lat, lng], {
      radius: 9,
      color: "#1565c0",
      fillColor: "#1ba3d4",
      fillOpacity: 0.85,
      weight: 2,
    }).addTo(userLayer);
    userMarker.bindPopup("Tu ubicación").openPopup();
    map.setView([lat, lng], 15);
  }

  function locateUser() {
    var banner = $("mapa-public-banner");
    if (!navigator.geolocation) {
      if (banner) {
        banner.hidden = false;
        banner.textContent = "Tu navegador no permite usar la ubicación.";
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        if (banner) banner.hidden = true;
        showUserLocation(pos.coords.latitude, pos.coords.longitude);
      },
      function () {
        if (banner) {
          banner.hidden = false;
          banner.textContent = "No pudimos obtener tu ubicación. Revisá los permisos del navegador.";
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  async function loadPuntos() {
    var banner = $("mapa-public-banner");
    var puntos = [];
    var hasFirebase =
      window.FIREBASE_CONFIG &&
      window.FIREBASE_CONFIG.projectId &&
      window.FIREBASE_CONFIG.apiKey &&
      !String(window.FIREBASE_CONFIG.projectId).includes("tu-proyecto");

    try {
      if (window.MuniApi && hasFirebase) {
        if (window.MuniFirebase && window.MuniFirebase.init) {
          window.MuniFirebase.init();
        }
        var db = window.MuniFirebase ? window.MuniFirebase.db() : null;
        puntos = await window.MuniApi.loadMapaPuntosPublic(db);
        if (banner) {
          if (!puntos.length) {
            banner.hidden = false;
            banner.textContent = "Todavía no hay puntos publicados en el mapa.";
          } else {
            banner.hidden = true;
          }
        }
      } else if (banner) {
        banner.hidden = false;
        banner.textContent = "Configurá Firebase (js/firebase-config.js) para cargar los puntos del mapa.";
      }
    } catch (err) {
      console.warn("loadMapaPuntosPublic", err);
      if (banner) {
        banner.hidden = false;
        if (err && err.code === "permission-denied") {
          banner.textContent =
            "No se pudieron leer los puntos. Publicá las reglas de Firestore (colección mapa_puntos) en Firebase Console.";
        } else {
          banner.textContent = "No se pudieron cargar los puntos del mapa. Probá Actualizar o Ctrl+F5.";
        }
      }
    }

    allPuntos = puntos;
    renderBarrioFilter(collectBarrios(puntos));
    refreshMarkers();
  }

  function ensureMapReady(callback) {
    var container = $("mapa-public-canvas");
    if (!container || !window.MuniMapa || !window.L) return;

    if (!map) {
      map = window.MuniMapa.initMap(container, { zoom: window.MuniMapa.DEFAULT_ZOOM });
      if (!map) return;
      markersLayer = window.L.layerGroup().addTo(map);
      circlesLayer = window.L.layerGroup().addTo(map);
      renderFilters();

      var refreshBtn = $("mapa-public-refresh");
      if (refreshBtn && !refreshBtn._muniBound) {
        refreshBtn._muniBound = true;
        refreshBtn.addEventListener("click", loadPuntos);
      }

      var locateBtn = $("mapa-public-locate");
      if (locateBtn && !locateBtn._muniBound) {
        locateBtn._muniBound = true;
        locateBtn.addEventListener("click", function () {
          map.setView(
            [window.MuniMapa.DEFAULT_CENTER.lat, window.MuniMapa.DEFAULT_CENTER.lng],
            window.MuniMapa.DEFAULT_ZOOM
          );
          if (userLayer) userLayer.clearLayers();
          userMarker = null;
        });
      }

      var nearBtn = $("mapa-public-nearme");
      if (nearBtn && !nearBtn._muniBound) {
        nearBtn._muniBound = true;
        nearBtn.addEventListener("click", locateUser);
      }
    } else {
      window.MuniMapa.fixMapSize(map, container);
    }

    if (typeof callback === "function") callback();
  }

  function init() {
    var container = $("mapa-public-canvas");
    if (!container) return;
    applyObrasCursoFromUrl();

    if (!window.L) {
      if (window.MuniMapa) {
        window.MuniMapa.showMapError(
          container,
          "No se cargó Leaflet. Subí el portal completo incluyendo la carpeta vendor/leaflet."
        );
      }
      return;
    }
    if (!window.MuniMapa) {
      container.innerHTML =
        '<p class="muni-mapa-picker-error">Error al cargar muni-mapa-core.js. Recargá con Ctrl+F5.</p>';
      return;
    }

    function startMap() {
      ensureMapReady(loadPuntos);
    }

    window.MuniMapa.watchWhenVisible(container, startMap);
    startMap();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
