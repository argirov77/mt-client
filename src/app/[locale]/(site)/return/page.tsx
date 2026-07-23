"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { API } from "@/config";
import { fetchWithInclude } from "@/utils/fetchWithInclude";
import { downloadTicketPdf } from "@/utils/ticketPdf";
import { LIQPAY_LAST_ORDER_ID_KEY, clearLastLiqPayOrderId } from "@/utils/liqpayCheckout";
import type { PurchaseView, PurchaseTicket } from "@/types/purchase";
import { useLanguage } from "@/components/common/LanguageProvider";
import {
  trackEvent,
  trackPurchase,
  buildRouteCategory,
  daysUntil,
  BOOKING_CURRENCY,
} from "@/lib/analytics";
import { returnTranslations, dateLocaleMap } from "@/translations/return";
import type { Lang } from "@/components/common/LanguageProvider";

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
  fiscal_status?: "pending" | "processing" | "done" | "failed" | null;
  fiscal_receipt_url?: string | null;
  checkbox_fiscal_code?: string | null;
};

type PageState =
  | { kind: "checking"; attempt: number }
  | { kind: "paid"; purchaseView: PurchaseView; purchaseId: string }
  | { kind: "paid_no_details" }
  | { kind: "pending_timeout" }
  | { kind: "failed"; reason: "no_order" | "http_error" | "declined"; httpStatus?: number };

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

const formatDate = (dateStr: string, locale: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ========== Helpers for ticket grouping ==========

type TicketWithPassenger = {
  ticket: PurchaseTicket;
  passengerName: string;
  email: string;
};

type TicketGroup = {
  direction: "outbound" | "return";
  routeName: string;
  date: string;
  from: string;
  to: string;
  departureTime?: string;
  arrivalTime?: string;
  items: TicketWithPassenger[];
};

type FiscalState = {
  status: "idle" | "pending" | "processing" | "done" | "failed" | "timeout" | "error";
  receiptUrl: string | null;
  fiscalCode: string | null;
  message: string | null;
};

function getTicketDetails(ticket: PurchaseTicket, locale: string) {
  const departure = ticket.segment_details?.departure ?? null;
  const arrival = ticket.segment_details?.arrival ?? null;
  const segments = Array.isArray(ticket.segments) ? ticket.segments : [];
  const fromSegment = segments.find((s) => s.is_departure);
  const toSegment = segments.find((s) => s.is_arrival);
  const fromName = departure?.name ?? fromSegment?.stop_name ?? "—";
  const toName = arrival?.name ?? toSegment?.stop_name ?? "—";
  const routeName =
    ticket.tour?.route_name ?? ticket.route?.name ?? `${fromName} - ${toName}`;
  const date = ticket.tour?.date ? formatDate(ticket.tour.date, locale) : "—";
  return { fromName, toName, routeName, date, departureTime: departure?.time, arrivalTime: arrival?.time };
}

// ========== Ticket group card ==========

function TicketGroupCard({ group, lang }: { group: TicketGroup; lang: Lang }) {
  const t = returnTranslations[lang];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          group.direction === "outbound"
            ? "bg-sky-50 text-sky-700 border border-sky-100"
            : "bg-violet-50 text-violet-700 border border-violet-100"
        }`}>
          {group.direction === "outbound" ? (
            <svg aria-hidden viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10m0 0L9 4m4 4L9 12" />
            </svg>
          ) : (
            <svg aria-hidden viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 8H3m0 0l4-4M3 8l4 4" />
            </svg>
          )}
          {group.direction === "outbound" ? t.outbound : t.returnDir}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.route}
          </p>
          <p className="text-base font-semibold text-slate-900 truncate">
            {group.routeName}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.date}
          </p>
          <p className="text-sm font-medium text-slate-700">{group.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.from}
          </p>
          <p className="text-sm font-semibold text-slate-900">{group.from}</p>
          {group.departureTime && (
            <p className="text-xs text-slate-500">{group.departureTime}</p>
          )}
        </div>
        <div className="rounded-xl bg-slate-50 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.to}
          </p>
          <p className="text-sm font-semibold text-slate-900">{group.to}</p>
          {group.arrivalTime && (
            <p className="text-xs text-slate-500">{group.arrivalTime}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.passengers}
        </p>
        <div className="flex flex-wrap gap-2">
          {group.items.map(({ ticket, passengerName }) => (
            <div
              key={String(ticket.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5"
            >
              <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="5" r="3" />
                <path strokeLinecap="round" d="M2 14c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" />
              </svg>
              <span className="text-sm text-slate-700">{passengerName}</span>
              {ticket.seat_num !== null && ticket.seat_num !== undefined && (
                <span className="text-xs font-semibold text-sky-600 bg-sky-50 rounded-full px-1.5 py-0.5">
                  {t.seat} {ticket.seat_num}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== Paid view ==========

function PaidView({
  purchaseView,
  purchaseId,
  orderId,
  lang,
}: {
  purchaseView: PurchaseView;
  purchaseId: string;
  orderId: string;
  lang: Lang;
}) {
  const t = returnTranslations[lang];
  const locale = dateLocaleMap[lang];

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [fiscalState, setFiscalState] = useState<FiscalState>({
    status: "idle",
    receiptUrl: null,
    fiscalCode: null,
    message: null,
  });
  const [isFiscalRefreshing, setIsFiscalRefreshing] = useState(false);

  const tickets = Array.isArray(purchaseView.tickets) ? purchaseView.tickets : [];
  const passengers = Array.isArray(purchaseView.passengers) ? purchaseView.passengers : [];
  const trips = Array.isArray(purchaseView.trips) ? purchaseView.trips : [];
  const customer = purchaseView.customer ?? null;
  const paxCount = purchaseView.totals?.pax_count ?? passengers.length;

  const passengerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of passengers) {
      map.set(String(p.id), p.name);
    }
    return map;
  }, [passengers]);

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

  const getPassengerName = (ticket: PurchaseTicket): string => {
    return passengerNameById.get(String(ticket.passenger_id)) ?? t.defaultPassengerName;
  };

  const customerName = customer?.name ?? passengers[0]?.name ?? null;

  // Build ticket groups by direction
  const ticketGroups = useMemo((): TicketGroup[] => {
    const ticketById = new Map<string, PurchaseTicket>();
    for (const tk of tickets) {
      ticketById.set(String(tk.id), tk);
    }

    const groups: TicketGroup[] = [];
    const usedTicketIds = new Set<string>();

    for (const trip of trips) {
      const direction = trip.direction;
      const tripTicketIds = Array.isArray(trip.tickets)
        ? trip.tickets.map(String)
        : [];
      const tripTickets = tripTicketIds
        .map((id) => ticketById.get(id))
        .filter((tk): tk is PurchaseTicket => tk !== undefined);

      if (tripTickets.length === 0) continue;

      const firstTicket = tripTickets[0];
      const details = getTicketDetails(firstTicket, locale);

      const items: TicketWithPassenger[] = tripTickets.map((ticket) => ({
        ticket,
        passengerName: getPassengerName(ticket),
        email: getEmail(ticket),
      }));

      groups.push({
        direction,
        routeName: details.routeName,
        date: details.date,
        from: details.fromName,
        to: details.toName,
        departureTime: details.departureTime,
        arrivalTime: details.arrivalTime,
        items,
      });

      for (const id of tripTicketIds) {
        usedTicketIds.add(id);
      }
    }

    // Handle tickets not in any trip
    const ungrouped = tickets.filter((tk) => !usedTicketIds.has(String(tk.id)));
    if (ungrouped.length > 0) {
      const firstTicket = ungrouped[0];
      const details = getTicketDetails(firstTicket, locale);
      groups.push({
        direction: "outbound",
        routeName: details.routeName,
        date: details.date,
        from: details.fromName,
        to: details.toName,
        departureTime: details.departureTime,
        arrivalTime: details.arrivalTime,
        items: ungrouped.map((ticket) => ({
          ticket,
          passengerName: getPassengerName(ticket),
          email: getEmail(ticket),
        })),
      });
    }

    return groups;
  }, [tickets, trips, passengerNameById, passengerEmailById, customer, locale]);

  const hasEmail = tickets.some((tk) => Boolean(getEmail(tk)));

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    setDownloadError(null);
    try {
      for (const ticket of tickets) {
        const email = getEmail(ticket);
        if (!email) continue;
        await downloadTicketPdf({
          ticketId: ticket.id,
          purchaseId,
          email,
          source: "return_page",
        });
      }
    } catch {
      setDownloadError(t.downloadError);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const isRoundTrip = ticketGroups.some((g: TicketGroup) => g.direction === "return");

  const resolveFiscal = async (opts?: { manual?: boolean }): Promise<FiscalState["status"]> => {
    if (opts?.manual) setIsFiscalRefreshing(true);
    try {
      const params = new URLSearchParams({ order_id: orderId });
      const response = await fetchWithInclude(
        `${API}/public/payments/resolve?${params.toString()}`,
        { method: "GET", cache: "no-store" }
      );
      if (!response.ok) {
        const isInvalidOrder = response.status === 400 || response.status === 404;
        setFiscalState((prev) => ({
          ...prev,
          status: "error",
          message: isInvalidOrder ? t.fiscalInvalidOrder : t.fiscalResolveError(response.status),
        }));
        return "error";
      }
      const payload = (await response.json()) as ResolvePayload;
      const status = payload.fiscal_status ?? "pending";
      const receiptUrl = payload.fiscal_receipt_url?.trim() || null;
      const fiscalCode = payload.checkbox_fiscal_code?.trim() || null;
      const nextState: FiscalState["status"] = status;
      setFiscalState({
        status,
        receiptUrl,
        fiscalCode,
        message: null,
      });
      return nextState;
    } catch {
      setFiscalState((prev) => ({
        ...prev,
        status: "error",
        message: t.fiscalNetworkError,
      }));
      return "error";
    } finally {
      if (opts?.manual) setIsFiscalRefreshing(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    let timeoutId: number | null = null;
    const startedAt = Date.now();
    const POLL_DELAY_MS = 4000;
    const MAX_POLL_MS = 180000;

    const run = async () => {
      if (!isActive) return;
      const status = await resolveFiscal();
      if (!isActive) return;

      const shouldPoll =
        status === "idle" || status === "pending" || status === "processing";

      if (!shouldPoll) return;

      if (Date.now() - startedAt >= MAX_POLL_MS) {
        setFiscalState((prev) => ({ ...prev, status: "timeout" }));
        return;
      }
      timeoutId = window.setTimeout(run, POLL_DELAY_MS);
    };

    void run();
    return () => {
      isActive = false;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleReceiptClick = () => {
    if (!fiscalState.receiptUrl) return;
    if (typeof window !== "undefined") {
      const analyticsWindow = window as Window & {
        dataLayer?: Array<Record<string, unknown>>;
      };
      analyticsWindow.dataLayer?.push?.({
        event: "fiscal_receipt_download_click",
        order_id: orderId,
        purchase_id: purchaseId,
      });
      window.open(fiscalState.receiptUrl, "_blank", "noopener,noreferrer");
    }
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
          {t.paymentSuccess}
        </h1>
        {customerName && (
          <p className="text-lg text-slate-700">
            {customerName}
          </p>
        )}
        <p className="text-slate-600">
          {t.ticketsReady}
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
          <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="5" r="3" />
            <path strokeLinecap="round" d="M2 14c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" />
          </svg>
          {t.passengerCount(paxCount)}
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
          <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="12" height="10" rx="1.5" />
            <path d="M2 7h12" />
          </svg>
          {t.ticketCount(tickets.length)}
        </div>
        {isRoundTrip && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-sm text-violet-600">
            <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M3 5h10M13 5l-3-3M13 11H3M3 11l3 3" />
            </svg>
            {t.roundTrip}
          </div>
        )}
      </div>

      {/* Ticket groups */}
      <div className="space-y-4">
        {ticketGroups.map((group: TicketGroup, idx: number) => (
          <TicketGroupCard key={`${group.direction}-${idx}`} group={group} lang={lang} />
        ))}
      </div>

      {/* Download all button */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={!hasEmail || isDownloadingAll}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isDownloadingAll ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t.downloadingTickets}
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
              {t.downloadAllTickets(tickets.length)}
            </>
          )}
        </button>
        {!hasEmail && (
          <p className="text-xs text-slate-400">
            {t.noEmailWarning}
          </p>
        )}
        {downloadError && (
          <p className="text-sm text-red-600">{downloadError}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">{t.fiscalTitle}</h2>
        {(fiscalState.status === "idle" || fiscalState.status === "pending" || fiscalState.status === "processing") && (
          <p className="mt-2 text-sm text-slate-600">{t.fiscalProcessing}</p>
        )}
        {fiscalState.status === "timeout" && (
          <p className="mt-2 text-sm text-amber-700">{t.fiscalTimeout}</p>
        )}
        {fiscalState.status === "done" && fiscalState.receiptUrl && (
          <div className="mt-3 flex flex-col items-start gap-2">
            <button type="button" onClick={handleReceiptClick} className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition">
              {t.downloadFiscalReceipt}
            </button>
            {fiscalState.fiscalCode && <p className="text-xs text-slate-500">{t.fiscalCodeLabel}: {fiscalState.fiscalCode}</p>}
          </div>
        )}
        {(fiscalState.status === "failed" || fiscalState.status === "error") && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-red-600">{fiscalState.message ?? t.fiscalUnavailable}</p>
            <button type="button" onClick={() => void resolveFiscal({ manual: true })} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-60" disabled={isFiscalRefreshing}>
              {isFiscalRefreshing ? t.refreshing : t.refreshStatus}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// ========== Main content ==========

function ReturnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runIdRef = useRef(0);
  const { lang } = useLanguage();
  const t = returnTranslations[lang];

  const [pageState, setPageState] = useState<PageState>({
    kind: "checking",
    attempt: 0,
  });

  const abandonedFiredRef = useRef(false);

  const fireAbandoned = (
    reason: string,
    extra: Record<string, unknown> = {},
  ) => {
    if (abandonedFiredRef.current) return;
    abandonedFiredRef.current = true;

    let timeSpentSeconds: number | undefined;
    let storedPurchaseId: string | null = null;
    if (typeof window !== "undefined") {
      const startTs = sessionStorage.getItem("ga_checkout_start_ts");
      if (startTs) {
        timeSpentSeconds = Math.floor((Date.now() - Number(startTs)) / 1000);
      }
      storedPurchaseId = sessionStorage.getItem("ga_checkout_purchase_id");
    }

    const isFastReturn = timeSpentSeconds !== undefined && timeSpentSeconds < 30;
    const finalReason = isFastReturn ? "fast_return" : reason;
    const transactionId = extra.transaction_id ?? storedPurchaseId ?? undefined;

    trackEvent("checkout_abandoned", {
      reason: finalReason,
      transaction_id: transactionId,
      time_spent_seconds: timeSpentSeconds,
      ...extra,
    });

    if (isFastReturn) {
      trackEvent("payment_window_closed", {
        transaction_id: transactionId,
        time_spent_seconds: timeSpentSeconds,
      });
    }

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ga_checkout_start_ts");
      sessionStorage.removeItem("ga_checkout_purchase_id");
    }
  };

  const firePurchaseEvent = (purchaseView: PurchaseView, purchaseId: string) => {
    if (typeof window === "undefined") return;

    const tickets = purchaseView.tickets ?? [];
    const trips = purchaseView.trips ?? [];
    const directionByTicketId = new Map<string, string>();
    for (const trip of trips) {
      for (const ticketId of trip.tickets ?? []) {
        directionByTicketId.set(String(ticketId), trip.direction);
      }
    }
    const isRoundtrip =
      new Set(trips.map((trip) => trip.direction).filter(Boolean)).size > 1;

    const departureTimes = tickets
      .map((ticket) => {
        const raw = ticket.segment_details?.departure?.time;
        if (!raw) return null;
        const ts = new Date(raw).getTime();
        return Number.isFinite(ts) ? ts : null;
      })
      .filter((value): value is number => value !== null);
    const earliestDeparture = departureTimes.length
      ? Math.min(...departureTimes)
      : null;
    const daysUntilDeparture = daysUntil(earliestDeparture);

    const transactionId = String(
      purchaseView.purchase.id ?? purchaseId,
    );

    const uniqueTickets = Array.from(
      new Map(tickets.map((ticket) => [String(ticket.id), ticket])).values(),
    );

    // Источник цены purchase.value (per-ticket fare): ticket.pricing.price —
    // та же цена билета в основных единицах валюты, которую PurchaseClient
    // рендерит через formatCurrency и суммирует как ticketsSubtotal. Каждый
    // билет = 1 место (quantity: 1), поэтому value = Σ(цена билета × 1) =
    // «реальная цена билета текущей транзакции × количество».
    const items = uniqueTickets.map((ticket) => {
      const direction = directionByTicketId.get(String(ticket.id));
      const departureName = ticket.segment_details?.departure?.name ?? "";
      const arrivalName = ticket.segment_details?.arrival?.name ?? "";
      return {
        item_id: String(ticket.id),
        item_name: `${departureName} → ${arrivalName}`,
        item_category: isRoundtrip ? "roundtrip" : "oneway",
        item_category2: buildRouteCategory(
          { id: ticket.segment_details?.departure?.id, name: departureName },
          { id: ticket.segment_details?.arrival?.id, name: arrivalName },
        ),
        item_variant: direction,
        price: ticket.pricing?.price,
        quantity: 1,
      };
    });

    // Резерв для value, когда бэкенд не отдал per-ticket pricing. Порядок:
    //  1) ga_checkout_value — сумма квоты, сохранённая на add_payment_info
    //     (funnel-consistent, совпадает с суммой, которую видел пользователь);
    //  2) totals.paid / amount_due — раньше именно этот резерв улетал в ~72 373.
    // trackPurchase всегда предпочитает сумму по items (per-ticket fare) и
    // берёт valueOverride ТОЛЬКО если у билетов нет цены.
    let checkoutValueFallback: number | null = null;
    try {
      const stored = sessionStorage.getItem("ga_checkout_value");
      if (stored) {
        const parsed = Number(stored);
        if (Number.isFinite(parsed) && parsed > 0) checkoutValueFallback = parsed;
      }
    } catch {
      /* ignore */
    }

    // Валюта транзакции — из того же источника, что и value: per-ticket
    // ticket.pricing.currency (та же пара price/currency, которую PurchaseClient
    // рендерит через formatCurrency). НЕ purchase.currency (оно приходило BGN на
    // гривневых оплатах — рассинхрон с ценами билетов) и НЕ локаль. purchase.currency
    // используется как фолбэк только когда у билетов нет pricing (тогда value тоже
    // падает на amount_due, валюта которого = purchase.currency).
    const transactionCurrency =
      uniqueTickets.find((ticket) => ticket.pricing?.currency)?.pricing?.currency ??
      purchaseView.purchase.currency ??
      BOOKING_CURRENCY;

    const fired = trackPurchase({
      transactionId,
      items,
      locale: lang,
      currency: transactionCurrency,
      valueOverride:
        checkoutValueFallback ??
        purchaseView.totals?.paid ??
        purchaseView.purchase.amount_due,
      extra: {
        passenger_count: uniqueTickets.length,
        trip_type: isRoundtrip ? "roundtrip" : "oneway",
        days_until_departure: daysUntilDeparture,
        payment_method: "liqpay",
      },
    });

    if (fired) {
      try {
        sessionStorage.removeItem("ga_checkout_start_ts");
        sessionStorage.removeItem("ga_checkout_purchase_id");
        sessionStorage.removeItem("ga_checkout_value");
      } catch {
        /* ignore */
      }
    }
  };

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
    if (queryPurchaseId) return `purchase-${queryPurchaseId}`;

    if (typeof window === "undefined") return "";

    return (
      sessionStorage.getItem(LIQPAY_LAST_ORDER_ID_KEY) ??
      localStorage.getItem(LIQPAY_LAST_ORDER_ID_KEY) ??
      ""
    ).trim();
  }, [queryPurchaseId, searchParams]);

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
        reason: "no_order",
      });
      return;
    }

    const runResolve = async () => {
      for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
        if (!isCurrentRun()) return;

        setPageState({
          kind: "checking",
          attempt: index + 1,
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
                  reason: "http_error",
                  httpStatus: response.status,
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
              try {
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

                const purchaseData = await purchaseResponse.json();

                if (!isCurrentRun()) return;

                // Validate that the response has the expected shape
                const purchaseView = purchaseData as PurchaseView;
                if (
                  purchaseView &&
                  typeof purchaseView === "object" &&
                  Array.isArray(purchaseView.tickets) &&
                  purchaseView.tickets.length > 0
                ) {
                  firePurchaseEvent(purchaseView, targetPurchaseId);
                  setPageState({
                    kind: "paid",
                    purchaseView,
                    purchaseId: targetPurchaseId,
                  });
                } else {
                  console.warn("[return] purchase response has unexpected shape:", purchaseData);
                  setPageState({ kind: "paid_no_details" });
                }
              } catch (purchaseError) {
                if (abortController.signal.aborted) return;
                console.warn("[return] paid but could not fetch purchase details:", purchaseError);
                if (isCurrentRun()) {
                  setPageState({ kind: "paid_no_details" });
                }
              }
            } else {
              // Paid but no purchase ID — show success without ticket details
              if (isCurrentRun()) {
                setPageState({ kind: "paid_no_details" });
              }
            }
            return;
          }

          if (status === "failed") {
            fireAbandoned("payment_failed", {
              transaction_id: resolvedPurchaseId || undefined,
              payment_status: payload.status ?? null,
            });
            setPageState({
              kind: "failed",
              reason: "declined",
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
        fireAbandoned("polling_timeout", {
          transaction_id: resolvedPurchaseId || undefined,
        });
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
        orderId={orderId}
        lang={lang}
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
          {t.paymentSuccess}
        </h1>
        <p className="text-slate-600 max-w-sm">
          {t.paidNoDetailsMessage}
        </p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition"
          onClick={() => router.push("/")}
        >
          {t.goHome}
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
          {t.paymentProcessing}
        </h1>
        <p className="text-slate-600 max-w-sm">
          {t.pendingTimeoutMessage}
        </p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition"
          onClick={() => router.push("/")}
        >
          {t.goHome}
        </button>
      </main>
    );
  }

  // ── Failed ──────────────────────────────────────────────────────────────
  if (pageState.kind === "failed") {
    const failedMessage =
      pageState.reason === "no_order"
        ? t.orderNotFound
        : pageState.reason === "http_error"
          ? t.httpError(pageState.httpStatus ?? 0)
          : t.failedMessage;

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
          {t.paymentError}
        </h1>
        <p className="text-slate-600">{failedMessage}</p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition"
          onClick={handleRetryPayment}
        >
          {t.retryPayment}
        </button>
      </main>
    );
  }

  // ── Checking (spinner) ──────────────────────────────────────────────────
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-600" />
      <h1 className="text-2xl font-semibold text-slate-900">
        {t.checkingTitle}
      </h1>
      <p className="text-slate-600">
        {pageState.attempt <= 1 ? t.checkingPayment : t.awaitingConfirmation}
      </p>
      {pageState.attempt > 3 && (
        <p className="text-xs text-slate-400">
          {t.attemptCounter(pageState.attempt, MAX_ATTEMPTS)}
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
        </main>
      }
    >
      <ReturnPageContent />
    </Suspense>
  );
}
