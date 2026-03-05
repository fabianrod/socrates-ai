import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { fetchWabaAndPhoneFromMeta } from "@/lib/whatsapp-integration";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

/**
 * GET /api/whatsapp/test-connection
 * Verifica que la integración de WhatsApp del usuario sea válida llamando a la API de Meta.
 * Requiere: header Authorization: Bearer <supabase_session_access_token>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json(
      { error: "Falta Authorization: Bearer <token>" },
      { status: 401 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: integration, error: fetchError } = await supabase
    .from("whatsapp_integrations")
    .select("access_token, phone_number_id, status")
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { error: fetchError.message ?? "Error al leer la integración" },
      { status: 500 },
    );
  }
  if (!integration || integration.status !== "connected") {
    return NextResponse.json(
      { error: "No tienes WhatsApp conectado" },
      { status: 404 },
    );
  }
  const { access_token: metaToken, phone_number_id: storedPhoneId } = integration;
  if (!metaToken) {
    return NextResponse.json(
      { error: "No hay token de WhatsApp guardado. Reconecta desde Configuración." },
      { status: 400 },
    );
  }

  // Si no tenemos phone_number_id guardado, obtenerlo de Meta (varios flujos: me/owned_*, me/businesses → business/owned_* o client_*)
  let phoneNumberId = storedPhoneId ?? null;
  if (!phoneNumberId) {
    const fetched = await fetchWabaAndPhoneFromMeta(metaToken);
    phoneNumberId = fetched?.phoneNumberId ?? null;
  }

  if (!phoneNumberId) {
    return NextResponse.json(
      { error: "No pudimos obtener la cuenta ni el número de WhatsApp desde Meta (token válido pero sin acceso a la WABA). Revisa en Meta Business Suite que esta app esté vinculada a tu cuenta de WhatsApp y que el número esté en la misma cuenta." },
      { status: 400 },
    );
  }

  const url = new URL(`https://graph.facebook.com/v22.0/${phoneNumberId}`);
  url.searchParams.set("fields", "verified_name,display_phone_number");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${metaToken}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    verified_name?: string;
    display_phone_number?: string;
    error?: { message: string; code?: number };
  };

  if (!res.ok) {
    const message = data.error?.message ?? `Meta respondió ${res.status}`;
    return NextResponse.json(
      { error: message },
      { status: res.status >= 400 ? res.status : 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    verified_name: data.verified_name ?? null,
    display_phone_number: data.display_phone_number ?? null,
  });
}
