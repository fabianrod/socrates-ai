import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { signState } from "@/lib/whatsapp-state";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const metaAppId = process.env.META_APP_ID;
const metaAppSecret = process.env.META_APP_SECRET;

export async function POST(request: Request) {
  let body: { access_token?: string; refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo JSON inválido (envía access_token y refresh_token)" },
      { status: 400 },
    );
  }
  const accessToken = body.access_token ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const refreshToken = body.refresh_token ?? "";
  if (!accessToken) {
    return NextResponse.json(
      { error: "Falta el token de sesión (access_token o Authorization)" },
      { status: 401 },
    );
  }

  if (!metaAppId || !metaAppSecret) {
    return NextResponse.json(
      { error: "Configuración de Meta incompleta" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: sessionData, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  const user = sessionData?.user;
  if (error || !user) {
    return NextResponse.json(
      { error: "Sesión inválida o expirada. Cierra sesión y vuelve a entrar." },
      { status: 401 },
    );
  }

  const origin =
    request.headers.get("origin") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!origin) {
    return NextResponse.json(
      { error: "No se pudo determinar el origen (origin o VERCEL_URL)" },
      { status: 500 },
    );
  }

  const redirectUri = `${origin.replace(/\/$/, "")}/auth/callback/whatsapp`;
  const state = signState(user.id, randomBytes(16).toString("hex"), redirectUri);

  return NextResponse.json({ state, redirectUri });
}
