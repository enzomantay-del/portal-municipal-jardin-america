/**
 * Mejoras turismo — versión corregida.
 * - No satura el menú (idiomas fuera del nav)
 * - Traduce contenidos reales (ES / PT / EN)
 * - Portal = portal municipal propio
 * - Sin WhatsApp/teléfono de Turismo (aún no hay número)
 */
(function () {
  "use strict";

  // Mismo dominio (jardinamerica.gob.ar) o fallback al portal en GitHub Pages
  var PORTAL_URL = (function () {
    try {
      if (/jardinamerica\.gob\.ar$/i.test(window.location.hostname)) return "/";
      if (/github\.io$/i.test(window.location.hostname) && /\/turismo\/?/i.test(window.location.pathname)) {
        return "/portal-municipal-jardin-america/";
      }
    } catch (_e) {}
    return "/";
  })();
  var PORTAL_TURISMO = PORTAL_URL + "area.html?area=turismo";

  var GASTRO_REAL = [
    {
      n: "Complejo Turístico Baden Baden",
      tipo: "Restaurante / complejo",
      em: "🍽️",
      d: "Ruta Nacional 12, Jardín América",
      telHref: "tel:+543743482083",
      telDisplay: "(03743) 482-083",
      wa: "https://wa.me/543743482083",
      hor: "Consultar disponibilidad · pileta, quinchos y restaurante",
      maps: "https://www.google.com/maps/search/Complejo+Baden+Baden+Jardín+América",
    },
    {
      n: "Paraíso Lodge",
      tipo: "Lodge / restaurante",
      em: "🏡",
      d: "Ruta 12 km 1445, Arroyo Tabay — a ~4 km del centro",
      telHref: "tel:+5491123668814",
      telDisplay: "(011) 2366-8814",
      wa: "https://wa.me/5491123668814",
      hor: "Desayuno incluido · acceso peatonal a los Saltos (~25 min)",
      maps: "https://www.google.com/maps/search/Paraíso+Lodge+Jardín+América",
    },
    {
      n: "Complejo Natural Ysirý",
      tipo: "Complejo / cantina",
      em: "🌿",
      d: "Jardín América, Misiones",
      telHref: "tel:+5493743410273",
      telDisplay: "(03743) 15-410273",
      wa: "https://wa.me/5493743410273",
      hor: "Todos los días desde las 8 hs · piscinas y camping",
      maps: "https://www.google.com/maps/search/Complejo+Natural+Ysirý+Jardín+América",
    },
    {
      n: "Cooperativa Flor de Jardín",
      tipo: "Productos regionales",
      em: "🧉",
      d: "Ruta Nacional 12, Jardín América",
      telHref: "https://flordejardin.com.ar/",
      telDisplay: "flordejardin.com.ar",
      web: "https://flordejardin.com.ar/",
      hor: "Yerba, encurtidos, dulces y fécula a precio de origen",
      maps: "https://www.google.com/maps/search/Cooperativa+Flor+de+Jardín+Jardín+América",
    },
    {
      n: "Saltos del Tabay — predio",
      tipo: "Naturaleza / parador",
      em: "🌊",
      d: "A ~4 km del centro, Jardín América",
      telHref: "tel:+5493743400421",
      telDisplay: "(03743) 400-421",
      wa: "https://wa.me/5493743400421?text=" + encodeURIComponent("Hola! Consulto por los Saltos del Tabay."),
      hor: "Ver tarifas y dormis en la ficha del atractivo",
      maps: "https://www.google.com/maps/search/Saltos+del+Tabay+Jardín+América+Misiones",
    },
  ];

  var UI = {
    es: {
      quickKicker: "Empezá acá",
      quickTitle: "¿Qué necesitás hoy?",
      q1t: "Saltos del Tabay",
      q1d: "Atractivo principal, tarifas y ubicación",
      q2t: "Cómo llegar",
      q2d: "Auto, colectivo y avión",
      q3t: "Colectivos",
      q3d: "Horarios a Posadas, Iguazú y Ruta 14",
      q4t: "Dónde dormir",
      q4d: "Alojamientos registrados",
      colecLead: "Filtrá por destino o buscá una empresa. Horarios orientativos (todos los días).",
      colecNext: "Próximos de hoy (aprox.):",
      colecNone: "No hay más salidas listadas para el resto del día.",
      colecBolecTitle: "Boleterías en la terminal",
      colecBolecHours: "Atención: 08:00 a 20:00 hs.",
      festLink: "Ver agenda de eventos →",
      gastroOk: "Paradas del circuito turístico con contacto directo. Confirmá siempre horarios.",
      olalaTitle: "Paquetes y tours receptivos",
      olalaText:
        "Olalá Viajes es la agencia habilitada en Jardín América para la venta de paquetes turísticos. Consultá tours por Misiones y Esteros del Iberá.",
      olalaCta: "Ver paquetes receptivos",
      portal: "Portal municipal",
      folleto: "Folleto",
      langAria: "Idioma del sitio",
      navInicio: "Inicio",
      navLocal: "Qué visitar aquí",
      navProv: "Qué visitar desde aquí",
      navFest: "Festividades",
      navEv: "Eventos",
      navPromo: "Promociones",
      navInfo: "Información útil",
      heroBadge: "✦ Misiones · Argentina",
      heroCta1: "Saltos del Tabay",
      heroCta2: "Cómo llegar",
      "p-hero-desc":
        "En el corazón de la selva misionera, donde la naturaleza cobra vida en cada rincón. Cascadas, selva virgen y una biodiversidad única en el mundo te esperan.",
      "p-tabay-1":
        "El gran tesoro natural de Jardín América. Los Saltos del Tabay son una serie de cascadas y pozones escalonados en plena selva paranaense, donde el agua cae sobre rocas basálticas cubiertas de una vegetación exuberante.",
      "p-tabay-2":
        "Un destino imperdible para los amantes de la naturaleza, el trekking y la fotografía. El entorno natural prácticamente intacto convierte a este lugar en una experiencia única, con sonidos de aves, el rumor del agua y el aroma de la selva húmeda.",
      "p-auto":
        "Jardín América se encuentra sobre la Ruta Nacional 12, la principal vía de conexión entre Posadas y Puerto Iguazú. Desde Posadas: 100 km hacia el norte (~1 h 15 min). Desde Puerto Iguazú: 200 km hacia el sur (~2 h 30 min). La ruta está completamente pavimentada y en buen estado. Además, la Ruta Provincial N° 7 conecta el centro urbano con la Ruta Nacional 14 —el corredor que une Misiones con Corrientes y el resto del país por el este—, lo que convierte a Jardín América en un nodo de acceso desde ambas rutas nacionales.",
      "p-colectivo":
        "Hay servicios de larga distancia que pasan por Jardín América desde Posadas, Puerto Iguazú y otras ciudades de Misiones. La terminal de ómnibus se encuentra en el centro de la ciudad, frente al Cristo de la Hermandad. Empresas como Río Uruguay y Expreso Singer operan en este corredor.",
      "p-avion":
        "El aeropuerto más cercano es el Aeropuerto Internacional Libertador Gral. San Martín de Posadas (100 km), con vuelos diarios desde Buenos Aires. También puede usarse el Aeropuerto Internacional de Iguazú (200 km).",
    },
    pt: {
      quickKicker: "Comece aqui",
      quickTitle: "O que você precisa hoje?",
      q1t: "Saltos del Tabay",
      q1d: "Atração principal, tarifas e localização",
      q2t: "Como chegar",
      q2d: "Carro, ônibus e avião",
      q3t: "Ônibus",
      q3d: "Horários para Posadas, Iguaçu e Rota 14",
      q4t: "Onde dormir",
      q4d: "Hospedagens registradas",
      colecLead: "Filtre por destino ou busque uma empresa. Horários orientativos (todos os dias).",
      colecNext: "Próximos de hoje (aprox.):",
      colecNone: "Não há mais saídas listadas para o resto do dia.",
      colecBolecTitle: "Bilheterias na rodoviária",
      colecBolecHours: "Atendimento: 08:00 às 20:00.",
      festLink: "Ver agenda de eventos →",
      gastroOk: "Paradas do circuito turístico com contato direto. Confirme sempre os horários.",
      olalaTitle: "Pacotes e tours receptivos",
      olalaText:
        "Olalá Viajes é a agência habilitada em Jardín América para a venda de pacotes turísticos. Consulte tours por Missões e Esteros del Iberá.",
      olalaCta: "Ver pacotes receptivos",
      portal: "Portal municipal",
      folleto: "Folheto",
      langAria: "Idioma do site",
      navInicio: "Início",
      navLocal: "O que visitar aqui",
      navProv: "O que visitar daqui",
      navFest: "Festividades",
      navEv: "Eventos",
      navPromo: "Promoções",
      navInfo: "Informação útil",
      heroBadge: "✦ Missões · Argentina",
      heroCta1: "Saltos del Tabay",
      heroCta2: "Como chegar",
      "p-hero-desc":
        "No coração da selva missioneira, onde a natureza ganha vida em cada canto. Cachoeiras, selva virgem e uma biodiversidade única no mundo esperam por você.",
      "p-tabay-1":
        "O grande tesouro natural de Jardín América. Os Saltos del Tabay são uma série de cachoeiras e poços escalonados em plena selva paranense, onde a água cai sobre rochas basálticas cobertas de vegetação exuberante.",
      "p-tabay-2":
        "Destino imperdível para amantes da natureza, trekking e fotografia. O entorno praticamente intacto torna o lugar uma experiência única, com sons de aves, o rumor da água e o aroma da selva úmida.",
      "p-auto":
        "Jardín América fica sobre a Rota Nacional 12, a principal via entre Posadas e Puerto Iguazú. De Posadas: 100 km ao norte (~1 h 15 min). De Puerto Iguazú: 200 km ao sul (~2 h 30 min). A rota é pavimentada. A Rota Provincial nº 7 também conecta com a Rota Nacional 14.",
      "p-colectivo":
        "Há ônibus de longa distância desde Posadas, Puerto Iguazú e outras cidades. A rodoviária fica no centro, em frente ao Cristo de la Hermandad. Empresas como Río Uruguay e Expreso Singer operam no corredor.",
      "p-avion":
        "O aeroporto mais próximo é o de Posadas (100 km), com voos diários desde Buenos Aires. Também pode usar o Aeroporto Internacional de Iguaçu (200 km).",
    },
    en: {
      quickKicker: "Start here",
      quickTitle: "What do you need today?",
      q1t: "Saltos del Tabay",
      q1d: "Main attraction, fees and location",
      q2t: "How to get here",
      q2d: "Car, bus and plane",
      q3t: "Buses",
      q3d: "Schedules to Posadas, Iguazú and Route 14",
      q4t: "Where to stay",
      q4d: "Registered lodging",
      colecLead: "Filter by destination or search a company. Schedules are approximate (every day).",
      colecNext: "Next departures today (approx.):",
      colecNone: "No more listed departures for the rest of the day.",
      colecBolecTitle: "Ticket offices at the bus terminal",
      colecBolecHours: "Open: 8:00 AM to 8:00 PM.",
      festLink: "See events agenda →",
      gastroOk: "Tourism-circuit stops with direct contact. Always confirm opening hours.",
      olalaTitle: "Packages and inbound tours",
      olalaText:
        "Olalá Viajes is the licensed agency in Jardín América for tour package sales. Browse tours around Misiones and the Iberá Wetlands.",
      olalaCta: "View inbound packages",
      portal: "Municipal portal",
      folleto: "Brochure",
      langAria: "Site language",
      navInicio: "Home",
      navLocal: "Visit here",
      navProv: "Visit from here",
      navFest: "Festivals",
      navEv: "Events",
      navPromo: "Deals",
      navInfo: "Useful info",
      heroBadge: "✦ Misiones · Argentina",
      heroCta1: "Saltos del Tabay",
      heroCta2: "How to get here",
      "p-hero-desc":
        "In the heart of the Misiones rainforest, where nature comes alive in every corner. Waterfalls, virgin jungle and unique biodiversity await you.",
      "p-tabay-1":
        "Jardín América’s natural treasure. The Saltos del Tabay are stepped waterfalls and pools in the Paranaense rainforest, cascading over basalt rocks covered in lush vegetation.",
      "p-tabay-2":
        "A must for nature lovers, trekking and photography. The nearly untouched surroundings make it a unique experience—birdsong, rushing water and the scent of the humid forest.",
      "p-auto":
        "Jardín América sits on National Route 12 between Posadas and Puerto Iguazú. From Posadas: 100 km north (~1 h 15 min). From Puerto Iguazú: 200 km south (~2 h 30 min). Fully paved. Provincial Route 7 also links to National Route 14.",
      "p-colectivo":
        "Long-distance buses stop in Jardín América from Posadas, Puerto Iguazú and other cities. The bus terminal is downtown, opposite Cristo de la Hermandad. Companies such as Río Uruguay and Expreso Singer serve this corridor.",
      "p-avion":
        "The nearest airport is Posadas (100 km), with daily flights from Buenos Aires. You can also use Iguazú International Airport (200 km).",
    },
  };

  var lang = "es";

  function dict() {
    return UI[lang] || UI.es;
  }

  function t(key) {
    return dict()[key] || UI.es[key] || key;
  }

  function setText(el, value) {
    if (!el || value == null) return;
    el.textContent = value;
  }

  function applyLanguage() {
    document.documentElement.lang = lang === "pt" ? "pt" : lang === "en" ? "en" : "es";

    document.querySelectorAll("[data-tm]").forEach(function (el) {
      var key = el.getAttribute("data-tm");
      if (key) setText(el, t(key));
    });

    var navMap = {
      "#inicio": "navInicio",
      "#que-visitar-local": "navLocal",
      "#que-visitar-provincia": "navProv",
      "#festividades": "navFest",
      "#eventos": "navEv",
      "#promociones": "navPromo",
      "#informacion": "navInfo",
    };
    document.querySelectorAll("#nav-menu a.nav-link").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (navMap[href]) setText(a, t(navMap[href]));
    });

    setText(document.querySelector(".hero-badge"), t("heroBadge"));
    setText(document.getElementById("p-hero-desc"), t("p-hero-desc"));
    setText(document.getElementById("p-tabay-1"), t("p-tabay-1"));
    setText(document.getElementById("p-tabay-2"), t("p-tabay-2"));
    setText(document.getElementById("p-auto"), t("p-auto"));
    setText(document.getElementById("p-colectivo"), t("p-colectivo"));
    setText(document.getElementById("p-avion"), t("p-avion"));

    var ctas = document.querySelectorAll(".hero-ctas .btn");
    if (ctas[0]) {
      var ico1 = ctas[0].querySelector("[aria-hidden]");
      ctas[0].textContent = "";
      if (ico1) ctas[0].appendChild(ico1);
      ctas[0].appendChild(document.createTextNode(" " + t("heroCta1") + " "));
    }
    if (ctas[1]) {
      var ico2 = ctas[1].querySelector("[aria-hidden]");
      ctas[1].textContent = "";
      if (ico2) ctas[1].appendChild(ico2);
      ctas[1].appendChild(document.createTextNode(" " + t("heroCta2")));
    }

    document.querySelectorAll(".tm-lang-btn").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === lang ? "true" : "false");
    });
  }

  function injectQuickStart() {
    if (document.getElementById("tm-quick")) return;
    var hero = document.getElementById("hero");
    if (!hero) return;

    var wrap = document.createElement("section");
    wrap.id = "tm-quick";
    wrap.className = "tm-quick";
    wrap.setAttribute("aria-labelledby", "tm-quick-title");
    wrap.innerHTML =
      '<div class="container">' +
      '<div class="tm-quick-top">' +
      "<div>" +
      '<p class="tm-quick-kicker" data-tm="quickKicker"></p>' +
      '<h2 id="tm-quick-title" data-tm="quickTitle"></h2>' +
      "</div>" +
      '<div class="tm-lang" role="group" aria-label="' +
      t("langAria") +
      '">' +
      '<button type="button" class="tm-lang-btn is-active" data-lang="es" aria-pressed="true">ES</button>' +
      '<button type="button" class="tm-lang-btn" data-lang="pt" aria-pressed="false">PT</button>' +
      '<button type="button" class="tm-lang-btn" data-lang="en" aria-pressed="false">EN</button>' +
      "</div></div>" +
      '<div class="tm-quick-grid" role="list">' +
      '<a class="tm-quick-link" role="listitem" href="#que-visitar-local"><strong data-tm="q1t"></strong><span data-tm="q1d"></span></a>' +
      '<a class="tm-quick-link" role="listitem" href="#inicio"><strong data-tm="q2t"></strong><span data-tm="q2d"></span></a>' +
      '<a class="tm-quick-link" role="listitem" href="#informacion" data-tm-open-tab="colectivos"><strong data-tm="q3t"></strong><span data-tm="q3d"></span></a>' +
      '<a class="tm-quick-link" role="listitem" href="#informacion" data-tm-open-tab="alojamientos"><strong data-tm="q4t"></strong><span data-tm="q4d"></span></a>' +
      "</div></div>";

    hero.insertAdjacentElement("afterend", wrap);

    wrap.addEventListener("click", function (e) {
      var langBtn = e.target.closest(".tm-lang-btn");
      if (langBtn) {
        lang = langBtn.getAttribute("data-lang") || "es";
        try {
          localStorage.setItem("tm-lang", lang);
        } catch (err) {}
        applyLanguage();
        return;
      }
      var a = e.target.closest("[data-tm-open-tab]");
      if (!a) return;
      var tab = a.getAttribute("data-tm-open-tab");
      setTimeout(function () {
        openInfoTab(tab);
      }, 40);
    });
  }

  function openInfoTab(name) {
    var btn = document.getElementById("tab-" + name);
    if (btn) btn.click();
  }

  function removeTabayFacts() {
    var box = document.getElementById("tm-tabay-facts");
    if (box) box.remove();
  }

  function parseTimeToMinutes(text) {
    var m = String(text || "").match(/(\d{1,2})\s*:\s*(\d{2})/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function enhanceColectivos() {
    var panel = document.getElementById("panel-colectivos");
    if (!panel || document.getElementById("tm-colec-tools")) return;

    var bolec = document.createElement("div");
    bolec.id = "tm-colec-boleterias";
    bolec.className = "tm-colec-boleterias";
    bolec.innerHTML =
      '<p class="tm-colec-bolec-title" data-tm="colecBolecTitle"></p>' +
      '<p class="tm-colec-bolec-hours" data-tm="colecBolecHours"></p>' +
      '<ul class="tm-colec-bolec-list">' +
      '<li><span>Río Uruguay / Singer</span> <a href="https://wa.me/543743455052" target="_blank" rel="noopener noreferrer">3743-455052</a></li>' +
      '<li><span>Crucero del Norte</span> <a href="https://wa.me/543743562277" target="_blank" rel="noopener noreferrer">3743-562277</a></li>' +
      '<li><span>20 de Junio <em>(larga distancia)</em></span> <a href="https://wa.me/543764964177" target="_blank" rel="noopener noreferrer">3764-964177</a></li>' +
      '<li><span>Vía Bariloche <em>(larga distancia)</em></span> <a href="https://wa.me/543743440755" target="_blank" rel="noopener noreferrer">3743-440755</a></li>' +
      "</ul>";
    panel.insertBefore(bolec, panel.firstChild);

    var tools = document.createElement("div");
    tools.id = "tm-colec-tools";
    tools.className = "tm-colec-tools";
    tools.innerHTML =
      '<p data-tm="colecLead"></p>' +
      '<div class="tm-colec-row" role="group" aria-label="Filtro de destino">' +
      '<button type="button" class="tm-chip is-active" data-dest="todos">Todos</button>' +
      '<button type="button" class="tm-chip" data-dest="posadas">Posadas</button>' +
      '<button type="button" class="tm-chip" data-dest="iguazu">Iguazú</button>' +
      '<button type="button" class="tm-chip" data-dest="ruta14">Ruta 14</button>' +
      "</div>" +
      '<div class="tm-colec-row">' +
      '<label for="tm-colec-q">Buscar</label>' +
      '<input id="tm-colec-q" type="search" placeholder="Empresa o destino…" autocomplete="off">' +
      '<button type="button" class="tm-btn-sec" id="tm-colec-next-btn">Próximos de hoy</button>' +
      "</div>" +
      '<p class="tm-colec-next" id="tm-colec-next" hidden></p>';

    panel.insertBefore(tools, bolec.nextSibling);

    var blocks = Array.prototype.slice.call(panel.querySelectorAll(".colectivos-empresa"));
    blocks.forEach(function (block, idx) {
      block.setAttribute("data-tm-dest", idx === 0 ? "posadas" : idx === 1 ? "iguazu" : "ruta14");
    });

    var state = { dest: "todos", q: "" };

    function applyFilter() {
      var q = state.q.trim().toLowerCase();
      blocks.forEach(function (block) {
        var dest = block.getAttribute("data-tm-dest");
        var destOk = state.dest === "todos" || state.dest === dest;
        var rows = block.querySelectorAll("tbody tr");
        var any = false;
        rows.forEach(function (tr) {
          var text = tr.textContent.toLowerCase();
          var match = !q || text.indexOf(q) !== -1;
          tr.classList.toggle("tm-row-hide", !match);
          if (match) any = true;
        });
        block.classList.toggle("tm-dest-hide", !destOk || (q && !any));
      });
    }

    tools.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-dest]");
      if (chip) {
        state.dest = chip.getAttribute("data-dest");
        tools.querySelectorAll("[data-dest]").forEach(function (b) {
          b.classList.toggle("is-active", b === chip);
        });
        applyFilter();
      }
    });

    var input = document.getElementById("tm-colec-q");
    if (input) {
      input.addEventListener("input", function () {
        state.q = input.value;
        applyFilter();
      });
    }

    document.getElementById("tm-colec-next-btn").addEventListener("click", function () {
      var now = new Date();
      var day = now.getDay();
      var mins = now.getHours() * 60 + now.getMinutes();
      var nextEl = document.getElementById("tm-colec-next");
      panel.querySelectorAll("tr.tm-row-next").forEach(function (tr) {
        tr.classList.remove("tm-row-next");
      });

      if (day === 0 || day === 6) {
        nextEl.hidden = false;
        nextEl.textContent = t("colecNone");
        return;
      }

      var found = [];
      blocks.forEach(function (block) {
        if (block.classList.contains("tm-dest-hide")) return;
        block.querySelectorAll("tbody tr").forEach(function (tr) {
          if (tr.classList.contains("tm-row-hide")) return;
          var cells = tr.querySelectorAll("td");
          if (!cells.length) return;
          var timeCell =
            block.getAttribute("data-tm-dest") === "ruta14" ? cells[2] || cells[1] : cells[1] || cells[0];
          var tm = parseTimeToMinutes(timeCell ? timeCell.textContent : "");
          if (tm == null || tm < mins) return;
          found.push({ tr: tr, tm: tm, label: tr.textContent.replace(/\s+/g, " ").trim() });
        });
      });
      found.sort(function (a, b) {
        return a.tm - b.tm;
      });
      var top = found.slice(0, 3);
      top.forEach(function (row) {
        row.tr.classList.add("tm-row-next");
      });
      nextEl.hidden = false;
      if (!top.length) {
        nextEl.textContent = t("colecNone");
      } else {
        nextEl.textContent =
          t("colecNext") +
          " " +
          top
            .map(function (r) {
              return r.label.slice(0, 80);
            })
            .join(" · ");
        top[0].tr.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  function enhanceMap() {
    var wrap = document.querySelector(".mapa-wrap");
    if (!wrap || document.getElementById("tm-map-filters")) return;
    var filters = document.createElement("div");
    filters.id = "tm-map-filters";
    filters.className = "tm-map-filters";
    filters.setAttribute("role", "navigation");
    filters.setAttribute("aria-label", "Atajos del mapa");
    filters.innerHTML = [
      ["Naturaleza", "Saltos+del+Tabay+Jardín+América"],
      ["Ciudad", "Plaza+Colón+Jardín+América"],
      ["Terminal", "Terminal+de+ómnibus+Jardín+América"],
      ["Mapa completo", null],
    ]
      .map(function (item) {
        var href =
          item[1] == null
            ? "https://www.google.com/maps/d/viewer?mid=1moxM3yLxCF-AeQOEoxLzfiNuxcGwcPQ"
            : "https://www.google.com/maps/search/?api=1&query=" + item[1];
        return (
          '<a href="' +
          href +
          '" target="_blank" rel="noopener noreferrer">' +
          item[0] +
          "</a>"
        );
      })
      .join("");
    wrap.appendChild(filters);
  }

  function replaceGastro() {
    if (window.GASTRO_FROM_FB) return;
    window.GASTRO = GASTRO_REAL.slice();
    window.GASTRO_EMBEDDED = GASTRO_REAL.slice();

    var banner = document.querySelector(".gastro-intro-banner");
    if (banner) {
      banner.classList.add("tm-gastro-ok");
      banner.innerHTML = '<span aria-hidden="true">✅</span><span data-tm="gastroOk"></span>';
    }

    if (typeof window.renderGastro === "function") {
      try {
        window.renderGastro();
      } catch (err) {}
    }

    setTimeout(function () {
      var cards = document.querySelectorAll("#gastro-grid .turlista-card");
      cards.forEach(function (card, idx) {
        var g = window.GASTRO[idx];
        if (!g) return;
        var actions = card.querySelector(".turlista-actions");
        if (!actions) return;
        if (g.wa && !actions.querySelector(".tm-card-wa")) {
          var a = document.createElement("a");
          a.className = "turlista-btn-tel tm-card-wa";
          a.href = g.wa;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.setAttribute("aria-label", "WhatsApp " + (g.n || ""));
          a.innerHTML = '<span aria-hidden="true">💬</span> WhatsApp';
          actions.appendChild(a);
        }
        if (g.maps && !actions.querySelector(".tm-card-maps")) {
          var m = document.createElement("a");
          m.className = "turlista-btn-tel tm-card-maps";
          m.href = g.maps;
          m.target = "_blank";
          m.rel = "noopener noreferrer";
          m.innerHTML = '<span aria-hidden="true">📍</span> Mapa';
          actions.appendChild(m);
        }
      });
    }, 40);
  }

  function enhanceFestividades() {
    var section = document.getElementById("festividades");
    if (!section || document.getElementById("tm-fest-meta")) return;
    var header = section.querySelector(".section-header") || section.querySelector("header");
    if (!header) return;
    var meta = document.createElement("div");
    meta.id = "tm-fest-meta";
    meta.className = "tm-fest-meta";
    meta.innerHTML = '<a href="#eventos" data-tm="festLink"></a>';
    header.appendChild(meta);
  }

  function injectOlalaReceptivos() {
    var section = document.getElementById("que-visitar-provincia");
    if (!section || section.querySelector(".tm-olala")) return;
    var header = section.querySelector(".section-header");
    if (!header) return;
    var box = document.createElement("div");
    box.className = "tm-olala";
    box.innerHTML =
      '<div class="tm-olala-copy">' +
      '<p class="tm-olala-kicker">Agencia local habilitada</p>' +
      '<p class="tm-olala-title" data-tm="olalaTitle"></p>' +
      '<p class="tm-olala-text" data-tm="olalaText"></p>' +
      "</div>" +
      '<a class="tm-olala-cta" href="https://olalaviajes.tur.ar/#receptivos" target="_blank" rel="noopener noreferrer" data-tm="olalaCta"></a>';
    header.insertAdjacentElement("afterend", box);
  }

  function enhanceFooterOnly() {
    // Quitar restos viejos en el menú (Portal / idiomas inyectados antes)
    document.getElementById("tm-nav-portal") && document.getElementById("tm-nav-portal").remove();
    document.querySelectorAll("#nav-menu .tm-lang").forEach(function (el) {
      el.remove();
    });

    var footer = document.querySelector("footer");
    if (!footer) return;

    var old = document.getElementById("tm-footer-extra");
    if (old) old.remove();

    var box = document.createElement("div");
    box.id = "tm-footer-extra";
    box.className = "tm-footer-extra";
    box.innerHTML =
      '<a href="' +
      PORTAL_URL +
      '" target="_blank" rel="noopener noreferrer" data-tm="portal"></a>' +
      '<a href="' +
      PORTAL_TURISMO +
      '" target="_blank" rel="noopener noreferrer">Área Turismo</a>' +
      '<a href="folleto.html" data-tm="folleto"></a>' +
      '<a href="https://lautiezequiell.github.io/memoria-viva-jardin-america/" target="_blank" rel="noopener noreferrer">Memoria Viva</a>' +
      '<a href="https://xdebdesarrollos.github.io/caminohistoricocultural/" target="_blank" rel="noopener noreferrer">Camino histórico</a>';
    var inner = footer.querySelector(".container, .footer-grid, .footer-content") || footer;
    inner.appendChild(box);
  }

  function softEmptyStates() {
    setTimeout(function () {
      var grid = document.getElementById("eventos-grid");
      if (grid && /Cargando eventos/i.test(grid.textContent || "")) {
        grid.innerHTML =
          '<div class="ev-empty"><p>No pudimos cargar la agenda ahora.</p>' +
          '<p><a href="#festividades">Ver calendario anual</a></p></div>';
      }
      var promos = document.getElementById("promos-web-grid");
      if (promos && /Cargando promociones/i.test(promos.textContent || "")) {
        promos.innerHTML =
          '<p style="text-align:center;color:#64748b">No hay promociones cargadas. Mirá <a href="#informacion" id="tm-goto-aloj">alojamientos registrados</a>.</p>';
        var go = document.getElementById("tm-goto-aloj");
        if (go) {
          go.addEventListener("click", function () {
            setTimeout(function () {
              openInfoTab("alojamientos");
            }, 40);
          });
        }
      }
    }, 12000);
  }

  function forceAlojRegistrados() {
    var btn =
      document.querySelector('.aloj-filtros--tur .aloj-btn[onclick*="registrados"]') ||
      document.querySelector('.aloj-filtros .aloj-btn[onclick*="registrados"]');
    if (btn && typeof window.filtrarAloj === "function") {
      window.filtrarAloj("registrados", btn);
    }
  }

  function init() {
    try {
      var saved = localStorage.getItem("tm-lang");
      if (saved === "pt" || saved === "en" || saved === "es") lang = saved;
    } catch (err) {}

    removeTabayFacts();
    injectQuickStart();
    enhanceColectivos();
    enhanceMap();
    enhanceFestividades();
    injectOlalaReceptivos();
    enhanceFooterOnly();
    replaceGastro();
    softEmptyStates();
    forceAlojRegistrados();
    applyLanguage();

    var hash = (location.hash || "").replace("#", "");
    if (hash === "colectivos" || hash === "alojamientos" || hash === "gastronomia") {
      openInfoTab(hash);
      var info = document.getElementById("informacion");
      if (info) info.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
