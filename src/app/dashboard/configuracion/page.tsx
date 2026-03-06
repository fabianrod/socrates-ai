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
  const [disconnecting, setDisconnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: true; verified_name?: string | null; display_phone_number?: string | null } | { error: string } | null>(null);
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
    const detail = params.get("detail");
    if (err) {
      const messages: Record<string, string> = {
        invalid_state: "Enlace inválido o expirado. Vuelve a intentar desde Configuración.",
        meta_rejected: "Meta rechazó el código. Comprueba que el URI de redirección en Meta sea exactamente: https://tu-dominio/auth/callback/whatsapp",
        server_config: "Falta configuración en Vercel: META_APP_ID, META_APP_SECRET y SUPABASE_SERVICE_ROLE_KEY.",
        missing_code_or_state: "Meta no devolvió código o state. ¿Cerraste la ventana antes de tiempo?",
        no_token: "Meta no devolvió token. Vuelve a intentar el flujo.",
        meta_invalid: "Respuesta de Meta inválida. Vuelve a intentar.",
        save_failed: "Error al guardar la integración. Comprueba SUPABASE_SERVICE_ROLE_KEY y que la tabla whatsapp_integrations exista.",
      };
      let msg = messages[err] ?? `Error: ${err}. Vuelve a intentar.`;
      if (err === "save_failed" && detail) {
        msg += ` Detalle: ${decodeURIComponent(detail)}`;
      }
      setError(msg);
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
    // Pedir explícitamente permisos de WhatsApp (business_management no es válido como scope en la URL)
    oauthUrl.searchParams.set(
      "scope",
      "whatsapp_business_management,whatsapp_business_messaging",
    );
    window.location.href = oauthUrl.toString();
  };

  const handleDisconnect = async () => {
    if (!integration?.id) return;
    setError(null);
    setDisconnecting(true);
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      setError("Sesión expirada. Cierra sesión y vuelve a entrar.");
      setDisconnecting(false);
      return;
    }
    // Borrar la fila: desvincula por completo en esta app. El número queda libre
    // para volver a conectar aquí (o, si revocan la app en Meta, para otra app).
    const { error: deleteError } = await supabaseClient
      .from("whatsapp_integrations")
      .delete()
      .eq("user_id", user.id);
    if (deleteError) {
      setError(deleteError.message ?? "No se pudo desconectar.");
      setDisconnecting(false);
      return;
    }
    await fetchIntegration();
    setDisconnecting(false);
  };

  const handleTestConnection = async () => {
    setError(null);
    setTestResult(null);
    setTesting(true);
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) {
      setTestResult({ error: "Sesión expirada. Inicia sesión de nuevo." });
      setTesting(false);
      return;
    }
    const res = await fetch("/api/whatsapp/test-connection", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTestResult({ error: data.error ?? `Error ${res.status}` });
      setTesting(false);
      return;
    }
    setTestResult(data.ok ? { ok: true, verified_name: data.verified_name, display_phone_number: data.display_phone_number } : { error: data.error ?? "Error desconocido" });
    setTesting(false);
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
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleTestConnection()}
                  disabled={testing}
                  className="rounded-full border border-primary bg-primary-soft px-4 py-2 text-[13px] font-medium text-slate-800 hover:bg-primary/20 disabled:opacity-60"
                >
                  {testing ? "Comprobando…" : "Probar conexión"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDisconnect()}
                  disabled={disconnecting}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {disconnecting ? "Desconectando…" : "Desconectar"}
                </button>
              </div>
              {testResult && (
                <p className={`max-w-sm text-right text-[12px] ${"ok" in testResult && testResult.ok ? "text-green-700" : "text-red-600"}`}>
                  {"ok" in testResult && testResult.ok
                    ? `Conexión correcta${testResult.verified_name ? ` · ${testResult.verified_name}` : ""}${testResult.display_phone_number ? ` (${testResult.display_phone_number})` : ""}`
                    : "error" in testResult
                      ? testResult.error
                      : ""}
                </p>
              )}
              <p className="text-[11px] text-slate-400">
                Desconectar desvincula el número aquí; quedará libre para volver a conectar.
              </p>
            </div>
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
