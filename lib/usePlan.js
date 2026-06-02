"use client";
// lib/usePlan.js
import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { loadPlan } from "./planos";

/**
 * Hook reativo que devolve o plano atual do usuário logado.
 *
 * Uso:
 *   const { plan, isPro, loading } = usePlan();
 *
 * - plan    → "free" | "pro" | null (null = ainda carregando)
 * - isPro   → boolean: true se plan === "pro"
 * - loading → boolean: true enquanto busca no Firestore
 */
export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }

    setLoading(true);
    loadPlan(user.uid)
      .then((p) => {
        setPlan(p);
        setLoading(false);
      })
      .catch(() => {
        setPlan("free");
        setLoading(false);
      });
  }, [user]);

  const isPro = plan === "pro";
  return { plan, isPro, loading };
}
