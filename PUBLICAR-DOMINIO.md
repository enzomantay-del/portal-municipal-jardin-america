# Publicar el portal en jardinamerica.gob.ar

El sitio queda así:

| URL | Contenido |
|---|---|
| `https://jardinamerica.gob.ar/` | Portal municipal |
| `https://jardinamerica.gob.ar/turismo/` | Sitio de turismo |

Mientras el dominio no esté delegado, también funciona en GitHub Pages:

| URL temporal | Contenido |
|---|---|
| `https://enzomantay-del.github.io/portal-municipal-jardin-america/` | Portal |
| `https://enzomantay-del.github.io/portal-municipal-jardin-america/turismo/` | Turismo |

Hosting recomendado: **Netlify** (gratis) + delegación DNS en **NIC Argentina**.

## Paso 1 — Cuenta Netlify

1. Entrá a https://app.netlify.com y creá una cuenta (podés usar GitHub).
2. **Add new site → Import an existing project**.
3. Elegí el repo: `enzomantay-del/portal-municipal-jardin-america`.
4. Branch: `main`.
5. Publish directory: `.` (punto).
6. Build command: dejar vacío.
7. Deploy.

Vas a obtener una URL temporal tipo `https://algo.netlify.app`.

## Paso 2 — Dominio personalizado

1. En el sitio de Netlify → **Domain management** → **Add a domain**.
2. Agregá `jardinamerica.gob.ar`.
3. Netlify te va a mostrar **2 servidores DNS** (nameservers), algo como:
   - `dns1.pXX.nsone.net`
   - `dns2.pXX.nsone.net`
4. Copiá esos dos valores.

También podés agregar `www.jardinamerica.gob.ar` (Netlify lo sugiere solo).

## Paso 3 — Delegación en NIC Argentina (TAD)

1. Entrá a https://tramitesadistancia.gob.ar con Clave Fiscal del representante legal.
2. Buscá el trámite de **NIC Argentina** → **Delegación de dominio** (o “Registros, renovaciones y otras operaciones”).
3. Seleccioná `jardinamerica.gob.ar`.
4. Cargá los **2 DNS** que te dio Netlify.
5. Confirmá el trámite.

La activación puede demorar minutos u horas (a veces hasta 24–48 h).

## Paso 4 — Verificar

Cuando esté listo:

- https://jardinamerica.gob.ar/
- https://jardinamerica.gob.ar/turismo/

En Netlify, el dominio tiene que figurar como **Netlify DNS** / verificado, con HTTPS automático (candado).

## Actualizar turismo

El contenido de `/turismo/` se copia desde la carpeta hermana `jardin-america-turismo` con:

```bash
python scripts/sync-turismo.py
```

Después hacé commit y push (o redeploy en Netlify).

## Notas

- No hace falta un dominio aparte para turismo: va como carpeta `/turismo/`.
- El HTTPS lo activa Netlify solo cuando el DNS ya apunta bien.
- Renová el dominio `.gob.ar` todos los años en NIC (no es automático).
