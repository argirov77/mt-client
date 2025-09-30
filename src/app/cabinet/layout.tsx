import "../globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Личный кабинет — Бронирование №2690574",
};

export default function CabinetLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
