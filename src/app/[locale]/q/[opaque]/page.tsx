import type { Metadata } from "next";

import QrExchangeClient from "@/components/ticket/QrExchangeClient";

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

