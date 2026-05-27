(function () {
  "use strict";

  /* Galería reducida: las más livianas y representativas (~650 KB total vs ~2,5 MB). */
  var GALLERY = [
    {
      src: "assets/jardin-tucan.png",
      alt: "Tucán en la naturaleza de Misiones",
      caption: "Fauna misionera",
    },
    {
      src: "assets/jardin-saltos-tabay.png",
      alt: "Saltos del Tabay, Jardín América",
      caption: "Saltos del Tabay",
    },
    {
      src: "assets/jardin-cascada.png",
      alt: "Saltos del Tabay, Jardín América",
      caption: "Saltos del Tabay",
    },
    {
      src: "assets/jardin-cartel-flores.png",
      alt: "Letrero Jardín América con flores",
      caption: "Una ciudad que florece",
    },
    {
      src: "assets/jardin-casa-cultura.png",
      alt: "Casa de la Cultura de Jardín América",
      caption: "Casa de la Cultura",
    },
  ];

  var AUTO_MS = 5500;
  var loaded = {};

  function initHeroGallery() {
    var root = document.getElementById("muni-hero-showcase");
    if (!root) return;

    var stack = root.querySelector(".muni-hero-stack");
    var dotsEl = root.querySelector(".muni-hero-dots");
    var prevBtn = root.querySelector("[data-gallery-prev]");
    var nextBtn = root.querySelector("[data-gallery-next]");
    var lightbox = document.getElementById("muni-lightbox");
    var lightboxImg = lightbox && lightbox.querySelector(".muni-lightbox-img");
    var lightboxCaption = lightbox && lightbox.querySelector(".muni-lightbox-caption");
    var lightboxClose = lightbox && lightbox.querySelector("[data-lightbox-close]");
    var lightboxPrev = lightbox && lightbox.querySelector("[data-lightbox-prev]");
    var lightboxNext = lightbox && lightbox.querySelector("[data-lightbox-next]");

    var active = 0;
    var timer = null;
    var cards = [];

    function ensureLoaded(index) {
      if (loaded[index]) return;
      var card = cards[index];
      if (!card) return;
      var img = card.querySelector("img");
      if (!img || img.getAttribute("src")) return;
      img.src = img.getAttribute("data-src") || GALLERY[index].src;
      loaded[index] = true;
    }

    function ensureLoadedAround(index) {
      var total = GALLERY.length;
      ensureLoaded(index);
      ensureLoaded((index + 1) % total);
      ensureLoaded((index - 1 + total) % total);
    }

    GALLERY.forEach(function (item, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "muni-hero-stack-card";
      btn.setAttribute("data-index", String(index));
      btn.setAttribute("aria-label", "Ver " + item.caption + " en grande");
      btn.innerHTML =
        '<img data-src="' +
        item.src +
        '" alt="' +
        item.alt.replace(/"/g, "&quot;") +
        '" decoding="async" width="480" height="600">' +
        '<span class="muni-hero-stack-caption">' +
        item.caption +
        "</span>" +
        '<span class="muni-hero-stack-zoom" aria-hidden="true">Ampliar</span>';
      btn.addEventListener("click", function () {
        if (Number(btn.getAttribute("data-pos")) === 0) {
          openLightbox(index);
        } else {
          goTo(index);
        }
      });
      stack.appendChild(btn);
      cards.push(btn);

      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "muni-hero-dot";
      dot.setAttribute("aria-label", "Ir a " + item.caption);
      dot.addEventListener("click", function () {
        goTo(index);
      });
      dotsEl.appendChild(dot);
    });

    var dots = dotsEl.querySelectorAll(".muni-hero-dot");

    function layout() {
      var total = GALLERY.length;
      cards.forEach(function (card, i) {
        var pos = (i - active + total) % total;
        if (pos > total / 2) pos -= total;
        card.setAttribute("data-pos", String(pos));
        card.setAttribute("aria-hidden", pos === 0 ? "false" : "true");
        card.tabIndex = pos === 0 ? 0 : -1;
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === active);
        dot.setAttribute("aria-current", i === active ? "true" : "false");
      });
      ensureLoadedAround(active);
    }

    function goTo(index) {
      active = (index + GALLERY.length) % GALLERY.length;
      layout();
      resetTimer();
    }

    function resetTimer() {
      if (timer) clearInterval(timer);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = setInterval(function () {
        goTo(active + 1);
      }, AUTO_MS);
    }

    function openLightbox(index) {
      if (!lightbox || !lightboxImg) return;
      active = index;
      layout();
      ensureLoaded(index);
      lightboxImg.src = GALLERY[index].src;
      lightboxImg.alt = GALLERY[index].alt;
      if (lightboxCaption) lightboxCaption.textContent = GALLERY[index].caption;
      lightbox.hidden = false;
      document.body.classList.add("muni-lightbox-open");
      if (lightboxClose) lightboxClose.focus();
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.hidden = true;
      document.body.classList.remove("muni-lightbox-open");
      var front = cards[active];
      if (front) front.focus();
    }

    function lightboxStep(delta) {
      var next = (active + delta + GALLERY.length) % GALLERY.length;
      openLightbox(next);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(active - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(active + 1); });
    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener("click", function () { lightboxStep(-1); });
    if (lightboxNext) lightboxNext.addEventListener("click", function () { lightboxStep(1); });

    if (lightbox) {
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox) closeLightbox();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (!lightbox || lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lightboxStep(-1);
      if (e.key === "ArrowRight") lightboxStep(1);
    });

    root.addEventListener("mouseenter", function () {
      if (timer) clearInterval(timer);
    });
    root.addEventListener("mouseleave", resetTimer);

    layout();
    resetTimer();
  }

  document.addEventListener("DOMContentLoaded", initHeroGallery);
})();
