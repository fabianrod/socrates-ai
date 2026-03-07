import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateOrganization } from "@/lib/supabase/organization";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const result = await getOrCreateOrganization(supabase);
  if (!result.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("id, organization_id")
    .eq("id", conversationId)
    .single();

  if (convError || !conv || conv.organization_id !== result.org.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("id, body, direction, sent_at, type")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({ messages: messages ?? [] });
}
