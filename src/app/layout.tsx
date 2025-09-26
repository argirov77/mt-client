import "./globals.css";
import type { ReactNode } from "react";

// общие компоненты
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { LanguageProvider } from "@/components/common/LanguageProvider";

export const metadata = {
  title: "Максимов Турc",
  description: "Продажа автобусных билетов по Болгарии и Европе",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        <LanguageProvider>
          {/* Общая шапка сайта */}
          <Header />

          {/* Контент страницы */}
          {children}

          {/* Общий футер сайта */}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
