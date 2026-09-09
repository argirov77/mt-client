import type { Metadata } from "next";

import PurchaseClient from "@/components/purchase/PurchaseClient";

// Приватный маршрут: рендерим на каждый запрос и не отдаём в CDN-кэш.
// Публичные страницы кэшируются (revalidate), эта ветка — нет.
export const dynamic = "force-dynamic";

interface TicketPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;

  return <PurchaseClient purchaseId={id} />;
}
