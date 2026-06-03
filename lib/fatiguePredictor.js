// ─────────────────────────────────────────────────────────────────────────────
// RN-PREDICT-01 — ALGORITMO PREDITIVO DE EXAUSTÃO
//
// Cruza dados de tempo de foco (streak.js/focusHistory) com registros
// emocionais (bemEstar.js/coleção emocoes) para calcular um score de
// risco de exaustão e sugerir pausas obrigatórias antes que ela ocorra.
//
// Fatores considerados:
//   1. Tempo contínuo de foco sem pausa (minutos)
//   2. Minutos totais focados no dia (dailyFocusMinutes)
//   3. Percentual da meta diária já atingido
//   4. Emoções negativas recentes (cansado, estressado, frustrado)
//   5. Intensidade média das emoções negativas
//   6. Tendência emocional (piora nas últimas horas)
//   7. Horas de sono da rotina (se disponível)
//   8. Dias consecutivos de ofensiva (streak) — fadiga acumulada
//
// OUTPUT:
//   - riskScore: 0–100 (percentual de risco)
//   - riskLevel: 'low' | 'moderate' | 'high' | 'critical'
//   - mandatoryBreak: boolean (pausa obrigatória)
//   - suggestedBreakMinutes: duração sugerida da pausa
//   - reasons: array de motivos que contribuíram para o score
//   - cooldownMinutes: minutos restantes de cooldown (se aplicável)
// ─────────────────────────────────────────────────────────────────────────────

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { loadRoutine } from "./bemEstar";

// ── Pesos do algoritmo (calibrados) ─────────────────────────────────────────
const WEIGHTS = {
  continuousFocus:    0.25,  // tempo contínuo sem pausa
  dailyOverwork:      0.20,  // excesso em relação à meta diária
  negativeEmotions:   0.25,  // quantidade de emoções negativas recentes
  emotionIntensity:   0.15,  // intensidade das emoções negativas
  emotionalTrend:     0.10,  // tendência de piora
  streakAccumulation: 0.05,  // fadiga por dias consecutivos
};

// ── Thresholds de risco ──────────────────────────────────────────────────────
const RISK_THRESHOLDS = {
  low:      30,  // 0-30: baixo risco
  moderate: 60,  // 31-60: risco moderado (sugestão)
  high:     80,  // 61-80: risco alto (pausa obrigatória)
  critical: 100, // 81+: risco crítico (pausa longa obrigatória)
};

// ── Cooldown entre pausas obrigatórias (minutos) ─────────────────────────────
const MANDATORY_BREAK_COOLDOWN = 45; // 45 min entre uma pausa obrigatória e outra

// ── Labels de emoções consideradas negativas ─────────────────────────────────
const NEGATIVE_EMOTIONS = ["Cansado", "Estressado", "Frustrado", "Ansioso", "Triste"];

/**
 * Função principal: calcula o risco de exaustão cruzando tempo de foco + emoções.
 *
 * @param {string} uid — UID do usuário autenticado
 * @param {object} focusData — { dailyFocusMinutes, continuousFocusMinutes, streakCount, dailyGoalMinutes }
 * @returns {Promise<object>} resultado da predição
 */
export async function predictFatigue(uid, focusData = {}) {
  const {
    dailyFocusMinutes = 0,
    continuousFocusMinutes = 0,
    streakCount = 0,
    dailyGoalMinutes = 480, // default 8h
  } = focusData;

  try {
    // ── 1. Buscar últimas emoções do usuário ──────────────────────────────
    const emotionsRef = collection(db, "emocoes");
    const q = query(
      emotionsRef,
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const snap = await getDocs(q);
    const recentEmotions = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
    }));

    // ── 2. Carregar rotina para dados de sono ─────────────────────────────
    const routine = await loadRoutine(uid);

    // ── 3. Verificar cooldown de pausa obrigatória ────────────────────────
    const cooldownData = await getBreakCooldown(uid);

    // ── 4. Calcular cada fator ────────────────────────────────────────────
    const reasons = [];

    // Fator A: Tempo contínuo de foco
    const continuousScore = calculateContinuousFocusScore(continuousFocusMinutes);
    if (continuousScore > 0) {
      reasons.push({
        factor: "Tempo contínuo de foco",
        detail: `${continuousFocusMinutes}min sem pausa`,
        score: continuousScore,
      });
    }

    // Fator B: Excesso sobre meta diária
    const overworkScore = calculateOverworkScore(dailyFocusMinutes, dailyGoalMinutes);
    if (overworkScore > 0) {
      reasons.push({
        factor: "Excesso sobre meta diária",
        detail: `${Math.round(dailyFocusMinutes)}min de ${dailyGoalMinutes}min`,
        score: overworkScore,
      });
    }

    // Fator C: Emoções negativas recentes
    const negativeEmotionsData = analyzeNegativeEmotions(recentEmotions);
    if (negativeEmotionsData.score > 0) {
      reasons.push({
        factor: "Emoções negativas recentes",
        detail: `${negativeEmotionsData.count} registros negativos em ${recentEmotions.length}`,
        score: negativeEmotionsData.score,
      });
    }

    // Fator D: Intensidade das emoções negativas
    const intensityScore = calculateIntensityScore(negativeEmotionsData);
    if (intensityScore > 0) {
      reasons.push({
        factor: "Intensidade emocional elevada",
        detail: `Média ${negativeEmotionsData.avgIntensity}/10`,
        score: intensityScore,
      });
    }

    // Fator E: Tendência emocional (piora nas últimas horas)
    const trendData = analyzeEmotionalTrend(recentEmotions);
    if (trendData.score > 0) {
      reasons.push({
        factor: "Tendência emocional em queda",
        detail: trendData.description,
        score: trendData.score,
      });
    }

    // Fator F: Fadiga acumulada por streak
    const streakScore = calculateStreakFatigueScore(streakCount);
    if (streakScore > 0) {
      reasons.push({
        factor: "Fadiga acumulada",
        detail: `${streakCount} dias consecutivos de foco`,
        score: streakScore,
      });
    }

    // ── 5. Calcular score ponderado final ─────────────────────────────────
    const totalScore = Math.min(100, Math.round(
      continuousScore * WEIGHTS.continuousFocus +
      overworkScore * WEIGHTS.dailyOverwork +
      negativeEmotionsData.score * WEIGHTS.negativeEmotions +
      intensityScore * WEIGHTS.emotionIntensity +
      trendData.score * WEIGHTS.emotionalTrend +
      streakScore * WEIGHTS.streakAccumulation
    ));

    // ── 6. Determinar nível de risco ──────────────────────────────────────
    let riskLevel = "low";
    if (totalScore >= RISK_THRESHOLDS.critical) riskLevel = "critical";
    else if (totalScore >= RISK_THRESHOLDS.high) riskLevel = "high";
    else if (totalScore >= RISK_THRESHOLDS.moderate) riskLevel = "moderate";

    // ── 7. Determinar se pausa é obrigatória ──────────────────────────────
    const now = Date.now();
    const cooldownActive = cooldownData?.lastBreakAt &&
      (now - cooldownData.lastBreakAt.toDate().getTime()) < MANDATORY_BREAK_COOLDOWN * 60 * 1000;

    const mandatoryBreak = (riskLevel === "high" || riskLevel === "critical") && !cooldownActive;

    // ── 8. Calcular duração sugerida da pausa ─────────────────────────────
    let suggestedBreakMinutes = 5;
    if (riskLevel === "critical") suggestedBreakMinutes = 15;
    else if (riskLevel === "high") suggestedBreakMinutes = 10;
    else if (riskLevel === "moderate") suggestedBreakMinutes = 5;

    // ── 9. Calcular cooldown restante ─────────────────────────────────────
    let cooldownMinutes = 0;
    if (cooldownActive && cooldownData?.lastBreakAt) {
      const elapsed = now - cooldownData.lastBreakAt.toDate().getTime();
      cooldownMinutes = Math.ceil((MANDATORY_BREAK_COOLDOWN * 60 * 1000 - elapsed) / 60000);
    }

    return {
      riskScore: totalScore,
      riskLevel,
      mandatoryBreak,
      suggestedBreakMinutes,
      reasons: reasons.sort((a, b) => b.score - a.score),
      cooldownMinutes,
      cooldownActive,
      recentEmotions: recentEmotions.slice(0, 5),
      negativeEmotionsCount: negativeEmotionsData.count,
      continuousFocusMinutes,
      dailyFocusMinutes,
      evaluatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Erro no predictFatigue:", err);
    return {
      riskScore: 0,
      riskLevel: "low",
      mandatoryBreak: false,
      suggestedBreakMinutes: 5,
      reasons: [],
      cooldownMinutes: 0,
      cooldownActive: false,
      recentEmotions: [],
      negativeEmotionsCount: 0,
      continuousFocusMinutes,
      dailyFocusMinutes,
      error: err.message,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Registra que uma pausa obrigatória foi realizada (inicia cooldown).
 * Caminho: users/{uid}/settings/fatigueCooldown
 */
export async function recordMandatoryBreak(uid) {
  const ref = doc(db, "users", uid, "settings", "fatigueCooldown");
  await setDoc(ref, {
    lastBreakAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Recupera o estado de cooldown de pausa obrigatória.
 */
async function getBreakCooldown(uid) {
  try {
    const ref = doc(db, "users", uid, "settings", "fatigueCooldown");
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

// ── FUNÇÕES DE CÁLCULO DE FATORES ──────────────────────────────────────────

/**
 * Fator A: Score baseado em tempo contínuo de foco sem pausa.
 * 0-30min → 0 | 30-60min → 20 | 60-90min → 50 | 90-120min → 80 | 120+ → 100
 */
function calculateContinuousFocusScore(minutes) {
  if (minutes < 30) return 0;
  if (minutes < 60) return Math.round(((minutes - 30) / 30) * 20);
  if (minutes < 90) return 20 + Math.round(((minutes - 60) / 30) * 30);
  if (minutes < 120) return 50 + Math.round(((minutes - 90) / 30) * 30);
  return Math.min(100, 80 + Math.round(((minutes - 120) / 60) * 20));
}

/**
 * Fator B: Score baseado em quanto excedeu a meta diária.
 * Abaixo de 80% → 0 | 80-100% → 20 | 100-130% → 50 | 130-160% → 80 | 160%+ → 100
 */
function calculateOverworkScore(dailyMinutes, goalMinutes) {
  if (goalMinutes <= 0) return 0;
  const ratio = dailyMinutes / goalMinutes;
  if (ratio < 0.8) return 0;
  if (ratio < 1.0) return Math.round(((ratio - 0.8) / 0.2) * 20);
  if (ratio < 1.3) return 20 + Math.round(((ratio - 1.0) / 0.3) * 30);
  if (ratio < 1.6) return 50 + Math.round(((ratio - 1.3) / 0.3) * 30);
  return Math.min(100, 80 + Math.round(((ratio - 1.6) / 0.4) * 20));
}

/**
 * Fator C: Analisa emoções negativas nas últimas 10.
 * Retorna { count, score, avgIntensity, emotions }
 */
function analyzeNegativeEmotions(recentEmotions) {
  if (!recentEmotions.length) {
    return { count: 0, score: 0, avgIntensity: 0, emotions: [] };
  }

  const negativeList = recentEmotions.filter((e) =>
    NEGATIVE_EMOTIONS.includes(e.label)
  );

  const count = negativeList.length;
  const totalRecent = recentEmotions.length;

  // Score: proporção de negativas × 100, com peso extra se maioria
  let score = Math.round((count / Math.max(totalRecent, 1)) * 100);

  // Bônus se 3+ negativas consecutivas nas mais recentes
  const last3 = recentEmotions.slice(0, 3);
  const consecutiveNegatives = last3.filter((e) => NEGATIVE_EMOTIONS.includes(e.label)).length;
  if (consecutiveNegatives >= 3) {
    score = Math.min(100, score + 20);
  }

  const avgIntensity = count > 0
    ? Math.round(negativeList.reduce((sum, e) => sum + (e.intensity ?? 5), 0) / count)
    : 0;

  return { count, score, avgIntensity, emotions: negativeList };
}

/**
 * Fator D: Score baseado na intensidade das emoções negativas.
 * Intensidade média 1-3 → 0 | 4-5 → 30 | 6-7 → 60 | 8-9 → 85 | 10 → 100
 */
function calculateIntensityScore(negativeData) {
  if (negativeData.count === 0 || negativeData.avgIntensity === 0) return 0;
  const avg = negativeData.avgIntensity;
  if (avg <= 3) return 0;
  if (avg <= 5) return Math.round(((avg - 3) / 2) * 30);
  if (avg <= 7) return 30 + Math.round(((avg - 5) / 2) * 30);
  if (avg <= 9) return 60 + Math.round(((avg - 7) / 2) * 25);
  return 100;
}

/**
 * Fator E: Analisa tendência emocional — se as emoções mais recentes são piores.
 * Compara as 5 primeiras (mais recentes) com as 5 seguintes (mais antigas).
 */
function analyzeEmotionalTrend(recentEmotions) {
  if (recentEmotions.length < 4) {
    return { score: 0, description: "Dados insuficientes", trend: "stable" };
  }

  const midpoint = Math.floor(recentEmotions.length / 2);
  const newest = recentEmotions.slice(0, midpoint);
  const older = recentEmotions.slice(midpoint);

  const positivityScore = (emotions) => {
    const positive = { Feliz: 100, Calmo: 85, Focado: 80 };
    const neutral = { Ansioso: 50 };
    const negative = { Cansado: 40, Estressado: 20, Frustrado: 30, Triste: 30 };
    const map = { ...positive, ...neutral, ...negative };
    return emotions.reduce((sum, e) => sum + (map[e.label] ?? 50), 0) / Math.max(emotions.length, 1);
  };

  const newestScore = positivityScore(newest);
  const olderScore = positivityScore(older);
  const diff = olderScore - newestScore; // positivo = piorou

  if (diff <= 5) return { score: 0, description: "Estável ou melhorando", trend: "stable" };
  if (diff <= 15) return { score: 30, description: "Leve piora recente", trend: "slight_down" };
  if (diff <= 30) return { score: 60, description: "Piora significativa nas últimas horas", trend: "down" };
  return { score: 100, description: "Queda acentuada no bem-estar", trend: "sharp_down" };
}

/**
 * Fator F: Score de fadiga acumulada por dias consecutivos de ofensiva.
 * 0-3 dias → 0 | 4-7 → 20 | 8-14 → 40 | 15-21 → 60 | 22-30 → 80 | 31+ → 100
 */
function calculateStreakFatigueScore(streakCount) {
  if (streakCount <= 3) return 0;
  if (streakCount <= 7) return Math.round(((streakCount - 3) / 4) * 20);
  if (streakCount <= 14) return 20 + Math.round(((streakCount - 7) / 7) * 20);
  if (streakCount <= 21) return 40 + Math.round(((streakCount - 14) / 7) * 20);
  if (streakCount <= 30) return 60 + Math.round(((streakCount - 21) / 9) * 20);
  return Math.min(100, 80 + Math.round(((streakCount - 30) / 20) * 20));
}