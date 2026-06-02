"use client";

export default function PsychologistCard({ psychologist, onSchedule }) {
  return (
    <article className="bg-white border border-[#E8E4DC] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Avatar local e ficticio, sem depender de imagens externas. */}
      <div className="w-16 h-16 rounded-xl bg-[#F7F5F0] border border-[#E8E4DC] flex items-center justify-center text-sm font-bold text-[#2D6A4F] flex-shrink-0">
        {psychologist.foto}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-[#1A1A2E] text-base">
            {psychologist.nome}
          </h3>
          <span className="text-[10px] font-semibold text-[#2D6A4F] bg-[#EAF4EF] border border-[#CDE5DA] px-2 py-0.5 rounded-full">
            Parceiro
          </span>
        </div>

        <p className="text-sm text-[#6B7280] mt-1">
          {psychologist.especialidade}
        </p>

        <p className="text-xs text-[#9CA3AF] mt-2">
          {psychologist.experiencia} de experiência
        </p>
      </div>

      <button
        type="button"
        onClick={onSchedule}
        className="w-full sm:w-auto bg-[#2D6A4F] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24563F] active:scale-[0.98] transition"
      >
        Agendar Consulta
      </button>
    </article>
  );
}
