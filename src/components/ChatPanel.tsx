"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, ChatResponse, DevisData, DevisUpdate } from "@/lib/types";

export const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour ! Décrivez votre devis en langage naturel et je remplirai tout automatiquement.\n\nExemple :\n« Devis pour Mr Koffi, aménagement cuisine villa Cocody, 4 meubles bas MDF à 85 000 FCFA, 2 meubles hauts à 60 000 FCFA, main d'œuvre 120 000 FCFA »",
};

interface ChatPanelProps {
  devis: DevisData;
  onUpdate: (update: DevisUpdate) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function ChatPanel({ devis, onUpdate, messages, setMessages }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-grow textarea
  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
    autoGrow();
  }, [input, autoGrow]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[88%] px-4 py-3 text-[14px] sm:text-[12px] leading-relaxed whitespace-pre-wrap ${
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
            <div className="bg-app-input border border-app-border px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-gold rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-3 sm:px-3 py-3 border-t border-app-border flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-app-input border border-app-border text-app-text font-montserrat text-[14px] sm:text-[12px] px-3 py-2.5 outline-none focus:border-gold transition-colors resize-none overflow-hidden leading-relaxed"
            rows={1}
            style={{ minHeight: "44px" }}
            placeholder="Décrivez votre devis..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-gold text-white flex-shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-40 hover:opacity-85 transition-opacity border-none"
            style={{ width: "44px", height: "44px", fontSize: "18px" }}
            aria-label="Envoyer"
          >
            ➤
          </button>
        </div>
        <div className="hidden sm:block text-[10px] text-app-muted mt-1.5">
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </div>
      </div>
    </div>
  );
}
