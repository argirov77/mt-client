import type { Metadata } from "next";

import PurchaseClient from "@/components/purchase/PurchaseClient";

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
