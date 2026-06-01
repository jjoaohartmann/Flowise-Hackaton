"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { loadStreak, updateStreak, saveFocusSession, getMascotLevel } from "@/lib/streak";
import FocusTimer from "@/components/FocusTimer";
import Mascot from "@/components/Mascot";
import { logout } from "@/lib/auth";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [streakCount, setStreakCount] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    async function init() {
      try {
        const { streakCount: sc, longestStreak: ls } = await updateStreak(user.uid);
        const { totalFocusMinutes: tfm } = await loadStreak(user.uid);
        setStreakCount(sc);
        setLongestStreak(ls);
        setTotalFocusMinutes(tfm);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setDataLoading(false);
      }
    }

    init();
  }, [user, loading]);

  async function handleSessionComplete(minutesFocused, sessionCount) {
    if (!user) return;
    try {
      await saveFocusSession(user.uid, minutesFocused);
      setTotalFocusMinutes((prev) => prev + minutesFocused);
      if (sessionCount % 4 === 0) {
        showToast("4 sessões completas! Hora de uma pausa longa 🎉", "success");
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
  const firstName = user?.displayName?.split(" ")[0] ?? "você";

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-md text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-[#2D6A4F] text-white" : "bg-[#1A1A2E] text-white"
        }`}>
          {toast.message}
        </div>
      )}

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
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#FFF8E6] border border-[#FFE0A0] rounded-full px-3 py-1">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-semibold text-[#B45309]">{streakCount}</span>
          </div>
          <button onClick={handleLogout} className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6 pb-24">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Olá, {firstName} 👋</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {streakCount > 0
              ? `${streakCount} ${streakCount === 1 ? "dia seguido" : "dias seguidos"} — continue assim!`
              : "Comece hoje sua sequência de foco."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Streak",     value: `${streakCount}d`,                    icon: "🔥" },
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

        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
          <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-4">Seu companheiro</p>
          <Mascot level={mascotLevel} streakCount={streakCount} isTimerRunning={isTimerRunning} />
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
          <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-4">Sessão de foco</p>
          <FocusTimer onSessionComplete={handleSessionComplete} onRunningChange={setIsTimerRunning} />
        </div>

        {streakCount < 3 && (
          <div className="bg-[#FFF8E6] border border-[#FFE0A0] rounded-xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-medium text-[#B45309]">Dica de sequência</p>
              <p className="text-xs text-[#92400E] mt-0.5 leading-relaxed">
                Complete sessões por mais {3 - streakCount}{" "}
                {3 - streakCount === 1 ? "dia" : "dias"} seguidos para evoluir seu mascote!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Nav inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DC] flex justify-around items-center py-2 px-4 z-40">
        <Link href="/dashboard" className={`flex flex-col items-center gap-0.5 transition ${pathname === "/dashboard" ? "text-[#2D6A4F]" : "text-[#9CA3AF] hover:text-[#2D6A4F]"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-[10px] font-medium">Início</span>
        </Link>

        <Link href="/bem-estar" className={`flex flex-col items-center gap-0.5 transition ${pathname === "/bem-estar" ? "text-[#2D6A4F]" : "text-[#9CA3AF] hover:text-[#2D6A4F]"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="text-[10px] font-medium">Bem-estar</span>
        </Link>
      </nav>
    </div>
  );
}