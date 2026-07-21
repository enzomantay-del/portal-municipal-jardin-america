(function () {
  "use strict";

  var MAX = 5;

  function normalizeImagenes(data) {
    data = data || {};
    var list = Array.isArray(data.imagenes) ? data.imagenes : [];
    var out = [];

    list.forEach(function (item) {
      if (!item || typeof item !== "object") return;
      var url = String(item.url || "").trim();
      if (!url) return;
      out.push({
        url: url,
        leyenda: String(item.leyenda || "").trim(),
        portada: !!item.portada,
      });
    });

    if (!out.length && data.imagenUrl) {
      out.push({
        url: String(data.imagenUrl).trim(),
        leyenda: "",
        portada: true,
      });
    }

    if (out.length > MAX) out = out.slice(0, MAX);

    if (out.length && !out.some(function (img) { return img.portada; })) {
      out[0].portada = true;
    }

    return out;
  }

  function coverUrl(data) {
    if (!data) return "";
    if (typeof data === "string") return data;
    var imagenes = normalizeImagenes(data);
    var portada = imagenes.find(function (img) {
      return img.portada;
    });
    return (portada && portada.url) || (imagenes[0] && imagenes[0].url) || String(data.imagenUrl || "").trim() || "";
  }

  function coverFromNoticia(noticia) {
    if (!noticia) return "";
    if (noticia.imagen) return noticia.imagen;
    if (noticia.imagenes && noticia.imagenes.length) {
      return coverUrl({ imagenes: noticia.imagenes });
    }
    return "";
  }

  function buildFigure(img, escapeHtml) {
    if (!img || !img.url) return "";
    var esc = escapeHtml || function (s) { return String(s || ""); };
    var leyenda = String(img.leyenda || "").trim();
    return (
      '<figure class="muni-article-inline-figure">' +
      '<img src="' +
      esc(img.url) +
      '" alt="' +
      esc(leyenda || "Imagen de la novedad") +
      '" loading="lazy" decoding="async">' +
      (leyenda ? '<figcaption class="muni-article-figcaption">' + esc(leyenda) + "</figcaption>" : "") +
      "</figure>"
    );
  }

  function renderBodyHtml(cuerpoHtml, imagenes, escapeHtml) {
    var list = normalizeImagenes({ imagenes: imagenes });
    var byIndex = {};
    list.forEach(function (img, i) {
      byIndex[i + 1] = img;
    });

    var used = {};
    var html = String(cuerpoHtml || "");

    html = html.replace(/\[imagen:(\d+)\]/gi, function (_match, num) {
      var n = parseInt(num, 10);
      var img = byIndex[n];
      if (!img || !img.url) return "";
      used[n] = true;
      if (img.portada) return "";
      return buildFigure(img, escapeHtml);
    });

    var extras = list
      .map(function (img, i) {
        return { img: img, n: i + 1 };
      })
      .filter(function (row) {
        return row.img.url && !row.img.portada && !used[row.n];
      });

    if (extras.length) {
      html +=
        '<div class="muni-article-gallery">' +
        extras.map(function (row) {
          return buildFigure(row.img, escapeHtml);
        }).join("") +
        "</div>";
    }

    return html;
  }

  function coverCaption(imagenes) {
    var list = normalizeImagenes({ imagenes: imagenes });
    var portada = list.find(function (img) { return img.portada; }) || list[0];
    return portada && portada.leyenda ? portada.leyenda : "";
  }

  window.MuniNoticiaImagenes = {
    MAX: MAX,
    normalizeImagenes: normalizeImagenes,
    coverUrl: coverUrl,
    coverFromNoticia: coverFromNoticia,
    coverCaption: coverCaption,
    renderBodyHtml: renderBodyHtml,
    buildFigure: buildFigure,
  };
})();
