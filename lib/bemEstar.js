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
