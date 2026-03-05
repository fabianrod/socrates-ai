import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getWhatsAppCredentials } from "@/lib/whatsapp-integration";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

/** Normaliza número para Meta: solo dígitos, sin + ni espacios. */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * POST /api/whatsapp/send
 * Body: { to: string, text: string }
 * Envía un mensaje de texto por WhatsApp Cloud API y guarda conversación + mensaje en DB.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json(
      { error: "Falta Authorization: Bearer <token>" },
      { status: 401 },
    );
  }

  let body: { to?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo JSON inválido. Envía { to, text }." },
      { status: 400 },
    );
  }
  const to = typeof body.to === "string" ? body.to.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!to || !text) {
    return NextResponse.json(
      { error: "Faltan 'to' (número) o 'text' (mensaje)." },
      { status: 400 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: integrationRow, error: integrationError } = await supabase
    .from("whatsapp_integrations")
    .select("id, status")
    .maybeSingle();

  if (integrationError) {
    return NextResponse.json(
      { error: "Sesión inválida o expirada. Cierra sesión y vuelve a entrar." },
      { status: 401 },
    );
  }
  if (!integrationRow) {
    return NextResponse.json(
      { error: "No tienes WhatsApp conectado. Ve a Configuración y pulsa Conectar WhatsApp." },
      { status: 404 },
    );
  }
  if (integrationRow.status !== "connected") {
    return NextResponse.json(
      { error: "WhatsApp está desconectado. Reconecta desde Configuración." },
      { status: 404 },
    );
  }

  const { data: fullRow } = await supabase
    .from("whatsapp_integrations")
    .select("access_token, phone_number_id")
    .eq("id", integrationRow.id)
    .single();

  if (!fullRow?.access_token?.trim()) {
    return NextResponse.json(
      { error: "El token de WhatsApp no está guardado. En Configuración pulsa Desconectar y luego Conectar WhatsApp de nuevo." },
      { status: 400 },
    );
  }

  const credentials = await getWhatsAppCredentials(supabase);
  if (!credentials) {
    return NextResponse.json(
      { error: "El token podría haber expirado o Meta no devolvió el número. En Configuración pulsa Desconectar y luego Conectar WhatsApp de nuevo." },
      { status: 400 },
    );
  }

  const toNormalized = normalizePhone(to);
  if (toNormalized.length < 10) {
    return NextResponse.json(
      { error: "El número de destino no es válido (usa formato internacional, ej. 573001112233)." },
      { status: 400 },
    );
  }

  const url = `https://graph.facebook.com/v22.0/${credentials.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credentials.metaToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toNormalized,
      type: "text",
      text: { body: text },
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    messages?: { id: string }[];
    error?: { message: string; code?: number };
  };

  if (!res.ok) {
    const message = data.error?.message ?? `Meta respondió ${res.status}`;
    return NextResponse.json(
      { error: message },
      { status: res.status >= 400 ? res.status : 502 },
    );
  }

  // Crear o obtener conversación y guardar mensaje outbound
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", credentials.userId)
    .eq("contact_phone", toNormalized)
    .maybeSingle();

  let conversationId: string;
  if (existing?.id) {
    conversationId = existing.id;
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  } else {
    const { data: inserted, error: insertConvError } = await supabase
      .from("conversations")
      .insert({
        user_id: credentials.userId,
        contact_phone: toNormalized,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (insertConvError || !inserted) {
      return NextResponse.json(
        { error: "Mensaje enviado por Meta pero no se pudo guardar la conversación." },
        { status: 500 },
      );
    }
    conversationId = inserted.id;
  }

  const { error: msgError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    direction: "outbound",
    type: "text",
    content: text,
  });

  if (msgError) {
    // Meta ya envió; solo loguear
    console.warn("Send: message saved to Meta but DB insert failed", msgError);
  }

  return NextResponse.json({
    ok: true,
    message_id: data.messages?.[0]?.id ?? null,
    conversation_id: conversationId,
  });
}
