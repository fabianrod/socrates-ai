import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const metaAppId = process.env.META_APP_ID;
const metaAppSecret = process.env.META_APP_SECRET;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json(
      { error: "Falta el token de sesión (Authorization: Bearer ...)" },
      { status: 401 },
    );
  }

  if (!metaAppId || !metaAppSecret) {
    return NextResponse.json(
      { error: "Configuración de Meta incompleta (META_APP_ID / META_APP_SECRET)" },
      { status: 500 },
    );
  }

  let body: { code: string; access_token?: string; refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo JSON inválido" },
      { status: 400 },
    );
  }

  const code = body.code;
  const sessionAccessToken = body.access_token ?? token;
  const sessionRefreshToken = body.refresh_token ?? "";

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "Se requiere el código de autorización (code)" },
      { status: 400 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: sessionAccessToken,
    refresh_token: sessionRefreshToken,
  });
  const user = sessionData?.user;

  if (sessionError || !user) {
    return NextResponse.json(
      { error: "Sesión inválida o expirada" },
      { status: 401 },
    );
  }

  const origin = request.headers.get("origin") || "";
  const tryExchange = async (redirectUri: string) => {
    const url = new URL("https://graph.facebook.com/v22.0/oauth/access_token");
    url.searchParams.set("client_id", metaAppId);
    url.searchParams.set("client_secret", metaAppSecret);
    url.searchParams.set("code", code);
    url.searchParams.set("redirect_uri", redirectUri);
    return fetch(url.toString(), { method: "GET" });
  };

  // Con el SDK de Facebook en el navegador, Meta suele esperar redirect_uri vacío al intercambiar el código.
  let metaRes = await tryExchange("");
  if (!metaRes.ok) {
    const errText = await metaRes.text();
    if (/redirect_uri|redirect uri/i.test(errText) && origin) {
      metaRes = await tryExchange(origin);
    }
    if (!metaRes.ok) {
      const finalError = metaRes.bodyUsed ? errText : await metaRes.text();
      return NextResponse.json(
        { error: "Meta rechazó el código: " + finalError },
        { status: 400 },
      );
    }
  }

  let metaData: {
    access_token?: string;
    waba_id?: string;
    phone_number_id?: string;
    [key: string]: unknown;
  };
  try {
    metaData = await metaRes.json();
  } catch {
    return NextResponse.json(
      { error: "Respuesta de Meta inválida" },
      { status: 502 },
    );
  }

  const metaAccessToken = metaData.access_token;
  if (!metaAccessToken) {
    return NextResponse.json(
      { error: "Meta no devolvió access_token" },
      { status: 400 },
    );
  }

  let wabaId = metaData.waba_id as string | undefined;
  let phoneNumberId = metaData.phone_number_id as string | undefined;
  let displayPhoneNumber: string | null = null;

  if (!wabaId || !phoneNumberId) {
    const wabaRes = await fetch(
      `https://graph.facebook.com/v22.0/me/owned_whatsapp_business_accounts?access_token=${encodeURIComponent(metaAccessToken)}`,
    );
    if (wabaRes.ok) {
      const wabaJson = (await wabaRes.json()) as { data?: { id: string }[] };
      wabaId = wabaJson.data?.[0]?.id;
    }
  }

  if (wabaId && !phoneNumberId) {
    const phonesRes = await fetch(
      `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?access_token=${encodeURIComponent(metaAccessToken)}`,
    );
    if (phonesRes.ok) {
      const phonesJson = (await phonesRes.json()) as {
        data?: { id: string; display_phone_number?: string }[];
      };
      const first = phonesJson.data?.[0];
      phoneNumberId = first?.id;
      displayPhoneNumber = first?.display_phone_number ?? null;
    }
  }

  const { error: upsertError } = await supabase
    .from("whatsapp_integrations")
    .upsert(
      {
        user_id: user.id,
        phone_number_id: phoneNumberId ?? null,
        whatsapp_business_account_id: wabaId ?? null,
        access_token: metaAccessToken,
        status: "connected",
        display_phone_number: displayPhoneNumber,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    return NextResponse.json(
      { error: "Error al guardar la integración: " + upsertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    whatsapp_business_account_id: wabaId,
    phone_number_id: phoneNumberId,
    display_phone_number: displayPhoneNumber,
  });
}
