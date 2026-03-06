"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  Users,
  Settings,
  Bot,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/conversaciones", label: "Conversaciones", icon: MessageCircle },
  { href: "/dashboard/contactos", label: "Contactos", icon: Users },
  { href: "/dashboard/configuraciones", label: "Configuraciones", icon: Settings },
  { href: "/dashboard/agentes", label: "Agentes", icon: Bot },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface-elevated flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/40">
              <MessageCircle className="w-5 h-5 text-accent" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Socrates AI
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarLink key={item.href} href={item.href}>
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                {item.label}
              </SidebarLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Salir al inicio
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isActive
          ? "bg-accent/10 text-accent border border-accent/40"
          : "text-text-muted hover:text-text hover:bg-surface-hover border border-transparent"
      }`}
    >
      {children}
    </Link>
  );
}
