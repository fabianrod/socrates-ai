## Fase 0 – Visión general y alcance

- **Nombre del producto**: Socrates AI
- **Tipo de aplicación**: Plataforma tipo Manychat para crear agentes de IA conectados a WhatsApp Business.
- **Público objetivo**: Negocios y creadores que quieran automatizar conversaciones por WhatsApp con agentes de IA.
- **Plataforma**: Aplicación web (SaaS) con panel de administración.
- **Estilo visual**:
  - **Tema general**: claro (light).
  - **Color principal**: `#3ecf8e` sobre fondos claros.
  - **Neutros**: escala de grises suaves; evitar negros puros excepto para texto muy puntual.

## Fase 1 – Diseño de UX/UI y estructura básica

- **1.1. Definir arquitectura de navegación**
  - **Páginas públicas**:
    - Página de inicio (`/`): marketing de Socrates AI, beneficios, secciones de características y CTA a registro/login.
    - Página de login (`/login`).
    - Página de registro (`/registro`).
  - **Zona autenticada (dashboard)**:
    - Layout con sidebar fijo a la izquierda y contenido principal a la derecha.
    - Ítems del sidebar:
      - Conversaciones
      - Configuración
      - Agentes
      - Contactos
      - Calendario

- **1.2. Definir lineamientos visuales**
  - **Tipografía**: Sans serif moderna (ej. Inter, Poppins o similar).
  - **Componentes básicos**:
    - Botones primarios con fondo `#3ecf8e` y texto oscuro sobre fondo claro.
    - Botones secundarios con contorno `#3ecf8e`.
    - Tarjetas claras con sombras suaves para paneles (dashboard, tarjetas de agentes, tarjetas de configuraciones).
  - **Modo light bien definido**:
    - Fondo general: gris muy claro o casi blanco.
    - Sidebar con un tono ligeramente más oscuro pero manteniendo el esquema claro.

- **1.3. Diseñar wireframes de alta fidelidad**
  - Home con héroe (título, subtítulo, CTA), sección “Cómo funciona”, beneficios, casos de uso, footer.
  - Login y registro con formularios simples y claros.
  - Dashboard:
    - Sidebar con los ítems definidos.
    - Vista de “Configuración”.
    - Vista de “Conversaciones”.

## Fase 2 – Setup técnico y estructura de proyecto

- **2.1. Decidir stack principal (sugerido)**
  - **Frontend**:
    - React / Next.js (preferible Next.js para SSR y mejor SEO de la página pública).
    - Librería de componentes (puede ser Tailwind + componentes propios o algo tipo shadcn/ui).
  - **Backend / API**:
    - Node.js (NestJS, Express, o API Routes de Next.js).
    - Conexión con la API de WhatsApp Business (Meta / WhatsApp Cloud API).
  - **Base de datos**:
    - PostgreSQL (o alternativa manejada, p. ej. Supabase/Neon).
  - **Autenticación**:
    - JWT o proveedor externo (Auth0, Clerk, Supabase Auth, etc.).

- **2.2. Inicializar el proyecto**
  - Crear el proyecto base (ej. con Next.js).
  - Configurar:
    - Rutas de `home`, `login`, `registro`.
    - Layout del dashboard con sidebar.
  - Añadir un `README.md` base explicando:
    - Cómo correr el proyecto.
    - Variables de entorno críticas (tokens de WhatsApp, IDs de app, etc. sin exponer valores reales).

## Fase 3 – Autenticación y flujo de acceso

- **3.1. Sistema de usuarios**
  - Registro con email y contraseña (mínimo para esta primera versión).
  - Login con persistencia de sesión (cookies o localStorage con tokens, dependiendo del enfoque).

- **3.2. Protecciones de rutas**
  - Redirigir a `/login` si un usuario no autenticado intenta acceder al dashboard.
  - Redirigir a `/dashboard` si un usuario autenticado intenta entrar a `/login` o `/registro`.

## Fase 4 – Diseño e implementación del Dashboard

- **4.1. Layout del Dashboard**
  - Sidebar con los elementos:
    - Conversaciones
    - Configuración
    - Agentes
    - Contactos
    - Calendario
  - Header superior en el contenido principal con:
    - Nombre del espacio / marca del usuario.
    - Acceso rápido al perfil / logout.

- **4.2. Páginas iniciales activas**
  - Activar y maquetar primero:
    - **Configuración**
    - **Conversaciones**
  - Dejar rutas y placeholders para:
    - Agentes
    - Contactos
    - Calendario

## Fase 5 – Sección de Configuración (WhatsApp Embedded Signup)

- **5.1. Modelo de datos mínimo**
  - Tabla/colección de “integraciones WhatsApp” por usuario:
    - `user_id`
    - `phone_number_id` (ID del número en Meta/WhatsApp).
    - `whatsapp_business_account_id`
    - `access_token` o referencia a un almacenamiento seguro del token.
    - Estado de conexión (conectado / no conectado).

- **5.2. Interfaz de Configuración**
  - Mostrar tarjeta “Conectar WhatsApp Business”.
  - Botón destacado: **“Conectar WhatsApp”**.
  - Explicación corta de lo que ocurrirá:
    - Que redirige al flujo de Embedded Signup de Meta.
    - Qué permisos se solicitarán.

- **5.3. Integración con WhatsApp Embedded Signup**
  - Implementar el botón de Embedded Signup siguiendo la guía de Meta (JavaScript SDK).
  - Al finalizar el flujo:
    - Recibir el `phone_number_id`, `whatsapp_business_account_id` y el `access_token` asociado.
    - Guardar estos datos para el usuario actual.
  - Manejo de errores y estados:
    - Mostrar feedback si el proceso falla.
    - Posibilidad de reconectar o desconectar.

## Fase 6 – Sección de Conversaciones (MVP)

- **6.1. Modelo de datos para conversaciones**
  - Tabla/colección de “conversaciones”:
    - `id`
    - `user_id` (dueño de la cuenta de Socrates AI).
    - `contact_phone` (número de WhatsApp del cliente final).
    - `created_at`, `updated_at`.
  - Tabla/colección de “mensajes”:
    - `id`
    - `conversation_id`
    - `direction` (inbound/outbound).
    - `type` (text, image, template, etc.; para MVP, solo `text`).
    - `content`
    - `timestamp`

- **6.2. Interfaz de Conversaciones (MVP)**
  - Lista de conversaciones en el lado izquierdo (similar a WhatsApp web).
  - Panel de mensajes en el lado derecho:
    - Burbujas de mensajes entrantes y salientes.
    - Input de texto y botón “Enviar”.

- **6.3. Envío de mensajes mediante WhatsApp Cloud API**
  - Reutilizar las credenciales guardadas en Configuración para cada usuario.
  - Endpoint base de Meta:
    - `https://graph.facebook.com/vXX.X/{PHONE_NUMBER_ID}/messages`
  - Adaptar el `curl` de referencia para enviar **mensajes de texto generales**, no solo plantillas.

### Ejemplo de `curl` para mensaje de texto general (NO template)

Este ejemplo asume que ya tienes:
- Un `PHONE_NUMBER_ID` configurado para el usuario.
- Un `ACCESS_TOKEN` válido almacenado de forma segura.

```bash
curl --location "https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages" \
  --header "Authorization: Bearer <ACCESS_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{
    "messaging_product": "whatsapp",
    "to": "573001112233",
    "type": "text",
    "text": {
      "body": "Hola, este es un mensaje de prueba desde Socrates AI."
    }
  }'
```

- **Puntos clave**:
  - Se cambia `type` a `"text"`.
  - Se reemplaza el bloque `template` por el bloque `text`.
  - `to` debe ser el número del cliente en formato internacional.
  - `PHONE_NUMBER_ID` y `ACCESS_TOKEN` deben venir desde la configuración del usuario.

- **6.4. Backend para envío de mensajes**
  - Endpoint interno (ej. `POST /api/messages/send`) que:
    - Verifica que el usuario tenga WhatsApp conectado.
    - Construye el payload para la Cloud API con:
      - `phone_number_id` del usuario.
      - `access_token` asociado.
      - Número destino (`to`) y contenido del mensaje.
    - Hace la llamada HTTP a la API de Meta y devuelve el resultado a la UI.

## Fase 7 – Recepción de mensajes (webhooks)

- **7.1. Configurar webhook de WhatsApp**
  - Definir endpoint público (ej. `/api/webhooks/whatsapp`).
  - Validar el token de verificación que Meta requiere al configurar el webhook.

- **7.2. Procesar mensajes entrantes**
  - Parsear el payload del webhook.
  - Identificar:
    - `phone_number` del contacto.
    - Contenido del mensaje.
  - Asociar el mensaje a una conversación existente o crear una nueva.
  - Guardar el mensaje como `inbound` en la base de datos.

- **7.3. Actualizar la UI en tiempo real (opcional en MVP)**
  - Opciones:
    - Polling sencillo.
    - WebSockets / servicios como Pusher/Ably.
  - Para el MVP bastará con recargar periódicamente o al entrar a la conversación.

## Fase 8 – Agentes de IA (primeros pasos)

- **8.1. Definir el modelo de agente**
  - Campos mínimos:
    - Nombre del agente.
    - Descripción / objetivo.
    - Instrucciones del sistema (prompt).
    - Idiomas soportados.

- **8.2. Flujo básico**
  - Asignar uno o varios agentes a una cuenta de WhatsApp.
  - Definir reglas de disparo:
    - Respuesta automática a todos los mensajes.
    - Solo fuera de horario.
    - Solo si no hay agente humano respondiendo.

- **8.3. Integración con proveedor de IA**
  - Abstraer la llamada al modelo (por ejemplo, OpenAI, Anthropic u otro).
  - Endpoint interno que recibe el mensaje entrante y devuelve la respuesta del agente.
  - Guardar la respuesta como mensaje `outbound` y enviarla por WhatsApp usando la Cloud API.

## Fase 9 – Contactos y Calendario (placeholders y futuro)

- **9.1. Contactos**
  - Modelo de contacto:
    - Nombre, teléfono, etiquetas, fecha de primer contacto.
  - Vista básica en el dashboard con lista y detalle.
  - Integración posterior con los historiales de conversaciones.

- **9.2. Calendario**
  - MVP: vista de agenda simulada o calendario donde:
    - Más adelante se podrán crear citas ligadas a conversaciones o contactos.
  - Posible integración futura con Google Calendar u otros proveedores.

## Fase 10 – Seguridad, escalabilidad y despliegue

- **10.1. Seguridad**
  - Encriptar tokens de acceso de WhatsApp en la base de datos o usar un secret manager.
  - Asegurar que solo el dueño de la cuenta pueda usar sus credenciales.
  - Manejar rate limits y errores de la API de Meta.

- **10.2. Observabilidad**
  - Logging estructurado de las llamadas a la API de WhatsApp.
  - Monitoreo de errores (Sentry o similar).

- **10.3. Despliegue**
  - Frontend/Backend en una plataforma manejada (Vercel, Render, Fly.io, etc.).
  - Base de datos gestionada.
  - Configuración de dominios personalizados y HTTPS.

---

Este archivo sirve como guía por fases para construir Socrates AI. A partir de aquí, podemos ir tomando cada fase (por ejemplo, empezar por la Fase 2–4 para tener el esqueleto de la app) e ir implementando el código paso a paso.

