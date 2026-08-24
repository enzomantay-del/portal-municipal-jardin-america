/**
 * Nota PDF / impresión con membrete municipal para trámites de Bromatología.
 */
(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatFechaLarga(iso) {
    try {
      var d = iso ? new Date(iso) : new Date();
      return d.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Argentina/Cordoba",
      });
    } catch (_e) {
      return String(iso || "");
    }
  }

  function fieldRows(campos, valores) {
    return (campos || [])
      .map(function (campo) {
        var val = valores && valores[campo.name] != null ? String(valores[campo.name]) : "";
        if (!val) return "";
        return (
          "<tr><th>" +
          escapeHtml(campo.label) +
          "</th><td>" +
          escapeHtml(val) +
          "</td></tr>"
        );
      })
      .filter(Boolean)
      .join("");
  }

  function docsList(documentos, adjuntos) {
    var map = {};
    (adjuntos || []).forEach(function (a) {
      if (a && a.key) map[a.key] = a;
    });
    return (documentos || [])
      .map(function (doc) {
        var has = !!map[doc.key];
        return (
          "<li>" +
          escapeHtml(doc.label) +
          (has ? " — <strong>Adjuntado</strong>" : " — (sin archivo en esta solicitud)") +
          "</li>"
        );
      })
      .join("");
  }

  function buildLetterHtml(opts) {
    opts = opts || {};
    var tramite = opts.tramite || {};
    var solicitante = opts.solicitante || {};
    var valores = opts.valores || {};
    var numero = opts.numero || "";
    var createdAt = opts.createdAt || new Date().toISOString();
    var intendente = (window.MuniBromoTramitesData && window.MuniBromoTramitesData.INTENDENTE) ||
      "MMO. César Daniel Araujo";

    var logoSrc = opts.logoSrc || "assets/logo-municipalidad.png";

    return (
      '<!doctype html><html lang="es"><head><meta charset="UTF-8">' +
      "<title>Solicitud " +
      escapeHtml(numero) +
      "</title>" +
      "<style>" +
      "@page{margin:18mm}body{font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;margin:0;padding:0;font-size:12pt;line-height:1.45}" +
      ".sheet{max-width:780px;margin:0 auto;padding:12px 8px 24px}" +
      ".membrete{display:flex;gap:14px;align-items:center;border-bottom:2px solid #0d7aa8;padding-bottom:12px;margin-bottom:18px}" +
      ".membrete img{width:72px;height:auto}" +
      ".membrete h1{margin:0;font-size:15pt;color:#0d3d56}" +
      ".membrete p{margin:2px 0 0;font-size:9.5pt;color:#445}" +
      ".meta{font-size:10pt;color:#555;margin:0 0 14px}" +
      "h2{font-size:13pt;margin:0 0 10px;text-align:center;text-transform:uppercase;letter-spacing:.04em}" +
      ".dest{margin:0 0 12px}.dest strong{display:block}" +
      "table{width:100%;border-collapse:collapse;margin:10px 0 14px}th,td{border:1px solid #ccd;padding:6px 8px;text-align:left;vertical-align:top}th{width:38%;background:#f3f7fa;font-weight:600}" +
      "ul{margin:6px 0 14px;padding-left:1.2rem}li{margin:3px 0}" +
      ".decl{border:1px solid #bcd;background:#f7fbfd;padding:10px 12px;margin:14px 0;font-size:10.5pt}" +
      ".firma{margin-top:28px;display:flex;justify-content:space-between;gap:20px}" +
      ".firma .box{flex:1;text-align:center;padding-top:36px;border-top:1px solid #333;font-size:10pt}" +
      ".foot{margin-top:22px;font-size:9pt;color:#666;border-top:1px solid #ddd;padding-top:8px}" +
      "@media print{.no-print{display:none!important}body{background:#fff}}" +
      "</style></head><body><div class='sheet'>" +
      '<header class="membrete">' +
      '<img src="' +
      escapeHtml(logoSrc) +
      '" alt="Municipalidad de Jardín América">' +
      "<div><h1>Municipalidad de Jardín América</h1>" +
      "<p>Provincia de Misiones · República Argentina</p>" +
      "<p>Área de Bromatología · Portal municipal</p>" +
      "</div></header>" +
      '<p class="meta">Solicitud N° <strong>' +
      escapeHtml(numero) +
      "</strong> · Jardín América, " +
      escapeHtml(formatFechaLarga(createdAt)) +
      "</p>" +
      "<h2>" +
      escapeHtml(tramite.titulo || "Solicitud") +
      "</h2>" +
      '<div class="dest"><strong>Sr. Intendente Municipal</strong>' +
      escapeHtml(intendente) +
      "<br>S / D</div>" +
      "<p>" +
      escapeHtml(tramite.notaIntro || "Solicito el trámite indicado.") +
      "</p>" +
      "<table><tbody>" +
      fieldRows(tramite.campos, valores) +
      "<tr><th>Apellido y nombre</th><td>" +
      escapeHtml(solicitante.nombre) +
      "</td></tr>" +
      "<tr><th>DNI</th><td>" +
      escapeHtml(solicitante.dni) +
      "</td></tr>" +
      "<tr><th>Teléfono / WhatsApp</th><td>" +
      escapeHtml(solicitante.telefono) +
      "</td></tr>" +
      (solicitante.email
        ? "<tr><th>Email</th><td>" + escapeHtml(solicitante.email) + "</td></tr>"
        : "") +
      "</tbody></table>" +
      (tramite.documentos && tramite.documentos.length
        ? "<p><strong>Documentación declarada / adjuntada:</strong></p><ul>" +
          docsList(tramite.documentos, opts.adjuntos) +
          "</ul>"
        : "") +
      '<div class="decl">Declaro bajo juramento que los datos y documentos presentados son verdaderos. ' +
      "Esta solicitud digital inicia el trámite; la inspección, el pago y eventuales firmas o sellos se completan según indique Bromatología.</div>" +
      '<div class="firma"><div class="box">Solicitante<br>' +
      escapeHtml(solicitante.nombre) +
      "<br>DNI " +
      escapeHtml(solicitante.dni) +
      '</div><div class="box">Inspección Bromatología<br>(uso interno)</div></div>' +
      '<p class="foot">Generado desde jardinamerica.gob.ar · Conservar copia impresa para el expediente.</p>' +
      "</div>" +
      '<p class="no-print" style="text-align:center;margin:16px"><button onclick="window.print()" style="padding:10px 18px;font-size:14px">Imprimir / Guardar como PDF</button></p>' +
      "</body></html>"
    );
  }

  function openPrintWindow(html) {
    var w = window.open("", "_blank");
    if (!w) {
      alert("Permití ventanas emergentes para imprimir la nota.");
      return null;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(function () {
      try {
        w.focus();
        w.print();
      } catch (_e) {}
    }, 400);
    return w;
  }

  window.MuniBromoPdf = {
    buildLetterHtml: buildLetterHtml,
    openPrintWindow: openPrintWindow,
    formatFechaLarga: formatFechaLarga,
  };
})();
