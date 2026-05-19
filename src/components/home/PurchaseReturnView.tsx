"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import UiAlert from "@/components/common/Alert";
import PurchaseClient from "@/components/purchase/PurchaseClient";

const PAYMENT_BANNER: Record<string, { type: "info" | "success" | "error"; message: string }> = {
  success: { type: "success", message: "Оплата подтверждена." },
  pending: { type: "info", message: "Оплата обрабатывается." },
  failed: { type: "error", message: "Оплата не прошла. Попробуйте еще раз." },
};

export default function PurchaseReturnView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [resolvedPurchaseId, setResolvedPurchaseId] = useState<string | null>(null);
  const [resolvedPaymentStatus, setResolvedPaymentStatus] = useState<string>("");

  const queryPurchaseId = useMemo(() => {
    const direct = searchParams.get("purchase_id");
    const fallback = searchParams.get("purchaseId");
    return (direct ?? fallback ?? "").trim();
  }, [searchParams]);

  const queryPaymentStatus = useMemo(() => {
    return (searchParams.get("payment") ?? "").trim().toLowerCase();
  }, [searchParams]);

  useEffect(() => {
    if (queryPurchaseId) setResolvedPurchaseId(queryPurchaseId);
    if (queryPaymentStatus) setResolvedPaymentStatus(queryPaymentStatus);
    if (!queryPurchaseId && !queryPaymentStatus) return;
    router.replace(pathname || "/", { scroll: false });
  }, [pathname, queryPaymentStatus, queryPurchaseId, router]);

  const activePurchaseId = resolvedPurchaseId || queryPurchaseId;
  const activePaymentStatus = resolvedPaymentStatus || queryPaymentStatus;

  if (!activePurchaseId) return null;

  const banner = PAYMENT_BANNER[activePaymentStatus] ?? null;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-50">
      <div className="min-h-screen py-6">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4">
          {banner ? <UiAlert type={banner.type}>{banner.message}</UiAlert> : null}
          <PurchaseClient purchaseId={activePurchaseId} />
        </div>
      </div>
    </div>
  );
}
