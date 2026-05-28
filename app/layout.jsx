import { Outfit, DM_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata = {
  title: "Flowise — Produtividade com equilíbrio",
  description:
    "Plataforma que promove equilíbrio entre produtividade, saúde mental e uso consciente da tecnologia.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
