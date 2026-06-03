"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Send, Sparkles, AlertCircle, Bot, User } from "lucide-react";

// ── Sugestões de conversa ─────────────────────────────────────
const SUGGESTIONS = [
  { label: "Preciso de ajuda com foco", icon: "🎯" },
  { label: "Estou me sentindo ansioso(a)", icon: "😟" },
  { label: "Como melhorar meu sono?", icon: "🌙" },
  { label: "Dicas para produtividade", icon: "⚡" },
  { label: "Estou muito cansado(a)", icon: "😴" },
  { label: "Técnicas de respiração", icon: "🧘" },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot size={16} className="text-white" />
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // ── Proteção de rota ────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // ── Mensagem de boas-vindas ─────────────────────────────────
  useEffect(() => {
    if (user && messages.length === 0) {
      const firstName = user?.displayName?.split(" ")[0] ?? "";
      const greeting = firstName
        ? `Olá, ${firstName}! 👋 Sou o assistente Flowise, seu coach de bem-estar e produtividade. Como posso te ajudar hoje?`
        : "Olá! 👋 Sou o assistente Flowise, seu coach de bem-estar e produtividade. Como posso te ajudar hoje?";

      setTimeout(() => {
        setMessages([
          {
            role: "assistant",
            content: greeting,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 400);
    }
  }, [user, messages.length]);

  // ── Auto-scroll ─────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ── Enviar mensagem ─────────────────────────────────────────
  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao se comunicar com o assistente.");
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          timestamp: data.timestamp,
        },
      ]);
    } catch (err) {
      console.error("Erro no chat:", err);
      setError(
        "Desculpe, ocorreu um erro. Verifique sua conexão e tente novamente."
      );
      setMessages((prev) => prev.slice(0, -1)); // remove user message on error
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }

  // ── Enviar sugestão ─────────────────────────────────────────
  function handleSuggestion(suggestion) {
    setInput(suggestion);
    // Pequeno delay para garantir que o input seja preenchido antes do envio
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      // Não podemos chamar handleSend diretamente porque input pode não ter atualizado ainda
      const trimmed = suggestion.trim();
      if (!trimmed || isTyping) return;

      const userMessage = {
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);
      setError(null);

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Erro ao se comunicar com o assistente.");
          }
          return res.json();
        })
        .then((data) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.reply,
              timestamp: data.timestamp,
            },
          ]);
        })
        .catch((err) => {
          console.error("Erro no chat:", err);
          setError("Desculpe, ocorreu um erro. Tente novamente.");
          setMessages((prev) => prev.slice(0, -1));
        })
        .finally(() => {
          setIsTyping(false);
          inputRef.current?.focus();
        });
    }, 50);
  }

  // ── Tecla Enter para enviar ─────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-green-700 dark:border-green-600 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-md">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Flowise Assistant</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Online — seu coach de bem-estar
          </p>
        </div>
      </div>

      {/* ── Área de mensagens ──────────────────────────────── */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 px-2 py-2 ${
              msg.role === "user" ? "justify-end" : ""
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <Bot size={16} className="text-white" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-green-700 dark:bg-green-600 text-white rounded-br-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <span
                className={`block text-[10px] mt-1.5 ${
                  msg.role === "user"
                    ? "text-green-200 dark:text-green-300"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-700 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && <TypingIndicator />}

        {error && (
          <div className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Sugestões ──────────────────────────────────────── */}
      {showSuggestions && !isTyping && (
        <div className="px-4 py-3 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5 font-medium">
            Sugestões para conversar:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSuggestion(s.label)}
                disabled={isTyping}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 hover:border-green-400 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input de mensagem ──────────────────────────────── */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-950"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            disabled={isTyping}
            className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 disabled:opacity-60 transition-all"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-green-700 dark:bg-green-600 text-white flex items-center justify-center hover:bg-green-800 dark:hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}