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
      orden: data.orden != null ? data.orden : 999,
      activa: data.activa !== false,
    };
  }

  function mapTrabajo(id, data) {
    return {
      id: id,
      slug: data.slug || id,
      areaSlug: data.areaSlug || "",
      titulo: data.titulo,
      bajada: data.bajada,
      cuerpo: data.cuerpo,
      imagen: data.imagenUrl || "",
      ubicacion: data.ubicacion || "",
      barrio: data.barrio || "",
      estadoObra: data.estadoObra,
      estadoPublicacion: data.estadoPublicacion,
      fechaPublicacion: data.fechaPublicacion || "",
      destacada: !!data.destacada,
    };
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
    return {
      id: id,
      areaSlug: data.areaSlug || "",
      titulo: data.titulo || "",
      imagenUrl: data.imagenUrl || "",
      fechaEvento: data.fechaEvento || "",
      estadoPublicacion: data.estadoPublicacion || "",
      createdBy: data.createdBy || "",
    };
  }

  function todayIsoArgentina() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  }

  function isEventoFlyerPublico(flyer) {
    if (!flyer || flyer.estadoPublicacion !== "publicado") return false;
    var fecha = String(flyer.fechaEvento || "").slice(0, 10);
    if (!fecha) return false;
    return fecha >= todayIsoArgentina();
  }

  function filterEventosActivos(flyers) {
    return (flyers || [])
      .filter(isEventoFlyerPublico)
      .sort(function (a, b) {
        var av = String(a.fechaEvento || "").slice(0, 10);
        var bv = String(b.fechaEvento || "").slice(0, 10);
        if (av === bv) return 0;
        return av < bv ? -1 : 1;
      });
  }

  async function loadEventosFlyersPublic(db) {
    if (!db) {
      return filterEventosActivos((window.MUNI_DATA && window.MUNI_DATA.eventosFlyers) || []);
    }

    var snap = await queryWithIndexFallback(
      function () {
        return db
          .collection("eventos_flyers")
          .where("estadoPublicacion", "==", "publicado")
          .orderBy("fechaEvento", "asc")
          .get();
      },
      function () {
        return db.collection("eventos_flyers").where("estadoPublicacion", "==", "publicado").get();
      }
    );

    var flyers = [];
    snap.forEach(function (doc) {
      flyers.push(mapEventoFlyer(doc.id, doc.data()));
    });
    return filterEventosActivos(flyers);
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
    try {
      var areasSnap = await queryWithIndexFallback(
        function () {
          return db.collection("areas").where("activa", "==", true).orderBy("orden").get();
        },
        function () {
          return db.collection("areas").where("activa", "==", true).get();
        }
      );

      areasSnap.forEach(function (doc) {
        if (getRemovedAreaSlugs().indexOf(doc.id) !== -1) return;
        var data = doc.data();
        if (data.activa === false) return;
        areas.push({ mapped: mapArea(doc.id, data), orden: data.orden });
      });
      areas.sort(function (a, b) {
        var av = a.orden != null ? a.orden : 999;
        var bv = b.orden != null ? b.orden : 999;
        return av - bv;
      });
      areas = areas.map(function (row) {
        return row.mapped;
      });
      areas = mergeAreasWithSeed(areas);
    } catch (err) {
      console.warn("No se pudieron cargar áreas desde Firebase; usando seed local.", err);
      areas = mergeAreasWithSeed([]);
    }

    var noticias = [];
    try {
      noticias = await loadTrabajosPublic();
    } catch (err) {
      console.warn("No se pudieron cargar novedades publicadas.", err);
    }

    var eventosFlyers = [];
    try {
      eventosFlyers = await loadEventosFlyersPublic(db);
    } catch (err) {
      console.warn("No se pudieron cargar flyers de eventos; el resto del portal sigue disponible.", err);
    }

    return { source: "firebase", areas: areas, noticias: noticias, eventosFlyers: eventosFlyers };
  }

  async function loadTrabajosPublic() {
    if (!isConfigured()) {
      return (window.MUNI_DATA && window.MUNI_DATA.noticias) || [];
    }
    var db = window.MuniFirebase.db();
    if (!db) return (window.MUNI_DATA && window.MUNI_DATA.noticias) || [];
    window.MuniFirebase.init();

    var trabajosSnap = await queryWithIndexFallback(
      function () {
        return db
          .collection("trabajos")
          .where("estadoPublicacion", "==", "publicado")
          .orderBy("fechaPublicacion", "desc")
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
    return sortByFieldDesc(noticias, "fechaPublicacion");
  }

  async function loadTrabajoById(id) {
    if (!isConfigured() || !id) return null;
    var db = window.MuniFirebase.db();
    var snap = await db.collection("trabajos").doc(id).get();
    if (!snap.exists) return null;
    var data = snap.data();
    if (data.estadoPublicacion !== "publicado") return null;
    return mapTrabajo(snap.id, data);
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
    mapEventoFlyer: mapEventoFlyer,
    todayIsoArgentina: todayIsoArgentina,
    isEventoFlyerPublico: isEventoFlyerPublico,
    filterEventosActivos: filterEventosActivos,
    loadEventosFlyersPublic: loadEventosFlyersPublic,
    isConfigured: isConfigured,
    filterVisibleAreas: filterVisibleAreas,
    mergeAreasWithSeed: mergeAreasWithSeed,
    getRemovedAreaSlugs: getRemovedAreaSlugs,
    loadPublicPortalData: loadPublicPortalData,
    loadTrabajosPublic: loadTrabajosPublic,
    loadTrabajoById: loadTrabajoById,
    getUserProfile: getUserProfile,
    seedAreas: seedAreas,
  };
})();
