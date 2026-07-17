/**
 * Base de consultas municipales (sin IA, sin costo de API).
 * Incluye trámites del portal + info turística / colectivos.
 */
(function () {
  "use strict";

  var TURISMO_URL = "https://enzomantay-del.github.io/jardin-america-turismo/";

  var STATIC_ENTRIES = [
    {
      id: "contacto-municipal",
      categoria: "contacto",
      titulo: "Contacto y horario de la Municipalidad",
      keywords: ["contacto", "horario", "atencion", "whatsapp", "direccion", "municipalidad", "telefono"],
      resumen: "Dirección, WhatsApp y horario de atención al vecino.",
      detalleHtml:
        "<ul>" +
        "<li><strong>Dirección:</strong> Av. Belgrano 666 · Jardín América, Misiones</li>" +
        "<li><strong>WhatsApp:</strong> 3743-509860</li>" +
        "<li><strong>Horario:</strong> lunes a viernes, 7:00 a 13:00 hs</li>" +
        "</ul>",
      enlaces: [{ titulo: "Ir al contacto en el portal", url: "index.html#contacto" }],
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
        "<p><strong>Contacto:</strong> 3794 358121</p>" +
        "<p>Consultas sobre planos, permisos de obra, inspecciones y habilitación.</p>",
      enlaces: [
        { titulo: "Ir al área Obras Privadas", url: "area.html?area=obras-privadas" },
        { titulo: "Ver documentos del área", url: "area.html?area=obras-privadas#documentos" },
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
      enlaces: [{ titulo: "Ver web de turismo", url: TURISMO_URL, externo: true }],
    },
    {
      id: "turismo-colectivos-posadas",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "Horarios de colectivos a Posadas (lun–vie)",
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
      ],
      resumen: "Salidas lunes a viernes desde Jardín América hacia Posadas (orientativo).",
      detalleHtml:
        "<p>Salidas desde la terminal (frente al Cristo de la Hermandad). Horarios <strong>orientativos</strong>: confirmá en terminal o con la empresa.</p>" +
        '<div class="muni-consultas-table-wrap"><table class="muni-consultas-table"><thead><tr><th>Destino</th><th>Empresa</th><th>Horario</th><th>Notas</th></tr></thead><tbody>' +
        [
          ["Posadas", "Kruse", "5:30", ""],
          ["Posadas", "Horianski", "6:40", ""],
          ["Posadas", "El Cometa", "7:30", ""],
          ["Posadas", "Horianski", "7:45", ""],
          ["Posadas", "Crucero del Norte", "8:15", ""],
          ["Posadas", "Oro Verde", "9:20", ""],
          ["Posadas", "Horianski", "9:50", ""],
          ["Posadas", "Crucero del Norte", "10:45", ""],
          ["Posadas", "Horianski", "10:45", ""],
          ["Posadas", "Crucero del Norte", "11:00", ""],
          ["Posadas", "Río Uruguay", "11:35", ""],
          ["Posadas", "Horianski", "12:00", ""],
          ["Posadas", "Argentinita", "12:30", ""],
          ["Posadas", "Oro Verde", "12:50", ""],
          ["Posadas", "Horianski", "13:15", ""],
          ["Posadas", "Crucero del Norte", "13:40", ""],
          ["Posadas", "Horianski", "14:30", ""],
          ["Posadas", "Horianski", "15:00", ""],
          ["Posadas", "Río Uruguay", "15:50", ""],
          ["Posadas", "Argentinita", "16:45", ""],
          ["Posadas", "Crucero del Norte", "16:50", ""],
          ["Posadas", "Río Uruguay", "17:15", ""],
          ["Posadas", "El Cometa", "17:30", ""],
          ["Posadas", "Águila Dorada", "17:40", ""],
          ["Posadas", "Argentinita", "18:00", ""],
          ["Posadas", "Kruse", "18:20", ""],
        ]
          .map(function (r) {
            return (
              "<tr><td>" +
              r[0] +
              "</td><td>" +
              r[1] +
              "</td><td>" +
              r[2] +
              " hs</td><td>" +
              (r[3] || "—") +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>" +
        "<p><em>Fuente: Municipalidad de Jardín América · Web de Turismo.</em></p>",
      enlaces: [{ titulo: "Ver horarios completos en Turismo", url: TURISMO_URL + "#colectivos", externo: true }],
    },
    {
      id: "turismo-colectivos-iguazu",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "Horarios de colectivos a Iguazú (lun–vie)",
      keywords: ["colectivo", "iguazu", "puerto iguazu", "eldorado", "andresito", "horario", "omnibus"],
      resumen: "Salidas lunes a viernes desde Jardín América hacia Puerto Iguazú (orientativo).",
      detalleHtml:
        "<p>Salidas desde la terminal (frente al Cristo de la Hermandad). Horarios <strong>orientativos</strong>: confirmá en terminal o con la empresa.</p>" +
        '<div class="muni-consultas-table-wrap"><table class="muni-consultas-table"><thead><tr><th>Destino</th><th>Empresa</th><th>Horario</th><th>Notas</th></tr></thead><tbody>' +
        [
          ["Puerto Iguazú", "Argentinita", "5:00", ""],
          ["Puerto Iguazú", "Argentinita", "6:00", ""],
          ["Puerto Iguazú", "Horianski", "7:00", ""],
          ["Puerto Iguazú", "Río Uruguay", "7:15", ""],
          ["Puerto Iguazú", "Crucero del Norte", "8:15", ""],
          ["Puerto Iguazú", "Río Uruguay", "9:15", ""],
          ["Puerto Iguazú", "Crucero del Norte", "9:40", "Hasta Eldorado; por Ruta 17 a B. de Irigoyen"],
          ["Puerto Iguazú", "Argentinita", "10:00", ""],
          ["Puerto Iguazú", "Horianski", "10:00", ""],
          ["Puerto Iguazú", "Río Uruguay", "11:00", ""],
          ["Puerto Iguazú", "Crucero del Norte", "11:20", ""],
          ["Puerto Iguazú", "Argentinita", "11:30", ""],
          ["Puerto Iguazú", "Crucero del Norte", "11:50", ""],
          ["Puerto Iguazú", "Río Uruguay", "12:40", ""],
          ["Puerto Iguazú", "Crucero del Norte", "13:15", ""],
          ["Puerto Iguazú", "Horianski", "13:20", ""],
          ["Puerto Iguazú", "Horianski", "15:00", ""],
          ["Andresito", "Kruse", "15:00", "Directo"],
          ["Puerto Iguazú", "El Cometa", "16:00", ""],
          ["Puerto Iguazú", "Horianski", "16:30", ""],
          ["Puerto Iguazú", "Argentinita", "17:00", ""],
          ["San Antonio", "Crucero del Norte", "17:20", "Directo"],
        ]
          .map(function (r) {
            return (
              "<tr><td>" +
              r[0] +
              "</td><td>" +
              r[1] +
              "</td><td>" +
              r[2] +
              " hs</td><td>" +
              (r[3] || "—") +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>" +
        "<p><em>Fuente: Municipalidad de Jardín América · Web de Turismo.</em></p>",
      enlaces: [{ titulo: "Ver horarios completos en Turismo", url: TURISMO_URL + "#colectivos", externo: true }],
    },
    {
      id: "turismo-colectivos-ruta14",
      categoria: "turismo",
      areaSlug: "turismo",
      titulo: "Horarios de colectivos por Ruta 14 (lun–vie)",
      keywords: ["ruta 14", "san vicente", "aristobulo", "25 de mayo", "el soberbio", "colectivo", "oberá"],
      resumen: "Salidas lunes a viernes desde Jardín América hacia localidades por Ruta 14 (orientativo).",
      detalleHtml:
        "<p>Salidas desde la terminal (frente al Cristo de la Hermandad). Horarios <strong>orientativos</strong>: confirmá en terminal o con la empresa.</p>" +
        '<div class="muni-consultas-table-wrap"><table class="muni-consultas-table"><thead><tr><th>Destino</th><th>Empresa</th><th>Horario</th><th>Notas</th></tr></thead><tbody>' +
        [
          ["San Vicente", "Horianski", "8:00", ""],
          ["A. del Valle", "El Misionero", "9:30", ""],
          ["25 de Mayo", "Horianski", "10:30", ""],
          ["San Vicente", "Horianski", "11:15", ""],
          ["A. del Valle", "El Cometa", "12:30", ""],
          ["25 de Mayo", "Horianski", "13:15", ""],
          ["El Soberbio", "El Cometa", "16:15", ""],
          ["A. del Valle", "Horianski", "17:00", ""],
          ["San Vicente", "Horianski", "19:15", ""],
        ]
          .map(function (r) {
            return (
              "<tr><td>" +
              r[0] +
              "</td><td>" +
              r[1] +
              "</td><td>" +
              r[2] +
              " hs</td><td>" +
              (r[3] || "—") +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>" +
        "<p><em>Fuente: Municipalidad de Jardín América · Web de Turismo.</em></p>",
      enlaces: [{ titulo: "Ver horarios completos en Turismo", url: TURISMO_URL + "#colectivos", externo: true }],
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
      enlaces: [{ titulo: "Más info en Turismo", url: TURISMO_URL, externo: true }],
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
      enlaces: [{ titulo: "Ver en Turismo", url: TURISMO_URL, externo: true }],
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
    var areas = window.MUNI_FIREBASE_SEED_AREAS || [];
    return areas
      .filter(function (a) {
        return a && a.activa !== false && a.responsable && a.responsable !== "A definir";
      })
      .map(function (a) {
        return {
          id: "area-" + a.slug,
          categoria: "area",
          areaSlug: a.slug,
          titulo: "Área municipal — " + a.nombre,
          keywords: [a.nombre, a.slug.replace(/-/g, " "), a.responsable].concat(
            (a.contacto || "").split(/[·,]/).map(function (x) {
              return x.trim();
            })
          ),
          resumen: a.descripcion || "",
          detalleHtml:
            "<p>" +
            (a.descripcion || "") +
            "</p>" +
            "<p><strong>Responsable:</strong> " +
            a.responsable +
            "</p>" +
            (a.contacto ? "<p><strong>Contacto:</strong> " + a.contacto + "</p>" : ""),
          enlaces: [{ titulo: "Ir al área " + a.nombre, url: "area.html?area=" + encodeURIComponent(a.slug) }],
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
        return n.areaSlug === OBRAS_PUBLICAS_SLUG;
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
