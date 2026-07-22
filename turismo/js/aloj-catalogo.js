(function () {
  var JA_IMG = {
    "Cabañas Las Palmeras": "img/aloj/cabanas-las-palmeras.png",
    "Alojamiento El Tuyuyú": "img/aloj/alojamiento-el-tuyuyu.png",
    "Complejo Baden Baden": "img/aloj/complejo-baden-baden.png",
  };

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function parseLineas(txt) {
    if (!txt) return [];
    return String(txt)
      .split(/\r?\n/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function parseImagenes(x) {
    var imgs = [];
    if (x.imagenes) {
      if (Array.isArray(x.imagenes)) imgs = x.imagenes.slice();
      else if (typeof x.imagenes === "object")
        imgs = Object.values(x.imagenes).filter(Boolean);
      else if (typeof x.imagenes === "string") imgs = parseLineas(x.imagenes);
    }
    imgs = imgs.filter(function (u) {
      return isUsableMediaUrl(u);
    });
    var rawMain = JA_IMG[x.n || ""] || (x.img && String(x.img).trim()) || "";
    var main = isUsableMediaUrl(rawMain) ? rawMain : "";
    if (main && imgs.indexOf(main) < 0) imgs.unshift(main);
    else if (main && !imgs.length) imgs = [main];
    return { img: main || imgs[0] || "", imagenes: imgs.slice(0, 8) };
  }

  function isUsableMediaUrl(u) {
    u = String(u || "").trim();
    if (!u) return false;
    // Evitar data-URI enormes de Firebase que rompen/cuelgan el catálogo
    if (u.indexOf("data:") === 0 && u.length > 8000) return false;
    return true;
  }

  window.normalizeAlojItem = function (x) {
    x = x || {};
    var media = parseImagenes(x);
    return {
      n: x.n || "",
      t: String(x.t || x.tel || x.telefono || "").trim(),
      p: !!x.p,
      r: !!x.r,
      img: media.img,
      imagenes: media.imagenes,
      activo: x.activo !== false,
      desc: String(x.desc || x.descripcion || "").trim(),
      servicios: String(x.servicios || "").trim(),
      instalaciones: String(x.instalaciones || "").trim(),
      capacidad: String(x.capacidad || "").trim(),
      ubicacion: String(x.ubicacion || "").trim(),
      mapsUrl: String(x.mapsUrl || x.maps || "").trim(),
    };
  };

  var listaActual = [];

  function badgesHtml(a) {
    var h = "";
    if (a.r)
      h +=
        '<span class="aloj-catalogo-badge aloj-catalogo-badge--reg">Registrado Turismo</span>';
    if (a.p)
      h +=
        '<span class="aloj-catalogo-badge aloj-catalogo-badge--pileta">Pileta</span>';
    return h ? '<div class="aloj-catalogo-badges">' + h + "</div>" : "";
  }

  function thumbHtml(a) {
    if (a.img)
      return (
        '<div class="aloj-catalogo-item__thumb"><img src="' +
        esc(a.img) +
        '" alt="" loading="lazy"></div>'
      );
    return (
      '<div class="aloj-catalogo-item__thumb aloj-catalogo-item__thumb--empty" aria-hidden="true">🏨</div>'
    );
  }

  function ensureModal() {
    if (document.getElementById("aloj-detalle-overlay")) return;
    var html =
      '<div id="aloj-detalle-overlay" role="dialog" aria-modal="true" aria-labelledby="aloj-detalle-titulo" hidden>' +
      '<div id="aloj-detalle-panel">' +
      '<div id="aloj-detalle-head"><h2 id="aloj-detalle-titulo"></h2><button type="button" id="aloj-detalle-close" aria-label="Cerrar ficha">✕</button></div>' +
      '<div id="aloj-detalle-body"></div></div></div>';
    document.body.insertAdjacentHTML("beforeend", html);
    var ov = document.getElementById("aloj-detalle-overlay");
    var close = function () {
      ov.classList.remove("open");
      ov.hidden = true;
      document.body.style.overflow = "";
    };
    document.getElementById("aloj-detalle-close").addEventListener("click", close);
    ov.addEventListener("click", function (e) {
      if (e.target === ov) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && ov.classList.contains("open")) close();
    });
  }

  function bloque(titulo, contenido) {
    if (!contenido) return "";
    return (
      '<div class="aloj-detalle-seccion"><h3>' +
      esc(titulo) +
      "</h3>" +
      contenido +
      "</div>"
    );
  }

  function listaUl(txt) {
    var items = parseLineas(txt);
    if (!items.length && txt && txt.indexOf("\n") < 0) items = [txt];
    if (!items.length) return "";
    return "<ul>" + items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
  }

  window.abrirAlojDetalle = function (idx) {
    var a = listaActual[idx];
    if (!a) return;
    ensureModal();
    var ov = document.getElementById("aloj-detalle-overlay");
    document.getElementById("aloj-detalle-titulo").textContent = a.n;
    var gal =
      a.imagenes && a.imagenes.length
        ? '<div class="aloj-detalle-galeria">' +
          a.imagenes
            .map(function (u) {
              return (
                '<img src="' +
                esc(u) +
                '" alt="' +
                esc(a.n) +
                '" loading="lazy">'
              );
            })
            .join("") +
          "</div>"
        : "";
    var body =
      gal +
      bloque("Descripción", a.desc ? "<p>" + esc(a.desc) + "</p>" : "") +
      bloque("Servicios", listaUl(a.servicios)) +
      bloque("Instalaciones", listaUl(a.instalaciones)) +
      bloque("Capacidad", a.capacidad ? "<p>" + esc(a.capacidad) + "</p>" : "") +
      bloque("Ubicación", a.ubicacion ? "<p>" + esc(a.ubicacion) + "</p>" : "") +
      badgesHtml(a);
    var acc = "";
    if (a.t)
      acc +=
        '<a class="aloj-detalle-btn aloj-detalle-btn--tel" href="tel:' +
        esc(a.t) +
        '"><span aria-hidden="true">📞</span> Llamar ' +
        esc(a.t) +
        "</a>";
    if (a.mapsUrl)
      acc +=
        '<a class="aloj-detalle-btn aloj-detalle-btn--map" href="' +
        esc(a.mapsUrl) +
        '" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">📍</span> Ver en mapa</a>';
    if (acc)
      body += '<div class="aloj-detalle-acciones">' + acc + "</div>";
    document.getElementById("aloj-detalle-body").innerHTML = body;
    ov.hidden = false;
    requestAnimationFrame(function () {
      ov.classList.add("open");
    });
    document.body.style.overflow = "hidden";
  };

  window.renderAloj = function (lista) {
    var g = document.getElementById("aloj-grid");
    if (!g) return;
    lista = (lista || []).filter(function (a) {
      return a.activo !== false;
    });
    listaActual = lista;
    g.className = "aloj-catalogo-list";
    g.setAttribute("role", "list");
    if (!lista.length) {
      g.innerHTML =
        '<p class="promos-vacio">No hay alojamientos para este filtro.</p>';
      return;
    }
    g.innerHTML = lista
      .map(function (a, i) {
        var meta = [];
        if (a.ubicacion) meta.push(esc(a.ubicacion));
        if (a.capacidad) meta.push(esc(a.capacidad));
        if (a.t) meta.push("📞 " + esc(a.t));
        return (
          '<button type="button" class="aloj-catalogo-item reveal visible" data-idx="' +
          i +
          '" role="listitem" aria-label="Ver ficha de ' +
          esc(a.n) +
          '">' +
          thumbHtml(a) +
          '<div class="aloj-catalogo-item__body">' +
          '<p class="aloj-catalogo-item__title">' +
          esc(a.n) +
          "</p>" +
          (meta.length
            ? '<p class="aloj-catalogo-item__meta">' + meta.join(" · ") + "</p>"
            : "") +
          badgesHtml(a) +
          (a.desc
            ? '<p class="aloj-catalogo-item__meta" style="margin-top:.35rem">' +
              esc(a.desc.length > 90 ? a.desc.slice(0, 87) + "…" : a.desc) +
              "</p>"
            : "") +
          "</div>" +
          '<span class="aloj-catalogo-item__chev" aria-hidden="true">›</span>' +
          "</button>"
        );
      })
      .join("");
    g.querySelectorAll(".aloj-catalogo-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.abrirAlojDetalle(parseInt(btn.getAttribute("data-idx"), 10));
      });
    });
  };

  window.filtrarAloj = function (tipo, btn) {
    document.querySelectorAll(".aloj-btn").forEach(function (b) {
      b.classList.remove("activo");
    });
    if (btn) btn.classList.add("activo");
    var base = (window.ALOJ || []).filter(function (a) {
      return a.activo !== false;
    });
    var lista =
      tipo === "todos"
        ? base
        : tipo === "pileta"
          ? base.filter(function (a) {
              return a.p;
            })
          : base.filter(function (a) {
              return a.r;
            });
    window.renderAloj(lista);
  };

  window.inicializarCatalogoAloj = function () {
    ensureModal();
    if (!window.ALOJ) return;
    window.ALOJ = window.ALOJ.map(function (a) {
      return window.normalizeAlojItem(a);
    });
    window.ALOJ.sort(function (a, b) {
      return a.n.localeCompare(b.n, "es");
    });
    var c = document.getElementById("aloj-count");
    if (c)
      c.textContent =
        "(" + window.ALOJ.filter(function (a) { return a.activo !== false; }).length + ")";
    var regBtn =
      document.querySelector('.aloj-filtros--tur .aloj-btn[onclick*="registrados"]') ||
      document.querySelector('.aloj-filtros--tur .aloj-btn[onclick*=\'registrados\']') ||
      document.querySelector('.aloj-filtros .aloj-btn[onclick*="registrados"]');
    if (regBtn) {
      window.filtrarAloj("registrados", regBtn);
    } else {
      var registrados = window.ALOJ.filter(function (a) {
        return a.activo !== false && a.r;
      });
      window.renderAloj(registrados.length ? registrados : window.ALOJ);
    }
  };

  window.mergeAlojDesdeFirebase = function (listasAloj) {
    if (!listasAloj || !window.ALOJ) return;
    var raw =
      typeof listasAloj === "object" && !Array.isArray(listasAloj)
        ? Object.values(listasAloj)
        : listasAloj;
    var clean = (raw || []).filter(function (x) {
      return x && (x.n || "").trim();
    });
    if (!clean.length) return;

    var backup = window.ALOJ.slice();
    var next = [];
    try {
      clean.forEach(function (x) {
        try {
          var o = window.normalizeAlojItem(x);
          if (o.activo !== false) next.push(o);
        } catch (itemErr) {
          console.warn("Aloj item omitido", x && x.n, itemErr);
        }
      });
      if (!next.length) throw new Error("Catálogo Firebase vacío tras normalizar");
      window.ALOJ.length = 0;
      next.forEach(function (o) {
        window.ALOJ.push(o);
      });
    } catch (err) {
      console.warn("mergeAlojDesdeFirebase falló; se mantiene catálogo local.", err);
      window.ALOJ.length = 0;
      (backup.length ? backup : window.ALOJ_EMBEDDED || []).forEach(function (x) {
        window.ALOJ.push(window.normalizeAlojItem(x));
      });
    }

    if (
      window.ALOJ.length === 0 &&
      window.ALOJ_EMBEDDED &&
      window.ALOJ_EMBEDDED.length
    ) {
      window.ALOJ_EMBEDDED.forEach(function (x) {
        window.ALOJ.push(window.normalizeAlojItem(x));
      });
    }
    window.inicializarCatalogoAloj();
  };
})();
