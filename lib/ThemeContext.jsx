"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Carregar tema do localStorage ao montar
  useEffect(() => {
    const savedTheme = localStorage.getItem("flowise-theme");
    const shouldBeDark = savedTheme ? savedTheme === "dark" : true;
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
    setMounted(true);
  }, []);

  const applyTheme = (dark) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("flowise-theme", newTheme ? "dark" : "light");
    applyTheme(newTheme);
  };

  // Evitar flash de conteúdo incorreto
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
