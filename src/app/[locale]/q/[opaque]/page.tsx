import QrExchangeClient from "@/components/ticket/QrExchangeClient";

interface QrExchangePageProps {
  params: Promise<{
    locale: string;
    opaque: string;
  }>;
}

export default async function QrExchangePage({ params }: QrExchangePageProps) {
  const { opaque } = await params;

  return <QrExchangeClient opaque={opaque} />;
}

