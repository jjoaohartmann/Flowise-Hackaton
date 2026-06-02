import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

export function todayStr() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/** Carrega todos os dados do usuÃ¡rio do Firestore */
export async function loadStreak(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { streakCount: 0, lastActiveDate: null, totalFocusMinutes: 0, dailyFocusMinutes: 0, longestStreak: 0 };
  }
  const d = snap.data();
  const today = todayStr();
  return {
    streakCount:       d.streakCount       ?? 0,
    lastActiveDate:    d.lastActiveDate     ?? null,
    totalFocusMinutes: d.totalFocusMinutes  ?? 0,
    dailyFocusMinutes: d.lastFocusDate === today ? (d.dailyFocusMinutes ?? 0) : 0,
    longestStreak:     d.longestStreak      ?? 0,
    lastFocusDate:     d.lastFocusDate      ?? null,
  };
}

/**
 * Chamado ao abrir o dashboard â€” atualiza o streak de acesso diÃ¡rio.
 * LÃ³gica:
 *   mesmo dia       â†’ nÃ£o incrementa
 *   dia seguinte    â†’ streak +1
 *   >1 dia de gap   â†’ reseta para 1
 */
export async function updateStreak(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};

  const today = todayStr();
  const last = data.lastActiveDate ?? null;
  let streakCount   = data.streakCount   ?? 0;
  let longestStreak = data.longestStreak ?? 0;

  if (last === today) {
    return { streakCount, longestStreak, dailyFocusMinutes: data.dailyFocusMinutes ?? 0 };
  }

  if (last && daysBetween(last, today) === 1) {
    streakCount += 1;
  } else {
    streakCount = 1;
  }

  longestStreak = Math.max(longestStreak, streakCount);

  await setDoc(ref, {
    streakCount,
    lastActiveDate: today,
    longestStreak,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return { streakCount, longestStreak, dailyFocusMinutes: data.dailyFocusMinutes ?? 0 };
}

/**
 * Chamado ao COMPLETAR uma sessÃ£o de foco no timer Pomodoro.
 *
 * Como o useEffect do cronÃ´metro dispara a gravaÃ§Ã£o segura:
 *   1. Quando timeLeft chega a 0, o useEffect detecta e chama handleSessionEnd().
 *   2. handleSessionEnd() chama esta funÃ§Ã£o passando user.uid (do Firebase Auth).
 *   3. Aqui verificamos o lastFocusDate no Firestore â€” mesmo dia sÃ³ soma minutos;
 *      ontem incrementa o streak; mais de 48h reseta para 1.
 *   4. O uid garante que cada gravaÃ§Ã£o vai para users/{uid} â€” nunca para outro usuÃ¡rio.
 *
 * @param {string} uid - UID do usuÃ¡rio autenticado
 * @param {number} minutesFocused - minutos completados na sessÃ£o
 */
export async function completeFocusSession(uid, minutesFocused) {
  const ref  = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};

  const today         = todayStr();
  const lastFocusDate = data.lastFocusDate ?? null;
  let streakCount     = data.streakCount   ?? 0;
  let longestStreak   = data.longestStreak ?? 0;
  let streakChanged   = false;
  let nextDailyFocusMinutes = minutesFocused;

  if (lastFocusDate === today) {
    nextDailyFocusMinutes = (data.dailyFocusMinutes ?? 0) + minutesFocused;
    // JÃ¡ focou hoje â†’ sÃ³ soma os minutos, streak nÃ£o muda
  } else if (lastFocusDate && daysBetween(lastFocusDate, today) === 1) {
    // Focou ontem â†’ sequÃªncia continua, incrementa
    streakCount += 1;
    longestStreak = Math.max(longestStreak, streakCount);
    streakChanged = true;
  } else {
    // Pulou um dia ou primeiro foco â†’ reseta para 1
    streakCount = 1;
    longestStreak = Math.max(longestStreak, streakCount);
    streakChanged = true;
  }

  await setDoc(ref, {
    lastFocusDate:     today,
    totalFocusMinutes: increment(minutesFocused), // atÃ´mico, evita race condition
    dailyFocusMinutes: nextDailyFocusMinutes,
    ...(streakChanged && { streakCount, longestStreak }),    // ── RN-CONSIST-01: Salvar histórico diário para análise ──
    [`focusHistory.${today}`]: nextDailyFocusMinutes,    updatedAt: serverTimestamp(),
  }, { merge: true });

  return { streakCount, longestStreak, dailyFocusMinutes: nextDailyFocusMinutes };
}

/** Retorna o nÃ­vel do mascote baseado no streak (0â€“4) */
export function getMascotLevel(streakCount) {
  if (streakCount >= 14) return 4;
  if (streakCount >= 7)  return 3;
  if (streakCount >= 3)  return 2;
  if (streakCount >= 1)  return 1;
  return 0;
}
// ── ANÁLISE DE CONSISTÊNCIA ─────────────────────────────

/**
 * RN-CONSIST-01: Calcula taxa de consistência semanal.
 * Retorna:
 *   - weeklyScore: 0-100 (percentual de aderência à rotina)
 *   - trend: 'up', 'stable', 'down'
 *   - advice: sugestão personalizada
 */
export async function calculateWeeklyConsistency(uid, routine) {
  if (!routine) return { weeklyScore: 0, trend: "neutral", advice: "Configure sua rotina para ver a análise." };

  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};

    const dailyGoalMinutes = Math.round(Number(routine.workHours ?? 8) * 60);
    const last7Days = data.focusHistory ?? {}; // { "2026-01-10": 480, "2026-01-09": 420, ... }

    const today = todayStr();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    // Calcular aderência de cada dia
    const dailyAdherence = dates.map((date) => {
      const focusMinutes = last7Days[date] ?? 0;
      return Math.min(100, Math.round((focusMinutes / dailyGoalMinutes) * 100));
    });

    const weeklyScore = Math.round(dailyAdherence.reduce((a, b) => a + b, 0) / 7);
    const trend = calculateTrend(dailyAdherence);
    const advice = generateConsistencyAdvice(weeklyScore, trend, dailyAdherence, dailyGoalMinutes);

    return { weeklyScore, trend, advice, dailyAdherence, lastWeekDates: dates };
  } catch (err) {
    console.error("Erro ao calcular consistência:", err);
    return { weeklyScore: 0, trend: "neutral", advice: "Erro ao calcular. Tente novamente." };
  }
}

function calculateTrend(dailyAdherence) {
  if (dailyAdherence.length < 2) return "neutral";
  const first3 = dailyAdherence.slice(0, 3).reduce((a, b) => a + b) / 3;
  const last3 = dailyAdherence.slice(-3).reduce((a, b) => a + b) / 3;
  const diff = last3 - first3;
  if (diff > 10) return "up";
  if (diff < -10) return "down";
  return "stable";
}

function generateConsistencyAdvice(score, trend, adherence, goalMin) {
  if (score >= 90) return "🎯 Excelente! Você está muito consistente com sua rotina.";
  if (score >= 75) return "👍 Ótimo! Você está seguindo bem sua rotina.";
  if (score >= 50) return "📈 Continue melhorando! Você está no caminho certo.";
  if (trend === "down") return "⚠️ Sua consistência está caindo. Reajuste sua rotina ou aumente a motivação.";
  return "💪 Você pode melhorar! Tente focar e manter a consistência.";
}

/**
 * RN-SATURAÇÃO-01: Rastreia tempo contínuo de foco.
 * Chamado pelo FocusTimer para detectar sobrecarga.
 */
export function shouldShowSaturationAlert(continuousMinutes) {
  return continuousMinutes >= 120; // 2 horas de foco contínuo
}
