"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Integration = {
  id: string;
  status: string;
  display_phone_number: string | null;
  phone_number_id: string | null;
  whatsapp_business_account_id: string | null;
} | null;

export default function ConfiguracionPage() {
  const [integration, setIntegration] = useState<Integration>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const configId = process.env.NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID;

  const fetchIntegration = useCallback(async () => {
    const { data, error: e } = await supabaseClient
      .from("whatsapp_integrations")
      .select("id, status, display_phone_number, phone_number_id, whatsapp_business_account_id")
      .maybeSingle();
    if (!e) setIntegration(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error: e } = await supabaseClient
          .from("whatsapp_integrations")
          .select("id, status, display_phone_number, phone_number_id, whatsapp_business_account_id")
          .maybeSingle();
        if (!cancelled && !e) setIntegration(data ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("connected") === "1") {
      void fetchIntegration();
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard/configuracion");
      }
    }
    const err = params.get("error");
    if (err) {
      setError(
        err === "invalid_state"
          ? "Enlace inválido o expirado. Vuelve a intentar."
          : err === "meta_rejected"
            ? "Meta rechazó la autorización. Comprueba que el redirect URI en Meta sea exactamente la URL de callback."
            : err === "server_config"
              ? "Falta configuración en el servidor (META_* o SUPABASE_SERVICE_ROLE_KEY)."
              : "Algo falló. Vuelve a intentar.",
      );
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard/configuracion");
      }
    }
  }, [fetchIntegration]);

  const handleConnectWhatsApp = async () => {
    if (!appId || !configId) {
      setError(
        "Falta la configuración de Meta (NEXT_PUBLIC_META_APP_ID o NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID).",
      );
      return;
    }
    setError(null);
    setConnecting(true);
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session) {
      setError("Sesión expirada. Cierra sesión y vuelve a entrar.");
      setConnecting(false);
      return;
    }
    const { data: { session: refreshed } } = await supabaseClient.auth.refreshSession();
    const activeSession = refreshed ?? session;
    const res = await fetch("/api/whatsapp/oauth-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: activeSession.access_token,
        refresh_token: activeSession.refresh_token ?? "",
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "No se pudo iniciar el flujo.");
      setConnecting(false);
      return;
    }
    const { state, redirectUri } = await res.json();
    const oauthUrl = new URL("https://www.facebook.com/v22.0/dialog/oauth");
    oauthUrl.searchParams.set("client_id", appId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set("config_id", configId);
    oauthUrl.searchParams.set("state", state);
    window.location.href = oauthUrl.toString();
  };

  const configIncomplete = !appId || !configId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Conecta tu número de WhatsApp Business y ajusta las opciones básicas
          de tu espacio de trabajo.
        </p>
      </div>

      <section className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm">
        <header className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Conectar WhatsApp Business
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Serás redirigido a Meta para autorizar. Después volverás aquí con tu
            número conectado.
          </p>
        </header>

        {configIncomplete && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Configura <strong>NEXT_PUBLIC_META_APP_ID</strong> y{" "}
            <strong>NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID</strong> en tu entorno
            (y en Vercel haz un nuevo deploy).
          </div>
        )}

        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Cargando estado de conexión…</p>
        ) : integration?.status === "connected" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  WhatsApp Business conectado
                </p>
                {integration.display_phone_number && (
                  <p className="text-xs text-slate-500">
                    {integration.display_phone_number}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Puedes usar la sección Conversaciones para enviar y recibir mensajes.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
            <p className="max-w-md">
              Al hacer clic en &quot;Conectar WhatsApp&quot; irás a Meta, iniciarás
              sesión y autorizarás el número. Luego volverás aquí.
            </p>
            <button
              type="button"
              onClick={() => void handleConnectWhatsApp()}
              disabled={connecting || configIncomplete}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connecting ? "Redirigiendo…" : "Conectar WhatsApp"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
