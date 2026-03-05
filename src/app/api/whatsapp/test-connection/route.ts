import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

  // Si no tenemos phone_number_id guardado, intentar obtenerlo de Meta (como en el callback)
  let phoneNumberId = storedPhoneId ?? null;
  if (!phoneNumberId) {
    const wabaRes = await fetch(
      `https://graph.facebook.com/v22.0/me/owned_whatsapp_business_accounts?access_token=${encodeURIComponent(metaToken)}`,
    );
    if (!wabaRes.ok) {
      return NextResponse.json(
        { error: "No tenemos el número guardado y Meta no devolvió la cuenta. Reconecta WhatsApp desde Configuración." },
        { status: 400 },
      );
    }
    const wabaJson = (await wabaRes.json()) as { data?: { id: string }[] };
    const wabaId = wabaJson.data?.[0]?.id;
    if (!wabaId) {
      return NextResponse.json(
        { error: "No tenemos el número guardado y no hay cuenta de WhatsApp en Meta. Reconecta desde Configuración." },
        { status: 400 },
      );
    }
    const phonesRes = await fetch(
      `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?access_token=${encodeURIComponent(metaToken)}`,
    );
    if (!phonesRes.ok) {
      return NextResponse.json(
        { error: "No pudimos obtener el número de Meta. Reconecta WhatsApp desde Configuración." },
        { status: 400 },
      );
    }
    const phonesJson = (await phonesRes.json()) as {
      data?: { id: string }[];
    };
    phoneNumberId = phonesJson.data?.[0]?.id ?? null;
  }

  if (!phoneNumberId) {
    return NextResponse.json(
      { error: "No tenemos el ID del número guardado. Reconecta WhatsApp desde Configuración para guardarlo." },
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
