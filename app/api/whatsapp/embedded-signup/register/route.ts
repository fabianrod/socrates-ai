import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTwilio } from "@/lib/twilio";

function normalizePhone(phone: string): string {
  return "+" + phone.replace(/\D/g, "");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { waba_id, phone_number, display_name } = body as {
    waba_id?: string;
    phone_number?: string;
    display_name?: string;
  };

  if (!waba_id || typeof waba_id !== "string") {
    return NextResponse.json(
      { error: "waba_id es obligatorio" },
      { status: 400 }
    );
  }
  if (!phone_number || typeof phone_number !== "string") {
    return NextResponse.json(
      { error: "phone_number (E.164) es obligatorio" },
      { status: 400 }
    );
  }

  const normalized = normalizePhone(phone_number);
  if (normalized.length < 10) {
    return NextResponse.json(
      { error: "Número de teléfono inválido" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", profile.id)
    .limit(1)
    .single();
  if (!member) {
    return NextResponse.json(
      { error: "Organización no encontrada" },
      { status: 404 }
    );
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("plan_id, plans(phone_number_limit)")
    .eq("id", member.organization_id)
    .single();
  if (!org) {
    return NextResponse.json(
      { error: "Organización no encontrada" },
      { status: 404 }
    );
  }

  const plans = org.plans as
    | { phone_number_limit: number }
    | { phone_number_limit: number }[]
    | null;
  const limit = Array.isArray(plans)
    ? plans[0]?.phone_number_limit ?? 3
    : plans?.phone_number_limit ?? 3;

  let accountId: string | null = null;
  const { data: existingAccount } = await supabase
    .from("whatsapp_accounts")
    .select("id")
    .eq("organization_id", member.organization_id)
    .limit(1)
    .single();
  if (existingAccount) {
    accountId = existingAccount.id;
  } else {
    const { data: newAccount, error: accError } = await supabase
      .from("whatsapp_accounts")
      .insert({
        organization_id: member.organization_id,
        twilio_account_sid: process.env.TWILIO_ACCOUNT_SID ?? undefined,
        name: "WhatsApp",
        status: "active",
      })
      .select("id")
      .single();
    if (accError || !newAccount) {
      return NextResponse.json(
        { error: "Error al crear cuenta WhatsApp" },
        { status: 500 }
      );
    }
    accountId = newAccount.id;
  }

  const { count } = await supabase
    .from("whatsapp_phone_numbers")
    .select("id", { count: "exact", head: true })
    .eq("whatsapp_account_id", accountId);
  if (count !== null && count >= limit) {
    return NextResponse.json(
      { error: `Límite de números alcanzado (${limit} por plan)` },
      { status: 400 }
    );
  }

  const twilioClient = getTwilio();
  if (!twilioClient) {
    return NextResponse.json(
      { error: "Twilio no configurado" },
      { status: 503 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Configura NEXT_PUBLIC_APP_URL o VERCEL_URL para el webhook" },
      { status: 500 }
    );
  }
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/twilio`;

  try {
    await (twilioClient as any).messaging.v2.channelsSenders.create({
      senderId: `whatsapp:${normalized}`,
      configuration: {
        wabaId: waba_id,
        verificationMethod: "sms",
      },
      webhook: {
        callbackUrl: webhookUrl,
        callbackMethod: "POST",
        fallbackUrl: webhookUrl,
        fallbackMethod: "POST",
      },
      profile: {
        name: (display_name?.trim() || normalized).slice(0, 100),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al registrar en Twilio";
    return NextResponse.json(
      { error: msg },
      { status: 502 }
    );
  }

  const hasPrimary = await supabase
    .from("whatsapp_phone_numbers")
    .select("id")
    .eq("whatsapp_account_id", accountId)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();
  const isPrimary = !hasPrimary.data;

  if (isPrimary) {
    await supabase
      .from("whatsapp_phone_numbers")
      .update({ is_primary: false })
      .eq("whatsapp_account_id", accountId);
  }

  const { data: inserted, error } = await supabase
    .from("whatsapp_phone_numbers")
    .insert({
      whatsapp_account_id: accountId,
      phone_number: normalized,
      display_name: display_name?.trim() || null,
      is_primary: isPrimary,
      status: "verified",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ese número ya está registrado" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(inserted);
}
