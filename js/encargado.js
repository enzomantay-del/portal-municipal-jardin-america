(function () {
  "use strict";

  var auth = null;
  var db = null;

  var alertBox = document.getElementById("encargado-alert");
  var loginForm = document.getElementById("encargado-login-form");
  var authPanel = document.getElementById("encargado-auth");
  var workspace = document.getElementById("encargado-workspace");
  var authEmail = document.getElementById("encargado-email");
  var logoutBtn = document.getElementById("encargado-logout");
  var areaLabel = document.getElementById("encargado-area-name");
  var heroBadge = document.getElementById("encargado-hero-badge");
  var heroAreaEl = document.getElementById("encargado-hero-area");
  var heroIconEl = document.getElementById("encargado-hero-icon");
  var heroLeadEl = document.getElementById("encargado-hero-lead");
  var mapSectionEl = document.getElementById("seccion-mapa");
  var mapNavLink = document.getElementById("encargado-nav-mapa");
  var mapHeroStep = document.getElementById("encargado-hero-step-mapa");

  var MAP_MANAGER_AREAS = ["obras-publicas", "obras-privadas"];
  var encargadoMapaBound = false;

  var AREA_ICONS = {
    "obras-publicas": "🏗️",
    salud: "🏥",
    cultura: "🎭",
    deportes: "⚽",
    turismo: "🧳",
    ambiente: "🌿",
    juventud: "🎓",
    zoonosis: "🐾",
    "accion-social": "🤝",
    "oficina-de-trabajo": "💼",
    transito: "🚦",
    "defensa-civil": "🛡️",
    rentas: "📋",
    intendencia: "🏛️",
    "concejo-deliberante": "⚖️",
    "obras-privadas": "🏠",
    prensa: "📻",
    bromatologia: "🧪",
    "agro-y-produccion": "🌾",
  };

  var currentUser = null;
  var userProfile = null;
  var userArea = null;
  var sessionToken = 0;
  var lastAuthUid = null;
  var sessionReady = false;
  var authNullTimer = null;
  var AUTH_NULL_DELAY_MS = 1200;
  var manualLogout = false;

  function initClients() {
    if (!window.MuniFirebase || !window.MuniFirebase.isConfigured()) return false;
    window.MuniFirebase.init();
    auth = window.MuniFirebase.auth();
    db = window.MuniFirebase.db();
    return !!(auth && db);
  }

  function showAlert(type, message, asHtml) {
    if (!alertBox) return;
    alertBox.className = "muni-panel-alert muni-panel-alert--" + type;
    if (asHtml) {
      alertBox.innerHTML = message;
    } else {
      alertBox.textContent = message;
    }
    alertBox.hidden = false;
  }

  function hideAlert() {
    if (alertBox) alertBox.hidden = true;
  }

  function canManageMapa(areaSlug) {
    return MAP_MANAGER_AREAS.indexOf(areaSlug) !== -1;
  }

  function setMapaPanelVisible(visible) {
    if (mapNavLink) mapNavLink.hidden = !visible;
    if (mapSectionEl) mapSectionEl.hidden = !visible;
    if (mapHeroStep) mapHeroStep.hidden = !visible;
  }

  function bindEncargadoMapaOnce() {
    if (encargadoMapaBound || !window.EncargadoMapa) return;
    encargadoMapaBound = true;
    window.EncargadoMapa.bind({
      showAlert: showAlert,
      getSession: function () {
        return {
          user: currentUser,
          profile: userProfile,
          area: userArea,
        };
      },
    });
  }

  function refreshEncargadoMapa() {
    if (!currentUser || !userArea || !canManageMapa(userArea.slug)) return;
    bindEncargadoMapaOnce();
    if (window.EncargadoMapa) {
      window.EncargadoMapa.refresh(currentUser.uid, userArea.slug);
    }
  }

  function formatError(error, fallback) {
    return (error && error.message) || fallback;
  }

  function setWorkspaceVisible(visible) {
    if (authPanel) authPanel.hidden = visible;
    if (workspace) workspace.hidden = !visible;
  }

  function resolveAuthUser(user) {
    if (user) return user;
    if (auth && auth.currentUser) return auth.currentUser;
    return null;
  }

  function clearAuthNullTimer() {
    if (authNullTimer) {
      clearTimeout(authNullTimer);
      authNullTimer = null;
    }
  }

  function confirmSignedOut() {
    if (manualLogout) {
      manualLogout = false;
      return;
    }
    if (auth && auth.currentUser) return;

    sessionToken += 1;
    if (sessionReady || lastAuthUid) {
      showAlert("warn", "Tu sesión finalizó. Volvé a ingresar con tu email y contraseña.");
    }
    lastAuthUid = null;
    sessionReady = false;
    currentUser = null;
    userProfile = null;
    userArea = null;
    setWorkspaceVisible(false);
  }

  function scheduleSignedOutCheck() {
    clearAuthNullTimer();
    authNullTimer = setTimeout(function () {
      authNullTimer = null;
      confirmSignedOut();
    }, AUTH_NULL_DELAY_MS);
  }

  function handleAuthChange(user) {
    if (!initClients()) {
      showAlert("warn", "Configurá js/firebase-config.js antes de usar el panel de encargados.");
      return;
    }

    var resolved = resolveAuthUser(user);
    if (resolved) {
      clearAuthNullTimer();
      refreshSession(resolved).catch(function (err) {
        console.error("refreshSession", err);
        showAlert("error", "Error al verificar la sesión: " + formatError(err, "Error desconocido"));
      });
      return;
    }

    if (sessionReady || lastAuthUid) {
      scheduleSignedOutCheck();
      return;
    }

    confirmSignedOut();
  }

  async function resolveUserArea(areaSlug) {
    if (!db || !areaSlug) return null;
    try {
      var snap = await db.collection("areas").doc(areaSlug).get({ source: "server" });
      if (!snap.exists) return null;
      return window.MuniApi.mapArea(snap.id, snap.data());
    } catch (err) {
      console.error("resolveUserArea", err);
      return null;
    }
  }

  async function refreshSession(user) {
    user = resolveAuthUser(user);
    if (!user) return;

    if (sessionReady && user.uid === lastAuthUid && userArea && userProfile) {
      currentUser = user;
      return;
    }

    var token = ++sessionToken;
    currentUser = user;
    var uid = currentUser.uid;

    var profile = null;
    try {
      profile = await window.MuniApi.getUserProfile(uid);
      if (!profile && token === sessionToken) {
        await new Promise(function (resolve) {
          setTimeout(resolve, 400);
        });
        profile = await window.MuniApi.getUserProfile(uid);
      }
    } catch (err) {
      if (token !== sessionToken) return;
      showAlert(
        "error",
        "No se pudo leer tu perfil en Firestore. Publicá las reglas de firebase/firestore.rules. Detalle: " +
          formatError(err, "Error de permisos")
      );
      setWorkspaceVisible(false);
      return;
    }

    if (token !== sessionToken) return;

    if (!profile) {
      showAlert(
        "error",
        "No existe users/" +
          uid +
          " en Firestore. Pedile al administrador que te asigne rol encargado con tu UID."
      );
      setWorkspaceVisible(false);
      return;
    }

    if (profile.role !== "encargado") {
      manualLogout = true;
      await auth.signOut();
      if (token !== sessionToken) return;
      showAlert(
        "error",
        'Tu perfil tiene role "' + profile.role + '". Se necesita "encargado" para usar este panel.'
      );
      setWorkspaceVisible(false);
      return;
    }

    if (!profile.areaSlug) {
      showAlert(
        "error",
        "Tu usuario no tiene área asignada (areaSlug vacío). El administrador debe asignarte un área desde admin.html."
      );
      setWorkspaceVisible(false);
      return;
    }

    userProfile = profile;
    userArea = await resolveUserArea(profile.areaSlug);
    if (token !== sessionToken) return;

    if (!userArea) {
      showAlert(
        "error",
        'No se encontró el área "' +
          profile.areaSlug +
          '" en Firestore. El administrador debe hacer clic en "Importar áreas municipales" en admin.html.'
      );
      setWorkspaceVisible(false);
      return;
    }

    if (authEmail) authEmail.textContent = currentUser.email || "";
    if (areaLabel) areaLabel.textContent = userArea.nombre;
    updateHero(userArea);
    setWorkspaceVisible(true);
    lastAuthUid = uid;
    sessionReady = true;
    hideAlert();

    if (window.MuniAgenda) {
      await window.MuniAgenda.activate({
        user: currentUser,
        profile: userProfile,
        userArea: userArea,
        showAlert: showAlert,
      });
    }

    if (window.MuniStaffNotify) {
      try {
        await window.MuniStaffNotify.activate({
          db: db,
          auth: auth,
          uid: currentUser.uid,
          profile: userProfile,
          mountEl: document.getElementById("muni-staff-notify-mount"),
        });
      } catch (notifyErr) {
        console.warn("MuniStaffNotify.activate", notifyErr);
      }
    }

    setMapaPanelVisible(canManageMapa(userArea.slug));
    if (canManageMapa(userArea.slug)) {
      refreshEncargadoMapa();
    }
  }

  function syncAgendaDeactivate() {
    if (window.MuniAgenda) window.MuniAgenda.deactivate();
    if (window.MuniStaffNotify) window.MuniStaffNotify.teardown();
  }

  function updateHero(area) {
    if (!area) return;
    if (heroBadge) {
      heroBadge.hidden = false;
      heroBadge.setAttribute("aria-hidden", "false");
    }
    if (heroAreaEl) heroAreaEl.textContent = area.nombre;
    if (heroIconEl) heroIconEl.textContent = AREA_ICONS[area.slug] || "🏛️";
    if (heroLeadEl) {
      heroLeadEl.textContent = canManageMapa(area.slug)
        ? "Bienvenido al panel de " +
          area.nombre +
          ". Gestioná la agenda interna, solicitá publicar eventos y cargá puntos en el mapa de obras; el administrador aprueba antes de que sean visibles."
        : "Bienvenido al panel de " +
          area.nombre +
          ". Gestioná la agenda interna y solicitá publicar eventos en el portal; el administrador aprueba antes de que sean visibles.";
    }
    var hero = document.getElementById("encargado-hero");
    if (hero && area.color) {
      hero.style.setProperty("--enc-area-accent", area.color);
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();
      clearAuthNullTimer();
      if (!initClients()) {
        showAlert("warn", "Configurá Firebase en js/firebase-config.js");
        return;
      }
      var fd = new FormData(loginForm);
      try {
        await auth.signInWithEmailAndPassword(
          String(fd.get("email") || "").trim(),
          String(fd.get("password") || "")
        );
      } catch (err) {
        showAlert("error", formatError(err, "No se pudo iniciar sesión."));
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      clearAuthNullTimer();
      manualLogout = true;
      sessionToken += 1;
      lastAuthUid = null;
      sessionReady = false;
      if (auth) await auth.signOut();
      syncAgendaDeactivate();
      setMapaPanelVisible(false);
      currentUser = null;
      userProfile = null;
      userArea = null;
      setWorkspaceVisible(false);
    });
  }

  if (initClients()) {
    auth.onAuthStateChanged(handleAuthChange);
  } else {
    showAlert("warn", "Configurá js/firebase-config.js para usar el panel de encargados.");
  }

})();
