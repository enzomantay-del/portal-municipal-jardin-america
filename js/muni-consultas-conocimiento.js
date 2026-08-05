/**
 * Base de consultas municipales (sin IA, sin costo de API).
 * Incluye trámites del portal + info turística / colectivos.
 */
(function () {
  "use strict";

  // En dominio propio: /turismo/ · En GitHub Pages: /portal-municipal-jardin-america/turismo/
  var TURISMO_URL = (function () {
    try {
      var path = String(window.location.pathname || "");
      if (path.indexOf("/portal-municipal-jardin-america") === 0) {
        return "/portal-municipal-jardin-america/turismo/";
      }
    } catch (_e) {}
    return "/turismo/";
  })();

  var STATIC_ENTRIES = [
    {
      id: "contacto-municipal",
      categoria: "contacto",
      titulo: "Contacto y horario de la Municipalidad",
      keywords: ["contacto", "horario", "atencion", "whatsapp", "direccion", "municipalidad", "telefono", "mesa de entrada", "mesa"],
      resumen: "Dirección, WhatsApp y horario de atención al vecino.",
      detalleHtml:
        "<ul>" +
        "<li><strong>Dirección:</strong> Av. Belgrano 666 · Jardín América, Misiones</li>" +
        "<li><strong>Mesa de entrada (WhatsApp):</strong> 3743-509860</li>" +
        "<li><strong>Horario:</strong> lunes a viernes, 7:00 a 13:00 hs</li>" +
        "<li>También hay un <strong>listado de teléfonos por área</strong> con WhatsApp directo.</li>" +
        "</ul>",
      enlaces: [
        { titulo: "Ver contactos por área (WhatsApp)", url: "contactos.html" },
        { titulo: "Ir al contacto en el portal", url: "index.html#contacto" },
      ],
    },
    {
      id: "obras-privadas-contacto",
      categoria: "area",
      areaSlug: "obras-privadas",
      titulo: "Contacto — Dirección de Obras Privadas",
      keywords: ["obras privadas", "planos", "permiso", "florencia", "anais", "habilitacion"],
      resumen: "Responsable y teléfono del área de Obras Privadas.",
      detalleHtml:
        "<p><strong>Responsable:</strong> Arq. Florencia De Añais</p>" +
        "<p><strong>Contacto:</strong> 379-4358121</p>" +
        "<p>Consultas sobre planos, permisos de obra, inspecciones y habilitación.</p>",
      enlaces: [
        { titulo: "Ir al área Obras Privadas", url: "area.html?area=obras-privadas" },
        { titulo: "Ver documentos del área", url: "area.html?area=obras-privadas#documentos" },
        { titulo: "WhatsApp Obras Privadas", url: "https://wa.me/543794358121" },
      ],
    },
    {
      id: "ambiente-contacto",
      categoria: "area",
      areaSlug: "ambiente",
      titulo: "Contacto — Medio Ambiente",
      keywords: ["ambiente", "medio ambiente", "parque", "arroyo", "capilla", "rocio", "paez"],
      resumen: "Responsable y teléfono del área de Medio Ambiente.",
      detalleHtml:
        "<p><strong>Responsable:</strong> Ing. en Rec. Naturales y Medio Ambiente Rocío Páez Campos</p>" +
        "<p><strong>Contacto:</strong> 3743 474858</p>",
      enlaces: [{ titulo: "Ir al área Medio Ambiente", url: "area.html?area=ambiente" }],
    },
    {
      id: "defensa-civil-emergencia",
      categoria: "area",
      areaSlug: "defensa-civil",
      titulo: "Defensa Civil — emergencia",
      keywords: [
        "defensa civil",
        "emergencia",
        "emergencias",
        "alerta",
        "evacuacion",
        "inundacion",
        "incendio",
        "tormenta",
        "aguiar",
        "alfredo",
      ],
      resumen: "Encargado Alfredo Aguiar. Ante una emergencia, llamá al 3743-614457.",
      detalleHtml:
        "<p><strong>Encargado:</strong> Alfredo Aguiar</p>" +
        "<p><strong>Teléfono de emergencia:</strong> 3743-614457</p>" +
        "<p>Si hay riesgo inmediato, lo más rápido es <strong>llamar</strong>. También podés escribir por WhatsApp.</p>" +
        '<p><a class="muni-btn muni-btn--emergencia" href="tel:+543743614457">Llamar 3743-614457</a></p>',
      enlaces: [
        { titulo: "Llamar ahora", url: "tel:+543743614457" },
        {
          titulo: "WhatsApp Defensa Civil",
          url: "https://wa.me/543743614457?text=" + encodeURIComponent("Hola, necesito contactar a Defensa Civil por una emergencia."),
          externo: true,
        },
        { titulo: "Ir al área Defensa Civil", url: "area.html?area=defensa-civil" },
      ],
    },
    {
      id: "turismo-como-llegar",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "Cómo llegar a Jardín América",
      keywords: ["como llegar", "ruta 12", "posadas", "iguazu", "auto", "avion", "colectivo", "distancia"],
      resumen: "Accesos por Ruta 12, distancias desde Posadas e Iguazú, y opciones en colectivo o avión.",
      detalleHtml:
        "<ul>" +
        "<li><strong>En auto:</strong> sobre Ruta Nacional 12. Desde Posadas ~100 km (~1 h 15 min). Desde Puerto Iguazú ~200 km (~2 h 30 min). También conecta con Ruta Provincial 7 hacia Ruta 14.</li>" +
        "<li><strong>En colectivo:</strong> servicios de larga distancia desde Posadas, Iguazú y otras ciudades. Terminal en el centro, frente al Cristo de la Hermandad. Empresas como Río Uruguay y Expreso Singer operan el corredor.</li>" +
        "<li><strong>En avión:</strong> aeropuerto más cercano en Posadas (100 km); también Iguazú (200 km).</li>" +
        "</ul>",
      enlaces: [{ titulo: "Ver web de turismo", url: TURISMO_URL }],
    },
    {
      id: "turismo-boleterias-terminal",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "Teléfonos de boleterías — terminal de ómnibus",
      keywords: [
        "boleteria",
        "boleterias",
        "terminal",
        "omnibus",
        "colectivo",
        "telefono",
        "telefonos",
        "rio uruguay",
        "singer",
        "crucero del norte",
        "20 de junio",
        "via bariloche",
        "pasaje",
        "pasajes",
      ],
      resumen: "Contactos de boleterías en la terminal de Jardín América (08:00 a 20:00).",
      detalleHtml:
        "<p>Terminal de ómnibus (frente al Cristo de la Hermandad). Atención de <strong>08:00 a 20:00 hs</strong>.</p>" +
        "<ul>" +
        '<li><strong>Río Uruguay / Singer:</strong> <a href="https://wa.me/543743455052" target="_blank" rel="noopener noreferrer">3743-455052</a></li>' +
        '<li><strong>Crucero del Norte:</strong> <a href="https://wa.me/543743562277" target="_blank" rel="noopener noreferrer">3743-562277</a></li>' +
        '<li><strong>20 de Junio</strong> (larga distancia): <a href="https://wa.me/543764964177" target="_blank" rel="noopener noreferrer">3764-964177</a></li>' +
        '<li><strong>Vía Bariloche</strong> (larga distancia): <a href="https://wa.me/543743440755" target="_blank" rel="noopener noreferrer">3743-440755</a></li>' +
        "</ul>",
      enlaces: [{ titulo: "Ver colectivos y boleterías en Turismo", url: TURISMO_URL + "#colectivos" }],
    },
    {
      id: "turismo-colectivos-posadas",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "A Posadas — Todos los días",
      keywords: [
        "colectivo",
        "colectivos",
        "omnibus",
        "bondi",
        "posadas",
        "horario",
        "horarios",
        "terminal",
        "kruse",
        "horianski",
        "rio uruguay",
        "crucero",
        "todos los dias",
      ],
      resumen: "Horarios de colectivos desde Jardín América hacia Posadas (igual que en Turismo).",
      detalleHtml:
        "<p>Salidas desde la terminal (frente al Cristo de la Hermandad), <strong>todos los días</strong>. <strong>Sujeto a modificaciones por parte de las empresas.</strong></p>" +
        '<div class="muni-consultas-table-wrap"><table class="muni-consultas-table"><thead><tr><th>Empresa</th><th>Horario</th></tr></thead><tbody>' +
        [
          ["Crucero del Norte", "3:30"],
          ["Kruse", "5:30"],
          ["Horianski", "6:40"],
          ["Crucero del Norte", "6:45"],
          ["El Cometa", "7:30"],
          ["Horianski", "7:45"],
          ["Crucero del Norte", "8:10"],
          ["Oro Verde", "9:20"],
          ["Horianski", "9:50"],
          ["Crucero del Norte", "10:45"],
          ["Horianski", "10:45"],
          ["Crucero del Norte", "11:00"],
          ["Río Uruguay", "11:35"],
          ["Horianski", "12:00"],
          ["Argentinita", "12:30"],
          ["Oro Verde", "12:50"],
          ["Horianski", "13:15"],
          ["Crucero del Norte", "13:45"],
          ["Horianski", "14:30"],
          ["Horianski", "15:00"],
          ["Río Uruguay", "15:50"],
          ["Argentinita", "16:45"],
          ["Crucero del Norte", "16:50"],
          ["Río Uruguay", "17:15"],
          ["El Cometa", "17:30"],
          ["Águila Dorada", "17:40"],
          ["Argentinita", "18:00"],
          ["Kruse", "18:20"],
          ["Crucero del Norte", "18:40"],
          ["Crucero del Norte", "19:00"],
          ["Crucero del Norte", "21:30"]
        ]
          .map(function (r) {
            return (
              "<tr><td>" +
              r[0] +
              "</td><td>" +
              r[1] +
              " hs</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>" +
        "<p><em>Misma información que en la web de Turismo · Terminal de ómnibus · Municipalidad de Jardín América.</em></p>",
      enlaces: [{ titulo: "Ver horarios completos en Turismo", url: TURISMO_URL + "#colectivos" }],
    },
    {
      id: "turismo-colectivos-iguazu",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "A Iguazú — Todos los días",
      keywords: [
        "colectivo",
        "iguazu",
        "puerto iguazu",
        "eldorado",
        "andresito",
        "horario",
        "omnibus",
        "todos los dias",
      ],
      resumen: "Horarios de colectivos desde Jardín América hacia Puerto Iguazú (igual que en Turismo).",
      detalleHtml:
        "<p>Salidas desde la terminal (frente al Cristo de la Hermandad), <strong>todos los días</strong>. <strong>Sujeto a modificaciones por parte de las empresas.</strong></p>" +
        '<div class="muni-consultas-table-wrap"><table class="muni-consultas-table"><thead><tr><th>Empresa</th><th>Horario</th></tr></thead><tbody>' +
        [
          ["Argentinita", "5:00"],
          ["Argentinita", "6:00"],
          ["Horianski", "7:00"],
          ["Río Uruguay", "7:15"],
          ["Crucero del Norte", "8:10"],
          ["Río Uruguay", "9:15"],
          ["Crucero del Norte", "11:45"],
          ["Crucero del Norte", "13:15"],
          ["Crucero del Norte", "15:40"],
          ["Crucero del Norte", "21:55"]
        ]
          .map(function (r) {
            return (
              "<tr><td>" +
              r[0] +
              "</td><td>" +
              r[1] +
              " hs</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>" +
        "<p><em>Misma información que en la web de Turismo · Terminal de ómnibus · Municipalidad de Jardín América.</em></p>",
      enlaces: [{ titulo: "Ver horarios completos en Turismo", url: TURISMO_URL + "#colectivos" }],
    },
    {
      id: "turismo-colectivos-ruta14",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "A localidades de Ruta 14 — Todos los días",
      keywords: [
        "ruta 14",
        "san vicente",
        "aristobulo",
        "san pedro",
        "el soberbio",
        "obera",
        "oberá",
        "colectivo",
        "prox",
        "todos los dias",
      ],
      resumen: "Horarios hacia Oberá, San Vicente, El Soberbio, San Pedro y más (igual que en Turismo).",
      detalleHtml:
        "<p>Salidas desde la terminal (frente al Cristo de la Hermandad), <strong>todos los días</strong>. <strong>Sujeto a modificaciones por parte de las empresas.</strong></p>" +
        '<div class="muni-consultas-table-wrap"><table class="muni-consultas-table"><thead><tr><th>Destino</th><th>Empresa</th><th>Horario</th></tr></thead><tbody>' +
        [
          ["Oberá", "Aristóbulo del Valle", "7:00"],
          ["San Vicente", "Horianski", "7:45"],
          ["El Soberbio", "Crucero del Norte", "11:10"],
          ["San Vicente", "El Cometa", "12:30"],
          ["San Pedro", "Horianski", "13:15"],
          ["Oberá", "Aristóbulo del Valle", "14:00"],
          ["El Soberbio", "Prox", "16:15"],
          ["El Soberbio", "Horianski", "19:15"],
          ["San Pedro", "Horianski", "21:00"]
        ]
          .map(function (r) {
            return (
              "<tr><td>" +
              r[0] +
              "</td><td>" +
              r[1] +
              "</td><td>" +
              r[2] +
              " hs</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>" +
        "<p><em>Misma información que en la web de Turismo · Terminal de ómnibus · Municipalidad de Jardín América.</em></p>",
      enlaces: [{ titulo: "Ver horarios completos en Turismo", url: TURISMO_URL + "#colectivos" }],
    },
{
      id: "turismo-saltos-tabay",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "Saltos del Tabay",
      keywords: ["tabay", "saltos", "cascada", "turismo", "selva", "atractivo"],
      resumen: "Principal atractivo natural de Jardín América, a ~4 km del centro.",
      detalleHtml:
        "<p>Cascadas y pozones en selva paranaense. Ideales para trekking, baños naturales y avistaje de aves. Apto para toda la familia.</p>" +
        "<ul>" +
        "<li>Aproximadamente 4 km del centro</li>" +
        "<li>Aguas de nacientes serranas</li>" +
        "<li>Entorno de selva subtropical nativa</li>" +
        "</ul>",
      enlaces: [{ titulo: "Más info en Turismo", url: TURISMO_URL }],
    },
    {
      id: "turismo-cristo-hermandad",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "Cristo de la Hermandad y terminal de ómnibus",
      keywords: ["cristo", "hermandad", "terminal", "omnibus", "monumento"],
      resumen: "Monumento frente a la terminal de ómnibus, símbolo de ingreso a la ciudad.",
      detalleHtml:
        "<p>Tallado originalmente en madera de timbó; con el pedestal alcanza unos 18 m. Está frente a la terminal de ómnibus, en el centro de Jardín América.</p>",
      enlaces: [{ titulo: "Ver en Turismo", url: TURISMO_URL }],
    },
    {
      id: "reportar-problema",
      categoria: "tramite",
      titulo: "Reportar un problema en el barrio",
      keywords: ["reportar", "basura", "alcantarilla", "arbol", "luminaria", "bache", "problema"],
      resumen: "Aviso municipal por basureros, alcantarillas, árboles caídos, luminarias, etc.",
      detalleHtml:
        "<p>Podés enviar un reporte desde el portal con ubicación, barrio y descripción. El equipo municipal lo recibe para seguimiento.</p>",
      enlaces: [{ titulo: "Abrir formulario de reporte", url: "reportar-problema.html" }],
    },
  ];

  function stripHtml(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function phoneDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function toIntlPhone(value) {
    var d = phoneDigits(value);
    if (!d) return "";
    if (d.indexOf("54") === 0) return d;
    return "54" + d;
  }

  function whatsappAreaUrl(telefono, areaNombre) {
    var intl = toIntlPhone(telefono);
    if (!intl) return "";
    return (
      "https://wa.me/" +
      intl +
      "?text=" +
      encodeURIComponent("Hola, quiero consultar al área de " + (areaNombre || "la Municipalidad") + ".")
    );
  }

  function contactosBySlug() {
    var map = {};
    (window.MUNI_CONTACTOS || []).forEach(function (item) {
      if (item && item.slug) map[item.slug] = item;
    });
    return map;
  }

  function buildFromContactos() {
    var list = window.MUNI_CONTACTOS || [];
    if (!list.length) return [];

    var directoryEntry = {
      id: "contactos-por-area-vivo",
      categoria: "contacto",
      titulo: "Teléfonos y WhatsApp de cada área",
      keywords: [
        "contactos",
        "telefonos",
        "whatsapp",
        "areas",
        "numeros",
        "llamar",
        "directorio",
        "guia",
      ],
      resumen: list.length + " áreas con teléfono y WhatsApp directo.",
      detalleHtml:
        "<p>Listado oficial de contactos municipales:</p><ul>" +
        list
          .map(function (item) {
            var wa = whatsappAreaUrl(item.telefono, item.area);
            return (
              "<li><strong>" +
              escapeText(item.area) +
              (item.nota ? " (" + escapeText(item.nota) + ")" : "") +
              ":</strong> " +
              escapeText(item.telefono) +
              (wa
                ? ' · <a href="' +
                  escapeText(wa) +
                  '" target="_blank" rel="noopener noreferrer">WhatsApp</a>'
                : "") +
              "</li>"
            );
          })
          .join("") +
        "</ul>",
      enlaces: [{ titulo: "Abrir listado completo de contactos", url: "contactos.html" }],
      searchText: list
        .map(function (item) {
          return [item.area, item.telefono, item.nota, item.slug].join(" ");
        })
        .join(" "),
    };

    var perArea = list.map(function (item) {
      var wa = whatsappAreaUrl(item.telefono, item.area);
      var tel = toIntlPhone(item.telefono);
      var nota = item.nota ? " (" + item.nota + ")" : "";
      return {
        id: "contacto-wa-" + (item.slug || phoneDigits(item.telefono)),
        categoria: "contacto",
        areaSlug: item.slug || "",
        titulo: "WhatsApp / teléfono — " + item.area + nota,
        keywords: [
          item.area,
          item.slug,
          item.telefono,
          phoneDigits(item.telefono),
          item.nota,
          "whatsapp",
          "telefono",
          "contacto",
          "llamar",
          "numero",
        ].filter(Boolean),
        resumen: item.telefono + (item.nota ? " · " + item.nota : ""),
        detalleHtml:
          "<p><strong>Área:</strong> " +
          escapeText(item.area) +
          "</p>" +
          (item.nota ? "<p><strong>Nota:</strong> " + escapeText(item.nota) + "</p>" : "") +
          "<p><strong>Teléfono:</strong> " +
          escapeText(item.telefono) +
          "</p>" +
          "<p>Podés escribirles por WhatsApp o llamar directamente.</p>",
        enlaces: [
          wa
            ? { titulo: "WhatsApp " + item.area, url: wa, externo: true }
            : null,
          tel ? { titulo: "Llamar " + item.telefono, url: "tel:+" + tel } : null,
          item.slug
            ? {
                titulo: "Ir al área " + item.area,
                url: "area.html?area=" + encodeURIComponent(item.slug),
              }
            : null,
          { titulo: "Ver todos los contactos", url: "contactos.html" },
        ].filter(Boolean),
        searchText: [item.area, item.telefono, item.nota, item.slug, "whatsapp telefono contacto"].join(
          " "
        ),
      };
    });

    return [directoryEntry].concat(perArea);
  }

  function buildFromDocumentos() {
    var catalog = window.MUNI_DOCUMENTOS_CONTENIDO || {};
    var docsMeta = {
      "leyes-loteo-arroyos-bosques": {
        titulo: "Leyes y ordenanzas — Loteo en arroyos y bosques",
        keywords: ["loteo", "arroyo", "bosque", "humedal", "agrimensor", "impacto ambiental", "ecologia"],
        areaSlug: "obras-privadas",
        url: "assets/documentos/leyes-ordenanzas-loteo-arroyos-y-bosques.pdf",
        areaUrl: "area.html?area=obras-privadas#doc-leyes-loteo-arroyos-bosques",
      },
      "requisitos-presentar-planos-2026": {
        titulo: "Requisitos para presentar planos (2026)",
        keywords: [
          "planos",
          "previa",
          "definitiva",
          "expediente",
          "arquitectura",
          "estructuras",
          "pluvial",
          "electrica",
          "legajo",
        ],
        areaSlug: "obras-privadas",
        url: "assets/documentos/requisitos-presentar-planos-2026.pdf",
        areaUrl: "area.html?area=obras-privadas#doc-requisitos-presentar-planos-2026",
      },
      "manual-tramites-obras-privadas": {
        titulo: "Manual de trámites — Obras Privadas",
        keywords: [
          "tramite",
          "tramites",
          "permiso",
          "obra",
          "inspeccion",
          "suelo",
          "baldio",
          "desague",
          "clausura",
          "catastro",
        ],
        areaSlug: "obras-privadas",
        url: "assets/documentos/manual-tramites-obras-privadas.pdf",
        areaUrl: "area.html?area=obras-privadas#doc-manual-tramites-obras-privadas",
      },
    };

    return Object.keys(docsMeta).map(function (id) {
      var meta = docsMeta[id];
      var content = catalog[id] || {};
      var html = content.html || "<p>Consultá el documento completo en el área municipal.</p>";
      return {
        id: "doc-" + id,
        categoria: "tramite",
        areaSlug: meta.areaSlug,
        titulo: meta.titulo,
        keywords: meta.keywords,
        resumen: stripHtml(html).slice(0, 180) + "…",
        detalleHtml: html,
        enlaces: [
          { titulo: "Ver en el área municipal", url: meta.areaUrl },
          { titulo: "Descargar PDF", url: meta.url },
        ],
        searchText: stripHtml(html),
      };
    });
  }

  function buildFromAreas() {
    var contacts = contactosBySlug();
    var areas = window.MUNI_FIREBASE_SEED_AREAS || [];
    return areas
      .filter(function (a) {
        if (!a || a.activa === false) return false;
        var phone = (contacts[a.slug] && contacts[a.slug].telefono) || a.contacto || "";
        var hasPhone = /\d{6,}/.test(String(phone));
        var hasResponsable = a.responsable && a.responsable !== "A definir";
        return hasResponsable || hasPhone;
      })
      .map(function (a) {
        var contact = contacts[a.slug];
        var phone = (contact && contact.telefono) || a.contacto || "";
        var wa = /\d{6,}/.test(String(phone)) ? whatsappAreaUrl(phone, a.nombre) : "";
        var tel = toIntlPhone(phone);
        return {
          id: "area-" + a.slug,
          categoria: "area",
          areaSlug: a.slug,
          titulo: "Área municipal — " + a.nombre,
          keywords: [a.nombre, a.slug.replace(/-/g, " "), a.responsable, phone, contact && contact.nota]
            .concat(
              String(phone || "")
                .split(/[·,]/)
                .map(function (x) {
                  return x.trim();
                })
            )
            .filter(Boolean),
          resumen: a.descripcion || (phone ? "Contacto: " + phone : ""),
          detalleHtml:
            "<p>" +
            escapeText(a.descripcion || "") +
            "</p>" +
            (a.responsable && a.responsable !== "A definir"
              ? "<p><strong>Responsable:</strong> " + escapeText(a.responsable) + "</p>"
              : "") +
            (phone ? "<p><strong>Contacto:</strong> " + escapeText(phone) + "</p>" : "") +
            (contact && contact.nota
              ? "<p><strong>Nota:</strong> " + escapeText(contact.nota) + "</p>"
              : ""),
          enlaces: [
            { titulo: "Ir al área " + a.nombre, url: "area.html?area=" + encodeURIComponent(a.slug) },
            wa ? { titulo: "WhatsApp " + a.nombre, url: wa, externo: true } : null,
            tel ? { titulo: "Llamar " + phone, url: "tel:+" + tel } : null,
            { titulo: "Ver todos los contactos", url: "contactos.html" },
          ].filter(Boolean),
        };
      });
  }

  var liveObras = {
    status: "idle",
    at: 0,
    promise: null,
  };

  var LIVE_CACHE_MS = 2 * 60 * 1000;
  var OBRAS_PUBLICAS_SLUG = "obras-publicas";

  function escapeText(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stripHtmlLite(html) {
    return String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function noticiaLink(n) {
    if (window.MuniPortal && window.MuniPortal.noticiaUrl) {
      return window.MuniPortal.noticiaUrl(n);
    }
    return "noticia.html?id=" + encodeURIComponent(n.id || n.slug || "");
  }

  function getObrasPublicasEnCurso() {
    var noticias = [];
    if (window.MuniPortal && window.MuniPortal.getNoticiasByArea) {
      noticias = window.MuniPortal.getNoticiasByArea(OBRAS_PUBLICAS_SLUG) || [];
    } else {
      noticias =
        (window.MuniPortal && window.MuniPortal.DATA && window.MuniPortal.DATA.noticias) || [];
      noticias = noticias.filter(function (n) {
        return n.areaSlug === OBRAS_PUBLICAS_SLUG ||
          (Array.isArray(n.areaSlugs) && n.areaSlugs.indexOf(OBRAS_PUBLICAS_SLUG) !== -1);
      });
    }
    return noticias.filter(function (n) {
      return n && n.estadoObra === "en_curso";
    });
  }

  function buildObrasEnCursoEntries() {
    var obras = getObrasPublicasEnCurso();
    var entries = [];

    if (liveObras.status === "loading" && !obras.length) {
      entries.push({
        id: "obras-en-curso-resumen",
        categoria: "obras",
        areaSlug: OBRAS_PUBLICAS_SLUG,
        titulo: "Obras en curso (actualizando…)",
        keywords: ["obras", "obra", "en curso", "obras publicas", "trabajos", "novedades"],
        resumen: "Estoy consultando las novedades de Obras Públicas…",
        detalleHtml:
          "<p>Dame un segundo: estoy cargando las novedades de <strong>Obras Públicas</strong> con estado <strong>en curso</strong>.</p>",
        enlaces: [{ titulo: "Ir a Obras Públicas", url: "area.html?area=obras-publicas" }],
      });
      return entries;
    }

    var listHtml = "";
    if (obras.length) {
      listHtml =
        "<ul>" +
        obras
          .slice(0, 20)
          .map(function (n) {
            var meta = [];
            if (n.barrio) meta.push(escapeText(n.barrio));
            if (n.ubicacion) meta.push(escapeText(n.ubicacion));
            return (
              "<li><strong><a href=\"" +
              escapeText(noticiaLink(n)) +
              "\">" +
              escapeText(n.titulo || "Obra sin título") +
              "</a></strong>" +
              (meta.length ? " — " + meta.join(" · ") : "") +
              (n.bajada
                ? "<br><span>" +
                  escapeText(String(n.bajada).slice(0, 160)) +
                  (String(n.bajada).length > 160 ? "…" : "") +
                  "</span>"
                : "") +
              "</li>"
            );
          })
          .join("") +
        "</ul>";
    } else {
      listHtml =
        "<p>En este momento no hay novedades de <strong>Obras Públicas</strong> con estado <strong>en curso</strong>.</p>";
    }

    entries.push({
      id: "obras-en-curso-resumen",
      categoria: "obras",
      areaSlug: OBRAS_PUBLICAS_SLUG,
      titulo: "Obras en curso",
      keywords: [
        "obras",
        "obra",
        "en curso",
        "obras publicas",
        "trabajos",
        "novedades",
        "pavimento",
        "calle",
        "resumen",
      ],
      resumen:
        (obras.length
          ? obras.length === 1
            ? "1 novedad de Obras Públicas en curso."
            : obras.length + " novedades de Obras Públicas en curso."
          : "Sin novedades de Obras Públicas en curso ahora.") +
        " Actualizado al momento de la búsqueda.",
      detalleHtml:
        "<p>Novedades del área <strong>Obras Públicas</strong> con estado <strong>en curso</strong>.</p>" +
        listHtml +
        "<p><em>Actualizado al momento de la búsqueda.</em></p>",
      enlaces: [
        { titulo: "Ver área Obras Públicas", url: "area.html?area=obras-publicas" },
      ],
      searchText: obras
        .map(function (n) {
          return [n.titulo, n.bajada, n.barrio, n.ubicacion, stripHtmlLite(n.cuerpo)].join(" ");
        })
        .join(" "),
    });

    obras.forEach(function (n) {
      entries.push({
        id: "obra-novedad-" + (n.id || n.slug),
        categoria: "obras",
        areaSlug: OBRAS_PUBLICAS_SLUG,
        titulo: "Obra en curso — " + (n.titulo || "Sin título"),
        keywords: ["obra", "obras", "en curso", "obras publicas", n.titulo, n.barrio, n.ubicacion].filter(
          Boolean
        ),
        resumen:
          [n.barrio, n.ubicacion].filter(Boolean).join(" · ") ||
          n.bajada ||
          "Novedad de Obras Públicas",
        detalleHtml:
          "<p><strong>Estado:</strong> En curso</p>" +
          "<p><strong>Área:</strong> Obras Públicas</p>" +
          (n.barrio ? "<p><strong>Barrio:</strong> " + escapeText(n.barrio) + "</p>" : "") +
          (n.ubicacion ? "<p><strong>Ubicación:</strong> " + escapeText(n.ubicacion) + "</p>" : "") +
          (n.bajada ? "<p>" + escapeText(n.bajada) + "</p>" : "") +
          (n.cuerpo ? "<div>" + n.cuerpo + "</div>" : ""),
        enlaces: [
          { titulo: "Ver novedad completa", url: noticiaLink(n) },
          { titulo: "Ver área Obras Públicas", url: "area.html?area=obras-publicas" },
        ],
        searchText: [n.titulo, n.bajada, n.barrio, n.ubicacion, stripHtmlLite(n.cuerpo)].join(" "),
      });
    });

    return entries;
  }

  async function refreshLiveObras(force) {
    var now = Date.now();
    if (!force && liveObras.status === "ready" && now - liveObras.at < LIVE_CACHE_MS) {
      return getObrasPublicasEnCurso();
    }
    if (liveObras.promise) return liveObras.promise;

    liveObras.status = "loading";
    liveObras.promise = (async function () {
      try {
        // Asegurar novedades del portal (incluye Obras Públicas)
        if (window.MuniPortal && window.MuniPortal.bootstrapPublicData) {
          var hasNoticias =
            window.MuniPortal.DATA &&
            Array.isArray(window.MuniPortal.DATA.noticias) &&
            window.MuniPortal.DATA.noticias.length;
          if (!hasNoticias || force) {
            var payload = await window.MuniPortal.bootstrapPublicData();
            if (payload && window.MuniPortal.setData) {
              window.MuniPortal.setData(payload);
            }
          }
        } else if (window.MuniApi && window.MuniApi.loadTrabajosPublic) {
          var trabajos = await window.MuniApi.loadTrabajosPublic();
          if (window.MuniPortal && window.MuniPortal.setData) {
            window.MuniPortal.setData({
              areas: (window.MuniPortal.DATA && window.MuniPortal.DATA.areas) || [],
              noticias: trabajos || [],
              eventosFlyers: (window.MuniPortal.DATA && window.MuniPortal.DATA.eventosFlyers) || [],
            });
          }
        }

        liveObras.at = Date.now();
        liveObras.status = "ready";
        return getObrasPublicasEnCurso();
      } catch (err) {
        console.warn("AmiBot obras en curso", err);
        liveObras.status = "error";
        liveObras.at = Date.now();
        return getObrasPublicasEnCurso();
      } finally {
        liveObras.promise = null;
      }
    })();

    return liveObras.promise;
  }

  function getEntries() {
    return STATIC_ENTRIES.concat(buildFromDocumentos())
      .concat(buildFromAreas())
      .concat(buildFromContactos())
      .concat(buildObrasEnCursoEntries());
  }

  window.MuniConsultasKnowledge = {
    turismoUrl: TURISMO_URL,
    getEntries: getEntries,
    refreshLiveObras: refreshLiveObras,
    getLiveObrasStatus: function () {
      return liveObras.status;
    },
  };
})();
