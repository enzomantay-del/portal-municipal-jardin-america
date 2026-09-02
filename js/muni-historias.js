(function () {
  "use strict";

  var SLOT_ID = "muni-historias-home";
  var cache = null;
  var cacheAt = 0;
  var CACHE_MS = 60 * 1000;

  function escapeHtml(value) {
    if (window.MuniPortal && window.MuniPortal.escapeHtml) {
      return window.MuniPortal.escapeHtml(value);
    }
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value === "string" || typeof value === "number") {
      var t = new Date(value).getTime();
      return Number.isFinite(t) ? t : 0;
    }
    if (value.seconds != null) return Number(value.seconds) * 1000;
    return 0;
  }

  function isVigente(item) {
    var exp = toMillis(item && item.expiresAt);
    return exp > Date.now();
  }

  async function fetchHistorias() {
    if (cache && Date.now() - cacheAt < CACHE_MS) return cache;
    var list = [];
    if (window.MuniApi && window.MuniApi.loadPrensaHistoriasPublic) {
      list = await window.MuniApi.loadPrensaHistoriasPublic();
    }
    cache = (list || []).filter(isVigente);
    cacheAt = Date.now();
    return cache;
  }

  function render(items) {
    if (!items || !items.length) return "";
    return (
      '<section class="muni-historias" aria-labelledby="muni-historias-title">' +
      '<div class="muni-historias-head">' +
      '<p class="muni-historias-kicker">Prensa municipal</p>' +
      '<h3 id="muni-historias-title">Historias de la gestión</h3>' +
      "<p>Videos cortos de acciones del día. Se publican por 7 días.</p>" +
      "</div>" +
      '<div class="muni-historias-scroller" tabindex="0" role="list">' +
      items
        .map(function (item) {
          return (
            '<article class="muni-historia-card" role="listitem" data-historia-id="' +
            escapeHtml(item.id) +
            '">' +
            '<div class="muni-historia-frame">' +
            (item.posterUrl
              ? '<img class="muni-historia-poster" src="' +
                escapeHtml(item.posterUrl) +
                '" alt="" loading="lazy" decoding="async">'
              : '<span class="muni-historia-poster-fallback" aria-hidden="true"></span>') +
            '<video class="muni-historia-video" playsinline preload="none" controls' +
            ' data-src="' +
            escapeHtml(item.videoUrl) +
            '"' +
            (item.posterUrl ? ' poster="' + escapeHtml(item.posterUrl) + '"' : "") +
            "></video>" +
            '<button type="button" class="muni-historia-play" aria-label="Reproducir' +
            (item.titulo ? ": " + escapeHtml(item.titulo) : "") +
            '">' +
            '<span class="muni-historia-play-icon" aria-hidden="true"></span>' +
            "</button>" +
            "</div>" +
            (item.titulo
              ? '<p class="muni-historia-caption">' + escapeHtml(item.titulo) + "</p>"
              : "") +
            "</article>"
          );
        })
        .join("") +
      "</div></section>"
    );
  }

  function pauseOthers(exceptVideo) {
    var root = document.getElementById(SLOT_ID);
    if (!root) return;
    root.querySelectorAll(".muni-historia-video").forEach(function (v) {
      if (v !== exceptVideo) {
        try {
          v.pause();
        } catch (_e) {}
      }
    });
  }

  function activateVideo(card) {
    if (!card) return;
    var video = card.querySelector(".muni-historia-video");
    if (!video) return;
    var src = video.getAttribute("data-src");
    if (src && !video.getAttribute("src")) {
      video.setAttribute("src", src);
      video.load();
    }
    card.classList.add("is-playing");
    pauseOthers(video);
    var playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {});
    }
  }

  function bindInteractions(root) {
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "1";

    root.addEventListener("click", function (e) {
      var btn = e.target.closest(".muni-historia-play");
      if (!btn || !root.contains(btn)) return;
      var card = btn.closest(".muni-historia-card");
      if (!card) return;
      e.preventDefault();
      activateVideo(card);
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) return;
            var video = entry.target.querySelector(".muni-historia-video");
            if (video && !video.paused) {
              try {
                video.pause();
              } catch (_e) {}
            }
          });
        },
        { threshold: 0.15 }
      );
      root.querySelectorAll(".muni-historia-card").forEach(function (card) {
        io.observe(card);
      });
    }
  }

  async function mountIntoSlot() {
    var slot = document.getElementById(SLOT_ID);
    if (!slot) return;

    try {
      var items = await fetchHistorias();
      if (!items.length) {
        slot.hidden = true;
        slot.innerHTML = "";
        delete slot.dataset.bound;
        return;
      }
      slot.hidden = false;
      slot.innerHTML = render(items);
      bindInteractions(slot);
    } catch (err) {
      console.warn("MuniHistorias.mount", err);
      slot.hidden = true;
    }
  }

  window.MuniHistorias = {
    mount: mountIntoSlot,
    invalidate: function () {
      cache = null;
      cacheAt = 0;
    },
  };
})();
