# Setup — Portal Municipal con Firebase

Proyecto **independiente** de Jardín Sale Week. Backend: **Firebase Spark (gratuito)**.

## Inicio rápido

1. Abrí **`configurar.html`** en el navegador — asistente paso a paso.
2. Creá el proyecto en [Firebase Console](https://console.firebase.google.com/).
3. Copiá las credenciales en **`js/firebase-config.js`**.

```bash
npm run setup:config   # crea firebase-config.js desde la plantilla si no existe
```

---

## 1) Crear proyecto Firebase

1. [console.firebase.google.com](https://console.firebase.google.com/) → **Agregar proyecto**
2. Nombre sugerido: `portal-municipal-jardin-america`
3. Activar **Authentication → Email/Password**
4. Crear **Firestore** (modo producción, región `southamerica-east1`)
5. Activar **Storage** (misma región)
6. Project settings → **Your apps → Web** → copiar `firebaseConfig`

## 2) Reglas de seguridad

| Servicio | Archivo | Dónde pegarlo |
|----------|---------|---------------|
| Firestore | `firebase/firestore.rules` | Firestore → Rules → Publish |
| Storage | `firebase/storage.rules` | Storage → Rules → Publish |

## 3) Configurar frontend

Editá `js/firebase-config.js`:

```javascript
window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "...",
  appId: "...",
};
```

> `js/firebase-config.js` está en `.gitignore`.

## 4) Primer administrador (una sola vez)

1. **Authentication → Add user** (email + contraseña)
2. Copiá el **UID** del usuario
3. **Firestore → Start collection** `users` → documento con ID = UID:

| Campo | Tipo | Valor |
|-------|------|-------|
| role | string | `admin` |
| email | string | tu email |
| areaSlug | null | — |

4. Entrá a **`admin.html`** con ese usuario
5. Clic en **Importar áreas municipales**

## 5) Encargados de área

1. Crear usuario en Authentication
2. En **admin.html → Asignar rol a usuario**:
   - UID del usuario
   - Rol: `encargado`
   - Área: ej. `obras-publicas`
3. El encargado entra en **`encargado.html`**

### Encargados del mapa de obras (Obras Públicas y Obras Privadas)

Estas dos áreas pueden cargar puntos en el **mapa interactivo** desde `encargado.html` → sección **Mapa**. Los puntos quedan **pendientes** hasta que el admin los aprueba en `admin.html`.

**Cuentas sugeridas** (crear en Firebase Authentication → Email/Password):

| Área | Email | Contraseña inicial | WhatsApp (opcional) |
|------|-------|-------------------|---------------------|
| Obras Públicas | `obras.publicas@municipalidadjardin.gov.ar` | `ObrasPublicas2026!` | `5493743667206` |
| Obras Privadas | `obras.privadas@municipalidadjardin.gov.ar` | `ObrasPrivadas2026!` | `5493794358121` |

> Cambiá las contraseñas después del primer ingreso.

**Pasos:**

1. **Authentication → Add user** con cada email y contraseña de la tabla.
2. Copiá el **UID** de cada usuario.
3. En **admin.html → Configuración → Asignar rol a usuario**:
   - Rol: `encargado`
   - Área: `obras-publicas` o `obras-privadas` según corresponda
   - Email y WhatsApp de referencia
4. **Publicá las reglas** de `firebase/firestore.rules` (incluyen permisos de `mapa_puntos` para estos encargados).
5. Opcional: `node scripts/crear-encargados-obras-auth.mjs` crea solo los usuarios Auth e imprime los UID para el paso 3.

## 6) Flujo operativo

```
Encargado (obras) → encargado.html → Mapa → pendiente
Admin           → admin.html     → Mapa → publicado
Público         → mapa.html      → ve publicado

Encargado → encargado.html → carga novedad → pendiente
Admin     → admin.html     → aprueba      → publicado
Público   → index.html     → ve publicado
```

## 7) Colecciones Firestore

### `areas/{slug}`
Documentos con ID = slug (`obras-publicas`, `salud`, …).

### `trabajos/{autoId}`
Novedades con campos: `titulo`, `bajada`, `cuerpo`, `imagenUrl`, `areaSlug`, `estadoObra`, `estadoPublicacion`, `destacada`, `fechaPublicacion`, `likesCount`, `viewsCount`, `createdBy`, timestamps.

### `engagement_fingerprints/{id}`
Uso interno (Netlify Function): evita contar dos veces la misma lectura o me gusta. No editable desde el cliente.

### `users/{uid}`
Perfil con `role` (`admin` | `encargado`), `areaSlug`, `email`, `telefonoWhatsapp` (opcional, para avisos de agenda interna).

### `agenda_eventos/{autoId}`
Agenda interna (no pública): `titulo`, `tipoEvento`, `fecha`, `hora`, `lugar`, `descripcion`, `areaSlug`, `areaNombre`, `createdBy`, `createdByEmail`, timestamps.

### `mapa_puntos/{autoId}`
Puntos del mapa público (`mapa.html`): `titulo`, `descripcion`, `tipoMapa` (`obra` | `contenedor` | `barrio` | `actividad`), `lat`, `lng`, `radioMetros` (opcional), `barrio`, `areaSlug`, `areaNombre`, `estadoObra`, `fechaInicio`, `fechaFin`, `estadoPublicacion`, `createdBy`, timestamps.

### `users/{uid}/fcm_tokens/{tokenId}`
Tokens de dispositivos para **notificaciones push** del staff (solo el propio usuario puede leer/escribir los suyos).

### `staff_notificaciones/{autoId}`
Avisos in-app para admin y encargados: `userId`, `titulo`, `mensaje`, `url`, `tipo`, `leida`, `createdByUid`, `createdAt`.

## 8) Me gusta y más leídas

Las novedades registran **lecturas** al abrir `noticia.html` y **me gusta** con el botón en el artículo. Los contadores se guardan en la colección `trabajo_engagement` (no modifican la novedad original). El ranking **Más leídas** usa `viewsCount`.

**Requisito:** publicar las reglas de `firebase/firestore.rules` en Firebase Console (incluyen `trabajo_engagement` y `engagement_fingerprints`).

## 9) Índices compuestos

Si Firestore pide un índice al consultar, seguí el enlace del error en la consola del navegador. Consultas que suelen requerirlo:

- `trabajos`: `estadoPublicacion` + `fechaPublicacion`
- `trabajos`: `areaSlug` + `updatedAt`
- `trabajos`: `estadoPublicacion` + `updatedAt`
- `staff_notificaciones`: `userId` + `createdAt` (desc) — campana de avisos en admin/encargado

## 10) Publicación

Netlify Drop o GitHub Pages con la carpeta del proyecto.

En Firebase → Authentication → Settings → **Authorized domains**, agregá tu dominio Netlify.

## 11) Avisos del staff (campana + push web)

Cuando un encargado o admin **crea un evento en la agenda interna**, el resto del staff recibe:

1. **Aviso en el panel** (campana 🔔 en `admin.html` y `encargado.html`)
2. **Push web** (si cada usuario activó notificaciones en su dispositivo)

No afecta al portal público ni a visitantes anónimos.

### Configuración Firebase

1. Firebase Console → **Build → Cloud Messaging**
2. Pestaña **Web Push certificates** → generar par de claves → copiar la **clave pública (VAPID)**
3. Pegarla en `js/firebase-config.js`:

```javascript
vapidKey: "Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
```

4. Publicar reglas de `firebase/firestore.rules` (incluyen `staff_notificaciones` y `users/{uid}/fcm_tokens`)

### Configuración Netlify

Variables de entorno (Site settings → Environment variables):

| Variable | Uso |
|----------|-----|
| `FIREBASE_API_KEY` | Verificar sesión al enviar push |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Enviar mensajes FCM (JSON completo de la cuenta de servicio) |

La function `staff-notify-push` se despliega automáticamente desde `netlify/functions/`.

### Uso en el panel

1. Entrá a `admin.html` o `encargado.html`
2. Clic en la **campana** → **Activar notificaciones push** (una vez por navegador/dispositivo)
3. Al crear un evento nuevo en la agenda, los demás usuarios del staff reciben aviso in-app y push

WhatsApp por Campaña sigue siendo opcional si tenés `campana-config.js` y teléfonos cargados.

## 12) Modo demo

Sin `firebase-config.js` configurado, el portal usa datos de ejemplo (`js/muni-data.js`).

---

## Estructura

```
portal-municipal-jardin-america/
├── firebase/
│   ├── firestore.rules
│   └── storage.rules
├── js/
│   ├── firebase-config.example.js
│   ├── firebase-config.js          # local, gitignored
│   ├── firebase-init.js
│   └── firebase-seed-areas.js
├── configurar.html                 # asistente setup
├── admin.html                      # moderación + roles
└── encargado.html                  # carga por área
```
