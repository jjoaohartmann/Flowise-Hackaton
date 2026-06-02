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

/** Carrega todos os dados do usuário do Firestore */
export async function loadStreak(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { streakCount: 0, lastActiveDate: null, totalFocusMinutes: 0, longestStreak: 0 };
  }
  const d = snap.data();
  return {
    streakCount:       d.streakCount       ?? 0,
    lastActiveDate:    d.lastActiveDate     ?? null,
    totalFocusMinutes: d.totalFocusMinutes  ?? 0,
    longestStreak:     d.longestStreak      ?? 0,
    lastFocusDate:     d.lastFocusDate      ?? null,
  };
}

/**
 * Chamado ao abrir o dashboard — atualiza o streak de acesso diário.
 * Lógica:
 *   mesmo dia       → não incrementa
 *   dia seguinte    → streak +1
 *   >1 dia de gap   → reseta para 1
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
    return { streakCount, longestStreak };
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

  return { streakCount, longestStreak };
}

/**
 * Chamado ao COMPLETAR uma sessão de foco no timer Pomodoro.
 *
 * Como o useEffect do cronômetro dispara a gravação segura:
 *   1. Quando timeLeft chega a 0, o useEffect detecta e chama handleSessionEnd().
 *   2. handleSessionEnd() chama esta função passando user.uid (do Firebase Auth).
 *   3. Aqui verificamos o lastFocusDate no Firestore — mesmo dia só soma minutos;
 *      ontem incrementa o streak; mais de 48h reseta para 1.
 *   4. O uid garante que cada gravação vai para users/{uid} — nunca para outro usuário.
 *
 * @param {string} uid - UID do usuário autenticado
 * @param {number} minutesFocused - minutos completados na sessão
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

  if (lastFocusDate === today) {
    // Já focou hoje → só soma os minutos, streak não muda
  } else if (lastFocusDate && daysBetween(lastFocusDate, today) === 1) {
    // Focou ontem → sequência continua, incrementa
    streakCount += 1;
    longestStreak = Math.max(longestStreak, streakCount);
    streakChanged = true;
  } else {
    // Pulou um dia ou primeiro foco → reseta para 1
    streakCount = 1;
    longestStreak = Math.max(longestStreak, streakCount);
    streakChanged = true;
  }

  await setDoc(ref, {
    lastFocusDate:     today,
    totalFocusMinutes: increment(minutesFocused), // atômico, evita race condition
    ...(streakChanged && { streakCount, longestStreak }),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return { streakCount, longestStreak };
}

/** Retorna o nível do mascote baseado no streak (0–4) */
export function getMascotLevel(streakCount) {
  if (streakCount >= 14) return 4;
  if (streakCount >= 7)  return 3;
  if (streakCount >= 3)  return 2;
  if (streakCount >= 1)  return 1;
  return 0;
}
