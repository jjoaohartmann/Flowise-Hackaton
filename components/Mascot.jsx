"use client";

import { useState, useCallback } from "react";

// ── 8 estágios de evolução ──────────────────────────────────
// threshold = quantos dias de streak para DESBLOQUEAR o próximo estágio
const STAGES = [
  { label: "Ovo",        color: "#fbbf24", bg: "#fffbeb", threshold: 1  }, // level 0 — streak 0
  { label: "Caçula",     color: "#10b981", bg: "#ecfdf5", threshold: 3  }, // level 1 — streak 1-2
  { label: "Gordinho",   color: "#06b6d4", bg: "#ecfeff", threshold: 7  }, // level 2 — streak 3-6
  { label: "Esperto",    color: "#8b5cf6", bg: "#f5f3ff", threshold: 14 }, // level 3 — streak 7-13
  { label: "Sábio",      color: "#3b82f6", bg: "#eff6ff", threshold: 21 }, // level 4 — streak 14-20
  { label: "Veterano",   color: "#ef4444", bg: "#fef2f2", threshold: 30 }, // level 5 — streak 21-29
  { label: "Lendário",   color: "#ec4899", bg: "#fdf2f8", threshold: 50 }, // level 6 — streak 30-49
  { label: "Mítico",     color: "#8b5cf6", bg: "#faf5ff", threshold: null },// level 7 — streak 50+
];

// ════════════════════════════════════════════════════════════
//  SVG Components — cada estágio com design único e rico
// ════════════════════════════════════════════════════════════

function EggStage({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id="eggGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <filter id="eggShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Ovo */}
      <ellipse cx="50" cy="56" rx="26" ry="30" fill="url(#eggGrad)" filter="url(#eggShadow)" />
      {/* Highlight */}
      <ellipse cx="42" cy="45" rx="8" ry="5" fill="white" opacity="0.3" transform="rotate(-20 42 45)" />
      {/* Crack lines (o ovo está prestes a eclodir) */}
      <path d="M44 40 L38 52" stroke="#b45309" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M38 52 L46 57" stroke="#b45309" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M56 42 L62 54" stroke="#b45309" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Brilhos mágicos */}
      <circle cx="60" cy="34" r="1.5" fill="#fbbf24" opacity="0.9" />
      <circle cx="40" cy="32" r="1"   fill="#fcd34d" opacity="0.7" />
      <circle cx="32" cy="44" r="1.2" fill="#fbbf24" opacity="0.5" />
      <circle cx="50" cy="28" r="0.8" fill="#fef3c7" opacity="0.6" />
    </svg>
  );
}

function BabyStage({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id="babyGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="70%" stopColor={color} />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>
      </defs>
      {/* Corpo */}
      <ellipse cx="50" cy="60" rx="27" ry="26" fill="url(#babyGrad)" opacity="0.9" />
      {/* Cabeça */}
      <ellipse cx="50" cy="40" rx="23" ry="23" fill="url(#babyGrad)" />
      {/* Barriga clara */}
      <ellipse cx="50" cy="64" rx="12" ry="14" fill="white" opacity="0.2" />
      {/* Olho único (grande e inocente) */}
      <circle cx="50" cy="40" r="11" fill="white" />
      <circle cx="50" cy="41" r="7"  fill="#1a1a2e" />
      <circle cx="53" cy="38" r="2.5" fill="white" />
      {/* Brilho no olho */}
      <circle cx="47" cy="37" r="1.2" fill="white" opacity="0.6" />
      {/* Sorriso */}
      <path d="M43 53 Q50 59 57 53" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Bochechas */}
      <ellipse cx="34" cy="48" rx="4" ry="3" fill="#f43f5e" opacity="0.35" />
      <ellipse cx="66" cy="48" rx="4" ry="3" fill="#f43f5e" opacity="0.35" />
      {/* Orelhinhas */}
      <ellipse cx="25" cy="36" rx="5" ry="7" fill={color} opacity="0.85" />
      <ellipse cx="75" cy="36" rx="5" ry="7" fill={color} opacity="0.85" />
      {/* Casca do ovo no chão (acabou de eclodir) */}
      <path d="M38 78 Q50 82 62 78" stroke="#d97706" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
    </svg>
  );
}

function ChubbyStage({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id="chubbyGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="70%" stopColor={color} />
          <stop offset="100%" stopColor="#0e7490" />
        </radialGradient>
      </defs>
      {/* Corpo (bem gordinho) */}
      <ellipse cx="50" cy="62" rx="33" ry="28" fill="url(#chubbyGrad)" opacity="0.9" />
      {/* Cabeça */}
      <ellipse cx="50" cy="38" rx="27" ry="24" fill="url(#chubbyGrad)" />
      {/* Barrigão claro */}
      <ellipse cx="50" cy="68" rx="17" ry="13" fill="white" opacity="0.3" />
      {/* Olhos (dois, adoráveis) */}
      <circle cx="40" cy="37" r="9" fill="white" />
      <circle cx="60" cy="37" r="9" fill="white" />
      <circle cx="41" cy="38" r="5.5" fill="#1a1a2e" />
      <circle cx="61" cy="38" r="5.5" fill="#1a1a2e" />
      <circle cx="42" cy="36" r="2" fill="white" />
      <circle cx="62" cy="36" r="2" fill="white" />
      {/* Blush */}
      <ellipse cx="32" cy="45" rx="4" ry="3" fill="#f43f5e" opacity="0.25" />
      <ellipse cx="68" cy="45" rx="4" ry="3" fill="#f43f5e" opacity="0.25" />
      {/* Orelhas pontudas */}
      <path d="M34 18 L28 6 L42 14Z" fill={color} />
      <path d="M66 18 L72 6 L58 14Z" fill={color} />
      {/* Boca */}
      <path d="M42 54 Q50 61 58 54" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Mãozinhas */}
      <ellipse cx="28" cy="58" rx="5" ry="4" fill={color} opacity="0.7" />
      <ellipse cx="72" cy="58" rx="5" ry="4" fill={color} opacity="0.7" />
    </svg>
  );
}

function CleverStage({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id="cleverGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="70%" stopColor={color} />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
      </defs>
      {/* Corpo */}
      <ellipse cx="50" cy="64" rx="29" ry="23" fill="url(#cleverGrad)" opacity="0.9" />
      {/* Cabeça */}
      <ellipse cx="50" cy="37" rx="25" ry="23" fill="url(#cleverGrad)" />
      {/* Três olhos (inteligência!) */}
      <circle cx="35" cy="36" r="7" fill="white" />
      <circle cx="50" cy="32" r="8" fill="white" />
      <circle cx="65" cy="36" r="7" fill="white" />
      <circle cx="36" cy="37" r="4.5" fill="#1a1a2e" />
      <circle cx="51" cy="33" r="5"   fill="#1a1a2e" />
      <circle cx="66" cy="37" r="4.5" fill="#1a1a2e" />
      <circle cx="37" cy="35" r="1.5" fill="white" />
      <circle cx="52" cy="31" r="1.8" fill="white" />
      <circle cx="67" cy="35" r="1.5" fill="white" />
      {/* Chifres pequenos */}
      <path d="M35 16 L30 3 L42 12Z" fill={color} opacity="0.9" />
      <path d="M65 16 L70 3 L58 12Z" fill={color} opacity="0.9" />
      {/* Braços-tentáculo */}
      <path d="M20 54 Q10 42 18 36 Q22 46 26 50Z" fill={color} opacity="0.6" />
      <path d="M80 54 Q90 42 82 36 Q78 46 74 50Z" fill={color} opacity="0.6" />
      {/* Sorriso astuto */}
      <path d="M40 56 Q50 64 60 56" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Lâmpada (ideia!) */}
      <circle cx="72" cy="20" r="5" fill="#fbbf24" opacity="0.8" />
      <circle cx="72" cy="18" r="1.5" fill="white" opacity="0.6" />
    </svg>
  );
}

function WiseStage({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="wiseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {/* Corpo com manto */}
      <ellipse cx="50" cy="66" rx="31" ry="23" fill="url(#wiseGrad)" opacity="0.9" />
      <rect x="28" y="60" width="44" height="30" rx="12" fill={color} opacity="0.3" />
      {/* Cabeça */}
      <ellipse cx="50" cy="38" rx="25" ry="24" fill="url(#wiseGrad)" />
      {/* Óculos */}
      <circle cx="40" cy="36" r="9" fill="none" stroke="#1e3a5f" strokeWidth="2" />
      <circle cx="60" cy="36" r="9" fill="none" stroke="#1e3a5f" strokeWidth="2" />
      <line x1="49" y1="36" x2="51" y2="36" stroke="#1e3a5f" strokeWidth="2" />
      {/* Olhos atrás dos óculos */}
      <circle cx="40" cy="37" r="5" fill="white" />
      <circle cx="60" cy="37" r="5" fill="white" />
      <circle cx="41" cy="38" r="3" fill="#1a1a2e" />
      <circle cx="61" cy="38" r="3" fill="#1a1a2e" />
      <circle cx="42" cy="36" r="1.2" fill="white" />
      <circle cx="62" cy="36" r="1.2" fill="white" />
      {/* Barba branca */}
      <path d="M32 48 Q50 72 68 48" fill="white" opacity="0.85" />
      {/* Sobrancelhas (sábias, erguidas) */}
      <path d="M32 30 Q40 27 48 31" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M68 30 Q60 27 52 31" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Livro */}
      <rect x="28" y="72" width="16" height="12" rx="2" fill="#fbbf24" opacity="0.8" transform="rotate(-15 36 78)" />
      <line x1="32" y1="75" x2="42" y2="72" stroke="#b45309" strokeWidth="0.8" opacity="0.5" />
      {/* Estrelas místicas */}
      <circle cx="75" cy="22" r="2" fill="#fbbf24" opacity="0.8" />
      <circle cx="22" cy="28" r="1.5" fill="#fbbf24" opacity="0.6" />
      <circle cx="68" cy="16" r="1" fill="#fbbf24" opacity="0.5" />
    </svg>
  );
}

function VeteranStage({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id="vetGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="70%" stopColor={color} />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
      </defs>
      {/* Corpo */}
      <ellipse cx="50" cy="66" rx="33" ry="25" fill="url(#vetGrad)" opacity="0.9" />
      {/* Armadura peitoral */}
      <ellipse cx="50" cy="62" rx="18" ry="12" fill="white" opacity="0.15" />
      <path d="M38 58 Q50 52 62 58" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
      {/* Cabeça */}
      <ellipse cx="50" cy="37" rx="27" ry="25" fill="url(#vetGrad)" />
      {/* Quatro olhos */}
      <circle cx="33" cy="33" r="7" fill="white" />
      <circle cx="45" cy="30" r="8" fill="white" />
      <circle cx="57" cy="30" r="8" fill="white" />
      <circle cx="69" cy="33" r="7" fill="white" />
      <circle cx="34" cy="34" r="4.5" fill="#1a1a2e" />
      <circle cx="46" cy="31" r="5"   fill="#1a1a2e" />
      <circle cx="58" cy="31" r="5"   fill="#1a1a2e" />
      <circle cx="70" cy="34" r="4.5" fill="#1a1a2e" />
      <circle cx="35" cy="32" r="1.5" fill="white" />
      <circle cx="47" cy="29" r="1.8" fill="white" />
      <circle cx="59" cy="29" r="1.8" fill="white" />
      <circle cx="71" cy="32" r="1.5" fill="white" />
      {/* Cicatriz */}
      <line x1="28" y1="36" x2="36" y2="40" stroke="#991b1b" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <line x1="28" y1="36" x2="30" y2="38" stroke="#991b1b" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      {/* Chifres de batalha */}
      <path d="M34 14 L26 1 L42 10Z" fill={color} />
      <path d="M66 14 L74 1 L58 10Z" fill={color} />
      {/* Asas */}
      <path d="M14 58 Q0 44 12 32 Q20 48 28 54Z" fill={color} opacity="0.7" />
      <path d="M86 58 Q100 44 88 32 Q80 48 72 54Z" fill={color} opacity="0.7" />
      {/* Sorriso confiante */}
      <path d="M38 58 Q50 68 62 58" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Espada */}
      <rect x="22" y="68" width="3" height="18" rx="1" fill="#cbd5e1" opacity="0.7" />
      <rect x="20" y="64" width="7" height="3" rx="1" fill="#fbbf24" opacity="0.6" />
    </svg>
  );
}

function LegendaryStage({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id="legGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor="#9d174d" />
        </radialGradient>
        <filter id="glowL">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Capa */}
      <path d="M28 40 Q18 70 12 92 Q50 84 88 92 Q82 70 72 40Z" fill={color} opacity="0.25" />
      {/* Corpo */}
      <ellipse cx="50" cy="64" rx="33" ry="25" fill="url(#legGrad)" opacity="0.95" />
      {/* Cabeça */}
      <ellipse cx="50" cy="36" rx="29" ry="26" fill="url(#legGrad)" />
      {/* Coroa dourada */}
      <path d="M24 22 L32 6 L40 18 L50 4 L60 18 L68 6 L76 22Z" fill="#fbbf24" opacity="0.95" filter="url(#glowL)" />
      <circle cx="50" cy="4" r="3" fill="#f59e0b" opacity="0.9" />
      <circle cx="32" cy="6" r="1.8" fill="#f59e0b" opacity="0.7" />
      <circle cx="68" cy="6" r="1.8" fill="#f59e0b" opacity="0.7" />
      {/* Cinco olhos */}
      <circle cx="30" cy="33" r="6" fill="white" />
      <circle cx="42" cy="28" r="7" fill="white" />
      <circle cx="55" cy="28" r="7" fill="white" />
      <circle cx="67" cy="33" r="6" fill="white" />
      <circle cx="49" cy="41" r="5" fill="white" />
      <circle cx="31" cy="34" r="3.8" fill="#1a1a2e" />
      <circle cx="43" cy="29" r="4.5" fill="#1a1a2e" />
      <circle cx="56" cy="29" r="4.5" fill="#1a1a2e" />
      <circle cx="68" cy="34" r="3.8" fill="#1a1a2e" />
      <circle cx="50" cy="42" r="3.2" fill="#1a1a2e" />
      <circle cx="32" cy="32" r="1.3" fill="white" />
      <circle cx="44" cy="27" r="1.5" fill="white" />
      <circle cx="57" cy="27" r="1.5" fill="white" />
      <circle cx="69" cy="32" r="1.3" fill="white" />
      <circle cx="51" cy="40" r="1.2" fill="white" />
      {/* Asas majestosas */}
      <path d="M14 60 Q-2 44 10 30 Q18 50 28 56Z" fill={color} opacity="0.75" />
      <path d="M86 60 Q102 44 90 30 Q82 50 72 56Z" fill={color} opacity="0.75" />
      <path d="M14 62 Q0 54 8 42 Q16 54 24 58Z" fill={color} opacity="0.5" />
      <path d="M86 62 Q100 54 92 42 Q84 54 76 58Z" fill={color} opacity="0.5" />
      {/* Brilhos flutuantes */}
      <circle cx="22" cy="20" r="2.5" fill="#fbbf24" opacity="0.8" />
      <circle cx="78" cy="20" r="2.5" fill="#fbbf24" opacity="0.8" />
      <circle cx="50" cy="12" r="2" fill="#fbbf24" opacity="0.9" />
      {/* Sorriso majestoso */}
      <path d="M36 60 Q50 70 64 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function MythicalStage({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id="mythGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="40%" stopColor={color} />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
        <filter id="glowM">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="20%" stopColor="#f59e0b" />
          <stop offset="40%" stopColor="#10b981" />
          <stop offset="60%" stopColor="#3b82f6" />
          <stop offset="80%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* Aura rainbow */}
      <ellipse cx="50" cy="58" rx="40" ry="38" fill="none" stroke="url(#rainbow)" strokeWidth="2" opacity="0.4" filter="url(#glowM)" />
      <ellipse cx="50" cy="58" rx="46" ry="44" fill="none" stroke="url(#rainbow)" strokeWidth="1" opacity="0.2" />
      {/* Capa celestial */}
      <path d="M24 38 Q14 72 8 96 Q50 88 92 96 Q86 72 76 38Z" fill={color} opacity="0.2" />
      {/* Corpo */}
      <ellipse cx="50" cy="64" rx="34" ry="26" fill="url(#mythGrad)" opacity="0.95" />
      {/* Cabeça */}
      <ellipse cx="50" cy="36" rx="30" ry="27" fill="url(#mythGrad)" />
      {/* Coroa tripla (arco-íris) */}
      <path d="M22 22 L32 8 L40 20 L50 6 L60 20 L68 8 L78 22Z" fill="url(#rainbow)" opacity="0.9" filter="url(#glowM)" />
      <circle cx="50" cy="6" r="3" fill="white" opacity="0.9" />
      <circle cx="32" cy="8" r="1.5" fill="white" opacity="0.7" />
      <circle cx="68" cy="8" r="1.5" fill="white" opacity="0.7" />
      {/* Sete olhos (onisciência) */}
      <circle cx="27" cy="33" r="5.5" fill="white" />
      <circle cx="39" cy="28" r="6.5" fill="white" />
      <circle cx="51" cy="27" r="6.5" fill="white" />
      <circle cx="63" cy="28" r="6.5" fill="white" />
      <circle cx="75" cy="33" r="5.5" fill="white" />
      <circle cx="44" cy="40" r="5" fill="white" />
      <circle cx="58" cy="40" r="5" fill="white" />
      <circle cx="28" cy="34" r="3.5" fill="#1a1a2e" />
      <circle cx="40" cy="29" r="4" fill="#1a1a2e" />
      <circle cx="52" cy="28" r="4" fill="#1a1a2e" />
      <circle cx="64" cy="29" r="4" fill="#1a1a2e" />
      <circle cx="76" cy="34" r="3.5" fill="#1a1a2e" />
      <circle cx="45" cy="41" r="3" fill="#1a1a2e" />
      <circle cx="59" cy="41" r="3" fill="#1a1a2e" />
      <circle cx="29" cy="32" r="1.2" fill="white" />
      <circle cx="41" cy="27" r="1.5" fill="white" />
      <circle cx="53" cy="26" r="1.5" fill="white" />
      <circle cx="65" cy="27" r="1.5" fill="white" />
      <circle cx="77" cy="32" r="1.2" fill="white" />
      <circle cx="46" cy="39" r="1.2" fill="white" />
      <circle cx="60" cy="39" r="1.2" fill="white" />
      {/* Asas celestiais */}
      <path d="M12 62 Q-4 44 8 28 Q16 50 26 56Z" fill={color} opacity="0.7" />
      <path d="M88 62 Q104 44 92 28 Q84 50 74 56Z" fill={color} opacity="0.7" />
      <path d="M12 64 Q-2 54 6 40 Q14 54 24 60Z" fill="url(#rainbow)" opacity="0.35" />
      <path d="M88 64 Q102 54 94 40 Q86 54 76 60Z" fill="url(#rainbow)" opacity="0.35" />
      {/* Brilhos estelares */}
      <circle cx="20" cy="18" r="2.5" fill="white" opacity="0.9" filter="url(#glowM)" />
      <circle cx="80" cy="18" r="2.5" fill="white" opacity="0.9" filter="url(#glowM)" />
      <circle cx="50" cy="10" r="2" fill="white" opacity="0.9" />
      <circle cx="14" cy="38" r="1.5" fill="#fbbf24" opacity="0.6" />
      <circle cx="86" cy="38" r="1.5" fill="#fbbf24" opacity="0.6" />
      {/* Sorriso transcendental */}
      <path d="M34 62 Q50 74 66 62" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#glowM)" />
    </svg>
  );
}

const SVGS = [EggStage, BabyStage, ChubbyStage, CleverStage, WiseStage, VeteranStage, LegendaryStage, MythicalStage];

// ════════════════════════════════════════════════════════════
//  Mascot Component
// ════════════════════════════════════════════════════════════
export default function Mascot({ level = 0, streakCount = 0, isTimerRunning = false }) {
  const [isJumping, setIsJumping] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  const safeLevel = Math.min(level, STAGES.length - 1);
  const stage = STAGES[safeLevel];
  const SVGComponent = SVGS[safeLevel];

  // ── Barra de progresso ──────────────────────────────────
  const nextStage = STAGES[safeLevel + 1];
  const prevThreshold = safeLevel > 0 ? (STAGES[safeLevel - 1].threshold ?? 0) : 0;
  const progressPct = nextStage
    ? Math.min(((streakCount - prevThreshold) / ((nextStage.threshold ?? 1) - prevThreshold)) * 100, 100)
    : 100;

  // ── Clique: só o mascote (SVG) pula + partículas ────────
  const handleClick = useCallback(() => {
    if (isJumping) return;
    setIsJumping(true);

    const newSparkles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 90,
      y: (Math.random() - 0.5) * 90 - 20,
      size: Math.random() * 7 + 3,
      color: stage.color,
      delay: Math.random() * 0.12,
    }));
    setSparkles((prev) => [...prev, ...newSparkles]);

    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !newSparkles.includes(s)));
    }, 700);

    setTimeout(() => setIsJumping(false), 600);
  }, [isJumping, stage.color]);

  // ── Estrelas decorativas por nível ──────────────────────
  const levelStars = safeLevel === STAGES.length - 1 ? "⭐✨🌟" : "⭐".repeat(safeLevel) || "";

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">
        Seu bichinho
      </p>

      {/* ── Frame do mascote (fixo, não pula) ────────────── */}
      <div className="relative flex items-center justify-center w-40 h-40">
        {/* Círculo de fundo (estático) */}
        <div
          className="absolute inset-0 rounded-full shadow-md transition-colors duration-500"
          style={{
            backgroundColor: stage.bg,
            boxShadow: `0 0 0 3px ${stage.color}20, 0 4px 18px ${stage.color}40`,
          }}
        />

        {/* Efeito de ping quando timer está rodando */}
        {isTimerRunning && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: stage.color }}
          />
        )}

        {/* Sparkle particles */}
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full animate-ping pointer-events-none"
            style={{
              left: `calc(50% + ${s.x}px)`,
              top: `calc(50% + ${s.y}px)`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              backgroundColor: s.color,
              animationDuration: "500ms",
              animationDelay: `${s.delay}s`,
              opacity: 0,
            }}
          />
        ))}

        {/* Mascote SVG — só ele pula! */}
        <button
          onClick={handleClick}
          aria-label="Interagir com o mascote"
          className="relative z-10 w-32 h-32 flex items-center justify-center cursor-pointer select-none focus:outline-none transition-transform duration-200 active:scale-95"
        >
          <div
            className={`w-full h-full transition-transform duration-300 ${
              isJumping ? "animate-bounce" : ""
            } ${isTimerRunning ? "scale-110" : "scale-100"}`}
          >
            <SVGComponent color={stage.color} />
          </div>
        </button>
      </div>

      {/* Nome + streak */}
      <div className="text-center">
        <p
          className="text-sm font-bold tracking-wide transition-colors duration-500"
          style={{ color: stage.color }}
        >
          {stage.label.toUpperCase()}
        </p>
        {levelStars && (
          <p className="text-[10px] mt-0.5 tracking-wider">{levelStars}</p>
        )}
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          🔥 {streakCount} {streakCount === 1 ? "dia seguido" : "dias seguidos"}
        </p>
        <p className="text-[10px] text-[#9CA3AF]">
          Nível {safeLevel + 1}/8
        </p>
      </div>

      {/* Barra de evolução */}
      {nextStage && (
        <div className="w-full max-w-[200px]">
          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
            <span>
              Próximo:{" "}
              <span className="font-medium" style={{ color: nextStage.color }}>
                {nextStage.label}
              </span>
            </span>
            <span>
              {streakCount}/{nextStage.threshold}D
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[#E8E4DC] overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(progressPct, 5)}%`,
                background: `linear-gradient(90deg, ${stage.color}99, ${stage.color})`,
                boxShadow: `0 0 6px ${stage.color}60`,
              }}
            />
          </div>
        </div>
      )}

      {!nextStage && (
        <div className="flex flex-col items-center gap-1">
          <p
            className="text-xs font-medium px-4 py-1.5 rounded-full animate-pulse"
            style={{ color: stage.color, backgroundColor: stage.bg }}
          >
            ✨ Evolução máxima! ✨
          </p>
          <p className="text-[10px] text-[#9CA3AF]">
            Você atingiu o nível Mítico — parabéns pela dedicação!
          </p>
        </div>
      )}

      <p className="text-[10px] text-[#9CA3AF]">Clique no bichinho para interagir! 👆</p>
    </div>
  );
}