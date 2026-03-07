"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DashboardLogout() {
  const router = useRouter();

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
      Cerrar sesión
    </button>
  );
}
