"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";

// ─── Ícone simples de check ───────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="10" fill="#2D6A4F" fillOpacity="0.12" />
      <path
        d="M6 10.5L8.5 13L14 7.5"
        stroke="#2D6A4F"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Ícone de cadeado (feature bloqueada no Free) ─────────────────────────────
function LockIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="10" fill="#9CA3AF" fillOpacity="0.12" />
      <rect x="6.5" y="9" width="7" height="5.5" rx="1.2" stroke="#9CA3AF" strokeWidth="1.5" />
      <path
        d="M8 9V7.5a2 2 0 1 1 4 0V9"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Navegação inferior (mesmo padrão das outras páginas) ─────────────────────
function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Início",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/bem-estar",
      label: "Bem-estar",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21C12 21 4 14.5 4 8.5C4 6 6 4 8.5 4C10 4 11.5 4.8 12 6C12.5 4.8 14 4 15.5 4C18 4 20 6 20 8.5C20 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/relatorios",
      label: "Relatórios",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M8 16V12M12 16V8M16 16V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DC] flex z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
              isActive ? "text-[#2D6A4F]" : "text-[#9CA3AF]"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PlanosPage() {
  const router = useRouter();
  const { user } = useAuth();

  function handleProClick() {
    // TODO: integrar com Stripe / gateway de pagamento
    alert("Em breve! O checkout Pro será integrado aqui. 🚀");
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#E8E4DC] px-4 py-3 flex items-center gap-2 sticky top-0 z-40">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-[#F7F5F0] transition-colors text-[#6B7280]"
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-semibold text-[#1A1A2E] text-base" style={{ fontFamily: "Outfit, sans-serif" }}>
          Flowise
        </span>
        <span className="text-[10px] bg-[#2D6A4F] text-white rounded-full px-2 py-0.5 font-medium">
          beta
        </span>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-8 pb-6 text-center">
        <h1
          className="text-2xl font-bold text-[#1A1A2E] mb-2"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Escolha seu plano
        </h1>
        <p className="text-[#6B7280] text-sm max-w-xs mx-auto">
          Comece grátis e evolua quando precisar de mais cuidado com seu bem-estar.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          GRID DE CARDS  ← EXPLICAÇÃO DETALHADA ABAIXO NO JSX
      ══════════════════════════════════════════════════════════════ */}
      <div className="
        px-4
        flex flex-col gap-4
        md:flex-row md:items-start md:justify-center md:gap-6 md:max-w-2xl md:mx-auto
      ">

        {/* ── Card Gratuito ───────────────────────────────────────── */}
        <div className="
          flex-1
          bg-white border border-[#E8E4DC] rounded-xl
          p-6 flex flex-col gap-5
        ">
          {/* Cabeçalho do card */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
              Gratuito
            </span>
            <div className="mt-1 flex items-end gap-1">
              <span className="text-4xl font-bold text-[#1A1A2E]" style={{ fontFamily: "Outfit, sans-serif" }}>
                R$ 0
              </span>
              <span className="text-[#9CA3AF] text-sm mb-1">/mês</span>
            </div>
            <p className="mt-1.5 text-[#6B7280] text-sm">
              Para começar a cuidar de você.
            </p>
          </div>

          {/* Divisor */}
          <hr className="border-[#E8E4DC]" />

          {/* Lista de funcionalidades */}
          <ul className="flex flex-col gap-3">
            <li className="flex items-start gap-2.5">
              <CheckIcon />
              <span className="text-sm text-[#1A1A2E]">
                <strong>Cronômetro Pomodoro</strong> — 4 sessões de foco de 25 min
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckIcon />
              <span className="text-sm text-[#1A1A2E]">
                <strong>Mascote básico</strong> — 5 estágios de evolução
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckIcon />
              <span className="text-sm text-[#1A1A2E]">
                <strong>Registro de emoções</strong> — histórico dos últimos 10 registros
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckIcon />
              <span className="text-sm text-[#1A1A2E]">
                <strong>Streak diário</strong> e recorde pessoal
              </span>
            </li>

            {/* Features bloqueadas no free */}
            <li className="flex items-start gap-2.5 opacity-50">
              <LockIcon />
              <span className="text-sm text-[#6B7280]">
                Relatórios avançados de bem-estar
              </span>
            </li>
            <li className="flex items-start gap-2.5 opacity-50">
              <LockIcon />
              <span className="text-sm text-[#6B7280]">
                Detecção de cansaço e alerta de burnout
              </span>
            </li>
            <li className="flex items-start gap-2.5 opacity-50">
              <LockIcon />
              <span className="text-sm text-[#6B7280]">
                Agendamento com psicólogos parceiros
              </span>
            </li>
          </ul>

          {/* Botão */}
          <button
            disabled
            className="mt-auto w-full py-3 rounded-xl border-2 border-[#E8E4DC] text-[#9CA3AF] font-semibold text-sm cursor-default"
          >
            Plano atual ✓
          </button>
        </div>

        {/* ── Card Pro (destaque) ─────────────────────────────────── */}
        <div className="
          flex-1 relative
          bg-[#2D6A4F] rounded-xl
          p-6 flex flex-col gap-5
          shadow-lg shadow-[#2D6A4F]/20
        ">
          {/* Badge "Mais popular" */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-[#1A1A2E] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
              ⭐ Mais popular
            </span>
          </div>

          {/* Cabeçalho do card */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#A8D5C2]">
              Flowise Pro
            </span>
            <div className="mt-1 flex items-end gap-1">
              <span className="text-4xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                R$ 19
              </span>
              <span className="text-[#A8D5C2] text-sm mb-1">/mês</span>
            </div>
            <p className="mt-1.5 text-[#A8D5C2] text-sm">
              Cuidado completo com saúde mental e foco.
            </p>
          </div>

          {/* Divisor */}
          <hr className="border-white/20" />

          {/* Lista de funcionalidades */}
          <ul className="flex flex-col gap-3">
            {/* Tudo do free */}
            <li className="flex items-start gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="white" fillOpacity="0.15" />
                <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-white">
                <strong>Tudo do plano Gratuito</strong>
              </span>
            </li>

            {/* Features exclusivas Pro */}
            <li className="flex items-start gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="white" fillOpacity="0.15" />
                <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-white">
                <strong>Relatórios avançados</strong> — score semanal de bem-estar em gráfico circular
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="white" fillOpacity="0.15" />
                <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-white">
                <strong>Detecção de cansaço</strong> — alerta ⚠️ automático quando ≥ 3 dos últimos 5 registros indicam "Cansado" ou "Estressado"
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="white" fillOpacity="0.15" />
                <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-white">
                <strong>Agendamento com psicólogos</strong> parceiros — consulta online diretamente pelo app
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="white" fillOpacity="0.15" />
                <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-white">
                <strong>Histórico ilimitado</strong> de emoções e sessões de foco
              </span>
            </li>
          </ul>

          {/* Botão CTA */}
          <button
            onClick={handleProClick}
            className="
              mt-auto w-full py-3.5 rounded-xl
              bg-white text-[#2D6A4F]
              font-bold text-sm
              hover:bg-[#F0FAF5] active:scale-95
              transition-all duration-150
              shadow-md
            "
          >
            Assinar Pro — R$ 19/mês
          </button>

          <p className="text-center text-[#A8D5C2] text-xs">
            Cancele quando quiser. Sem taxas ocultas.
          </p>
        </div>
      </div>

      {/* ── FAQ mínimo ─────────────────────────────────────────────── */}
      <div className="px-4 pt-8 max-w-2xl mx-auto">
        <h2
          className="text-base font-semibold text-[#1A1A2E] mb-4 text-center"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Dúvidas frequentes
        </h2>
        <div className="flex flex-col gap-3">
          {[
            {
              q: "Posso cancelar o Pro a qualquer momento?",
              a: "Sim. Sem multa, sem burocracia. Você continua com acesso Pro até o fim do período pago.",
            },
            {
              q: "Os psicólogos parceiros são credenciados?",
              a: "Sim! Todos possuem CRP ativo e passam por curadoria antes de entrar na plataforma.",
            },
            {
              q: "Meus dados emocionais ficam seguros?",
              a: "Seus dados ficam protegidos no Firestore com regras de segurança: apenas você pode ler e escrever as suas informações.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white border border-[#E8E4DC] rounded-xl p-4"
            >
              <p className="text-sm font-semibold text-[#1A1A2E] mb-1">{item.q}</p>
              <p className="text-sm text-[#6B7280]">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}