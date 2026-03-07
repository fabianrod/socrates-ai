import type { SupabaseClient } from "@supabase/supabase-js";

export type OrganizationWithPlan = {
  id: string;
  name: string;
  slug: string;
  plan_id: string;
  plans: {
    id: string;
    name: string;
    slug: string;
    conversation_limit: number;
    phone_number_limit: number;
  } | Array<{
    id: string;
    name: string;
    slug: string;
    conversation_limit: number;
    phone_number_limit: number;
  }> | null;
};

export type WhatsAppAccountWithNumbers = {
  id: string;
  organization_id: string;
  name: string;
  status: string;
  phone_numbers: Array<{
    id: string;
    phone_number: string;
    display_name: string | null;
    is_primary: boolean;
    status: string;
  }>;
};

export async function getOrCreateOrganization(
  supabase: SupabaseClient
): Promise<OrganizationWithPlan | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!profile) return null;

  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", profile.id)
    .limit(1)
    .single();

  if (existingMember) {
    const { data: org } = await supabase
      .from("organizations")
      .select(
        `
        id,
        name,
        slug,
        plan_id,
        plans:plan_id (
          id,
          name,
          slug,
          conversation_limit,
          phone_number_limit
        )
      `
      )
      .eq("id", existingMember.organization_id)
      .single();
    return org as unknown as OrganizationWithPlan;
  }

  const { data: defaultPlan } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", "basico")
    .single();
  if (!defaultPlan) return null;

  const slug =
    "org-" +
    profile.id.slice(0, 8) +
    "-" +
    Math.random().toString(36).slice(2, 8);
  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: "Mi negocio",
      slug,
      owner_id: profile.id,
      plan_id: defaultPlan.id,
    })
    .select(
      `
      id,
      name,
      slug,
      plan_id,
      plans:plan_id (
        id,
        name,
        slug,
        conversation_limit,
        phone_number_limit
      )
    `
    )
    .single();

  if (orgError || !newOrg) return null;

  await supabase.from("organization_members").insert({
    organization_id: newOrg.id,
    profile_id: profile.id,
    role: "owner",
  });

  return newOrg as unknown as OrganizationWithPlan;
}

export async function getOrCreateWhatsAppAccount(
  supabase: SupabaseClient,
  organizationId: string
): Promise<WhatsAppAccountWithNumbers | null> {
  const { data: existing } = await supabase
    .from("whatsapp_accounts")
    .select(
      `
      id,
      organization_id,
      name,
      status,
      whatsapp_phone_numbers (
        id,
        phone_number,
        display_name,
        is_primary,
        status
      )
    `
    )
    .eq("organization_id", organizationId)
    .limit(1)
    .single();

  if (existing) {
    return {
      ...existing,
      phone_numbers: (existing as { whatsapp_phone_numbers: unknown[] })
        .whatsapp_phone_numbers ?? [],
    } as WhatsAppAccountWithNumbers;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? null;
  const { data: newAccount, error } = await supabase
    .from("whatsapp_accounts")
    .insert({
      organization_id: organizationId,
      twilio_account_sid: accountSid,
      name: "WhatsApp",
      status: "active",
    })
    .select(
      `
      id,
      organization_id,
      name,
      status,
      whatsapp_phone_numbers (
        id,
        phone_number,
        display_name,
        is_primary,
        status
      )
    `
    )
    .single();

  if (error || !newAccount) return null;

  return {
    ...newAccount,
    phone_numbers: (newAccount as { whatsapp_phone_numbers: unknown[] })
      .whatsapp_phone_numbers ?? [],
  } as WhatsAppAccountWithNumbers;
}
