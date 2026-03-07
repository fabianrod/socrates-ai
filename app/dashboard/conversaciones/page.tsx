import { createClient } from "@/lib/supabase/server";
import { getOrCreateOrganization } from "@/lib/supabase/organization";
import { redirect } from "next/navigation";
import { ConversacionesList } from "./ConversacionesList";

export default async function ConversacionesPage() {
  const supabase = await createClient();
  const result = await getOrCreateOrganization(supabase);
  if (!result.ok) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Conversaciones</h1>
        <p className="text-text-muted text-sm">
          Mensajes recibidos en tus números de WhatsApp
        </p>
      </div>
      <ConversacionesList />
    </div>
  );
}
