"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  saveEmotion,
  loadRecentEmotions,
  saveRoutine,
  loadRoutine,
} from "@/lib/bemEstar";

// ── RF-07: opções de emoção ───────────────────────────────
const EMOTIONS = [
  { emoji: "😊", label: "Feliz",       color: "#2D6A4F", bg: "#E8F5EF", border: "#B7DFC9" },
  { emoji: "😌", label: "Calmo",       color: "#1E6091", bg: "#EBF5FB", border: "#A9CCE3" },
  { emoji: "🧘", label: "Focado",      color: "#6B3FA0", bg: "#F5EEF8", border: "#D2B4DE" },
  { emoji: "😰", label: "Estressado",  color: "#B7770D", bg: "#FEF9E7", border: "#F9E79F" },
  { emoji: "😴", label: "Cansado",     color: "#717D7E", bg: "#F2F3F4", border: "#CCD1D1" },
  { emoji: "😤", label: "Frustrado",   color: "#A93226", bg: "#FDEDEC", border: "#F1948A" },
];

// ── RF-04: campos da rotina ───────────────────────────────
const ROUTINE_DEFAULT = {
  wakeUp:        "07:00",
  sleep:         "23:00",
  workHours:     "8",
  breakMinutes:  "15",
  exerciseMin:   "30",
  screenLimit:   "120",
};

export default function BemEstarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ── Estado geral ──────────────────────────────────────
  const [tab, setTab] = useState("emocoes"); // "emocoes" | "rotina"
  const [pageLoading, setPageLoading] = useState(true);

  // ── Estado: emoções ───────────────────────────────────
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [emotionNote, setEmotionNote] = useState("");
  const [savingEmotion, setSavingEmotion] = useState(false);
  const [recentEmotions, setRecentEmotions] = useState([]);
  const [emotionSaved, setEmotionSaved] = useState(false);

  // ── Estado: rotina ────────────────────────────────────
  const [routine, setRoutine] = useState(ROUTINE_DEFAULT);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [routineSaved, setRoutineSaved] = useState(false);

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
        if (savedRoutine) {
          setRoutine((prev) => ({ ...prev, ...savedRoutine }));
        }
      } catch (err) {
        console.error("Erro ao carregar bem-estar:", err);
      } finally {
        setPageLoading(false);
      }
    }

    init();
  }, [user, loading]);

  // ── RF-07: salvar emoção ──────────────────────────────
  async function handleSaveEmotion() {
    if (!selectedEmotion || !user) return;
    setSavingEmotion(true);
    try {
      await saveEmotion(user.uid, {
        emoji: selectedEmotion.emoji,
        label: selectedEmotion.label,
        note:  emotionNote.trim(),
      });
      // Atualiza lista local sem recarregar do Firestore
      setRecentEmotions((prev) => [
        {
          id: Date.now().toString(),
          emoji: selectedEmotion.emoji,
          label: selectedEmotion.label,
          note:  emotionNote.trim(),
          date:  new Date().toISOString().split("T")[0],
        },
        ...prev.slice(0, 6),
      ]);
      setSelectedEmotion(null);
      setEmotionNote("");
      setEmotionSaved(true);
      setTimeout(() => setEmotionSaved(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar emoção:", err);
    } finally {
      setSavingEmotion(false);
    }
  }

  // ── RF-04: salvar rotina ──────────────────────────────
  async function handleSaveRoutine(e) {
    e.preventDefault();
    if (!user) return;
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
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#2D6A4F] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" fill="white" opacity=".3"/>
              <circle cx="12" cy="12" r="6" fill="white" opacity=".6"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          </Link>
          <span className="font-semibold text-[#1A1A2E] text-sm">Flowise</span>
        </div>
        <Link href="/dashboard" className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Dashboard
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Título */}
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Bem-estar 🌿</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Como você está hoje?</p>
        </div>

        {/* Abas */}
        <div className="flex gap-1 p-1 rounded-xl bg-white border border-[#E8E4DC]">
          {[
            { key: "emocoes", label: "😌 Emoções" },
            { key: "rotina",  label: "📋 Rotina"  },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-[#2D6A4F] text-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#374151]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ABA EMOÇÕES — RF-07 ─────────────────────── */}
        {tab === "emocoes" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
              <p className="text-sm font-medium text-[#374151] mb-4">
                Como você está se sentindo agora?
              </p>

              {/* Grade de emoções */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {EMOTIONS.map((em) => (
                  <button
                    key={em.label}
                    onClick={() => setSelectedEmotion(
                      selectedEmotion?.label === em.label ? null : em
                    )}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all active:scale-95 ${
                      selectedEmotion?.label === em.label
                        ? "shadow-sm scale-105"
                        : "border-[#E8E4DC] bg-[#FAFAF8] hover:border-[#D1CBC0]"
                    }`}
                    style={
                      selectedEmotion?.label === em.label
                        ? { borderColor: em.border, backgroundColor: em.bg }
                        : {}
                    }
                  >
                    <span className="text-2xl">{em.emoji}</span>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: selectedEmotion?.label === em.label ? em.color : "#6B7280" }}
                    >
                      {em.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Nota opcional */}
              {selectedEmotion && (
                <div className="mb-4 animate-in fade-in duration-200">
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Quer adicionar uma nota? <span className="text-[#9CA3AF] font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={emotionNote}
                    onChange={(e) => setEmotionNote(e.target.value)}
                    placeholder={`O que está deixando você ${selectedEmotion.label.toLowerCase()}?`}
                    rows={2}
                    maxLength={200}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-[#1A1A2E] placeholder-[#9CA3AF] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                  />
                  <p className="text-right text-[10px] text-[#9CA3AF] mt-1">{emotionNote.length}/200</p>
                </div>
              )}

              {/* Botão salvar */}
              <button
                onClick={handleSaveEmotion}
                disabled={!selectedEmotion || savingEmotion}
                className="w-full py-3 rounded-xl bg-[#2D6A4F] text-white text-sm font-medium transition hover:bg-[#245C44] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingEmotion ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Salvando...
                  </span>
                ) : emotionSaved ? "✓ Registrado!" : "Registrar emoção"}
              </button>

              {/* RN-06: aviso de privacidade */}
              <p className="text-[10px] text-[#9CA3AF] text-center mt-3 flex items-center justify-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Seus dados emocionais são privados e vinculados apenas à sua conta
              </p>
            </div>

            {/* Histórico recente */}
            {recentEmotions.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
                  Registros recentes
                </p>
                <div className="flex flex-col gap-2">
                  {recentEmotions.map((em) => (
                    <div
                      key={em.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E4DC]"
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">{em.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-[#374151]">{em.label}</span>
                          <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">{em.date}</span>
                        </div>
                        {em.note && (
                          <p className="text-xs text-[#6B7280] mt-0.5 truncate">{em.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ABA ROTINA — RF-04 ──────────────────────── */}
        {tab === "rotina" && (
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
            <p className="text-sm font-medium text-[#374151] mb-1">Configure sua rotina</p>
            <p className="text-xs text-[#9CA3AF] mb-5">
              Usamos esses dados para sugerir pausas e lembretes personalizados.
            </p>

            <form onSubmit={handleSaveRoutine} className="flex flex-col gap-4">
              {/* Sono */}
              <div>
                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2.5">
                  😴 Sono
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">
                      Acordar
                    </label>
                    <input
                      type="time"
                      name="wakeUp"
                      value={routine.wakeUp}
                      onChange={handleRoutineChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-[#1A1A2E] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">
                      Dormir
                    </label>
                    <input
                      type="time"
                      name="sleep"
                      value={routine.sleep}
                      onChange={handleRoutineChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-[#1A1A2E] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Trabalho */}
              <div>
                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2.5">
                  💻 Trabalho / Estudo
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">
                      Horas por dia
                    </label>
                    <select
                      name="workHours"
                      value={routine.workHours}
                      onChange={handleRoutineChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-[#1A1A2E] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                    >
                      {["2","3","4","5","6","7","8","9","10","12"].map((h) => (
                        <option key={h} value={h}>{h}h</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">
                      Pausa a cada (min)
                    </label>
                    <select
                      name="breakMinutes"
                      value={routine.breakMinutes}
                      onChange={handleRoutineChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-[#1A1A2E] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                    >
                      {["10","15","20","25","30","45","60"].map((m) => (
                        <option key={m} value={m}>{m} min</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Saúde */}
              <div>
                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2.5">
                  🏃 Saúde
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">
                      Exercício (min/dia)
                    </label>
                    <select
                      name="exerciseMin"
                      value={routine.exerciseMin}
                      onChange={handleRoutineChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-[#1A1A2E] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                    >
                      {["0","15","20","30","45","60","90"].map((m) => (
                        <option key={m} value={m}>{m === "0" ? "Nenhum" : `${m} min`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">
                      Limite de tela (min)
                    </label>
                    <select
                      name="screenLimit"
                      value={routine.screenLimit}
                      onChange={handleRoutineChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-[#1A1A2E] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                    >
                      {["60","90","120","150","180","240","300"].map((m) => (
                        <option key={m} value={m}>{Math.floor(Number(m)/60)}h{Number(m)%60 ? ` ${Number(m)%60}min` : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Botão salvar */}
              <button
                type="submit"
                disabled={savingRoutine}
                className="w-full py-3 rounded-xl bg-[#2D6A4F] text-white text-sm font-medium transition hover:bg-[#245C44] active:scale-[0.98] disabled:opacity-60 mt-1"
              >
                {savingRoutine ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Salvando...
                  </span>
                ) : routineSaved ? "✓ Rotina salva!" : "Salvar rotina"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Nav inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DC] flex justify-around items-center py-2 px-4">
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-[#9CA3AF] hover:text-[#2D6A4F] transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-[10px]">Início</span>
        </Link>
        <Link href="/bem-estar" className="flex flex-col items-center gap-0.5 text-[#2D6A4F]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="text-[10px] font-medium">Bem-estar</span>
        </Link>
      </nav>

      {/* Espaço para não sobrepor nav */}
      <div className="h-16" />
    </div>
  );
}
