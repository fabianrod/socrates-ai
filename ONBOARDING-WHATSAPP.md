# Onboarding WhatsApp (Fase 5) – Datos que necesitas

Para que el flujo **Conectar WhatsApp** funcione en Configuración necesitas crear una app en Meta y rellenar las variables de entorno.

## 1. Crear app en Meta

1. Entra en [Meta for Developers](https://developers.facebook.com/apps/) y crea una **nueva app** (tipo “Negocio”).
2. En el panel de la app, añade el producto **WhatsApp**.
3. En el menú lateral, entra en **WhatsApp** > **Configuración inicial** (o **Embedded Signup**) y sigue los pasos que Meta indique para tener WhatsApp Business API disponible.

## 2. Configuración de Embedded Signup (Configuration ID)

1. En la app de Meta, ve a **Facebook Login for Business** (o **Inicio de sesión de Facebook** > **Configuraciones**).
2. Crea una **nueva configuración** usando la plantilla:
   - **"WhatsApp Embedded Signup Configuration With 60 Expiration Token"**  
   (o el nombre equivalente en tu idioma).
3. Copia el **Configuration ID** (un número largo). Ese valor es tu `NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID`.

## 3. URIs de redirección OAuth (importante)

Usamos **flujo manual**: tú controlas el `redirect_uri`. En **Inicio de sesión con Facebook** > **Configurar** > **URIs de redirección de OAuth válidos** añade **exactamente** esta URL (con tu dominio real):

- **Producción:** `https://TU-DOMINIO.vercel.app/auth/callback/whatsapp`  
  (ej. `https://socrates-ai-alpha.vercel.app/auth/callback/whatsapp`)

No uses otra ruta ni barra final. El dominio debe estar también en **Dominios permitidos para el SDK para JavaScript**.

## 4. Variables de entorno

Copia `env.example` a `.env.local` y rellena:

| Variable | Dónde se obtiene |
|----------|-------------------|
| `NEXT_PUBLIC_META_APP_ID` | Panel de la app de Meta > Configuración > ID de la aplicación |
| `NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID` | Configuración de “WhatsApp Embedded Signup” creada en el paso 2 (Configuration ID) |
| `META_APP_SECRET` | Panel de la app de Meta > Configuración > Clave secreta de la aplicación (solo servidor) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API > `service_role` (solo para el callback de WhatsApp; nunca en cliente) |

- En Vercel añade las mismas variables y **SUPABASE_SERVICE_ROLE_KEY** para que el callback pueda guardar la integración.

## 5. Base de datos (Supabase)

Si aún no tienes la tabla de integraciones, ejecuta en el editor SQL de Supabase el contenido de:

`supabase/schema-whatsapp.sql`

Así tendrás la tabla `whatsapp_integrations` y las políticas RLS para que cada usuario solo vea y gestione su propia conexión.

## Resumen rápido

- **App ID** → `NEXT_PUBLIC_META_APP_ID`
- **App Secret** → `META_APP_SECRET`
- **Configuration ID** → `NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID`
- **Valid OAuth Redirect URIs** → exactamente `https://TU-DOMINIO/auth/callback/whatsapp`
- **SUPABASE_SERVICE_ROLE_KEY** en el servidor (Vercel / .env.local)
- Tabla `whatsapp_integrations` creada en Supabase.

Con eso, **Conectar WhatsApp** redirige a Meta, autorizas, y al volver se guarda la integración.

---

## Si «Probar conexión» dice: «token válido pero sin acceso a la WABA»

Ese mensaje significa que Meta ha aceptado el token pero la app no puede ver tu cuenta de WhatsApp (WABA) ni el número. Suele ser **configuración en Meta**, no un fallo de código.

### Qué revisar (en este orden)

1. **WhatsApp vinculado a la app**
   - En [Meta for Developers](https://developers.facebook.com/apps/) abre **tu app**.
   - Menú **WhatsApp** → **Configuración inicial** (o **Embedded Signup**).
   - Asegúrate de haber completado el flujo (incluido añadir/verificar el número de WhatsApp Business). Si no hay número asociado a la configuración, el token no tendrá WABA.

2. **Misma cuenta de negocio**
   - En [Meta Business Suite](https://business.facebook.com): **Configuración del negocio** → **Cuentas** → **Cuentas de WhatsApp**.
   - El número que quieres usar debe estar en una cuenta de WhatsApp listada ahí.
   - La **misma** cuenta de negocio debe tener **tu app** añadida (p. ej. en **Configuración** → **Aplicaciones** o donde gestiones las apps del negocio). Si la app está en otro negocio o en una cuenta personal sin WABA, el token no verá el número.

3. **Permisos del token**
   - El token que devuelve el flujo «Conectar WhatsApp» debe incluir permisos de WhatsApp (p. ej. `whatsapp_business_management`). Eso depende de la **configuración de Embedded Signup** en Meta (plantilla tipo «WhatsApp Embedded Signup Configuration»). Si usas una configuración de inicio de sesión que no pide permisos de WhatsApp, el token no tendrá acceso a la WABA.

4. **Desconectar y volver a conectar**
   - En la app (Configuración), pulsa **Desconectar** y luego **Conectar WhatsApp** de nuevo. Así generas un token nuevo después de haber corregido los puntos anteriores.
