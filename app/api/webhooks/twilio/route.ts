import { NextResponse } from "next/server";
import { getTwilio, validateTwilioSignature } from "@/lib/twilio";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = request.url;
  const contentType = request.headers.get("content-type") ?? "";
  let params: Record<string, string> = {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    const searchParams = new URLSearchParams(text);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  const signature = request.headers.get("x-twilio-signature") ?? "";
  if (!validateTwilioSignature(url, params, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const from = params.From?.replace("whatsapp:", "") ?? "";
  const to = params.To?.replace("whatsapp:", "") ?? "";
  const body = params.Body ?? "";
  const messageSid = params.MessageSid ?? "";

  if (!from || !to) {
    return NextResponse.json({ error: "Missing From/To" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: phoneRow } = await supabase
    .from("whatsapp_phone_numbers")
    .select("id, whatsapp_accounts(organization_id)")
    .eq("phone_number", to)
    .limit(1)
    .single();

  if (!phoneRow) {
    return NextResponse.json({ ok: true });
  }

  const accounts = phoneRow.whatsapp_accounts as
    | { organization_id: string }
    | { organization_id: string }[]
    | null;
  const orgId = Array.isArray(accounts)
    ? accounts[0]?.organization_id
    : accounts?.organization_id;
  if (!orgId) {
    return NextResponse.json({ ok: true });
  }
  const phoneNumberId = phoneRow.id;

  let contactId: string;
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("wa_phone_number", from)
    .single();

  if (existingContact) {
    contactId = existingContact.id;
  } else {
    const { data: newContact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        organization_id: orgId,
        wa_phone_number: from,
      })
      .select("id")
      .single();
    if (contactError || !newContact) {
      return NextResponse.json({ error: "Contact insert failed" }, { status: 500 });
    }
    contactId = newContact.id;
  }

  let conversationId: string;
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("whatsapp_phone_number_id", phoneNumberId)
    .eq("contact_id", contactId)
    .single();

  if (existingConv) {
    conversationId = existingConv.id;
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  } else {
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({
        organization_id: orgId,
        whatsapp_phone_number_id: phoneNumberId,
        contact_id: contactId,
        status: "open",
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (convError || !newConv) {
      return NextResponse.json({ error: "Conversation insert failed" }, { status: 500 });
    }
    conversationId = newConv.id;
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    direction: "inbound",
    meta_message_id: messageSid,
    body: body,
    type: "text",
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    }
  );
}
