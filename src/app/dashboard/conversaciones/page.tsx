"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";

type Conversation = {
  id: string;
  contact_phone: string;
  updated_at: string;
};

type Message = {
  id: string;
  direction: string;
  content: string;
  created_at: string;
};

export default function ConversacionesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendText, setSendText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingNew, setSendingNew] = useState(false);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const fetchConversations = useCallback(async () => {
    const { data } = await supabaseClient
      .from("conversations")
      .select("id, contact_phone, updated_at")
      .order("updated_at", { ascending: false });
    setConversations((data as Conversation[]) ?? []);
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    const { data } = await supabaseClient
      .from("messages")
      .select("id, direction, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    setMessagesLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: integration } = await supabaseClient
        .from("whatsapp_integrations")
        .select("status")
        .eq("status", "connected")
        .maybeSingle();
      if (!cancelled) setWhatsappConnected(!!integration);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void fetchConversations();
    setLoading(false);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedId) void fetchMessages(selectedId);
    else setMessages([]);
  }, [selectedId, fetchMessages]);

  const handleSend = async () => {
    if (!selectedConversation || !sendText.trim()) return;
    setError(null);
    setSending(true);
    await supabaseClient.auth.refreshSession();
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) {
      setError("Sesión expirada. Vuelve a iniciar sesión.");
      setSending(false);
      return;
    }
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        to: selectedConversation.contact_phone,
        text: sendText.trim(),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Error al enviar.");
      setSending(false);
      return;
    }
    setSendText("");
    await fetchMessages(selectedConversation.id);
    await fetchConversations();
    setSending(false);
  };

  const handleSendNew = async () => {
    const phone = newPhone.replace(/\D/g, "");
    if (phone.length < 10 || !newMessage.trim()) {
      setError("Indica un número (ej. 573001112233) y un mensaje.");
      return;
    }
    setError(null);
    setSendingNew(true);
    await supabaseClient.auth.refreshSession();
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) {
      setError("Sesión expirada. Vuelve a iniciar sesión.");
      setSendingNew(false);
      return;
    }
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ to: phone, text: newMessage.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Error al enviar.");
      setSendingNew(false);
      return;
    }
    setNewPhone("");
    setNewMessage("");
    await fetchConversations();
    if (json.conversation_id) setSelectedId(json.conversation_id);
    setSendingNew(false);
  };

  const formatPhone = (p: string) => {
    if (p.length <= 10) return p;
    return `+${p.slice(0, p.length - 10)} ${p.slice(-10)}`;
  };

  return (
    <div className="grid h-[calc(100vh-6rem)] gap-0 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <section className="flex flex-col border-r border-border-subtle bg-white">
        <header className="border-b border-border-subtle p-3">
          <h1 className="text-sm font-semibold text-slate-900">Conversaciones</h1>
          <p className="text-xs text-slate-500">
            Envía y recibe mensajes por WhatsApp Business.
          </p>
        </header>
        {!whatsappConnected && (
          <div className="mx-3 mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Conecta tu WhatsApp en{" "}
            <Link href="/dashboard/configuracion" className="underline">
              Configuración
            </Link>{" "}
            para enviar mensajes.
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-3 text-xs text-slate-500">Cargando…</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className={`w-full px-3 py-3 text-left text-sm ${selectedId === null ? "bg-primary-soft font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  + Nueva conversación
                </button>
              </li>
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full px-3 py-3 text-left text-sm ${selectedId === c.id ? "bg-primary-soft font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span className="block truncate">
                      {formatPhone(c.contact_phone)}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col bg-slate-50/50">
        {selectedId === null ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center p-6">
              <p className="mb-4 text-sm text-slate-600">
                Escribe el número con código de país (ej. 573001112233) y un
                mensaje para iniciar una conversación.
              </p>
              {error && (
                <p className="mb-3 text-sm text-red-600">{error}</p>
              )}
              <div className="flex w-full max-w-sm flex-col gap-3">
                <input
                  type="tel"
                  placeholder="Número (ej. 573001112233)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Mensaje"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleSendNew()}
                  disabled={sendingNew || !whatsappConnected}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {sendingNew ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </div>
          </>
        ) : selectedConversation ? (
          <>
            <header className="border-b border-border-subtle bg-white px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                {formatPhone(selectedConversation.contact_phone)}
              </h2>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              {messagesLoading ? (
                <p className="text-center text-sm text-slate-500">
                  Cargando mensajes…
                </p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-slate-500">
                  Aún no hay mensajes. Escribe abajo y envía.
                </p>
              ) : (
                <ul className="space-y-2">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <span
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          m.direction === "outbound"
                            ? "bg-primary text-slate-900"
                            : "bg-white text-slate-800 shadow-sm"
                        }`}
                      >
                        {m.content}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-border-subtle bg-white p-3">
              {error && (
                <p className="mb-2 text-xs text-red-600">{error}</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje…"
                  value={sendText}
                  onChange={(e) => setSendText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  className="flex-1 rounded-full border border-border-subtle px-4 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || !sendText.trim() || !whatsappConnected}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {sending ? "…" : "Enviar"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Selecciona una conversación o inicia una nueva.
          </div>
        )}
      </section>
    </div>
  );
}
