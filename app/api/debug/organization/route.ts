import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Diagnóstico: ejecuta los mismos pasos que getOrCreateOrganization y devuelve
 * el resultado de cada paso + errores crudos de Supabase.
 * Uso: con sesión iniciada, abre GET /api/debug/organization en el navegador o con curl.
 * Solo disponible en desarrollo (NODE_ENV=development) o con ENABLE_DEBUG_ORG=1.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_DEBUG_ORG === "1";
  if (!isDev) {
    return NextResponse.json(
      { error: "Diagnóstico solo en desarrollo o con ENABLE_DEBUG_ORG=1" },
      { status: 404 }
    );
  }

  const supabase = await createClient();
  const debug: Record<string, unknown> = {
    hint: "Cada paso muestra si pasó o el error. El que falle es la causa.",
  };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  debug.step1_user = user
    ? { ok: true, userId: user.id, email: user.email }
    : { ok: false, error: userError?.message ?? "No hay usuario" };
  if (!user) {
    return NextResponse.json(debug);
  }

  let profile: { id: string } | null = null;
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  profile = profileData;
  debug.step2_profile = profile
    ? { ok: true, profileId: profile.id }
    : {
        ok: false,
        error: profileError?.message ?? "No existe perfil",
        code: profileError?.code,
      };
  if (!profile) {
    return NextResponse.json(debug);
  }

  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", profile.id)
    .limit(1)
    .maybeSingle();
  debug.step3_existing_member = existingMember
    ? { ok: true, organizationId: existingMember.organization_id }
    : { ok: false, message: "No eres miembro de ninguna org (normal si es la primera vez)" };

  if (existingMember) {
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", existingMember.organization_id)
      .single();
    debug.step4_fetch_org = org
      ? { ok: true, org }
      : { ok: false, message: "No se pudo cargar la org" };
    return NextResponse.json(debug);
  }

  const { data: defaultPlan, error: planError } = await supabase
    .from("plans")
    .select("id, slug")
    .eq("slug", "basico")
    .maybeSingle();
  debug.step4_plans = defaultPlan
    ? { ok: true, planId: defaultPlan.id, slug: defaultPlan.slug }
    : {
        ok: false,
        error: planError?.message ?? "No hay plan basico",
        code: planError?.code,
      };
  if (!defaultPlan) {
    return NextResponse.json(debug);
  }

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
    .select("id, name")
    .single();

  debug.step5_org_insert = newOrg
    ? { ok: true, orgId: newOrg.id, name: newOrg.name }
    : {
        ok: false,
        error: orgError?.message ?? "Insert falló",
        code: orgError?.code,
        details: orgError?.details,
        hint: orgError?.code === "42501" ? "RLS: política INSERT en organizations rechazó la fila" : undefined,
      };

  if (orgError || !newOrg) {
    return NextResponse.json(debug);
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: newOrg.id,
      profile_id: profile.id,
      role: "owner",
    });

  debug.step6_member_insert = !memberError
    ? { ok: true }
    : {
        ok: false,
        error: memberError.message,
        code: memberError.code,
        details: memberError.details,
        hint: memberError.code === "42501" ? "RLS: política INSERT en organization_members rechazó la fila" : undefined,
      };

  return NextResponse.json(debug);
}
