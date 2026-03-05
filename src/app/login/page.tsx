"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabaseClient.auth.signInWithPassword(
      { email, password },
    );

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Bienvenido de nuevo
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Inicia sesión en Socrates AI
          </h1>
          <p className="text-sm text-slate-500">
            Centraliza tus conversaciones de WhatsApp Business.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-primary/20 placeholder:text-slate-400 focus:ring-2"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-primary/20 placeholder:text-slate-400 focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}

