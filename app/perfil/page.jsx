"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useAuth } from "@/lib/AuthContext";

function computeAge(birthDateString) {
  if (!birthDateString) return null;
  const today = new Date();
  const birth = new Date(birthDateString);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function PerfilPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // ---------- profile state ----------
  const [profile, setProfile] = useState({
    name: "",
    photoURL: "",
    birthDate: "",
    email: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // ---------- password reset state ----------
  const [resetSending, setResetSending] = useState(false);

  // ---------- delete account state ----------
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ---------- load Firestore profile ----------
  const loadProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return;
    setLoadingProfile(true);
    try {
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          name: data.name || firebaseUser.displayName || "",
          photoURL: data.photoURL || firebaseUser.photoURL || "",
          birthDate: data.birthDate || "",
          email: firebaseUser.email || data.email || "",
        });
      } else {
        setProfile({
          name: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
          birthDate: "",
          email: firebaseUser.email || "",
        });
      }
    } catch {
      setProfile({
        name: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        birthDate: "",
        email: firebaseUser.email || "",
      });
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login?redirect=/perfil");
        return;
      }
      loadProfile(user);
    }
  }, [user, authLoading, router, loadProfile]);

  // ---------- form handlers ----------
  function handleChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (feedback.message) setFeedback({ type: "", message: "" });
  }

  // ---------- save profile ----------
  async function handleSave(e) {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!profile.name.trim()) {
      setFeedback({ type: "error", message: "O nome não pode ficar vazio." });
      return;
    }

    setSaving(true);
    try {
      // 1. Atualiza displayName e photoURL no Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: profile.name.trim(),
        photoURL: profile.photoURL.trim() || null,
      });

      // 2. Atualiza documento no Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        name: profile.name.trim(),
        photoURL: profile.photoURL.trim() || null,
        updatedAt: new Date().toISOString(),
      });

      setFeedback({ type: "success", message: "Perfil atualizado com sucesso!" });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao salvar. Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  }

  // ---------- change password ----------
  async function handleChangePassword() {
    setResetSending(true);
    setFeedback({ type: "", message: "" });
    try {
      await sendPasswordResetEmail(auth, user.email);
      setFeedback({
        type: "success",
        message: `E-mail de redefinição enviado para ${user.email}. Verifique sua caixa de entrada.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao enviar e-mail de redefinição.",
      });
    } finally {
      setResetSending(false);
    }
  }

  // ---------- delete account ----------
  function openDeleteModal() {
    setDeleteConfirmText("");
    setDeleteModalOpen(true);
    setFeedback({ type: "", message: "" });
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETAR MINHA CONTA") return;

    setDeleting(true);
    try {
      // 1. Deleta documento no Firestore
      await deleteDoc(doc(db, "users", user.uid));
      // 2. Deleta conta do Firebase Auth
      await deleteUser(auth.currentUser);

      // Redireciona para home com query de conta deletada
      router.replace("/?deleted=true");
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err.code === "auth/requires-recent-login"
            ? "Por segurança, faça logout e login novamente antes de deletar sua conta."
            : err.message || "Erro ao deletar conta.",
      });
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  // ---------- auth loading guard ----------
  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-6 w-6 text-green-700"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Carregando perfil...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null; // redirect via useEffect

  const age = computeAge(profile.birthDate);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ---------- Header ---------- */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Perfil & Configurações
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie seus dados pessoais e a segurança da sua conta.
          </p>
        </div>

        {/* ---------- Feedback toast ---------- */}
        {feedback.message && (
          <div
            className={`px-4 py-3 rounded-xl text-sm border ${
              feedback.type === "success"
                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* ---------- Profile Card ---------- */}
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dados Pessoais
          </h2>

          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700">
              {profile.photoURL ? (
                <Image
                  src={profile.photoURL}
                  alt="Foto de perfil"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <svg
                  className="w-full h-full p-3 text-gray-400 dark:text-gray-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .66.54 1.2 1.2 1.2h16.8c.66 0 1.2-.54 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {profile.name || "Usuário Flowise"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {profile.email}
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={profile.name}
              onChange={handleChange}
              placeholder="Seu nome completo"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label
              htmlFor="photoURL"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              URL da Foto de Perfil
            </label>
            <input
              id="photoURL"
              name="photoURL"
              type="url"
              value={profile.photoURL}
              onChange={handleChange}
              placeholder="https://exemplo.com/foto.jpg"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-700/30 dark:focus:ring-green-500/30 focus:border-green-700 dark:focus:border-green-500"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Cole o link de uma imagem pública (HTTPS).
            </p>
          </div>

          {/* Age (read-only, derived from birthDate) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Idade
            </label>
            <div className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm">
              {age !== null
                ? `${age} ${age === 1 ? "ano" : "anos"}`
                : "Data de nascimento não informada"}
            </div>
            {profile.birthDate && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Data de nascimento:{" "}
                {new Date(profile.birthDate + "T00:00:00").toLocaleDateString(
                  "pt-BR",
                  { timeZone: "UTC" }
                )}
              </p>
            )}
          </div>

          {/* E-mail (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              E-mail
            </label>
            <div className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm">
              {profile.email}
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              O e-mail não pode ser alterado diretamente.
            </p>
          </div>

          {/* Save button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-700 text-white text-sm font-medium transition hover:bg-green-800 dark:hover:bg-green-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Salvando...
                </span>
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </form>

        {/* ---------- Security Card ---------- */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Segurança da Conta
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ações sensíveis relacionadas à sua conta. Use com responsabilidade.
            </p>
          </div>

          {/* Change Password */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Alterar Senha
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Você receberá um e-mail com um link para redefinir sua senha.
              </p>
            </div>
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={resetSending}
              className="shrink-0 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resetSending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Enviando...
                </span>
              ) : (
                "Enviar E-mail de Redefinição"
              )}
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Deletar Conta
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Esta ação é permanente. Todos os seus dados serão excluídos.
              </p>
            </div>
            <button
              type="button"
              onClick={openDeleteModal}
              className="shrink-0 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-600 dark:bg-red-700 text-white text-sm font-medium transition hover:bg-red-700 dark:hover:bg-red-600 active:scale-[0.98]"
            >
              Deletar Minha Conta
            </button>
          </div>
        </div>

        {/* ---------- Privacy Notice ---------- */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Suas informações são tratadas com confidencialidade e armazenadas de
          forma segura. Consulte nossa{" "}
          <a href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">
            Política de Privacidade
          </a>
          .
        </p>
      </div>

      {/* ---------- Delete Confirmation Modal ---------- */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xl">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 mb-3">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Deletar sua conta?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Esta ação é <strong>irreversível</strong>. Todos os seus dados
                serão permanentemente removidos, incluindo suas tarefas,
                relatórios e progresso no Flowise.
              </p>
            </div>

            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Digite <span className="font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">DELETAR MINHA CONTA</span> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETAR MINHA CONTA"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 text-sm transition focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 mb-5"
              autoFocus
            />

            {feedback.message && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                {feedback.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={
                  deleting || deleteConfirmText !== "DELETAR MINHA CONTA"
                }
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white text-sm font-medium transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Deletando...
                  </span>
                ) : (
                  "Sim, Deletar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}