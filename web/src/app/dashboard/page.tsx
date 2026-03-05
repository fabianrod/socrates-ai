export default function DashboardHomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Bienvenido a tu panel
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Desde aquí podrás gestionar tus conversaciones, configurar tu
          integración con WhatsApp Business y crear agentes de IA.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Paso 1
          </p>
          <h2 className="mt-2 text-sm font-semibold text-slate-900">
            Conecta tu WhatsApp Business
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Ve a la sección de Configuración para iniciar el flujo de Embedded
            Signup y vincular tu número.
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Paso 2
          </p>
          <h2 className="mt-2 text-sm font-semibold text-slate-900">
            Centraliza tus conversaciones
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Administra y responde mensajes desde la sección de Conversaciones.
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Paso 3
          </p>
          <h2 className="mt-2 text-sm font-semibold text-slate-900">
            Diseña tus agentes de IA
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Crea agentes que atiendan, califiquen y agenden automáticamente
            para tu negocio.
          </p>
        </div>
      </div>
    </div>
  );
}

