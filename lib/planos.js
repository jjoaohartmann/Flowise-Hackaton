// lib/planos.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";

const subRef = (uid) =>
  doc(db, "users", uid, "settings", "subscription");

/** Lê o plano atual. Retorna "free" se nunca foi salvo. */
export async function loadPlan(uid) {
  const snap = await getDoc(subRef(uid));
  if (!snap.exists()) return "free";
  return snap.data().plan ?? "free";
}

/**
 * Salva um plano no Firestore.
 * Em produção, prefira chamar isso apenas via webhook do Stripe (servidor).
 * No MVP, chamamos direto do cliente para simulação.
 */
export async function savePlan(uid, plan) {
  await setDoc(subRef(uid), {
    plan,                          // "free" | "pro"
    updatedAt: serverTimestamp(),
  });
}
