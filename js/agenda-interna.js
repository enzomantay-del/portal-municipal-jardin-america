(function () {
  "use strict";

  var TIPO_LABELS = {
    reunion: "Reunión",
    actividad: "Actividad",
    obra: "Obra / operativo",
    feria: "Feria / evento cultural",
    capacitacion: "Capacitación",
    otro: "Otro",
  };

  var TIPO_ICONS = {
    reunion: "📋",
    actividad: "🎯",
    obra: "🏗️",
    feria: "🎪",
    capacitacion: "📚",
    otro: "📌",
  };

  var MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  var auth = null;
  var db = null;
  var alertBox = document.getElementById("agenda-alert");
  var loginForm = document.getElementById("agenda-login-form");
  var authPanel = document.getElementById("agenda-auth");
  var workspace = document.getElementById("agenda-workspace");
  var userEmailEl = document.getElementById("agenda-user-email");
  var userRoleEl = document.getElementById("agenda-user-role");
  var logoutBtn = document.getElementById("agenda-logout");
  var eventForm = document.getElementById("agenda-form");
  var formTitle = document.getElementById("agenda-form-title");
  var formPanel = document.getElementById("agenda-form-panel");
  var toggleFormBtn = document.getElementById("agenda-toggle-form");
  var closeFormBtn = document.getElementById("agenda-close-form");
  var cancelEditBtn = document.getElementById("agenda-cancel-edit");
  var areaField = document.getElementById("agenda-area-field");
  var areaSelect = document.getElementById("agenda-area");
  var listEl = document.getElementById("agenda-list");
  var emptyEl = document.getElementById("agenda-empty");
  var statsEl = document.getElementById("agenda-stats");
  var remindersEl = document.getElementById("agenda-reminders");
  var refreshBtn = document.getElementById("agenda-refresh");
  var fechaInicioInput = document.getElementById("agenda-fecha-inicio");
  var fechaFinInput = document.getElementById("agenda-fecha-fin");
  var visiblePublicoInput = document.getElementById("agenda-visible-publico");
  var publicoHintEl = document.getElementById("agenda-publico-hint");
  var imagenInput = document.getElementById("agenda-imagen");
  var imagenPreviewEl = document.getElementById("agenda-imagen-preview");
  var pendingImagenUrl = "";

  var currentUser = null;
  var userProfile = null;
  var userArea = null;
  var areasCache = [];
  var editingId = null;
  var eventsById = new Map();
  var eventsCache = [];
  var viewMode = "timeline";
  var calendarCursor = null;
  var viewSwitchBound = false;
  var sessionReady = false;
  var lastAuthUid = null;
  var authNullTimer = null;
  var AUTH_NULL_DELAY_MS = 1200;
  var embedShowAlert = null;

  function initClients() {
    if (!window.MuniFirebase || !window.MuniFirebase.isConfigured()) return false;
    window.MuniFirebase.init();
    auth = window.MuniFirebase.auth();
    db = window.MuniFirebase.db();
    return !!(auth && db);
  }

  function showAlert(type, message) {
    if (window.MUNI_AGENDA_EMBED && embedShowAlert) {
      embedShowAlert(type, message);
      return;
    }
    if (!alertBox) return;
    alertBox.className = "muni-panel-alert muni-panel-alert--" + type;
    alertBox.textContent = message;
    alertBox.hidden = false;
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideAlert() {
    if (alertBox) alertBox.hidden = true;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setWorkspaceVisible(visible) {
    if (authPanel) authPanel.hidden = visible;
    if (workspace) workspace.hidden = !visible;
  }

  function clearAuthNullTimer() {
    if (authNullTimer) {
      clearTimeout(authNullTimer);
      authNullTimer = null;
    }
  }

  function scheduleSignedOutCheck() {
    clearAuthNullTimer();
    authNullTimer = setTimeout(function () {
      authNullTimer = null;
      if (auth && auth.currentUser) return;
      sessionReady = false;
      lastAuthUid = null;
      currentUser = null;
      userProfile = null;
      userArea = null;
      setWorkspaceVisible(false);
    }, AUTH_NULL_DELAY_MS);
  }

  function todayIso() {
    return window.MuniApi.todayIsoArgentina();
  }

  function parseIsoParts(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
    var p = iso.slice(0, 10).split("-");
    return { y: +p[0], m: +p[1], d: +p[2] };
  }

  function isoToDate(iso) {
    var p = parseIsoParts(iso);
    if (!p) return null;
    return new Date(p.y, p.m - 1, p.d);
  }

  function daysBetween(fromIso, toIso) {
    var a = isoToDate(fromIso);
    var b = isoToDate(toIso);
    if (!a || !b) return null;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function daysUntilStart(fechaInicio) {
    return daysBetween(todayIso(), fechaInicio);
  }

  function normalizePhone(value) {
    var d = String(value || "").replace(/\D/g, "");
    if (d.length === 10 && d.charAt(0) === "0") d = "54" + d.slice(1);
    if (d.length === 10) d = "54" + d;
    return d;
  }

  function tipoLabel(key) {
    return TIPO_LABELS[key] || key || "Evento";
  }

  function tipoIcon(key) {
    return TIPO_ICONS[key] || TIPO_ICONS.otro;
  }

  function formatFechaCorta(iso) {
    var p = parseIsoParts(iso);
    if (!p) return iso || "";
    return p.d + " " + MESES[p.m - 1].slice(0, 3);
  }

  function formatFechaLarga(iso) {
    var p = parseIsoParts(iso);
    if (!p) return iso || "";
    var dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    var dt = new Date(p.y, p.m - 1, p.d);
    return dias[dt.getDay()] + " " + p.d + " de " + MESES[p.m - 1] + " " + p.y;
  }

  function formatRangoFecha(inicio, fin, hora) {
    if (!inicio) return "";
    var finReal = fin && fin >= inicio ? fin : inicio;
    var texto =
      inicio === finReal
        ? formatFechaLarga(inicio)
        : formatFechaCorta(inicio) + " → " + formatFechaCorta(finReal) + " (" + formatFechaLarga(inicio).split(" ").slice(1).join(" ") + " al " + formatFechaLarga(finReal).split(" ").slice(1).join(" ") + ")";
    if (hora) texto += " · " + hora + " hs";
    return texto;
  }

  function formatRangoCorto(inicio, fin) {
    if (!inicio) return "";
    var finReal = fin && fin >= inicio ? fin : inicio;
    if (inicio === finReal) return formatFechaCorta(inicio);
    return formatFechaCorta(inicio) + " – " + formatFechaCorta(finReal);
  }

  function monthGroupKey(iso) {
    var p = parseIsoParts(iso);
    if (!p) return "Sin fecha";
    return MESES[p.m - 1] + " " + p.y;
  }

  function getStoredViewMode() {
    try {
      var stored = localStorage.getItem("muni-agenda-view");
      if (stored === "grid" || stored === "calendar" || stored === "timeline") return stored;
    } catch (_e) {
      /* ignore */
    }
    return "timeline";
  }

  function currentMonthCursor() {
    var p = parseIsoParts(todayIso());
    if (!p) {
      var now = new Date();
      return { y: now.getFullYear(), m: now.getMonth() };
    }
    return { y: p.y, m: p.m - 1 };
  }

  function addMonths(cursor, delta) {
    var d = new Date(cursor.y, cursor.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  }

  function isoForDay(y, monthIndex, day) {
    return y + "-" + String(monthIndex + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
  }

  function eventCoversDay(ev, iso) {
    return ev.fechaInicio <= iso && ev.fechaFin >= iso;
  }

  function updateListContainerClass() {
    if (!listEl) return;
    listEl.className =
      viewMode === "grid"
        ? "muni-agenda-grid"
        : viewMode === "calendar"
          ? "muni-agenda-calendar-wrap"
          : "muni-agenda-timeline";
  }

  function updateViewButtons() {
    document.querySelectorAll("[data-agenda-view]").forEach(function (btn) {
      var active = btn.getAttribute("data-agenda-view") === viewMode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function setViewMode(mode) {
    if (mode !== "timeline" && mode !== "grid" && mode !== "calendar") return;
    viewMode = mode;
    try {
      localStorage.setItem("muni-agenda-view", mode);
    } catch (_e) {
      /* ignore */
    }
    updateViewButtons();
    updateListContainerClass();
    if (eventsCache.length) renderEvents(eventsCache);
  }

  function bindViewSwitch() {
    if (viewSwitchBound) return;
    viewSwitchBound = true;
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-agenda-view]");
      if (!btn || !listEl || !document.body.contains(listEl)) return;
      setViewMode(btn.getAttribute("data-agenda-view"));
    });
  }

  function publicationLabel(estado) {
    if (estado === "publicado") return "Publicado en portal";
    if (estado === "pendiente") return "Pendiente de aprobación";
    if (estado === "rechazado") return "Publicación rechazada";
    return "";
  }

  function publicationBadgeClass(estado) {
    if (estado === "publicado") return "muni-agenda-badge--pub-publicado";
    if (estado === "pendiente") return "muni-agenda-badge--pub-pendiente";
    if (estado === "rechazado") return "muni-agenda-badge--pub-rechazado";
    return "";
  }

  function publicationBadgeHtml(ev) {
    var label = publicationLabel(ev.estadoPublicacion);
    if (!label) return "";
    return (
      '<span class="muni-agenda-badge ' +
      publicationBadgeClass(ev.estadoPublicacion) +
      '">' +
      escapeHtml(label) +
      "</span>"
    );
  }

  function publicationActionsHtml(ev) {
    if (!userProfile || userProfile.role !== "admin") return "";
    if (ev.estadoPublicacion !== "pendiente") return "";
    return (
      '<div class="muni-agenda-card-actions muni-agenda-card-actions--pub">' +
      '<button type="button" class="muni-btn muni-btn--primary muni-btn--sm" data-agenda-approve="' +
      escapeHtml(ev.id) +
      '">Aprobar portal</button>' +
      '<button type="button" class="muni-btn muni-btn--danger muni-btn--sm" data-agenda-reject="' +
      escapeHtml(ev.id) +
      '">Rechazar</button>' +
      "</div>"
    );
  }

  async function uploadAgendaImage(file, uid) {
    if (!window.MuniFirebase || !window.MuniFirebase.storage) {
      throw new Error("Storage no disponible. Recargá la página.");
    }
    var storage = window.MuniFirebase.storage();
    var authClient = window.MuniFirebase.auth ? window.MuniFirebase.auth() : null;
    if (authClient && authClient.currentUser && authClient.currentUser.getIdToken) {
      await authClient.currentUser.getIdToken(true);
    }

    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = "municipal-flyers/" + uid + "/" + Date.now() + "." + ext;
    var ref = storage.ref(path);
    await ref.put(file, { cacheControl: "public,max-age=31536000" });
    return ref.getDownloadURL();
  }

  function showImagenPreview(url) {
    if (!imagenPreviewEl) return;
    if (!url) {
      imagenPreviewEl.hidden = true;
      imagenPreviewEl.innerHTML = "";
      return;
    }
    imagenPreviewEl.hidden = false;
    imagenPreviewEl.innerHTML =
      '<img src="' + escapeHtml(url) + '" alt="Vista previa del flyer" loading="lazy" decoding="async">';
  }

  function resolvePublicationFields(visiblePublico, existing) {
    var isAdmin = userProfile && userProfile.role === "admin";
    if (!visiblePublico) {
      return {
        estadoPublicacion: "interno",
        solicitaPublicacion: false,
      };
    }
    if (isAdmin) {
      return {
        estadoPublicacion: "publicado",
        solicitaPublicacion: true,
        publicadoAt: window.MuniFirebase.serverTimestamp(),
      };
    }
    return {
      estadoPublicacion: "pendiente",
      solicitaPublicacion: true,
      publicacionSolicitadaAt: window.MuniFirebase.serverTimestamp(),
    };
  }

  function cardActionsHtml(ev) {
    if (!canEditEvent(ev)) return "";
    return (
      '<div class="muni-agenda-card-actions">' +
      '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-agenda-edit="' +
      escapeHtml(ev.id) +
      '">Editar</button>' +
      '<button type="button" class="muni-btn muni-btn--danger muni-btn--sm" data-agenda-delete="' +
      escapeHtml(ev.id) +
      '">Eliminar</button>' +
      "</div>"
    );
  }

  function cardHighlightClasses(ev, today, prefix) {
    var status = eventStatus(ev, today);
    var cls = prefix + " " + prefix + "--" + escapeHtml(ev.tipoEvento);
    if (status && (status.key === "proximo" || status.key === "semana" || status.key === "hoy" || status.key === "manana")) {
      cls += " " + prefix + "--highlight";
    }
    if (isEnCurso(ev, today)) cls += " " + prefix + "--curso";
    return cls;
  }

  function isStaffRole(role) {
    return role === "encargado" || role === "admin";
  }

  function isEnCurso(ev, today) {
    return ev.fechaInicio <= today && ev.fechaFin >= today;
  }

  function eventStatus(ev, today) {
    if (isEnCurso(ev, today)) return { key: "curso", label: "En curso", className: "muni-agenda-badge--curso" };
    var d = daysUntilStart(ev.fechaInicio);
    if (d === null) return null;
    if (d === 0) return { key: "hoy", label: "Hoy", className: "muni-agenda-badge--hoy" };
    if (d === 1) return { key: "manana", label: "Mañana", className: "muni-agenda-badge--proximo" };
    if (d === 7) return { key: "semana", label: "Falta 1 semana", className: "muni-agenda-badge--semana" };
    if (d > 0 && d <= 7) return { key: "proximo", label: "En " + d + " días", className: "muni-agenda-badge--proximo" };
    return null;
  }

  function setFormOpen(open) {
    if (!formPanel || !toggleFormBtn) return;
    formPanel.hidden = !open;
    toggleFormBtn.setAttribute("aria-expanded", open ? "true" : "false");
    toggleFormBtn.textContent = open ? "Ocultar formulario" : "+ Nuevo evento";
    if (open) formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getCampanaConfig() {
    return window.CAMPANA_CONFIG || {};
  }

  function campanaApiUrl(path) {
    var cfg = getCampanaConfig();
    var base = String(cfg.apiBase || "").replace(/\/$/, "");
    var key = String(cfg.publicKey || "").trim();
    if (!base) throw new Error("Falta campana-config.js (apiBase).");
    return base + path + (key ? "?k=" + encodeURIComponent(key) : "");
  }

  async function resolveUserArea(areaSlug) {
    if (!db || !areaSlug) return null;
    var snap = await db.collection("areas").doc(areaSlug).get({ source: "server" });
    if (!snap.exists) return null;
    return window.MuniApi.mapArea(snap.id, snap.data());
  }

  async function loadAreasForAdmin() {
    areasCache = [];
    try {
      var snap = await db.collection("areas").where("activa", "==", true).get();
      snap.forEach(function (doc) {
        areasCache.push(window.MuniApi.mapArea(doc.id, doc.data()));
      });
    } catch (err) {
      console.warn("loadAreasForAdmin", err);
    }

    if (!areasCache.length && window.MUNI_FIREBASE_SEED_AREAS) {
      areasCache = window.MUNI_FIREBASE_SEED_AREAS.filter(function (a) {
        return a.activa !== false;
      }).map(function (a) {
        return window.MuniApi.mapArea(a.slug, a);
      });
    }

    areasCache.sort(function (a, b) {
      return (a.orden || 0) - (b.orden || 0) || a.nombre.localeCompare(b.nombre);
    });

    if (areaSelect) {
      areaSelect.innerHTML = areasCache
        .map(function (a) {
          return '<option value="' + escapeHtml(a.slug) + '">' + escapeHtml(a.nombre) + "</option>";
        })
        .join("");
    }
  }

  function configureFormForRole() {
    var isAdmin = userProfile && userProfile.role === "admin";
    if (areaField) areaField.hidden = !isAdmin;
    if (publicoHintEl) {
      publicoHintEl.textContent = isAdmin
        ? "Como administrador podés publicar directamente en la agenda pública del portal."
        : "Si marcás esta opción, el evento queda pendiente hasta que el administrador lo apruebe.";
    }
  }

  async function refreshSession(user) {
    if (!user) return;
    currentUser = user;

    if (user.getIdToken) {
      try {
        await user.getIdToken(true);
      } catch (_tokenErr) {
        /* continuar */
      }
    }

    var profile = null;
    try {
      profile = await window.MuniApi.getUserProfile(user.uid);
    } catch (err) {
      showAlert("error", "No se pudo leer tu perfil. Publicá las reglas de Firestore. " + (err.message || ""));
      setWorkspaceVisible(false);
      return;
    }

    if (!profile || !isStaffRole(profile.role)) {
      sessionReady = false;
      lastAuthUid = null;
      await auth.signOut();
      showAlert("error", "Solo encargados de área y administradores pueden usar la agenda interna.");
      setWorkspaceVisible(false);
      return;
    }

    userProfile = profile;

    if (userEmailEl) userEmailEl.textContent = profile.email || user.email || user.uid;
    if (userRoleEl) {
      userRoleEl.textContent =
        profile.role === "admin" ? " · Administrador" : userArea ? " · " + userArea.nombre : "";
    }

    setWorkspaceVisible(true);
    configureFormForRole();
    sessionReady = true;
    lastAuthUid = user.uid;

    if (profile.role === "encargado") {
      if (!profile.areaSlug) {
        showAlert("error", "Tu usuario no tiene área asignada. Pedile al administrador que te la asigne.");
        return;
      }
      try {
        userArea = await resolveUserArea(profile.areaSlug);
      } catch (err) {
        showAlert("warn", 'No se pudo cargar el área "' + profile.areaSlug + '". ' + (err.message || ""));
        return;
      }
      if (!userArea) {
        showAlert("error", 'No se encontró el área "' + profile.areaSlug + '".');
        return;
      }
      if (userRoleEl) userRoleEl.textContent = " · " + userArea.nombre;
    } else {
      userArea = null;
      try {
        await loadAreasForAdmin();
      } catch (err) {
        showAlert("warn", "No se pudieron cargar las áreas. " + (err.message || ""));
      }
      configureFormForRole();
    }

    try {
      await loadEvents();
    } catch (err) {
      showAlert(
        "warn",
        "Sesión iniciada, pero no se pudo cargar la agenda. Publicá las reglas de Firestore (agenda_eventos). " +
          (err.message || ""),
      );
    }
  }

  async function activateEmbedded(session) {
    if (!session || !session.user || !session.profile) return;
    if (!initClients()) return;

    embedShowAlert = session.showAlert || null;
    currentUser = session.user;
    userProfile = session.profile;
    userArea = session.userArea || null;

    if (currentUser.getIdToken) {
      try {
        await currentUser.getIdToken(true);
      } catch (_tokenErr) {
        /* continuar */
      }
    }

    if (userProfile.role === "encargado") {
      if (!userArea && userProfile.areaSlug) {
        userArea = await resolveUserArea(userProfile.areaSlug);
      }
    } else if (userProfile.role === "admin") {
      userArea = null;
      if (session.areas && session.areas.length) {
        areasCache = session.areas.map(function (a) {
          return window.MuniApi.mapArea(a.slug, a);
        });
        if (areaSelect) {
          areaSelect.innerHTML = areasCache
            .map(function (a) {
              return '<option value="' + escapeHtml(a.slug) + '">' + escapeHtml(a.nombre) + "</option>";
            })
            .join("");
        }
      } else {
        await loadAreasForAdmin();
      }
    }

    configureFormForRole();
    sessionReady = true;
    lastAuthUid = currentUser.uid;

    try {
      await loadEvents();
    } catch (err) {
      showAlert(
        "warn",
        "No se pudo cargar la agenda. Publicá las reglas de Firestore (agenda_eventos). " + (err.message || ""),
      );
    }
  }

  function deactivateEmbedded() {
    sessionReady = false;
    lastAuthUid = null;
    currentUser = null;
    userProfile = null;
    userArea = null;
    eventsById.clear();
    editingId = null;
    if (listEl) listEl.innerHTML = "";
    if (statsEl) statsEl.hidden = true;
    if (remindersEl) {
      remindersEl.hidden = true;
      remindersEl.innerHTML = "";
    }
    if (emptyEl) emptyEl.hidden = false;
    resetForm();
    setFormOpen(false);
  }

  function handleAuthChange(user) {
    if (!initClients()) {
      showAlert("warn", "Configurá js/firebase-config.js antes de usar la agenda.");
      return;
    }

    if (user) {
      clearAuthNullTimer();
      if (sessionReady && user.uid === lastAuthUid && userProfile) {
        currentUser = user;
        setWorkspaceVisible(true);
        return;
      }
      refreshSession(user).catch(function (err) {
        showAlert("error", err.message || "No se pudo verificar la sesión.");
        setWorkspaceVisible(false);
      });
      return;
    }

    scheduleSignedOutCheck();
  }

  function mapEvento(id, data) {
    var inicio = data.fechaInicio || data.fecha || "";
    var fin = data.fechaFin || inicio;
    if (fin < inicio) fin = inicio;
    return {
      id: id,
      titulo: data.titulo || "",
      tipoEvento: data.tipoEvento || "otro",
      fechaInicio: inicio,
      fechaFin: fin,
      fecha: inicio,
      hora: data.hora || "",
      lugar: data.lugar || "",
      descripcion: data.descripcion || "",
      areaSlug: data.areaSlug || "",
      areaNombre: data.areaNombre || "",
      createdBy: data.createdBy || "",
      createdByEmail: data.createdByEmail || "",
      estadoPublicacion: data.estadoPublicacion || "interno",
      solicitaPublicacion: !!data.solicitaPublicacion,
      imagenUrl: data.imagenUrl || "",
    };
  }

  function canEditEvent(ev) {
    if (!userProfile || !ev) return false;
    if (userProfile.role === "admin") return true;
    return ev.createdBy === currentUser.uid;
  }

  function renderEventCard(ev, today) {
    eventsById.set(ev.id, ev);
    var status = eventStatus(ev, today);
    var badge = status
      ? '<span class="muni-agenda-badge ' + status.className + '">' + escapeHtml(status.label) + "</span>"
      : "";

    return (
      '<article class="' +
      cardHighlightClasses(ev, today, "muni-agenda-card") +
      '">' +
      '<div class="muni-agenda-card-date">' +
      '<span class="muni-agenda-card-date-range">' +
      escapeHtml(formatRangoCorto(ev.fechaInicio, ev.fechaFin)) +
      "</span>" +
      (ev.hora ? '<span class="muni-agenda-card-time">' + escapeHtml(ev.hora) + "</span>" : "") +
      "</div>" +
      '<div class="muni-agenda-card-body">' +
      '<div class="muni-agenda-card-top">' +
      '<span class="muni-agenda-card-icon" aria-hidden="true">' +
      tipoIcon(ev.tipoEvento) +
      "</span>" +
      '<span class="muni-agenda-card-area">' +
      escapeHtml(ev.areaNombre || ev.areaSlug) +
      "</span>" +
      badge +
      publicationBadgeHtml(ev) +
      "</div>" +
      "<h3 class=\"muni-agenda-card-title\">" +
      escapeHtml(ev.titulo) +
      "</h3>" +
      '<p class="muni-agenda-card-meta">' +
      escapeHtml(tipoLabel(ev.tipoEvento)) +
      " · " +
      escapeHtml(ev.lugar) +
      "</p>" +
      (ev.descripcion ? '<p class="muni-agenda-card-desc">' + escapeHtml(ev.descripcion) + "</p>" : "") +
      (ev.imagenUrl
        ? '<a class="muni-agenda-card-flyer" href="' +
          escapeHtml(ev.imagenUrl) +
          '" target="_blank" rel="noopener noreferrer"><img src="' +
          escapeHtml(ev.imagenUrl) +
          '" alt="Flyer del evento" loading="lazy" decoding="async" width="72" height="128"></a>'
        : "") +
      (ev.createdByEmail
        ? '<p class="muni-agenda-card-author">Cargado por ' + escapeHtml(ev.createdByEmail) + "</p>"
        : "") +
      publicationActionsHtml(ev) +
      cardActionsHtml(ev) +
      "</div>" +
      "</article>"
    );
  }

  function renderGridTile(ev, today) {
    eventsById.set(ev.id, ev);
    var status = eventStatus(ev, today);
    var badge = status
      ? '<span class="muni-agenda-badge ' + status.className + '">' + escapeHtml(status.label) + "</span>"
      : "";

    return (
      '<article class="' +
      cardHighlightClasses(ev, today, "muni-agenda-tile") +
      '">' +
      '<div class="muni-agenda-tile-hero">' +
      '<span class="muni-agenda-tile-icon" aria-hidden="true">' +
      tipoIcon(ev.tipoEvento) +
      "</span>" +
      '<span class="muni-agenda-tile-type">' +
      escapeHtml(tipoLabel(ev.tipoEvento)) +
      "</span>" +
      badge +
      publicationBadgeHtml(ev) +
      "</div>" +
      '<div class="muni-agenda-tile-body">' +
      "<h3 class=\"muni-agenda-tile-title\">" +
      escapeHtml(ev.titulo) +
      "</h3>" +
      '<p class="muni-agenda-tile-area">' +
      escapeHtml(ev.areaNombre || ev.areaSlug) +
      "</p>" +
      '<ul class="muni-agenda-tile-meta">' +
      "<li><span aria-hidden=\"true\">📅</span> " +
      escapeHtml(formatRangoFecha(ev.fechaInicio, ev.fechaFin, ev.hora)) +
      "</li>" +
      "<li><span aria-hidden=\"true\">📍</span> " +
      escapeHtml(ev.lugar) +
      "</li>" +
      "</ul>" +
      (ev.descripcion ? '<p class="muni-agenda-tile-desc">' + escapeHtml(ev.descripcion) + "</p>" : "") +
      publicationActionsHtml(ev) +
      cardActionsHtml(ev) +
      "</div></article>"
    );
  }

  function renderTimelineView(events, today) {
    var groups = {};
    events.forEach(function (ev) {
      var key = monthGroupKey(ev.fechaInicio);
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });

    var html = "";
    Object.keys(groups)
      .sort(function (a, b) {
        return (groups[a][0].fechaInicio || "").localeCompare(groups[b][0].fechaInicio || "");
      })
      .forEach(function (monthKey) {
        html +=
          '<section class="muni-agenda-month">' +
          "<h3 class=\"muni-agenda-month-title\">" +
          escapeHtml(monthKey) +
          "</h3>" +
          '<div class="muni-agenda-month-cards">' +
          groups[monthKey]
            .map(function (ev) {
              return renderEventCard(ev, today);
            })
            .join("") +
          "</div></section>";
      });
    return html;
  }

  function renderGridView(events, today) {
    return events
      .map(function (ev) {
        return renderGridTile(ev, today);
      })
      .join("");
  }

  function renderCalendarView(events, today) {
    if (!calendarCursor) calendarCursor = currentMonthCursor();
    var y = calendarCursor.y;
    var m = calendarCursor.m;
    var first = new Date(y, m, 1);
    var startOffset = first.getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var cells = [];
    var i;

    for (i = 0; i < startOffset; i += 1) {
      cells.push({ empty: true });
    }
    for (i = 1; i <= daysInMonth; i += 1) {
      cells.push({ y: y, m: m, d: i });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ empty: true });
    }

    var weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    var gridHtml = cells
      .map(function (cell) {
        if (cell.empty) {
          return '<div class="muni-agenda-cal-day muni-agenda-cal-day--pad" aria-hidden="true"></div>';
        }
        var iso = isoForDay(cell.y, cell.m, cell.d);
        var isToday = iso === today;
        var dayEvents = events.filter(function (ev) {
          return eventCoversDay(ev, iso);
        });
        var chips = dayEvents
          .slice(0, 3)
          .map(function (ev) {
            eventsById.set(ev.id, ev);
            return (
              '<button type="button" class="muni-agenda-cal-chip muni-agenda-cal-chip--' +
              escapeHtml(ev.tipoEvento) +
              '" data-agenda-edit="' +
              escapeHtml(ev.id) +
              '" title="' +
              escapeHtml(ev.titulo) +
              '">' +
              escapeHtml(ev.titulo) +
              "</button>"
            );
          })
          .join("");
        var more =
          dayEvents.length > 3
            ? '<span class="muni-agenda-cal-more">+' + (dayEvents.length - 3) + " más</span>"
            : "";

        return (
          '<div class="muni-agenda-cal-day' +
          (isToday ? " muni-agenda-cal-day--today" : "") +
          '">' +
          '<span class="muni-agenda-cal-day-num">' +
          cell.d +
          "</span>" +
          '<div class="muni-agenda-cal-day-events">' +
          chips +
          more +
          "</div></div>"
        );
      })
      .join("");

    return (
      '<div class="muni-agenda-cal">' +
      '<div class="muni-agenda-cal-head">' +
      '<button type="button" class="muni-agenda-cal-nav" data-cal-prev aria-label="Mes anterior">‹</button>' +
      "<h3>" +
      escapeHtml(MESES[m] + " " + y) +
      "</h3>" +
      '<button type="button" class="muni-agenda-cal-nav" data-cal-next aria-label="Mes siguiente">›</button>' +
      '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" data-cal-today>Hoy</button>' +
      "</div>" +
      '<div class="muni-agenda-cal-weekdays">' +
      weekdays
        .map(function (wd) {
          return "<span>" + wd + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="muni-agenda-cal-grid">' +
      gridHtml +
      "</div></div>"
    );
  }

  function renderStats(events, today) {
    if (!statsEl) return;
    var enCurso = 0;
    var prox7 = 0;
    var masAdelante = 0;

    events.forEach(function (ev) {
      if (isEnCurso(ev, today)) {
        enCurso += 1;
        return;
      }
      var d = daysUntilStart(ev.fechaInicio);
      if (d !== null && d >= 0 && d <= 7) prox7 += 1;
      else if (d !== null && d > 7) masAdelante += 1;
    });

    statsEl.hidden = false;
    statsEl.innerHTML =
      '<div class="muni-agenda-stat muni-agenda-stat--curso"><span class="muni-agenda-stat-n">' +
      enCurso +
      '</span><span class="muni-agenda-stat-l">En curso</span></div>' +
      '<div class="muni-agenda-stat muni-agenda-stat--prox"><span class="muni-agenda-stat-n">' +
      prox7 +
      '</span><span class="muni-agenda-stat-l">Próximos 7 días</span></div>' +
      '<div class="muni-agenda-stat muni-agenda-stat--later"><span class="muni-agenda-stat-n">' +
      masAdelante +
      '</span><span class="muni-agenda-stat-l">Más adelante</span></div>';
  }

  function renderReminders(events, today) {
    if (!remindersEl) return;

    var items = events.filter(function (ev) {
      if (isEnCurso(ev, today)) return false;
      var d = daysUntilStart(ev.fechaInicio);
      return d !== null && d >= 1 && d <= 7;
    });

    if (!items.length) {
      remindersEl.hidden = true;
      remindersEl.innerHTML = "";
      return;
    }

    remindersEl.hidden = false;
    remindersEl.innerHTML =
      '<div class="muni-agenda-reminders-head">' +
      "<h2>⏰ Recordatorios</h2>" +
      "<p>Actividades que arrancan en los próximos 7 días. El aviso “Falta 1 semana” aparece exactamente 7 días antes.</p>" +
      "</div>" +
      '<ul class="muni-agenda-reminders-list">' +
      items
        .map(function (ev) {
          var d = daysUntilStart(ev.fechaInicio);
          var aviso =
            d === 7
              ? "Falta 1 semana"
              : d === 1
                ? "Mañana"
                : "En " + d + " días";
          return (
            "<li>" +
            '<span class="muni-agenda-reminder-when">' +
            escapeHtml(aviso) +
            "</span>" +
            "<strong>" +
            escapeHtml(ev.titulo) +
            "</strong>" +
            '<span class="muni-agenda-reminder-meta">' +
            escapeHtml(ev.areaNombre) +
            " · " +
            escapeHtml(formatRangoCorto(ev.fechaInicio, ev.fechaFin)) +
            (ev.hora ? " · " + escapeHtml(ev.hora) : "") +
            "</span>" +
            "</li>"
          );
        })
        .join("") +
      "</ul>";
  }

  function renderEvents(events) {
    if (!listEl || !emptyEl) return;
    eventsCache = events.slice();
    eventsById.clear();
    var today = todayIso();

    if (!events.length) {
      listEl.innerHTML = "";
      emptyEl.hidden = false;
      if (statsEl) statsEl.hidden = true;
      if (remindersEl) remindersEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    renderStats(events, today);
    renderReminders(events, today);
    updateListContainerClass();

    if (viewMode === "grid") {
      listEl.innerHTML = renderGridView(events, today);
      return;
    }
    if (viewMode === "calendar") {
      listEl.innerHTML = renderCalendarView(events, today);
      return;
    }
    listEl.innerHTML = renderTimelineView(events, today);
  }

  async function loadEvents() {
    if (!db) return;
    var snap = await db.collection("agenda_eventos").orderBy("fecha", "asc").limit(100).get();
    var today = todayIso();
    var events = [];
    snap.forEach(function (doc) {
      var ev = mapEvento(doc.id, doc.data());
      if (ev.fechaFin >= today) events.push(ev);
    });
    events.sort(function (a, b) {
      var da = a.fechaInicio + (a.hora || "");
      var dbv = b.fechaInicio + (b.hora || "");
      return da.localeCompare(dbv);
    });
    renderEvents(events);
  }

  function resetForm() {
    editingId = null;
    pendingImagenUrl = "";
    if (eventForm) eventForm.reset();
    if (visiblePublicoInput) visiblePublicoInput.checked = false;
    showImagenPreview("");
    if (imagenInput) imagenInput.value = "";
    if (formTitle) formTitle.textContent = "Nuevo evento";
    if (cancelEditBtn) cancelEditBtn.hidden = true;
    if (document.getElementById("agenda-submit")) {
      document.getElementById("agenda-submit").textContent = "Guardar y avisar";
    }
    configureFormForRole();
  }

  function fillForm(ev) {
    editingId = ev.id;
    setFormOpen(true);
    if (formTitle) formTitle.textContent = "Editar evento";
    if (cancelEditBtn) cancelEditBtn.hidden = false;
    if (document.getElementById("agenda-submit")) {
      document.getElementById("agenda-submit").textContent = "Guardar cambios";
    }
    eventForm.titulo.value = ev.titulo;
    eventForm.tipoEvento.value = ev.tipoEvento;
    eventForm.fechaInicio.value = ev.fechaInicio;
    eventForm.fechaFin.value = ev.fechaFin !== ev.fechaInicio ? ev.fechaFin : "";
    eventForm.hora.value = ev.hora || "";
    eventForm.lugar.value = ev.lugar;
    eventForm.descripcion.value = ev.descripcion || "";
    if (userProfile.role === "admin" && areaSelect) {
      areaSelect.value = ev.areaSlug;
    }
    pendingImagenUrl = ev.imagenUrl || "";
    showImagenPreview(pendingImagenUrl);
    if (visiblePublicoInput) {
      visiblePublicoInput.checked =
        ev.estadoPublicacion === "publicado" ||
        ev.estadoPublicacion === "pendiente" ||
        !!ev.solicitaPublicacion;
    }
    if (imagenInput) imagenInput.value = "";
  }

  async function loadEncargadoPhones(excludeUid) {
    var snap = await db.collection("users").where("role", "==", "encargado").get();
    var phones = [];
    snap.forEach(function (doc) {
      if (doc.id === excludeUid) return;
      var data = doc.data();
      var tel = normalizePhone(data.telefonoWhatsapp || "");
      if (tel.length >= 10) phones.push(tel);
    });
    return phones;
  }

  async function notifyEncargadosWhatsApp(evento) {
    var cfg = getCampanaConfig();
    if (!cfg.apiBase) return { skipped: true };

    var telefonos = await loadEncargadoPhones(currentUser.uid);
    if (!telefonos.length) return { aviso: "WhatsApp: ningún otro encargado tiene teléfono cargado." };

    var myPhone = normalizePhone(userProfile.telefonoWhatsapp || "");
    var res = await fetch(campanaApiUrl("/api/public/agenda-notificar"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telefonos: telefonos,
        excluirTelefono: myPhone,
        areaNombre: evento.areaNombre,
        tipoEvento: tipoLabel(evento.tipoEvento),
        titulo: evento.titulo,
        fecha: formatRangoCorto(evento.fechaInicio, evento.fechaFin),
        hora: evento.hora || "",
        lugar: evento.lugar,
      }),
    });

    var data = await res.json();
    if (!res.ok || !data.ok) {
      return { error: (data && data.error) || "WhatsApp no disponible." };
    }
    return data;
  }

  async function notifyStaffAboutEvent(evento) {
    var summary = { inApp: 0, push: null, whatsapp: null };

    if (window.MuniStaffNotify && window.MuniStaffNotify.notifyAgendaEvent) {
      try {
        summary.staff = await window.MuniStaffNotify.notifyAgendaEvent({
          db: db,
          authUser: currentUser,
          userProfile: userProfile,
          excludeUid: currentUser.uid,
          evento: evento,
          helpers: {
            tipoLabel: tipoLabel,
            formatRangoCorto: formatRangoCorto,
          },
        });
        if (summary.staff && summary.staff.inApp) summary.inApp = summary.staff.inApp;
        if (summary.staff && summary.staff.error) summary.staffError = summary.staff.error;
      } catch (err) {
        summary.staffError = (err && err.message) || "No se pudieron crear avisos en el panel.";
      }
    } else {
      summary.staffError = "Módulo de avisos del panel no cargado.";
    }

    try {
      summary.whatsapp = await notifyEncargadosWhatsApp(evento);
    } catch (_waErr) {
      summary.whatsapp = { skipped: true };
    }

    return summary;
  }

  function showNotifyResult(payload, summary) {
    summary = summary || {};
    var parts = ["Evento guardado."];

    if (summary.inApp > 0) {
      parts.push("Aviso en el panel para " + summary.inApp + " usuario(s).");
    } else if (summary.staff && summary.staff.aviso) {
      parts.push(summary.staff.aviso);
    } else if (summary.staffError) {
      parts.push(summary.staffError);
    }

    if (summary.staff && summary.staff.push) {
      var push = summary.staff.push;
      if (push.enviados > 0) {
        parts.push("Push enviado a " + push.enviados + " dispositivo(s).");
      } else if (push.error) {
        parts.push("Push: " + push.error);
      } else if (push.sinToken > 0 && !push.enviados) {
        parts.push("Push: los demás usuarios aún no activaron notificaciones en su dispositivo.");
      }
    }

    if (summary.whatsapp && summary.whatsapp.enviados > 0) {
      parts.push("WhatsApp enviado a " + summary.whatsapp.enviados + " encargado(s).");
    }

    if (payload.estadoPublicacion === "pendiente") {
      parts.push("Quedó pendiente de aprobación para el portal.");
    } else if (payload.estadoPublicacion === "publicado" && userProfile.role === "admin") {
      parts.push("Visible en la agenda pública.");
    }

    var type = summary.staffError ? "warn" : "ok";
    showAlert(type, parts.join(" "));
  }

  async function notifyEncargados(evento, isNew) {
    if (!isNew) return { skipped: true };
    return notifyStaffAboutEvent(evento);
  }

  async function saveEvent(e) {
    e.preventDefault();
    hideAlert();
    if (!db || !currentUser || !userProfile) return;

    var fd = new FormData(eventForm);
    var fechaInicio = String(fd.get("fechaInicio") || "");
    var fechaFin = String(fd.get("fechaFin") || "").trim() || fechaInicio;

    if (!fechaInicio) {
      showAlert("error", "Indicá la fecha de inicio.");
      return;
    }
    if (fechaFin < fechaInicio) {
      showAlert("error", "La fecha de finalización no puede ser anterior al inicio.");
      return;
    }

    var areaSlug;
    var areaNombre;

    if (userProfile.role === "admin") {
      areaSlug = String(fd.get("areaSlug") || "").trim();
      var area = areasCache.find(function (a) {
        return a.slug === areaSlug;
      });
      areaNombre = area ? area.nombre : areaSlug;
    } else {
      areaSlug = userProfile.areaSlug;
      areaNombre = userArea ? userArea.nombre : areaSlug;
    }

    var payload = {
      titulo: String(fd.get("titulo") || "").trim(),
      tipoEvento: String(fd.get("tipoEvento") || "otro"),
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      fecha: fechaInicio,
      hora: String(fd.get("hora") || "").trim(),
      lugar: String(fd.get("lugar") || "").trim(),
      descripcion: String(fd.get("descripcion") || "").trim(),
      areaSlug: areaSlug,
      areaNombre: areaNombre,
      createdBy: currentUser.uid,
      createdByEmail: userProfile.email || currentUser.email || "",
      updatedAt: window.MuniFirebase.serverTimestamp(),
    };

    var existing = editingId ? eventsById.get(editingId) : null;
    var visiblePublico = !!(visiblePublicoInput && visiblePublicoInput.checked);
    Object.assign(payload, resolvePublicationFields(visiblePublico, existing));

    if (imagenInput && imagenInput.files && imagenInput.files[0]) {
      payload.imagenUrl = await uploadAgendaImage(imagenInput.files[0], currentUser.uid);
    } else if (pendingImagenUrl) {
      payload.imagenUrl = pendingImagenUrl;
    } else if (existing && existing.imagenUrl) {
      payload.imagenUrl = existing.imagenUrl;
    } else {
      payload.imagenUrl = "";
    }

    var submitBtn = document.getElementById("agenda-submit");
    if (submitBtn) submitBtn.disabled = true;

    try {
      var isNew = !editingId;
      if (editingId) {
        await db.collection("agenda_eventos").doc(editingId).update(payload);
        if (payload.estadoPublicacion === "pendiente" && userProfile.role !== "admin") {
          showAlert("ok", "Evento actualizado. Quedó pendiente de aprobación para el portal.");
        } else if (payload.estadoPublicacion === "publicado" && userProfile.role === "admin") {
          showAlert("ok", "Evento actualizado y visible en la agenda pública.");
        } else {
          showAlert("ok", "Evento actualizado.");
        }
      } else {
        payload.createdAt = window.MuniFirebase.serverTimestamp();
        await db.collection("agenda_eventos").doc().set(payload);
        var notifySummary = await notifyStaffAboutEvent(payload);
        showNotifyResult(payload, notifySummary);
      }
      resetForm();
      setFormOpen(false);
      await loadEvents();
    } catch (err) {
      showAlert("error", err.message || "No se pudo guardar el evento.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function approvePublication(id) {
    if (!db || !id || !userProfile || userProfile.role !== "admin") return;
    try {
      await db.collection("agenda_eventos").doc(id).update({
        estadoPublicacion: "publicado",
        solicitaPublicacion: true,
        publicadoAt: window.MuniFirebase.serverTimestamp(),
        updatedAt: window.MuniFirebase.serverTimestamp(),
      });
      showAlert("ok", "Evento publicado en la agenda del portal.");
      await loadEvents();
    } catch (err) {
      showAlert("error", err.message || "No se pudo aprobar la publicación.");
    }
  }

  async function rejectPublication(id) {
    if (!db || !id || !userProfile || userProfile.role !== "admin") return;
    if (!window.confirm("¿Rechazar la publicación de este evento en el portal?")) return;
    try {
      await db.collection("agenda_eventos").doc(id).update({
        estadoPublicacion: "rechazado",
        solicitaPublicacion: false,
        rechazadoAt: window.MuniFirebase.serverTimestamp(),
        updatedAt: window.MuniFirebase.serverTimestamp(),
      });
      showAlert("ok", "Publicación rechazada.");
      await loadEvents();
    } catch (err) {
      showAlert("error", err.message || "No se pudo rechazar la publicación.");
    }
  }

  async function deleteEvent(id) {
    if (!db || !id) return;
    var ev = eventsById.get(id);
    if (!ev || !canEditEvent(ev)) return;
    if (!window.confirm("¿Eliminar este evento de la agenda interna?")) return;

    try {
      await db.collection("agenda_eventos").doc(id).delete();
      showAlert("ok", "Evento eliminado.");
      if (editingId === id) {
        resetForm();
        setFormOpen(false);
      }
      await loadEvents();
    } catch (err) {
      showAlert("error", err.message || "No se pudo eliminar.");
    }
  }

  if (fechaInicioInput && fechaFinInput) {
    fechaInicioInput.addEventListener("change", function () {
      if (!fechaFinInput.value || fechaFinInput.value < fechaInicioInput.value) {
        fechaFinInput.min = fechaInicioInput.value;
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();
      if (!initClients()) {
        showAlert("warn", "Configurá Firebase en js/firebase-config.js");
        return;
      }
      var fd = new FormData(loginForm);
      var submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      try {
        var cred = await auth.signInWithEmailAndPassword(
          String(fd.get("email") || "").trim(),
          String(fd.get("password") || ""),
        );
        await refreshSession(cred.user || auth.currentUser);
      } catch (err) {
        var code = err && err.code ? err.code : "";
        var msg =
          code === "auth/invalid-credential" || code === "auth/wrong-password"
            ? "Email o contraseña incorrectos."
            : err.message || "No se pudo iniciar sesión.";
        showAlert("error", msg);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      sessionReady = false;
      lastAuthUid = null;
      if (auth) await auth.signOut();
    });
  }

  if (eventForm) {
    eventForm.addEventListener("submit", saveEvent);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", function () {
      resetForm();
      setFormOpen(false);
    });
  }

  if (closeFormBtn) {
    closeFormBtn.addEventListener("click", function () {
      if (!editingId) resetForm();
      setFormOpen(false);
    });
  }

  if (toggleFormBtn) {
    toggleFormBtn.addEventListener("click", function () {
      var open = formPanel && formPanel.hidden;
      if (open) {
        resetForm();
        setFormOpen(true);
      } else {
        setFormOpen(false);
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      loadEvents().catch(function (err) {
        showAlert("error", err.message || "No se pudo actualizar.");
      });
    });
  }

  if (listEl) {
    listEl.addEventListener("click", function (e) {
      if (e.target.closest("[data-cal-prev]")) {
        calendarCursor = addMonths(calendarCursor || currentMonthCursor(), -1);
        renderEvents(eventsCache);
        return;
      }
      if (e.target.closest("[data-cal-next]")) {
        calendarCursor = addMonths(calendarCursor || currentMonthCursor(), 1);
        renderEvents(eventsCache);
        return;
      }
      if (e.target.closest("[data-cal-today]")) {
        calendarCursor = currentMonthCursor();
        renderEvents(eventsCache);
        return;
      }

      var editBtn = e.target.closest("[data-agenda-edit]");
      if (editBtn) {
        var ev = eventsById.get(editBtn.getAttribute("data-agenda-edit"));
        if (ev) fillForm(ev);
        return;
      }
      var approveBtn = e.target.closest("[data-agenda-approve]");
      if (approveBtn) {
        approvePublication(approveBtn.getAttribute("data-agenda-approve"));
        return;
      }
      var rejectBtn = e.target.closest("[data-agenda-reject]");
      if (rejectBtn) {
        rejectPublication(rejectBtn.getAttribute("data-agenda-reject"));
        return;
      }
      var delBtn = e.target.closest("[data-agenda-delete]");
      if (delBtn) {
        deleteEvent(delBtn.getAttribute("data-agenda-delete"));
      }
    });
  }

  window.MuniAgenda = {
    activate: function (session) {
      return activateEmbedded(session);
    },
    deactivate: deactivateEmbedded,
  };

  document.addEventListener("DOMContentLoaded", function () {
    viewMode = getStoredViewMode();
    calendarCursor = currentMonthCursor();
    bindViewSwitch();
    updateViewButtons();
    updateListContainerClass();

    if (window.MUNI_AGENDA_EMBED) return;
    if (!initClients()) {
      showAlert("warn", "Configurá js/firebase-config.js para usar la agenda interna.");
      return;
    }
    auth.onAuthStateChanged(handleAuthChange);
  });
})();
