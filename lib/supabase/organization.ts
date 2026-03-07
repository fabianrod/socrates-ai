import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

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

export type GetOrCreateOrganizationResult =
  | { ok: true; org: OrganizationWithPlan }
  | { ok: false; error: "no_user" | "no_profile" | "no_plans" | "org_insert_failed" | "member_insert_failed" };

export async function getOrCreateOrganization(
  supabase: SupabaseClient
): Promise<GetOrCreateOrganizationResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no_user" };

  let { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    const displayName =
      (user.user_metadata?.full_name as string) ||
      (user.email?.split("@")[0]) ||
      "Usuario";
    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        display_name: displayName,
      })
      .select("id")
      .single();
    if (profileError || !newProfile) return { ok: false, error: "no_profile" };
    profile = newProfile;
  }

  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", profile.id)
    .limit(1)
    .maybeSingle();

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
    if (org) return { ok: true, org: org as unknown as OrganizationWithPlan };
  }

  const { data: defaultPlan } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", "basico")
    .maybeSingle();
  if (!defaultPlan) return { ok: false, error: "no_plans" };

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

  if (orgError || !newOrg) {
    if (orgError?.code === "42501") {
      const fallback = await createOrganizationWithAdmin(profile.id, defaultPlan.id);
      if (fallback) return { ok: true, org: fallback };
    }
    if (typeof console !== "undefined") {
      console.error("[getOrCreateOrganization] org insert failed", {
        code: orgError?.code,
        message: orgError?.message,
        details: orgError?.details,
        owner_id: profile.id,
      });
    }
    return { ok: false, error: "org_insert_failed" };
  }

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: newOrg.id,
    profile_id: profile.id,
    role: "owner",
  });

  if (memberError) {
    if (typeof console !== "undefined") {
      console.error("[getOrCreateOrganization] member insert failed", {
        code: memberError.code,
        message: memberError.message,
        details: memberError.details,
      });
    }
    return { ok: false, error: "member_insert_failed" };
  }

  return { ok: true, org: newOrg as unknown as OrganizationWithPlan };
}

/**
 * Crea organización + miembro con service_role (bypasea RLS).
 * Solo se usa como fallback cuando el INSERT con sesión falla por RLS (42501).
 * La sesión y el perfil ya se comprobaron antes de llamar esto.
 */
async function createOrganizationWithAdmin(
  profileId: string,
  planId: string
): Promise<OrganizationWithPlan | null> {
  try {
    const admin = createAdminClient();
    const slug =
      "org-" +
      profileId.slice(0, 8) +
      "-" +
      Math.random().toString(36).slice(2, 8);
    const { data: newOrg, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: "Mi negocio",
        slug,
        owner_id: profileId,
        plan_id: planId,
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

    const { error: memberError } = await admin.from("organization_members").insert({
      organization_id: newOrg.id,
      profile_id: profileId,
      role: "owner",
    });
    if (memberError) return null;

    return newOrg as unknown as OrganizationWithPlan;
  } catch {
    return null;
  }
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
