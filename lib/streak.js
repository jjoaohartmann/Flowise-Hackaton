import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";

// Retorna a data no formato YYYY-MM-DD no fuso local
export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Carrega os dados de streak do usuário no Firestore.
 * Retorna: { streakCount, lastActiveDate, totalFocusMinutes, longestStreak }
 */
export async function loadStreak(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { streakCount: 0, lastActiveDate: null, totalFocusMinutes: 0, longestStreak: 0 };

  const data = snap.data();
  return {
    streakCount: data.streakCount ?? 0,
    lastActiveDate: data.lastActiveDate ?? null,
    totalFocusMinutes: data.totalFocusMinutes ?? 0,
    longestStreak: data.longestStreak ?? 0,
  };
}

/**
 * RN-03: Registra atividade do dia e atualiza o streak.
 * - Mesmo dia → não incrementa (já contou hoje)
 * - Dia seguinte → incrementa streak
 * - Pulou um dia → reseta streak para 1
 */
export async function updateStreak(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};

  const today = todayStr();
  const last = data.lastActiveDate ?? null;
  let streakCount = data.streakCount ?? 0;
  let longestStreak = data.longestStreak ?? 0;

  if (last === today) {
    // Já registrou hoje — não faz nada
    return { streakCount, longestStreak };
  }

  if (last && daysBetween(last, today) === 1) {
    // Dia consecutivo: incrementa
    streakCount += 1;
  } else {
    // Pulou um dia ou primeiro acesso: reinicia
    streakCount = 1;
  }

  longestStreak = Math.max(longestStreak, streakCount);

  await setDoc(
    ref,
    { streakCount, lastActiveDate: today, longestStreak, updatedAt: serverTimestamp() },
    { merge: true }
  );

  return { streakCount, longestStreak };
}

/**
 * Salva os minutos de foco acumulados no dia.
 */
export async function saveFocusSession(uid, minutesFocused) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().totalFocusMinutes ?? 0) : 0;

  await setDoc(
    ref,
    { totalFocusMinutes: current + minutesFocused, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Retorna o nível do mascote baseado no streak atual (RN-03).
 * 0  → semente   (sem streak)
 * 1  → broto     (1–2 dias)
 * 2  → muda      (3–6 dias)
 * 3  → planta    (7–13 dias)
 * 4  → floresceu (14+ dias)
 */
export function getMascotLevel(streakCount) {
  if (streakCount >= 14) return 4;
  if (streakCount >= 7) return 3;
  if (streakCount >= 3) return 2;
  if (streakCount >= 1) return 1;
  return 0;
}
