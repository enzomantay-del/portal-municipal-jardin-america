(function () {
  "use strict";

  var form = document.getElementById("setup-test-form");
  var alertBox = document.getElementById("setup-alert");
  var statusBox = document.getElementById("setup-status");
  var configBlock = document.getElementById("setup-config-block");
  var configOutput = document.getElementById("setup-config-output");
  var STORAGE_KEY = "muni_firebase_setup_draft";

  function showAlert(type, msg) {
    alertBox.className = "muni-panel-alert muni-panel-alert--" + type;
    alertBox.textContent = msg;
    alertBox.hidden = false;
  }

  function statusRow(ok, text) {
    return (
      '<div class="setup-status-item">' +
      '<span aria-hidden="true">' + (ok ? "✅" : "❌") + "</span>" +
      "<span>" + text + "</span>" +
      "</div>"
    );
  }

  function buildConfigFile(cfg) {
    return (
      "window.FIREBASE_CONFIG = " +
      JSON.stringify(cfg, null, 2) +
      ";\n"
    );
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      Object.keys(d).forEach(function (key) {
        var el = document.getElementById("setup-" + key);
        if (el && d[key]) el.value = d[key];
      });
    } catch (_e) {}
  }

  function saveDraft(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (_e) {}
  }

  function readConfigFromForm() {
    var fd = new FormData(form);
    return {
      apiKey: String(fd.get("apiKey") || "").trim(),
      authDomain: String(fd.get("authDomain") || "").trim(),
      projectId: String(fd.get("projectId") || "").trim(),
      storageBucket: String(fd.get("storageBucket") || "").trim(),
      messagingSenderId: String(fd.get("messagingSenderId") || "").trim(),
      appId: String(fd.get("appId") || "").trim(),
    };
  }

  async function runTest(cfg) {
    alertBox.hidden = true;
    statusBox.hidden = false;
    statusBox.innerHTML = statusRow(null, "Conectando…");

    var app;
    try {
      app = firebase.apps.length
        ? firebase.app()
        : firebase.initializeApp(cfg, "muni-setup-test");
    } catch (_e) {
      app = firebase.initializeApp(cfg, "muni-setup-test-" + Date.now());
    }

    var db = firebase.firestore(app);
    var lines = [];
    var ok = true;

    try {
      var snap = await db.collection("areas").limit(1).get();
      lines.push(statusRow(true, "Firestore conectado correctamente."));
      if (snap.empty) {
        lines.push(
          statusRow(
            true,
            "Colección <code>areas</code> vacía — importala desde <a href='admin.html'>admin.html</a> después de crear el admin."
          )
        );
      } else {
        var countSnap = await db.collection("areas").get();
        lines.push(statusRow(countSnap.size >= 6, "Áreas encontradas: " + countSnap.size));
        if (countSnap.size < 6) ok = false;
      }
    } catch (err) {
      ok = false;
      var msg = err.message || String(err);
      if (msg.includes("permission") || msg.includes("Missing or insufficient")) {
        lines.push(
          statusRow(
            false,
            "Permiso denegado. Publicá las reglas de <code>firebase/firestore.rules</code> en la consola de Firebase."
          )
        );
      } else {
        lines.push(statusRow(false, "Error Firestore: " + msg));
      }
    }

    statusBox.innerHTML = lines.join("");
    configBlock.hidden = false;
    configOutput.textContent = buildConfigFile(cfg);

    if (ok) {
      showAlert("ok", "Conexión correcta. Copiá firebase-config.js y seguí con el paso 5.");
    } else {
      showAlert("warn", "Revisá los puntos marcados antes de continuar.");
    }
  }

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var cfg = readConfigFromForm();
      if (!cfg.projectId || cfg.projectId.includes("tu-proyecto")) {
        showAlert("error", "Completá los datos del firebaseConfig.");
        return;
      }
      saveDraft(cfg);
      try {
        await runTest(cfg);
      } catch (err) {
        showAlert("error", "Error: " + (err.message || err));
        statusBox.hidden = true;
      }
    });
  }

  loadDraft();
})();
