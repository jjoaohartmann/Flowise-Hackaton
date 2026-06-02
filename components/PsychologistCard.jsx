"use client";

import FavoriteButton from "@/components/FavoriteButton";

export default function PsychologistCard({ psychologist, onSchedule }) {
  return (
    <article className="bg-white dark:bg-gray-900 border border-[#E8E4DC] dark:border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Avatar local e ficticio, sem depender de imagens externas. */}
      <div className="w-16 h-16 rounded-xl bg-[#F7F5F0] dark:bg-gray-800 border border-[#E8E4DC] dark:border-gray-700 flex items-center justify-center text-sm font-bold text-[#2D6A4F] dark:text-green-400 flex-shrink-0">
        {psychologist.foto}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-[#1A1A2E] dark:text-white text-base">
            {psychologist.nome}
          </h3>
          <span className="text-[10px] font-semibold text-[#2D6A4F] dark:text-green-300 bg-[#EAF4EF] dark:bg-green-900/30 border border-[#CDE5DA] dark:border-green-800 px-2 py-0.5 rounded-full">
            Parceiro
          </span>
        </div>

        <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">
          {psychologist.especialidade}
        </p>

        <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-2">
          {psychologist.experiencia} de experiência
        </p>
      </div>

      <div className="w-full sm:w-auto flex items-center gap-2 sm:justify-end">
        <FavoriteButton
          id={psychologist.id}
          type="psychologist"
          name={psychologist.nome}
          data={{
            especialidade: psychologist.especialidade,
            experiencia: psychologist.experiencia,
          }}
        />
        <button
          type="button"
          onClick={onSchedule}
          className="flex-1 sm:flex-none bg-[#2D6A4F] dark:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24563F] dark:hover:bg-green-600 active:scale-[0.98] transition"
        >
          Agendar Consulta
        </button>
      </div>
    </article>
  );
}
