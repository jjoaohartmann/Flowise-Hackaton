"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOTION_META = {
  Feliz:      { emoji: "😊", color: "text-yellow-600",  bg: "bg-yellow-50",  border: "border-yellow-200" },
  Calmo:      { emoji: "😌", color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200"   },
  Focado:     { emoji: "🎯", color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"   },
  Estressado: { emoji: "😤", color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200" },
  Cansado:    { emoji: "😴", color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200" },
  Frustrado:  { emoji: "😣", color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"    },
};

const EXHAUSTION_EMOTIONS = ["Cansado", "Estressado"];
const EXHAUSTION_THRESHOLD = 3;
const SCAN_WINDOW = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Fatigue Alert ────────────────────────────────────────────────────────────

function FatigueAlert({ onDismiss }) {
  return (
    <div
      className="rounded-xl border border-orange-300 bg-orange-50 p-4 flex gap-3"
      style={{ animation: "pulse 1.8s ease-in-out infinite" }}
    >
      <span className="text-xl flex-shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-orange-700">
          Alto nível de exaustão detectado
        </p>
        <p className="text-xs text-orange-600 mt-0.5 leading-relaxed">
          Detectamos alto nível de exaustão acumulada na sua conta. O Flowise
          sugere que você faça uma{" "}
          <span className="font-bold">pausa de 15 minutos agora!</span>
        </p>
        <p className="text-[10px] text-orange-400 mt-1">
          3 ou mais registros de cansaço/estresse nos últimos 5 check-ins
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-orange-400 hover:text-orange-600 transition text-lg leading-none self-start"
      >
        ×
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const { user, loading: authLoading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const [weekEmotions,     setWeekEmotions]     = useState([]);
  const [recentEmotions,   setRecentEmotions]   = useState([]);
  const [emotionCounts,    setEmotionCounts]    = useState({});
  const [showAlert,        setShowAlert]        = useState(false);
  const [dataLoading,      setDataLoading]      = useState(true);
  const [error,            setError]            = useState(null);
  const [activeTab,        setActiveTab]        = useState("semana");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchEmotions = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setError(null);
    try {
      const weekStart = getWeekStart();

      // Emoções da semana
      const weekSnap = await getDocs(query(
        collection(db, "emocoes"),
        where("userId", "==", user.uid),
        where("createdAt", ">=", weekStart),
        orderBy("createdAt", "desc")
      ));
      const weekData = weekSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWeekEmotions(weekData);

      const counts = {};
      weekData.forEach(({ label }) => {
        counts[label] = (counts[label] || 0) + 1;
      });
      setEmotionCounts(counts);

      // Últimos 5 para varredura de alerta
      const recentSnap = await getDocs(query(
        collection(db, "emocoes"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(SCAN_WINDOW)
      ));
      const recentData = recentSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecentEmotions(recentData);

      // Varredura de exaustão
      const exhaustionCount = recentData.filter((e) =>
        EXHAUSTION_EMOTIONS.includes(e.label)
      ).length;
      setShowAlert(exhaustionCount >= EXHAUSTION_THRESHOLD);
    } catch (err) {
      console.error("Erro ao buscar emoções:", err);
      setError("Não foi possível carregar os dados. Tente novamente.");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchEmotions();
  }, [user, fetchEmotions]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#2D6A4F] border-t-transparent animate-spin" />
          <p className="text-sm text-[#9CA3AF]">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  const totalWeek      = weekEmotions.length;
  const positiveCount  = weekEmotions.filter((e) => ["Feliz","Calmo","Focado"].includes(e.label)).length;
  const negativeCount  = weekEmotions.filter((e) => ["Estressado","Cansado","Frustrado"].includes(e.label)).length;
  const wellbeingScore = totalWeek > 0 ? Math.round((positiveCount / totalWeek) * 100) : null;
  const exhaustionInRecent = recentEmotions.filter((e) => EXHAUSTION_EMOTIONS.includes(e.label)).length;

  return (
    <div className="min-h-screen bg-[#F7F5F0]">

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
        <button
          onClick={fetchEmotions}
          className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition font-medium flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-4.2M20 15a9 9 0 0 1-15 4.2"/>
          </svg>
          Atualizar
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5 pb-24">

        {/* Título */}
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Relatórios 📈</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Saúde mental e bem-estar em tempo real.
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Alerta de exaustão */}
        {showAlert && (
          <FatigueAlert onDismiss={() => setShowAlert(false)} />
        )}

        {/* Aviso relatório às 21h */}
        <div className="bg-white rounded-xl border border-[#E8E4DC] p-4 flex gap-3">
          <span className="text-xl flex-shrink-0">🕘</span>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            O <span className="font-semibold text-[#1A1A2E]">relatório consolidado oficial</span> da
            sua conta é gerado automaticamente todos os dias às{" "}
            <span className="font-bold text-[#2D6A4F]">21h00</span>. Os dados abaixo
            refletem o estado atual em tempo real.
          </p>
        </div>

        {/* Score de bem-estar */}
        {wellbeingScore !== null && (
          <div className="bg-white rounded-xl border border-[#E8E4DC] p-4 flex items-center gap-4">
            {/* Círculo de progresso */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3"/>
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={wellbeingScore >= 60 ? "#2D6A4F" : wellbeingScore >= 40 ? "#D97706" : "#DC2626"}
                  strokeWidth="3"
                  strokeDasharray={`${wellbeingScore} ${100 - wellbeingScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-[#1A1A2E]">{wellbeingScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-0.5">Bem-estar esta semana</p>
              <p className="text-sm font-semibold text-[#1A1A2E]">
                {wellbeingScore >= 70 ? "Você está indo muito bem! 🌟" :
                 wellbeingScore >= 50 ? "Semana razoável, continue 💪" :
                 "Semana difícil — cuide-se 💙"}
              </p>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-[#2D6A4F]">✓ {positiveCount} positivos</span>
                <span className="text-xs text-red-500">✗ {negativeCount} negativos</span>
                <span className="text-xs text-[#9CA3AF]">{totalWeek} total</span>
              </div>
            </div>
          </div>
        )}

        {/* Cards resumo */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Esta semana",  value: `${totalWeek}`,          icon: "📋" },
            { label: "Positivos",    value: `${positiveCount}`,      icon: "😊" },
            { label: "Atenção",      value: `${negativeCount}`,      icon: "⚠️" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-[#E8E4DC] p-3 flex flex-col items-center gap-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-base font-semibold text-[#1A1A2E]">{stat.value}</span>
              <span className="text-[10px] text-[#9CA3AF]">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-1 p-1 rounded-xl bg-white border border-[#E8E4DC]">
          {[
            { key: "semana",    label: "Esta Semana" },
            { key: "historico", label: "Histórico"   },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[#2D6A4F] text-white"
                  : "text-[#9CA3AF] hover:text-[#6B7280]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── ABA SEMANA ── */}
        {activeTab === "semana" && (
          <div className="flex flex-col gap-4">
            {totalWeek === 0 ? (
              <div className="bg-white rounded-xl border border-[#E8E4DC] p-10 text-center">
                <p className="text-3xl mb-2">🫙</p>
                <p className="text-sm text-[#9CA3AF]">Nenhum registro esta semana.</p>
                <Link href="/bem-estar" className="inline-block mt-3 text-xs text-[#2D6A4F] hover:underline font-medium">
                  Registrar emoção →
                </Link>
              </div>
            ) : (
              <>
                {/* Distribuição */}
                <div className="bg-white rounded-xl border border-[#E8E4DC] p-4">
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                    Distribuição de estados
                  </p>
                  <div className="space-y-2.5">
                    {Object.entries(emotionCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([emotion, count]) => {
                        const meta = EMOTION_META[emotion] || { emoji: "•", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
                        const pct  = Math.round((count / totalWeek) * 100);
                        return (
                          <div key={emotion} className="flex items-center gap-2.5">
                            <span className="text-base w-6 text-center">{meta.emoji}</span>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className={`text-xs font-medium ${meta.color}`}>{emotion}</span>
                                <span className="text-xs text-[#9CA3AF]">{count}× · {pct}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${meta.bg} border ${meta.border}`}
                                  style={{ width: `${pct}%`, backgroundColor: undefined }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Lista de registros */}
                <div className="bg-white rounded-xl border border-[#E8E4DC] p-4">
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                    Registros da semana ({totalWeek})
                  </p>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {weekEmotions.map((entry) => {
                      const meta = EMOTION_META[entry.label] || {
                        emoji: "•", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200",
                      };
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-start gap-3 rounded-xl border ${meta.border} ${meta.bg} p-3`}
                        >
                          <span className="text-lg mt-0.5">{meta.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-sm font-semibold ${meta.color}`}>
                                {entry.label}
                              </span>
                              <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">
                                {formatDate(entry.createdAt)}
                              </span>
                            </div>
                            {entry.note && (
                              <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
                                "{entry.note}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ABA HISTÓRICO ── */}
        {activeTab === "historico" && (
          <div className="flex flex-col gap-4">

            {/* Últimos 5 — janela de alerta */}
            <div className="bg-white rounded-xl border border-[#E8E4DC] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Últimos {SCAN_WINDOW} registros
                </p>
                <span className="text-[10px] bg-[#F3F4F6] text-[#9CA3AF] px-2 py-0.5 rounded-full">
                  janela de alerta
                </span>
              </div>

              {recentEmotions.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-6">Nenhum registro ainda.</p>
              ) : (
                <div className="space-y-2">
                  {recentEmotions.map((entry) => {
                    const meta = EMOTION_META[entry.label] || {
                      emoji: "•", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200",
                    };
                    const isExhaustion = EXHAUSTION_EMOTIONS.includes(entry.label);
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 ${
                          isExhaustion ? "border-orange-200 bg-orange-50" : `${meta.border} ${meta.bg}`
                        }`}
                      >
                        <span className="text-base">{meta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${meta.color}`}>{entry.label}</span>
                          {entry.note && (
                            <span className="text-xs text-[#9CA3AF] ml-2">· {entry.note}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isExhaustion && <span className="text-orange-500 text-xs">⚠</span>}
                          <span className="text-[10px] text-[#9CA3AF]">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Resultado da varredura */}
              <div className={`mt-3 rounded-xl p-3 border ${
                showAlert
                  ? "bg-orange-50 border-orange-200"
                  : "bg-[#F0FAF5] border-[#BBE0CF]"
              }`}>
                <p className={`text-xs font-semibold ${showAlert ? "text-orange-700" : "text-[#2D6A4F]"}`}>
                  {showAlert ? "⚠️ Exaustão detectada na varredura" : "✓ Nenhum alerta de exaustão"}
                </p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                  {exhaustionInRecent} de {recentEmotions.length} registros recentes indicam cansaço/estresse
                  {" "}(limiar: {EXHAUSTION_THRESHOLD}/{SCAN_WINDOW})
                </p>
              </div>
            </div>

            {/* Relatório diário às 21h */}
            <div className="bg-[#F0FAF5] border border-[#BBE0CF] rounded-xl p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">📊</span>
              <div>
                <p className="text-sm font-semibold text-[#2D6A4F] mb-0.5">
                  Relatório Consolidado Diário
                </p>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Todos os dias às <strong className="text-[#1A1A2E]">21h00</strong>, o Flowise gera
                  automaticamente o seu relatório consolidado oficial — com resumo de emoções,
                  tempo de foco, streak e tendências de bem-estar.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Nav inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DC] flex justify-around items-center py-2 px-4 z-40">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 transition ${
            pathname === "/dashboard" ? "text-[#2D6A4F]" : "text-[#9CA3AF] hover:text-[#2D6A4F]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-[10px] font-medium">Início</span>
        </Link>

        <Link
          href="/bem-estar"
          className={`flex flex-col items-center gap-0.5 transition ${
            pathname === "/bem-estar" ? "text-[#2D6A4F]" : "text-[#9CA3AF] hover:text-[#2D6A4F]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="text-[10px] font-medium">Bem-estar</span>
        </Link>

        <Link
          href="/relatorios"
          className={`flex flex-col items-center gap-0.5 transition ${
            pathname === "/relatorios" ? "text-[#2D6A4F]" : "text-[#9CA3AF] hover:text-[#2D6A4F]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span className="text-[10px] font-medium">Relatórios</span>
        </Link>
      </nav>
    </div>
  );
}