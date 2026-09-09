import type { Metadata } from "next";

import QrExchangeClient from "@/components/ticket/QrExchangeClient";

// Приватный маршрут: рендерим на каждый запрос и не отдаём в CDN-кэш.
// Публичные страницы кэшируются (revalidate), эта ветка — нет.
export const dynamic = "force-dynamic";

interface QrExchangePageProps {
  params: Promise<{
    locale: string;
    opaque: string;
  }>;
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default async function QrExchangePage({ params }: QrExchangePageProps) {
  const { opaque } = await params;

  return <QrExchangeClient opaque={opaque} />;
}

