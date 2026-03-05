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

## 3. Dominios permitidos

1. En **Facebook Login** (o **Facebook Login for Business**) > **Configuración**:
   - En **Dominios permitidos de la OAuth de inicio de sesión**, añade:
     - `localhost` (para desarrollo)
     - Tu dominio en producción (ej. `tudominio.com`).
   - En **URIs de redirección de OAuth válidos** suele bastar con el origen de tu app, por ejemplo:
     - `http://localhost:3000`
     - `https://tudominio.com`

## 4. Variables de entorno

Copia `env.example` a `.env.local` y rellena:

| Variable | Dónde se obtiene |
|----------|-------------------|
| `NEXT_PUBLIC_META_APP_ID` | Panel de la app de Meta > Configuración > ID de la aplicación |
| `NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID` | Configuración de “WhatsApp Embedded Signup” creada en el paso 2 (Configuration ID) |
| `META_APP_SECRET` | Panel de la app de Meta > Configuración > Clave secreta de la aplicación (solo en servidor; no la expongas en el cliente) |

- Las variables `NEXT_PUBLIC_*` se usan en el navegador (SDK de Facebook).
- `META_APP_SECRET` solo se usa en el servidor (intercambio de código por token) y **no** debe estar en código público.

## 5. Base de datos (Supabase)

Si aún no tienes la tabla de integraciones, ejecuta en el editor SQL de Supabase el contenido de:

`web/supabase/schema-whatsapp.sql`

Así tendrás la tabla `whatsapp_integrations` y las políticas RLS para que cada usuario solo vea y gestione su propia conexión.

## Resumen rápido

- **App ID** → `NEXT_PUBLIC_META_APP_ID`
- **App Secret** → `META_APP_SECRET`
- **Configuration ID** (plantilla Embedded Signup) → `NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID`
- Dominios y URIs de redirección configurados en la app de Meta.
- Tabla `whatsapp_integrations` creada en Supabase.

Con eso, el botón **Conectar WhatsApp** en Configuración debería abrir el flujo de Meta y, al terminar, guardar la integración en tu proyecto.
