# AmiBot con Gemini (Google AI)

AmiBot puede responder en lenguaje natural usando **Gemini**, siempre con la información del portal municipal (trámites, obras, turismo, contactos).

## Activar (obligatorio)

1. Creá una API key en [Google AI Studio](https://aistudio.google.com/apikey).
2. En Netlify → **Site configuration** → **Environment variables**:
   - `GEMINI_API_KEY` = tu clave
   - (opcional) `GEMINI_MODEL` = `gemini-2.5-flash` (por defecto)
3. Hacé un **redeploy** del sitio para que la función tome la variable.

Sin `GEMINI_API_KEY`, AmiBot sigue funcionando con la búsqueda local; al preguntar con IA muestra un aviso de que falta configurar.

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
