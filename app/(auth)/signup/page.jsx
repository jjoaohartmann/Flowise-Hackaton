"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerWithEmail, loginWithGoogle, validateAge } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Calcula a data máxima permitida para ter 16 anos hoje (RN-04)
  const maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    return d.toISOString().split("T")[0];
  })();

  function validate() {
    const newErrors = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      newErrors.name = "Nome deve ter ao menos 2 caracteres.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "E-mail inválido.";
    }
    if (form.password.length < 8) {
      newErrors.password = "A senha deve ter ao menos 8 caracteres.";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem.";
    }
    if (!form.birthDate) {
      newErrors.birthDate = "Data de nascimento obrigatória.";
    } else if (!validateAge(form.birthDate)) {
      // RN-04
      newErrors.birthDate = "Você precisa ter pelo menos 16 anos para se cadastrar.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await registerWithEmail({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        birthDate: form.birthDate,
      });
      router.push("/dashboard");
    } catch (err) {
      const messages = {
        "auth/email-already-in-use": "Este e-mail já está cadastrado.",
        "auth/weak-password": "Senha muito fraca. Use ao menos 8 caracteres.",
        "auth/invalid-email": "E-mail inválido.",
      };
      setServerError(messages[err.code] || err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setServerError("");
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      setServerError("Erro ao continuar com Google. Tente novamente.");
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
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2D6A4F] mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" fill="white" opacity="0.3"/>
            <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z" fill="white" opacity="0.6"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Flowise</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Produtividade com equilíbrio</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Criar conta</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Comece sua jornada de equilíbrio hoje.
        </p>

        {/* Erro do servidor */}
        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Seu nome"
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 ${
                errors.name ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950"
              }`}
            />
            {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
          </div>

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

          {/* Data de nascimento — RN-04 */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Data de nascimento
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500 font-normal">(mínimo 16 anos)</span>
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              max={maxBirthDate}
              value={form.birthDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-gray-50 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 ${
                errors.birthDate ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950"
              }`}
            />
            {errors.birthDate && (
              <p className="mt-1.5 text-xs text-red-600">{errors.birthDate}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 ${
                errors.password ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950"
              }`}
            />
            {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
          </div>

          {/* Confirmar senha */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repita a senha"
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500 ${
                errors.confirmPassword ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950"
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
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
                Criando conta...
              </span>
            ) : "Criar conta"}
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

        {/* Link para login */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-green-700 dark:text-green-400 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
        Ao criar uma conta, você concorda com nossos{" "}
        <Link href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">Termos de Uso</Link>
        {" "}e{" "}
        <Link href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">Política de Privacidade</Link>.
      </p>
    </div>
  );
}
