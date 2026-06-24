(function () {
  "use strict";

  function initNav(navEl) {
    if (!navEl) return;
    var links = navEl.querySelectorAll('a[href^="#"]');
    if (!links.length) return;

    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var hash = link.getAttribute("href");
        if (!hash || hash.charAt(0) !== "#") return;
        var target = document.getElementById(hash.slice(1));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        links.forEach(function (l) {
          l.classList.remove("is-active");
          l.removeAttribute("aria-current");
        });
        link.classList.add("is-active");
        link.setAttribute("aria-current", "true");
        if (history.replaceState) {
          history.replaceState(null, "", hash);
        }
        var sectionId = hash.slice(1);
        setTimeout(function () {
          document.dispatchEvent(
            new CustomEvent("muni-panel-section-open", { detail: { id: sectionId } })
          );
        }, 450);
      });
    });

    function syncFromHash() {
      var id = (location.hash || "").replace(/^#/, "");
      if (!id) return;
      links.forEach(function (link) {
        var match = link.getAttribute("href") === "#" + id;
        link.classList.toggle("is-active", match);
        if (match) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
  }

  window.MuniPanelNav = { init: initNav };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-panel-nav]").forEach(initNav);
  });
})();
