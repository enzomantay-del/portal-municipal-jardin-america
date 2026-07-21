(function () {
  "use strict";

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function toIntl(value) {
    var d = digits(value);
    if (!d) return "";
    if (d.indexOf("54") === 0) return d;
    return "54" + d;
  }

  function waUrl(telefono, area) {
    var intl = toIntl(telefono);
    if (!intl) return "#";
    var msg =
      "Hola, quiero consultar al área de " +
      (area || "la Municipalidad de Jardín América") +
      ".";
    return "https://wa.me/" + intl + "?text=" + encodeURIComponent(msg);
  }

  function telUrl(telefono) {
    var intl = toIntl(telefono);
    return intl ? "tel:+" + intl : "#";
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function renderList(items) {
    var list = document.getElementById("muni-contactos-list");
    var empty = document.getElementById("muni-contactos-empty");
    if (!list) return;

    if (!items.length) {
      list.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    list.innerHTML = items
      .map(function (item) {
        var nota = item.nota
          ? '<span class="muni-contactos-nota">' + escapeHtml(item.nota) + "</span>"
          : "";
        var titleInner = item.slug
          ? '<a href="area.html?area=' +
            encodeURIComponent(item.slug) +
            '">' +
            escapeHtml(item.area) +
            "</a>"
          : escapeHtml(item.area);

        return (
          '<article class="muni-contactos-item">' +
          '<div class="muni-contactos-item-main">' +
          '<h2 class="muni-contactos-area">' +
          titleInner +
          nota +
          "</h2>" +
          '<p class="muni-contactos-phone">' +
          '<a href="' +
          escapeHtml(telUrl(item.telefono)) +
          '">' +
          escapeHtml(item.telefono) +
          "</a></p>" +
          "</div>" +
          '<div class="muni-contactos-actions">' +
          '<a class="muni-btn muni-btn--whatsapp" href="' +
          escapeHtml(waUrl(item.telefono, item.area)) +
          '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
          '<a class="muni-btn muni-btn--secondary muni-btn--sm" href="' +
          escapeHtml(telUrl(item.telefono)) +
          '">Llamar</a>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function filterItems(query) {
    var all = window.MUNI_CONTACTOS || [];
    var q = normalize(query);
    if (!q) return all.slice();
    return all.filter(function (item) {
      var blob = normalize(
        [item.area, item.telefono, item.nota || "", item.slug || ""].join(" ")
      );
      return blob.indexOf(q) !== -1;
    });
  }

  function boot() {
    if (window.MuniPortal && window.MuniPortal.initNav) {
      window.MuniPortal.initNav("contactos");
    }

    var input = document.getElementById("muni-contactos-search");
    function paint() {
      renderList(filterItems(input ? input.value : ""));
    }
    if (input) {
      input.addEventListener("input", paint);
    }

    var tries = 0;
    function paintWhenReady() {
      var all = window.MUNI_CONTACTOS || [];
      if (all.length || tries >= 20) {
        paint();
        return;
      }
      tries += 1;
      setTimeout(paintWhenReady, 50);
    }
    paintWhenReady();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
