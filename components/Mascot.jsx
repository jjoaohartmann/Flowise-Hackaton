"use client";

import { useState } from "react";

const STAGES = [
  { label: "Caçula",   color: "#10b981", bg: "#ecfdf5", threshold: 1  },
  { label: "Gordinho", color: "#06b6d4", bg: "#ecfeff", threshold: 3  },
  { label: "Esperto",  color: "#8b5cf6", bg: "#f5f3ff", threshold: 7  },
  { label: "Veterano", color: "#f59e0b", bg: "#fffbeb", threshold: 14 },
  { label: "Lendário", color: "#ef4444", bg: "#fef2f2", threshold: null },
];

function Baby({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="58" rx="28" ry="30" fill={color} opacity=".9"/>
      <ellipse cx="50" cy="40" rx="22" ry="22" fill={color}/>
      <circle cx="50" cy="40" r="11" fill="white"/>
      <circle cx="50" cy="41" r="7"  fill="#1a1a2e"/>
      <circle cx="53" cy="38" r="2.5" fill="white"/>
      <path d="M44 52 Q50 57 56 52" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="28" cy="36" rx="5" ry="7" fill={color} opacity=".7"/>
      <ellipse cx="72" cy="36" rx="5" ry="7" fill={color} opacity=".7"/>
    </svg>
  );
}

function Chubby({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="60" rx="32" ry="28" fill={color} opacity=".9"/>
      <ellipse cx="50" cy="38" rx="26" ry="24" fill={color}/>
      <circle cx="42" cy="37" r="8" fill="white"/>
      <circle cx="58" cy="37" r="8" fill="white"/>
      <circle cx="43" cy="38" r="5" fill="#1a1a2e"/>
      <circle cx="59" cy="38" r="5" fill="#1a1a2e"/>
      <circle cx="44" cy="36" r="1.8" fill="white"/>
      <circle cx="60" cy="36" r="1.8" fill="white"/>
      <ellipse cx="35" cy="46" rx="5" ry="3" fill="white" opacity=".3"/>
      <ellipse cx="65" cy="46" rx="5" ry="3" fill="white" opacity=".3"/>
      <path d="M40 18 L36 8 L44 14Z" fill={color}/>
      <path d="M60 18 L64 8 L56 14Z" fill={color}/>
      <path d="M44 54 Q50 60 56 54" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function Clever({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="62" rx="30" ry="26" fill={color} opacity=".9"/>
      <ellipse cx="50" cy="37" rx="26" ry="24" fill={color}/>
      <circle cx="36" cy="37" r="7" fill="white"/>
      <circle cx="50" cy="33" r="8" fill="white"/>
      <circle cx="64" cy="37" r="7" fill="white"/>
      <circle cx="37" cy="38" r="4.5" fill="#1a1a2e"/>
      <circle cx="51" cy="34" r="5"   fill="#1a1a2e"/>
      <circle cx="65" cy="38" r="4.5" fill="#1a1a2e"/>
      <circle cx="38" cy="36" r="1.5" fill="white"/>
      <circle cx="52" cy="32" r="1.5" fill="white"/>
      <circle cx="66" cy="36" r="1.5" fill="white"/>
      <path d="M38 16 L33 4 L42 12Z"  fill={color} opacity=".8"/>
      <path d="M62 16 L67 4 L58 12Z"  fill={color} opacity=".8"/>
      <path d="M20 52 Q10 42 18 36 Q22 44 26 48Z" fill={color} opacity=".6"/>
      <path d="M80 52 Q90 42 82 36 Q78 44 74 48Z" fill={color} opacity=".6"/>
      <path d="M43 56 Q50 63 57 56" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function Veteran({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="64" rx="32" ry="26" fill={color} opacity=".9"/>
      <ellipse cx="50" cy="37" rx="28" ry="26" fill={color}/>
      <circle cx="34" cy="33" r="7"  fill="white"/>
      <circle cx="46" cy="30" r="8"  fill="white"/>
      <circle cx="58" cy="30" r="8"  fill="white"/>
      <circle cx="68" cy="33" r="7"  fill="white"/>
      <circle cx="35" cy="34" r="4.5" fill="#1a1a2e"/>
      <circle cx="47" cy="31" r="5"   fill="#1a1a2e"/>
      <circle cx="59" cy="31" r="5"   fill="#1a1a2e"/>
      <circle cx="69" cy="34" r="4.5" fill="#1a1a2e"/>
      <circle cx="36" cy="32" r="1.5" fill="white"/>
      <circle cx="48" cy="29" r="1.5" fill="white"/>
      <circle cx="60" cy="29" r="1.5" fill="white"/>
      <circle cx="70" cy="32" r="1.5" fill="white"/>
      <path d="M36 14 L28 2  L42 10Z"  fill={color}/>
      <path d="M64 14 L72 2  L58 10Z"  fill={color}/>
      <path d="M18 56 Q4 44 14 34 Q20 46 26 52Z"  fill={color} opacity=".7"/>
      <path d="M82 56 Q96 44 86 34 Q80 46 74 52Z"  fill={color} opacity=".7"/>
      <path d="M42 58 Q50 65 58 58" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function Legendary({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="64" rx="34" ry="26" fill={color} opacity=".9"/>
      <ellipse cx="50" cy="36" rx="30" ry="27" fill={color}/>
      <path d="M28 22 L34 10 L42 18 L50 8 L58 18 L66 10 L72 22Z" fill="#fbbf24" opacity=".9"/>
      <circle cx="32" cy="33" r="6"  fill="white"/>
      <circle cx="43" cy="29" r="7"  fill="white"/>
      <circle cx="55" cy="29" r="7"  fill="white"/>
      <circle cx="66" cy="33" r="6"  fill="white"/>
      <circle cx="49" cy="42" r="5"  fill="white"/>
      <circle cx="33" cy="34" r="4"   fill="#1a1a2e"/>
      <circle cx="44" cy="30" r="4.5" fill="#1a1a2e"/>
      <circle cx="56" cy="30" r="4.5" fill="#1a1a2e"/>
      <circle cx="67" cy="34" r="4"   fill="#1a1a2e"/>
      <circle cx="50" cy="43" r="3.5" fill="#1a1a2e"/>
      <circle cx="34" cy="32" r="1.5" fill="white"/>
      <circle cx="45" cy="28" r="1.5" fill="white"/>
      <circle cx="57" cy="28" r="1.5" fill="white"/>
      <circle cx="68" cy="32" r="1.5" fill="white"/>
      <circle cx="51" cy="41" r="1.5" fill="white"/>
      <path d="M16 60 Q0 46 12 32 Q18 50 28 56Z"   fill={color} opacity=".75"/>
      <path d="M84 60 Q100 46 88 32 Q82 50 72 56Z"  fill={color} opacity=".75"/>
      <path d="M16 62 Q2 54 8 44 Q16 54 24 58Z"    fill={color} opacity=".5"/>
      <path d="M84 62 Q98 54 92 44 Q84 54 76 58Z"   fill={color} opacity=".5"/>
      <circle cx="20" cy="22" r="3" fill="#fbbf24" opacity=".7"/>
      <circle cx="80" cy="22" r="3" fill="#fbbf24" opacity=".7"/>
      <circle cx="50" cy="14" r="3" fill="#fbbf24" opacity=".8"/>
      <path d="M40 60 Q50 68 60 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

const SVGS = [Baby, Chubby, Clever, Veteran, Legendary];

export default function Mascot({ level = 0, streakCount = 0, isTimerRunning = false }) {
  const [isJumping, setIsJumping] = useState(false);

  const safeLevel    = Math.min(level, STAGES.length - 1);
  const stage        = STAGES[safeLevel];
  const SVGComponent = SVGS[safeLevel];

  const nextStage     = STAGES[safeLevel + 1];
  const prevThreshold = safeLevel > 0 ? (STAGES[safeLevel - 1].threshold ?? 0) : 0;
  const progressPct   = nextStage
    ? Math.min(((streakCount - prevThreshold) / ((nextStage.threshold ?? 1) - prevThreshold)) * 100, 100)
    : 100;

  function handleClick() {
    if (isJumping) return;
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 600);
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">
        Seu bichinho
      </p>

      {/* Frame clicável do mascote */}
      <button
        onClick={handleClick}
        aria-label="Interagir com o mascote"
        className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-300 cursor-pointer select-none focus:outline-none ${
          isJumping      ? "animate-bounce" : ""
        } ${isTimerRunning ? "scale-105"    : "scale-100"}`}
        style={{ backgroundColor: stage.bg }}
      >
        {isTimerRunning && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: stage.color }}
          />
        )}
        <div className="w-24 h-24">
          <SVGComponent color={stage.color} />
        </div>
      </button>

      {/* Nome + streak */}
      <div className="text-center">
        <p className="text-sm font-bold tracking-wide" style={{ color: stage.color }}>
          {stage.label.toUpperCase()}
        </p>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          🔥 {streakCount} {streakCount === 1 ? "dia seguido" : "dias seguidos"}
        </p>
      </div>

      {/* Barra de evolução */}
      {nextStage && (
        <div className="w-full max-w-[180px]">
          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
            <span>
              Próximo:{" "}
              <span className="font-medium" style={{ color: stage.color }}>
                {nextStage.label}
              </span>
            </span>
            <span>{streakCount}/{nextStage.threshold}D</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#E8E4DC] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, backgroundColor: stage.color }}
            />
          </div>
        </div>
      )}

      {!nextStage && (
        <p className="text-xs font-medium px-3 py-1 rounded-full"
           style={{ color: stage.color, backgroundColor: stage.bg }}>
          ✨ Evolução máxima!
        </p>
      )}

      <p className="text-[10px] text-[#9CA3AF]">Clique no bichinho para interagir! 👆</p>
    </div>
  );
}
