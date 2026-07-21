(function () {
  "use strict";

  var ACCESOS = [
    {
      icon: "💬",
      titulo: "Preguntale a AmiBot",
      desc: "Tu asistente para trámites, documentos y turismo del sitio",
      href: "#",
      openConsultas: true,
    },
    {
      icon: "🚧",
      titulo: "Obras en curso",
      desc: "Novedades de Obras Públicas que están en ejecución",
      href: "#",
      openConsultas: true,
      consultasQ: "obras en curso",
      consultasCat: "obras",
    },
    {
      icon: "📊",
      titulo: "Encuesta de gestión",
      desc: "Contanos tu opinión sobre la gestión municipal (anónima)",
      href: "encuesta.html",
      activa: false,
    },
    {
      icon: "📣",
      titulo: "Reportar un problema",
      desc: "Basureros a cielo abierto, alcantarillas tapadas, árboles caídos, etc.",
      href: "reportar-problema.html",
    },
    {
      icon: "🏥",
      titulo: "Salud",
      desc: "Turnos, campañas y programas de salud",
      href: "area.html?area=salud",
    },
    {
      icon: "📋",
      titulo: "Rentas y trámites",
      desc: "Tasas, patentes y consultas tributarias",
      href: "area.html?area=rentas",
    },
    {
      icon: "🏠",
      titulo: "Obras privadas",
      desc: "Habilitaciones e inspecciones",
      href: "area.html?area=obras-privadas",
    },
    {
      icon: "🧪",
      titulo: "Bromatología",
      desc: "Habilitaciones comerciales y control sanitario",
      href: "area.html?area=bromatologia",
    },
    {
      icon: "🗺️",
      titulo: "Mapa de obras",
      desc: "Obras, contenedores y actividades cerca tuyo",
      href: "mapa.html",
    },
    {
      icon: "📅",
      titulo: "Eventos",
      desc: "Agenda de actividades municipales",
      href: "eventos.html",
    },
    {
      icon: "🛡️",
      titulo: "Emergencias",
      desc: "Defensa Civil · 3743-614457",
      href: "area.html?area=defensa-civil",
    },
    {
      icon: "🧳",
      titulo: "Turismo",
      desc: "Atractivos, folleto y circuitos",
      href: "turismo/",
      externo: false,
    },
  ];

  function escapeHtml(str) {
    return window.MuniPortal
      ? window.MuniPortal.escapeHtml(str)
      : String(str || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
  }

  function resolveHref(item) {
    if (item.tipo === "whatsapp" && window.MuniWhatsApp) {
      return window.MuniWhatsApp.url(item.mensaje || "");
    }
    return item.href || "#";
  }

  function renderAccesosSection() {
    var cards = ACCESOS.filter(function (item) {
      return item.activa !== false;
    }).map(function (item) {
      var href = resolveHref(item);
      var externo = item.externo || item.tipo === "whatsapp";
      var attrs = externo ? ' target="_blank" rel="noopener noreferrer"' : "";
      if (item.openConsultas) {
        attrs += ' data-open-consultas role="button"';
        if (item.consultasQ) {
          attrs += ' data-consultas-q="' + escapeHtml(item.consultasQ) + '"';
        }
        if (item.consultasCat) {
          attrs += ' data-consultas-cat="' + escapeHtml(item.consultasCat) + '"';
        }
        if (item.consultasArea) {
          attrs += ' data-consultas-area="' + escapeHtml(item.consultasArea) + '"';
        }
        href = "#";
      }
      return (
        '<a class="muni-acceso-card" href="' +
        escapeHtml(href) +
        '"' +
        attrs +
        ">" +
        '<span class="muni-acceso-icon" aria-hidden="true">' +
        item.icon +
        "</span>" +
        "<span class=\"muni-acceso-body\">" +
        "<strong>" +
        escapeHtml(item.titulo) +
        "</strong>" +
        "<span>" +
        escapeHtml(item.desc) +
        "</span>" +
        "</span>" +
        "</a>"
      );
    }).join("");

    return (
      '<section class="muni-accesos-band" id="accesos-rapidos" aria-labelledby="titulo-accesos">' +
      '<div class="muni-container">' +
      '<div class="muni-section-label muni-section-label--compact">' +
      '<h2 id="titulo-accesos">¿Qué necesitás hoy?</h2>' +
      "</div>" +
      '<p class="muni-accesos-lead">Accesos directos a trámites, consultas y servicios municipales.</p>' +
      '<div class="muni-accesos-grid">' +
      cards +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function mountAccesos() {
    var root = document.getElementById("muni-accesos-root");
    if (!root) return;
    root.innerHTML = renderAccesosSection();
  }

  window.MuniAccesos = {
    mountAccesos: mountAccesos,
    renderAccesosSection: renderAccesosSection,
  };
})();
