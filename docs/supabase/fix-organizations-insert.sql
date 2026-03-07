-- Si Configuraciones muestra "Error al crear la organización" (RLS 42501), ejecuta esto en Supabase → SQL Editor.
-- Usa una función SECURITY DEFINER para que la comprobación no dependa del RLS de profiles.

-- 1) Función que comprueba si owner_id es el perfil del usuario actual (corre con privilegios elevados)
CREATE OR REPLACE FUNCTION public.is_owner_profile(pid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = pid AND user_id = auth.uid());
$$;

-- 2) Política que usa esa función
DROP POLICY IF EXISTS organizations_insert_own ON public.organizations;

CREATE POLICY organizations_insert_own ON public.organizations
  FOR INSERT WITH CHECK (public.is_owner_profile(owner_id));
