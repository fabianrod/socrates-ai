import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        <p className="text-text-muted text-sm">
          Elige una sección para comenzar
        </p>
      </div>
      <div className="max-w-2xl flex flex-wrap gap-3">
        <Link
          href="/dashboard/configuraciones"
          className="rounded-xl border border-border bg-surface-elevated/60 px-5 py-3 font-medium text-text hover:bg-surface-hover transition-colors"
        >
          Configuraciones
        </Link>
        <Link
          href="/dashboard/conversaciones"
          className="rounded-xl border border-border bg-surface-elevated/60 px-5 py-3 font-medium text-text-muted hover:bg-surface-hover transition-colors"
        >
          Conversaciones
        </Link>
        <Link
          href="/dashboard/contactos"
          className="rounded-xl border border-border bg-surface-elevated/60 px-5 py-3 font-medium text-text-muted hover:bg-surface-hover transition-colors"
        >
          Contactos
        </Link>
        <Link
          href="/dashboard/agentes"
          className="rounded-xl border border-border bg-surface-elevated/60 px-5 py-3 font-medium text-text-muted hover:bg-surface-hover transition-colors"
        >
          Agentes
        </Link>
      </div>
    </div>
  );
}
