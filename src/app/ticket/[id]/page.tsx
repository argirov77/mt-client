import PurchaseClient from "@/components/purchase/PurchaseClient";

interface TicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;

  return <PurchaseClient purchaseId={id} />;
}
