"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { API } from "@/config";
import { fetchWithInclude } from "@/utils/fetchWithInclude";
import { LIQPAY_LAST_ORDER_ID_KEY } from "@/utils/liqpayCheckout";

type ResolvePayload = {
  paid?: boolean;
  status?: string;
  opaque?: string | null;
  token?: string | null;
  purchaseId?: string | number | null;
  purchase_id?: string | number | null;
  purchase?: {
    id?: string | number | null;
    opaque?: string | null;
  } | null;
};

const RETURN_LAST_PURCHASE_ID_KEY = "liqpay_last_purchase_id";

const clampNumber = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const MAX_ATTEMPTS = clampNumber(Number(process.env.NEXT_PUBLIC_RETURN_POLL_ATTEMPTS ?? 40), 30, 45);
const RETRY_DELAY_MS = clampNumber(Number(process.env.NEXT_PUBLIC_RETURN_POLL_DELAY_MS ?? 3000), 2000, 4000);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractPurchaseId = (payload: ResolvePayload): string | null => {
  const id = payload.purchaseId ?? payload.purchase_id ?? payload.purchase?.id ?? null;
  return id === null || id === undefined || id === "" ? null : String(id);
};

const extractOpaque = (payload: ResolvePayload): string | null => {
  const opaque = payload.opaque ?? payload.token ?? payload.purchase?.opaque ?? null;
  if (typeof opaque !== "string") {
    return null;
  }

  const trimmed = opaque.trim();
  return trimmed || null;
};

const isPaidResponse = (payload: ResolvePayload) => {
  const normalizedStatus = String(payload.status ?? "").toLowerCase();
  return payload.paid === true || normalizedStatus === "paid";
};

const resolveStatus = (payload: ResolvePayload): "paid" | "pending" | "failed" | "unknown" => {
  const normalizedStatus = String(payload.status ?? "").trim().toLowerCase();

  if (isPaidResponse(payload) || normalizedStatus === "success") {
    return "paid";
  }

  if (["failed", "error", "cancelled", "canceled"].includes(normalizedStatus)) {
    return "failed";
  }

  if (["pending", "processing", "wait_secure", "wait_accept"].includes(normalizedStatus)) {
    return "pending";
  }

  return "unknown";
};

function ReturnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Проверяем оплату…");
  const [attempt, setAttempt] = useState(0);
  const [manualRetryTick, setManualRetryTick] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [lastPurchaseId, setLastPurchaseId] = useState("");
  const lastPurchaseIdRef = useRef("");
  const runIdRef = useRef(0);

  const queryPurchaseId = useMemo(() => {
    return (searchParams.get("purchase_id") ?? searchParams.get("purchaseId") ?? "").trim();
  }, [searchParams]);

  const orderId = useMemo(() => {
    const direct = searchParams.get("order_id");
    const fallback = searchParams.get("oid");
    const queryOrderId = (direct ?? fallback ?? "").trim();

    if (queryOrderId) {
      return queryOrderId;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return (
      sessionStorage.getItem(LIQPAY_LAST_ORDER_ID_KEY) ?? localStorage.getItem(LIQPAY_LAST_ORDER_ID_KEY) ?? ""
    ).trim();
  }, [searchParams]);

  useEffect(() => {
    if (orderId && typeof window !== "undefined") {
      sessionStorage.setItem(LIQPAY_LAST_ORDER_ID_KEY, orderId);
      localStorage.setItem(LIQPAY_LAST_ORDER_ID_KEY, orderId);
    }
  }, [orderId]);

  useEffect(() => {
    const fromQuery = queryPurchaseId;
    if (fromQuery) {
      setLastPurchaseId(fromQuery);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(RETURN_LAST_PURCHASE_ID_KEY, fromQuery);
        localStorage.setItem(RETURN_LAST_PURCHASE_ID_KEY, fromQuery);
      }
      return;
    }

    if (typeof window !== "undefined") {
      const fallbackPurchaseId = (
        sessionStorage.getItem(RETURN_LAST_PURCHASE_ID_KEY) ??
        localStorage.getItem(RETURN_LAST_PURCHASE_ID_KEY) ??
        ""
      ).trim();

      if (fallbackPurchaseId) {
        setLastPurchaseId(fallbackPurchaseId);
      }
    }
  }, [queryPurchaseId]);

  const liqPayStatus = useMemo(() => {
    return (searchParams.get("status") ?? "").trim();
  }, [searchParams]);

  const queryOpaque = useMemo(() => {
    return (searchParams.get("opaque") ?? searchParams.get("token") ?? "").trim();
  }, [searchParams]);

  useEffect(() => {
    lastPurchaseIdRef.current = lastPurchaseId;
  }, [lastPurchaseId]);

  useEffect(() => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const abortController = new AbortController();
    const isCurrentRun = () => runIdRef.current === runId;

    setIsFailed(false);

    if (!orderId) {
      setMessage("order_id not found");
      return;
    }

    const runResolve = async () => {
      for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
        if (!isCurrentRun()) {
          return;
        }

        setAttempt(index + 1);
        setMessage(index === 0 ? "Проверяем оплату…" : "Ожидаем подтверждение платежа…");

        try {
          const params = new URLSearchParams({ order_id: orderId });
          const response = await fetchWithInclude(`${API}/public/payments/resolve?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
            signal: abortController.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const payload = (await response.json()) as ResolvePayload;
          const purchaseId = extractPurchaseId(payload);
          const opaque = extractOpaque(payload) ?? queryOpaque;
          const status = resolveStatus(payload);

          if (purchaseId) {
            setLastPurchaseId(purchaseId);
            if (typeof window !== "undefined") {
              sessionStorage.setItem(RETURN_LAST_PURCHASE_ID_KEY, purchaseId);
              localStorage.setItem(RETURN_LAST_PURCHASE_ID_KEY, purchaseId);
            }
          }

          if (status === "paid") {
            if (opaque) {
              const opaqueResponse = await fetchWithInclude(`${API}/q/${encodeURIComponent(opaque)}`, {
                method: "GET",
                cache: "no-store",
                signal: abortController.signal,
              });

              if (!opaqueResponse.ok) {
                throw new Error(`Opaque gateway failed: HTTP ${opaqueResponse.status}`);
              }
            }

            const targetPurchaseId = purchaseId || lastPurchaseIdRef.current;

            if (targetPurchaseId) {
              const purchaseResponse = await fetchWithInclude(
                `${API}/public/purchase/${encodeURIComponent(targetPurchaseId)}`,
                {
                  method: "GET",
                  cache: "no-store",
                  signal: abortController.signal,
                }
              );

              if (!purchaseResponse.ok) {
                throw new Error(`Purchase preload failed: HTTP ${purchaseResponse.status}`);
              }

              const params = new URLSearchParams({
                purchase_id: targetPurchaseId,
                payment: "success",
              });
              router.replace(`/?${params.toString()}`);
            } else {
              router.replace("/?payment=success");
            }
            return;
          }

          if (status === "failed") {
            setIsFailed(true);
            setMessage("Платёж отклонён или отменён. Попробуйте оплатить ещё раз.");
            return;
          }

          setMessage("Ожидаем подтверждение платежа…");
        } catch (error) {
          if (abortController.signal.aborted) {
            return;
          }
          console.error(error);
        }

        if (index < MAX_ATTEMPTS - 1) {
          await sleep(RETRY_DELAY_MS);
        }
      }

      if (isCurrentRun()) {
        setMessage("Оплата пока не подтверждена. Обновите страницу чуть позже.");
      }
    };

    void runResolve();

    return () => {
      abortController.abort();
    };
  }, [manualRetryTick, orderId, queryOpaque, router]);

  const handleRetryPayment = () => {
    if (lastPurchaseId) {
      router.push(`/purchase/${encodeURIComponent(lastPurchaseId)}`);
      return;
    }

    router.push("/");
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Возврат после оплаты</h1>
      <p className="text-slate-600">{message}</p>
      <p className="text-sm text-slate-500">order_id: {orderId || "—"}</p>
      <p className="text-sm text-slate-500">status: {liqPayStatus || "—"}</p>
      <p className="text-xs text-slate-400">Попытка: {attempt} / {MAX_ATTEMPTS}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          onClick={() => setManualRetryTick((value) => value + 1)}
        >
          Проверить ещё раз
        </button>
        {isFailed && (
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            onClick={handleRetryPayment}
          >
            Повторить оплату
          </button>
        )}
      </div>
    </main>
  );
}

export default function ReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Возврат после оплаты</h1>
          <p className="text-slate-600">Проверяем оплату…</p>
        </main>
      }
    >
      <ReturnPageContent />
    </Suspense>
  );
}
