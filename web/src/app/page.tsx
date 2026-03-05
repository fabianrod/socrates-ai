export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 lg:px-10 lg:py-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
              <span className="text-xl font-semibold text-primary">Σ</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Socrates AI
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-foreground hover:bg-white"
            >
              Iniciar sesión
            </a>
            <a
              href="/registro"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
            >
              Comenzar gratis
            </a>
          </nav>
        </header>

        <section className="mt-16 grid flex-1 gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Plataforma tipo Manychat enfocada en WhatsApp Business
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Crea agentes de IA que venden y atienden por WhatsApp.
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">
              Socrates AI centraliza tus conversaciones de WhatsApp Business en un
              dashboard limpio y moderno. Conecta tu número en minutos y diseña
              experiencias conversacionales inteligentes sin pelearte con la
              tecnología.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/registro"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
              >
                Crear mi cuenta
              </a>
              <a
                href="#caracteristicas"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Ver cómo funciona
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
                ✦ Enfoque 100% en WhatsApp Business
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
                ✦ Sin código para el usuario final
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border-subtle">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Vista previa del dashboard
            </p>
            <div className="mt-4 flex overflow-hidden rounded-2xl border border-border-subtle bg-slate-50">
              <aside className="w-40 border-r border-border-subtle bg-sidebar-bg p-3">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Menú
                </p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center justify-between rounded-md bg-primary-soft px-2 py-1.5 text-emerald-800">
                    <span>Conversaciones</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </li>
                  <li className="rounded-md px-2 py-1.5 text-slate-600">
                    Configuración
                  </li>
                  <li className="rounded-md px-2 py-1.5 text-slate-600">
                    Agentes
                  </li>
                  <li className="rounded-md px-2 py-1.5 text-slate-600">
                    Contactos
                  </li>
                  <li className="rounded-md px-2 py-1.5 text-slate-600">
                    Calendario
                  </li>
                </ul>
              </aside>
              <div className="flex-1 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-slate-500">
                      Conversación activa
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      Cliente interesado en demo
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-medium text-emerald-700">
                    IA + humano
                  </span>
                </div>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="inline-block max-w-[80%] rounded-2xl bg-white px-3 py-2 text-slate-700 shadow-sm">
                    Hola, ¿me puedes contar cómo funciona Socrates AI con
                    WhatsApp Business?
                  </div>
                  <div className="ml-auto inline-block max-w-[80%] rounded-2xl bg-primary px-3 py-2 text-slate-950 shadow-sm">
                    Claro, conectamos tu número de WhatsApp Business y
                    entrenamos un agente de IA para responder y calificar
                    clientes automáticamente.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="caracteristicas"
          className="mt-20 grid gap-6 border-t border-border-subtle pt-10 md:grid-cols-3"
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Conecta tu WhatsApp en minutos
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Usa el flujo oficial de Embedded Signup para vincular tu número de
              WhatsApp Business sin configuraciones técnicas complicadas.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Conversaciones centralizadas
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Administra todas tus conversaciones en un solo dashboard, con
              filtros y contexto de cada contacto.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Pensado para agentes de IA
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Diseñado desde cero para crear y gestionar agentes de IA que
              atienden, califican y agendan sin fricción.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
