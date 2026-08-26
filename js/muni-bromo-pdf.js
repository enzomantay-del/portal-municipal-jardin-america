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
        var estado = has
          ? " — <strong>Entregado (en revisión)</strong>"
          : " — <strong>Documentación pendiente de entrega</strong>";
        return "<li>" + escapeHtml(doc.label) + estado + "</li>";
      })
      .join("");
  }

  function firmaSolicitanteHtml(solicitante, valores) {
    return (
      '<div class="firma-sol">' +
      "<p><strong>1. Firma del solicitante</strong></p>" +
      '<div class="espacio-firma"></div>' +
      '<div class="firma-lineas">' +
      "<div>Firma y aclaración: _________________________________</div>" +
      "<div>D.N.I.: " +
      escapeHtml(solicitante.dni || "____________________") +
      "</div>" +
      "<div>TEL.: " +
      escapeHtml(solicitante.telefono || "____________________") +
      "</div>" +
      "<div>Domicilio: " +
      escapeHtml((valores && valores.domicilio) || solicitante.domicilio || "_________________________________") +
      "</div>" +
      "<div>Apellido y nombre: " +
      escapeHtml(solicitante.nombre || "") +
      "</div>" +
      "</div></div>"
    );
  }

  function pasePoliciaHtml(solicitante) {
    return (
      '<section class="pase">' +
      '<p class="pase-titulo">*** PASE ***</p>' +
      "<p><strong>2. Autorización policial</strong> (completar en Policía Adicional UR IX)</p>" +
      "<p>Al Sr. Jefe de la División Policía Adicional UR IX de la Ciudad de Jardín América<br>S / D</p>" +
      "<p>Tengo el agrado de dirigirme a Ud. enviando la solicitud de evento presentada por: " +
      "<strong>" +
      escapeHtml(solicitante.nombre || "........................................................") +
      "</strong>, " +
      "para su conocimiento y se realiza la devolución de la presente. Saludos a Ud., muy atte.</p>" +
      '<div class="espacio-firma espacio-firma--pase"></div>' +
      '<div class="firma-pase">' +
      "<div>_________________________________</div>" +
      "<div>Firma y sello — División Policía Adicional UR IX</div>" +
      "</div></section>"
    );
  }

  function authBromatoHtml() {
    return (
      '<section class="auth-bromo">' +
      "<p><strong>3. Autorización de Bromatología</strong> (después de la firma policial)</p>" +
      "<p>Con la autorización de Policía Adicional, el área de Bromatología de la Municipalidad de Jardín América deja constancia de la intervención en el presente pedido de evento público.</p>" +
      '<div class="firma-bromo-grid">' +
      "<div><div class='espacio-firma espacio-firma--bromo'></div><div class='line'></div>Firma y sello — Bromatología</div>" +
      "<div><div class='espacio-firma espacio-firma--bromo'></div><div class='line'></div>Fecha / observaciones</div>" +
      "</div></section>"
    );
  }

  function firmasDefaultHtml(solicitante) {
    return (
      '<div class="firma"><div class="box">Solicitante<br>' +
      escapeHtml(solicitante.nombre) +
      "<br>DNI " +
      escapeHtml(solicitante.dni) +
      '</div><div class="box">Inspección Bromatología<br>(uso interno)</div></div>'
    );
  }

  function buildLetterHtml(opts) {
    opts = opts || {};
    var tramite = opts.tramite || {};
    var solicitante = opts.solicitante || {};
    var valores = opts.valores || {};
    var numero = opts.numero || "";
    var createdAt = opts.createdAt || new Date().toISOString();
    var intendente =
      (window.MuniBromoTramitesData && window.MuniBromoTramitesData.INTENDENTE) ||
      "MMO. César Daniel Araujo";
    var isEvento = tramite.id === "evento-publico";
    var logoSrc = opts.logoSrc || "assets/membrete-municipalidad.png";

    var firmasBlock = isEvento
      ? firmaSolicitanteHtml(solicitante, valores) +
        pasePoliciaHtml(solicitante) +
        authBromatoHtml()
      : firmasDefaultHtml(solicitante);

    var declText = isEvento
      ? "Declaro bajo juramento que los datos y documentos presentados son verdaderos. " +
        "Debo imprimir esta nota, firmarla y llevarla primero a Policía Adicional UR IX para su autorización; " +
        "luego, con esa firma, presentarla en Bromatología para la autorización del área."
      : "Declaro bajo juramento que los datos y documentos presentados son verdaderos. " +
        "Esta solicitud digital inicia el trámite; la inspección, el pago y eventuales firmas o sellos se completan según indique Bromatología.";

    var instruccionEvento = isEvento
      ? '<div class="instruccion">' +
        "<strong>Instrucciones para el solicitante:</strong> " +
        "1) Imprimí y firmá esta solicitud. " +
        "2) Llevala a Policía Adicional UR IX para firma y autorización (bloque PASE). " +
        "3) Con la autorización policial, presentala en la oficina de Bromatología." +
        "</div>"
      : "";

    return (
      '<!doctype html><html lang="es"><head><meta charset="UTF-8">' +
      "<title>Solicitud " +
      escapeHtml(numero) +
      "</title>" +
      "<style>" +
      "@page{margin:14mm}body{font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;margin:0;padding:0;font-size:11.5pt;line-height:1.4}" +
      ".sheet{max-width:780px;margin:0 auto;padding:6px 4px 18px}" +
      ".membrete{margin:0 0 10px;padding:0 0 8px;border-bottom:none;text-align:center}" +
      ".membrete img{display:block;width:100%;max-width:720px;height:auto;margin:0 auto}" +
      ".membrete-sub{margin:6px 0 0;font-size:9.5pt;color:#0d3d56;font-family:Georgia,'Times New Roman',serif}" +
      ".membrete-sub strong{display:block;font-size:10.5pt;margin-bottom:2px}" +
      ".meta{font-size:9.5pt;color:#555;margin:0 0 10px}" +
      "h2{font-size:12.5pt;margin:0 0 8px;text-align:center;text-transform:uppercase;letter-spacing:.04em}" +
      ".dest{margin:0 0 10px}.dest strong{display:block}" +
      "table{width:100%;border-collapse:collapse;margin:8px 0 10px}th,td{border:1px solid #ccd;padding:5px 7px;text-align:left;vertical-align:top;font-size:10.5pt}th{width:38%;background:#f3f7fa;font-weight:600}" +
      "ul{margin:4px 0 10px;padding-left:1.2rem}li{margin:2px 0;font-size:10.5pt}" +
      ".decl{border:1px solid #bcd;background:#f7fbfd;padding:8px 10px;margin:10px 0;font-size:10pt}" +
      ".instruccion{border:1px solid #c9a227;background:#fff8e6;padding:8px 10px;margin:10px 0;font-size:10pt}" +
      ".firma{margin-top:22px;display:flex;justify-content:space-between;gap:20px}" +
      ".firma .box{flex:1;text-align:center;padding-top:32px;border-top:1px solid #333;font-size:10pt}" +
      ".firma-sol{margin-top:20px;padding-top:14px;border-top:2px solid #0d7aa8}" +
      ".firma-sol .firma-lineas{display:grid;gap:10px;margin-top:6px;font-size:10.5pt}" +
      ".espacio-firma{min-height:52px;height:52px}" +
      ".espacio-firma--pase{min-height:64px;height:64px}" +
      ".espacio-firma--bromo{min-height:56px;height:56px}" +
      ".pase{margin-top:22px;padding-top:14px;border-top:3px solid #0d7aa8}" +
      ".pase-titulo{text-align:center;font-weight:700;font-style:italic;text-decoration:underline;letter-spacing:.08em;margin:4px 0 12px}" +
      ".firma-pase{margin-top:8px;text-align:right;font-size:10pt}" +
      ".firma-pase div:first-child{margin-bottom:6px}" +
      ".auth-bromo{margin-top:22px;padding-top:14px;border-top:2px solid #0d7aa8}" +
      ".firma-bromo-grid{display:flex;gap:28px;margin-top:8px;font-size:10pt}" +
      ".firma-bromo-grid>div{flex:1;text-align:center}" +
      ".firma-bromo-grid .line{border-top:1px solid #333;margin:0 8px 8px}" +
      ".foot{margin-top:20px;font-size:8.5pt;color:#666;border-top:1px solid #ddd;padding-top:8px}" +
      "@media print{.no-print{display:none!important}body{background:#fff}.pase,.auth-bromo,.firma-sol{break-inside:avoid}}" +
      "</style></head><body><div class='sheet'>" +
      '<header class="membrete">' +
      '<img src="' +
      escapeHtml(logoSrc) +
      '" alt="Municipalidad de Jardín América — membrete oficial">' +
      '<p class="membrete-sub"><strong>Área de Bromatología</strong>' +
      "Av. Libertad N° 24 · Tel: (03743) 460101 · C.P. 3328 · Jardín América, Misiones</p>" +
      "</header>" +
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
        ? "<p><strong>Documentación del trámite:</strong></p><ul>" +
          docsList(tramite.documentos, opts.adjuntos) +
          "</ul>"
        : "") +
      '<div class="decl">' +
      escapeHtml(declText) +
      "</div>" +
      instruccionEvento +
      firmasBlock +
      '<p class="foot">Generado desde jardinamerica.gob.ar · Conservar copia impresa para el expediente.' +
      (isEvento
        ? " Orden de firmas: 1) Solicitante · 2) Policía Adicional UR IX · 3) Bromatología."
        : "") +
      "</p>" +
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
