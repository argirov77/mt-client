import type { Metadata } from "next";

import PurchaseClient from "@/components/purchase/PurchaseClient";

// Приватный маршрут: рендерим на каждый запрос и не отдаём в CDN-кэш.
// Публичные страницы кэшируются (revalidate), эта ветка — нет.
export const dynamic = "force-dynamic";

interface PurchasePageProps {
  params: Promise<{
    locale: string;
    purchaseId: string;
  }>;
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default async function PurchasePage({ params }: PurchasePageProps) {
  const { purchaseId } = await params;

  return <PurchaseClient purchaseId={purchaseId} />;
}
