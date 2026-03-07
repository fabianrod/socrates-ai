"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || undefined },
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  if (success) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated/90 p-8 backdrop-blur-sm">
          <h1 className="mb-2 text-xl font-semibold">Revisa tu correo</h1>
          <p className="mb-6 text-sm text-text-muted">
            Te enviamos un enlace para confirmar tu cuenta. Si no lo ves, revisa la carpeta de spam.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-surface hover:bg-accent-hover transition-colors"
          >
            Ir a iniciar sesión
          </Link>
          <Link
            href="/"
            className="mt-4 flex justify-center text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated/90 p-8 backdrop-blur-sm">
        <h1 className="mb-2 text-xl font-semibold">Crear cuenta</h1>
        <p className="mb-6 text-sm text-text-muted">
          Regístrate con tu correo para empezar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-text mb-1.5">
              Nombre (opcional)
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Tu nombre"
            />
          </div>
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
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Mínimo 6 caracteres"
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
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Iniciar sesión
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
