"use client";

import { useState, useEffect, useCallback } from "react";

// Modos disponíveis no cronômetro
const MODES = {
  FOCUS:      { label: "Foco",        seconds: 25 * 60, color: "#2D6A4F", bg: "#E8F5EF" },
  SHORT_BREAK:{ label: "Pausa curta", seconds:  5 * 60, color: "#1E6091", bg: "#EBF5FB" },
  LONG_BREAK: { label: "Pausa longa", seconds: 15 * 60, color: "#6B3FA0", bg: "#F5EEF8" },
};

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function FocusTimer({ onSessionComplete }) {
  const [modeKey, setModeKey] = useState("FOCUS");
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const mode = MODES[modeKey];
  const progress = 1 - timeLeft / mode.seconds;
  const circumference = 2 * Math.PI * 54; // raio 54

  // ─────────────────────────────────────────────
  // useEffect #1 — O CORAÇÃO DO CRONÔMETRO
  //
  // useEffect roda código com "efeitos colaterais"
  // (coisas fora do render, como timers).
  //
  // O array de dependências [isRunning] faz o efeito
  // ser recriado sempre que isRunning muda.
  //
  // A função de RETORNO (cleanup) cancela o intervalo
  // quando o componente é desmontado ou o efeito
  // roda novamente — evitando memory leaks.
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return; // se pausado, não cria intervalo

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          handleSessionEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup: cancela o intervalo ao pausar ou trocar de modo
    return () => clearInterval(interval);
  }, [isRunning]); // roda novamente sempre que isRunning mudar

  // ─────────────────────────────────────────────
  // useEffect #2 — Atualiza o título da aba
  // Dependências: [timeLeft, modeKey, isRunning]
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      document.title = `${formatTime(timeLeft)} — ${mode.label} | Flowise`;
    } else {
      document.title = "Flowise — Produtividade com equilíbrio";
    }
    return () => { document.title = "Flowise"; };
  }, [timeLeft, modeKey, isRunning]);

  function handleSessionEnd() {
    if (modeKey === "FOCUS") {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);
      const minutesFocused = MODES.FOCUS.seconds / 60;
      onSessionComplete?.(minutesFocused, newCount);
    }
  }

  function switchMode(key) {
    setIsRunning(false);
    setModeKey(key);
    setTimeLeft(MODES[key].seconds);
  }

  function toggleTimer() {
    setIsRunning((prev) => !prev);
  }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft(mode.seconds);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Seletor de modo */}
      <div className="flex gap-2 p-1 rounded-xl bg-[#F7F5F0] border border-[#E8E4DC]">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              modeKey === key
                ? "bg-white shadow-sm border border-[#E8E4DC] text-[#1A1A2E]"
                : "text-[#6B7280] hover:text-[#374151]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Anel circular do cronômetro */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="176" height="176" viewBox="0 0 120 120">
          {/* Trilha de fundo */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="#E8E4DC" strokeWidth="6" />
          {/* Progresso */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={mode.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>

        {/* Tempo e modo no centro */}
        <div className="flex flex-col items-center z-10">
          <span className="text-4xl font-semibold tracking-tight text-[#1A1A2E]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs mt-1" style={{ color: mode.color }}>{mode.label}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        <button
          onClick={resetTimer}
          className="w-10 h-10 rounded-full border border-[#E8E4DC] bg-white flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F7F5F0] transition-all active:scale-95"
          aria-label="Reiniciar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>

        <button
          onClick={toggleTimer}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: mode.color }}
          aria-label={isRunning ? "Pausar" : "Iniciar"}
        >
          {isRunning ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>

        <div className="w-10 h-10 rounded-full border border-[#E8E4DC] bg-white flex items-center justify-center">
          <span className="text-xs font-medium text-[#6B7280]">{sessionsCompleted}</span>
        </div>
      </div>

      {/* Legenda dos pomodoros */}
      <p className="text-xs text-[#9CA3AF]">
        {sessionsCompleted === 0
          ? "Inicie seu primeiro foco do dia"
          : `${sessionsCompleted} ${sessionsCompleted === 1 ? "sessão completa" : "sessões completas"} hoje`}
      </p>
    </div>
  );
}
