import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// ─────────────────────────────────────────────────────────
// RN-06 — PRIVACIDADE DOS DADOS EMOCIONAIS
//
// Todos os dados são salvos sob o caminho:
//   users/{uid}/emotions/{docId}
//   users/{uid}/routine
//
// O {uid} é o ID único do usuário autenticado — nenhum
// outro usuário consegue acessar ou listar esses documentos,
// pois as Firestore Security Rules (configuradas no console)
// restringem leitura e escrita a "request.auth.uid == uid".
// ─────────────────────────────────────────────────────────

// ── EMOÇÕES ──────────────────────────────────────────────

/**
 * Salva um registro emocional do momento.
 * Caminho: users/{uid}/emotions/{autoId}
 */
export async function saveEmotion(uid, { emoji, label, note = "" }) {
  const emotionsRef = collection(db, "users", uid, "emotions");
  await addDoc(emotionsRef, {
    emoji,
    label,
    note,
    createdAt: serverTimestamp(),
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
  });
}

/**
 * Busca os últimos N registros emocionais do usuário.
 * Caminho: users/{uid}/emotions (subcoleção privada)
 */
export async function loadRecentEmotions(uid, count = 7) {
  const emotionsRef = collection(db, "users", uid, "emotions");
  const q = query(emotionsRef, orderBy("createdAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── ROTINA ───────────────────────────────────────────────

/**
 * Salva ou atualiza a rotina do usuário.
 * Caminho: users/{uid}/routine (documento único)
 */
export async function saveRoutine(uid, routine) {
  const routineRef = doc(db, "users", uid, "settings", "routine");
  await setDoc(routineRef, { ...routine, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Carrega a rotina salva do usuário.
 */
export async function loadRoutine(uid) {
  const routineRef = doc(db, "users", uid, "settings", "routine");
  const snap = await getDoc(routineRef);
  if (!snap.exists()) return null;
  return snap.data();
}
