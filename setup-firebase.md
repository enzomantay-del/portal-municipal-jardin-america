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

## 6) Flujo operativo

```
Encargado → encargado.html → carga novedad → pendiente
Admin     → admin.html     → aprueba      → publicado
Público   → index.html     → ve publicado
```

## 7) Colecciones Firestore

### `areas/{slug}`
Documentos con ID = slug (`obras-publicas`, `salud`, …).

### `trabajos/{autoId}`
Novedades con campos: `titulo`, `bajada`, `cuerpo`, `imagenUrl`, `areaSlug`, `estadoObra`, `estadoPublicacion`, `destacada`, `fechaPublicacion`, `createdBy`, timestamps.

### `users/{uid}`
Perfil con `role` (`admin` | `encargado`), `areaSlug`, `email`.

## 8) Índices compuestos

Si Firestore pide un índice al consultar, seguí el enlace del error en la consola del navegador. Consultas que suelen requerirlo:

- `trabajos`: `estadoPublicacion` + `fechaPublicacion`
- `trabajos`: `areaSlug` + `updatedAt`
- `trabajos`: `estadoPublicacion` + `updatedAt`

## 9) Publicación

Netlify Drop o GitHub Pages con la carpeta del proyecto.

En Firebase → Authentication → Settings → **Authorized domains**, agregá tu dominio Netlify.

## 10) Modo demo

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
