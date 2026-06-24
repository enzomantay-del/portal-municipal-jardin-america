(function () {
  "use strict";

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      var objectUrl = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("No se pudo leer la imagen."));
      };
      img.src = objectUrl;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(resolve, type, quality);
    });
  }

  /**
   * Reduce peso y tamaño para previews en WhatsApp/Facebook (objetivo < 350 KB).
   */
  async function compressImageFile(file, options) {
    options = options || {};
    var maxWidth = options.maxWidth || 1600;
    var maxHeight = options.maxHeight || 1600;
    var maxBytes = options.maxBytes || 280000;
    var minQuality = options.minQuality || 0.55;

    if (!file || !file.type || file.type.indexOf("image/") !== 0 || file.type === "image/gif") {
      return file;
    }

    var img = await loadImageFromFile(file);
    var needsResize = img.width > maxWidth || img.height > maxHeight;
    var needsCompress = file.size > maxBytes;

    if (!needsResize && !needsCompress) {
      return file;
    }

    var scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
    var width = Math.max(1, Math.round(img.width * scale));
    var height = Math.max(1, Math.round(img.height * scale));

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    var quality = 0.88;
    var blob = await canvasToBlob(canvas, "image/jpeg", quality);
    while (blob && blob.size > maxBytes && quality > minQuality) {
      quality -= 0.08;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }

    if (!blob) return file;

    var baseName = (file.name || "imagen").replace(/\.[^.]+$/, "");
    return new File([blob], baseName + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  window.MuniImageCompress = {
    compressImageFile: compressImageFile,
  };
})();
