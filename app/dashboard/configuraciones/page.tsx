import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateOrganization,
  getOrCreateWhatsAppAccount,
} from "@/lib/supabase/organization";
import { ConfigWhatsApp } from "./ConfigWhatsApp";

export default async function ConfiguracionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getOrCreateOrganization(supabase);
  if (!result.ok) {
    const messages: Record<string, { title: string; body: ReactNode }> = {
      no_user: {
        title: "Sesión inválida",
        body: "Cierra sesión y vuelve a entrar.",
      },
      no_profile: {
        title: "No se pudo crear tu perfil",
        body: "Ejecuta en Supabase la política: CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);",
      },
      no_plans: {
        title: "Faltan los planes en la base de datos",
        body: (
          <>
            La tabla <code className="rounded bg-surface-hover px-1">plans</code> está vacía.
            En Supabase → SQL Editor ejecuta esto (una sola vez):
            <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface p-4 text-left text-sm">
              {`INSERT INTO public.plans (name, slug, conversation_limit, phone_number_limit, sort_order, is_active) VALUES
  ('Básico', 'basico', 100, 3, 1, true),
  ('Intermedio', 'intermedio', 300, 6, 2, true),
  ('Avanzado', 'avanzado', 600, 12, 3, true);`}
            </pre>
            Luego recarga esta página.
          </>
        ),
      },
      org_insert_failed: {
        title: "Error al crear la organización",
        body: (
          <>
            La app intenta crear la organización con tu sesión; si falla por RLS, usa
            <code className="rounded bg-surface-hover px-1 mx-1">SUPABASE_SERVICE_ROLE_KEY</code>
            en .env.local (clave en Supabase → Settings → API → service_role). Recarga esta página después de añadirla.
            Para más detalle abre{" "}
            <a
              href="/api/debug/organization"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              /api/debug/organization
            </a>.
          </>
        ),
      },
      member_insert_failed: {
        title: "Error al agregarte como miembro",
        body: (
          <>
            Ejecuta en Supabase SQL Editor:
            <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface p-4 text-left text-sm whitespace-pre-wrap">
              {`CREATE POLICY organization_members_insert_owner_self ON public.organization_members
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
  );`}
            </pre>
            Luego recarga esta página.
          </>
        ),
      },
    };
    const msg = messages[result.error] ?? {
      title: "Error desconocido",
      body: "Prueba recargar o cerrar sesión y volver a entrar.",
    };
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Configuraciones</h1>
        </div>
        <div className="max-w-2xl rounded-2xl border border-border bg-surface-elevated/60 p-6 text-text-muted space-y-4">
          <p className="font-medium text-text">{msg.title}</p>
          <div className="text-sm">{msg.body}</div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            Volver al inicio del dashboard
          </Link>
        </div>
      </div>
    );
  }

  const org = result.org;
  const whatsapp = await getOrCreateWhatsAppAccount(supabase, org.id);
  const planData = Array.isArray(org.plans) ? org.plans[0] : org.plans;
  const plan = planData
    ? (planData as { name: string; phone_number_limit: number })
    : { name: "Básico", phone_number_limit: 3 };
  const phoneNumbers = whatsapp?.phone_numbers ?? [];

  const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;
  const configId = process.env.META_EMBEDDED_SIGNUP_CONFIG_ID;
  const solutionId = process.env.TWILIO_PARTNER_SOLUTION_ID;
  const embeddedSignupConfig =
    metaAppId && configId && solutionId
      ? { metaAppId, configId, solutionId }
      : null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Configuraciones</h1>
        <p className="text-text-muted text-sm">
          Conecta tus canales y ajusta las preferencias de tu cuenta
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <ConfigWhatsApp
          organizationId={org.id}
          planName={plan.name}
          phoneNumberLimit={plan.phone_number_limit}
          phoneNumbers={phoneNumbers}
          embeddedSignupConfig={embeddedSignupConfig}
        />
      </div>
    </div>
  );
}
