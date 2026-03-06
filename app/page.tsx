import Link from "next/link";
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  Globe,
  MessageSquare,
  Link2,
  TrendingUp,
  Layers,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen gradient-mesh overflow-hidden">
      {/* Grid decorativo de fondo */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Blobs decorativos */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center border border-border group-hover:border-border-hover transition-colors">
            <MessageCircle className="w-5 h-5 text-text-muted" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Socrates AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            Características
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            Cómo funciona
          </a>
          <a
            href="#pricing"
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            Precios
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-text-muted hover:text-text transition-colors px-4 py-2"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="text-sm font-medium bg-accent text-surface px-4 py-2.5 rounded-xl hover:bg-accent-hover transition-colors"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 pt-16 pb-24 max-w-7xl mx-auto">
        <section className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-muted border border-accent/20 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="text-sm font-medium text-accent">
              Agentes de IA para WhatsApp
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Crea agentes que{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
              conversan
            </span>
            <br />
            por ti en WhatsApp
          </h1>

          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-10">
            Automatiza ventas, soporte y engagement. Tus clientes reciben
            respuestas instantáneas 24/7 mientras tú te enfocas en lo que
            importa.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-accent text-surface font-semibold hover:bg-accent-hover transition-all hover:scale-[1.02] glow-accent"
            >
              Empezar gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-border hover:border-border-hover bg-surface-elevated/50 backdrop-blur-sm transition-all">
              Ver demo
            </button>
          </div>
        </section>

        {/* Stats widgets */}
        <section className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "10K+", label: "Conversaciones/día", icon: MessageCircle },
            { value: "99.9%", label: "Uptime", icon: CheckCircle2 },
            { value: "2min", label: "Configuración", icon: Clock },
            { value: "24/7", label: "Disponibilidad", icon: Globe },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
            <div
              key={i}
              className="group p-5 rounded-2xl bg-surface-elevated/60 border border-accent/40 backdrop-blur-sm hover:bg-surface-elevated/80 transition-all"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-accent/10 text-accent">
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-bold text-accent">{stat.value}</div>
              <div className="text-sm text-text-muted">{stat.label}</div>
            </div>
            );
          })}
        </section>

        {/* Mockup WhatsApp */}
        <section className="mt-24 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-2xl h-[500px] rounded-3xl border border-border bg-surface-elevated/80 backdrop-blur-xl overflow-hidden glow-secondary">
              <div className="h-14 px-4 flex items-center gap-3 border-b border-border bg-surface-hover">
                <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center border border-border">
                  <MessageCircle className="w-5 h-5 text-text-muted" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Tu Agente IA</div>
                  <div className="text-xs text-text-muted">En línea</div>
                </div>
              </div>
              <div className="p-6 space-y-4 h-[calc(500px-3.5rem)] overflow-y-auto">
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-md bg-surface-hover border border-border">
                    <p className="text-sm">¿Cuáles son sus horarios?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-md bg-accent/20 border border-accent/30">
                    <p className="text-sm">
                      ¡Hola! Estamos abiertos de lunes a viernes, 9:00 - 18:00.
                      ¿En qué puedo ayudarte?
                    </p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-md bg-surface-hover border border-border">
                    <p className="text-sm">Quiero agendar una cita</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-md bg-accent/20 border border-accent/30">
                    <p className="text-sm">
                      Claro, ¿para qué día te gustaría? Tenemos disponibilidad
                      mañana a las 10:00 o 15:00.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-48 pt-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Todo lo que necesitas
          </h2>
          <p className="text-text-muted text-center max-w-xl mx-auto mb-16">
            Herramientas diseñadas para que tu negocio escale sin límites
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Respuestas inteligentes", desc: "IA que entiende contexto y responde como un humano. Personaliza el tono y estilo.", icon: MessageSquare },
              { title: "Integraciones", desc: "Conecta con CRM, calendarios y bases de datos. Sincroniza todo en tiempo real.", icon: Link2 },
              { title: "Analíticas en vivo", desc: "Métricas de conversaciones, satisfacción y tiempos de respuesta. Dashboards en tiempo real.", icon: TrendingUp },
              { title: "Multi-canal", desc: "WhatsApp Business API. Escala a miles de conversaciones sin perder calidad.", icon: Layers },
              { title: "Sin código", desc: "Configura flujos con un editor visual. No necesitas programar nada.", icon: LayoutGrid },
              { title: "Soporte 24/7", desc: "Tu agente nunca duerme. Responde en segundos a cualquier hora del día.", icon: Globe },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="group p-6 rounded-2xl bg-surface-elevated/60 border border-accent/40 transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-accent/10 text-accent border border-accent/40">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-text-muted text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Final */}
        <section className="mt-32 mb-24">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-secondary/10 to-accent/20" />
            <div className="relative px-8 py-16 md:py-24 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                ¿Listo para automatizar?
              </h2>
              <p className="text-text-muted text-lg max-w-xl mx-auto mb-8">
                Únete a cientos de negocios que ya usan Socrates AI. Configura tu
                primer agente en menos de 2 minutos.
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent text-surface font-semibold hover:bg-accent-hover transition-all hover:scale-[1.02]"
              >
                Crear cuenta gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center border border-border">
              <MessageCircle className="w-4 h-4 text-text-muted" />
            </div>
            <span className="text-sm font-medium text-text-muted">
              Socrates AI
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <a href="#" className="hover:text-text transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-text transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-text transition-colors">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
