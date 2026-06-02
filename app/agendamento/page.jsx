"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { usePlan } from "@/lib/usePlan";
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

  if (loading || planLoading || !user) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-green-700 dark:border-green-600 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isPro) return null;

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Hero principal da funcionalidade futura. */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="max-w-2xl">
              <span className="inline-flex items-center text-xs font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full">
                Flowise Pro
              </span>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mt-4">
                Consultas com Psicólogos Parceiros
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
                Encontre especialistas alinhados ao seu momento emocional e acompanhe sua jornada de bem-estar com apoio profissional.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 md:w-64">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
                Recurso Pro
              </p>
              <p className="text-sm text-gray-900 dark:text-white font-semibold mt-2">
                Agendamento integrado ao seu histórico de bem-estar.
              </p>
              <Link
                href="/planos"
                className="inline-flex mt-4 text-sm font-semibold text-white bg-green-700 dark:bg-green-700 px-4 py-2 rounded-lg hover:bg-green-800 dark:hover:bg-green-600 transition"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Psicólogos parceiros
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Em breve</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {COMING_SOON_ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
                <span className="w-5 h-5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  +
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <ComingSoonModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
