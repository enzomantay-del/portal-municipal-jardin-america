/* Service worker — notificaciones push (Firebase Cloud Messaging). */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBNffWqrvuWCdA-QzPu6ZZPOLrzDZ8BoPY",
  authDomain: "portal-municipal-jardin.firebaseapp.com",
  projectId: "portal-municipal-jardin",
  storageBucket: "portal-municipal-jardin.firebasestorage.app",
  messagingSenderId: "39769981169",
  appId: "1:39769981169:web:a81f1c4c33be60f4f3e950",
});

var messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  var data = payload.data || {};
  var notification = payload.notification || {};
  var title = notification.title || data.title || "Portal municipal";
  var body = notification.body || data.body || "";
  var link = data.url || data.link || "/";

  self.registration.showNotification(title, {
    body: body,
    icon: "/assets/logo-municipalidad.png",
    badge: "/assets/logo-municipalidad.png",
    data: { url: link },
    tag: data.tag || "muni-staff-" + Date.now(),
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(url.split("#")[0]) !== -1 && "focus" in list[i]) {
          list[i].focus();
          if (url.indexOf("#") !== -1) {
            list[i].navigate(url);
          }
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
