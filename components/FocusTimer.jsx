"use client";

import { useState, useEffect, useRef } from "react";

// ── Configuração Pomodoro ──────────────────────────────────
const SESSIONS = {
  FOCUS:       { label: "Foco",        seconds: 25 * 60, type: "focus" },
  SHORT_BREAK: { label: "Pausa curta", seconds:  5 * 60, type: "break" },
  LONG_BREAK:  { label: "Pausa longa", seconds: 15 * 60, type: "break" },
};

const POMODORO_CYCLE = 4;

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ── LocalStorage helpers ───────────────────────────────────
const STORAGE_KEY = "flowise_timer";

function saveTimerState(modeKey, endTime) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ modeKey, endTime }));
}

function loadTimerState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { modeKey, endTime } = JSON.parse(raw);
    const remaining = Math.floor((endTime - Date.now()) / 1000);
    if (remaining <= 0) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { modeKey, remaining };
  } catch {
    return null;
  }
}

function clearTimerState() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function FocusTimer({ onSessionComplete, onRunningChange }) {
  const [modeKey, setModeKey]               = useState("FOCUS");
  const [timeLeft, setTimeLeft]             = useState(SESSIONS.FOCUS.seconds);
  const [isRunning, setIsRunning]           = useState(false);
  const [focusDone, setFocusDone]           = useState(0);
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const [continuousFocusMinutes, setContinuousFocusMinutes] = useState(0);
  const [showSaturationAlert, setShowSaturationAlert] = useState(false);
  const [dismissedSaturationAlert, setDismissedSaturationAlert] = useState(false);

  const startTimeRef   = useRef(null);
  const initialTimeRef = useRef(timeLeft);
  const focusStartRef  = useRef(null);

  const mode         = SESSIONS[modeKey];
  const total        = mode.seconds;
  const progress     = (total - timeLeft) / total;
  const radius       = 80;
  const circumference = 2 * Math.PI * radius;
  const isFocusMode  = modeKey === "FOCUS";

  const ringColor = {
    FOCUS:       "#10b981",
    SHORT_BREAK: "#3b82f6",
    LONG_BREAK:  "#8b5cf6",
  }[modeKey];

  // ── useEffect 1: recupera timer ao recarregar ─────────────
  useEffect(() => {
    const saved = loadTimerState();
    if (saved) {
      setModeKey(saved.modeKey);
      setTimeLeft(saved.remaining);
      setIsRunning(true);
    }
  }, []);

  // ── useEffect 2: tick do cronômetro ──────────────────────
  // Usa Date.now() em vez de contar ticks — imune ao throttle
  // do browser em abas em segundo plano.
  useEffect(() => {
    if (!isRunning) {
      startTimeRef.current = null;
      return;
    }

    startTimeRef.current   = Date.now();
    initialTimeRef.current = timeLeft;

    // ── RN-SATURA\u00c7\u00c3O-01: Iniciar rastreamento de foco cont\u00ednuo ──
    if (modeKey === "FOCUS" && !focusStartRef.current) {
      focusStartRef.current = Date.now();
    }

    // Salva no localStorage quando vai terminar
    const endTime = Date.now() + timeLeft * 1000;
    saveTimerState(modeKey, endTime);

    const interval = setInterval(() => {
      const elapsed   = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = initialTimeRef.current - elapsed;

      // ── RN-SATURA\u00c7\u00c3O-01: Calcular tempo cont\u00ednuo de foco ──
      if (modeKey === "FOCUS" && focusStartRef.current) {
        const continuousMs = Date.now() - focusStartRef.current;
        const continuousMin = Math.floor(continuousMs / 60000);
        setContinuousFocusMinutes(continuousMin);

        // Mostrar alerta se 2h+ de foco cont\u00ednuo
        if (continuousMin >= 120 && !dismissedSaturationAlert && !showSaturationAlert) {
          setShowSaturationAlert(true);
        }
      }

      if (remaining <= 0) {
        clearInterval(interval);
        clearTimerState();
        setTimeLeft(0);
        setIsRunning(false);
        handleSessionEnd();
      } else {
        setTimeLeft(remaining);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, modeKey]);

  // ── useEffect 3: propaga estado running para o dashboard ──
  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning]);

  // ── useEffect 4: título da aba ────────────────────────────
  useEffect(() => {
    document.title = isRunning
      ? `${formatTime(timeLeft)} — ${mode.label} | Flowise`
      : "Flowise";
    return () => { document.title = "Flowise"; };
  }, [timeLeft, isRunning]);

  // ── Lógica ao terminar uma sessão ────────────────────────
  function handleSessionEnd() {
    if (modeKey === "FOCUS") {
      const newFocusDone = focusDone + 1;
      const newTotal     = totalPomodoros + 1;
      setFocusDone(newFocusDone);
      setTotalPomodoros(newTotal);
      onSessionComplete?.(SESSIONS.FOCUS.seconds / 60, newTotal);
      const nextMode = newFocusDone % POMODORO_CYCLE === 0 ? "LONG_BREAK" : "SHORT_BREAK";
      switchMode(nextMode, false);      
      // ── RN-SATURA\u00c7\u00c3O-01: Resetar ao entrar em pausa ──
      focusStartRef.current = null;
      setContinuousFocusMinutes(0);
      setShowSaturationAlert(false);
      setDismissedSaturationAlert(false);    } else {
      switchMode("FOCUS", false);
    }
  }

  function switchMode(key, autoStart = false) {
    clearTimerState();
    setModeKey(key);
    setTimeLeft(SESSIONS[key].seconds);
    setIsRunning(autoStart);
  }

  function toggleTimer() { setIsRunning((p) => !p); }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft(mode.seconds);
    clearTimerState();
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">

      {/* ── RN-SATURA\u00c7\u00c3O-01: Alerta de saturação de foco ── */}
      {showSaturationAlert && !dismissedSaturationAlert && (
        <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start animate-pulse">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Vamos fazer uma pausa?</p>
            <p className="text-xs text-amber-800 mt-1">Você está focando há {continuousFocusMinutes} minutos. Uma pausa de 15min vai renovar sua mente!</p>
          </div>
          <button
            onClick={() => setDismissedSaturationAlert(true)}
            className="flex-shrink-0 text-amber-600 hover:text-amber-700 text-lg leading-none"
            aria-label="Fechar alerta"
          >
            ✕
          </button>
        </div>
      )}

      {/* Seletor de modo */}
      <div className="flex gap-1.5 p-1 bg-[#F7F5F0] border border-[#E8E4DC] rounded-2xl">
        {Object.entries(SESSIONS).map(([key, s]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              modeKey === key
                ? "bg-white shadow-sm border border-[#E8E4DC] text-[#1A1A2E]"
                : "text-[#9CA3AF] hover:text-[#374151]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Anel do cronômetro */}
      <div className="relative flex items-center justify-center w-52 h-52">
        <svg
          className="-rotate-90 absolute inset-0"
          width="208" height="208"
          viewBox="0 0 208 208"
        >
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={ringColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={ringColor} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <circle cx="104" cy="104" r={radius} fill="none" stroke="#E8E4DC" strokeWidth="8" />
          <circle
            cx="104" cy="104" r={radius}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.9s ease, stroke 0.4s ease" }}
          />
        </svg>

        <div className="flex flex-col items-center z-10 select-none">
          <span className="text-5xl font-semibold tracking-tight text-[#1A1A2E] tabular-nums">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs mt-1.5 font-medium" style={{ color: ringColor }}>
            {isRunning ? mode.label.toUpperCase() : "PRONTO"}
          </span>
        </div>

        {isRunning && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-10"
            style={{ backgroundColor: ringColor }}
          />
        )}
      </div>

      {/* Dots de sessão Pomodoro */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          {Array.from({ length: POMODORO_CYCLE }).map((_, i) => {
            const cycleIndex = focusDone % POMODORO_CYCLE;
            const filled     = i < cycleIndex;
            const current    = isFocusMode && i === cycleIndex && isRunning;
            return (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  current ? "w-5 bg-emerald-500"
                  : filled ? "w-3 bg-emerald-400"
                  : "w-3 bg-[#E8E4DC]"
                }`}
              />
            );
          })}
        </div>
        <p className="text-[10px] text-[#9CA3AF]">
          Ciclo {Math.floor(focusDone / POMODORO_CYCLE) + 1} · Sessão{" "}
          {(focusDone % POMODORO_CYCLE) + 1}/{POMODORO_CYCLE}
        </p>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-4">
        <button
          onClick={resetTimer}
          className="w-10 h-10 rounded-full border border-[#E8E4DC] bg-white flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F7F5F0] transition-all active:scale-95"
          aria-label="Reiniciar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>

        <button
          onClick={toggleTimer}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-medium shadow-sm transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: ringColor }}
          aria-label={isRunning ? "Pausar" : "Iniciar"}
        >
          {isRunning ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              Pausar
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              {modeKey === "FOCUS" ? "Iniciar Foco" : "Iniciar Pausa"}
            </>
          )}
        </button>

        <div className="w-10 h-10 rounded-full border border-[#E8E4DC] bg-white flex flex-col items-center justify-center">
          <span className="text-xs font-semibold text-[#1A1A2E] leading-none">{totalPomodoros}</span>
          <span className="text-[8px] text-[#9CA3AF] leading-none">hoje</span>
        </div>
      </div>
    </div>
  );
}