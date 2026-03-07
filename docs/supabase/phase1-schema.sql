-- =============================================================================
-- Socrates AI - Fase 1: Schema completo para Supabase
-- Ejecutar en el SQL Editor de Supabase (en el orden indicado)
-- =============================================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TABLAS CATÁLOGO (sin dependencias de app)
-- =============================================================================

-- Planes: Básico (100 conv, 3 números), Intermedio (300 conv, 6 números), Avanzado (600 conv, 12 números)
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  conversation_limit int NOT NULL CHECK (conversation_limit > 0),
  phone_number_limit int NOT NULL CHECK (phone_number_limit >= 1),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.plans IS 'Planes: 100/300/600 conversaciones y límite de números WhatsApp';

-- Tipos de agente (agendamiento, soporte, servicio al cliente)
CREATE TABLE public.agent_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. PERFILES Y ORGANIZACIONES
-- =============================================================================

-- Perfil 1:1 con auth.users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- Organizaciones (tenant por negocio)
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX idx_organizations_plan_id ON public.organizations(plan_id);

-- Miembros de la organización
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, profile_id)
);

CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_profile_id ON public.organization_members(profile_id);

-- =============================================================================
-- 3. WHATSAPP (Twilio / Meta)
-- =============================================================================

-- Cuenta WhatsApp a nivel organización (una “conexión” por org)
CREATE TABLE public.whatsapp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  twilio_account_sid text,
  meta_waba_id text,
  name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'pending', 'expired', 'error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_accounts_organization_id ON public.whatsapp_accounts(organization_id);

-- Números: principal + asociados (ej. barberos)
CREATE TABLE public.whatsapp_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_account_id uuid NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  display_name text,
  is_primary boolean NOT NULL DEFAULT false,
  twilio_phone_sid text,
  meta_phone_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'verified', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(whatsapp_account_id, phone_number)
);

CREATE INDEX idx_whatsapp_phone_numbers_account_id ON public.whatsapp_phone_numbers(whatsapp_account_id);

-- =============================================================================
-- 4. CONTACTOS Y CONVERSACIONES
-- =============================================================================

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  wa_phone_number text NOT NULL,
  display_name text,
  meta_contact_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, wa_phone_number)
);

CREATE INDEX idx_contacts_organization_id ON public.contacts(organization_id);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  whatsapp_phone_number_id uuid NOT NULL REFERENCES public.whatsapp_phone_numbers(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(whatsapp_phone_number_id, contact_id)
);

CREATE INDEX idx_conversations_organization_id ON public.conversations(organization_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_phone_contact ON public.conversations(whatsapp_phone_number_id, contact_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  meta_message_id text,
  body text,
  type text NOT NULL DEFAULT 'text',
  media_url text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at);

-- =============================================================================
-- 5. CITAS Y AGENTES
-- =============================================================================

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE RESTRICT,
  assigned_to_phone_id uuid REFERENCES public.whatsapp_phone_numbers(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  title text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_organization_id ON public.appointments(organization_id);
CREATE INDEX idx_appointments_starts_at ON public.appointments(organization_id, starts_at);
CREATE INDEX idx_appointments_contact_id ON public.appointments(contact_id);

CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  agent_type_id uuid REFERENCES public.agent_types(id) ON DELETE SET NULL,
  whatsapp_phone_id uuid REFERENCES public.whatsapp_phone_numbers(id) ON DELETE SET NULL,
  system_prompt text,
  config jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_organization_id ON public.agents(organization_id);

-- Uso de conversaciones por organización y periodo (para límites del plan)
CREATE TABLE public.conversation_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period date NOT NULL,
  conversation_count int NOT NULL DEFAULT 0 CHECK (conversation_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period)
);

CREATE INDEX idx_conversation_usage_org_period ON public.conversation_usage(organization_id, period);

-- =============================================================================
-- 6. FUNCIÓN HELPER: usuario es miembro de una organización
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.profiles p ON p.id = om.profile_id
    WHERE om.organization_id = org_id AND p.user_id = u_id
  );
$$;

-- =============================================================================
-- 7. TRIGGER: crear perfil al registrar usuario (auth.users)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Usuario')
  );
  RETURN new;
END;
$$;

-- El trigger debe crearse sobre auth.users (Supabase lo permite)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_usage ENABLE ROW LEVEL SECURITY;

-- Planes y tipos de agente: lectura pública (catálogo)
CREATE POLICY plans_select_all ON public.plans FOR SELECT USING (is_active = true);
CREATE POLICY agent_types_select_all ON public.agent_types FOR SELECT USING (true);

-- Perfiles: solo el propio usuario
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Organizaciones: solo miembros pueden ver; solo owner/admin pueden insertar/actualizar/eliminar
CREATE POLICY organizations_select_member ON public.organizations
  FOR SELECT USING (public.is_org_member(id, auth.uid()));

CREATE POLICY organizations_insert_own ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id));

CREATE POLICY organizations_update_member_admin ON public.organizations
  FOR UPDATE USING (
    public.is_org_member(id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.profiles p ON p.id = om.profile_id
      WHERE om.organization_id = organizations.id AND p.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY organizations_delete_owner ON public.organizations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = owner_id AND p.user_id = auth.uid())
  );

-- Miembros: solo miembros de la org pueden ver; solo owner puede gestionar miembros
CREATE POLICY organization_members_select_member ON public.organization_members
  FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY organization_members_insert_owner_admin ON public.organization_members
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.profiles p ON p.id = om.profile_id
      WHERE om.organization_id = organization_members.organization_id AND p.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY organization_members_update_owner_admin ON public.organization_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.profiles p ON p.id = om.profile_id
      WHERE om.organization_id = organization_members.organization_id AND p.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY organization_members_delete_owner_admin ON public.organization_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.profiles p ON p.id = om.profile_id
      WHERE om.organization_id = organization_members.organization_id AND p.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- WhatsApp: acceso por organización (miembro)
CREATE POLICY whatsapp_accounts_select_member ON public.whatsapp_accounts
  FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY whatsapp_accounts_insert_member ON public.whatsapp_accounts
  FOR INSERT WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY whatsapp_accounts_update_member ON public.whatsapp_accounts
  FOR UPDATE USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY whatsapp_accounts_delete_member ON public.whatsapp_accounts
  FOR DELETE USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY whatsapp_phone_numbers_select_via_account ON public.whatsapp_phone_numbers
  FOR SELECT USING (
    public.is_org_member((SELECT organization_id FROM public.whatsapp_accounts WHERE id = whatsapp_account_id), auth.uid())
  );

CREATE POLICY whatsapp_phone_numbers_insert_via_account ON public.whatsapp_phone_numbers
  FOR INSERT WITH CHECK (
    public.is_org_member((SELECT organization_id FROM public.whatsapp_accounts WHERE id = whatsapp_account_id), auth.uid())
  );

CREATE POLICY whatsapp_phone_numbers_update_via_account ON public.whatsapp_phone_numbers
  FOR UPDATE USING (
    public.is_org_member((SELECT organization_id FROM public.whatsapp_accounts WHERE id = whatsapp_account_id), auth.uid())
  );

CREATE POLICY whatsapp_phone_numbers_delete_via_account ON public.whatsapp_phone_numbers
  FOR DELETE USING (
    public.is_org_member((SELECT organization_id FROM public.whatsapp_accounts WHERE id = whatsapp_account_id), auth.uid())
  );

-- Contactos, conversaciones, mensajes, citas, agentes: por organización
CREATE POLICY contacts_select_member ON public.contacts FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY contacts_insert_member ON public.contacts FOR INSERT WITH CHECK (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY contacts_update_member ON public.contacts FOR UPDATE USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY contacts_delete_member ON public.contacts FOR DELETE USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY conversations_select_member ON public.conversations FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY conversations_insert_member ON public.conversations FOR INSERT WITH CHECK (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY conversations_update_member ON public.conversations FOR UPDATE USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY conversations_delete_member ON public.conversations FOR DELETE USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY messages_select_via_conversation ON public.messages
  FOR SELECT USING (
    public.is_org_member((SELECT organization_id FROM public.conversations WHERE id = conversation_id), auth.uid())
  );

CREATE POLICY messages_insert_via_conversation ON public.messages
  FOR INSERT WITH CHECK (
    public.is_org_member((SELECT organization_id FROM public.conversations WHERE id = conversation_id), auth.uid())
  );

CREATE POLICY messages_update_via_conversation ON public.messages
  FOR UPDATE USING (
    public.is_org_member((SELECT organization_id FROM public.conversations WHERE id = conversation_id), auth.uid())
  );

CREATE POLICY appointments_select_member ON public.appointments FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY appointments_insert_member ON public.appointments FOR INSERT WITH CHECK (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY appointments_update_member ON public.appointments FOR UPDATE USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY appointments_delete_member ON public.appointments FOR DELETE USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY agents_select_member ON public.agents FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY agents_insert_member ON public.agents FOR INSERT WITH CHECK (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY agents_update_member ON public.agents FOR UPDATE USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY agents_delete_member ON public.agents FOR DELETE USING (public.is_org_member(organization_id, auth.uid()));

-- Uso: miembros pueden leer; escritura típicamente desde backend (service_role) o función
CREATE POLICY conversation_usage_select_member ON public.conversation_usage
  FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY conversation_usage_insert_member ON public.conversation_usage
  FOR INSERT WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY conversation_usage_update_member ON public.conversation_usage
  FOR UPDATE USING (public.is_org_member(organization_id, auth.uid()));

-- =============================================================================
-- 9. DATOS INICIALES
-- =============================================================================

INSERT INTO public.plans (id, name, slug, conversation_limit, phone_number_limit, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Básico', 'basico', 100, 3, 1, true),
  (gen_random_uuid(), 'Intermedio', 'intermedio', 300, 6, 2, true),
  (gen_random_uuid(), 'Avanzado', 'avanzado', 600, 12, 3, true);

INSERT INTO public.agent_types (name, slug, description) VALUES
  ('Agendamiento', 'agendamiento', 'Agente para reserva de citas y recordatorios'),
  ('Soporte', 'soporte', 'Agente de soporte técnico y consultas'),
  ('Servicio al cliente', 'servicio_al_cliente', 'Agente para atención al cliente y ventas');

-- =============================================================================
-- 10. COMENTARIOS DE SEGURIDAD (para referencia)
-- =============================================================================
-- - Tokens de Twilio/Meta: no guardar en texto plano. Usar Supabase Vault o
--   variables de entorno en API routes; en tablas solo IDs o referencias.
-- - service_role: usar solo en servidor (API routes, Edge Functions), nunca en cliente.
-- =============================================================================
