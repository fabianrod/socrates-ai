export default function ConversacionesPage() {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)]">
      <section className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              Conversaciones
            </h1>
            <p className="text-xs text-slate-500">
              Aquí verás todas las conversaciones activas de WhatsApp.
            </p>
          </div>
        </header>
        <div className="space-y-2 text-xs text-slate-500">
          <p className="rounded-lg border border-dashed border-border-subtle bg-slate-50 px-3 py-2">
            Aún no hay conversaciones. Cuando conectes tu WhatsApp Business y
            empiecen a llegar mensajes, aparecerán listados aquí.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
        <header className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Panel de conversación
          </h2>
          <p className="text-xs text-slate-500">
            Selecciona una conversación de la lista para ver el historial y
            enviar mensajes.
          </p>
        </header>
        <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-border-subtle bg-slate-50 text-xs text-slate-500">
          Esperando a que lleguen las primeras conversaciones…
        </div>
      </section>
    </div>
  );
}

