import "../globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Личный кабинет",
};

export default function CabinetLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
