(function () {
  "use strict";

  var eventosData = [];

  function openFlyerLightbox(index) {
    var ev = eventosData[index];
    if (!ev) return;

    var lightbox = document.getElementById("muni-flyer-lightbox");
    var img = lightbox && lightbox.querySelector(".muni-flyer-lightbox-img");
    var caption = lightbox && lightbox.querySelector(".muni-flyer-lightbox-caption");
    var areaEl = lightbox && lightbox.querySelector(".muni-flyer-lightbox-area");
    if (!lightbox || !img) return;

    var area = window.MuniPortal && window.MuniPortal.getArea(ev.areaSlug);
    img.src = ev.imagenUrl;
    img.alt = ev.titulo || "Flyer de evento";
    if (caption) {
      caption.textContent =
        (window.MuniPortal ? window.MuniPortal.formatEventoDate(ev.fechaEvento) : ev.fechaEvento) +
        (ev.titulo ? " · " + ev.titulo : "");
    }
    if (areaEl) {
      areaEl.textContent = area ? area.nombre : ev.areaSlug;
      areaEl.className =
        "muni-flyer-lightbox-area muni-evento-area " +
        (window.MuniPortal ? window.MuniPortal.areaTagClass(ev.areaSlug) : "");
    }

    lightbox.hidden = false;
    document.body.classList.add("muni-lightbox-open");
    lightbox.dataset.activeIndex = String(index);
    var closeBtn = lightbox.querySelector("[data-flyer-lightbox-close]");
    if (closeBtn) closeBtn.focus();
  }

  function closeFlyerLightbox() {
    var lightbox = document.getElementById("muni-flyer-lightbox");
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("muni-lightbox-open");
  }

  function stepFlyerLightbox(delta) {
    var lightbox = document.getElementById("muni-flyer-lightbox");
    if (!lightbox || lightbox.hidden) return;
    var current = Number(lightbox.dataset.activeIndex || 0);
    var next = (current + delta + eventosData.length) % eventosData.length;
    openFlyerLightbox(next);
  }

  function initEventosScroller() {
    var scroller = document.getElementById("muni-eventos-scroller");
    if (!scroller) return;

    var prev = document.querySelector("[data-eventos-prev]");
    var next = document.querySelector("[data-eventos-next]");
    var step = 280;

    if (prev) {
      prev.addEventListener("click", function () {
        scroller.scrollBy({ left: -step, behavior: "smooth" });
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        scroller.scrollBy({ left: step, behavior: "smooth" });
      });
    }

    scroller.querySelectorAll(".muni-evento-flyer-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var index = Number(btn.getAttribute("data-evento-index"));
        openFlyerLightbox(index);
      });
    });
  }

  function bindFlyerLightbox() {
    var lightbox = document.getElementById("muni-flyer-lightbox");
    if (!lightbox) return;

    var closeBtn = lightbox.querySelector("[data-flyer-lightbox-close]");
    var prevBtn = lightbox.querySelector("[data-flyer-lightbox-prev]");
    var nextBtn = lightbox.querySelector("[data-flyer-lightbox-next]");

    if (closeBtn) closeBtn.addEventListener("click", closeFlyerLightbox);
    if (prevBtn) prevBtn.addEventListener("click", function () { stepFlyerLightbox(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { stepFlyerLightbox(1); });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeFlyerLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox || lightbox.hidden) return;
      if (e.key === "Escape") closeFlyerLightbox();
      if (e.key === "ArrowLeft") stepFlyerLightbox(-1);
      if (e.key === "ArrowRight") stepFlyerLightbox(1);
    });
  }

  function mountEventos(eventos) {
    eventosData = eventos || [];
    var root = document.getElementById("muni-eventos-root");
    if (!root || !window.MuniPortal) return;

    if (!eventosData.length) {
      root.innerHTML = "";
      return;
    }

    root.innerHTML = window.MuniPortal.renderEventosSection(eventosData);
    initEventosScroller();
  }

  bindFlyerLightbox();

  window.MuniEventos = {
    mountEventos: mountEventos,
  };
})();
