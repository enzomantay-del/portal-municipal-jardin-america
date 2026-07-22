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
      btn.textContent = "Escuchar";
    });
  }

  function speakText(text, btn) {
    if (!window.speechSynthesis) {
      alert("Tu navegador no permite leer en voz alta. Podés leer el texto en pantalla.");
      return;
    }
    stopSpeech();
    var u = new SpeechSynthesisUtterance(String(text || ""));
    u.lang = "es-AR";
    u.rate = 0.95;
    speechUtterance = u;
    if (btn) {
      btn.classList.add("is-playing");
      btn.textContent = "Detener";
    }
    u.onend = u.onerror = function () {
      if (btn) {
        btn.classList.remove("is-playing");
        btn.textContent = "Escuchar";
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
      '<p class="tm-circuitos-kicker">Autoguiado</p>' +
      '<h2 id="circuitos-title">Circuitos turísticos</h2>' +
      "<p>Elegí un recorrido, mirá el mapa y avanzá parada por parada. En cada punto podés leer o escuchar la explicación.</p>" +
      "</header>" +
      '<div id="tm-circuitos-list"></div>' +
      '<div id="tm-circuito-map-wrap" class="tm-circuito-map-wrap" hidden>' +
      '<div id="tm-circuito-map" class="tm-circuito-map" role="application" aria-label="Mapa del circuito"></div>' +
      '<aside id="tm-circuito-panel" class="tm-circuito-panel" aria-live="polite">' +
      '<p class="tm-circuito-panel-empty">Tocá una parada en el mapa o en la lista para ver la explicación.</p>' +
      "</aside></div></div>";

    var anchor =
      document.getElementById("que-visitar-local") ||
      document.getElementById("mapa-turistico") ||
      document.getElementById("inicio");
    if (anchor) {
      anchor.insertAdjacentElement("beforebegin", section);
    } else {
      var main = document.getElementById("main-content") || document.body;
      main.appendChild(section);
    }
    return section;
  }

  function injectNavLink() {
    var menus = document.querySelectorAll("#nav-menu, .nav-menu, nav ul");
    menus.forEach(function (ul) {
      if (!ul || ul.querySelector('a[href="#circuitos"]')) return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#circuitos";
      a.className = "nav-link";
      a.textContent = "Circuitos";
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
    a.innerHTML = "<strong>Circuitos</strong><span>Autoguiado en mapa</span>";
    grid.appendChild(a);
  }

  function renderCards() {
    var list = $("tm-circuitos-list");
    if (!list) return;
    var data = circuits();
    if (!data.length) {
      list.innerHTML = "<p>Pronto publicaremos los primeros circuitos.</p>";
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
        var meta =
          "<ul class=\"tm-circuito-meta\">" +
          "<li>" +
          escapeHtml(c.modalidad) +
          "</li>" +
          "<li>" +
          escapeHtml(c.dificultad || "") +
          "</li>" +
          "<li>" +
          escapeHtml(c.duracion || "") +
          "</li>" +
          "<li>" +
          (c.paradas ? c.paradas.length : 0) +
          " paradas</li></ul>";
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
          (recs ? '<ul class="tm-circuito-recs">' + recs + "</ul>" : "") +
          '<div class="tm-circuito-actions">' +
          '<button type="button" class="tm-btn-primary" data-open-circuito="' +
          escapeHtml(c.id) +
          '">Ver recorrido en el mapa</button>' +
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
      '<div class="tm-circuito-stops" role="tablist" aria-label="Paradas">' +
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
      '<p class="tm-parada-meta">Parada ' +
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
      '">Escuchar</button>' +
      (stop.mapsUrl
        ? '<a class="tm-btn-maps" href="' +
          escapeHtml(stop.mapsUrl) +
          '" target="_blank" rel="noopener noreferrer">Cómo llegar</a>'
        : "") +
      "</div>";
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

    loadLeaflet()
      .then(function () {
        var el = $("tm-circuito-map");
        if (!el) return;

        if (!map) {
          map = window.L.map(el, { scrollWheelZoom: false });
          window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }).addTo(map);
          layerGroup = window.L.layerGroup().addTo(map);
          setTimeout(function () {
            map.invalidateSize();
          }, 80);
        } else {
          layerGroup.clearLayers();
          setTimeout(function () {
            map.invalidateSize();
          }, 80);
        }

        var latlngs = [];
        (circuit.paradas || []).forEach(function (stop) {
          var ll = [stop.lat, stop.lng];
          latlngs.push(ll);
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

        if (latlngs.length >= 2) {
          window.L.polyline(latlngs, {
            color: circuit.color || "#0f5c3a",
            weight: 4,
            opacity: 0.85,
            dashArray: "8 8",
          }).addTo(layerGroup);
        }

        if (latlngs.length) {
          map.fitBounds(window.L.latLngBounds(latlngs).pad(0.25));
        }

        var first = circuit.paradas && circuit.paradas[0];
        if (first) showStop(circuit, first);

        wrap.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function () {
        var panel = $("tm-circuito-panel");
        if (panel) {
          panel.innerHTML =
            '<p class="tm-circuito-panel-empty">No se pudo cargar el mapa. Revisá tu conexión e intentá de nuevo.</p>';
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
    // quick links se inyectan un poco después
    setTimeout(injectQuickLink, 400);
    setTimeout(injectQuickLink, 1600);

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
