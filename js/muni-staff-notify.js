(function () {
  "use strict";

  var state = {
    db: null,
    auth: null,
    uid: null,
    profile: null,
    mountEl: null,
    unsub: null,
    items: [],
    pushReady: false,
    messaging: null,
    outsideClickBound: false,
    mountDelegation: false,
    panelOpen: false,
    snapshotError: "",
  };

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getConfig() {
    return window.FIREBASE_CONFIG || {};
  }

  function getVapidKey() {
    var cfg = getConfig();
    return String(cfg.vapidKey || "").trim();
  }

  function hashToken(token) {
    var str = String(token || "");
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function formatWhen(ts) {
    if (!ts) return "";
    var date;
    if (ts.toDate) date = ts.toDate();
    else if (ts.seconds) date = new Date(ts.seconds * 1000);
    else date = new Date(ts);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString("es-AR", {
      timeZone: "America/Argentina/Cordoba",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function panelBaseUrl() {
    var path = window.location.pathname || "";
    if (path.indexOf("admin.html") !== -1) return "admin.html#seccion-agenda";
    return "encargado.html#seccion-agenda";
  }

  function panelUrlForRole(role) {
    if (role === "admin") return "admin.html#seccion-agenda";
    return "encargado.html#seccion-agenda";
  }

  async function loadStaffRecipients(db, excludeUid) {
    var recipients = [];
    var roles = ["encargado", "admin"];
    for (var r = 0; r < roles.length; r++) {
      var snap = await db.collection("users").where("role", "==", roles[r]).get();
      snap.forEach(function (doc) {
        if (doc.id === excludeUid) return;
        var data = doc.data() || {};
        recipients.push({
          id: doc.id,
          role: data.role || roles[r],
        });
      });
    }
    return recipients;
  }

  async function createInAppNotifications(db, recipients, payload) {
    if (!recipients.length) return 0;
    var batch = db.batch();
    var FieldValue = window.firebase.firestore.FieldValue;
    var count = 0;

    recipients.forEach(function (recipient) {
      var ref = db.collection("staff_notificaciones").doc();
      batch.set(ref, {
        userId: recipient.id,
        titulo: payload.titulo,
        mensaje: payload.mensaje,
        url: panelUrlForRole(recipient.role),
        tipo: payload.tipo || "general",
        leida: false,
        createdByUid: payload.createdByUid || "",
        createdByEmail: payload.createdByEmail || "",
        createdAt: FieldValue.serverTimestamp(),
      });
      count += 1;
    });

    await batch.commit();
    return count;
  }

  async function sendPushNotifications(authUser, payload) {
    if (!authUser || !authUser.getIdToken) return { skipped: true, reason: "no-auth" };
    try {
      var idToken = await authUser.getIdToken();
      var res = await fetch("/.netlify/functions/staff-notify-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + idToken,
        },
        body: JSON.stringify({
          recipientIds: payload.recipientIds,
          title: payload.titulo,
          body: payload.mensaje,
          url: payload.url,
        }),
      });
      var data = await res.json();
      if (!res.ok) {
        return { ok: false, error: (data && data.error) || "Push no disponible (" + res.status + ")." };
      }
      return data;
    } catch (err) {
      return { ok: false, error: (err && err.message) || "Error al enviar push." };
    }
  }

  function buildAgendaMessage(evento, helpers) {
    var parts = [];
    if (evento.areaNombre) parts.push(evento.areaNombre);
    if (helpers.tipoLabel) parts.push(helpers.tipoLabel(evento.tipoEvento));
    if (evento.titulo) parts.push('"' + evento.titulo + '"');
    if (helpers.formatRangoCorto) parts.push(helpers.formatRangoCorto(evento.fechaInicio, evento.fechaFin));
    if (evento.hora) parts.push("Hora: " + evento.hora);
    if (evento.lugar) parts.push("Lugar: " + evento.lugar);
    return parts.join(" · ");
  }

  async function notifyAgendaEvent(options) {
    options = options || {};
    var db = options.db || state.db;
    var authUser = options.authUser;
    var excludeUid = options.excludeUid || (authUser && authUser.uid);
    var evento = options.evento || {};
    var helpers = options.helpers || {};

    if (!db || !excludeUid) return { ok: false, error: "Sin conexión." };

    var recipients = await loadStaffRecipients(db, excludeUid);
    if (!recipients.length) {
      return { ok: true, inApp: 0, aviso: "No hay otros usuarios del staff para avisar." };
    }

    var recipientIds = recipients.map(function (r) {
      return r.id;
    });

    var titulo = "Nuevo evento — " + (evento.areaNombre || "Agenda");
    var mensaje = buildAgendaMessage(evento, helpers);
    var meta = {
      titulo: titulo,
      mensaje: mensaje,
      tipo: "agenda_evento",
      createdByUid: excludeUid,
      createdByEmail: (options.userProfile && options.userProfile.email) || (authUser && authUser.email) || "",
    };

    var inApp = 0;
    try {
      inApp = await createInAppNotifications(db, recipients, meta);
    } catch (err) {
      console.warn("createInAppNotifications", err);
      return {
        ok: false,
        error: (err && err.message) || "No se pudieron guardar los avisos en Firestore.",
      };
    }

    var push = await sendPushNotifications(authUser, {
      recipientIds: recipientIds,
      titulo: titulo,
      mensaje: mensaje,
      url: panelUrlForRole("admin"),
    });

    return { ok: true, inApp: inApp, push: push, recipientIds: recipientIds.length };
  }

  function unreadCount() {
    var n = 0;
    state.items.forEach(function (item) {
      if (!item.leida) n += 1;
    });
    return n;
  }

  function isPushPromptDismissed() {
    if (!state.uid) return false;
    try {
      return localStorage.getItem("muni-staff-push-ready:" + state.uid) === "1";
    } catch (_err) {
      return false;
    }
  }

  function markPushPromptDone() {
    state.pushReady = true;
    if (state.uid) {
      try {
        localStorage.setItem("muni-staff-push-ready:" + state.uid, "1");
      } catch (_err) {
        /* ignore */
      }
    }
  }

  function shouldShowPushPrompt() {
    return !state.pushReady && !isPushPromptDismissed();
  }

  function hidePushRow() {
    var row = document.getElementById("muni-staff-notify-push-row");
    if (!row) return;
    row.hidden = true;
    row.innerHTML = "";
  }

  function setPanelOpen(open) {
    state.panelOpen = !!open;
    var panel = document.getElementById("muni-staff-notify-panel");
    var toggle = document.getElementById("muni-staff-notify-toggle");
    var backdrop = document.getElementById("muni-staff-notify-backdrop");
    var root = state.mountEl && state.mountEl.querySelector(".muni-staff-notify");

    if (!panel) return;

    panel.hidden = !state.panelOpen;
    if (toggle) toggle.setAttribute("aria-expanded", state.panelOpen ? "true" : "false");
    if (backdrop) backdrop.hidden = !state.panelOpen;
    if (root) root.classList.toggle("is-open", state.panelOpen);
    document.body.classList.toggle("muni-staff-notify-open", state.panelOpen);
  }

  function closePanel() {
    setPanelOpen(false);
  }

  function setupMountDelegation() {
    if (!state.mountEl || state.mountDelegation) return;
    state.mountDelegation = true;

    state.mountEl.addEventListener("click", function (e) {
      if (e.target.closest("#muni-staff-notify-toggle")) {
        e.stopPropagation();
        setPanelOpen(!state.panelOpen);
        return;
      }
      if (e.target.closest("#muni-staff-notify-close")) {
        e.stopPropagation();
        closePanel();
        return;
      }
      if (e.target.closest("#muni-staff-notify-backdrop")) {
        closePanel();
        return;
      }
      if (e.target.closest("#muni-staff-notify-mark-all")) {
        markAllRead();
        return;
      }
      if (e.target.closest("#muni-staff-notify-enable-push")) {
        enablePushNotifications();
        return;
      }
      var itemBtn = e.target.closest("[data-notif-id]");
      if (itemBtn) {
        var id = itemBtn.getAttribute("data-notif-id");
        var item = state.items.find(function (n) {
          return n.id === id;
        });
        if (item && !item.leida) markRead(id);
        if (item && item.url) {
          if (item.url.indexOf("#") !== -1) {
            window.location.hash = item.url.split("#")[1];
          } else {
            window.location.href = item.url;
          }
        }
        closePanel();
      }
    });

    if (!state.outsideClickBound) {
      state.outsideClickBound = true;
      document.addEventListener("click", function (e) {
        if (!state.panelOpen) return;
        if (state.mountEl && !state.mountEl.contains(e.target)) {
          closePanel();
        }
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closePanel();
      });
    }
  }

  function renderBell() {
    if (!state.mountEl) return;
    var count = unreadCount();
    var keepOpen = state.panelOpen;
    var html =
      '<div class="muni-staff-notify">' +
      '<button type="button" class="muni-staff-notify-backdrop" id="muni-staff-notify-backdrop" hidden aria-hidden="true" tabindex="-1"></button>' +
      '<button type="button" class="muni-staff-notify-btn" id="muni-staff-notify-toggle" aria-expanded="false" aria-haspopup="true" aria-label="Avisos del panel">' +
      '<span class="muni-staff-notify-icon" aria-hidden="true">🔔</span>' +
      (count > 0
        ? '<span class="muni-staff-notify-badge" aria-label="' + count + ' sin leer">' + count + "</span>"
        : "") +
      "</button>" +
      '<div class="muni-staff-notify-panel" id="muni-staff-notify-panel" hidden>' +
      '<div class="muni-staff-notify-panel-head">' +
      "<strong>Avisos</strong>" +
      '<div class="muni-staff-notify-panel-actions">' +
      '<button type="button" class="muni-staff-notify-mark-all" id="muni-staff-notify-mark-all">Marcar leídos</button>' +
      '<button type="button" class="muni-staff-notify-close" id="muni-staff-notify-close" aria-label="Cerrar avisos">×</button>' +
      "</div></div>" +
      (shouldShowPushPrompt()
        ? '<div class="muni-staff-notify-push-row" id="muni-staff-notify-push-row"></div>'
        : "") +
      '<ul class="muni-staff-notify-list" id="muni-staff-notify-list"></ul>' +
      "</div></div>";

    state.mountEl.innerHTML = html;
    setPanelOpen(keepOpen);

    renderList();
    renderPushRow();
  }

  function renderPushRow() {
    var row = document.getElementById("muni-staff-notify-push-row");
    if (!row) return;

    if (!shouldShowPushPrompt()) {
      hidePushRow();
      return;
    }

    row.hidden = false;

    if (!getVapidKey()) {
      row.innerHTML =
        '<p class="muni-staff-notify-push-hint">Push: falta configurar <code>vapidKey</code> en firebase-config.js (Firebase → Cloud Messaging).</p>';
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      row.innerHTML = '<p class="muni-staff-notify-push-hint">Este navegador no admite notificaciones push.</p>';
      return;
    }

    row.innerHTML =
      '<button type="button" class="muni-btn muni-btn--ghost muni-btn--sm" id="muni-staff-notify-enable-push">Activar notificaciones push</button>' +
      '<p class="muni-staff-notify-push-hint">Recibí avisos aunque no tengas el panel abierto.</p>';
  }

  function renderList() {
    var list = document.getElementById("muni-staff-notify-list");
    if (!list) return;

    if (!state.items.length) {
      if (state.snapshotError) {
        list.innerHTML =
          '<li class="muni-staff-notify-empty muni-staff-notify-error">' +
          escapeHtml(state.snapshotError) +
          "</li>";
      } else {
        list.innerHTML = '<li class="muni-staff-notify-empty">No tenés avisos todavía.</li>';
      }
      return;
    }

    list.innerHTML = state.items
      .map(function (item) {
        return (
          '<li class="muni-staff-notify-item' +
          (item.leida ? "" : " is-unread") +
          '">' +
          '<button type="button" class="muni-staff-notify-item-btn" data-notif-id="' +
          escapeHtml(item.id) +
          '">' +
          "<strong>" +
          escapeHtml(item.titulo) +
          "</strong>" +
          "<span>" +
          escapeHtml(item.mensaje) +
          "</span>" +
          '<time datetime="">' +
          escapeHtml(formatWhen(item.createdAt)) +
          "</time>" +
          "</button></li>"
        );
      })
      .join("");

  }

  async function markRead(id) {
    if (!state.db || !id) return;
    try {
      await state.db.collection("staff_notificaciones").doc(id).update({ leida: true });
    } catch (err) {
      console.warn("markRead", err);
    }
  }

  async function markAllRead() {
    if (!state.db) return;
    var batch = state.db.batch();
    var count = 0;
    state.items.forEach(function (item) {
      if (!item.leida) {
        batch.update(state.db.collection("staff_notificaciones").doc(item.id), { leida: true });
        count += 1;
      }
    });
    if (count) {
      try {
        await batch.commit();
      } catch (err) {
        console.warn("markAllRead", err);
      }
    }
  }

  function sortNotifications(items) {
    return items.sort(function (a, b) {
      var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
  }

  function applyNotificationSnapshot(snap) {
    state.snapshotError = "";
    state.items = [];
    snap.forEach(function (doc) {
      var data = doc.data();
      state.items.push({
        id: doc.id,
        titulo: data.titulo || "",
        mensaje: data.mensaje || "",
        url: data.url || "",
        leida: !!data.leida,
        createdAt: data.createdAt,
      });
    });
    state.items = sortNotifications(state.items).slice(0, 25);
    renderBell();
  }

  function subscribeNotifications() {
    if (state.unsub) {
      state.unsub();
      state.unsub = null;
    }
    if (!state.db || !state.uid) return;

    state.unsub = state.db
      .collection("staff_notificaciones")
      .where("userId", "==", state.uid)
      .limit(50)
      .onSnapshot(
        function (snap) {
          applyNotificationSnapshot(snap);
        },
        function (err) {
          console.warn("staff_notificaciones snapshot", err);
          state.snapshotError =
            (err && err.message) ||
            "No se pudieron cargar los avisos. Publicá las reglas de Firestore en Firebase Console.";
          renderBell();
        }
      );
  }

  async function saveFcmToken(token) {
    if (!state.db || !state.uid || !token) return;
    var docId = hashToken(token);
    await state.db
      .collection("users")
      .doc(state.uid)
      .collection("fcm_tokens")
      .doc(docId)
      .set(
        {
          token: token,
          updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
          userAgent: navigator.userAgent ? String(navigator.userAgent).slice(0, 240) : "",
        },
        { merge: true }
      );
  }

  async function enablePushNotifications() {
    if (!getVapidKey()) {
      alert("Falta configurar la clave VAPID en js/firebase-config.js (Firebase Console → Cloud Messaging).");
      return;
    }
    if (!state.auth || !state.uid) return;

    try {
      var permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Necesitamos permiso para enviarte notificaciones push.");
        return;
      }

      if (!window.firebase.messaging) {
        await loadMessagingScript();
      }

      var app = window.MuniFirebase && window.MuniFirebase.init && window.MuniFirebase.init();
      if (!app) throw new Error("Firebase no inicializado.");

      var registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      state.messaging = firebase.messaging(app);
      var token = await state.messaging.getToken({
        vapidKey: getVapidKey(),
        serviceWorkerRegistration: registration,
      });

      if (!token) throw new Error("No se obtuvo token push.");

      await saveFcmToken(token);
      markPushPromptDone();
      hidePushRow();
      closePanel();

      state.messaging.onMessage(function (payload) {
        var n = payload.notification || {};
        var d = payload.data || {};
        if (Notification.permission === "granted") {
          new Notification(n.title || d.title || "Portal municipal", {
            body: n.body || d.body || "",
            icon: "/assets/logo-municipalidad.png",
          });
        }
      });
    } catch (err) {
      console.warn("enablePushNotifications", err);
      alert((err && err.message) || "No se pudieron activar las notificaciones push.");
    }
  }

  function loadMessagingScript() {
    return new Promise(function (resolve, reject) {
      if (window.firebase && window.firebase.messaging) {
        resolve();
        return;
      }
      var script = document.createElement("script");
      script.src = "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function detectExistingPushToken() {
    if (isPushPromptDismissed()) {
      state.pushReady = true;
      return;
    }
    if (!getVapidKey() || !state.db || !state.uid) return;
    try {
      var snap = await state.db
        .collection("users")
        .doc(state.uid)
        .collection("fcm_tokens")
        .limit(1)
        .get();
      if (!snap.empty) {
        markPushPromptDone();
      } else {
        state.pushReady = false;
      }
    } catch (_err) {
      state.pushReady = false;
    }
  }

  function teardown() {
    if (state.unsub) {
      state.unsub();
      state.unsub = null;
    }
    closePanel();
    if (state.mountEl) state.mountEl.innerHTML = "";
    state.db = null;
    state.auth = null;
    state.uid = null;
    state.profile = null;
    state.items = [];
    state.pushReady = false;
    state.snapshotError = "";
    state.panelOpen = false;
    state.outsideClickBound = false;
  }

  async function activate(options) {
    options = options || {};
    state.db = options.db;
    state.auth = options.auth;
    state.uid = options.uid;
    state.profile = options.profile;
    state.mountEl = options.mountEl;

    if (!state.db || !state.uid || !state.mountEl) return;

    setupMountDelegation();
    await detectExistingPushToken();
    renderBell();
    subscribeNotifications();
  }

  window.MuniStaffNotify = {
    activate: activate,
    teardown: teardown,
    notifyAgendaEvent: notifyAgendaEvent,
    enablePushNotifications: enablePushNotifications,
  };
})();
