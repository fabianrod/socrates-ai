-- Integraciones de WhatsApp por usuario (Fase 5).
-- Ejecuta este SQL en el editor de Supabase si aún no tienes la tabla.

create table if not exists public.whatsapp_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone_number_id text,
  whatsapp_business_account_id text,
  access_token text not null,
  status text not null default 'connected' check (status in ('connected', 'disconnected', 'error')),
  display_phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- RLS: cada usuario solo ve y modifica sus propias integraciones
alter table public.whatsapp_integrations enable row level security;

create policy "Users can manage own whatsapp_integrations"
  on public.whatsapp_integrations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Índice para buscar por user_id
create index if not exists idx_whatsapp_integrations_user_id
  on public.whatsapp_integrations(user_id);
