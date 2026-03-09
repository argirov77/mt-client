"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { API } from "@/config";
import { fetchWithInclude } from "@/utils/fetchWithInclude";
import { downloadTicketPdf } from "@/utils/ticketPdf";
import { LIQPAY_LAST_ORDER_ID_KEY, clearLastLiqPayOrderId } from "@/utils/liqpayCheckout";
import type { PurchaseView, PurchaseTicket } from "@/types/purchase";

// ========== Types ==========

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

type PageState =
  | { kind: "checking"; attempt: number; message: string }
  | { kind: "paid"; purchaseView: PurchaseView; purchaseId: string }
  | { kind: "paid_no_details" }
  | { kind: "pending_timeout" }
  | { kind: "failed"; message: string };

// ========== Constants ==========

const clampNumber = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const MAX_ATTEMPTS = clampNumber(
  Number(process.env.NEXT_PUBLIC_RETURN_POLL_ATTEMPTS ?? 40),
  30,
  45
);
const RETRY_DELAY_MS = clampNumber(
  Number(process.env.NEXT_PUBLIC_RETURN_POLL_DELAY_MS ?? 3000),
  2000,
  4000
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ========== Helpers ==========

const extractPurchaseId = (payload: ResolvePayload): string | null => {
  const id =
    payload.purchaseId ?? payload.purchase_id ?? payload.purchase?.id ?? null;
  return id === null || id === undefined || id === "" ? null : String(id);
};

const extractOpaque = (payload: ResolvePayload): string | null => {
  const opaque =
    payload.opaque ?? payload.token ?? payload.purchase?.opaque ?? null;
  if (typeof opaque !== "string") return null;
  const trimmed = opaque.trim();
  return trimmed || null;
};

const resolveStatus = (
  payload: ResolvePayload
): "paid" | "pending" | "failed" | "unknown" => {
  const normalizedStatus = String(payload.status ?? "")
    .trim()
    .toLowerCase();

  if (
    payload.paid === true ||
    normalizedStatus === "success" ||
    normalizedStatus === "paid"
  ) {
    return "paid";
  }

  if (
    ["failed", "error", "cancelled", "canceled"].includes(normalizedStatus)
  ) {
    return "failed";
  }

  if (
    ["pending", "processing", "wait_secure", "wait_accept"].includes(
      normalizedStatus
    )
  ) {
    return "pending";
  }

  console.warn("[return] resolveStatus: unexpected status value:", JSON.stringify(payload.status));
  return "unknown";
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ========== Ticket card ==========

function TicketCard({
  ticket,
  purchaseId,
  email,
}: {
  ticket: PurchaseTicket;
  purchaseId: string;
  email: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const departure = ticket.segment_details?.departure ?? null;
  const arrival = ticket.segment_details?.arrival ?? null;

  const fromSegment = ticket.segments.find((s) => s.is_departure);
  const toSegment = ticket.segments.find((s) => s.is_arrival);

  const fromName = departure?.name ?? fromSegment?.stop_name ?? "—";
  const toName = arrival?.name ?? toSegment?.stop_name ?? "—";
  const routeName =
    ticket.tour.route_name ?? ticket.route?.name ?? `${fromName} → ${toName}`;
  const date = ticket.tour.date ? formatDate(ticket.tour.date) : "—";
  const seatNum = ticket.seat_num;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadTicketPdf({ ticketId: ticket.id, purchaseId, email });
    } catch {
      setDownloadError("Не удалось скачать билет. Попробуйте позже.");
    } finally {
      setIsDownloading(false);
    }
  };

  const canDownload = Boolean(email) && !isDownloading;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Маршрут
          </p>
          <p className="text-base font-semibold text-slate-900 truncate">
            {routeName}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Дата
          </p>
          <p className="text-sm font-medium text-slate-700">{date}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Откуда
          </p>
          <p className="text-sm font-semibold text-slate-900">{fromName}</p>
          {departure?.time && (
            <p className="text-xs text-slate-500">{departure.time}</p>
          )}
        </div>
        <div className="rounded-xl bg-slate-50 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Куда
          </p>
          <p className="text-sm font-semibold text-slate-900">{toName}</p>
          {arrival?.time && (
            <p className="text-xs text-slate-500">{arrival.time}</p>
          )}
        </div>
      </div>

      {seatNum !== null && seatNum !== undefined && (
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 border border-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
          Место №{seatNum}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!canDownload}
          className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isDownloading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Загрузка…
            </>
          ) : (
            <>
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 3v9m0 0l-3-3m3 3l3-3M4 15h12"
                />
              </svg>
              Скачать PDF
            </>
          )}
        </button>
        {!email && (
          <p className="text-xs text-slate-400">
            Email не указан — скачивание недоступно
          </p>
        )}
        {downloadError && (
          <p className="text-sm text-red-600">{downloadError}</p>
        )}
      </div>
    </div>
  );
}

// ========== Paid view ==========

function PaidView({
  purchaseView,
  purchaseId,
}: {
  purchaseView: PurchaseView;
  purchaseId: string;
}) {
  const { tickets, passengers, customer } = purchaseView;

  const passengerEmailById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of passengers) {
      if (p.email) {
        map.set(String(p.id), p.email);
      }
    }
    return map;
  }, [passengers]);

  const getEmail = (ticket: PurchaseTicket): string => {
    return (
      passengerEmailById.get(String(ticket.passenger_id)) ??
      customer?.email ??
      ""
    );
  };

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <div className="text-center space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Оплата прошла успешно!
        </h1>
        <p className="text-slate-600">
          Ваши билеты готовы. Копия также будет отправлена вам на email.
        </p>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={String(ticket.id)}
            ticket={ticket}
            purchaseId={purchaseId}
            email={getEmail(ticket)}
          />
        ))}
      </div>
    </main>
  );
}

// ========== Main content ==========

function ReturnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runIdRef = useRef(0);

  const [pageState, setPageState] = useState<PageState>({
    kind: "checking",
    attempt: 0,
    message: "Проверяем оплату…",
  });

  const queryPurchaseId = useMemo(() => {
    return (
      searchParams.get("purchase_id") ??
      searchParams.get("purchaseId") ??
      ""
    ).trim();
  }, [searchParams]);

  const orderId = useMemo(() => {
    const direct = searchParams.get("order_id");
    const fallback = searchParams.get("oid");
    const queryOrderId = (direct ?? fallback ?? "").trim();

    if (queryOrderId) return queryOrderId;

    if (typeof window === "undefined") return "";

    return (
      sessionStorage.getItem(LIQPAY_LAST_ORDER_ID_KEY) ??
      localStorage.getItem(LIQPAY_LAST_ORDER_ID_KEY) ??
      ""
    ).trim();
  }, [searchParams]);

  const queryOpaque = useMemo(() => {
    return (
      searchParams.get("opaque") ?? searchParams.get("token") ?? ""
    ).trim();
  }, [searchParams]);

  useEffect(() => {
    if (orderId && typeof window !== "undefined") {
      sessionStorage.setItem(LIQPAY_LAST_ORDER_ID_KEY, orderId);
      localStorage.setItem(LIQPAY_LAST_ORDER_ID_KEY, orderId);
    }
  }, [orderId]);

  useEffect(() => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    const abortController = new AbortController();
    const isCurrentRun = () => runIdRef.current === runId;

    // Use queryPurchaseId from URL as initial fallback
    let resolvedPurchaseId = queryPurchaseId;

    if (!orderId) {
      setPageState({
        kind: "failed",
        message: "Не удалось определить номер заказа.",
      });
      return;
    }

    const runResolve = async () => {
      for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
        if (!isCurrentRun()) return;

        setPageState({
          kind: "checking",
          attempt: index + 1,
          message:
            index === 0
              ? "Проверяем оплату…"
              : "Ожидаем подтверждение платежа…",
        });

        try {
          const params = new URLSearchParams({ order_id: orderId });
          const response = await fetchWithInclude(
            `${API}/public/payments/resolve?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
              signal: abortController.signal,
            }
          );

          if (!response.ok) {
            if (response.status >= 400 && response.status < 500) {
              // 4xx — client error, no point retrying
              if (isCurrentRun()) {
                setPageState({
                  kind: "failed",
                  message: `Ошибка запроса (HTTP ${response.status}). Попробуйте позже или обратитесь в поддержку.`,
                });
              }
              return;
            }
            // 5xx — server error, continue polling
            console.warn(`[return] resolve HTTP ${response.status}, retrying…`);
            continue;
          }

          const payload = (await response.json()) as ResolvePayload;
          const purchaseIdFromPayload = extractPurchaseId(payload);
          const opaque = extractOpaque(payload) ?? queryOpaque;
          const status = resolveStatus(payload);

          if (purchaseIdFromPayload) {
            resolvedPurchaseId = purchaseIdFromPayload;
          }

          if (status === "paid") {
            clearLastLiqPayOrderId();

            // Restore session via opaque token if available (non-fatal)
            if (opaque) {
              try {
                await fetchWithInclude(
                  `${API}/q/${encodeURIComponent(opaque)}`,
                  {
                    method: "GET",
                    cache: "no-store",
                    signal: abortController.signal,
                  }
                );
              } catch {
                // non-fatal: session restore is best-effort
              }
            }

            const targetPurchaseId = resolvedPurchaseId;

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
                throw new Error(
                  `Purchase fetch failed: HTTP ${purchaseResponse.status}`
                );
              }

              const purchaseView =
                (await purchaseResponse.json()) as PurchaseView;

              if (!isCurrentRun()) return;

              setPageState({
                kind: "paid",
                purchaseView,
                purchaseId: targetPurchaseId,
              });
            } else {
              // Paid but no purchase ID — show success without ticket details
              if (isCurrentRun()) {
                setPageState({ kind: "paid_no_details" });
              }
            }
            return;
          }

          if (status === "failed") {
            setPageState({
              kind: "failed",
              message: "Платёж отклонён или отменён. Попробуйте оплатить ещё раз.",
            });
            return;
          }

          // Still pending/unknown — continue polling
        } catch (error) {
          if (abortController.signal.aborted) return;
          console.error(error);
        }

        if (index < MAX_ATTEMPTS - 1) {
          await sleep(RETRY_DELAY_MS);
        }
      }

      // Reached max attempts without confirmation
      if (isCurrentRun()) {
        setPageState({ kind: "pending_timeout" });
      }
    };

    void runResolve();

    return () => {
      abortController.abort();
    };
  }, [orderId, queryOpaque, queryPurchaseId]);

  const handleRetryPayment = () => {
    if (queryPurchaseId) {
      router.push(`/purchase/${encodeURIComponent(queryPurchaseId)}`);
      return;
    }
    router.push("/");
  };

  // ── Paid: show ticket info ──────────────────────────────────────────────
  if (pageState.kind === "paid") {
    return (
      <PaidView
        purchaseView={pageState.purchaseView}
        purchaseId={pageState.purchaseId}
      />
    );
  }

  // ── Paid but no purchase details available ──────────────────────────────
  if (pageState.kind === "paid_no_details") {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Оплата прошла успешно!
        </h1>
        <p className="text-slate-600 max-w-sm">
          Билеты будут отправлены на ваш email. Если вы не получите их в течение
          нескольких минут, проверьте папку «Спам» или обратитесь в поддержку.
        </p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition"
          onClick={() => router.push("/")}
        >
          На главную
        </button>
      </main>
    );
  }

  // ── Pending timeout: max attempts reached ───────────────────────────────
  if (pageState.kind === "pending_timeout") {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Оплата обрабатывается
        </h1>
        <p className="text-slate-600 max-w-sm">
          Подтверждение от платёжной системы ещё не пришло. Билеты будут
          отправлены на ваш email, как только оплата будет подтверждена.
        </p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition"
          onClick={() => router.push("/")}
        >
          На главную
        </button>
      </main>
    );
  }

  // ── Failed ──────────────────────────────────────────────────────────────
  if (pageState.kind === "failed") {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Ошибка оплаты
        </h1>
        <p className="text-slate-600">{pageState.message}</p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition"
          onClick={handleRetryPayment}
        >
          Вернуться к оформлению
        </button>
      </main>
    );
  }

  // ── Checking (spinner) ──────────────────────────────────────────────────
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-600" />
      <h1 className="text-2xl font-semibold text-slate-900">
        Возврат после оплаты
      </h1>
      <p className="text-slate-600">{pageState.message}</p>
      {pageState.attempt > 3 && (
        <p className="text-xs text-slate-400">
          Попытка {pageState.attempt} / {MAX_ATTEMPTS}
        </p>
      )}
    </main>
  );
}

export default function ReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-600" />
          <h1 className="text-2xl font-semibold text-slate-900">
            Возврат после оплаты
          </h1>
          <p className="text-slate-600">Проверяем оплату…</p>
        </main>
      }
    >
      <ReturnPageContent />
    </Suspense>
  );
}
