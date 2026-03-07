-- Ejecutar en Supabase SQL Editor si ves "No se pudo cargar tu organización".
-- 1) Permite crear tu propio perfil si no existe.
-- 2) Permite que el dueño de una organización se agregue como primer miembro (owner).

-- Si ya existe, omite con: DROP POLICY IF EXISTS ... antes del CREATE.

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permite insertar en organization_members cuando eres el owner de la org y te agregas tú mismo
CREATE POLICY organization_members_insert_owner_self ON public.organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      JOIN public.profiles p ON p.id = o.owner_id
      WHERE o.id = organization_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = profile_id AND p2.user_id = auth.uid()
    )
  );
