"use client";

import Link from "next/link";

export default function AgendamentoPage() {
  const psicologos = [
    {
      id: 1,
      nome: "Dra. Ana Martins",
      especialidade: "Ansiedade e Burnout",
      experiencia: "8 anos",
      foto: "👩‍⚕️",
    },
    {
      id: 2,
      nome: "Dr. Ricardo Lima",
      especialidade: "Produtividade Saudável",
      experiencia: "12 anos",
      foto: "👨‍⚕️",
    },
    {
      id: 3,
      nome: "Dra. Camila Souza",
      especialidade: "Saúde Mental para Estudantes",
      experiencia: "6 anos",
      foto: "👩‍⚕️",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-[#1A1A2E] text-xl">
              Flowise
            </h1>

            <span className="text-xs bg-[#2D6A4F] text-white px-2 py-1 rounded-full">
              beta
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-[#2D6A4F] to-[#40916C] text-white rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Consultas com Psicólogos Parceiros
          </h2>

          <p className="text-sm opacity-90">
            Encontre profissionais especializados
            em ansiedade, produtividade saudável,
            burnout e bem-estar emocional.
          </p>
        </div>

        {/* Aviso Pro */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6">
          <p className="font-semibold text-amber-800">
            🔒 Recurso disponível no Flowise Pro
          </p>

          <p className="text-sm text-amber-700 mt-1">
            O agendamento online faz parte dos
            benefícios exclusivos do plano Pro.
          </p>

          <Link
            href="/planos"
            className="inline-block mt-3 bg-[#2D6A4F] text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Conhecer Flowise Pro
          </Link>
        </div>

        {/* Lista */}
        <div className="grid gap-4">
          {psicologos.map((psicologo) => (
            <div
              key={psicologo.id}
              className="bg-white border border-[#E8E4DC] rounded-xl p-5"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">
                  {psicologo.foto}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-[#1A1A2E]">
                    {psicologo.nome}
                  </h3>

                  <p className="text-[#6B7280] text-sm">
                    {psicologo.especialidade}
                  </p>

                  <p className="text-xs text-[#9CA3AF] mt-1">
                    Experiência: {psicologo.experiencia}
                  </p>
                </div>

                <button
                  disabled
                  className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
                >
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Futuro */}
        <div className="mt-6 bg-white border border-[#E8E4DC] rounded-xl p-5">
          <h3 className="font-semibold text-[#1A1A2E] mb-2">
            🚀 Em Breve
          </h3>

          <ul className="text-sm text-[#6B7280] space-y-2">
            <li>• Agendamento em tempo real</li>
            <li>• Consultas online</li>
            <li>• Pagamento integrado</li>
            <li>• Recomendações personalizadas</li>
            <li>• Match baseado nas emoções registradas</li>
          </ul>
        </div>
      </main>
    </div>
  );
}       