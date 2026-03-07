"use client";

import { useState } from "react";
import { MessageCircle, Plus, Phone } from "lucide-react";

type PhoneNumber = {
  id: string;
  phone_number: string;
  display_name: string | null;
  is_primary: boolean;
  status: string;
};

type Props = {
  organizationId: string;
  planName: string;
  phoneNumberLimit: number;
  phoneNumbers: PhoneNumber[];
};

export function ConfigWhatsApp({
  organizationId,
  planName,
  phoneNumberLimit,
  phoneNumbers,
}: Props) {
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<PhoneNumber[]>(phoneNumbers);

  const canAdd = list.length < phoneNumberLimit;
  const hasPrimary = list.some((n) => n.is_primary);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phone.trim(),
          display_name: displayName.trim() || undefined,
          is_primary: isPrimary || !hasPrimary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al agregar número");
        return;
      }
      setList((prev) => [
        ...prev,
        {
          id: data.id,
          phone_number: data.phone_number,
          display_name: data.display_name,
          is_primary: data.is_primary,
          status: data.status,
        },
      ]);
      setPhone("");
      setDisplayName("");
      setIsPrimary(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-elevated/60 p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center border border-border shrink-0">
          <MessageCircle className="w-6 h-6 text-text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold mb-1">WhatsApp</h2>
          <p className="text-sm text-text-muted mb-2">
            Conecta tu número principal y los de tus asociados (ej. barberos).
            Plan <strong>{planName}</strong>: hasta {phoneNumberLimit} números.
          </p>
          <p className="text-xs text-text-subtle">
            {list.length} de {phoneNumberLimit} números conectados.
          </p>
        </div>
      </div>

      {list.length > 0 && (
        <ul className="mb-6 space-y-2">
          {list.map((n) => (
            <li
              key={n.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <Phone className="w-4 h-4 text-text-muted shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-text">
                  {n.display_name || n.phone_number}
                </span>
                {n.display_name && (
                  <span className="block text-sm text-text-muted truncate">
                    {n.phone_number}
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wide">
                {n.status}
              </span>
              {n.is_primary && (
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                  Principal
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="wa-phone"
                className="block text-sm font-medium text-text mb-1.5"
              >
                Número (E.164, ej. +56912345678)
              </label>
              <input
                id="wa-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+56912345678"
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="wa-display"
                className="block text-sm font-medium text-text mb-1.5"
              >
                Nombre (ej. Principal, Barbero Juan)
              </label>
              <input
                id="wa-display"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Principal"
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="wa-primary"
              type="checkbox"
              checked={isPrimary || !hasPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              disabled={!hasPrimary}
              className="rounded border-border bg-surface text-accent focus:ring-accent"
            />
            <label htmlFor="wa-primary" className="text-sm text-text-muted">
              Número principal
            </label>
          </div>
          {error && (
            <p className="text-sm text-coral" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-surface font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {loading ? "Agregando…" : "Agregar número"}
          </button>
        </form>
      )}

      {!canAdd && (
        <p className="text-sm text-text-muted">
          Has alcanzado el límite de números de tu plan. Mejora tu plan para
          agregar más.
        </p>
      )}
    </section>
  );
}
