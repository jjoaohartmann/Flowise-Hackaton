"use client";
// app/relatorios/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
// MUDANÇAS DA ETAPA 5:
//   • Importa usePlan() para saber se o usuário é Pro
//   • Banner de alerta de cansaço → só aparece para Pro
//   • Score de bem-estar completo → só aparece para Pro
//   • Usuários Free veem um card de bloqueio com link para /planos
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/lib/AuthContext";
import { usePlan } from "@/lib/usePlan";

// ─── Nav inferior ─────────────────────────────────────────────────────────────
function BottomNav() {
  const pathname = usePathname();
  const { isPro } = usePlan();
  const navItems = [
    {
      href: "/dashboard",
      label: "Início",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
      ),
    },
    {
      href: "/bem-estar",
      label: "Bem-estar",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 21C12 21 4 14.5 4 8.5C4 6 6 4 8.5 4C10 4 11.5 4.8 12 6C12.5 4.8 14 4 15.5 4C18 4 20 6 20 8.5C20 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
      ),
    },
    {
      href: "/relatorios",
      label: "Relatórios",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M8 16V12M12 16V8M16 16V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      ),
    },
    ...(isPro ? [{
      href: "/agendamento",
      label: "Agenda",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M8 7V3M16 7V3M5 11H19M7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ),
    }] : []),
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DC] flex z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${isActive ? "text-[#2D6A4F]" : "text-[#9CA3AF]"}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Card de feature bloqueada para usuários Free ─────────────────────────────
function ProGate({ title, description }) {
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 text-center">
      <p className="text-3xl mb-2">🔒</p>
      <p className="font-semibold text-[#1A1A2E] text-sm">{title}</p>
      <p className="text-[#6B7280] text-xs mt-1 mb-3">{description}</p>
      <Link href="/planos"
        className="inline-block text-xs font-semibold text-white bg-[#2D6A4F] px-4 py-2 rounded-lg">
        Ver planos Pro →
      </Link>
    </div>
  );
}

// ─── Emojis por label ─────────────────────────────────────────────────────────
const EMOTION_EMOJI = {
  Feliz: "😊", Calmo: "😌", Ansioso: "😰",
  Cansado: "😴", Estressado: "😤", Triste: "😢",
};

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ─── Helpers de data ──────────────────────────────────────────────────────────
function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

// ─── Score de bem-estar ───────────────────────────────────────────────────────
function calcScore(emotions) {
  if (!emotions.length) return 0;
  const positive = { Feliz: 100, Calmo: 85 };
  const neutral  = { Ansioso: 50, Cansado: 40 };
  const negative = { Estressado: 20, Triste: 30 };
  const map = { ...positive, ...neutral, ...negative };
  const total = emotions.reduce((acc, e) => acc + (map[e.label] ?? 50), 0);
  return Math.round(total / emotions.length);
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RelatoriosPage() {
  const { user }          = useAuth();
  const { isPro, loading: planLoading } = usePlan();
  const router            = useRouter();

  const [tab, setTab]             = useState("semana");
  const [weekEmotions, setWeekEmotions]   = useState([]);
  const [historyEmotions, setHistoryEmotions] = useState([]);
  const [last5, setLast5]         = useState([]);
  const [loading, setLoading]     = useState(true);

  // Aviso às 21h
  const [showNightTip, setShowNightTip] = useState(false);
  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 21) setShowNightTip(true);
  }, []);

  // ── Busca dados ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    async function fetch() {
      setLoading(true);
      const ref = collection(db, "emocoes");

      // Últimos 5 (para detecção de cansaço)
      const q5 = query(ref, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
      const snap5 = await getDocs(q5);
      const l5 = snap5.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLast5(l5);

      // Semana atual
      const { start, end } = getWeekBounds();
      const qWeek = query(
        ref,
        where("userId", "==", user.uid),
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<", Timestamp.fromDate(end)),
        orderBy("createdAt", "desc")
      );
      const snapWeek = await getDocs(qWeek);
      setWeekEmotions(snapWeek.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Histórico completo (últimos 30)
      const qHist = query(ref, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(30));
      const snapHist = await getDocs(qHist);
      setHistoryEmotions(snapHist.docs.map((d) => ({ id: d.id, ...d.data() })));

      setLoading(false);
    }
    fetch();
  }, [user]);

  // ── Lógica de alerta de cansaço ────────────────────────────────────────────
  const stressLabels = ["Cansado", "Estressado"];
  const stressCount  = last5.filter((e) => stressLabels.includes(e.label)).length;
  const showAlert    = stressCount >= 3;

  // ── Score ──────────────────────────────────────────────────────────────────
  const currentEmotions = tab === "semana" ? weekEmotions : historyEmotions;
  const score = calcScore(currentEmotions);

  // ── Distribuição por emoção ────────────────────────────────────────────────
  const distribution = currentEmotions.reduce((acc, e) => {
    acc[e.label] = (acc[e.label] || 0) + 1;
    return acc;
  }, {});
  const maxCount = Math.max(...Object.values(distribution), 1);

  // ── Score color ────────────────────────────────────────────────────────────
  function scoreColor(s) {
    if (s >= 70) return "#2D6A4F";
    if (s >= 40) return "#F59E0B";
    return "#EF4444";
  }

  const circumference = 2 * Math.PI * 38;
  const strokeDash    = (score / 100) * circumference;

  if (loading || planLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24">

      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] px-4 py-3 flex items-center gap-2 sticky top-0 z-40">
        <span className="font-semibold text-[#1A1A2E] text-base" style={{ fontFamily: "Outfit, sans-serif" }}>Flowise</span>
        <span className="text-[10px] bg-[#2D6A4F] text-white rounded-full px-2 py-0.5 font-medium">beta</span>
        <div className="ml-auto">
          <Link href="/planos" className="text-xs text-[#2D6A4F] font-semibold border border-[#2D6A4F] rounded-lg px-2.5 py-1">
            {isPro ? "✓ Pro" : "Upgrade Pro"}
          </Link>
        </div>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-[#1A1A2E] mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Relatórios</h1>
        <p className="text-[#6B7280] text-sm mb-5">Acompanhe seu bem-estar ao longo do tempo.</p>

        {/* Aviso noturno */}
        {showNightTip && (
          <div className="bg-[#1A1A2E] text-white text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            🌙 <span>Hora de encerrar o dia! Que tal registrar como você se sentiu?</span>
          </div>
        )}

        {/* ── Banner alerta de cansaço (apenas Pro) ─────────────────────────── */}
        {isPro ? (
          showAlert && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2 animate-pulse">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Atenção: você registrou muitas emoções negativas recentemente.</p>
                <p className="text-xs mt-0.5">Considere fazer uma pausa, conversar com alguém ou agendar uma consulta.</p>
                <Link href="/agendamento" className="text-xs font-semibold text-amber-700 underline mt-1 inline-block">
                  Agendar com psicólogo →
                </Link>
              </div>
            </div>
          )
        ) : (
          /* Usuário Free: mostra card bloqueado no lugar do banner */
          <ProGate
            title="Detecção de cansaço e alerta de burnout"
            description="O algoritmo analisa seus últimos 5 registros e emite alertas automáticos quando identifica padrões de esgotamento."
          />
        )}

        {/* ── Abas ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mt-5 mb-4">
          {["semana", "historico"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? "bg-[#2D6A4F] text-white" : "bg-white border border-[#E8E4DC] text-[#6B7280]"}`}
            >
              {t === "semana" ? "Esta Semana" : "Histórico"}
            </button>
          ))}
        </div>

        {/* ── Score de bem-estar (apenas Pro) ──────────────────────────────── */}
        {isPro ? (
          <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 mb-4 flex items-center gap-5">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="38" fill="none" stroke="#E8E4DC" strokeWidth="8" />
              <circle cx="48" cy="48" r="38" fill="none"
                stroke={scoreColor(score)} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeDashoffset={circumference / 4}
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
              <text x="48" y="52" textAnchor="middle" fontSize="20" fontWeight="bold" fill={scoreColor(score)}>
                {score}%
              </text>
            </svg>
            <div>
              <p className="text-sm font-semibold text-[#1A1A2E]">Score de Bem-estar</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {score >= 70 ? "😊 Você está indo bem!" : score >= 40 ? "😐 Atenção ao seu ritmo." : "😔 Cuide-se com carinho."}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">{currentEmotions.length} registros analisados</p>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <ProGate
              title="Score de bem-estar completo"
              description="Veja seu índice de saúde emocional calculado em tempo real com gráfico circular."
            />
          </div>
        )}

        {/* ── Distribuição por emoção (disponível para todos) ──────────────── */}
        <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 mb-4">
          <p className="text-sm font-semibold text-[#1A1A2E] mb-3">Distribuição de Emoções</p>
          {Object.keys(distribution).length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-4">Nenhum registro neste período.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {Object.entries(distribution)
                .sort((a, b) => b[1] - a[1])
                .map(([label, count]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{EMOTION_EMOJI[label] ?? "❓"}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#1A1A2E] font-medium">{label}</span>
                        <span className="text-[#9CA3AF]">{count}x</span>
                      </div>
                      <div className="h-2 bg-[#F7F5F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2D6A4F] rounded-full transition-all duration-700"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ── Lista de registros ────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E8E4DC] rounded-xl p-5">
          <p className="text-sm font-semibold text-[#1A1A2E] mb-3">
            {tab === "semana" ? "Registros desta semana" : "Histórico completo"}
          </p>
          {currentEmotions.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-4">Nenhum registro ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {currentEmotions.map((e) => {
                const date = e.createdAt?.toDate?.() ?? new Date();
                return (
                  <div key={e.id} className="flex items-start gap-3 py-2 border-b border-[#F7F5F0] last:border-0">
                    <span className="text-2xl">{e.emoji ?? EMOTION_EMOJI[e.label] ?? "❓"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-[#1A1A2E]">{e.label}</span>
                        <span className="text-xs text-[#9CA3AF]">
                          {WEEK_DAYS[date.getDay()]} {date.getDate()}/{date.getMonth() + 1}
                        </span>
                      </div>
                      {e.note && <p className="text-xs text-[#6B7280] mt-0.5 truncate">{e.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Agendamento com psicólogo (apenas Pro) ───────────────────────── */}
        <div className="mt-4 mb-2">
          {isPro ? (
            <div className="bg-[#2D6A4F] rounded-xl p-5 text-white">
              <p className="font-semibold text-base mb-1">🧠 Psicólogos parceiros</p>
              <p className="text-sm text-[#A8D5C2] mb-3">
                Agende uma consulta online com profissionais credenciados.
              </p>
              <Link href="/agendamento" className="block w-full py-3 bg-white text-[#2D6A4F] font-bold rounded-xl text-sm text-center">
                Agendar consulta
              </Link>
            </div>
          ) : (
            <ProGate
              title="Agendamento com psicólogos parceiros"
              description="Consulta online com profissionais credenciados, direto do app."
            />
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
