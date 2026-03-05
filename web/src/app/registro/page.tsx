"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: nombre,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.user) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Empieza gratis
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Crea tu cuenta en Socrates AI
          </h1>
          <p className="text-sm text-slate-500">
            Conecta tu WhatsApp Business y diseña agentes de IA.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-slate-700"
            >
              Nombre o marca
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-primary/20 placeholder:text-slate-400 focus:ring-2"
              placeholder="Socrates Studio"
            />
          </div>

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
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

