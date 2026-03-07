import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateOrganization } from "@/lib/supabase/organization";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const result = await getOrCreateOrganization(supabase);
  if (!result.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgId = result.org.id;

  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select(
      `
      id,
      last_message_at,
      contact_id,
      contacts ( wa_phone_number )
    `
    )
    .eq("organization_id", orgId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (convError) {
    return NextResponse.json(
      { error: convError.message },
      { status: 500 }
    );
  }

  const ids = (conversations ?? []).map((c) => c.id);
  if (ids.length === 0) {
    return NextResponse.json({
      conversations: (conversations ?? []).map((c) => ({
        id: c.id,
        contact_phone: (c.contacts as { wa_phone_number: string } | null)?.wa_phone_number ?? "",
        last_message_at: c.last_message_at,
        last_message_body: null,
      })),
    });
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, body, direction, sent_at")
    .in("conversation_id", ids)
    .order("sent_at", { ascending: false });

  const lastByConv: Record<string, { body: string; sent_at: string }> = {};
  for (const m of messages ?? []) {
    if (!lastByConv[m.conversation_id]) {
      lastByConv[m.conversation_id] = { body: m.body ?? "", sent_at: m.sent_at };
    }
  }

  const list = (conversations ?? []).map((c) => ({
    id: c.id,
    contact_phone: (c.contacts as { wa_phone_number: string } | null)?.wa_phone_number ?? "",
    last_message_at: c.last_message_at,
    last_message_body: lastByConv[c.id]?.body ?? null,
  }));

  return NextResponse.json({ conversations: list });
}
