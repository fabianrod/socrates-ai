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
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    let hint = "";
    if (appId && appSecret) {
      try {
        const debugUrl = `https://graph.facebook.com/v22.0/debug_token?input_token=${encodeURIComponent(metaToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`;
        const debugRes = await fetch(debugUrl);
        if (debugRes.ok) {
          const debug = (await debugRes.json()) as {
            data?: { scopes?: string[]; valid?: boolean; error?: { message: string } };
          };
          const scopes = debug.data?.scopes ?? [];
          const hasWaba = scopes.some(
            (s) =>
              s.includes("whatsapp") || s === "business_management",
          );
          if (!hasWaba) {
            hint =
              " El token no tiene permisos de WhatsApp (whatsapp_business_management). Asegúrate de usar la configuración «WhatsApp Embedded Signup» en Meta y de autorizar la app con tu cuenta de WhatsApp.";
          }
        }
      } catch {
        // ignorar fallo de debug_token
      }
    }
    const errorMessage =
      "No pudimos obtener la cuenta ni el número de WhatsApp desde Meta (token válido pero sin acceso a la WABA)." +
      (hint || "") +
      " Revisa: (1) Meta Business Suite (business.facebook.com) → Configuración → Cuentas de WhatsApp y que esta app esté en el mismo negocio; (2) developers.facebook.com → tu app → WhatsApp → configuración inicial con el número vinculado; (3) Desconecta aquí y vuelve a «Conectar WhatsApp» para obtener un token nuevo.";
    return NextResponse.json(
      { error: errorMessage },
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
