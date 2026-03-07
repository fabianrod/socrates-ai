# Diagnóstico: "No se pudo cargar tu organización"

Cuando Configuraciones muestra ese error, sigue este plan para ver **qué paso falla** y el **error exacto** de Supabase.

## 1. Endpoint de diagnóstico (recomendado)

Con la app en marcha y **sesión iniciada**:

1. En local: `npm run dev` y en el navegador abre **http://localhost:3000/api/debug/organization**
2. En producción: solo funciona si en Vercel (o tu host) tienes `ENABLE_DEBUG_ORG=1` en variables de entorno; luego abre **https://tu-dominio.com/api/debug/organization**

La respuesta JSON muestra cada paso:

- **step1_user**: ¿Hay usuario de Supabase Auth?
- **step2_profile**: ¿Existe tu fila en `profiles`?
- **step3_existing_member**: ¿Ya eres miembro de alguna org?
- **step4_plans**: ¿Existe el plan `basico` en la tabla `plans`?
- **step5_org_insert**: Intento de INSERT en `organizations`. Si falla, verás `error`, `code` y a veces `details`.
- **step6_member_insert**: Intento de INSERT en `organization_members` (solo si el paso 5 pasó).

Si **step5_org_insert** tiene `ok: false`:

- **code "42501"** = RLS rechazó la fila. Revisa la política `organizations_insert_own` (ver `docs/supabase/fix-organizations-insert.sql`).
- **code "23505"** = conflicto único (p. ej. `slug` duplicado); poco habitual en la primera vez.
- **message** = texto que devuelve Postgres/Supabase; úsalo para buscar en la documentación.

## 2. Logs en terminal (local)

Con `npm run dev`, si falla el insert en `organizations` o en `organization_members`, en la **terminal donde corre Next.js** aparecerá algo como:

```
[getOrCreateOrganization] org insert failed { code: '42501', message: '...', ... }
```

Ahí verás `code` y `message` del error de Supabase.

## 3. Comprobar en Supabase

- **Authentication → Users**: que tu usuario exista.
- **Table Editor → profiles**: que haya una fila con `user_id` = el id de ese usuario.
- **Table Editor → plans**: que existan filas (al menos una con `slug = 'basico'`).
- **Database → Policies**: que existan:
  - `organizations_insert_own` en `organizations`
  - `organization_members_insert_owner_self` en `organization_members`

## 4. SQL de reparación

Si el diagnóstico indica RLS (42501) en organizaciones:

```sql
-- docs/supabase/fix-organizations-insert.sql
DROP POLICY IF EXISTS organizations_insert_own ON public.organizations;
CREATE POLICY organizations_insert_own ON public.organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = owner_id AND p.user_id = auth.uid()
    )
  );
```

Si falla en miembros:

```sql
-- docs/supabase/fix-profiles-insert.sql (solo la política de organization_members)
CREATE POLICY organization_members_insert_owner_self ON public.organization_members ...
```

## 5. Probar en local vs producción

En **local**, las cookies de sesión las envía el navegador al mismo origen; en **producción**, comprueba que el dominio y las cookies de Supabase estén bien (mismo sitio, HTTPS). Si en local funciona y en producción no, suele ser sesión/cookies o que en producción no se hayan aplicado las políticas RLS en la misma base de datos.
