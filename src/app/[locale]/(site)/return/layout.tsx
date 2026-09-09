import type { Metadata } from "next";
import type { ReactNode } from "react";

// Приватный маршрут: рендерим на каждый запрос и не отдаём в CDN-кэш.
// Публичные страницы кэшируются (revalidate), эта ветка — нет.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ReturnLayout({ children }: { children: ReactNode }) {
  return children;
}
