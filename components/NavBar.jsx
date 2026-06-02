"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { usePlan } from "@/lib/usePlan";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { logout } from "@/lib/auth";
import { Heart, User } from "lucide-react";

export default function NavBar() {
  const { user, loading } = useAuth();
  const { isPro } = usePlan();
  const pathname = usePathname();
  const router = useRouter();

  // Páginas que não precisam de navbar (login, signup, etc)
  const noNavbarPages = ["/login", "/signup", "/planos"];
  const shouldShowNavbar = !noNavbarPages.includes(pathname);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (!shouldShowNavbar || loading || !user) {
    return null;
  }

  return (
    <>
      {/* Header Superior */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-green-700 dark:bg-green-800 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" fill="white" opacity=".3"/>
              <circle cx="12" cy="12" r="6" fill="white" opacity=".6"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-sm">Flowise</span>
          <span className="text-[10px] border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">beta</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/perfil"
            className="text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition"
            title="Perfil"
          >
            <User size={18} />
          </Link>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block truncate max-w-[160px]">
            {user?.email}
          </span>
          <Link
            href="/planos"
            className={`text-xs font-semibold rounded-full px-3 py-1 border transition-colors ${
              isPro
                ? "bg-green-700 dark:bg-green-800 text-white border-green-700 dark:border-green-800"
                : "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-green-700 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-400"
            }`}
          >
            {isPro ? "✓ Pro" : "Upgrade Pro ✨"}
          </Link>
          <ThemeSwitcher />
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition font-medium"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Nav Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex z-50">
        {[
          {
            href: "/dashboard",
            label: "Início",
            icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>,
          },
          {
            href: "/bem-estar",
            label: "Bem-estar",
            icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 21C12 21 4 14.5 4 8.5C4 6 6 4 8.5 4C10 4 11.5 4.8 12 6C12.5 4.8 14 4 15.5 4C18 4 20 6 20 8.5C20 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>,
          },
          {
            href: "/relatorios",
            label: "Relatórios",
            icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M8 16V12M12 16V8M16 16V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
          },
          ...(isPro ? [
            {
              href: "/favoritos",
              label: "Favoritos",
              icon: <Heart size={20} />,
            },
            {
              href: "/agendamento",
              label: "Agenda",
              icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M8 7V3M16 7V3M5 11H19M7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
            },
          ] : []),
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
              pathname === item.href ? "text-green-700 dark:text-green-500" : "text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
