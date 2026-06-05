"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, ChatResponse, DevisData, DevisUpdate } from "@/lib/types";

interface ChatPanelProps {
  devis: DevisData;
  onUpdate: (update: DevisUpdate) => void;
}

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour ! Décrivez votre devis en langage naturel et je remplirai tout automatiquement.\n\nExemple :\n« Devis pour Mr Koffi, aménagement cuisine villa Cocody, 4 meubles bas MDF à 85 000 FCFA, 2 meubles hauts à 60 000 FCFA, main d'œuvre 120 000 FCFA »",
};

export default function ChatPanel({ devis, onUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, currentDevis: devis }),
      });
      const data: ChatResponse = await res.json();

      if (data.update) onUpdate(data.update);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erreur de connexion. Vérifiez la clé API Groq.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] px-3.5 py-2.5 text-[12px] leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-gold text-white"
                  : "bg-app-input border border-app-border text-app-text"
              }`}
            >
              {m.role === "assistant" && (
                <div className="text-[9px] font-bold tracking-widest text-gold mb-1.5 uppercase">
                  IA Tutto Legno
                </div>
              )}
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-app-input border border-app-border px-3.5 py-3">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-app-border flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            className="flex-1 bg-app-input border border-app-border text-app-text font-montserrat text-[12px] px-3 py-2 outline-none focus:border-gold transition-colors resize-none"
            rows={3}
            placeholder="Décrivez votre devis... (Entrée pour envoyer)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-gold text-white px-4 text-[11px] font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 hover:opacity-85 transition-opacity self-end py-2.5 border-none flex-shrink-0"
          >
            Envoyer
          </button>
        </div>
        <div className="text-[10px] text-app-muted mt-1.5">
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </div>
      </div>
    </div>
  );
}
