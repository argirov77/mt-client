"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { API } from "@/config";
import { fetchWithInclude } from "@/utils/fetchWithInclude";

interface QrExchangeClientProps {
  opaque: string;
}

const PURCHASE_COOKIE_PATTERN = /(?:^|;\s*)minicab_purchase_(\w+)=/i;

const resolvePurchaseIdFromCookie = (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(PURCHASE_COOKIE_PATTERN);
  if (!match?.[1]) {
    return null;
  }

  const candidate = match[1].trim();
  return candidate || null;
};

export default function QrExchangeClient({ opaque }: QrExchangeClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const opaquePath = useMemo(() => `${API}/q/${encodeURIComponent(opaque)}`, [opaque]);

  useEffect(() => {
    let cancelled = false;

    const openPurchase = async () => {
      if (!opaque) {
        router.replace("/");
        return;
      }

      try {
        const response = await fetchWithInclude(opaquePath, { method: "GET" });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const purchaseId = resolvePurchaseIdFromCookie();

        if (cancelled) {
          return;
        }

        if (purchaseId) {
          router.replace(`/purchase/${encodeURIComponent(purchaseId)}`);
          return;
        }

        router.replace("/cabinet");
      } catch (opaqueError) {
        console.error(opaqueError);
        if (!cancelled) {
          setError("Не удалось открыть покупку. Проверьте ссылку и попробуйте ещё раз.");
        }
      }
    };

    void openPurchase();

    return () => {
      cancelled = true;
    };
  }, [opaque, opaquePath, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 to-sky-200 p-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-white/95 p-6 text-center shadow-xl">
        <h1 className="text-xl font-semibold text-slate-800">Подключаем покупку к сессии…</h1>
        <p className="text-sm text-slate-500">
          Сначала активируем ссылку и получаем cookie сессии, после чего откроем вашу покупку.
        </p>

        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.replace("/cabinet")}
            className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
          >
            Открыть кабинет
          </button>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow hover:bg-slate-100"
          >
            На главную
          </button>
        </div>
      </div>
    </main>
  );
}
