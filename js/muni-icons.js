(function () {
  "use strict";

  /* Íconos lineales sobrios (estilo institucional) por área municipal */
  var ICONS = {
    intendencia:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>',
    "obras-publicas":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M2 20h20"/><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/><path d="M10 10h4"/></svg>',
    salud:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"/><path d="M12 11v4"/><path d="M10 13h4"/></svg>',
    "obras-privadas":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3 21h18"/><path d="M6 21V9l6-4 6 4v12"/><path d="M10 21v-4h4v4"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>',
    zoonosis:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M9 6.5 7 10"/><path d="m15 6.5 2 3.5"/><path d="M7 10a5 5 0 0 0 8 0"/><path d="M12 15v3"/><path d="M8 21h8"/></svg>',
    "accion-social":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    "oficina-de-trabajo":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/></svg>',
    "concejo-deliberante":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3v18"/><path d="M5 10h14"/><path d="M5 10 3 21h18l-2-11"/><path d="M8 10V7"/><path d="M16 10V7"/></svg>',
    turismo:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/></svg>',
    deportes:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    ambiente:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z"/><path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>',
    cultura:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3a9 9 0 0 1 9 9c0 3.5-2 6.5-5 8"/><path d="M12 3a9 9 0 0 0-9 9c0 3.5 2 6.5 5 8"/><path d="M12 3v18"/><circle cx="7.5" cy="10.5" r="1.25"/><circle cx="16.5" cy="10.5" r="1.25"/></svg>',
    juventud:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3l1.8 5.5L19 10l-5.2 1.5L12 17l-1.8-5.5L5 10l5.2-1.5L12 3z"/><path d="M5 19h14"/><path d="M8 16v3"/><path d="M16 16v3"/></svg>',
    transito:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M7 17h10"/><path d="M5 17H3v-3l2-5h14l2 5v3h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 11h14"/></svg>',
    "defensa-civil":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
    rentas:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 12h6"/><path d="M7 16h8"/></svg>',
    prensa:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M4 19h16"/><path d="M6 19V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"/><path d="M10 9h4"/><path d="M10 13h4"/><path d="M10 17h2"/></svg>',
    bromatologia:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M9 3h6v2H9z"/><path d="M10 5v4"/><path d="M14 5v4"/><path d="M8 9h8l-1 12H9L8 9z"/><path d="M12 13v4"/><path d="M10 15h4"/></svg>',
    "agro-y-produccion":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 22V12"/><path d="M12 12C12 7 8 4 4 4c0 4 3 8 8 8z"/><path d="M12 12c0-5 4-8 8-8 0 4-3 8-8 8z"/><path d="M12 22c-2 0-4-1-4-3s2-3 4-3 4 1 4 3-2 3-4 3z"/></svg>',
  };

  function renderAreaIcon(slug, className) {
    var svg = ICONS[slug] || ICONS.intendencia;
    return (
      '<span class="' + (className || "muni-icon") + '" aria-hidden="true">' + svg + "</span>"
    );
  }

  window.MuniIcons = {
    ICONS: ICONS,
    renderAreaIcon: renderAreaIcon,
  };
})();
