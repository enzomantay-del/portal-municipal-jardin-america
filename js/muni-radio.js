(function () {
  "use strict";

  var cfg = window.MUNI_RADIO_CONFIG || {
    streamUrl: "https://01.solumedia.com.ar:9108/stream",
    stationName: "FM Los Pioneros",
    frequency: "98.5 FM",
    tagline: "Radio municipal · Jardín América al mundo",
    website: "https://fmlospioneros.com.ar/",
  };

  function iconPlay() {
    return (
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">' +
      '<path d="M8 5v14l11-7z"/></svg>'
    );
  }

  function iconPause() {
    return (
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">' +
      '<path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/></svg>'
    );
  }

  function ensureAudio() {
    var audio = document.getElementById("muni-radio-audio");
    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "muni-radio-audio";
      audio.preload = "none";
      audio.hidden = true;
      document.body.appendChild(audio);
    }
    if (!audio.getAttribute("src")) {
      audio.src = cfg.streamUrl;
    }
    return audio;
  }

  function buildTopbarRadioMarkup() {
    return (
      '<div class="muni-topbar-radio" id="muni-topbar-radio" data-muni-radio-root aria-label="Radio ' +
      cfg.stationName +
      " " +
      cfg.frequency +
      '">' +
      '<span class="muni-topbar-radio-dot" aria-hidden="true"></span>' +
      '<button type="button" class="muni-topbar-radio-btn" data-muni-radio-toggle aria-label="Escuchar radio en vivo">' +
      iconPlay() +
      "</button>" +
      '<span class="muni-topbar-radio-meta">' +
      '<span class="muni-topbar-radio-station">' +
      cfg.stationName +
      "</span>" +
      '<span class="muni-topbar-radio-freq">' +
      cfg.frequency +
      "</span>" +
      "</span>" +
      '<label class="muni-topbar-radio-volume" for="muni-radio-volume" aria-label="Volumen">' +
      '<input type="range" id="muni-radio-volume" min="0" max="1" step="0.05" value="1">' +
      "</label>" +
      '<span class="muni-topbar-radio-status" id="muni-radio-status" role="status">Radio en vivo</span>' +
      "</div>"
    );
  }

  function ensureTopbarRadio() {
    if (document.getElementById("muni-topbar-radio")) return;

    var topbarInner = document.querySelector(".muni-topbar-inner");
    if (!topbarInner) {
      var topbar = document.createElement("div");
      topbar.className = "muni-topbar";
      topbar.innerHTML = '<div class="muni-topbar-inner">' + buildTopbarRadioMarkup() + "</div>";
      var skip = document.querySelector(".muni-skip");
      if (skip && skip.parentNode) {
        skip.parentNode.insertBefore(topbar, skip.nextSibling);
      } else {
        document.body.insertBefore(topbar, document.body.firstChild);
      }
      return;
    }

    var tagline = topbarInner.querySelector(".muni-topbar-tagline");
    if (tagline) {
      tagline.insertAdjacentHTML("afterend", buildTopbarRadioMarkup());
    } else {
      topbarInner.insertAdjacentHTML("afterbegin", buildTopbarRadioMarkup());
    }
  }

  function initRadioPlayer() {
    if (document.body.dataset.radioBound) return;
    document.body.dataset.radioBound = "1";

    ensureTopbarRadio();
    var audio = ensureAudio();
    var status = document.getElementById("muni-radio-status");
    var volume = document.getElementById("muni-radio-volume");
    var section = document.getElementById("radio-municipal");
    var sectionStatus = section ? section.querySelector(".muni-radio-section-status") : null;

    function setStatus(text) {
      if (status) status.textContent = text;
      if (sectionStatus) sectionStatus.textContent = text;
    }

    function setPlaying(isPlaying) {
      document.querySelectorAll("[data-muni-radio-root]").forEach(function (root) {
        root.classList.toggle("is-playing", isPlaying);
      });
      if (section) section.classList.toggle("is-playing", isPlaying);

      document.querySelectorAll("[data-muni-radio-toggle]").forEach(function (btn) {
        var isSectionBtn = btn.classList.contains("muni-btn--radio");
        btn.innerHTML = isPlaying
          ? iconPause() + (isSectionBtn ? "<span>Pausar</span>" : "")
          : iconPlay() + (isSectionBtn ? "<span>Escuchar en vivo</span>" : "");
        btn.setAttribute("aria-label", isPlaying ? "Pausar radio" : "Reproducir radio en vivo");
        btn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
      });
    }

    async function play() {
      try {
        if (!audio.src) audio.src = cfg.streamUrl;
        await audio.play();
        setPlaying(true);
        setStatus("En vivo · " + cfg.stationName);
      } catch (_err) {
        setPlaying(false);
        setStatus("No se pudo iniciar. Probá de nuevo.");
      }
    }

    function pause() {
      audio.pause();
      setPlaying(false);
      setStatus("Pausado");
    }

    function togglePlayback() {
      if (audio.paused) play();
      else pause();
    }

    document.querySelectorAll("[data-muni-radio-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        togglePlayback();
      });
    });

    document.querySelectorAll("[data-muni-radio-play]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        var href = btn.getAttribute("href");
        if (href && href.charAt(0) === "#" && href.length > 1) {
          var target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
        if (audio.paused) play();
        else pause();
      });
    });

    if (volume) {
      volume.addEventListener("input", function () {
        audio.volume = Number(volume.value);
      });
      audio.volume = Number(volume.value);
    }

    audio.addEventListener("playing", function () {
      setPlaying(true);
      setStatus("En vivo · " + cfg.stationName);
    });

    audio.addEventListener("pause", function () {
      if (!audio.ended) {
        setPlaying(false);
        if (status && status.textContent.indexOf("Pausado") === -1) {
          setStatus("Pausado");
        }
      }
    });

    audio.addEventListener("waiting", function () {
      setStatus("Conectando…");
    });

    audio.addEventListener("error", function () {
      setPlaying(false);
      setStatus("Error de conexión. Probá más tarde.");
    });

    window.MuniRadio = {
      play: play,
      pause: pause,
      toggle: togglePlayback,
      audio: audio,
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.body.classList.contains("muni-body")) return;
    initRadioPlayer();
  });
})();
