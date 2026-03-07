# Qué hacer ahora y Fase Embedded Signup

## 1. Qué hacer AHORA (antes de Embedded Signup)

### Tu número de Twilio
- **No lo quites.** Sigue en Configuraciones. La app lo usa para saber que los mensajes que llegan a ese número son tuyos.
- Para **probar que todo funciona**:

1. **Unirte al Sandbox de Twilio** (si usas Sandbox):
   - En [Twilio Console](https://console.twilio.com) → Messaging → Try it out → Send a WhatsApp message (o WhatsApp → Sandbox).
   - Te dirán algo como: “Envía **join &lt;código&gt;** al número +1 831 222 XXXX”.
   - Desde tu WhatsApp personal envía exactamente ese mensaje (ej. `join ab12-cd34`) a ese número.
   - Cuando Twilio confirme que te uniste, ya puedes enviar mensajes normales.

2. **Enviar un mensaje de prueba**:
   - Envía un WhatsApp normal al número que tienes en Configuraciones (ej. +18382214055).
   - Entra en **Dashboard → Conversaciones**: ahí deberías ver la conversación y el mensaje.

3. **Si no usas Sandbox** (número en producción): solo envía un mensaje a ese número y revisa Conversaciones.

### Resumen
- **Número de Twilio en Configuraciones:** necesario; la app lo usa para enrutar mensajes a tu organización.
- **Probar ahora:** unirte al Sandbox (si aplica) → enviar mensaje al número → ver en **Conversaciones**.

---

## 2. Fase Embedded Signup: qué es y qué hace falta

Con Embedded Signup, **tus usuarios** (cada negocio) podrán conectar su propio número de WhatsApp desde la app, sin que tú lo des de alta a mano en Twilio.

### Qué tienes que hacer TÚ (pasos previos)

1. **Meta (Facebook)**
   - Verificación del negocio y 2FA en Meta Business Manager.
   - Crear una **app Meta** (tipo Business) en [developers.facebook.com](https://developers.facebook.com).
   - Añadir producto **WhatsApp** y seguir el flujo para ser **Tech Provider** (Embedded Signup).
   - App Review: solicitar permisos `whatsapp_business_messaging` y `whatsapp_business_management` (Meta pide vídeos y datos de uso).
   - Completar **Access Verification** cuando Meta apruebe la app.

2. **Twilio**
   - Solicitar el programa **WhatsApp Tech Provider** (abrir ticket en Twilio Help: “Part 2: Connect your Meta app to the Twilio Partner Solution”).
   - Enviar tu **Meta App ID** a Twilio.
   - Aceptar la **Partner Solution** de Twilio en Meta (WhatsApp → Partner Solutions).
   - Guardar el **Partner Solution ID** y el **Configuration ID** de Embedded Signup (Facebook Login for Business → Configurations).

3. **Variables de entorno** (cuando tengas los IDs), en `.env.local`:
   - `NEXT_PUBLIC_META_APP_ID` = App ID de tu app Meta.
   - `META_EMBEDDED_SIGNUP_CONFIG_ID` = Configuration ID del flujo Embedded Signup (Facebook Login for Business → Configurations).
   - `TWILIO_PARTNER_SOLUTION_ID` = Partner Solution ID que te da Twilio al aceptar la Partner Solution.
   Cuando las tres están definidas, en Configuraciones aparece la opción **“Conectar con WhatsApp (Embedded Signup)”** para que tus usuarios conecten su número.

Guía detallada: [Twilio – WhatsApp Tech Provider program integration guide](https://www.twilio.com/docs/whatsapp/tech-provider-program/integration-guide).

### Qué hace la app (Fase 4 implementada)

- En **Configuraciones** aparece la opción **“Conectar con WhatsApp (Embedded Signup)”** cuando las tres variables de entorno anteriores están configuradas.
- El usuario introduce su número (E.164) y nombre para mostrar, hace clic en **Conectar con WhatsApp**, se abre el popup de Meta y completa el flujo (crear/elegir WABA, permisos).
- Al terminar, la app registra ese número en Twilio (Senders API) y lo guarda en la base de datos para su organización; a partir de ahí los mensajes a ese número llegan al webhook y se muestran en **Conversaciones**.
- Para que el webhook reciba mensajes de números registrados por Embedded Signup, la app debe estar accesible por HTTPS y tener configurado `NEXT_PUBLIC_APP_URL` (o `VERCEL_URL` en Vercel) con la URL pública de la app.

---

## 3. Resumen rápido

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué hago con mi número de Twilio? | Déjalo en Configuraciones; es el que usa la app para asignar mensajes a tu org. |
| ¿Qué puedo probar ya? | Unirte al Sandbox (si usas Sandbox) → enviar un mensaje a ese número → ver la conversación en **Conversaciones**. |
| ¿Qué falta para que mis usuarios conecten sus números? | Que tú completes Meta (app + Tech Provider + App Review) y Twilio (Partner Solution), y que configures las 3 variables de entorno; la app ya tiene el flujo de Embedded Signup implementado. |
