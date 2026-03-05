import type { SupabaseClient } from "@supabase/supabase-js";

export type WhatsAppCredentials = {
  metaToken: string;
  phoneNumberId: string;
  userId: string;
};

const META_GRAPH = "https://graph.facebook.com/v22.0";

/**
 * Obtiene WABA id y phone_number_id desde el token de Meta.
 * Prueba: 1) me/owned_whatsapp_business_accounts 2) me/businesses → business/client_whatsapp_business_accounts
 */
export async function fetchWabaAndPhoneFromMeta(accessToken: string): Promise<{
  wabaId: string | null;
  phoneNumberId: string | null;
} | null> {
  const token = encodeURIComponent(accessToken);

  // 1) Flujo directo (funciona cuando el token tiene este edge)
  const directRes = await fetch(
    `${META_GRAPH}/me/owned_whatsapp_business_accounts?access_token=${token}`,
  );
  if (directRes.ok) {
    const json = (await directRes.json()) as { data?: { id: string }[] };
    const wabaId = json.data?.[0]?.id ?? null;
    if (wabaId) {
      const phonesRes = await fetch(
        `${META_GRAPH}/${wabaId}/phone_numbers?access_token=${token}`,
      );
      if (phonesRes.ok) {
        const phonesJson = (await phonesRes.json()) as { data?: { id: string }[] };
        const phoneNumberId = phonesJson.data?.[0]?.id ?? null;
        if (phoneNumberId) return { wabaId, phoneNumberId };
      }
    }
  }

  // 2) Flujo vía businesses (cuando el número se conectó manualmente o por otro flujo)
  const meRes = await fetch(
    `${META_GRAPH}/me?fields=businesses&access_token=${token}`,
  );
  if (!meRes.ok) return null;
  const meJson = (await meRes.json()) as {
    businesses?: { data?: { id: string }[] };
  };
  const businessIds = meJson.businesses?.data?.map((b) => b.id) ?? [];
  for (const businessId of businessIds) {
    const wabaRes = await fetch(
      `${META_GRAPH}/${businessId}/owned_whatsapp_business_accounts?access_token=${token}`,
    );
    if (!wabaRes.ok) continue;
    const wabaJson = (await wabaRes.json()) as { data?: { id: string }[] };
    const wabaId = wabaJson.data?.[0]?.id ?? null;
    if (!wabaId) continue;
    const phonesRes = await fetch(
      `${META_GRAPH}/${wabaId}/phone_numbers?access_token=${token}`,
    );
    if (!phonesRes.ok) continue;
    const phonesJson = (await phonesRes.json()) as { data?: { id: string }[] };
    const phoneNumberId = phonesJson.data?.[0]?.id ?? null;
    if (phoneNumberId) return { wabaId, phoneNumberId };
  }

  // Probar también client_whatsapp_business_accounts por si el edge se llama así en el negocio
  for (const businessId of businessIds) {
    const wabaRes = await fetch(
      `${META_GRAPH}/${businessId}/client_whatsapp_business_accounts?access_token=${token}`,
    );
    if (!wabaRes.ok) continue;
    const wabaJson = (await wabaRes.json()) as { data?: { id: string }[] };
    const wabaId = wabaJson.data?.[0]?.id ?? null;
    if (!wabaId) continue;
    const phonesRes = await fetch(
      `${META_GRAPH}/${wabaId}/phone_numbers?access_token=${token}`,
    );
    if (!phonesRes.ok) continue;
    const phonesJson = (await phonesRes.json()) as { data?: { id: string }[] };
    const phoneNumberId = phonesJson.data?.[0]?.id ?? null;
    if (phoneNumberId) return { wabaId, phoneNumberId };
  }

  return null;
}

/**
 * Obtiene las credenciales de WhatsApp del usuario (token + phone_number_id + user_id).
 * Si phone_number_id no está guardado, intenta obtenerlo de la API de Meta (varios flujos).
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
    const result = await fetchWabaAndPhoneFromMeta(metaToken);
    phoneNumberId = result?.phoneNumberId ?? null;
  }
  if (!phoneNumberId || !integration.user_id) return null;

  return {
    metaToken,
    phoneNumberId,
    userId: integration.user_id,
  };
}
