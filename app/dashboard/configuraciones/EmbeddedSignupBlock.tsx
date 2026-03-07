"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { MessageCircle, Plus } from "lucide-react";

declare global {
  interface Window {
    FB?: {
      login: (
        callback: (r: { status: string }) => void,
        opts: {
          config_id: string;
          auth_type: string;
          response_type: string;
          override_default_response_type: boolean;
          extras: {
            sessionInfoVersion: number;
            setup: { solutionID: string };
          };
        }
      ) => void;
      init: (opts: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type Props = {
  metaAppId: string;
  configId: string;
  solutionId: string;
  onSuccess: () => void;
  disabled: boolean;
};

export function EmbeddedSignupBlock({
  metaAppId,
  configId,
  solutionId,
  onSuccess,
  disabled,
}: Props) {
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const pendingRef = useRef<{ phone: string; display_name: string } | null>(null);

  const loadFbSdk = useCallback(() => {
    if (typeof window === "undefined" || window.FB) {
      setSdkReady(true);
      return;
    }
    window.fbAsyncInit = function () {
      window.FB!.init({
        appId: metaAppId,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v21.0",
      });
      setSdkReady(true);
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/es_ES/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  }, [metaAppId]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "WA_EMBEDDED_SIGNUP") return;
        if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA") {
          const { waba_id } = data.data;
          const pending = pendingRef.current;
          if (!pending || !waba_id) {
            setError("Faltan datos. Vuelve a intentar.");
            setLoading(false);
            return;
          }
          (async () => {
            const res = await fetch("/api/whatsapp/embedded-signup/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                waba_id,
                phone_number: pending.phone,
                display_name: pending.display_name || undefined,
              }),
            });
            const json = await res.json();
            if (!res.ok) {
              setError(json.error ?? "Error al registrar el número");
              setLoading(false);
              return;
            }
            pendingRef.current = null;
            setPhone("");
            setDisplayName("");
            setError(null);
            setLoading(false);
            onSuccess();
          })();
        } else if (data.event === "CANCEL") {
          setLoading(false);
          pendingRef.current = null;
        } else if (data.event === "ERROR") {
          setError(data.data?.error_message ?? "Error en el flujo de Meta");
          setLoading(false);
          pendingRef.current = null;
        }
      } catch {
        // ignore non-JSON
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSuccess]);

  const handleConnect = () => {
    const normalized = "+" + phone.replace(/\D/g, "");
    if (normalized.length < 10) {
      setError("Indica un número válido (E.164, ej. +56912345678)");
      return;
    }
    setError(null);
    pendingRef.current = { phone: normalized, display_name: displayName.trim() };
    setLoading(true);
    if (!window.FB) {
      loadFbSdk();
      const check = setInterval(() => {
        if (window.FB) {
          clearInterval(check);
          launchSignup();
        }
      }, 200);
      return;
    }
    launchSignup();
  };

  function launchSignup() {
    if (!window.FB) {
      setLoading(false);
      setError("No se pudo cargar el inicio de sesión de Meta.");
      return;
    }
    window.FB.login(
      () => {},
      {
        config_id: configId,
        auth_type: "rerequest",
        response_type: "code",
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: 3,
          setup: { solutionID: solutionId },
        },
      }
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-accent" />
        <h3 className="font-medium text-text">Conectar con WhatsApp (Embedded Signup)</h3>
      </div>
      <p className="text-sm text-text-muted">
        Conecta tu número de WhatsApp Business con Meta. Introduce el número y el nombre que quieres usar, luego inicia sesión con Facebook y completa el flujo.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="es-phone" className="block text-sm font-medium text-text mb-1">
            Número (E.164)
          </label>
          <input
            id="es-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+56912345678"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="es-name" className="block text-sm font-medium text-text mb-1">
            Nombre para mostrar
          </label>
          <input
            id="es-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Mi negocio"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleConnect}
        disabled={disabled || loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-surface font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {loading ? "Completa el flujo en la ventana de Meta…" : "Conectar con WhatsApp"}
      </button>
    </div>
  );
}
