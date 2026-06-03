"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { loadStreak, updateStreak, completeFocusSession, getMascotLevel, calculateWeeklyConsistency } from "@/lib/streak";
import FocusTimer from "@/components/FocusTimer";
import Mascot from "@/components/Mascot";
import { loadRoutine } from "@/lib/bemEstar";

function getMinutesUntilTime(time) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target < now) target.setDate(target.getDate() + 1);

  return Math.round((target - now) / 60000);
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router   = useRouter();

  const [streakCount,       setStreakCount]       = useState(0);
  const [longestStreak,     setLongestStreak]     = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [dailyFocusMinutes, setDailyFocusMinutes] = useState(0);
  const [routine,           setRoutine]           = useState(null);
  const [isTimerRunning,    setIsTimerRunning]    = useState(false);
  const [dataLoading,       setDataLoading]       = useState(true);
  const [toast,             setToast]             = useState(null);
  const [weeklyConsistency, setWeeklyConsistency] = useState({ weeklyScore: 0, trend: "neutral", advice: "" });

  // ── Proteção de rota + carga inicial ──────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    async function init() {
      try {
        // updateStreak para acesso diário
        const { streakCount: sc, longestStreak: ls } = await updateStreak(user.uid);
        const [{ totalFocusMinutes: tfm, dailyFocusMinutes: dfm }, savedRoutine] =
          await Promise.all([
            loadStreak(user.uid),
            loadRoutine(user.uid),
          ]);

        setStreakCount(sc);
        setLongestStreak(ls);
        setTotalFocusMinutes(tfm);
        setDailyFocusMinutes(dfm);
        setRoutine(savedRoutine);

        // ── RN-CONSIST-01: Carregar consistência semanal ──
        if (savedRoutine) {
          const consistency = await calculateWeeklyConsistency(user.uid, savedRoutine);
          setWeeklyConsistency(consistency);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setDataLoading(false);
      }
    }

    init();
  }, [user, loading, router]);

  // ── Callback do FocusTimer: grava sessão no Firestore ─────
  //
  // Como o useEffect do cronômetro dispara a gravação segura:
  //   1. Quando timeLeft chega a 0, o useEffect do FocusTimer
  //      chama handleSessionEnd() internamente.
  //   2. handleSessionEnd() chama onSessionComplete() passando
  //      os minutos focados e o número da sessão.
  //   3. Aqui, chamamos completeFocusSession(user.uid, minutes)
  //      que lê o Firestore, verifica lastFocusDate e grava
  //      com o uid do usuário — nunca confunde contas.
  //
  async function handleSessionComplete(minutesFocused, sessionCount) {
    if (!user) return;
    try {
      const { streakCount: sc, longestStreak: ls, dailyFocusMinutes: dfm } =
        await completeFocusSession(user.uid, minutesFocused);

      setStreakCount(sc);
      setLongestStreak(ls);
      setTotalFocusMinutes((prev) => prev + minutesFocused);
      setDailyFocusMinutes(dfm);

      if (sessionCount % 4 === 0) {
        showToast("4 sessões! Hora de uma pausa longa 🎉", "success");
      } else {
        showToast(`Sessão ${sessionCount} concluída! +${minutesFocused} min ⏱`, "info");
      }
    } catch (err) {
      console.error("Erro ao salvar sessão:", err);
    }
  }

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-green-700 dark:border-green-600 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const mascotLevel = getMascotLevel(streakCount);
  const dailyGoalHours = Number(routine?.workHours ?? 8);
  const dailyGoalMinutes = Math.max(1, Math.round(dailyGoalHours * 60));
  const dailyProgress = Math.min(100, Math.round((dailyFocusMinutes / dailyGoalMinutes) * 100));
  const overworkReached = dailyFocusMinutes >= dailyGoalMinutes;
  const minutesUntilSleep = getMinutesUntilTime(routine?.sleep);
  const showSleepReminder = minutesUntilSleep !== null && minutesUntilSleep >= 0 && minutesUntilSleep <= 30;
  const formatMinutes = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h <= 0) return `${m}m`;
    return `${h}h ${m}m`;
  };
  const firstName   = user?.displayName?.split(" ")[0] ?? "você";

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-md text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-green-700 dark:bg-green-800 text-white" : "bg-gray-800 dark:bg-gray-900 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 pb-24">

        {/* Lembrete de dormir baseado no horario salvo na rotina. */}
        {showSleepReminder && (
          <div className="bg-gray-800 dark:bg-gray-800 text-white border border-gray-700 dark:border-gray-700 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">🌙</span>
            <p className="text-sm leading-relaxed">
              Hora de desacelerar! O Flowise sugere que você comece a se preparar para dormir.
            </p>
          </div>
        )}

        {/* Saudação */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Hora de focar 🎯</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Complete um ciclo de 25 minutos para manter sua ofensiva.
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Ofensiva",   value: `${streakCount}d`,                   icon: "🔥" },
            { label: "Recorde",    value: `${longestStreak}d`,                  icon: "🏆" },
            { label: "Foco total", value: `${Math.round(totalFocusMinutes)}m`,  icon: "⏱"  },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex flex-col items-center gap-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">{stat.value}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ── Timer + Mascote lado a lado ───────────────────── */}
        {/* Progresso diario conectado as metas da rotina no Firestore. */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Progresso diário de foco</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {formatMinutes(dailyFocusMinutes)} de {formatMinutes(dailyGoalMinutes)} planejados na sua rotina.
              </p>
            </div>
            <span className="text-sm font-bold text-green-700 dark:text-green-500">{dailyProgress}%</span>
          </div>

          <div className="h-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-green-700 dark:bg-green-600 rounded-full transition-all duration-700"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2">
            <span>Hoje</span>
            <span>Meta saudável</span>
          </div>
        </div>

        {/* Alerta amigavel quando a meta saudavel ja foi atingida. */}
        {overworkReached && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">\u26a0\ufe0f</span>
            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
              Você atingiu sua meta saudável de foco por hoje! Que tal descansar para evitar a exaustão mental?
            </p>
          </div>
        )}

        {/* ── RN-CONSIST-01: Card de consistência semanal ── */}
        {weeklyConsistency.weeklyScore > 0 && (
          <div className="bg-gradient-to-br from-[#F0F9FF] to-white rounded-xl border border-[#D1E0FF] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">Consistência da semana</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Aderência à sua rotina</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-2xl font-bold text-[#2D6A4F]">{weeklyConsistency.weeklyScore}%</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  weeklyConsistency.trend === "up" ? "bg-emerald-100 text-emerald-700" :
                  weeklyConsistency.trend === "down" ? "bg-red-100 text-red-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {weeklyConsistency.trend === "up" ? "↑ Em alta" : 
                   weeklyConsistency.trend === "down" ? "↓ Em queda" : 
                   "→ Estável"}
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  weeklyConsistency.weeklyScore >= 80 ? "bg-emerald-500" :
                  weeklyConsistency.weeklyScore >= 60 ? "bg-blue-500" :
                  "bg-amber-500"
                }`}
                style={{ width: `${weeklyConsistency.weeklyScore}%` }}
              />
            </div>
            <p className="text-xs text-[#6B7280] mt-3 leading-relaxed">{weeklyConsistency.advice}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Timer — ocupa toda a largura no mobile, metade no desktop */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center">
            <FocusTimer
              onSessionComplete={handleSessionComplete}
              onRunningChange={setIsTimerRunning}
            />
          </div>

          {/* Mascote */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center">
            <Mascot
              level={mascotLevel}
              streakCount={streakCount}
              isTimerRunning={isTimerRunning}
            />
          </div>
        </div>

        {/* Dica de ofensiva */}
        {streakCount < 3 && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Dica de ofensiva</p>
              <p className="text-xs text-amber-900 dark:text-amber-200 mt-0.5 leading-relaxed">
                Complete sessões por mais {3 - streakCount}{" "}
                {3 - streakCount === 1 ? "dia" : "dias"} seguidos para evoluir
                seu bichinho e ganhar recompensas extras!
              </p>
            </div>
          </div>
        )}


      </main>
    </>
  );
}
