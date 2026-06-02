"use client";

import { useTheme } from "@/lib/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeSwitcher() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
