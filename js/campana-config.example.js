// Copiar a campana-config.js y completar si hace falta (misma clave que PUBLIC_CARGA_KEY en campana-mvp).
window.CAMPANA_CONFIG = {
  apiBase: "https://sistema-municipal-directoalvecino.netlify.app",
  publicKey: "campana-jardin-2026-secreto",
  barriosMapaUrl:
    "https://umap.openstreetmap.fr/es/map/barrios-de-jardin-america_674771#14/-27.038257/-55.234451",
};
// La agenda interna (agenda-interna.html) usa apiBase + publicKey para avisos WhatsApp vía /api/public/agenda-notificar
