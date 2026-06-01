"use client";

// RF-06 — Mascote virtual com 5 estágios de evolução
// Nível cresce conforme o streak diário (RN-03)

const STAGES = [
  { label: "Semente",   color: "#8B7355", bg: "#FDF6E3" },
  { label: "Broto",     color: "#52A756", bg: "#F0FAF0" },
  { label: "Muda",      color: "#2D9E4F", bg: "#E8F8EC" },
  { label: "Planta",    color: "#1E7A3C", bg: "#D9F2E3" },
  { label: "Floresceu", color: "#166B32", bg: "#C6EDCE" },
];

function SeedSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <ellipse cx="50" cy="62" rx="14" ry="10" fill="#C8A97A" />
      <ellipse cx="50" cy="58" rx="10" ry="14" fill="#A67C52" />
      <line x1="50" y1="44" x2="50" y2="38" stroke="#A67C52" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function SproutSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <rect x="47" y="45" width="6" height="28" rx="3" fill="#4CAF50" />
      <ellipse cx="50" cy="73" rx="16" ry="6" fill="#795548" opacity="0.4" />
      <path d="M50 52 Q35 42 38 30 Q50 36 50 52Z" fill="#66BB6A" />
      <path d="M50 48 Q65 38 62 26 Q50 32 50 48Z" fill="#81C784" />
    </svg>
  );
}

function SeedlingSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <rect x="46" y="38" width="8" height="36" rx="4" fill="#388E3C" />
      <ellipse cx="50" cy="74" rx="18" ry="7" fill="#795548" opacity="0.4" />
      <path d="M50 58 Q28 48 30 28 Q50 36 50 58Z" fill="#4CAF50" />
      <path d="M50 50 Q72 40 70 20 Q50 28 50 50Z" fill="#66BB6A" />
      <path d="M50 42 Q38 34 40 22 Q50 28 50 42Z" fill="#81C784" />
    </svg>
  );
}

function PlantSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <rect x="45" y="32" width="10" height="44" rx="5" fill="#2E7D32" />
      <ellipse cx="50" cy="76" rx="20" ry="8" fill="#795548" opacity="0.4" />
      <path d="M50 62 Q20 52 22 28 Q50 38 50 62Z" fill="#388E3C" />
      <path d="M50 54 Q80 44 78 20 Q50 30 50 54Z" fill="#43A047" />
      <path d="M50 44 Q30 36 32 20 Q50 26 50 44Z" fill="#4CAF50" />
      <path d="M50 36 Q70 28 68 14 Q50 20 50 36Z" fill="#66BB6A" />
    </svg>
  );
}

function BloomSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <rect x="45" y="34" width="10" height="44" rx="5" fill="#1B5E20" />
      <ellipse cx="50" cy="78" rx="22" ry="8" fill="#795548" opacity="0.4" />
      {/* Folhas */}
      <path d="M50 64 Q18 54 20 28 Q50 40 50 64Z" fill="#2E7D32" />
      <path d="M50 56 Q82 46 80 20 Q50 32 50 56Z" fill="#388E3C" />
      <path d="M50 46 Q28 38 30 18 Q50 26 50 46Z" fill="#43A047" />
      <path d="M50 38 Q72 30 70 12 Q50 20 50 38Z" fill="#4CAF50" />
      {/* Flor */}
      <circle cx="50" cy="22" r="10" fill="#FFF176" />
      <circle cx="50" cy="12" r="6" fill="#FFD54F" />
      <circle cx="60" cy="22" r="6" fill="#FFD54F" />
      <circle cx="40" cy="22" r="6" fill="#FFD54F" />
      <circle cx="57" cy="14" r="6" fill="#FFCA28" />
      <circle cx="43" cy="14" r="6" fill="#FFCA28" />
      <circle cx="50" cy="22" r="5" fill="#FF8F00" />
      {/* Brilhos */}
      <circle cx="44" cy="8" r="2" fill="#FFF9C4" opacity="0.8"/>
      <circle cx="60" cy="10" r="1.5" fill="#FFF9C4" opacity="0.8"/>
    </svg>
  );
}

const SVG_BY_LEVEL = [SeedSVG, SproutSVG, SeedlingSVG, PlantSVG, BloomSVG];

export default function Mascot({ level = 0, streakCount = 0, isTimerRunning = false }) {
  const stage = STAGES[level] ?? STAGES[0];
  const SvgComponent = SVG_BY_LEVEL[level] ?? SeedSVG;

  const nextLevel = STAGES[level + 1];
  const streakNeeded = [0, 1, 3, 7, 14];
  const nextThreshold = streakNeeded[level + 1];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mascote */}
      <div
        className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700"
        style={{ backgroundColor: stage.bg }}
        role="img"
        aria-label={`Mascote no estágio ${stage.label}`}
      >
        <div
          className={`w-24 h-24 transition-transform duration-300 ${
            isTimerRunning ? "scale-110" : "scale-100"
          }`}
        >
          <SvgComponent />
        </div>

        {/* Pulso animado quando timer rodando */}
        {isTimerRunning && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: stage.color }}
          />
        )}
      </div>

      {/* Nome do estágio */}
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: stage.color }}>
          {stage.label}
        </p>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          {streakCount} {streakCount === 1 ? "dia seguido" : "dias seguidos"}
        </p>
      </div>

      {/* Barra de progresso para próximo nível */}
      {nextLevel && nextThreshold && (
        <div className="w-full max-w-[180px]">
          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
            <span>Próximo: {nextLevel.label}</span>
            <span>{Math.min(streakCount, nextThreshold)}/{nextThreshold} dias</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#E8E4DC] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: stage.color,
                width: `${Math.min((streakCount / nextThreshold) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {level === 4 && (
        <p className="text-xs text-[#2D6A4F] font-medium bg-[#E8F5EF] px-3 py-1 rounded-full">
          🌸 Evolução máxima!
        </p>
      )}
    </div>
  );
}
