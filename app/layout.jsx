import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { FavoritesProvider } from "@/lib/FavoritesContext";
import AppShell from "@/components/AppShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Flowise — Produtividade com equilíbrio",
  description:
    "Plataforma que promove equilíbrio entre produtividade, saúde mental e uso consciente da tecnologia.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem("flowise-theme");
                  if (theme === "light") {
                    document.documentElement.classList.remove("dark");
                  } else {
                    document.documentElement.classList.add("dark");
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <AuthProvider>
          <ThemeProvider>
            <FavoritesProvider>
              <AppShell>{children}</AppShell>
            </FavoritesProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}