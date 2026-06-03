"use client";
// lib/usePlan.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { loadPlan } from "./planos";

// ─── Estado global + listeners (pattern pub/sub) ──────────────────────────────
// Garante que TODOS os componentes usando usePlan() sejam notificados
// quando o plano mudar (ex: após upgrade/downgrade na página de planos).
let globalPlan = null;
let globalLoading = true;
let listeners = [];

function notifyListeners() {
  listeners.forEach((fn) => fn({ plan: globalPlan, loading: globalLoading }));
}

function setGlobalPlan(plan) {
  globalPlan = plan;
  globalLoading = false;
  notifyListeners();
}

function setGlobalLoading(loading) {
  globalLoading = loading;
  notifyListeners();
}

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
  const [state, setState] = useState(() => ({
    plan: globalPlan,
    loading: globalLoading,
  }));

  // Registra listener para receber atualizações globais
  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((fn) => fn !== setState);
    };
  }, []);

  // Função que carrega o plano do Firestore
  const fetchPlan = useCallback(() => {
    if (!user) {
      setGlobalPlan("free");
      return;
    }
    setGlobalLoading(true);
    loadPlan(user.uid)
      .then((p) => {
        setGlobalPlan(p);
      })
      .catch(() => {
        setGlobalPlan("free");
      });
  }, [user]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const isPro = state.plan === "pro";
  return { plan: state.plan, isPro, loading: state.loading, refreshPlan: fetchPlan };
}
