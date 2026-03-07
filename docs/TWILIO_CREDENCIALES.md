# Credenciales de Twilio para Socrates AI (Fase 3)

Para que la integración de WhatsApp con Twilio funcione, necesitas configurar estas variables en tu `.env.local`.

## 1. Account SID y Auth Token

- **Dónde:** [Twilio Console](https://console.twilio.com) → **Account** (menú) → **API keys & tokens**, o la sección **Account Info** en el dashboard.
- **Variables:**
  - `TWILIO_ACCOUNT_SID`: identificador de tu cuenta (empieza por `AC...`, 34 caracteres).
  - `TWILIO_AUTH_TOKEN`: token secreto (clic en “Show” para verlo).

**Importante:** No subas el Auth Token a repositorios públicos ni lo expongas en el cliente. Solo se usa en el servidor (API routes, webhooks).

## 2. Webhook de WhatsApp (recibir mensajes)

Para que los mensajes entrantes de WhatsApp lleguen a tu app:

1. En Twilio Console: **Messaging** → **Try it out** → **Send a WhatsApp message** (o **Phone numbers** → tu número WhatsApp).
2. En la configuración del número/sender de WhatsApp, en **“When a message comes in”** (webhook URL) pon:
   - `https://TU_DOMINIO/api/webhooks/twilio`  
   Ejemplo en local con túnel (ngrok): `https://abc123.ngrok.io/api/webhooks/twilio`
3. Método: **POST**.

Twilio enviará ahí los mensajes entrantes y validaremos la petición con `TWILIO_AUTH_TOKEN` (cabecera `X-Twilio-Signature`).

## 3. (Opcional) Supabase Service Role para el webhook

El webhook no tiene sesión de usuario; escribe en Supabase (contactos, conversaciones, mensajes) con la clave de servicio:

- **Variable:** `SUPABASE_SERVICE_ROLE_KEY`
- **Dónde:** Supabase Dashboard → tu proyecto → **Settings** → **API** → **Project API keys** → **service_role** (secret).

Solo debe usarse en el servidor (p. ej. en la ruta `/api/webhooks/twilio`). No la expongas en el cliente.

## Resumen de variables

| Variable | Dónde obtenerla | Uso |
|----------|------------------|-----|
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account / API keys | Enviar mensajes, identificar cuenta |
| `TWILIO_AUTH_TOKEN` | Twilio Console → API keys & tokens | Validar webhook, llamadas API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | Webhook escribe en BD sin sesión |

Con estas tres (y las de Supabase ya configuradas), la Fase 3 puede recibir mensajes en el webhook y guardar números en la app.
