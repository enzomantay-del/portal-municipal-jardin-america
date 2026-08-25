/**
 * Circuitos turísticos — cards, mapa Leaflet y audio (TTS).
 */
(function () {
  "use strict";

  var map = null;
  var layerGroup = null;
  var activeCircuitId = null;
  var activeStopId = null;
  var speechUtterance = null;
  var leafletLoading = null;

  var UI = {
    es: {
      nav: "Circuitos",
      quickTitle: "Circuitos",
      quickDesc: "Autoguiado en mapa",
      kicker: "Autoguiado",
      title: "Circuitos turísticos",
      lead: "Elegí un recorrido, mirá el mapa y avanzá parada por parada. En cada punto podés leer o escuchar la explicación.",
      mapAria: "Mapa del circuito",
      panelEmpty: "Tocá una parada en el mapa o en la lista para ver la explicación.",
      empty: "Pronto publicaremos los primeros circuitos.",
      listen: "Escuchar",
      stop: "Detener",
      howTo: "Cómo llegar",
      openMap: "Ver recorrido en el mapa",
      stops: "paradas",
      stopLabel: "Parada",
      difficulty: "Dificultad",
      stopsAria: "Paradas",
      recs: "Recomendaciones",
      mapFail: "No se pudo cargar el mapa. Revisá tu conexión e intentá de nuevo.",
      noTts: "Tu navegador no permite leer en voz alta. Podés leer el texto en pantalla.",
      calculating: "Calculando el recorrido por calles…",
      routeNote:
        "Mostramos la secuencia de paradas. Si el detalle de calles no carga, usá “Cómo llegar” en cada punto.",
    },
    pt: {
      nav: "Circuitos",
      quickTitle: "Circuitos",
      quickDesc: "Autoguiado no mapa",
      kicker: "Autoguiado",
      title: "Circuitos turísticos",
      lead: "Escolha um percurso, veja o mapa e avance parada por parada. Em cada ponto você pode ler ou ouvir a explicação.",
      mapAria: "Mapa do circuito",
      panelEmpty: "Toque uma parada no mapa ou na lista para ver a explicação.",
      empty: "Em breve publicaremos os primeiros circuitos.",
      listen: "Ouvir",
      stop: "Parar",
      howTo: "Como chegar",
      openMap: "Ver percurso no mapa",
      stops: "paradas",
      stopLabel: "Parada",
      difficulty: "Dificuldade",
      stopsAria: "Paradas",
      recs: "Recomendações",
      mapFail: "Não foi possível carregar o mapa. Verifique sua conexão e tente de novo.",
      noTts: "Seu navegador não permite leitura em voz alta. Você pode ler o texto na tela.",
      calculating: "Calculando o percurso pelas ruas…",
      routeNote:
        "Mostramos a sequência de paradas. Se o detalhe das ruas não carregar, use “Como chegar” em cada ponto.",
    },
    en: {
      nav: "Circuits",
      quickTitle: "Circuits",
      quickDesc: "Self-guided map tour",
      kicker: "Self-guided",
      title: "Tourist circuits",
      lead: "Pick a route, check the map and go stop by stop. At each point you can read or listen to the guide.",
      mapAria: "Circuit map",
      panelEmpty: "Tap a stop on the map or in the list to see the guide.",
      empty: "We will publish the first circuits soon.",
      listen: "Listen",
      stop: "Stop",
      howTo: "How to get there",
      openMap: "View route on the map",
      stops: "stops",
      stopLabel: "Stop",
      difficulty: "Difficulty",
      stopsAria: "Stops",
      recs: "Tips",
      mapFail: "Could not load the map. Check your connection and try again.",
      noTts: "Your browser cannot read aloud. You can still read the text on screen.",
      calculating: "Calculating the street route…",
      routeNote:
        "We show the stop sequence. If street detail fails to load, use “How to get there” at each point.",
    },
  };

  function lang() {
    try {
      var stored = localStorage.getItem("tm-lang");
      if (stored === "pt" || stored === "en" || stored === "es") return stored;
    } catch (_e) {}
    return "es";
  }

  function t(key) {
    var d = UI[lang()] || UI.es;
    return d[key] || UI.es[key] || key;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function circuits() {
    return Array.isArray(window.TURISMO_CIRCUITOS) ? window.TURISMO_CIRCUITOS : [];
  }

  function stopSpeech() {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (_e) {}
    speechUtterance = null;
    document.querySelectorAll(".tm-btn-listen.is-playing").forEach(function (btn) {
      btn.classList.remove("is-playing");
      btn.textContent = t("listen");
    });
  }

  function speakText(text, btn) {
    if (!window.speechSynthesis) {
      alert(t("noTts"));
      return;
    }
    stopSpeech();
    var u = new SpeechSynthesisUtterance(String(text || ""));
    var L = lang();
    u.lang = L === "pt" ? "pt-BR" : L === "en" ? "en-US" : "es-AR";
    u.rate = 0.95;
    speechUtterance = u;
    if (btn) {
      btn.classList.add("is-playing");
      btn.textContent = t("stop");
    }
    u.onend = u.onerror = function () {
      if (btn) {
        btn.classList.remove("is-playing");
        btn.textContent = t("listen");
      }
      speechUtterance = null;
    };
    window.speechSynthesis.speak(u);
  }

  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (leafletLoading) return leafletLoading;
    leafletLoading = new Promise(function (resolve, reject) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      var s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error("No se pudo cargar el mapa"));
      };
      document.body.appendChild(s);
    });
    return leafletLoading;
  }

  function ensureSection() {
    if ($("circuitos")) return $("circuitos");

    var section = document.createElement("section");
    section.id = "circuitos";
    section.className = "tm-circuitos";
    section.setAttribute("aria-labelledby", "circuitos-title");
    section.innerHTML =
      '<div class="container">' +
      '<header class="tm-circuitos-head">' +
      '<p class="tm-circuitos-kicker" data-circ-i18n="kicker"></p>' +
      '<h2 id="circuitos-title" data-circ-i18n="title"></h2>' +
      '<p data-circ-i18n="lead"></p>' +
      "</header>" +
      '<div id="tm-circuitos-list"></div>' +
      '<div id="tm-circuito-map-wrap" class="tm-circuito-map-wrap" hidden>' +
      '<div id="tm-circuito-map" class="tm-circuito-map" role="application" data-circ-i18n-aria="mapAria"></div>' +
      '<aside id="tm-circuito-panel" class="tm-circuito-panel" aria-live="polite">' +
      '<p class="tm-circuito-panel-empty" data-circ-i18n="panelEmpty"></p>' +
      "</aside></div></div>";
    applyChrome(section);

    var local = document.getElementById("que-visitar-local");
    var provincia = document.getElementById("que-visitar-provincia");
    if (local) {
      // Último bloque de “Qué visitar aquí”
      local.appendChild(section);
    } else if (provincia) {
      provincia.insertAdjacentElement("beforebegin", section);
    } else {
      var main = document.getElementById("main-content") || document.body;
      main.appendChild(section);
    }
    return section;
  }

  function applyChrome(root) {
    root = root || $("circuitos") || document;
    root.querySelectorAll("[data-circ-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-circ-i18n");
      if (key) el.textContent = t(key);
    });
    root.querySelectorAll("[data-circ-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-circ-i18n-aria");
      if (key) el.setAttribute("aria-label", t(key));
    });
    document.querySelectorAll('a[href="#circuitos"].nav-link').forEach(function (a) {
      a.textContent = t("nav");
    });
    var quick = document.querySelector('.tm-quick-link[href="#circuitos"]');
    if (quick) {
      var strong = quick.querySelector("strong");
      var span = quick.querySelector("span");
      if (strong) strong.textContent = t("quickTitle");
      if (span) span.textContent = t("quickDesc");
    }
  }

  function injectNavLink() {
    var menus = document.querySelectorAll("#nav-menu, .nav-menu, nav ul");
    menus.forEach(function (ul) {
      if (!ul || ul.querySelector('a[href="#circuitos"]')) return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#circuitos";
      a.className = "nav-link";
      a.textContent = t("nav");
      li.appendChild(a);
      var ref = ul.querySelector('a[href="#que-visitar-local"]');
      if (ref && ref.parentElement) {
        ul.insertBefore(li, ref.parentElement);
      } else {
        ul.appendChild(li);
      }
    });
  }

  function injectQuickLink() {
    var grid = document.querySelector(".tm-quick-grid");
    if (!grid || grid.querySelector('a[href="#circuitos"]')) return;
    var a = document.createElement("a");
    a.className = "tm-quick-link";
    a.href = "#circuitos";
    a.setAttribute("role", "listitem");
    a.innerHTML = "<strong></strong><span></span>";
    a.querySelector("strong").textContent = t("quickTitle");
    a.querySelector("span").textContent = t("quickDesc");
    grid.appendChild(a);
  }

  function renderCards() {
    var list = $("tm-circuitos-list");
    if (!list) return;
    var data = circuits();
    if (!data.length) {
      list.innerHTML = "<p>" + escapeHtml(t("empty")) + "</p>";
      return;
    }

    list.innerHTML = data
      .map(function (c) {
        var imgs = (c.imagenes || []).slice(0, 4);
        var first = imgs[0] || "";
        var dots = imgs
          .map(function (_src, i) {
            return (
              '<button type="button" data-circuito-gallery="' +
              escapeHtml(c.id) +
              '" data-idx="' +
              i +
              '" class="' +
              (i === 0 ? "is-active" : "") +
              '" aria-label="Foto ' +
              (i + 1) +
              '"></button>'
            );
          })
          .join("");
        var metaItems = [];
        if (c.modalidad) metaItems.push(c.modalidad);
        if (c.dificultad) metaItems.push(t("difficulty") + " " + String(c.dificultad).toLowerCase());
        if (c.duracion) metaItems.push(c.duracion);
        if (c.paradas && c.paradas.length) metaItems.push(c.paradas.length + " " + t("stops"));
        var meta =
          '<p class="tm-circuito-meta">' +
          metaItems
            .map(function (item) {
              return "<span>" + escapeHtml(item) + "</span>";
            })
            .join('<span aria-hidden="true"> · </span>') +
          "</p>";
        var recs = (c.recomendaciones || [])
          .map(function (r) {
            return "<li>" + escapeHtml(r) + "</li>";
          })
          .join("");
        return (
          '<article class="tm-circuito-card" data-circuito-id="' +
          escapeHtml(c.id) +
          '">' +
          '<div class="tm-circuito-media">' +
          '<img src="' +
          escapeHtml(first) +
          '" alt="' +
          escapeHtml(c.nombre) +
          '" data-circuito-img="' +
          escapeHtml(c.id) +
          '" loading="lazy" decoding="async">' +
          (dots ? '<div class="tm-circuito-media-dots">' + dots + "</div>" : "") +
          "</div>" +
          '<div class="tm-circuito-body">' +
          "<h3>" +
          escapeHtml(c.nombre) +
          "</h3>" +
          meta +
          '<p class="tm-circuito-desc">' +
          escapeHtml(c.descripcion) +
          "</p>" +
          (recs
            ? '<p class="tm-circuito-recs-label">' +
              escapeHtml(t("recs")) +
              '</p><ul class="tm-circuito-recs">' +
              recs +
              "</ul>"
            : "") +
          '<div class="tm-circuito-actions">' +
          '<button type="button" class="tm-btn-primary" data-open-circuito="' +
          escapeHtml(c.id) +
          '">' +
          escapeHtml(t("openMap")) +
          "</button>" +
          "</div></div></article>"
        );
      })
      .join("");
  }

  function findCircuit(id) {
    return circuits().find(function (c) {
      return c.id === id;
    });
  }

  function findStop(circuit, stopId) {
    return (circuit.paradas || []).find(function (p) {
      return p.id === stopId;
    });
  }

  function numberIcon(n, color) {
    return window.L.divIcon({
      className: "",
      html:
        '<div class="tm-circuito-marker" style="background:' +
        (color || "#0f5c3a") +
        '">' +
        n +
        "</div>",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  function showStop(circuit, stop) {
    activeStopId = stop.id;
    var panel = $("tm-circuito-panel");
    if (!panel) return;

    document.querySelectorAll(".tm-circuito-stop-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-stop") === stop.id);
    });

    panel.innerHTML =
      '<div class="tm-circuito-stops" role="tablist" aria-label="' +
      escapeHtml(t("stopsAria")) +
      '">' +
      (circuit.paradas || [])
        .map(function (p) {
          return (
            '<button type="button" class="tm-circuito-stop-btn' +
            (p.id === stop.id ? " is-active" : "") +
            '" data-stop="' +
            escapeHtml(p.id) +
            '">' +
            p.orden +
            ". " +
            escapeHtml(p.nombre) +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      (stop.imagen
        ? '<figure class="tm-parada-fig"><img src="' +
          escapeHtml(stop.imagen) +
          '" alt="' +
          escapeHtml(stop.nombre) +
          '" loading="lazy" decoding="async"></figure>'
        : "") +
      '<h3 class="tm-parada-title">' +
      escapeHtml(stop.nombre) +
      "</h3>" +
      '<p class="tm-parada-meta">' +
      escapeHtml(t("stopLabel")) +
      " " +
      stop.orden +
      " · " +
      escapeHtml(stop.tiempo || "") +
      "</p>" +
      (stop.tip ? '<p class="tm-parada-tip">' + escapeHtml(stop.tip) + "</p>" : "") +
      '<p class="tm-parada-texto">' +
      escapeHtml(stop.texto) +
      "</p>" +
      '<div class="tm-parada-actions">' +
      '<button type="button" class="tm-btn-listen" data-listen-stop="' +
      escapeHtml(stop.id) +
      '">' +
      escapeHtml(t("listen")) +
      "</button>" +
      (stop.mapsUrl
        ? '<a class="tm-btn-maps" href="' +
          escapeHtml(stop.mapsUrl) +
          '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(t("howTo")) +
          "</a>"
        : "") +
      "</div>";
  }

  function fetchStreetRoute(paradas) {
    if (!paradas || paradas.length < 2) {
      return Promise.resolve(null);
    }
    var coords = paradas
      .map(function (p) {
        return p.lng + "," + p.lat;
      })
      .join(";");
    var url =
      "https://router.project-osrm.org/route/v1/cycling/" +
      coords +
      "?overview=full&geometries=geojson";
    return fetch(url)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (!data || data.code !== "Ok" || !data.routes || !data.routes[0]) {
          throw new Error("Sin ruta");
        }
        var route = data.routes[0];
        var latlngs = (route.geometry.coordinates || []).map(function (c) {
          return [c[1], c[0]];
        });
        return {
          latlngs: latlngs,
          distanceKm: route.distance ? (route.distance / 1000).toFixed(1) : null,
          durationMin: route.duration ? Math.round(route.duration / 60) : null,
        };
      });
  }

  function drawCircuit(circuit, routeInfo) {
    var el = $("tm-circuito-map");
    if (!el || !window.L) return;

    if (!map) {
      map = window.L.map(el, { scrollWheelZoom: false });
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      layerGroup = window.L.layerGroup().addTo(map);
    } else {
      layerGroup.clearLayers();
    }

    setTimeout(function () {
      map.invalidateSize();
    }, 80);

    var stopLatLngs = [];
    (circuit.paradas || []).forEach(function (stop) {
      var ll = [stop.lat, stop.lng];
      stopLatLngs.push(ll);
      var marker = window.L.marker(ll, {
        icon: numberIcon(stop.orden, circuit.color),
        title: stop.nombre,
      });
      marker.on("click", function () {
        showStop(circuit, stop);
        map.panTo(ll);
      });
      marker.addTo(layerGroup);
    });

    var linePoints =
      routeInfo && routeInfo.latlngs && routeInfo.latlngs.length > 1
        ? routeInfo.latlngs
        : stopLatLngs;

    if (linePoints.length >= 2) {
      window.L.polyline(linePoints, {
        color: circuit.color || "#1a5c3c",
        weight: 5,
        opacity: 0.9,
      }).addTo(layerGroup);
    }

    if (linePoints.length) {
      map.fitBounds(window.L.latLngBounds(linePoints).pad(0.2));
    }

    var note = "";
    if (routeInfo && routeInfo.distanceKm) {
      var L = lang();
      if (L === "en") {
        note =
          "Suggested street route · ~" +
          routeInfo.distanceKm +
          " km" +
          (routeInfo.durationMin ? " · ~" + routeInfo.durationMin + " min by bike" : "");
      } else if (L === "pt") {
        note =
          "Percurso sugerido pelas ruas · ~" +
          routeInfo.distanceKm +
          " km" +
          (routeInfo.durationMin ? " · ~" + routeInfo.durationMin + " min de bike" : "");
      } else {
        note =
          "Recorrido sugerido por calles · ~" +
          routeInfo.distanceKm +
          " km" +
          (routeInfo.durationMin ? " · ~" + routeInfo.durationMin + " min en bici" : "");
      }
    } else {
      note = t("routeNote");
    }
    var existing = document.getElementById("tm-circuito-route-note");
    if (!existing) {
      existing = document.createElement("p");
      existing.id = "tm-circuito-route-note";
      existing.className = "tm-circuito-route-note";
      var wrap = $("tm-circuito-map-wrap");
      if (wrap) wrap.insertAdjacentElement("afterend", existing);
    }
    existing.textContent = note;

    var first = circuit.paradas && circuit.paradas[0];
    if (first) showStop(circuit, first);
  }

  function openCircuitOnMap(circuitId) {
    var circuit = findCircuit(circuitId);
    if (!circuit) return;

    activeCircuitId = circuitId;
    stopSpeech();

    var wrap = $("tm-circuito-map-wrap");
    if (wrap) {
      wrap.hidden = false;
      wrap.classList.add("is-open");
    }

    var panel = $("tm-circuito-panel");
    if (panel) {
      panel.innerHTML =
        '<p class="tm-circuito-panel-empty">' + escapeHtml(t("calculating")) + "</p>";
    }

    loadLeaflet()
      .then(function () {
        return fetchStreetRoute(circuit.paradas || [])
          .catch(function () {
            return null;
          })
          .then(function (routeInfo) {
            drawCircuit(circuit, routeInfo);
            if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "start" });
          });
      })
      .catch(function () {
        if (panel) {
          panel.innerHTML =
            '<p class="tm-circuito-panel-empty">' + escapeHtml(t("mapFail")) + "</p>";
        }
      });
  }

  function bind() {
    var root = $("circuitos");
    if (!root || root.getAttribute("data-bound") === "1") return;
    root.setAttribute("data-bound", "1");

    root.addEventListener("click", function (e) {
      var galleryBtn = e.target.closest("[data-circuito-gallery]");
      if (galleryBtn) {
        var cid = galleryBtn.getAttribute("data-circuito-gallery");
        var idx = Number(galleryBtn.getAttribute("data-idx") || 0);
        var c = findCircuit(cid);
        if (!c || !c.imagenes || !c.imagenes[idx]) return;
        var img = root.querySelector('[data-circuito-img="' + cid + '"]');
        if (img) img.src = c.imagenes[idx];
        root.querySelectorAll('[data-circuito-gallery="' + cid + '"]').forEach(function (b) {
          b.classList.toggle("is-active", b === galleryBtn);
        });
        return;
      }

      var openBtn = e.target.closest("[data-open-circuito]");
      if (openBtn) {
        openCircuitOnMap(openBtn.getAttribute("data-open-circuito"));
        return;
      }

      var stopBtn = e.target.closest("[data-stop]");
      if (stopBtn) {
        var circuit = findCircuit(activeCircuitId);
        var stop = circuit && findStop(circuit, stopBtn.getAttribute("data-stop"));
        if (circuit && stop) {
          showStop(circuit, stop);
          if (map) map.panTo([stop.lat, stop.lng]);
        }
        return;
      }

      var listenBtn = e.target.closest("[data-listen-stop]");
      if (listenBtn) {
        if (listenBtn.classList.contains("is-playing")) {
          stopSpeech();
          return;
        }
        var circuit2 = findCircuit(activeCircuitId);
        var stop2 = circuit2 && findStop(circuit2, listenBtn.getAttribute("data-listen-stop"));
        if (stop2) speakText(stop2.texto, listenBtn);
      }
    });
  }

  function boot() {
    ensureSection();
    renderCards();
    bind();
    injectNavLink();
    applyChrome();
    // quick links se inyectan un poco después
    setTimeout(injectQuickLink, 400);
    setTimeout(injectQuickLink, 1600);

    document.addEventListener("tm-lang-change", function () {
      applyChrome();
      renderCards();
      if (activeCircuitId && activeStopId) {
        var circuit = findCircuit(activeCircuitId);
        var stop = circuit && findStop(circuit, activeStopId);
        if (circuit && stop) showStop(circuit, stop);
      }
    });

    if ((location.hash || "") === "#circuitos" && circuits()[0]) {
      setTimeout(function () {
        openCircuitOnMap(circuits()[0].id);
      }, 500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
