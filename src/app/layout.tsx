import "./globals.css";
import type { ReactNode } from "react";

import { LanguageProvider } from "@/components/common/LanguageProvider";

export const metadata = {
  title: "Максимов Турc",
  description: "Продажа автобусных билетов по Болгарии и Европе",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
