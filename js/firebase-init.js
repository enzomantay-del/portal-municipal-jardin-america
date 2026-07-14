(function () {
  "use strict";

  var app = null;
  var db = null;
  var auth = null;
  var storage = null;

  function isConfigured() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId) return false;
    if (String(cfg.projectId).includes("tu-proyecto")) return false;
    if (String(cfg.apiKey || "").includes("TU-API-KEY")) return false;
    return true;
  }

  var APP_NAME = "muni-portal";

  function getStorageBucketUrl() {
    var bucket = window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.storageBucket;
    if (!bucket) return null;
    return String(bucket).indexOf("gs://") === 0 ? bucket : "gs://" + bucket;
  }

  function init() {
    if (!isConfigured() || !window.firebase) return null;
    if (!app) {
      try {
        app = firebase.app(APP_NAME);
      } catch (_e) {
        app = firebase.initializeApp(window.FIREBASE_CONFIG, APP_NAME);
      }
      if (firebase.firestore) {
        db = firebase.firestore(app);
      }
      // Auth/Storage solo si el SDK está cargado (páginas admin / paneles)
      if (firebase.auth) {
        auth = firebase.auth(app);
        if (auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
          auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () {});
        }
      }
      if (firebase.storage) {
        var bucketUrl = getStorageBucketUrl();
        storage = bucketUrl ? firebase.storage(app, bucketUrl) : firebase.storage(app);
      }
    }
    return app;
  }

  function getProjectId() {
    init();
    return app && app.options ? app.options.projectId : null;
  }

  async function getUserProfile(uid, options) {
    init();
    if (!db || !uid) return null;
    var snap = await db.collection("users").doc(uid).get(options || { source: "server" });
    return snap.exists ? snap.data() : null;
  }

  async function diagnoseUserProfile(uid) {
    init();
    if (!db || !uid) {
      return { projectId: getProjectId(), uid: uid, exists: false, error: "Sin conexión Firestore" };
    }
    try {
      var snap = await db.collection("users").doc(uid).get({ source: "server" });
      return {
        projectId: getProjectId(),
        uid: uid,
        exists: snap.exists,
        role: snap.exists ? snap.data().role : null,
        path: "users/" + uid,
      };
    } catch (err) {
      return {
        projectId: getProjectId(),
        uid: uid,
        exists: false,
        error: (err && err.message) || String(err),
        path: "users/" + uid,
      };
    }
  }

  async function getCurrentUserProfile() {
    init();
    if (!auth || !auth.currentUser) return null;
    return getUserProfile(auth.currentUser.uid);
  }

  window.MuniFirebase = {
    init: init,
    isConfigured: isConfigured,
    db: function () {
      init();
      return db;
    },
    auth: function () {
      init();
      return auth;
    },
    storage: function () {
      init();
      return storage;
    },
    getStorageBucket: function () {
      init();
      if (storage && storage.app && storage.app.options) {
        return storage.app.options.storageBucket || null;
      }
      return window.FIREBASE_CONFIG ? window.FIREBASE_CONFIG.storageBucket : null;
    },
    getProjectId: getProjectId,
    getUserProfile: getUserProfile,
    getCurrentUserProfile: getCurrentUserProfile,
    diagnoseUserProfile: diagnoseUserProfile,
    serverTimestamp: function () {
      return firebase.firestore.FieldValue.serverTimestamp();
    },
  };
})();
