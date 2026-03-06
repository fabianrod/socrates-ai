import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-8 backdrop-blur-sm">
        <h1 className="mb-6 text-xl font-semibold">Iniciar sesión</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Página en construcción. Próximamente podrás acceder a tu cuenta.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
