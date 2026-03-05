import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyState } from "@/lib/whatsapp-state";
import { fetchWabaAndPhoneFromMeta } from "@/lib/whatsapp-integration";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const metaAppId = process.env.META_APP_ID;
const metaAppSecret = process.env.META_APP_SECRET;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const baseUrl = `${url.origin}${url.pathname}`;

  if (errorParam) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/configuracion?error=${encodeURIComponent(errorParam)}`,
        url.origin,
      ),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/configuracion?error=missing_code_or_state",
        url.origin,
      ),
    );
  }

  const parsed = verifyState(state);
  if (!parsed) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/configuracion?error=invalid_state",
        url.origin,
      ),
    );
  }

  if (!metaAppId || !metaAppSecret) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/configuracion?error=server_config",
        url.origin,
      ),
    );
  }

  if (!supabaseServiceKey) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/configuracion?error=server_config",
        url.origin,
      ),
    );
  }

  const tokenUrl = new URL("https://graph.facebook.com/v22.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", metaAppId);
  tokenUrl.searchParams.set("client_secret", metaAppSecret);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("redirect_uri", baseUrl);

  const metaRes = await fetch(tokenUrl.toString(), { method: "GET" });
  if (!metaRes.ok) {
    const errText = await metaRes.text();
    return NextResponse.redirect(
      new URL(
        `/dashboard/configuracion?error=${encodeURIComponent("meta_rejected")}`,
        url.origin,
      ),
    );
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
    return NextResponse.redirect(
      new URL("/dashboard/configuracion?error=meta_invalid", url.origin),
    );
  }

  const metaAccessToken = metaData.access_token;
  if (!metaAccessToken) {
    return NextResponse.redirect(
      new URL("/dashboard/configuracion?error=no_token", url.origin),
    );
  }

  let wabaId = metaData.waba_id as string | undefined;
  let phoneNumberId = metaData.phone_number_id as string | undefined;
  let displayPhoneNumber: string | null = null;

  if (!wabaId || !phoneNumberId) {
    const fetched = await fetchWabaAndPhoneFromMeta(metaAccessToken);
    if (fetched) {
      wabaId = wabaId ?? fetched.wabaId ?? undefined;
      phoneNumberId = phoneNumberId ?? fetched.phoneNumberId ?? undefined;
    }
    if (wabaId && !displayPhoneNumber) {
      const phonesRes = await fetch(
        `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?fields=display_phone_number&access_token=${encodeURIComponent(metaAccessToken)}`,
      );
      if (phonesRes.ok) {
        const phonesJson = (await phonesRes.json()) as {
          data?: { display_phone_number?: string }[];
        };
        displayPhoneNumber = phonesJson.data?.[0]?.display_phone_number ?? null;
      }
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { error: upsertError } = await supabase
    .from("whatsapp_integrations")
    .upsert(
      {
        user_id: parsed.userId,
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
    const detail = upsertError.message ?? upsertError.code ?? "";
    return NextResponse.redirect(
      new URL(
        `/dashboard/configuracion?error=save_failed&detail=${encodeURIComponent(detail)}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/configuracion?connected=1", url.origin),
  );
}
