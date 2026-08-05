# AmiBot con Gemini (Google AI)

AmiBot puede responder en lenguaje natural usando **Gemini**, siempre con la información del portal municipal (trámites, obras, turismo, contactos).

## Activar (obligatorio)

1. Creá una API key en [Google AI Studio](https://aistudio.google.com/apikey)  
   (botón **Create API key**). La clave puede empezar con `AIza…` o con `AQ.…`.
2. En Netlify → **Site configuration** → **Environment variables**:
   - Nombre exacto: `GEMINI_API_KEY`
   - Valor: pegá la clave **sin comillas** y **sin espacios**
   - Scopes: **Production** (y Preview si querés probar deploys de prueba)
   - (opcional) `GEMINI_MODEL` = `gemini-2.5-flash`
3. En Netlify → **Deploys** → **Trigger deploy** → **Clear cache and deploy site**.  
   Sin redeploy, la función no ve la clave nueva.

## Error: “API key not valid”

Causas más comunes:

1. Se pegó la clave de **Firebase** (`FIREBASE_API_KEY`) en lugar de la de **AI Studio**.
2. La clave tiene comillas (`"AIza..."`) o un espacio al final.
3. Se guardó la variable pero **no** se hizo redeploy.
4. La clave se borró o se restringió mal en Google Cloud.

**Qué hacer:** creá una clave nueva en AI Studio, reemplazá `GEMINI_API_KEY` en Netlify, redeploy, y probá de nuevo.

## Cómo se usa

1. Abrí AmiBot en el portal.
2. Escribí una pregunta (ej.: “¿dónde saco planos?”).
3. Tocá **Preguntar** o Enter.
4. Abajo quedan los temas relacionados del buscador local.

## Seguridad

- La clave **no** va en el HTML ni en JavaScript público.
- La función `netlify/functions/amibot-gemini.mjs` recibe la pregunta + fichas del portal y pide la respuesta a Gemini.
- El modelo está instruido para **no inventar** datos municipales.

## Costo

Gemini tiene cuota gratuita limitada. Si el uso crece, revisá el consumo en Google AI Studio / Cloud.
