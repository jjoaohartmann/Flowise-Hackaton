"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  saveEmotion,
  loadRecentEmotions,
  saveRoutine,
  loadRoutine,
  validateRoutine,
} from "@/lib/bemEstar";

// ── RF-07: emoções disponíveis ────────────────────────────
const EMOTIONS = [
  { emoji: "😊", label: "Feliz",      color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7", gradient: ["#a7f3d0", "#10b981", "#059669"] },
  { emoji: "😌", label: "Calmo",      color: "#3b82f6", bg: "#eff6ff", border: "#93c5fd", gradient: ["#bfdbfe", "#3b82f6", "#2563eb"] },
  { emoji: "🧘", label: "Focado",     color: "#8b5cf6", bg: "#f5f3ff", border: "#c4b5fd", gradient: ["#ddd6fe", "#8b5cf6", "#7c3aed"] },
  { emoji: "😰", label: "Estressado", color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", gradient: ["#fde68a", "#f59e0b", "#d97706"] },
  { emoji: "😴", label: "Cansado",    color: "#6b7280", bg: "#f9fafb", border: "#d1d5db", gradient: ["#d1d5db", "#6b7280", "#4b5563"] },
  { emoji: "😤", label: "Frustrado",  color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", gradient: ["#fecaca", "#ef4444", "#dc2626"] },
];

// ── Labels de intensidade ─────────────────────────────────
const INTENSITY_LABELS = {
  1:  "Muito leve",
  2:  "Leve",
  3:  "Moderado leve",
  4:  "Moderado",
  5:  "Médio",
  6:  "Moderado alto",
  7:  "Alto",
  8:  "Muito alto",
  9:  "Intenso",
  10: "Extremo",
};

// ── RF-04: valores padrão da rotina ──────────────────────
const ROUTINE_DEFAULT = {
  objetivo:      "",
  wakeUp:        "07:00",
  sleep:         "23:00",
  workHours:     "8",
  breakMinutes:  "25",
  exerciseMin:   "30",
  screenLimit:   "120",
};

// ── Emoji de humor conforme intensidade (expressões que mudam) ──
const MOOD_EXPRESSIONS = {
  feliz:       { 1: "🙂", 5: "😊", 10: "😆" },
  calmo:       { 1: "😐", 5: "😌", 10: "🧘" },
  focado:      { 1: "🤔", 5: "🧐", 10: "🎯" },
  estressado:  { 1: "😕", 5: "😰", 10: "😫" },
  cansado:     { 1: "😐", 5: "😴", 10: "🥱" },
  frustrado:   { 1: "😒", 5: "😤", 10: "🤬" },
};

// ── Helper: cor conforme intensidade ──
const getIntensityColor = (val) => {
  const colors = {
    1:  "#60a5fa",
    2:  "#818cf8",
    3:  "#a78bfa",
    4:  "#c084fc",
    5:  "#e879f9",
    6:  "#f472b6",
    7:  "#fb923c",
    8:  "#f97316",
    9:  "#ef4444",
    10: "#dc2626",
  };
  return colors[val] || colors[5];
};

// ── Emoji baseado na emoção + intensidade ──
function getMoodEmoji(emotionLabel, intensity) {
  const key = emotionLabel.toLowerCase();
  const map = MOOD_EXPRESSIONS[key];
  if (!map) return emotionLabel ? EMOTIONS.find(e => e.label === emotionLabel)?.emoji || "😐" : "😐";
  if (intensity <= 3) return map[1];
  if (intensity <= 7) return map[5];
  return map[10];
}

export default function BemEstarPage() {
  const { user, loading } = useAuth();
  const router   = useRouter();

  const [tab,           setTab]           = useState("emocoes");
  const [pageLoading,   setPageLoading]   = useState(true);

  // ── Estado: emoções ───────────────────────────────────
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [intensity,        setIntensity]        = useState(5);
  const [emotionNote,      setEmotionNote]      = useState("");
  const [savingEmotion,    setSavingEmotion]    = useState(false);
  const [emotionSaved,     setEmotionSaved]     = useState(false);
  const [recentEmotions,   setRecentEmotions]   = useState([]);
  const [showSlider,       setShowSlider]       = useState(false);

  // ── Estado: rotina ────────────────────────────────────
  const [routine,       setRoutine]       = useState(ROUTINE_DEFAULT);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [routineSaved,  setRoutineSaved]  = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);

  // ── Ref para o slider track ───────────────────────────
  const sliderRef = useRef(null);
  const dragging = useRef(false);

  // ── Proteção de rota + carregamento inicial ───────────
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    async function init() {
      try {
        const [emotions, savedRoutine] = await Promise.all([
          loadRecentEmotions(user.uid),
          loadRoutine(user.uid),
        ]);
        setRecentEmotions(emotions);
        if (savedRoutine) setRoutine((prev) => ({ ...prev, ...savedRoutine }));
      } catch (err) {
        console.error("Erro ao carregar bem-estar:", err);
      } finally {
        setPageLoading(false);
      }
    }

    init();
  }, [user, loading, router]);

  // ── Selecionar emoção com animação ────────────────────
  function handleSelectEmotion(em) {
    if (selectedEmotion?.label === em.label) {
      setSelectedEmotion(null);
      setShowSlider(false);
    } else {
      setSelectedEmotion(em);
      setIntensity(5);
      setTimeout(() => setShowSlider(true), 50);
    }
  }

  // ── Calcular posição no slider ────────────────────────
  const calcIntensityFromEvent = useCallback((clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setIntensity(Math.round(pct * 9) + 1);
  }, []);

  // ── Slider events ─────────────────────────────────────
  const handleTrackClick = useCallback((e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    calcIntensityFromEvent(clientX);
  }, [calcIntensityFromEvent]);

  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    calcIntensityFromEvent(clientX);
  }, [calcIntensityFromEvent]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMove = (e) => {
      if (!dragging.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      calcIntensityFromEvent(clientX);
    };

    const handleEnd = () => {
      dragging.current = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [calcIntensityFromEvent]);

  // ── Registrar emoção ──────────────────────────────────
  async function handleSaveEmotion() {
    if (!selectedEmotion || !user) return;
    setSavingEmotion(true);
    try {
      await saveEmotion(user.uid, {
        emoji: selectedEmotion.emoji,
        label: selectedEmotion.label,
        note:  emotionNote.trim(),
        intensity,
      });

      setRecentEmotions((prev) => [
        {
          id:    Date.now().toString(),
          emoji: selectedEmotion.emoji,
          label: selectedEmotion.label,
          note:  emotionNote.trim(),
          intensity,
          date:  new Date().toISOString().split("T")[0],
        },
        ...prev.slice(0, 9),
      ]);

      setSelectedEmotion(null);
      setShowSlider(false);
      setIntensity(5);
      setEmotionNote("");
      setEmotionSaved(true);
      setTimeout(() => setEmotionSaved(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar emoção:", err);
    } finally {
      setSavingEmotion(false);
    }
  }

  // ── Salvar rotina ─────────────────────────────────────
  async function handleSaveRoutine(e) {
    e.preventDefault();
    if (!user) return;

    const issues = validateRoutine(routine);
    setValidationIssues(issues);

    setSavingRoutine(true);
    try {
      await saveRoutine(user.uid, routine);
      setRoutineSaved(true);
      setTimeout(() => setRoutineSaved(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar rotina:", err);
    } finally {
      setSavingRoutine(false);
    }
  }

  function handleRoutineChange(e) {
    const { name, value } = e.target;
    setRoutine((prev) => ({ ...prev, [name]: value }));
  }

  // ── Loading ───────────────────────────────────────────
  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <div className="w-8 h-8 rounded-full border-2 border-green-700 dark:border-green-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const fillPct = ((intensity - 1) / 9) * 100;
  const intensityColor = getIntensityColor(intensity);

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 transition";
  const selectClass =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 transition";
  const labelClass =
    "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  // Emoji animado atual
  const currentMoodEmoji = selectedEmotion
    ? getMoodEmoji(selectedEmotion.label, intensity)
    : "😐";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Título */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Bem-estar 🌿
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
          Como você está hoje?
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {[
          { key: "emocoes", label: "😌 Emoções" },
          { key: "rotina",  label: "📋 Rotina"  },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-green-700 dark:bg-green-700 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ABA EMOÇÕES ─────────────────────────────── */}
      {tab === "emocoes" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
              Como você está se sentindo agora?
            </p>

            {/* Grade de emoções */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
              {EMOTIONS.map((em) => {
                const active = selectedEmotion?.label === em.label;
                return (
                  <button
                    key={em.label}
                    onClick={() => handleSelectEmotion(em)}
                    className={`relative flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 px-1.5 sm:px-2 rounded-2xl border-2 transition-all duration-300 active:scale-95 touch-manipulation select-none overflow-hidden group ${
                      active
                        ? "shadow-lg scale-105"
                        : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md"
                    }`}
                    style={
                      active
                        ? { borderColor: em.border, backgroundColor: em.bg }
                        : {}
                    }
                  >
                    {/* Background glow no hover */}
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none ${
                        active ? "opacity-100" : ""
                      }`}
                      style={{
                        background: `radial-gradient(circle at center, ${em.color}15 0%, transparent 70%)`,
                      }}
                    />

                    <span className="relative text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110">
                      {em.emoji}
                    </span>
                    <span
                      className="relative text-[10px] sm:text-[11px] font-semibold leading-tight text-center"
                      style={{ color: active ? em.color : "#6B7280" }}
                    >
                      {em.label}
                    </span>

                    {/* Indicador de selecionado */}
                    {active && (
                      <div
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm animate-in zoom-in duration-200"
                        style={{ backgroundColor: em.color }}
                      >
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── SLIDER DE INTENSIDADE (Mood Ring) ──────── */}
            {selectedEmotion && (
              <div
                className={`mb-4 transition-all duration-500 ${
                  showSlider
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2"
                }`}
              >
                {/* Cabeçalho com emoji animado */}
                <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                  {/* Emoji grande que muda */}
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner transition-all duration-300 relative overflow-hidden flex-shrink-0"
                    style={{
                      backgroundColor: intensityColor + "25",
                      border: `2px solid ${intensityColor}40`,
                    }}
                  >
                    <span className="transition-all duration-300 scale-100 animate-in zoom-in">
                      {currentMoodEmoji}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-sm font-semibold transition-colors duration-300"
                        style={{ color: intensityColor }}
                      >
                        {selectedEmotion.label}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-300 whitespace-nowrap"
                        style={{
                          backgroundColor: intensityColor + "20",
                          color: intensityColor,
                        }}
                      >
                        {intensity}/10
                      </span>
                    </div>
                    <p
                      className="text-xs transition-colors duration-300 mt-0.5"
                      style={{ color: intensityColor + "99" }}
                    >
                      {INTENSITY_LABELS[intensity]}
                    </p>
                  </div>
                </div>

                {/* Labels */}
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Arraste para ajustar a intensidade
                  </label>
                </div>

                {/* TRACK DO SLIDER — DESIGN PREMIUM */}
                <div
                  ref={sliderRef}
                  className="relative h-14 sm:h-16 rounded-2xl cursor-pointer touch-none select-none overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-inner transition-shadow duration-300 hover:shadow-md"
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  onClick={handleTrackClick}
                  role="slider"
                  aria-valuemin={1}
                  aria-valuemax={10}
                  aria-valuenow={intensity}
                  aria-label={`Intensidade: ${intensity} de 10 — ${INTENSITY_LABELS[intensity]}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                      e.preventDefault();
                      setIntensity((prev) => Math.min(10, prev + 1));
                    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                      e.preventDefault();
                      setIntensity((prev) => Math.max(1, prev - 1));
                    }
                  }}
                >
                  {/* Gradiente de fundo — mood spectrum */}
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to right, ${selectedEmotion.gradient[0]}, ${selectedEmotion.gradient[1]}, ${selectedEmotion.gradient[2]})`,
                      opacity: 0.12,
                    }}
                  />

                  {/* Barra preenchida com gradiente */}
                  <div
                    className="absolute inset-y-1 left-1 rounded-xl transition-all duration-200 ease-out"
                    style={{
                      width: `calc(${fillPct}% - 4px)`,
                      background: `linear-gradient(to right, ${selectedEmotion.gradient[0]}, ${selectedEmotion.gradient[1]}, ${intensityColor})`,
                      opacity: 0.5,
                      boxShadow: `0 0 20px ${intensityColor}30`,
                    }}
                  />

                  {/* Particulas/glow no thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-200 ease-out pointer-events-none"
                    style={{
                      left: `${fillPct}%`,
                    }}
                  >
                    {/* Glow ring */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full animate-pulse pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${intensityColor}30 0%, transparent 70%)`,
                      }}
                    />
                  </div>

                  {/* Marcas de referência 1-10 */}
                  <div className="absolute inset-0 flex items-end justify-between px-2 pb-2 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <div key={n} className="flex flex-col items-center gap-0.5">
                        <div
                          className={`w-0.5 rounded-full transition-all duration-300 ${
                            n <= intensity
                              ? "opacity-0"
                              : "bg-gray-300/60 dark:bg-gray-600/60"
                          }`}
                          style={{ height: "12px" }}
                        />
                        <span
                          className={`text-[9px] font-medium leading-none transition-all duration-300 ${
                            n === intensity
                              ? "opacity-0"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {n}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bolinha (thumb) — premium design */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all duration-200 ease-out pointer-events-none z-10"
                    style={{
                      left: `${fillPct}%`,
                      background: `linear-gradient(135deg, ${intensityColor}, ${intensityColor}dd)`,
                      boxShadow: `0 0 0 4px ${intensityColor}30, 0 4px 16px ${intensityColor}50, 0 2px 4px rgba(0,0,0,0.15)`,
                    }}
                  >
                    {/* Mini emoji dentro da bolinha */}
                    <span className="text-sm sm:text-base leading-none">
                      {currentMoodEmoji}
                    </span>
                  </div>

                  {/* Tooltip flutuante acima do thumb */}
                  <div
                    className="absolute -top-9 -translate-x-1/2 pointer-events-none transition-all duration-200 ease-out z-20"
                    style={{
                      left: `${fillPct}%`,
                      opacity: dragging.current ? 1 : 0.85,
                    }}
                  >
                    <div
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white shadow-lg whitespace-nowrap"
                      style={{
                        backgroundColor: intensityColor,
                        boxShadow: `0 4px 12px ${intensityColor}50`,
                      }}
                    >
                      {INTENSITY_LABELS[intensity]} • {intensity}/10
                    </div>
                    {/* Seta do tooltip */}
                    <div
                      className="w-2 h-2 mx-auto -mt-px rotate-45"
                      style={{ backgroundColor: intensityColor }}
                    />
                  </div>
                </div>

                {/* Labels extremos com emojis */}
                <div className="flex justify-between mt-2 px-1">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                    <span className="text-sm">🌱</span>
                    <span>Pouco intenso</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                    <span>Muito intenso</span>
                    <span className="text-sm">🔥</span>
                  </div>
                </div>
              </div>
            )}

            {/* Nota opcional */}
            {selectedEmotion && (
              <div
                className={`mb-4 transition-all duration-500 delay-75 ${
                  showSlider
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2"
                }`}
              >
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Quer adicionar uma nota?{" "}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">
                    (opcional)
                  </span>
                </label>
                <textarea
                  value={emotionNote}
                  onChange={(e) => setEmotionNote(e.target.value)}
                  placeholder={`O que está te deixando ${selectedEmotion.label.toLowerCase()}?`}
                  rows={2}
                  maxLength={200}
                  className={`${inputClass} resize-none`}
                />
                <p className="text-right text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {emotionNote.length}/200
                </p>
              </div>
            )}

            {/* Botão salvar */}
            <button
              onClick={handleSaveEmotion}
              disabled={!selectedEmotion || savingEmotion}
              className="w-full py-3 rounded-xl bg-green-700 dark:bg-green-700 text-white text-sm font-medium transition-all duration-300 hover:bg-green-800 dark:hover:bg-green-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation hover:shadow-lg hover:shadow-green-700/20"
            >
              {savingEmotion ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Salvando...
                </span>
              ) : emotionSaved ? (
                <span className="flex items-center justify-center gap-2">
                  ✓ Registrado!
                </span>
              ) : (
                "Registrar emoção"
              )}
            </button>

            {/* Aviso de privacidade */}
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Dados privados — vinculados apenas à sua conta
            </p>
          </div>

          {/* Histórico */}
          {recentEmotions.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Registros recentes
              </p>
              <div className="flex flex-col gap-2">
                {recentEmotions.map((em) => (
                  <div
                    key={em.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        backgroundColor: getIntensityColor(em.intensity) + "18",
                      }}
                    >
                      {em.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {em.label}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {em.date}
                        </span>
                      </div>

                      {/* Barra de intensidade no histórico */}
                      {em.intensity != null && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${((em.intensity - 1) / 9) * 100}%`,
                                backgroundColor: getIntensityColor(em.intensity),
                                boxShadow: `0 0 8px ${getIntensityColor(em.intensity)}40`,
                              }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-bold whitespace-nowrap"
                            style={{ color: getIntensityColor(em.intensity) }}
                          >
                            {em.intensity}/10
                          </span>
                        </div>
                      )}

                      {em.note && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                          {em.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA ROTINA ──────────────────────────────── */}
      {tab === "rotina" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Configure sua rotina
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            Usamos esses dados para sugerir pausas e lembretes personalizados.
          </p>

          {/* Avisos de validação */}
          {validationIssues.length > 0 && (
            <div className="mb-5 flex flex-col gap-2">
              {validationIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex gap-3 items-start ${
                    issue.type === "warning"
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900"
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {issue.icon}
                  </span>
                  <p
                    className={`text-xs leading-relaxed ${
                      issue.type === "warning"
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-blue-800 dark:text-blue-300"
                    }`}
                  >
                    {issue.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSaveRoutine} className="flex flex-col gap-5">
            {/* Objetivo do dia */}
            <div>
              <label className={labelClass}>🎯 Objetivo de hoje</label>
              <input
                type="text"
                name="objetivo"
                value={routine.objetivo}
                onChange={handleRoutineChange}
                placeholder="Ex: Terminar o módulo 3 do curso..."
                className={inputClass}
                maxLength={100}
              />
            </div>

            {/* Sono */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                😴 Sono
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Acordar</label>
                  <input
                    type="time"
                    name="wakeUp"
                    value={routine.wakeUp}
                    onChange={handleRoutineChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Dormir</label>
                  <input
                    type="time"
                    name="sleep"
                    value={routine.sleep}
                    onChange={handleRoutineChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Trabalho */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                💻 Trabalho / Estudo
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Horas por dia</label>
                  <select
                    name="workHours"
                    value={routine.workHours}
                    onChange={handleRoutineChange}
                    className={selectClass}
                  >
                    {["2", "3", "4", "5", "6", "7", "8", "9", "10", "12"].map(
                      (h) => (
                        <option key={h} value={h}>
                          {h}h
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Pausa a cada (min)</label>
                  <select
                    name="breakMinutes"
                    value={routine.breakMinutes}
                    onChange={handleRoutineChange}
                    className={selectClass}
                  >
                    {["10", "15", "20", "25", "30", "45", "60"].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Saúde */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                🏃 Saúde
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Exercício (min/dia)</label>
                  <select
                    name="exerciseMin"
                    value={routine.exerciseMin}
                    onChange={handleRoutineChange}
                    className={selectClass}
                  >
                    {["0", "15", "20", "30", "45", "60", "90"].map((m) => (
                      <option key={m} value={m}>
                        {m === "0" ? "Nenhum" : `${m} min`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Limite de tela</label>
                  <select
                    name="screenLimit"
                    value={routine.screenLimit}
                    onChange={handleRoutineChange}
                    className={selectClass}
                  >
                    {["60", "90", "120", "150", "180", "240", "300"].map(
                      (m) => (
                        <option key={m} value={m}>
                          {Math.floor(Number(m) / 60)}h
                          {Number(m) % 60 ? ` ${Number(m) % 60}min` : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Botão salvar */}
            <button
              type="submit"
              disabled={savingRoutine}
              className="w-full py-3 rounded-xl bg-green-700 dark:bg-green-700 text-white text-sm font-medium transition-all duration-300 hover:bg-green-800 dark:hover:bg-green-600 active:scale-[0.98] disabled:opacity-60 touch-manipulation hover:shadow-lg hover:shadow-green-700/20"
            >
              {savingRoutine ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Salvando...
                </span>
              ) : routineSaved ? (
                "✓ Rotina salva!"
              ) : (
                "Salvar rotina"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}