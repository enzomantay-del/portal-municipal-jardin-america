(function () {
  "use strict";

  var STORAGE_KEY = "muni-portal-anuncio-dismissed";

  function getModal() {
    return document.getElementById("muni-anuncio-modal");
  }

  function wasDismissed(version) {
    if (!version) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === String(version);
    } catch (_e) {
      return false;
    }
  }

  function markDismissed(version) {
    if (!version) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(version));
    } catch (_e) {
      /* ignore */
    }
  }

  function closeModal(version) {
    var modal = getModal();
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("muni-anuncio-open");
    markDismissed(version);
  }

  function openModal(anuncio) {
    var modal = getModal();
    if (!modal || !anuncio || !anuncio.imagenUrl) return;
    if (wasDismissed(anuncio.version)) return;

    var img = document.getElementById("muni-anuncio-img");
    var link = document.getElementById("muni-anuncio-link");
    var closeBtn = document.getElementById("muni-anuncio-close");
    var backdrop = document.getElementById("muni-anuncio-backdrop");
    var title = document.getElementById("muni-anuncio-title");

    if (img) {
      img.src = anuncio.imagenUrl;
      img.alt = anuncio.titulo || "Anuncio municipal";
    }
    if (title) title.textContent = anuncio.titulo || "Anuncio municipal";

    if (link) {
      if (anuncio.enlaceUrl) {
        link.href = anuncio.enlaceUrl;
        link.style.cursor = "pointer";
        link.onclick = null;
      } else {
        link.removeAttribute("href");
        link.style.cursor = "default";
        link.onclick = function (e) {
          e.preventDefault();
        };
      }
    }

    modal.hidden = false;
    document.body.classList.add("muni-anuncio-open");

    function dismiss() {
      closeModal(anuncio.version);
    }

    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", dismiss);
    } else if (closeBtn) {
      closeBtn.onclick = dismiss;
    }

    if (backdrop && !backdrop.dataset.bound) {
      backdrop.dataset.bound = "1";
      backdrop.addEventListener("click", dismiss);
    } else if (backdrop) {
      backdrop.onclick = dismiss;
    }

    if (!window._muniAnuncioEscBound) {
      window._muniAnuncioEscBound = true;
      document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        var openModalEl = getModal();
        if (openModalEl && !openModalEl.hidden) {
          closeModal(anuncio.version);
        }
      });
    }

    if (closeBtn) closeBtn.focus();
  }

  async function mountAnuncioEntrada() {
    if (!window.MuniApi || !window.MuniApi.loadAnuncioEntradaPublic) return;
    try {
      var anuncio = await window.MuniApi.loadAnuncioEntradaPublic();
      if (anuncio) openModal(anuncio);
    } catch (err) {
      console.warn("No se pudo cargar el anuncio de entrada.", err);
    }
  }

  window.MuniAnuncio = {
    mountAnuncioEntrada: mountAnuncioEntrada,
  };
})();
