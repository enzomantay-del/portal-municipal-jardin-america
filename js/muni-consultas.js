(function () {
  "use strict";

  var panelRoot = null;
  var state = {
    open: false,
    query: "",
    category: "todas",
    selectedId: null,
    areaSlug: "",
    aiLoading: false,
    aiAnswer: null,
    aiError: null,
    aiSugerencias: [],
  };

  var AMIBOT_AI_URL = "/.netlify/functions/amibot-gemini";
  var aiRequestToken = 0;

  var CATEGORY_ORDER = ["tramite", "obras", "turismo", "area", "contacto"];
  var CATEGORY_LABELS = {
    tramite: "Trámites",
    obras: "Obras en curso",
    turismo: "Turismo",
    area: "Áreas",
    contacto: "Contacto",
    todas: "Todas",
  };

  var GROUP_LABELS = {
    tramite: "Trámites y documentos",
    obras: "Obras en curso",
    turismo: "Turismo y colectivos",
    area: "Áreas municipales",
    contacto: "Contacto",
  };

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
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .filter(function (t) {
        return t.length >= 1;
      });
  }

  function entrySearchBlob(entry) {
    return normalize(
      [
        entry.titulo,
        entry.resumen,
        (entry.keywords || []).join(" "),
        entry.searchText || "",
        entry.areaSlug || "",
        entry.categoria || "",
      ].join(" ")
    );
  }

  function scoreEntry(entry, tokens, blob) {
    if (!tokens.length) return 0;
    var score = 0;
    var title = normalize(entry.titulo);
    var keywords = normalize((entry.keywords || []).join(" "));

    tokens.forEach(function (token) {
      if (title.indexOf(token) === 0) score += 12;
      else if (title.indexOf(token) !== -1) score += 8;
      if (keywords.indexOf(token) !== -1) score += 5;
      if (blob.indexOf(token) !== -1) score += 2;
    });

    if (
      tokens.every(function (token) {
        return blob.indexOf(token) !== -1;
      })
    ) {
      score += 6;
    }

    // Priorizar resumen de obras cuando preguntan por obras / en curso
    var obraIntent = tokens.some(function (t) {
      return (
        t === "obra" ||
        t === "obras" ||
        t === "curso" ||
        t === "pavimento" ||
        t === "calle" ||
        t === "construccion" ||
        t === "publicas"
      );
    });
    if (obraIntent && entry.categoria === "obras") score += 10;
    if (obraIntent && entry.id === "obras-en-curso-resumen") score += 8;

    return score;
  }

  function getEntries() {
    return (window.MuniConsultasKnowledge && window.MuniConsultasKnowledge.getEntries()) || [];
  }

  function search(query, options) {
    options = options || {};
    var entries = getEntries();
    var areaFilter = options.areaSlug || "";
    var category = options.category || "todas";
    var tokens = tokenize(query);
    var limit = options.limit != null ? options.limit : 24;

    var filtered = entries.filter(function (entry) {
      if (areaFilter && entry.areaSlug !== areaFilter && entry.categoria !== "contacto") return false;
      if (category !== "todas" && entry.categoria !== category) return false;
      return true;
    });

    if (!tokens.length) {
      return filtered
        .slice()
        .sort(function (a, b) {
          var ai = CATEGORY_ORDER.indexOf(a.categoria);
          var bi = CATEGORY_ORDER.indexOf(b.categoria);
          if (ai !== bi) return ai - bi;
          return String(a.titulo).localeCompare(String(b.titulo), "es");
        })
        .slice(0, limit);
    }

    return filtered
      .map(function (entry) {
        var blob = entrySearchBlob(entry);
        return { entry: entry, score: scoreEntry(entry, tokens, blob) };
      })
      .filter(function (row) {
        return row.score > 0;
      })
      .sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.entry.titulo).localeCompare(String(b.entry.titulo), "es");
      })
      .slice(0, limit)
      .map(function (row) {
        return row.entry;
      });
  }

  function groupByCategory(list) {
    var groups = {};
    CATEGORY_ORDER.forEach(function (cat) {
      groups[cat] = [];
    });
    list.forEach(function (entry) {
      var cat = entry.categoria || "tramite";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(entry);
    });
    return CATEGORY_ORDER.map(function (cat) {
      return { id: cat, label: GROUP_LABELS[cat] || CATEGORY_LABELS[cat], items: groups[cat] || [] };
    }).filter(function (g) {
      return g.items.length;
    });
  }

  function renderLinks(enlaces) {
    if (!enlaces || !enlaces.length) return "";
    return (
      '<div class="muni-consultas-links">' +
      enlaces
        .map(function (link) {
          var attrs = link.externo ? ' target="_blank" rel="noopener noreferrer"' : "";
          return (
            '<a class="muni-btn muni-btn--ghost" href="' +
            escapeHtml(link.url) +
            '"' +
            attrs +
            ">" +
            escapeHtml(link.titulo) +
            "</a>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function stripHtmlLite(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatAiAnswerHtml(text) {
    var safe = escapeHtml(text);
    var blocks = safe
      .split(/\n{2,}/)
      .map(function (block) {
        return block.trim();
      })
      .filter(Boolean);
    if (!blocks.length) return "";
    return blocks
      .map(function (block) {
        return "<p>" + block.replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function clearAiState() {
    state.aiLoading = false;
    state.aiAnswer = null;
    state.aiError = null;
    state.aiSugerencias = [];
  }

  function buildAiContext(query) {
    var matches = search(query, {
      areaSlug: state.areaSlug,
      category: "todas",
      limit: 10,
    });
    var extras = getEntries().filter(function (entry) {
      return (
        entry.id === "contacto-municipal" ||
        entry.id === "obras-en-curso-resumen" ||
        entry.id === "obras-privadas-contacto"
      );
    });
    var seen = {};
    var combined = [];
    matches.concat(extras).forEach(function (entry) {
      if (!entry || !entry.id || seen[entry.id]) return;
      seen[entry.id] = true;
      combined.push(entry);
    });

    return combined.slice(0, 12).map(function (entry) {
      return {
        id: entry.id,
        titulo: entry.titulo || "",
        categoria: entry.categoria || "",
        resumen: entry.resumen || "",
        texto: stripHtmlLite(entry.detalleHtml || entry.searchText || "").slice(0, 1000),
        enlaces: (entry.enlaces || []).slice(0, 4).map(function (link) {
          return {
            titulo: link.titulo || "",
            url: link.url || "",
          };
        }),
      };
    });
  }

  async function askAmiBotAi() {
    var question = String(state.query || "").trim();
    if (question.length < 3) {
      state.aiError = "Escribí una pregunta un poco más completa (por ejemplo: colectivo a Posadas).";
      state.aiAnswer = null;
      state.aiLoading = false;
      renderBody();
      return;
    }

    var token = ++aiRequestToken;
    state.aiLoading = true;
    state.aiAnswer = null;
    state.aiError = null;
    state.aiSugerencias = [];
    state.selectedId = null;
    renderBody();

    try {
      if (window.MuniConsultasKnowledge && window.MuniConsultasKnowledge.refreshLiveObras) {
        await window.MuniConsultasKnowledge.refreshLiveObras(false);
      }
    } catch (_err) {}

    if (token !== aiRequestToken) return;

    try {
      var res = await fetch(AMIBOT_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          question: question,
          context: buildAiContext(question),
        }),
      });
      var data = null;
      try {
        data = await res.json();
      } catch (_parseErr) {
        data = null;
      }
      if (token !== aiRequestToken) return;

      if (data && data.ok && data.answer) {
        state.aiAnswer = data.answer;
        state.aiSugerencias = Array.isArray(data.sugerencias) ? data.sugerencias : [];
        state.aiError = null;
      } else if (data && data.unavailable) {
        state.aiError =
          data.error ||
          "AmiBot con IA todavía no está activado en el servidor. Mientras tanto usá las opciones de abajo.";
      } else {
        state.aiError =
          (data && data.error) ||
          "No pude responder ahora. Probá de nuevo o elegí una opción de la lista.";
      }
    } catch (_err) {
      if (token !== aiRequestToken) return;
      state.aiError =
        "No pude conectar con AmiBot IA. Revisá tu conexión o usá las coincidencias de abajo.";
    } finally {
      if (token === aiRequestToken) {
        state.aiLoading = false;
        renderBody();
      }
    }
  }

  function renderAiBlock() {
    if (!state.aiLoading && !state.aiAnswer && !state.aiError) return "";

    if (state.aiLoading) {
      return (
        '<div class="muni-consultas-ai muni-consultas-ai--loading" role="status">' +
        "<p>AmiBot está pensando con la información del portal…</p>" +
        "</div>"
      );
    }

    if (state.aiError && !state.aiAnswer) {
      return (
        '<div class="muni-consultas-ai muni-consultas-ai--error" role="status">' +
        "<p>" +
        escapeHtml(state.aiError) +
        "</p>" +
        "</div>"
      );
    }

    var linksHtml = "";
    if (state.aiSugerencias && state.aiSugerencias.length) {
      linksHtml =
        '<div class="muni-consultas-links">' +
        state.aiSugerencias
          .map(function (link) {
            return (
              '<a class="muni-btn muni-btn--ghost" href="' +
              escapeHtml(link.url) +
              '">' +
              escapeHtml(link.titulo || "Ver más") +
              "</a>"
            );
          })
          .join("") +
        "</div>";
    }

    return (
      '<div class="muni-consultas-ai" role="status">' +
      '<p class="muni-consultas-ai-label">Respuesta de AmiBot</p>' +
      '<div class="muni-consultas-ai-body">' +
      formatAiAnswerHtml(state.aiAnswer) +
      "</div>" +
      linksHtml +
      "</div>"
    );
  }

  function ensurePanel() {
    if (panelRoot) return panelRoot;

    panelRoot = document.createElement("div");
    panelRoot.id = "muni-consultas-panel-root";
    panelRoot.innerHTML =
      '<div class="muni-consultas-overlay" data-consultas-close hidden></div>' +
      '<aside class="muni-consultas-panel" id="muni-consultas-panel" role="dialog" aria-modal="true" aria-labelledby="muni-consultas-panel-title" hidden>' +
      '<header class="muni-consultas-panel-head">' +
      '<div class="muni-consultas-panel-brand">' +
      '<img class="muni-consultas-panel-avatar" src="assets/consultas/amibot-avatar.png" width="48" height="48" alt="">' +
      "<div>" +
      '<p class="muni-consultas-panel-kicker">Asistente del portal</p>' +
      '<h2 id="muni-consultas-panel-title">Hola, soy AmiBot</h2>' +
      '<p class="muni-consultas-panel-sub">Preguntame en tus palabras: trámites, obras, turismo, contactos y más.</p>' +
      "</div></div>" +
      '<button type="button" class="muni-consultas-panel-close" data-consultas-close aria-label="Cerrar">×</button>' +
      "</header>" +
      '<div class="muni-consultas-panel-search">' +
      '<label class="muni-consultas-sr" for="muni-consultas-panel-input">Preguntale a AmiBot</label>' +
      '<div class="muni-consultas-ask-row">' +
      '<input id="muni-consultas-panel-input" type="search" placeholder="Ej: ¿cuándo pasa el colectivo a Posadas?" autocomplete="off" enterkeyhint="send">' +
      '<button type="button" class="muni-btn muni-btn--primary muni-consultas-ask-btn" id="muni-consultas-ask-ai">Preguntar</button>' +
      "</div>" +
      '<p class="muni-consultas-ask-hint">Escribí y tocá Preguntar (o Enter). También podés filtrar las opciones de abajo.</p>' +
      "</div>" +
      '<div class="muni-consultas-panel-filters" id="muni-consultas-panel-filters" role="tablist" aria-label="Filtrar por tipo"></div>' +
      '<div class="muni-consultas-panel-body" id="muni-consultas-panel-body" aria-live="polite"></div>' +
      "</aside>";

    document.body.appendChild(panelRoot);

    panelRoot.addEventListener("click", function (e) {
      if (e.target.closest("[data-consultas-close]")) {
        closePanel();
        return;
      }
      var filterBtn = e.target.closest("[data-consultas-filter]");
      if (filterBtn) {
        state.category = filterBtn.getAttribute("data-consultas-filter") || "todas";
        state.selectedId = null;
        renderFilters();
        renderBody();
        return;
      }
      var pick = e.target.closest("[data-consultas-pick]");
      if (pick) {
        state.selectedId = pick.getAttribute("data-consultas-pick");
        renderBody();
        return;
      }
      if (e.target.closest("[data-consultas-back]")) {
        state.selectedId = null;
        renderBody();
        var inputBack = document.getElementById("muni-consultas-panel-input");
        if (inputBack) inputBack.focus();
      }
    });

    var askBtn = document.getElementById("muni-consultas-ask-ai");
    if (askBtn) {
      askBtn.addEventListener("click", function () {
        askAmiBotAi();
      });
    }

    var input = document.getElementById("muni-consultas-panel-input");
    if (input) {
      input.addEventListener("input", function () {
        state.query = input.value;
        state.selectedId = null;
        if (!state.aiLoading) {
          clearAiState();
        }
        renderBody();
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          closePanel();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          askAmiBotAi();
        }
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && state.open) closePanel();
    });

    return panelRoot;
  }

  function renderFilters() {
    var el = document.getElementById("muni-consultas-panel-filters");
    if (!el) return;
    var cats = ["todas"].concat(CATEGORY_ORDER);
    el.innerHTML = cats
      .map(function (cat) {
        return (
          '<button type="button" class="muni-consultas-filter' +
          (state.category === cat ? " is-active" : "") +
          '" data-consultas-filter="' +
          cat +
          '" role="tab" aria-selected="' +
          (state.category === cat ? "true" : "false") +
          '">' +
          escapeHtml(CATEGORY_LABELS[cat] || cat) +
          "</button>"
        );
      })
      .join("");
  }

  function renderOption(entry) {
    return (
      '<button type="button" class="muni-consultas-option" data-consultas-pick="' +
      escapeHtml(entry.id) +
      '">' +
      '<span class="muni-consultas-option-title">' +
      escapeHtml(entry.titulo) +
      "</span>" +
      (entry.resumen
        ? '<span class="muni-consultas-option-resumen">' + escapeHtml(entry.resumen) + "</span>"
        : "") +
      "</button>"
    );
  }

  function renderBody() {
    var body = document.getElementById("muni-consultas-panel-body");
    if (!body) return;

    if (state.selectedId) {
      var entry = getEntries().find(function (item) {
        return item.id === state.selectedId;
      });
      if (!entry) {
        state.selectedId = null;
      } else {
        body.innerHTML =
          '<button type="button" class="muni-consultas-back" data-consultas-back>← Volver a resultados</button>' +
          '<article class="muni-consultas-card muni-consultas-card--panel">' +
          '<p class="muni-consultas-card-tag">' +
          escapeHtml(CATEGORY_LABELS[entry.categoria] || "Consulta") +
          "</p>" +
          "<h3>" +
          escapeHtml(entry.titulo) +
          "</h3>" +
          (entry.resumen ? '<p class="muni-consultas-card-resumen">' + escapeHtml(entry.resumen) + "</p>" : "") +
          '<div class="muni-consultas-card-body">' +
          (entry.detalleHtml || "") +
          "</div>" +
          renderLinks(entry.enlaces) +
          "</article>";
        return;
      }
    }

    var list = search(state.query, {
      areaSlug: state.areaSlug,
      category: state.category,
      limit: 30,
    });

    var aiHtml = renderAiBlock();

    if (!list.length) {
      body.innerHTML =
        aiHtml +
        '<div class="muni-consultas-empty">' +
        (state.aiAnswer
          ? "<p>Si necesitás más detalle, también podés escribir a Mesa de entrada.</p>"
          : "<p>No hay coincidencias para <strong>" +
            escapeHtml(state.query || "tu búsqueda") +
            "</strong>.</p>" +
            "<p>Probá preguntarle a AmiBot con Enter, o buscá <em>planos</em>, <em>colectivo</em>, <em>loteo</em> o <em>horario</em>.</p>") +
        (window.MuniWhatsApp
          ? '<p><a class="muni-btn muni-btn--primary" href="' +
            escapeHtml(window.MuniWhatsApp.url("Hola, quiero consultar un trámite municipal.")) +
            '" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a></p>'
          : "") +
        "</div>";
      return;
    }

    var groups = groupByCategory(list);
    var hint = state.query
      ? '<p class="muni-consultas-panel-hint">Temas relacionados:</p>'
      : '<p class="muni-consultas-panel-hint">Escribí tu pregunta y tocá Preguntar, o elegí una opción:</p>';

    body.innerHTML =
      aiHtml +
      hint +
      groups
        .map(function (group) {
          return (
            '<section class="muni-consultas-group">' +
            "<h3>" +
            escapeHtml(group.label) +
            " <span>(" +
            group.items.length +
            ")</span></h3>" +
            '<div class="muni-consultas-options">' +
            group.items.map(renderOption).join("") +
            "</div></section>"
          );
        })
        .join("");
  }

  function refreshObrasThenRender() {
    var K = window.MuniConsultasKnowledge;
    if (!K || !K.refreshLiveObras) return;
    renderBody();
    K.refreshLiveObras(false).then(function () {
      if (!state.open) return;
      if (state.selectedId && String(state.selectedId).indexOf("obra") === 0) {
        // mantener detalle si sigue existiendo
      }
      renderBody();
    });
  }

  function openPanel(options) {
    options = options || {};
    ensurePanel();
    state.open = true;
    state.areaSlug = options.areaSlug || "";
    state.category = options.category || "todas";
    state.selectedId = options.selectedId || null;
    state.query = options.query != null ? String(options.query) : state.query;
    clearAiState();

    var overlay = panelRoot.querySelector(".muni-consultas-overlay");
    var panel = document.getElementById("muni-consultas-panel");
    var input = document.getElementById("muni-consultas-panel-input");

    if (overlay) overlay.hidden = false;
    if (panel) panel.hidden = false;
    document.body.classList.add("muni-consultas-open");
    stopBubbleCycle();

    if (input) {
      input.value = state.query;
      setTimeout(function () {
        input.focus();
        input.select();
      }, 30);
    }

    renderFilters();
    refreshObrasThenRender();
  }

  function closePanel() {
    if (!panelRoot) return;
    state.open = false;
    state.selectedId = null;
    clearAiState();
    aiRequestToken += 1;
    var overlay = panelRoot.querySelector(".muni-consultas-overlay");
    var panel = document.getElementById("muni-consultas-panel");
    if (overlay) overlay.hidden = true;
    if (panel) panel.hidden = true;
    document.body.classList.remove("muni-consultas-open");
    resumeBubbleCycle();
  }

  var ASSISTANT = {
    name: "AmiBot",
    avatar: "assets/consultas/amibot-avatar.png",
    bubble:
      "Hola, soy AmiBot. Preguntame en tus palabras sobre trámites, obras, turismo o contactos del municipio.",
  };

  var bubbleTimer = null;
  var bubbleVisible = false;

  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (err) {
      return false;
    }
  }

  function setBubbleVisible(show) {
    var bubble = document.getElementById("muni-consultas-bubble");
    var fab = document.getElementById("muni-consultas-fab");
    if (!bubble || !fab) return;
    bubbleVisible = !!show;
    if (show) {
      bubble.hidden = false;
      bubble.setAttribute("aria-hidden", "false");
      // Dos frames: asegura la transición al quitar [hidden]
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!bubbleVisible || state.open) return;
          fab.classList.add("is-bubble-open");
        });
      });
    } else {
      fab.classList.remove("is-bubble-open");
      bubble.setAttribute("aria-hidden", "true");
      // Esperar fade-out breve antes de ocultar
      setTimeout(function () {
        if (bubbleVisible) return;
        bubble.hidden = true;
      }, prefersReducedMotion() ? 0 : 320);
    }
  }

  function stopBubbleCycle() {
    if (bubbleTimer) {
      clearTimeout(bubbleTimer);
      bubbleTimer = null;
    }
    setBubbleVisible(false);
  }

  function scheduleBubble(nextShow, delay) {
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () {
      bubbleTimer = null;
      if (state.open) return;
      setBubbleVisible(nextShow);
      // Visible ~6s, oculto ~14s — recuerda sin molestar
      scheduleBubble(!nextShow, nextShow ? 6000 : 14000);
    }, delay);
  }

  function resumeBubbleCycle() {
    if (state.open) return;
    if (!document.getElementById("muni-consultas-fab")) return;
    setBubbleVisible(false);
    // Primera aparición un poco antes para que se note
    scheduleBubble(true, 2500);
  }

  function initFloat() {
    if (!document.body.classList.contains("muni-body")) return;
    if (document.getElementById("muni-consultas-fab")) return;

    var wrap = document.createElement("div");
    wrap.id = "muni-consultas-fab";
    wrap.className = "muni-consultas-fab";
    wrap.innerHTML =
      '<div id="muni-consultas-bubble" class="muni-consultas-bubble" role="status" hidden aria-hidden="true">' +
      '<p class="muni-consultas-bubble-text">' +
      escapeHtml(ASSISTANT.bubble) +
      "</p>" +
      '<span class="muni-consultas-bubble-tail" aria-hidden="true"></span>' +
      "</div>" +
      '<button type="button" id="muni-consultas-float" class="muni-consultas-float" aria-label="Preguntale a AmiBot">' +
      '<img class="muni-consultas-float-avatar" src="' +
      ASSISTANT.avatar +
      '" width="36" height="36" alt="" decoding="async">' +
      '<span class="muni-consultas-float-text">' +
      '<span class="muni-consultas-float-name">AmiBot</span>' +
      '<span class="muni-consultas-float-label">Tu asistente</span>' +
      "</span></button>";

    wrap.querySelector("#muni-consultas-float").addEventListener("click", function () {
      openPanel();
    });

    document.body.appendChild(wrap);
    resumeBubbleCycle();
  }

  function bindOpenTriggers() {
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-open-consultas]");
      if (!trigger) return;
      e.preventDefault();
      openPanel({
        query: trigger.getAttribute("data-consultas-q") || "",
        areaSlug: trigger.getAttribute("data-consultas-area") || "",
        category: trigger.getAttribute("data-consultas-cat") || "todas",
      });
    });
  }

  function mountLegacyPage() {
    var isConsultasPage = /consultas\.html/i.test(window.location.pathname || "");
    var form = document.getElementById("muni-consultas-form");
    if (!isConsultasPage && !form) return;
    openPanel({
      query: (function () {
        try {
          return new URLSearchParams(window.location.search).get("q") || "";
        } catch (err) {
          return "";
        }
      })(),
      areaSlug: (function () {
        try {
          return new URLSearchParams(window.location.search).get("area") || "";
        } catch (err) {
          return "";
        }
      })(),
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.MuniPortal && window.MuniPortal.initNav && /consultas\.html/i.test(window.location.pathname || "")) {
      window.MuniPortal.initNav("consultas");
    }
    bindOpenTriggers();
    initFloat();
    mountLegacyPage();
    if (window.MuniConsultasKnowledge && window.MuniConsultasKnowledge.refreshLiveObras) {
      window.MuniConsultasKnowledge.refreshLiveObras(false).catch(function () {});
    }
  });

  window.MuniConsultas = {
    search: search,
    open: openPanel,
    close: closePanel,
    ask: askAmiBotAi,
    normalize: normalize,
  };
})();
