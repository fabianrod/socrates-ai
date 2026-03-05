import type { SupabaseClient } from "@supabase/supabase-js";

export type WhatsAppCredentials = {
  metaToken: string;
  phoneNumberId: string;
  userId: string;
};

/**
 * Obtiene las credenciales de WhatsApp del usuario (token + phone_number_id + user_id).
 * Si phone_number_id no está guardado, intenta obtenerlo de la API de Meta.
 * Requiere un cliente Supabase ya autenticado como el usuario (RLS).
 */
export async function getWhatsAppCredentials(
  supabase: SupabaseClient,
): Promise<WhatsAppCredentials | null> {
  const { data: integration, error } = await supabase
    .from("whatsapp_integrations")
    .select("user_id, access_token, phone_number_id, status")
    .maybeSingle();

  if (error || !integration || integration.status !== "connected") return null;
  const metaToken = integration.access_token;
  if (!metaToken) return null;

  let phoneNumberId = integration.phone_number_id ?? null;
  if (!phoneNumberId) {
    const wabaRes = await fetch(
      `https://graph.facebook.com/v22.0/me/owned_whatsapp_business_accounts?access_token=${encodeURIComponent(metaToken)}`,
    );
    if (!wabaRes.ok) return null;
    const wabaJson = (await wabaRes.json()) as { data?: { id: string }[] };
    const wabaId = wabaJson.data?.[0]?.id;
    if (!wabaId) return null;
    const phonesRes = await fetch(
      `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?access_token=${encodeURIComponent(metaToken)}`,
    );
    if (!phonesRes.ok) return null;
    const phonesJson = (await phonesRes.json()) as { data?: { id: string }[] };
    phoneNumberId = phonesJson.data?.[0]?.id ?? null;
  }
  if (!phoneNumberId || !integration.user_id) return null;

  return {
    metaToken,
    phoneNumberId,
    userId: integration.user_id,
  };
}
