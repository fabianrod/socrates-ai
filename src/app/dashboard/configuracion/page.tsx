"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
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
  const [fbReady, setFbReady] = useState(false);

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
    if (typeof window === "undefined" || !appId) return;
    window.fbAsyncInit = function () {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: true,
        version: "v22.0",
      });
      queueMicrotask(() => setFbReady(true));
    };
    if (window.FB) queueMicrotask(() => setFbReady(true));
    return () => {
      window.fbAsyncInit = undefined;
    };
  }, [appId]);

  const handleConnectWhatsApp = () => {
    if (!window.FB || !configId) {
      setError(
        "Falta la configuración de Meta (NEXT_PUBLIC_META_APP_ID o NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID).",
      );
      return;
    }
    setError(null);
    setConnecting(true);
    window.FB.login(
      (response) => {
        setConnecting(false);
        if (response.authResponse?.code) {
          void (async () => {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
              setError("Sesión expirada. Vuelve a iniciar sesión.");
              return;
            }
            const res = await fetch("/api/whatsapp/connect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: response.authResponse.code,
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(json.error || "Error al conectar con WhatsApp.");
              return;
            }
            setError(null);
            await fetchIntegration();
          })();
        } else if (response.status !== "unknown") {
          setError("No se obtuvo el código de autorización. Intenta de nuevo.");
        }
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { sessionInfoVersion: "3" },
      },
    );
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
            Usa el flujo oficial de Embedded Signup de Meta para autorizar a
            Socrates AI a enviar y recibir mensajes desde tu número de WhatsApp
            Business. Solo necesitas tu cuenta de Meta Business.
          </p>
        </header>

        {configIncomplete && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Para activar el botón necesitas configurar en tu <code className="rounded bg-amber-100 px-1">.env.local</code>:
            <code className="mt-1 block rounded bg-amber-100 p-2">
              NEXT_PUBLIC_META_APP_ID, NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID, META_APP_SECRET
            </code>
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
              Al hacer clic en &quot;Conectar WhatsApp&quot; se abrirá la ventana
              de Meta. Inicia sesión con tu cuenta de negocio y autoriza el
              número que quieras usar.
            </p>
            <button
              type="button"
              onClick={handleConnectWhatsApp}
              disabled={connecting || !fbReady || configIncomplete}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connecting ? "Conectando…" : "Conectar WhatsApp"}
            </button>
          </div>
        )}
      </section>

      {appId && (
        <Script
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="lazyOnload"
          onLoad={() => {
            if (window.fbAsyncInit) window.fbAsyncInit();
          }}
        />
      )}
    </div>
  );
}
