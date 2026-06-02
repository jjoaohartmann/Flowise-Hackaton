"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { usePlan } from "@/lib/usePlan";
import { logout } from "@/lib/auth";
import PsychologistCard from "@/components/PsychologistCard";
import ComingSoonModal from "@/components/ComingSoonModal";

const PSYCHOLOGISTS = [
  {
    id: 1,
    nome: "Dra. Ana Martins",
    especialidade: "Ansiedade, estresse e burnout",
    experiencia: "8 anos",
    foto: "AM",
  },
  {
    id: 2,
    nome: "Dr. Rafael Lima",
    especialidade: "Produtividade saudável e rotina",
    experiencia: "12 anos",
    foto: "RL",
  },
  {
    id: 3,
    nome: "Dra. Camila Souza",
    especialidade: "Autoestima e bem-estar emocional",
    experiencia: "6 anos",
    foto: "CS",
  },
  {
    id: 4,
    nome: "Dra. Beatriz Rocha",
    especialidade: "Sono, foco e equilíbrio digital",
    experiencia: "10 anos",
    foto: "BR",
  },
];

const COMING_SOON_ITEMS = [
  "Agendamento em tempo real",
  "Consultas online",
  "Pagamentos integrados",
  "Recomendações personalizadas",
  "Match automático entre emoções registradas e especialistas",
];

function FlowiseHeader({ user, isPro, onLogout }) {
  return (
    <header className="bg-white border-b border-[#E8E4DC] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="white" opacity=".3" />
            <circle cx="12" cy="12" r="6" fill="white" opacity=".6" />
            <circle cx="12" cy="12" r="3" fill="white" />
          </svg>
        </div>
        <span className="font-semibold text-[#1A1A2E] text-sm">Flowise</span>
        <span className="text-[10px] border border-[#E8E4DC] text-[#9CA3AF] px-2 py-0.5 rounded-full">
          beta
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-[#9CA3AF] hidden sm:block truncate max-w-[160px]">
          {user?.email}
        </span>
        <Link
          href="/planos"
          className={`text-xs font-semibold rounded-full px-3 py-1 border transition-colors ${
            isPro
              ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
              : "text-[#6B7280] border-[#E8E4DC] hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
          }`}
        >
          {isPro ? "Pro" : "Upgrade Pro"}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition font-medium"
        >
          Sair
        </button>
      </div>
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Início",
      icon: <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    },
    {
      href: "/bem-estar",
      label: "Bem-estar",
      icon: <path d="M12 21C12 21 4 14.5 4 8.5C4 6 6 4 8.5 4C10 4 11.5 4.8 12 6C12.5 4.8 14 4 15.5 4C18 4 20 6 20 8.5C20 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    },
    {
      href: "/relatorios",
      label: "Relatórios",
      icon: (
        <>
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M8 16V12M12 16V8M16 16V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DC] flex z-50">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
            pathname === item.href ? "text-[#2D6A4F]" : "text-[#9CA3AF]"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
            {item.icon}
          </svg>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function AgendamentoPage() {
  const { user, loading } = useAuth();
  const { isPro, loading: planLoading } = usePlan();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  // Protege a rota para manter o agendamento exclusivo do Flowise Pro.
  useEffect(() => {
    if (loading || planLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isPro) router.replace("/planos");
  }, [user, isPro, loading, planLoading, router]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (loading || planLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#2D6A4F] border-t-transparent animate-spin" />
          <p className="text-sm text-[#9CA3AF]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isPro) return null;

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <FlowiseHeader user={user} isPro={isPro} onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 pb-24">
        {/* Hero principal da funcionalidade futura. */}
        <section className="bg-white border border-[#E8E4DC] rounded-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="max-w-2xl">
              <span className="inline-flex items-center text-xs font-semibold text-[#2D6A4F] bg-[#EAF4EF] border border-[#CDE5DA] px-3 py-1 rounded-full">
                Flowise Pro
              </span>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A2E] mt-4">
                Consultas com Psicólogos Parceiros
              </h1>
              <p className="text-sm md:text-base text-[#6B7280] mt-3 leading-relaxed">
                Encontre especialistas alinhados ao seu momento emocional e acompanhe sua jornada de bem-estar com apoio profissional.
              </p>
            </div>

            <div className="bg-[#F7F5F0] border border-[#E8E4DC] rounded-xl p-4 md:w-64">
              <p className="text-xs font-semibold text-[#2D6A4F] uppercase tracking-wide">
                Recurso Pro
              </p>
              <p className="text-sm text-[#1A1A2E] font-semibold mt-2">
                Agendamento integrado ao seu histórico de bem-estar.
              </p>
              <Link
                href="/planos"
                className="inline-flex mt-4 text-sm font-semibold text-white bg-[#2D6A4F] px-4 py-2 rounded-lg hover:bg-[#24563F] transition"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A2E]">
                Psicólogos parceiros
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Profissionais fictícios para demonstrar a experiência futura.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PSYCHOLOGISTS.map((psychologist) => (
              <PsychologistCard
                key={psychologist.id}
                psychologist={psychologist}
                onSchedule={() => setModalOpen(true)}
              />
            ))}
          </div>
        </section>

        {/* Lista de capacidades planejadas para o lançamento. */}
        <section className="bg-white border border-[#E8E4DC] rounded-xl p-5">
          <h2 className="text-lg font-semibold text-[#1A1A2E]">Em breve</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {COMING_SOON_ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-[#FAFAF8] border border-[#E8E4DC] rounded-xl p-3">
                <span className="w-5 h-5 rounded-full bg-[#EAF4EF] text-[#2D6A4F] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  +
                </span>
                <p className="text-sm text-[#6B7280] leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
      <ComingSoonModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
