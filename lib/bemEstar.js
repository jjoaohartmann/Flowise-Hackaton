import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// ─────────────────────────────────────────────────────────────
// RN-06 — PRIVACIDADE DOS DADOS EMOCIONAIS
//
// Cada documento da coleção "emocoes" contém o campo
// userId: user.uid. Na leitura, filtramos com:
//   where("userId", "==", user.uid)
//
// Isso garante que, ao acessar pelo celular OU pelo computador
// com a mesma conta, o Firebase Auth retorna o mesmo UID —
// e a query sempre devolve exatamente os documentos daquele
// usuário, nunca misturando dados de contas diferentes.
// ─────────────────────────────────────────────────────────────

// ── EMOÇÕES ──────────────────────────────────────────────────

/**
 * Salva uma emoção na coleção global "emocoes" com userId.
 * @param {string} uid
 * @param {{ emoji: string, label: string, note?: string }} data
 */
export async function saveEmotion(uid, { emoji, label, note = "" }) {
  await addDoc(collection(db, "emocoes"), {
    userId:    uid,          // chave de privacidade
    emoji,
    label,
    note,
    createdAt: serverTimestamp(),
    date:      new Date().toISOString().split("T")[0],
  });
}

/**
 * Busca os últimos N registros emocionais do usuário.
 * O where("userId", "==", uid) garante isolamento total.
 */
export async function loadRecentEmotions(uid, count = 10) {
  const q = query(
    collection(db, "emocoes"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── ROTINA ───────────────────────────────────────────────────

/**
 * Salva/atualiza a rotina do usuário.
 * Caminho: users/{uid}/settings/routine
 */
export async function saveRoutine(uid, routine) {
  const ref = doc(db, "users", uid, "settings", "routine");
  await setDoc(ref, { ...routine, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Carrega a rotina salva.
 */
export async function loadRoutine(uid) {
  const ref  = doc(db, "users", uid, "settings", "routine");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ── VALIDAÇÃO E ANÁLISE DA ROTINA ────────────────────────

/**
 * RN-VALID-01: Valida a rotina do usuário e retorna avisos profissionais.
 * Verifica: horas de sono, horas de trabalho, consistência de horários.
 */
export function validateRoutine(routine) {
  const issues = [];
  if (!routine) return issues;

  try {
    // Validar formato e extrair horários
    const parseTime = (timeStr) => {
      const [h, m] = (timeStr || "00:00").split(":").map(Number);
      return h * 60 + m; // retorna minutos desde meia-noite
    };

    const wakeUpMin = parseTime(routine.wakeUp);
    const sleepMin = parseTime(routine.sleep);

    // Calcular horas de sono
    // Se sleepMin > wakeUpMin: dormiu antes da meia-noite (ex: 23:00 → 07:00)
    // Se sleepMin < wakeUpMin: dormiu depois da meia-noite (ex: 02:00 → 07:00)
    let sleepDuration = sleepMin > wakeUpMin
      ? (1440 - sleepMin) + wakeUpMin   // atravessa meia-noite
      : wakeUpMin - sleepMin;           // mesmo dia
    
    const sleepHours = sleepDuration / 60;

    // Avisos sobre sono
    if (sleepHours < 5.5) {
      issues.push({
        type: "warning",
        icon: "😴",
        message: "Você está dormindo menos de 5h30. Considere dormir mais para melhor produtividade.",
      });
    }
    if (sleepHours > 9.5) {
      issues.push({
        type: "info",
        icon: "ℹ️",
        message: "Você está dormindo mais de 9h30. Mais sono pode resultar em sonolência.",
      });
    }

    // Avisos sobre horas de trabalho
    const workHours = Number(routine.workHours ?? 8);
    if (workHours > 10) {
      issues.push({
        type: "warning",
        icon: "⚠️",
        message: `${workHours}h de trabalho/dia é muito. Risco de esgotamento mental. Considere reduzir para 8h.`,
      });
    }
    if (workHours < 2) {
      issues.push({
        type: "info",
        icon: "💡",
        message: "Menos de 2h de trabalho/dia pode ser insuficiente para resultados.",
      });
    }

    // Avisos sobre horário de trabalho contínuo
    const breakMin = Number(routine.breakMinutes ?? 25);
    if (breakMin > 60) {
      issues.push({
        type: "info",
        icon: "⏱️",
        message: "Pausa maior que 1h pode quebrar o momentum de foco. Considere reduzir para 25-30min.",
      });
    }

    // Avisos sobre exercício
    const exerciseMin = Number(routine.exerciseMin ?? 30);
    if (exerciseMin < 15) {
      issues.push({
        type: "info",
        icon: "🏃",
        message: "Menos de 15min de exercício diário. Atividade física melhora foco e saúde mental.",
      });
    }
  } catch (err) {
    console.error("Erro ao validar rotina:", err);
  }

  return issues;
}
