"use client";

import { Settings, MessageCircle } from "lucide-react";

export default function ConfiguracionesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Configuraciones</h1>
        <p className="text-text-muted text-sm">
          Conecta tus canales y ajusta las preferencias de tu cuenta
        </p>
      </div>

      <div className="max-w-2xl">
        <section className="rounded-2xl border border-border bg-surface-elevated/60 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center border border-border shrink-0">
              <MessageCircle className="w-6 h-6 text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold mb-1">WhatsApp</h2>
              <p className="text-sm text-text-muted mb-4">
                Conecta tu número de WhatsApp Business para que tu agente pueda
                recibir y enviar mensajes automáticamente.
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-surface font-medium hover:bg-accent-hover transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Conectar WhatsApp
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
