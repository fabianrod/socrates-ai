"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

const navItems = [
  { href: "/dashboard/conversaciones", label: "Conversaciones" },
  { href: "/dashboard/configuracion", label: "Configuración" },
  { href: "/dashboard/agentes", label: "Agentes" },
  { href: "/dashboard/contactos", label: "Contactos" },
  { href: "/dashboard/calendario", label: "Calendario" },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setCheckingSession(false);
    };

    void checkSession();
  }, [router]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-slate-500">Cargando tu espacio de trabajo…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 border-r border-border-subtle bg-sidebar-bg px-4 py-6 md:flex md:flex-col">
        <Link href="/" className="flex items-center gap-2 pb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
            <span className="text-xl font-semibold text-primary">Σ</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Socrates AI
          </span>
        </Link>
        <nav className="mt-2 space-y-1 text-sm">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  isActive
                    ? "bg-primary-soft text-emerald-800"
                    : "text-slate-700 hover:bg-primary-soft hover:text-emerald-800"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-subtle bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft">
              <span className="text-lg font-semibold text-primary">Σ</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              Socrates AI
            </span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              Espacio de trabajo
            </span>
            <button
              type="button"
              onClick={async () => {
                await supabaseClient.auth.signOut();
                router.replace("/login");
              }}
              className="flex h-8 items-center justify-center rounded-full bg-primary-soft px-3 text-xs font-semibold text-emerald-800 hover:bg-primary-soft/80"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}

