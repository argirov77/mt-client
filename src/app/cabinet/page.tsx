"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import UiAlert from "@/components/common/Alert";
import Loader from "@/components/common/Loader";
import PurchaseClient from "@/components/purchase/PurchaseClient";

const PURCHASE_PARAM_KEYS = [
  "purchaseId",
  "purchase_id",
  "purchase",
  "id",
  "ticketId",
  "ticket_id",
  "ticket",
];

const COOKIE_PATTERN = /(?:^|;\s*)minicab_purchase_(\w+)=/i;

function CabinetPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let resolved: string | null = null;

    if (searchParams) {
      for (const key of PURCHASE_PARAM_KEYS) {
        const value = searchParams.get(key);
        if (value) {
          const trimmed = value.trim();
          if (trimmed) {
            resolved = trimmed;
            break;
          }
        }
      }
    }

    if (!resolved && pathname) {
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 1) {
        const candidate = segments[segments.length - 1];
        if (candidate && candidate.toLowerCase() !== "cabinet") {
          resolved = candidate;
        }
      }
    }

    if (!resolved && typeof document !== "undefined") {
      const match = document.cookie.match(COOKIE_PATTERN);
      if (match && match[1]) {
        const fromCookie = match[1].trim();
        if (fromCookie) {
          resolved = fromCookie;
        }
      }
    }

    setPurchaseId((prev) => (prev === resolved ? prev : resolved));
    setInitialized(true);
  }, [pathname, searchParams]);

  if (!initialized) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Loader />
      </div>
    );
  }

  if (!purchaseId) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <UiAlert type="error">
          Не удалось определить покупку. Проверьте, что вы открываете ссылку из письма
          или повторите переход из кабинета.
        </UiAlert>
      </div>
    );
  }
  return <PurchaseClient purchaseId={purchaseId} />;
}

export default function CabinetPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Loader />
        </div>
      }
    >
      <CabinetPageContent />
    </Suspense>
  );
}
