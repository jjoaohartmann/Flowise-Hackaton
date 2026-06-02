"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { loadStreak, updateStreak, completeFocusSession, getMascotLevel, calculateWeeklyConsistency } from "@/lib/streak";
import FocusTimer from "@/components/FocusTimer";
import Mascot from "@/components/Mascot";
import { logout } from "@/lib/auth";
import { usePlan } from "@/lib/usePlan";
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
  const { isPro }         = usePlan();
  const router   = useRouter();
  const pathname = usePathname();

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
  }, [user, loading]);

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

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#2D6A4F] border-t-transparent animate-spin" />
          <p className="text-sm text-[#9CA3AF]">Carregando...</p>
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
    <div className="min-h-screen bg-[#F7F5F0]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-md text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-[#2D6A4F] text-white" : "bg-[#1A1A2E] text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" fill="white" opacity=".3"/>
              <circle cx="12" cy="12" r="6" fill="white" opacity=".6"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          </div>
          <span className="font-semibold text-[#1A1A2E] text-sm">Flowise</span>
          <span className="text-[10px] border border-[#E8E4DC] text-[#9CA3AF] px-2 py-0.5 rounded-full">beta</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9CA3AF] hidden sm:block truncate max-w-[160px]">
            {user?.email}
          </span>
          <Link href="/planos" className={`text-xs font-semibold rounded-full px-3 py-1 border transition-colors ${
            isPro
              ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
              : "text-[#6B7280] border-[#E8E4DC] hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
          }`}>
            {isPro ? "✓ Pro" : "Upgrade Pro ✨"}
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition font-medium"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 pb-24">

        {/* Lembrete de dormir baseado no horario salvo na rotina. */}
        {showSleepReminder && (
          <div className="bg-[#1A1A2E] text-white border border-[#1A1A2E] rounded-xl p-4 flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">🌙</span>
            <p className="text-sm leading-relaxed">
              Hora de desacelerar! O Flowise sugere que você comece a se preparar para dormir.
            </p>
          </div>
        )}

        {/* Saudação */}
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Hora de focar 🎯</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
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
            <div key={stat.label} className="bg-white rounded-xl border border-[#E8E4DC] p-3 flex flex-col items-center gap-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-base font-semibold text-[#1A1A2E]">{stat.value}</span>
              <span className="text-[10px] text-[#9CA3AF]">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ── Timer + Mascote lado a lado ───────────────────── */}
        {/* Progresso diario conectado as metas da rotina no Firestore. */}
        <div className="bg-white rounded-xl border border-[#E8E4DC] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#1A1A2E]">Progresso diário de foco</p>
              <p className="text-xs text-[#6B7280] mt-1">
                {formatMinutes(dailyFocusMinutes)} de {formatMinutes(dailyGoalMinutes)} planejados na sua rotina.
              </p>
            </div>
            <span className="text-sm font-bold text-[#2D6A4F]">{dailyProgress}%</span>
          </div>

          <div className="h-3 bg-[#F7F5F0] border border-[#E8E4DC] rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-[#2D6A4F] rounded-full transition-all duration-700"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-[#9CA3AF] mt-2">
            <span>Hoje</span>
            <span>Meta saudável</span>
          </div>
        </div>

        {/* Alerta amigavel quando a meta saudavel ja foi atingida. */}
        {overworkReached && (
          <div className="bg-[#FFF8E6] border border-[#FFE0A0] rounded-xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <p className="text-sm text-[#92400E] leading-relaxed">
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
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6 flex flex-col items-center">
            <FocusTimer
              onSessionComplete={handleSessionComplete}
              onRunningChange={setIsTimerRunning}
            />
          </div>

          {/* Mascote */}
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6 flex flex-col items-center justify-center">
            <Mascot
              level={mascotLevel}
              streakCount={streakCount}
              isTimerRunning={isTimerRunning}
            />
          </div>
        </div>

        {/* Dica de ofensiva */}
        {streakCount < 3 && (
          <div className="bg-[#FFF8E6] border border-[#FFE0A0] rounded-xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-medium text-[#B45309]">Dica de ofensiva</p>
              <p className="text-xs text-[#92400E] mt-0.5 leading-relaxed">
                Complete sessões por mais {3 - streakCount}{" "}
                {3 - streakCount === 1 ? "dia" : "dias"} seguidos para evoluir
                seu bichinho e ganhar recompensas extras!
              </p>
            </div>
          </div>
        )}


      </main>

      {/* Nav inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DC] flex z-50">
        {[
          {
            href: "/dashboard",
            label: "Início",
            icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>,
          },
          {
            href: "/bem-estar",
            label: "Bem-estar",
            icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 21C12 21 4 14.5 4 8.5C4 6 6 4 8.5 4C10 4 11.5 4.8 12 6C12.5 4.8 14 4 15.5 4C18 4 20 6 20 8.5C20 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>,
          },
          {
            href: "/relatorios",
            label: "Relatórios",
            icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M8 16V12M12 16V8M16 16V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
          },
          ...(isPro ? [{
            href: "/agendamento",
            label: "Agenda",
            icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M8 7V3M16 7V3M5 11H19M7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
          }] : []),
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
              pathname === item.href ? "text-[#2D6A4F]" : "text-[#9CA3AF]"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
