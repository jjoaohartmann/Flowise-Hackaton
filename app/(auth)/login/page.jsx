"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginWithEmail, loginWithGoogle } from "@/lib/auth";

// 1. Toda a sua lógica e UI originais ficam aqui dentro
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate() {
    const newErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Insira um e-mail válido.";
    }
    if (!form.password) {
      newErrors.password = "Insira sua senha.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    // loading(true);
    setLoading(true);
    try {
      await loginWithEmail({ email: form.email, password: form.password });
      router.push(redirectTo);
    } catch (err) {
      const messages = {
        "auth/user-not-found": "Nenhuma conta encontrada com este e-mail.",
        "auth/wrong-password": "Senha incorreta. Tente novamente.",
        "auth/invalid-credential": "E-mail ou senha inválidos.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
        "auth/user-disabled": "Esta conta foi desativada.",
      };
      setServerError(messages[err.code] || "Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setServerError("");
    try {
      await loginWithGoogle();
      router.push(redirectTo);
    } catch (err) {
      setServerError("Erro ao entrar com Google. Tente novamente.");
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2D6A4F] mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" fill="white" opacity="0.3"/>
            <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z" fill="white" opacity="0.6"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Flowise</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Bem-vindo de volta</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Entrar</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Continue de onde parou.</p>

        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* E-mail */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 ${
                errors.email ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950"
              }`}
            />
            {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Senha */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <Link href="/forgot-password" className="text-xs text-green-700 dark:text-green-400 hover:underline font-medium">
                Esqueceu a senha?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Sua senha"
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 ${
                errors.password ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950"
              }`}
            />
            {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-green-700 dark:bg-green-700 text-white text-sm font-medium transition hover:bg-green-800 dark:hover:bg-green-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Entrando...
              </span>
            ) : "Entrar"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          <span className="text-xs text-gray-400 dark:text-gray-500">ou continue com</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center justify-center gap-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.3C29.5 35.6 26.9 36.5 24 36.5c-5.3 0-9.8-3.5-11.3-8.3l-6.5 5C9.5 39.5 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.3C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          {googleLoading ? "Aguarde..." : "Continuar com Google"}
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Não tem conta?{" "}
          <Link href="/signup" className="text-green-700 dark:text-green-400 font-medium hover:underline">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}

// 2. O export oficial da página agora serve para blindar o uso do useSearchParams()
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 animate-pulse">
        Carregando Flowise...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}