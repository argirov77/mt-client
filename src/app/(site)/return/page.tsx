"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { API } from "@/config";
import { fetchWithInclude } from "@/utils/fetchWithInclude";

type ResolvePayload = {
  paid?: boolean;
  status?: string;
  purchaseId?: string | number | null;
  purchase_id?: string | number | null;
};

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractPurchaseId = (payload: ResolvePayload): string | null => {
  const id = payload.purchaseId ?? payload.purchase_id ?? null;
  return id === null || id === undefined || id === "" ? null : String(id);
};

const isPaidResponse = (payload: ResolvePayload) => {
  const normalizedStatus = String(payload.status ?? "").toLowerCase();
  return payload.paid === true || normalizedStatus === "paid";
};

export default function ReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Проверяем оплату…");
  const [attempt, setAttempt] = useState(0);
  const [manualRetryTick, setManualRetryTick] = useState(0);
  const cancelledRef = useRef(false);

  const orderId = useMemo(() => {
    const direct = searchParams.get("order_id");
    const fallback = searchParams.get("oid");
    return (direct ?? fallback ?? "").trim();
  }, [searchParams]);

  const liqPayStatus = useMemo(() => {
    return (searchParams.get("status") ?? "").trim();
  }, [searchParams]);

  useEffect(() => {
    cancelledRef.current = false;

    if (!orderId) {
      setMessage("Не найден order_id в URL возврата.");
      return;
    }

    const runResolve = async () => {
      for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
        if (cancelledRef.current) {
          return;
        }

        setAttempt(index + 1);
        setMessage(index === 0 ? "Проверяем оплату…" : "Проверяем оплату повторно…");

        try {
          const params = new URLSearchParams({ order_id: orderId });
          const response = await fetchWithInclude(`${API}/payments/resolve?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const payload = (await response.json()) as ResolvePayload;
          const purchaseId = extractPurchaseId(payload);

          if (purchaseId && isPaidResponse(payload)) {
            router.replace(`/purchase/${encodeURIComponent(purchaseId)}`);
            return;
          }
        } catch (error) {
          console.error(error);
        }

        if (index < MAX_ATTEMPTS - 1) {
          await sleep(RETRY_DELAY_MS);
        }
      }

      if (!cancelledRef.current) {
        setMessage("Оплата пока не подтверждена. Обновите страницу чуть позже.");
      }
    };

    void runResolve();

    return () => {
      cancelledRef.current = true;
    };
  }, [manualRetryTick, orderId, router]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Возврат после оплаты</h1>
      <p className="text-slate-600">{message}</p>
      <p className="text-sm text-slate-500">order_id: {orderId || "—"}</p>
      <p className="text-sm text-slate-500">status: {liqPayStatus || "—"}</p>
      <p className="text-xs text-slate-400">Попытка: {attempt} / {MAX_ATTEMPTS}</p>
      <button
        type="button"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        onClick={() => setManualRetryTick((value) => value + 1)}
      >
        Проверить ещё раз
      </button>
    </main>
  );
}
