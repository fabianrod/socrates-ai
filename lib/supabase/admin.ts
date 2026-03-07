import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role. Usar SOLO en servidor (webhooks, jobs).
 * Nunca exponer en el cliente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  }
  return createClient(url, serviceRoleKey);
}
