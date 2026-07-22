(function () {
  "use strict";

  function mapArea(slug, data) {
    return {
      id: slug,
      slug: slug,
      nombre: data.nombre,
      icono: data.icono || slug,
      color: data.color || "#1ba3d4",
      descripcion: data.descripcion || "",
      responsable: data.responsable || "",
      contacto: data.contacto || "",
      fotoEncargado: data.fotoEncargado || "",
      webExterna: data.webExterna || "",
      folletoUrl: data.folletoUrl || "",
      mapasUrl: data.mapasUrl || "",
      mapaBarriosUrl: data.mapaBarriosUrl || "",
      documentos: Array.isArray(data.documentos) ? data.documentos : [],
      enlaces: Array.isArray(data.enlaces) ? data.enlaces : [],
      recursosIntro: data.recursosIntro || "",
      orden: data.orden != null ? data.orden : 999,
      activa: data.activa !== false,
    };
  }

  function normalizeFirestoreInstant(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toDate === "function") {
      try {
        return value.toDate().toISOString();
      } catch (_e) {
        return "";
      }
    }
    if (value.seconds != null) {
      return new Date(Number(value.seconds) * 1000 + Number(value.nanoseconds || 0) / 1e6).toISOString();
    }
    return String(value);
  }

  function resolveTrabajoPublishedInstant(data) {
    data = data || {};
    var instant =
      normalizeFirestoreInstant(data.publishedAt) ||
      normalizeFirestoreInstant(data.createdAt) ||
      normalizeFirestoreInstant(data.updatedAt);
    if (instant) return instant;
    if (data.fechaPublicacion) return String(data.fechaPublicacion).slice(0, 10) + "T12:00:00";
    return "";
  }

  function mergeEngagementCounts(noticia, engagementMap) {
    if (!noticia || !engagementMap) return noticia;
    var stats = engagementMap[noticia.id];
    if (!stats) return noticia;
    noticia.likesCount = stats.likesCount;
    noticia.viewsCount = stats.viewsCount;
    return noticia;
  }

  async function loadTrabajoEngagementMap(db) {
    if (!db) return {};
    try {
      var snap = await db.collection("trabajo_engagement").get();
      var map = {};
      snap.forEach(function (doc) {
        var data = doc.data() || {};
        map[doc.id] = {
          likesCount: data.likesCount != null ? Number(data.likesCount) || 0 : 0,
          viewsCount: data.viewsCount != null ? Number(data.viewsCount) || 0 : 0,
        };
      });
      return map;
    } catch (err) {
      console.warn("loadTrabajoEngagementMap", err);
      return {};
    }
  }

  async function loadTrabajoEngagementById(db, trabajoId) {
    if (!db || !trabajoId) return null;
    try {
      var snap = await db.collection("trabajo_engagement").doc(trabajoId).get();
      if (!snap.exists) return null;
      var data = snap.data() || {};
      return {
        likesCount: data.likesCount != null ? Number(data.likesCount) || 0 : 0,
        viewsCount: data.viewsCount != null ? Number(data.viewsCount) || 0 : 0,
      };
    } catch (err) {
      console.warn("loadTrabajoEngagementById", err);
      return null;
    }
  }

  function applyEngagementMap(noticias, engagementMap) {
    return (noticias || []).map(function (noticia) {
      return mergeEngagementCounts(Object.assign({}, noticia), engagementMap);
    });
  }

  function uniqueSlugs(list) {
    var out = [];
    (list || []).forEach(function (slug) {
      var s = String(slug || "").trim();
      if (!s || out.indexOf(s) !== -1) return;
      out.push(s);
    });
    return out;
  }

  function normalizeTrabajoAreaSlugs(data) {
    data = data || {};
    var fromArray = Array.isArray(data.areaSlugs) ? data.areaSlugs : [];
    var slugs = uniqueSlugs(fromArray);
    if (data.areaSlug) {
      var primary = String(data.areaSlug).trim();
      if (primary) {
        slugs = uniqueSlugs([primary].concat(slugs));
      }
    }
    return slugs;
  }

  function trabajoMatchesArea(trabajo, areaSlug) {
    if (!areaSlug) return true;
    return normalizeTrabajoAreaSlugs(trabajo).indexOf(areaSlug) !== -1;
  }

  function mapTrabajo(id, data) {
    data = data || {};
    var imagenes = window.MuniNoticiaImagenes
      ? window.MuniNoticiaImagenes.normalizeImagenes(data)
      : [];
    var cover = window.MuniNoticiaImagenes
      ? window.MuniNoticiaImagenes.coverUrl(data)
      : data.imagenUrl || "";
    var areaSlugs = normalizeTrabajoAreaSlugs(data);
    return {
      id: id,
      slug: data.slug || id,
      areaSlug: areaSlugs[0] || data.areaSlug || "",
      areaSlugs: areaSlugs,
      titulo: data.titulo,
      bajada: data.bajada,
      cuerpo: data.cuerpo,
      imagen: cover,
      imagenes: imagenes,
      ubicacion: data.ubicacion || "",
      barrio: data.barrio || "",
      estadoObra: data.estadoObra,
      estadoPublicacion: data.estadoPublicacion,
      fechaPublicacion: data.fechaPublicacion || "",
      publicadoEn: resolveTrabajoPublishedInstant(data),
      destacada: !!data.destacada,
      likesCount: data.likesCount != null ? Number(data.likesCount) || 0 : 0,
      viewsCount: data.viewsCount != null ? Number(data.viewsCount) || 0 : 0,
    };
  }

  function isTrabajoFinalizado(estadoObra) {
    return estadoObra === "finalizado";
  }

  function sortTrabajosPublicados(items) {
    return (items || []).slice().sort(function (a, b) {
      var aFinal = isTrabajoFinalizado(a.estadoObra);
      var bFinal = isTrabajoFinalizado(b.estadoObra);
      if (aFinal !== bFinal) return aFinal ? 1 : -1;

      var av = a.publicadoEn || a.fechaPublicacion || "";
      var bv = b.publicadoEn || b.fechaPublicacion || "";
      if (av === bv) return 0;
      return av > bv ? -1 : 1;
    });
  }

  function isConfigured() {
    return window.MuniFirebase && window.MuniFirebase.isConfigured();
  }

  function getRemovedAreaSlugs() {
    return window.MUNI_REMOVED_AREA_SLUGS || ["educacion"];
  }

  function filterVisibleAreas(areas) {
    var removed = getRemovedAreaSlugs();
    return (areas || []).filter(function (area) {
      if (!area || !area.slug) return false;
      if (removed.indexOf(area.slug) !== -1) return false;
      if (area.activa === false) return false;
      return true;
    });
  }

  /** Completa áreas de Firebase con las del seed local (por si aún no se importaron). */
  function mergeAreasWithSeed(firebaseAreas) {
    var seed = window.MUNI_FIREBASE_SEED_AREAS || [];
    var bySlug = {};

    (firebaseAreas || []).forEach(function (area) {
      bySlug[area.slug] = area;
    });

    seed.forEach(function (seedArea) {
      if (getRemovedAreaSlugs().indexOf(seedArea.slug) !== -1) return;
      if (seedArea.activa === false) return;
      if (!bySlug[seedArea.slug]) {
        bySlug[seedArea.slug] = mapArea(seedArea.slug, seedArea);
        return;
      }
      if (seedArea.nombre) {
        bySlug[seedArea.slug].nombre = seedArea.nombre;
      }
      if (seedArea.orden != null) {
        bySlug[seedArea.slug].orden = seedArea.orden;
      }
      if (seedArea.responsable && seedArea.responsable !== "A definir") {
        bySlug[seedArea.slug].responsable = seedArea.responsable;
        if (seedArea.slug === "intendencia" || seedArea.contacto === "") {
          bySlug[seedArea.slug].contacto = "";
        } else {
          bySlug[seedArea.slug].contacto = seedArea.contacto || bySlug[seedArea.slug].contacto;
        }
      } else if (seedArea.contacto && /\d{6,}/.test(String(seedArea.contacto))) {
        // Teléfonos oficiales del listado, aunque el responsable figure "A definir"
        bySlug[seedArea.slug].contacto = seedArea.contacto;
      }
      if (seedArea.fotoEncargado) {
        bySlug[seedArea.slug].fotoEncargado = seedArea.fotoEncargado;
      }
      if (seedArea.webExterna) {
        bySlug[seedArea.slug].webExterna = seedArea.webExterna;
      }
      if (seedArea.folletoUrl) {
        bySlug[seedArea.slug].folletoUrl = seedArea.folletoUrl;
      }
      if (seedArea.mapasUrl) {
        bySlug[seedArea.slug].mapasUrl = seedArea.mapasUrl;
      }
      if (seedArea.mapaBarriosUrl) {
        bySlug[seedArea.slug].mapaBarriosUrl = seedArea.mapaBarriosUrl;
      }
      if (Array.isArray(seedArea.documentos) && seedArea.documentos.length) {
        bySlug[seedArea.slug].documentos = seedArea.documentos.slice();
      }
      if (Array.isArray(seedArea.enlaces) && seedArea.enlaces.length) {
        bySlug[seedArea.slug].enlaces = seedArea.enlaces.slice();
      }
      if (seedArea.recursosIntro) {
        bySlug[seedArea.slug].recursosIntro = seedArea.recursosIntro;
      }
    });

    return filterVisibleAreas(
      Object.keys(bySlug)
        .map(function (slug) {
          return bySlug[slug];
        })
        .sort(function (a, b) {
          return (a.orden != null ? a.orden : 999) - (b.orden != null ? b.orden : 999);
        })
    );
  }

  function sortByFieldDesc(items, field) {
    return items.slice().sort(function (a, b) {
      var av = a[field] || "";
      var bv = b[field] || "";
      if (av === bv) return 0;
      return av > bv ? -1 : 1;
    });
  }

  async function queryWithIndexFallback(runQuery, runFallback) {
    try {
      return await runQuery();
    } catch (err) {
      var needsIndex =
        (err && err.code === "failed-precondition") ||
        (err && err.message && err.message.indexOf("index") !== -1);
      if (!needsIndex || !runFallback) throw err;
      return await runFallback();
    }
  }

  function mapEventoFlyer(id, data) {
    return mapAgendaEventoPublic(id, {
      fechaInicio: data.fechaEvento,
      fechaFin: data.fechaEvento,
      areaSlug: data.areaSlug,
      titulo: data.titulo,
      imagenUrl: data.imagenUrl,
      estadoPublicacion: data.estadoPublicacion,
      createdBy: data.createdBy,
    });
  }

  function mapAgendaEventoPublic(id, data) {
    var inicio = normalizeFechaEventoIso(data.fechaInicio || data.fecha || data.fechaEvento);
    var fin = normalizeFechaEventoIso(data.fechaFin || inicio);
    if (fin < inicio) fin = inicio;
    return {
      id: id,
      areaSlug: data.areaSlug || "",
      areaNombre: data.areaNombre || "",
      titulo: data.titulo || "",
      imagenUrl: data.imagenUrl || "",
      fechaEvento: inicio,
      fechaInicio: inicio,
      fechaFin: fin,
      hora: data.hora || "",
      lugar: data.lugar || "",
      descripcion: data.descripcion || "",
      tipoEvento: data.tipoEvento || "otro",
      estadoPublicacion: data.estadoPublicacion || "",
      createdBy: data.createdBy || "",
    };
  }

  function mapMapaPunto(id, data) {
    if (window.MuniMapa && window.MuniMapa.mapMapaPunto) {
      return window.MuniMapa.mapMapaPunto(id, data);
    }
    data = data || {};
    var lat = data.lat != null && data.lat !== "" ? Number(data.lat) : null;
    var lng = data.lng != null && data.lng !== "" ? Number(data.lng) : null;
    if ((lat == null || isNaN(lat)) && data.location && typeof data.location.latitude === "number") {
      lat = data.location.latitude;
      lng = data.location.longitude;
    }
    return {
      id: id,
      titulo: data.titulo || "",
      descripcion: data.descripcion || "",
      tipoMapa: data.tipoMapa || "actividad",
      lat: lat != null && !isNaN(lat) ? lat : null,
      lng: lng != null && !isNaN(lng) ? lng : null,
      radioMetros: data.radioMetros != null ? Number(data.radioMetros) : null,
      barrio: data.barrio || "",
      areaSlug: data.areaSlug || "",
      areaNombre: data.areaNombre || "",
      estadoObra: data.estadoObra || "",
      fechaInicio: data.fechaInicio || "",
      fechaFin: data.fechaFin || "",
      enlaceUrl: data.enlaceUrl || "",
      estadoPublicacion: String(data.estadoPublicacion || "pendiente").trim(),
      createdBy: data.createdBy || "",
    };
  }

  function isValidMapCoord(lat, lng) {
    if (window.MuniMapa && window.MuniMapa.isValidCoord) {
      return window.MuniMapa.isValidCoord(lat, lng);
    }
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    return true;
  }

  function filterPuntosPublicos(puntos) {
    return (puntos || []).filter(function (p) {
      if (!isValidMapCoord(p.lat, p.lng)) return false;
      if (window.MuniMapa && window.MuniMapa.isPuntoVisibleEnMapaPublico) {
        return window.MuniMapa.isPuntoVisibleEnMapaPublico(p);
      }
      return p.tipoMapa !== "barrio";
    });
  }

  function parseFirestoreFieldValue(value) {
    if (!value || typeof value !== "object") return null;
    if (value.stringValue != null) return value.stringValue;
    if (value.doubleValue != null) return value.doubleValue;
    if (value.integerValue != null) return Number(value.integerValue);
    if (value.booleanValue != null) return value.booleanValue;
    if (value.timestampValue != null) return value.timestampValue;
    if (value.nullValue != null) return null;
    return null;
  }

  function parseFirestoreDocumentFields(doc) {
    if (!doc || !doc.fields) return { id: "", data: {} };
    var data = {};
    Object.keys(doc.fields).forEach(function (key) {
      data[key] = parseFirestoreFieldValue(doc.fields[key]);
    });
    var parts = String(doc.name || "").split("/");
    var id = parts.length ? parts[parts.length - 1] : "";
    return { id: id, data: data };
  }

  function parseFirestoreDocument(doc) {
    var parsed = parseFirestoreDocumentFields(doc);
    if (!parsed.id) return null;
    return mapMapaPunto(parsed.id, parsed.data);
  }

  function isAreaPubliclyReadable(data) {
    if (!data) return false;
    if (data.activa === false) return false;
    return true;
  }

  async function loadMapaPuntosPublicRest() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId || !cfg.apiKey) return [];

    var url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(cfg.projectId) +
      "/databases/(default)/documents:runQuery";

    var res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": cfg.apiKey,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "mapa_puntos" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "estadoPublicacion" },
              op: "EQUAL",
              value: { stringValue: "publicado" },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error("Firestore REST " + res.status + ": " + errText.slice(0, 200));
    }

    var rows = await res.json();
    var puntos = [];
    (rows || []).forEach(function (row) {
      if (!row || !row.document) return;
      var punto = parseFirestoreDocument(row.document);
      if (!punto || punto.estadoPublicacion !== "publicado") return;
      if (isValidMapCoord(punto.lat, punto.lng)) {
        puntos.push(punto);
      }
    });
    return filterPuntosPublicos(puntos);
  }

  async function loadMapaPuntosPublicSdk(db) {
    if (!db) return [];
    var snap = await db.collection("mapa_puntos").where("estadoPublicacion", "==", "publicado").get();
    var puntos = [];
    snap.forEach(function (doc) {
      var punto = mapMapaPunto(doc.id, doc.data());
      if (punto.estadoPublicacion !== "publicado") return;
      if (isValidMapCoord(punto.lat, punto.lng)) {
        puntos.push(punto);
      }
    });
    return filterPuntosPublicos(puntos);
  }

  async function loadMapaPuntosPublic(db) {
    var puntos = [];

    try {
      puntos = await loadMapaPuntosPublicRest();
      if (puntos.length) return puntos;
    } catch (restErr) {
      console.warn("loadMapaPuntosPublic REST", restErr);
    }

    try {
      puntos = await loadMapaPuntosPublicSdk(db);
    } catch (sdkErr) {
      console.warn("loadMapaPuntosPublic SDK", sdkErr);
      throw sdkErr;
    }

    return puntos;
  }

  function todayIsoArgentina() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  }

  function normalizeFechaEventoIso(value) {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 10);
    if (value.toDate && typeof value.toDate === "function") {
      return value.toDate().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
    }
    if (value.seconds != null) {
      return new Date(value.seconds * 1000).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
    }
    return String(value).slice(0, 10);
  }

  function isEventoFlyerPublico(ev) {
    if (!ev || ev.estadoPublicacion !== "publicado") return false;
    var fin = normalizeFechaEventoIso(ev.fechaFin || ev.fechaEvento);
    if (!fin) return false;
    return fin >= todayIsoArgentina();
  }

  function filterEventosActivos(eventos) {
    return (eventos || [])
      .filter(isEventoFlyerPublico)
      .sort(function (a, b) {
        var av = String(a.fechaInicio || a.fechaEvento || "").slice(0, 10);
        var bv = String(b.fechaInicio || b.fechaEvento || "").slice(0, 10);
        if (av === bv) return 0;
        return av < bv ? -1 : 1;
      });
  }

  function mapEventosPublicFromFirestoreRows(rows) {
    var eventos = [];
    (rows || []).forEach(function (row) {
      if (!row || !row.document) return;
      var parsed = parseFirestoreDocumentFields(row.document);
      if (parsed.data.estadoPublicacion !== "publicado") return;
      eventos.push(mapAgendaEventoPublic(parsed.id, parsed.data));
    });
    return eventos;
  }

  function mapLegacyFlyersFromFirestoreRows(rows) {
    var eventos = [];
    (rows || []).forEach(function (row) {
      if (!row || !row.document) return;
      var parsed = parseFirestoreDocumentFields(row.document);
      if (parsed.data.estadoPublicacion !== "publicado") return;
      eventos.push(mapEventoFlyer("flyer-" + parsed.id, parsed.data));
    });
    return eventos;
  }

  function mergeEventosPublicos(agendaEventos, legacyFlyers) {
    var seen = new Map();
    var merged = [];

    function addList(list) {
      (list || []).forEach(function (ev) {
        if (!ev || !ev.id) return;
        if (seen.has(ev.id)) return;
        seen.set(ev.id, true);
        merged.push(ev);
      });
    }

    addList(agendaEventos);
    addList(legacyFlyers);
    return filterEventosActivos(merged);
  }

  async function loadAgendaEventosPublicRest() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId || !cfg.apiKey) return [];

    var url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(cfg.projectId) +
      "/databases/(default)/documents:runQuery";

    var res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": cfg.apiKey,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "agenda_eventos" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "estadoPublicacion" },
              op: "EQUAL",
              value: { stringValue: "publicado" },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error("Firestore REST agenda_eventos " + res.status + ": " + errText.slice(0, 200));
    }

    return mapEventosPublicFromFirestoreRows(await res.json());
  }

  async function loadLegacyEventosFlyersPublicRest() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId || !cfg.apiKey) return [];

    var url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(cfg.projectId) +
      "/databases/(default)/documents:runQuery";

    var res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": cfg.apiKey,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "eventos_flyers" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "estadoPublicacion" },
              op: "EQUAL",
              value: { stringValue: "publicado" },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error("Firestore REST eventos_flyers " + res.status + ": " + errText.slice(0, 200));
    }

    return mapLegacyFlyersFromFirestoreRows(await res.json());
  }

  async function loadAgendaEventosPublicSdk(db) {
    if (!db) return [];

    var today = todayIsoArgentina();
    var snap = await queryWithIndexFallback(
      function () {
        return db
          .collection("agenda_eventos")
          .where("estadoPublicacion", "==", "publicado")
          .where("fechaFin", ">=", today)
          .orderBy("fechaFin", "asc")
          .orderBy("fechaInicio", "asc")
          .limit(50)
          .get();
      },
      function () {
        return db.collection("agenda_eventos").where("estadoPublicacion", "==", "publicado").get();
      }
    );

    var eventos = [];
    snap.forEach(function (doc) {
      eventos.push(mapAgendaEventoPublic(doc.id, doc.data()));
    });
    return eventos;
  }

  async function loadLegacyEventosFlyersPublicSdk(db) {
    if (!db) return [];

    var today = todayIsoArgentina();
    var snap = await queryWithIndexFallback(
      function () {
        return db
          .collection("eventos_flyers")
          .where("estadoPublicacion", "==", "publicado")
          .where("fechaEvento", ">=", today)
          .orderBy("fechaEvento", "asc")
          .limit(50)
          .get();
      },
      function () {
        return db.collection("eventos_flyers").where("estadoPublicacion", "==", "publicado").get();
      }
    );

    var flyers = [];
    snap.forEach(function (doc) {
      flyers.push(mapEventoFlyer("flyer-" + doc.id, doc.data()));
    });
    return flyers;
  }

  async function loadEventosFlyersPublic(db) {
    if (!db) {
      var demo = filterEventosActivos((window.MUNI_DATA && window.MUNI_DATA.eventosFlyers) || []);
      if (demo.length) return demo;
      try {
        var agendaRest = await loadAgendaEventosPublicRest();
        var legacyRest = await loadLegacyEventosFlyersPublicRest();
        return mergeEventosPublicos(agendaRest, legacyRest);
      } catch (restErr) {
        console.warn("loadEventosFlyersPublic REST", restErr);
        return [];
      }
    }

    var agenda = [];
    var legacy = [];

    try {
      agenda = await loadAgendaEventosPublicSdk(db);
    } catch (sdkErr) {
      console.warn("loadAgendaEventosPublic SDK", sdkErr);
    }

    try {
      legacy = await loadLegacyEventosFlyersPublicSdk(db);
    } catch (legacyErr) {
      console.warn("loadLegacyEventosFlyersPublic SDK", legacyErr);
    }

    if (!agenda.length) {
      try {
        agenda = await loadAgendaEventosPublicRest();
      } catch (restErr) {
        console.warn("loadAgendaEventosPublic REST", restErr);
      }
    }

    if (!legacy.length) {
      try {
        legacy = await loadLegacyEventosFlyersPublicRest();
      } catch (legacyRestErr) {
        console.warn("loadLegacyEventosFlyersPublic REST", legacyRestErr);
      }
    }

    return mergeEventosPublicos(agenda, legacy);
  }

  function mapAreasFromFirestoreRows(rows) {
    var areas = [];
    (rows || []).forEach(function (row) {
      if (!row || !row.document) return;
      var parsed = parseFirestoreDocumentFields(row.document);
      if (!parsed.id || getRemovedAreaSlugs().indexOf(parsed.id) !== -1) return;
      if (!isAreaPubliclyReadable(parsed.data)) return;
      areas.push({ mapped: mapArea(parsed.id, parsed.data), orden: parsed.data.orden });
    });
    areas.sort(function (a, b) {
      var av = a.orden != null ? a.orden : 999;
      var bv = b.orden != null ? b.orden : 999;
      return av - bv;
    });
    return areas.map(function (row) {
      return row.mapped;
    });
  }

  async function loadAreasPublicRest() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId || !cfg.apiKey) return [];

    var url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(cfg.projectId) +
      "/databases/(default)/documents:runQuery";

    var res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": cfg.apiKey,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "areas" }],
        },
      }),
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error("Firestore REST areas " + res.status + ": " + errText.slice(0, 200));
    }

    return mapAreasFromFirestoreRows(await res.json());
  }

  async function loadAreasPublicSdk(db) {
    if (!db) return [];
    var areas = [];
    var areasSnap = await db.collection("areas").get();
    areasSnap.forEach(function (doc) {
      if (getRemovedAreaSlugs().indexOf(doc.id) !== -1) return;
      var data = doc.data();
      if (!isAreaPubliclyReadable(data)) return;
      areas.push({ mapped: mapArea(doc.id, data), orden: data.orden });
    });
    areas.sort(function (a, b) {
      var av = a.orden != null ? a.orden : 999;
      var bv = b.orden != null ? b.orden : 999;
      return av - bv;
    });
    return areas.map(function (row) {
      return row.mapped;
    });
  }

  async function loadAreasPublic(db) {
    var areas = [];
    try {
      areas = await loadAreasPublicSdk(db);
    } catch (sdkErr) {
      console.warn("loadAreasPublic SDK", sdkErr);
    }

    if (!areas.length) {
      try {
        areas = await loadAreasPublicRest();
      } catch (restErr) {
        console.warn("loadAreasPublic REST", restErr);
      }
    }

    return mergeAreasWithSeed(areas);
  }

  function mapAnuncioEntrada(data) {
    if (!data || !data.imagenUrl) return null;
    return {
      activo: !!data.activo,
      imagenUrl: data.imagenUrl || "",
      enlaceUrl: data.enlaceUrl || "",
      titulo: data.titulo || "Anuncio municipal",
      version: data.version || data.updatedAt || "",
    };
  }

  async function loadAnuncioEntradaRest() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId || !cfg.apiKey) return null;

    var url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(cfg.projectId) +
      "/databases/(default)/documents/portal_config/anuncio_entrada";

    var res = await fetch(url, {
      headers: { "X-Goog-Api-Key": cfg.apiKey },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      var errText = await res.text();
      throw new Error("Firestore REST anuncio " + res.status + ": " + errText.slice(0, 200));
    }

    var doc = await res.json();
    var parsed = parseFirestoreDocumentFields(doc);
    var anuncio = mapAnuncioEntrada(parsed.data);
    if (!anuncio || !anuncio.activo) return null;
    return anuncio;
  }

  async function loadAnuncioEntradaPublic() {
    if (!isConfigured()) return null;

    try {
      var db = window.MuniFirebase.db();
      if (db) {
        window.MuniFirebase.init();
        var snap = await db.collection("portal_config").doc("anuncio_entrada").get();
        if (snap.exists) {
          var anuncio = mapAnuncioEntrada(snap.data());
          if (anuncio && anuncio.activo) return anuncio;
        }
      }
    } catch (sdkErr) {
      console.warn("loadAnuncioEntradaPublic SDK", sdkErr);
    }

    try {
      return await loadAnuncioEntradaRest();
    } catch (restErr) {
      console.warn("loadAnuncioEntradaPublic REST", restErr);
      return null;
    }
  }

  async function loadPublicPortalData() {
    if (!isConfigured()) {
      return {
        source: "demo",
        areas: window.MUNI_DATA.areas,
        noticias: window.MUNI_DATA.noticias,
        eventosFlyers: filterEventosActivos((window.MUNI_DATA && window.MUNI_DATA.eventosFlyers) || []),
      };
    }

    var db = window.MuniFirebase.db();
    if (!db) {
      return {
        source: "demo",
        areas: window.MUNI_DATA.areas,
        noticias: window.MUNI_DATA.noticias,
        eventosFlyers: filterEventosActivos((window.MUNI_DATA && window.MUNI_DATA.eventosFlyers) || []),
      };
    }

    window.MuniFirebase.init();

    var areas = [];
    var noticias = [];
    var eventosFlyers = [];

    try {
      var results = await Promise.all([
        loadAreasPublic(db).catch(function (err) {
          console.warn("No se pudieron cargar áreas municipales.", err);
          return [];
        }),
        loadTrabajosPublic().catch(function (err) {
          console.warn("No se pudieron cargar novedades publicadas.", err);
          return [];
        }),
        loadEventosFlyersPublic(db).catch(function (err) {
          console.warn("No se pudieron cargar flyers de eventos; el resto del portal sigue disponible.", err);
          return [];
        }),
      ]);
      areas = results[0];
      noticias = results[1];
      eventosFlyers = results[2];
      var engagementMap = await loadTrabajoEngagementMap(db).catch(function () {
        return {};
      });
      noticias = applyEngagementMap(noticias, engagementMap);
    } catch (err) {
      console.warn("Error al cargar datos del portal.", err);
    }

    return { source: "firebase", areas: areas, noticias: noticias, eventosFlyers: eventosFlyers };
  }

  function mapTrabajosFromFirestoreRows(rows) {
    var noticias = [];
    (rows || []).forEach(function (row) {
      if (!row || !row.document) return;
      var parsed = parseFirestoreDocumentFields(row.document);
      if (parsed.data.estadoPublicacion !== "publicado") return;
      noticias.push(mapTrabajo(parsed.id, parsed.data));
    });
    return sortTrabajosPublicados(noticias);
  }

  async function loadTrabajosPublicRest() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId || !cfg.apiKey) return [];

    var url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(cfg.projectId) +
      "/databases/(default)/documents:runQuery";

    var res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": cfg.apiKey,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "trabajos" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "estadoPublicacion" },
              op: "EQUAL",
              value: { stringValue: "publicado" },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error("Firestore REST trabajos " + res.status + ": " + errText.slice(0, 200));
    }

    return mapTrabajosFromFirestoreRows(await res.json());
  }

  async function loadTrabajosPublicSdk(db) {
    if (!db) return [];

    var trabajosSnap = await queryWithIndexFallback(
      function () {
        return db
          .collection("trabajos")
          .where("estadoPublicacion", "==", "publicado")
          .orderBy("publishedAt", "desc")
          .get();
      },
      function () {
        return db.collection("trabajos").where("estadoPublicacion", "==", "publicado").get();
      }
    );

    var noticias = [];
    trabajosSnap.forEach(function (doc) {
      noticias.push(mapTrabajo(doc.id, doc.data()));
    });
    return sortTrabajosPublicados(noticias);
  }

  async function loadTrabajosPublic() {
    if (!isConfigured()) {
      return (window.MUNI_DATA && window.MUNI_DATA.noticias) || [];
    }
    var db = window.MuniFirebase.db();
    if (!db) return (window.MUNI_DATA && window.MUNI_DATA.noticias) || [];
    window.MuniFirebase.init();

    var noticias = [];
    try {
      noticias = await loadTrabajosPublicSdk(db);
    } catch (sdkErr) {
      console.warn("loadTrabajosPublic SDK", sdkErr);
    }

    if (!noticias.length) {
      try {
        noticias = await loadTrabajosPublicRest();
      } catch (restErr) {
        console.warn("loadTrabajosPublic REST", restErr);
      }
    }

    return noticias;
  }

  async function loadTrabajoByIdRest(id) {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId || !cfg.apiKey || !id) return null;

    var url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(cfg.projectId) +
      "/databases/(default)/documents/trabajos/" +
      encodeURIComponent(id);

    var res = await fetch(url, {
      headers: { "X-Goog-Api-Key": cfg.apiKey },
    });
    if (!res.ok) return null;

    var doc = await res.json();
    var parsed = parseFirestoreDocumentFields(doc);
    if (parsed.data.estadoPublicacion !== "publicado") return null;
    return mapTrabajo(parsed.id, parsed.data);
  }

  async function loadTrabajoById(id) {
    if (!isConfigured() || !id) return null;
    var db = window.MuniFirebase.db();
    if (!db) return null;
    window.MuniFirebase.init();

    try {
      var snap = await db.collection("trabajos").doc(id).get();
      if (snap.exists) {
        var data = snap.data();
        if (data.estadoPublicacion === "publicado") {
          var noticia = mapTrabajo(snap.id, data);
          var stats = await loadTrabajoEngagementById(db, id);
          if (stats) {
            noticia.likesCount = stats.likesCount;
            noticia.viewsCount = stats.viewsCount;
          }
          return noticia;
        }
      }
    } catch (sdkErr) {
      console.warn("loadTrabajoById SDK", sdkErr);
    }

    try {
      var noticiaRest = await loadTrabajoByIdRest(id);
      if (!noticiaRest) return null;
      var statsRest = await loadTrabajoEngagementById(db, id);
      if (statsRest) {
        noticiaRest.likesCount = statsRest.likesCount;
        noticiaRest.viewsCount = statsRest.viewsCount;
      }
      return noticiaRest;
    } catch (restErr) {
      console.warn("loadTrabajoById REST", restErr);
      return null;
    }
  }

  async function getUserProfile(uid) {
    return window.MuniFirebase.getUserProfile(uid);
  }

  async function seedAreas() {
    var db = window.MuniFirebase.db();
    var batch = db.batch();
    var areas = window.MUNI_FIREBASE_SEED_AREAS || [];
    areas.forEach(function (area) {
      var ref = db.collection("areas").doc(area.slug);
      batch.set(ref, area, { merge: true });
    });
    getRemovedAreaSlugs().forEach(function (slug) {
      batch.set(db.collection("areas").doc(slug), { activa: false }, { merge: true });
    });
    await batch.commit();
    return areas.length;
  }

  window.MuniApi = {
    mapArea: mapArea,
    mapTrabajo: mapTrabajo,
    normalizeTrabajoAreaSlugs: normalizeTrabajoAreaSlugs,
    trabajoMatchesArea: trabajoMatchesArea,
    mapEventoFlyer: mapEventoFlyer,
    mapAgendaEventoPublic: mapAgendaEventoPublic,
    mapMapaPunto: mapMapaPunto,
    loadMapaPuntosPublic: loadMapaPuntosPublic,
    todayIsoArgentina: todayIsoArgentina,
    normalizeFechaEventoIso: normalizeFechaEventoIso,
    isEventoFlyerPublico: isEventoFlyerPublico,
    filterEventosActivos: filterEventosActivos,
    loadEventosFlyersPublic: loadEventosFlyersPublic,
    isConfigured: isConfigured,
    filterVisibleAreas: filterVisibleAreas,
    mergeAreasWithSeed: mergeAreasWithSeed,
    getRemovedAreaSlugs: getRemovedAreaSlugs,
    loadPublicPortalData: loadPublicPortalData,
    loadAnuncioEntradaPublic: loadAnuncioEntradaPublic,
    loadTrabajosPublic: loadTrabajosPublic,
    loadTrabajoById: loadTrabajoById,
    getUserProfile: getUserProfile,
    seedAreas: seedAreas,
  };
})();
