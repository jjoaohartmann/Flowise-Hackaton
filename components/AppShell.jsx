"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";

export default function AppShell({ children }) {
  const pathname = usePathname();

  // Páginas que NÃO usam o shell com NavBar
  const noShellPages = ["/login", "/signup"];
  if (noShellPages.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <NavBar />
      <main className="flex-1 pb-24">{children}</main>
    </div>
  );
}