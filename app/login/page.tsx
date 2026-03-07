"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError(err.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : err.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated/90 p-8 backdrop-blur-sm">
        <h1 className="mb-2 text-xl font-semibold">Iniciar sesión</h1>
        <p className="mb-6 text-sm text-text-muted">
          Ingresa tu correo y contraseña para acceder.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="tu@ejemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-coral" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-2.5 font-medium text-surface hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-accent hover:underline">
            Crear cuenta
          </Link>
        </p>
        <Link
          href="/"
          className="mt-4 flex justify-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen gradient-mesh flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated/90 p-8 backdrop-blur-sm text-center text-text-muted">
            Cargando…
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
