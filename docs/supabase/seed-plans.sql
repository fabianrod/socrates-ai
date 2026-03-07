-- Ejecutar en Supabase → SQL Editor si Configuraciones dice "Faltan los planes en la base de datos".
-- Solo hace falta ejecutarlo una vez.

INSERT INTO public.plans (name, slug, conversation_limit, phone_number_limit, sort_order, is_active) VALUES
  ('Básico', 'basico', 100, 3, 1, true),
  ('Intermedio', 'intermedio', 300, 6, 2, true),
  ('Avanzado', 'avanzado', 600, 12, 3, true)
ON CONFLICT (slug) DO NOTHING;
