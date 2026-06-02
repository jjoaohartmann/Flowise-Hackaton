"use client";

export default function ComingSoonModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Camada escura para focar a atencao no modal. */}
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="absolute inset-0 bg-[#1A1A2E]/40"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-title"
        className="relative w-full max-w-sm bg-white border border-[#E8E4DC] rounded-xl p-6 shadow-xl"
      >
        <div className="w-12 h-12 rounded-xl bg-[#EAF4EF] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 7V3M16 7V3M5 11H19M7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21Z" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 id="coming-soon-title" className="text-lg font-semibold text-[#1A1A2E]">
          Agendamento em breve
        </h2>

        <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">
          Em breve você poderá agendar consultas diretamente pelo Flowise.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full bg-[#2D6A4F] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24563F] transition"
        >
          Entendi
        </button>
      </section>
    </div>
  );
}
