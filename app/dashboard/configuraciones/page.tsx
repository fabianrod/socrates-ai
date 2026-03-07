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

  const org = await getOrCreateOrganization(supabase);
  if (!org) redirect("/dashboard");

  const whatsapp = await getOrCreateWhatsAppAccount(supabase, org.id);
  const planData = Array.isArray(org.plans) ? org.plans[0] : org.plans;
  const plan = planData
    ? (planData as { name: string; phone_number_limit: number })
    : { name: "Básico", phone_number_limit: 3 };
  const phoneNumbers = whatsapp?.phone_numbers ?? [];

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
        />
      </div>
    </div>
  );
}
