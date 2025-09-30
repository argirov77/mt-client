import PurchaseClient from "@/components/purchase/PurchaseClient";

interface PurchasePageProps {
  params: Promise<{
    purchaseId: string;
  }>;
}

export default async function PurchasePage({ params }: PurchasePageProps) {
  const { purchaseId } = await params;

  return <PurchaseClient purchaseId={purchaseId} />;
}
