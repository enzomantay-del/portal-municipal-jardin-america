# Portal Municipal — Jardín América

Portal web oficial de la **Municipalidad de Jardín América**, Misiones, Argentina. Centraliza novedades de gestión, obras públicas, eventos, mapas interactivos y comunicación con vecinos.

## Funcionalidades

### Portal público
- Novedades y acciones por área municipal (Obras, Turismo, Salud, Deportes, etc.)
- Calendario de eventos y radio municipal (FM Los Pioneros 98.5)
- Mapa interactivo de obras, contenedores y barrios (Leaflet)
- Enlace al sitio turístico oficial
- Suscripción a avisos por WhatsApp

### Paneles internos
- **Admin:** aprobación de publicaciones, gestión de áreas y usuarios
- **Encargado:** carga de novedades con flujo pendiente → publicado
- **Agenda interna** del staff con notificaciones push (FCM)

### Ciudadanos
- Reporte de problemas urbanos (basureros, alcantarillas, etc.) vía Netlify Functions
- Galería hero, folleto turismo, integración con plataforma de campaña

## Tecnologías

- HTML5, CSS3, JavaScript
- Firebase (Auth, Firestore, Storage, Cloud Messaging)
- Netlify Functions + Edge Functions
- Leaflet (mapas)
- Netlify / GitHub Pages (deploy)

## Demo en vivo

**[enzomantay-del.github.io/portal-municipal-jardin-america](https://enzomantay-del.github.io/portal-municipal-jardin-america/)**

Portal público municipal (novedades, eventos, mapas). Los paneles admin requieren credenciales.

## Configuración local

1. Copiá `js/firebase-config.example.js` → `js/firebase-config.js`
2. Completá con las credenciales de tu proyecto Firebase
3. Ver guía completa en `setup-firebase.md`

```bash
npm install
npm run serve
```

Abrí `http://localhost:3456`

## Proyectos relacionados

- [Turismo Jardín América](https://github.com/enzomantay-del/jardin-america-turismo)
- [Plataforma Campaña — Directo al vecino](https://github.com/enzomantay-del/plataforma-campa-a)
- [Jardín Sale Week](https://github.com/enzomantay-del/jardin-sale-week)

## Autor

**Enzo Mantay** — [enzomantay-del.github.io](https://enzomantay-del.github.io)
