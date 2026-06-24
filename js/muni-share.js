(function () {
  "use strict";

  var SITE_NAME = "Municipalidad de Jardín América";

  function absoluteUrl(path) {
    if (!path) return window.location.href;
    if (/^https?:\/\//i.test(path)) return path;
    try {
      return new URL(path, window.location.href).href;
    } catch (_e) {
      return path;
    }
  }

  function noticiaAbsoluteUrl(id) {
    var url = new URL("noticia.html", window.location.href);
    url.searchParams.set("id", id);
    return url.href;
  }

  function sharePayload(noticia) {
    var title = String(noticia.titulo || "Novedad municipal").trim();
    var text = String(noticia.bajada || "").trim();
    var url = noticiaAbsoluteUrl(noticia.id);
    var image = absoluteUrl(noticia.imagen || "assets/logo-municipalidad.png");
    if (image.indexOf("http://") === 0) {
      image = "https://" + image.slice(7);
    }
    return { title: title, text: text, url: url, image: image };
  }

  function whatsappMessage(payload) {
    var lines = [payload.title];
    if (payload.text) lines.push(payload.text);
    lines.push(payload.url);
    return lines.join("\n\n");
  }

  function setMetaTag(key, value, isProperty) {
    if (!value) return;
    var selector = isProperty
      ? 'meta[property="' + key + '"]'
      : 'meta[name="' + key + '"]';
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      if (isProperty) el.setAttribute("property", key);
      else el.setAttribute("name", key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }

  function setNoticiaSocialMeta(noticia) {
    var payload = sharePayload(noticia);
    document.title = payload.title + " | " + SITE_NAME;

    setMetaTag("description", payload.text, false);
    setMetaTag("og:type", "article", true);
    setMetaTag("og:site_name", SITE_NAME, true);
    setMetaTag("og:locale", "es_AR", true);
    setMetaTag("og:title", payload.title, true);
    setMetaTag("og:description", payload.text, true);
    setMetaTag("og:url", payload.url, true);
    setMetaTag("og:image", payload.image, true);
    setMetaTag("og:image:secure_url", payload.image, true);
    setMetaTag("og:image:alt", payload.title, true);
    setMetaTag("twitter:card", "summary_large_image", false);
    setMetaTag("twitter:title", payload.title, false);
    setMetaTag("twitter:description", payload.text, false);
    setMetaTag("twitter:image", payload.image, false);

    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = payload.url;
  }

  function iconWhatsApp() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">' +
      '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
      '<path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.18 8.18 0 01-4.16-1.134l-.298-.177-2.868.853.853-2.868-.177-.298A8.18 8.18 0 014.818 12c0-4.515 3.667-8.182 8.182-8.182S21.182 7.485 21.182 12 17.515 18.182 12 18.182z"/>' +
      "</svg>"
    );
  }

  function iconFacebook() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">' +
      '<path d="M13.5 9.5V7.7c0-.8.6-1 1-1h1.6V4h-2.2c-2.2 0-2.7 1.6-2.7 3.2v2.3H9v2.5h1.2V20h3.3v-8H17l.5-2.5h-4z"/>' +
      "</svg>"
    );
  }

  function iconX() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">' +
      '<path d="M16.9 4H19.5l-6.1 7 7.2 9H14l-4.4-5.7L4.8 20H2.2l6.5-7.5L1.7 4h3.6l4 5.3 5.6-5.3zm-1.2 14.3h1.4L7.3 5.6H5.8l9.9 12.7z"/>' +
      "</svg>"
    );
  }

  function iconLink() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11 4"/>' +
      '<path d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07L13 20"/>' +
      "</svg>"
    );
  }

  function iconShare() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/>' +
      '<path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/>' +
      "</svg>"
    );
  }

  function renderShareBar(noticia) {
    var payload = sharePayload(noticia);
    var wa = "https://wa.me/?text=" + encodeURIComponent(whatsappMessage(payload));
    var fb = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(payload.url);
    var x =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(payload.title) +
      "&url=" +
      encodeURIComponent(payload.url);
    var nativeBtn = "";

    if (typeof navigator !== "undefined" && navigator.share) {
      nativeBtn =
        '<button type="button" class="muni-share-btn" data-share-native="' +
        escapeAttr(noticia.id) +
        '" aria-label="Compartir con otras apps">' +
        iconShare() +
        "</button>";
    }

    return (
      '<div class="muni-share muni-share--article" data-share-root="' +
      escapeAttr(noticia.id) +
      '">' +
      '<span class="muni-share-label">Compartir</span>' +
      '<div class="muni-share-buttons">' +
      '<a class="muni-share-btn" href="' +
      escapeAttr(wa) +
      '" target="_blank" rel="noopener noreferrer" aria-label="Compartir en WhatsApp">' +
      iconWhatsApp() +
      "</a>" +
      '<a class="muni-share-btn" href="' +
      escapeAttr(fb) +
      '" target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook">' +
      iconFacebook() +
      "</a>" +
      '<a class="muni-share-btn" href="' +
      escapeAttr(x) +
      '" target="_blank" rel="noopener noreferrer" aria-label="Compartir en X">' +
      iconX() +
      "</a>" +
      nativeBtn +
      '<button type="button" class="muni-share-btn" data-share-copy="' +
      escapeAttr(noticia.id) +
      '" aria-label="Copiar enlace">' +
      iconLink() +
      "</button>" +
      "</div>" +
      '<p class="muni-share-feedback" hidden role="status"></p>' +
      "</div>"
    );
  }

  function escapeAttr(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function getNoticiaFromButton(btn) {
    var id =
      btn.getAttribute("data-share-copy") ||
      btn.getAttribute("data-share-native");
    if (!id || !window.MuniPortal) return null;
    var noticia = window.MuniPortal.getNoticia(id);
    if (noticia) return noticia;
    return {
      id: id,
      titulo: btn.getAttribute("data-share-title") || "Novedad municipal",
      bajada: btn.getAttribute("data-share-text") || "",
      imagen: "",
    };
  }

  function showFeedback(root, message) {
    var el = root && root.querySelector(".muni-share-feedback");
    if (!el) return;
    el.hidden = false;
    el.textContent = message;
    window.setTimeout(function () {
      el.hidden = true;
    }, 2600);
  }

  async function copyNoticiaLink(noticia, root) {
    var payload = sharePayload(noticia);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload.url);
      } else {
        var input = document.createElement("input");
        input.value = payload.url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      showFeedback(root, "Enlace copiado.");
    } catch (_err) {
      showFeedback(root, payload.url);
    }
  }

  async function nativeShare(noticia, root) {
    var payload = sharePayload(noticia);
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
    } catch (err) {
      if (err && err.name === "AbortError") return;
      showFeedback(root, "No se pudo abrir el menú de compartir.");
    }
  }

  function mountArticleShare(container, noticia) {
    if (!container || !noticia) return;
    var footer = container.querySelector("[data-share-article-footer]");
    if (footer) footer.innerHTML = renderShareBar(noticia);
  }

  function bindShareActions() {
    document.addEventListener("click", function (e) {
      var copyBtn = e.target.closest("[data-share-copy]");
      if (copyBtn) {
        e.preventDefault();
        var noticiaCopy = getNoticiaFromButton(copyBtn);
        var root = copyBtn.closest("[data-share-root]");
        if (noticiaCopy) copyNoticiaLink(noticiaCopy, root);
        return;
      }

      var nativeBtn = e.target.closest("[data-share-native]");
      if (nativeBtn) {
        e.preventDefault();
        var noticiaNative = getNoticiaFromButton(nativeBtn);
        var rootNative = nativeBtn.closest("[data-share-root]");
        if (noticiaNative) nativeShare(noticiaNative, rootNative);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", bindShareActions);

  window.MuniShare = {
    sharePayload: sharePayload,
    noticiaAbsoluteUrl: noticiaAbsoluteUrl,
    setNoticiaSocialMeta: setNoticiaSocialMeta,
    renderShareBar: renderShareBar,
    mountArticleShare: mountArticleShare,
  };
})();
