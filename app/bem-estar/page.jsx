"use client";

import { useState, useEffect } from "react";
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
  { emoji: "😊", label: "Feliz",      color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7" },
  { emoji: "😌", label: "Calmo",      color: "#3b82f6", bg: "#eff6ff", border: "#93c5fd" },
  { emoji: "🧘", label: "Focado",     color: "#8b5cf6", bg: "#f5f3ff", border: "#c4b5fd" },
  { emoji: "😰", label: "Estressado", color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d" },
  { emoji: "😴", label: "Cansado",    color: "#6b7280", bg: "#f9fafb", border: "#d1d5db" },
  { emoji: "😤", label: "Frustrado",  color: "#ef4444", bg: "#fef2f2", border: "#fca5a5" },
];

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

export default function BemEstarPage() {
  const { user, loading } = useAuth();
  const router   = useRouter();

  const [tab,           setTab]           = useState("emocoes");
  const [pageLoading,   setPageLoading]   = useState(true);

  // ── Estado: emoções ───────────────────────────────────
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [emotionNote,     setEmotionNote]     = useState("");
  const [savingEmotion,   setSavingEmotion]   = useState(false);
  const [emotionSaved,    setEmotionSaved]    = useState(false);
  const [recentEmotions,  setRecentEmotions]  = useState([]);

  // ── Estado: rotina ────────────────────────────────────
  const [routine,       setRoutine]       = useState(ROUTINE_DEFAULT);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [routineSaved,  setRoutineSaved]  = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);

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
  }, [user, loading]);

  // ── RF-07: registrar emoção no Firestore ──────────────
  async function handleSaveEmotion() {
    if (!selectedEmotion || !user) return;
    setSavingEmotion(true);
    try {
      await saveEmotion(user.uid, {
        emoji: selectedEmotion.emoji,
        label: selectedEmotion.label,
        note:  emotionNote.trim(),
      });

      // Adiciona ao topo da lista local sem recarregar
      setRecentEmotions((prev) => [
        {
          id:    Date.now().toString(),
          emoji: selectedEmotion.emoji,
          label: selectedEmotion.label,
          note:  emotionNote.trim(),
          date:  new Date().toISOString().split("T")[0],
        },
        ...prev.slice(0, 9),
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
    
    // ── RN-VALID-01: Validar rotina antes de salvar ──
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
      <div className="flex items-center justify-center flex-1">
        <div className="w-8 h-8 rounded-full border-2 border-green-700 dark:border-green-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 transition";
  const selectClass = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 transition";
  const labelClass = "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <>
      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Título */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Bem-estar 🌿</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Como você está hoje?</p>
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
                Como você está se sentindo agora?
              </p>

              {/* Grade de emoções */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {EMOTIONS.map((em) => {
                  const active = selectedEmotion?.label === em.label;
                  return (
                    <button
                      key={em.label}
                      onClick={() => setSelectedEmotion(active ? null : em)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all active:scale-95 ${
                        active ? "shadow-sm scale-105" : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                      style={active ? { borderColor: em.border, backgroundColor: em.bg } : {}}
                    >
                      <span className="text-2xl">{em.emoji}</span>
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: active ? em.color : "#6B7280" }}
                      >
                        {em.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Nota opcional */}
              {selectedEmotion && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Quer adicionar uma nota?{" "}
                    <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
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
                className="w-full py-3 rounded-xl bg-green-700 dark:bg-green-700 text-white text-sm font-medium transition hover:bg-green-800 dark:hover:bg-green-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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

              {/* Aviso de privacidade */}
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Dados privados — vinculados apenas à sua conta
              </p>
            </div>

            {/* Histórico */}
            {recentEmotions.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                  Registros recentes
                </p>
                <div className="flex flex-col gap-2">
                  {recentEmotions.map((em) => (
                    <div
                      key={em.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800"
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">{em.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{em.label}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{em.date}</span>
                        </div>
                        {em.note && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{em.note}</p>
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
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Configure sua rotina</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
              Usamos esses dados para sugerir pausas e lembretes personalizados.
            </p>

            {/* ── RN-VALID-01: Avisos de validação ── */}
            {validationIssues.length > 0 && (
              <div className="mb-5 flex flex-col gap-2">
                {validationIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex gap-3 items-start ${
                      issue.type === "warning"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">{issue.icon}</span>
                    <p
                      className={`text-xs leading-relaxed ${
                        issue.type === "warning" ? "text-amber-800" : "text-blue-800"
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
                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2.5">
                  😴 Sono
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Acordar</label>
                    <input type="time" name="wakeUp" value={routine.wakeUp} onChange={handleRoutineChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Dormir</label>
                    <input type="time" name="sleep" value={routine.sleep} onChange={handleRoutineChange} className={inputClass} />
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
                    <label className={labelClass}>Horas por dia</label>
                    <select name="workHours" value={routine.workHours} onChange={handleRoutineChange} className={selectClass}>
                      {["2","3","4","5","6","7","8","9","10","12"].map((h) => (
                        <option key={h} value={h}>{h}h</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Pausa a cada (min)</label>
                    <select name="breakMinutes" value={routine.breakMinutes} onChange={handleRoutineChange} className={selectClass}>
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
                    <label className={labelClass}>Exercício (min/dia)</label>
                    <select name="exerciseMin" value={routine.exerciseMin} onChange={handleRoutineChange} className={selectClass}>
                      {["0","15","20","30","45","60","90"].map((m) => (
                        <option key={m} value={m}>{m === "0" ? "Nenhum" : `${m} min`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Limite de tela</label>
                    <select name="screenLimit" value={routine.screenLimit} onChange={handleRoutineChange} className={selectClass}>
                      {["60","90","120","150","180","240","300"].map((m) => (
                        <option key={m} value={m}>
                          {Math.floor(Number(m) / 60)}h{Number(m) % 60 ? ` ${Number(m) % 60}min` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Botão salvar */}
              <button
                type="submit"
                disabled={savingRoutine}
                className="w-full py-3 rounded-xl bg-[#2D6A4F] text-white text-sm font-medium transition hover:bg-[#245C44] active:scale-[0.98] disabled:opacity-60"
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
    </>
  );
}
