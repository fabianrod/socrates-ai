"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";

type Conversation = {
  id: string;
  contact_phone: string;
  last_message_at: string | null;
  last_message_body: string | null;
};

type Message = {
  id: string;
  body: string | null;
  direction: string;
  sent_at: string;
  type: string;
};

export function ConversacionesList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/conversations");
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    (async () => {
      const res = await fetch(`/api/conversations/${selectedId}/messages`);
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      } else {
        setMessages([]);
      }
      setMessagesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex flex-col h-full max-h-[70vh] sm:flex-row sm:max-h-[calc(100vh-12rem)] gap-4">
      <div className="w-full sm:w-80 flex-shrink-0 rounded-xl border border-border bg-surface-elevated/60 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-border">
          <h2 className="font-semibold text-text">Conversaciones</h2>
          <p className="text-xs text-text-muted">
            Mensajes que llegan a tus números de WhatsApp
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-text-muted">Cargando…</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">
              Aún no hay conversaciones. Envía un WhatsApp a uno de tus números
              en Configuraciones para probar.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors ${
                      selectedId === c.id ? "bg-surface-hover" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-text-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text truncate">
                        {c.contact_phone || "Sin número"}
                      </p>
                      <p className="text-sm text-text-muted truncate">
                        {c.last_message_body || "—"}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface-elevated/60 overflow-hidden flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center p-8 text-text-muted">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Elige una conversación</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-border flex items-center gap-2">
              <Phone className="w-4 h-4 text-text-muted" />
              <span className="font-medium text-text">{selected.contact_phone}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <p className="text-sm text-text-muted">Cargando mensajes…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-text-muted">No hay mensajes</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        m.direction === "outbound"
                          ? "bg-accent text-surface"
                          : "bg-surface-hover text-text"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {m.body || "—"}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(m.sent_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
