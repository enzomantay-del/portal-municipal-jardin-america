(function () {
  "use strict";

  var DEFAULT_CENTER = { lat: -27.038257, lng: -55.234451 };
  var DEFAULT_ZOOM = 14;

  var TIPO_MAPA = {
    obra: { label: "Obra", icon: "🏗️", color: "#e65100" },
    contenedor: { label: "Contenedor", icon: "♻️", color: "#2e7d32" },
    actividad: { label: "Actividad", icon: "📣", color: "#0d7aa8" },
  };

  function tipoInfo(key) {
    return TIPO_MAPA[key] || TIPO_MAPA.actividad;
  }

  function tipoLabel(key) {
    return tipoInfo(key).label;
  }

  function mapMapaPunto(id, data) {
    data = data || {};
    var lat = coerceCoord(data.lat);
    var lng = coerceCoord(data.lng);
    if (lat == null && data.location && typeof data.location.latitude === "number") {
      lat = data.location.latitude;
      lng = data.location.longitude;
    }
    return {
      id: id,
      titulo: data.titulo || "",
      descripcion: data.descripcion || "",
      tipoMapa: data.tipoMapa || "actividad",
      lat: lat,
      lng: lng,
      radioMetros: data.radioMetros != null ? Number(data.radioMetros) : null,
      barrio: data.barrio || "",
      areaSlug: data.areaSlug || "",
      areaNombre: data.areaNombre || "",
      estadoObra: data.estadoObra || "",
      fechaInicio: data.fechaInicio || "",
      fechaFin: data.fechaFin || "",
      enlaceUrl: data.enlaceUrl || "",
      estadoPublicacion: String(data.estadoPublicacion || "pendiente").trim(),
      createdBy: data.createdBy || "",
    };
  }

  function coerceCoord(value) {
    if (value == null || value === "") return null;
    if (typeof value === "number" && !isNaN(value)) return value;
    var n = parseFloat(String(value).replace(",", ".").trim());
    return isNaN(n) ? null : n;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isValidCoord(lat, lng) {
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    return true;
  }

  function todayArgentinaIso() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  }

  function formatFechaMapa(iso) {
    if (!iso) return "";
    var parts = String(iso).slice(0, 10).split("-");
    if (parts.length !== 3) return String(iso);
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function isActividadVigenteEnMapa(punto) {
    if (!punto || punto.tipoMapa !== "actividad") return true;
    var inicio = String(punto.fechaInicio || "").slice(0, 10);
    if (!inicio) return true;
    var fin = String(punto.fechaFin || inicio).slice(0, 10);
    var today = todayArgentinaIso();
    return today >= inicio && today <= fin;
  }

  function isPuntoVisibleEnMapaPublico(punto) {
    if (!punto || punto.tipoMapa === "barrio") return false;
    return isActividadVigenteEnMapa(punto);
  }

  function createDivIcon(L, tipo) {
    var info = tipoInfo(tipo);
    return L.divIcon({
      className: "muni-map-marker-wrap",
      html:
        '<span class="muni-map-marker muni-map-marker--' +
        escapeHtml(tipo) +
        '" style="--marker-color:' +
        info.color +
        '">' +
        '<span class="muni-map-marker-icon" aria-hidden="true">' +
        info.icon +
        "</span></span>",
      iconSize: [40, 48],
      iconAnchor: [20, 48],
      popupAnchor: [0, -46],
    });
  }

  function bindPopupContent(punto) {
    var info = tipoInfo(punto.tipoMapa);
    var html =
      '<div class="muni-map-popup">' +
      '<span class="muni-map-popup-type">' +
      info.icon +
      " " +
      escapeHtml(info.label) +
      "</span>" +
      "<strong>" +
      escapeHtml(punto.titulo) +
      "</strong>";
    if (punto.descripcion) {
      html += "<p>" + escapeHtml(punto.descripcion) + "</p>";
    }
    var meta = [];
    if (punto.barrio) meta.push(escapeHtml(punto.barrio));
    if (punto.areaNombre) meta.push(escapeHtml(punto.areaNombre));
    if (punto.fechaInicio) {
      var fechaTexto =
        punto.fechaFin && punto.fechaFin !== punto.fechaInicio
          ? formatFechaMapa(punto.fechaInicio) + " – " + formatFechaMapa(punto.fechaFin)
          : formatFechaMapa(punto.fechaInicio);
      meta.push(escapeHtml(fechaTexto));
    }
    if (punto.tipoMapa === "obra" && punto.estadoObra) {
      var estados = { planificado: "Planificado", en_curso: "En curso", finalizado: "Finalizado" };
      meta.push(escapeHtml(estados[punto.estadoObra] || punto.estadoObra));
    }
    if (meta.length) {
      html += '<p class="muni-map-popup-meta">' + meta.join(" · ") + "</p>";
    }
    if (punto.enlaceUrl) {
      html +=
        '<a class="muni-map-popup-link" href="' +
        escapeHtml(punto.enlaceUrl) +
        '" target="_blank" rel="noopener">M\u00e1s informaci\u00f3n</a>';
    }
    if (isValidCoord(punto.lat, punto.lng)) {
      var dest = encodeURIComponent(punto.lat + "," + punto.lng);
      html +=
        '<a class="muni-map-popup-link muni-map-popup-link--directions" href="https://www.google.com/maps/dir/?api=1&destination=' +
        dest +
        '" target="_blank" rel="noopener">C\u00f3mo llegar</a>';
    }
    html += "</div>";
    return html;
  }

  function directionsUrl(lat, lng) {
    if (!isValidCoord(lat, lng)) return "";
    return (
      "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(lat + "," + lng)
    );
  }

  function addPuntoToMap(map, layerGroup, L, punto, circlesGroup) {
    if (!isValidCoord(punto.lat, punto.lng)) return null;
    var marker = L.marker([punto.lat, punto.lng], {
      icon: createDivIcon(L, punto.tipoMapa),
      title: punto.titulo,
    });
    marker.bindPopup(bindPopupContent(punto));
    layerGroup.addLayer(marker);

    var radius = punto.radioMetros;
    if (radius > 0 && punto.tipoMapa === "contenedor") {
      var circle = L.circle([punto.lat, punto.lng], {
        radius: radius,
        color: tipoInfo(punto.tipoMapa).color,
        fillColor: tipoInfo(punto.tipoMapa).color,
        fillOpacity: 0.12,
        weight: 2,
      });
      circle.bindPopup(bindPopupContent(punto));
      if (circlesGroup) circlesGroup.addLayer(circle);
      else layerGroup.addLayer(circle);
    }
    return marker;
  }

  function initMap(container, options) {
    if (!window.L || !container) return null;
    var L = window.L;
    var opts = options || {};
    var center = opts.center || DEFAULT_CENTER;
    var zoom = opts.zoom != null ? opts.zoom : DEFAULT_ZOOM;

    if (container._leaflet_map) {
      container._leaflet_map.remove();
      container._leaflet_map = null;
    }

    var map = L.map(container, {
      scrollWheelZoom: opts.scrollWheelZoom !== false,
    }).setView([center.lat, center.lng], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    container._leaflet_map = map;

    setTimeout(function () {
      fixMapSize(map, container);
    }, 0);

    return map;
  }

  function initPicker(container, options) {
    if (!window.L || !container) return null;
    var opts = options || {};
    var map = initMap(container, {
      center: opts.center,
      zoom: opts.zoom != null ? opts.zoom : 15,
      scrollWheelZoom: true,
    });
    if (!map) return null;

    var marker = null;
    var circle = null;
    var onChange = typeof opts.onChange === "function" ? opts.onChange : null;

    function setPoint(lat, lng, radioMetros, tipo) {
      if (!isValidCoord(lat, lng)) return;
      if (marker) map.removeLayer(marker);
      if (circle) map.removeLayer(circle);
      marker = L.marker([lat, lng], {
        icon: createDivIcon(window.L, tipo || "actividad"),
      }).addTo(map);
      if (radioMetros > 0) {
        circle = L.circle([lat, lng], {
          radius: radioMetros,
          color: tipoInfo(tipo || "contenedor").color,
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);
      }
      if (onChange) onChange(lat, lng);
    }

    map.on("click", function (e) {
      setPoint(e.latlng.lat, e.latlng.lng, opts.radioMetros || 0, opts.tipo);
    });

    if (isValidCoord(opts.lat, opts.lng)) {
      setPoint(opts.lat, opts.lng, opts.radioMetros || 0, opts.tipo);
      map.setView([opts.lat, opts.lng], opts.zoom || 15);
    }

    setTimeout(function () {
      fixMapSize(map, container);
    }, 200);

    return {
      map: map,
      setPoint: setPoint,
      invalidate: function () {
        fixMapSize(map, container);
      },
    };
  }

  function fixMapSize(map, container) {
    if (!map) return;
    map.invalidateSize(true);
    if (!container) return;
    [100, 300, 700, 1200].forEach(function (delay) {
      setTimeout(function () {
        if (map) map.invalidateSize(true);
      }, delay);
    });
  }

  function hasVisibleSize(container) {
    if (!container) return false;
    var rect = container.getBoundingClientRect();
    return rect.width > 20 && rect.height > 20;
  }

  function watchWhenVisible(container, callback) {
    if (!container || typeof callback !== "function") return;
    var done = false;

    function run() {
      if (done) return false;
      if (!hasVisibleSize(container)) return false;
      done = true;
      callback();
      return true;
    }

    if (run()) return;

    if (typeof IntersectionObserver !== "undefined") {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && run()) observer.disconnect();
          });
        },
        { threshold: 0.01, rootMargin: "40px" }
      );
      observer.observe(container);
    }

    [200, 500, 1000, 2000].forEach(function (delay) {
      setTimeout(run, delay);
    });
  }

  function showMapError(container, message) {
    if (!container) return;
    container.innerHTML =
      '<p class="muni-mapa-picker-error">' + escapeHtml(message) + "</p>";
  }

  window.MuniMapa = {
    DEFAULT_CENTER: DEFAULT_CENTER,
    DEFAULT_ZOOM: DEFAULT_ZOOM,
    TIPO_MAPA: TIPO_MAPA,
    tipoInfo: tipoInfo,
    tipoLabel: tipoLabel,
    mapMapaPunto: mapMapaPunto,
    escapeHtml: escapeHtml,
    isValidCoord: isValidCoord,
    formatFechaMapa: formatFechaMapa,
    isActividadVigenteEnMapa: isActividadVigenteEnMapa,
    isPuntoVisibleEnMapaPublico: isPuntoVisibleEnMapaPublico,
    createDivIcon: createDivIcon,
    bindPopupContent: bindPopupContent,
    directionsUrl: directionsUrl,
    addPuntoToMap: addPuntoToMap,
    initMap: initMap,
    initPicker: initPicker,
    fixMapSize: fixMapSize,
    watchWhenVisible: watchWhenVisible,
    showMapError: showMapError,
  };
})();
