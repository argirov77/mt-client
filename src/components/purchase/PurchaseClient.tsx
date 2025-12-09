"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

import UiAlert from "@/components/common/Alert";
import Loader from "@/components/common/Loader";
import Calendar from "@/components/Calendar";
import SeatClient, { type SeatSelectionDetail } from "@/components/SeatClient";
import { API } from "@/config";
import { downloadTicketPdf } from "@/utils/ticketPdf";
import type {
  BaggageQuote,
  CancelPreview,
  PurchaseHistoryEvent,
  PurchaseSummary,
  PurchasePassenger,
  PurchaseSegment,
  PurchaseTicket,
  PurchaseTrip,
  PurchaseView,
  PurchaseTotals,
} from "@/types/purchase";
import { fetchWithInclude } from "@/utils/fetchWithInclude";
import styles from "./PurchaseClient.module.css";

const SCROLL_STORAGE_KEY = "purchase.scrolls.v1";

type ScrollPositions = Record<string, number>;

type ScrollableCardProps = {
  title: string;
  meta?: string;
  scrollKey: string;
  ariaLabel?: string;
  initialScrollTop: number;
  renderContent: () => ReactNode;
  onScrollChange: (scrollKey: string, value: number) => void;
  onScrollStart?: () => void;
};

function ScrollableCard({
  title,
  meta,
  scrollKey,
  ariaLabel,
  initialScrollTop,
  renderContent,
  onScrollChange,
  onScrollStart,
}: ScrollableCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const latestInitialRef = useRef(initialScrollTop);
  const scrollTopRef = useRef(initialScrollTop ?? 0);
  const [scrolled, setScrolled] = useState((initialScrollTop ?? 0) > 24);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (initialScrollTop !== latestInitialRef.current) {
      el.scrollTop = initialScrollTop ?? 0;
      latestInitialRef.current = initialScrollTop;
      scrollTopRef.current = initialScrollTop ?? 0;
      setScrolled((initialScrollTop ?? 0) > 24);
    }
  }, [initialScrollTop]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const top = Math.round(el.scrollTop);
      if (top !== scrollTopRef.current) {
        onScrollStart?.();
      }
      scrollTopRef.current = top;
      setScrolled(top > 24);
      onScrollChange(scrollKey, top);
    };

    el.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [onScrollChange, onScrollStart, scrollKey]);

  const handleToTop = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTop = 0;
    }

    scrollTopRef.current = 0;
    setScrolled(false);
    onScrollChange(scrollKey, 0);
    onScrollStart?.();
  }, [onScrollChange, onScrollStart, scrollKey]);

  const areaClassName = [styles.scrollArea, scrolled ? styles.scrollAreaScrolled : ""].filter(Boolean).join(" ");

  return (
    <section className={`${styles.card} ${styles.scrollCard}`} aria-label={ariaLabel ?? title}>
      <div className={styles.scrollCardHeader}>
        <div>
          <h2 className={styles.scrollCardTitle}>{title}</h2>
          {meta ? <span className={styles.scrollCardMeta}>{meta}</span> : null}
        </div>
      </div>
      <div ref={containerRef} className={areaClassName}>
        {renderContent()}
        <button
          type="button"
          className={`${styles.toTop} ${scrolled ? styles.toTopVisible : ""}`}
          onClick={handleToTop}
          title="Прокрутить вверх"
        >
          ↑ <span>Вверх</span>
        </button>
      </div>
    </section>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачено",
  canceled: "Отменено",
  expired: "Истёкло",
  reserved: "Забронировано",
};

const DIRECTION_LABELS: Record<string, string> = {
  outbound: "Туда",
  return: "Обратно",
};

const ACTION_DISABLED_STATUSES = new Set(["canceled", "expired"]);

const MENU_HEIGHT_ESTIMATE = 192;
const MENU_GAP = 8;

type PurchaseAction = "pay" | "reschedule" | "cancel" | "baggage";

type ActionBanner = {
  type: "info" | "success" | "error";
  message: string;
};

const DEFAULT_TOTALS: PurchaseTotals = {
  paid: 0,
  due: 0,
  refundable_now: 0,
  baggage_count: 0,
  pax_count: 0,
};

const formatDate = (value: string | undefined | null) => {
  if (!value) return "";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const formatTime = (value: string | undefined | null) => {
  if (!value) return "--:--";

  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {
    // ignore parsing errors and fall back to manual formatting below
  }

  if (/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
    return value.slice(0, 5);
  }

  return value.slice(11, 16) || value;
};

const parseDate = (value: string | undefined | null) => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
};

const formatCurrency = (amount: number | undefined | null, currency: string | undefined | null) => {
  if (amount === undefined || amount === null) {
    return "—";
  }

  if (!currency) {
    try {
      return new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return amount.toFixed(2);
    }
  }

  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const minutesBetween = (from: Date | null, to: Date | null) => {
  if (!from || !to) return null;
  const diffMs = to.getTime() - from.getTime();
  return diffMs > 0 ? Math.round(diffMs / 60000) : null;
};

const mapById = <T extends { id: string | number }>(items: T[]) => {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(String(item.id), item);
  });
  return map;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toNumberSafe = (value: unknown, fallback = 0) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return fallback;
    }

    const cleaned = trimmed.replace(/[^0-9,.-]+/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === "+") {
      return fallback;
    }

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    let normalized = cleaned;

    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "");
      normalized = normalized.replace(/,/g, ".");
    } else if (lastDot > lastComma) {
      normalized = normalized.replace(/,/g, "");
    } else {
      normalized = normalized.replace(/,/g, "");
    }

    // allow a single leading minus sign
    const sign = normalized.startsWith("-") ? "-" : "";
    const unsigned = sign ? normalized.slice(1) : normalized;
    const sanitized = `${sign}${unsigned.replace(/[-]/g, "")}`;

    const parsed = Number(sanitized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toDateTimeString = (date?: string | null, time?: string | null) => {
  if (!date && !time) {
    return "";
  }

  if (!date) {
    return String(time ?? "");
  }

  if (!time) {
    return String(date ?? "");
  }

  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  return `${date}T${normalizedTime}`;
};

const ensureDateTimeString = (
  primary: string | undefined | null,
  fallbackDate: string | undefined | null,
  fallbackTime: string | undefined | null
) => {
  if (primary) {
    const parsed = Date.parse(primary);
    if (!Number.isNaN(parsed)) {
      return primary;
    }
  }

  if (fallbackTime) {
    const parsed = Date.parse(fallbackTime);
    if (!Number.isNaN(parsed)) {
      return fallbackTime;
    }
  }

  const timeCandidate = primary ?? fallbackTime;
  return toDateTimeString(fallbackDate ?? undefined, timeCandidate ?? null);
};

const normalizeStopId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const ensureStringOrNumber = (value: unknown, fallback: string | number): string | number => {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  const normalized = normalizeStopId(value);
  if (normalized !== null) {
    return normalized;
  }

  return fallback;
};

const toOptionalStringOrNumber = (value: unknown): string | number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  const normalized = normalizeStopId(value);
  return normalized !== null ? normalized : undefined;
};

type RescheduleContext = {
  ticketIds: string[];
  ticketIdentifiers: PurchaseTicket["id"][];
  seatCount: number;
  departureStopId: number;
  arrivalStopId: number;
  departureName: string;
  arrivalName: string;
};

type RescheduleTour = {
  id: number;
  date: string;
  departure_time: string;
  arrival_time: string;
  seats: number | { free: number };
  layout_variant?: string | null;
  price?: number | null;
  description?: string | null;
};

type RescheduleQuote = {
  can_apply: boolean;
  price_change: number;
  currency: string;
  note?: string | null;
};

type RescheduleApplyResponse = {
  status?: string;
  amount_due?: number;
  currency?: string;
};

type BaggageApplyResponse = {
  status?: string;
  amount_due?: number;
  currency?: string;
};

const buildSegments = (
  segment: Record<string, unknown> | undefined,
  tourDate: string | undefined,
  routeStops: Array<Record<string, unknown>>
) => {
  if (!segment) {
    if (routeStops.length === 0) {
      return [];
    }

    return routeStops.map((stop, index) => ({
      stop_id: ensureStringOrNumber(stop.id, `route-stop-${index}`),
      stop_name: String(stop.name ?? ""),
      time: toDateTimeString(tourDate, String(stop.departure_time ?? stop.arrival_time ?? stop.time ?? "")),
      is_departure: index === 0,
      is_arrival: index === routeStops.length - 1,
    }));
  }

  const segments: PurchaseSegment[] = [];

  const departure = segment?.departure as Record<string, unknown> | undefined;
  if (departure) {
    segments.push({
      stop_id: ensureStringOrNumber(departure.id ?? departure.stop_id, "departure"),
      stop_name: String(departure.name ?? departure.stop_name ?? ""),
      time: toDateTimeString(tourDate, String(departure.time ?? "")),
      is_departure: true,
      is_arrival: false,
    });
  }

  const intermediate = Array.isArray(segment?.intermediate_stops)
    ? (segment.intermediate_stops as Array<Record<string, unknown>>)
    : [];

  intermediate.forEach((stop, index) => {
    segments.push({
      stop_id: ensureStringOrNumber(stop.id ?? stop.stop_id, `stop-${index}`),
      stop_name: String(stop.name ?? stop.stop_name ?? ""),
      time: toDateTimeString(tourDate, String(stop.departure_time ?? stop.arrival_time ?? "")),
      is_departure: false,
      is_arrival: false,
    });
  });

  const arrival = segment?.arrival as Record<string, unknown> | undefined;
  if (arrival) {
    segments.push({
      stop_id: ensureStringOrNumber(arrival.id ?? arrival.stop_id, "arrival"),
      stop_name: String(arrival.name ?? arrival.stop_name ?? ""),
      time: toDateTimeString(tourDate, String(arrival.time ?? "")),
      is_departure: false,
      is_arrival: true,
    });
  }

  if (segments.length === 0 && routeStops.length > 0) {
    routeStops.forEach((stop, index) => {
      segments.push({
        stop_id: ensureStringOrNumber(stop.id, `route-stop-${index}`),
        stop_name: String(stop.name ?? ""),
        time: toDateTimeString(
          tourDate,
          String(stop.departure_time ?? stop.arrival_time ?? stop.time ?? "")
        ),
        is_departure: index === 0,
        is_arrival: index === routeStops.length - 1,
      });
    });
  }

  return segments;
};

const normalizePurchasePayload = (payload: unknown): PurchaseView => {
  const raw = (isObject(payload) ? payload : {}) as Record<string, unknown>;
  const rawPurchase = (isObject(raw.purchase) ? raw.purchase : raw) as Record<string, unknown>;
  const customerInfo = isObject(rawPurchase?.customer)
    ? (rawPurchase.customer as Record<string, unknown>)
    : undefined;

  const rawTickets = Array.isArray(raw.tickets)
    ? (raw.tickets as Array<Record<string, unknown>>)
    : Array.isArray((rawPurchase?.tickets as unknown[]))
      ? (rawPurchase.tickets as Array<Record<string, unknown>>)
      : [];

  const passengersMap = new Map<string, PurchasePassenger>();

  const normalizedTickets: PurchaseTicket[] = rawTickets.map((entry, index) => {
    const ticketInfo = isObject(entry.ticket) ? entry.ticket : entry;
    const passengerInfo = isObject(entry.passenger) ? entry.passenger : undefined;
    const tourInfo = isObject(entry.tour) ? entry.tour : undefined;
    const routeInfo = isObject(entry.route) ? entry.route : undefined;
    const segmentInfo = isObject(entry.segment) ? entry.segment : undefined;
    const pricingInfo = isObject(entry.pricing) ? entry.pricing : undefined;
    const paymentStatus = isObject(entry.payment_status) ? entry.payment_status : undefined;

      const passengerIdRaw = passengerInfo?.["id"] ?? ticketInfo?.["passenger_id"] ?? `passenger-${index}`;
      const passengerId = String(passengerIdRaw ?? `passenger-${index}`);
      const passengerName =
        (passengerInfo?.["name"] as string | undefined) ??
        (ticketInfo?.["passenger_name"] as string | undefined) ??
        (ticketInfo?.["passengerName"] as string | undefined) ??
        (ticketInfo?.["name"] as string | undefined) ??
        (customerInfo?.["name"] as string | undefined) ??
        "Пассажир";

      if (!passengersMap.has(passengerId)) {
        passengersMap.set(passengerId, {
          id: passengerId,
          name: String(passengerName ?? passengerId),
          email: (passengerInfo?.["email"] ?? null) as string | null,
          phone: (passengerInfo?.["phone"] ?? null) as string | null,
        });
      }

    const tourDate = (tourInfo?.date as string | undefined) ?? (rawPurchase?.date as string | undefined);
    const routeStops = Array.isArray(routeInfo?.stops)
      ? (routeInfo?.stops as Array<Record<string, unknown>>)
      : [];
    const intermediateStops = Array.isArray(segmentInfo?.intermediate_stops)
      ? (segmentInfo?.intermediate_stops as Array<Record<string, unknown>>)
      : [];

      const segments = buildSegments(segmentInfo, tourDate, routeStops);

      const ticketIdCandidate =
        ticketInfo?.id ??
        ticketInfo?.ticket_id ??
        ticketInfo?.ticketId ??
        entry.id ??
        entry.ticket_id ??
        entry.ticketId;
      const ticketId = ensureStringOrNumber(ticketIdCandidate, index);

      const tourIdCandidate = tourInfo?.id ?? rawPurchase?.tour_id ?? rawPurchase?.id;
      const tourId = ensureStringOrNumber(tourIdCandidate, index);
      const routeId = toOptionalStringOrNumber(routeInfo?.id ?? tourInfo?.route_id);
      const departureDetails = isObject(segmentInfo?.departure)
        ? (segmentInfo?.departure as Record<string, unknown>)
        : undefined;
      const arrivalDetails = isObject(segmentInfo?.arrival)
        ? (segmentInfo?.arrival as Record<string, unknown>)
        : undefined;

    return {
      id: ticketId,
      passenger_id: passengerId,
      status: (paymentStatus?.status as string | undefined) ?? (ticketInfo?.status as string | undefined) ?? (rawPurchase?.status as string | undefined) ?? "pending",
      seat_id: (ticketInfo?.seat_id ?? ticketInfo?.seatId ?? null) as number | string | null,
      seat_num: (ticketInfo?.seat_number ?? ticketInfo?.seat_num ?? ticketInfo?.seat ?? null) as number | string | null,
      extra_baggage: toNumberSafe(ticketInfo?.extra_baggage ?? ticketInfo?.extraBaggage, 0),
        tour: {
          id: tourId,
          date: String(tourDate ?? rawPurchase?.created_at ?? ""),
          route_id: routeId,
          route_name: String(routeInfo?.name ?? tourInfo?.route_name ?? rawPurchase?.route_name ?? ""),
        },
        segments,
        route: routeInfo
          ? {
              id: toOptionalStringOrNumber(routeInfo.id),
              name: routeInfo.name as string | undefined,
              stops: routeStops.map((stop, stopIndex) => ({
                id: ensureStringOrNumber(stop.id, `route-stop-${stopIndex}`),
                order: stop.order as number | undefined,
                name: String(stop.name ?? ""),
                arrival_time: (stop.arrival_time ?? stop.arrivalTime ?? null) as string | null,
                departure_time: (stop.departure_time ?? stop.departureTime ?? null) as string | null,
                description: (stop.description ?? null) as string | null,
              })),
            }
          : undefined,
        pricing: pricingInfo
        ? {
            price: (pricingInfo.price ?? pricingInfo.total ?? null) as number | null,
            currency: (pricingInfo.currency ?? pricingInfo.currency_code ?? null) as string | null,
          }
        : undefined,
        segment_details: {
          departure: departureDetails
            ? {
                id: toOptionalStringOrNumber(departureDetails.id),
                name: departureDetails.name as string | undefined,
                order: departureDetails.order as number | undefined,
                time: departureDetails.time as string | undefined,
              }
            : null,
          arrival: arrivalDetails
            ? {
                id: toOptionalStringOrNumber(arrivalDetails.id),
                name: arrivalDetails.name as string | undefined,
                order: arrivalDetails.order as number | undefined,
                time: arrivalDetails.time as string | undefined,
              }
            : null,
          intermediate_stops: intermediateStops.map((stop) => ({
            id: toOptionalStringOrNumber(stop.id),
            name: stop.name as string | undefined,
            order: stop.order as number | undefined,
            arrival_time: (stop.arrival_time ?? stop.arrivalTime ?? null) as string | null,
            departure_time: (stop.departure_time ?? stop.departureTime ?? null) as string | null,
          })),
        duration_minutes: (segmentInfo?.duration_minutes as number | undefined) ?? null,
        duration_human: (segmentInfo?.duration_human as string | undefined) ?? null,
      },
    };
  });

  const rawPassengers = Array.isArray(raw.passengers)
    ? (raw.passengers as Array<Record<string, unknown>>)
    : Array.isArray((rawPurchase?.passengers as unknown[]))
      ? (rawPurchase.passengers as Array<Record<string, unknown>>)
      : [];

  rawPassengers.forEach((passenger, index) => {
    const passengerId = String(passenger.id ?? `passenger-${index}`);
    if (!passengersMap.has(passengerId)) {
      passengersMap.set(passengerId, {
        id: passengerId,
        name: String(passenger.name ?? passengerId),
        email: (passenger.email ?? null) as string | null,
        phone: (passenger.phone ?? null) as string | null,
      });
    }
  });

  const passengers = Array.from(passengersMap.values());

  const totalsSource = isObject(raw.totals)
    ? raw.totals
    : (isObject(rawPurchase?.totals) ? (rawPurchase.totals as Record<string, unknown>) : {});

  const totals: PurchaseTotals = {
    ...DEFAULT_TOTALS,
    ...(totalsSource as Partial<PurchaseTotals>),
  };

  totals.due = toNumberSafe(totals.due ?? rawPurchase?.amount_due ?? raw.amount_due, 0);
  totals.paid = toNumberSafe(totals.paid ?? rawPurchase?.amount_paid, 0);
  totals.baggage_count = toNumberSafe(
    totals.baggage_count,
    normalizedTickets.reduce((acc, ticket) => acc + toNumberSafe(ticket.extra_baggage, 0), 0)
  );
  totals.pax_count = toNumberSafe(totals.pax_count, passengers.length);

  const ticketsSubtotal = normalizedTickets.reduce(
    (sum, ticket) => sum + toNumberSafe(ticket.pricing?.price, 0),
    0
  );

  if (totals.due <= 0 && ticketsSubtotal > 0) {
    const outstanding = Math.max(ticketsSubtotal - totals.paid, 0);
    if (outstanding > 0) {
      totals.due = outstanding;
    } else if (totals.paid === 0) {
      totals.due = ticketsSubtotal;
    }
  }

  const inferredCurrency =
    (normalizedTickets.find((ticket) => ticket.pricing?.currency)?.pricing?.currency as string | undefined) ??
    (rawPurchase?.currency as string | undefined) ??
    (raw.currency as string | undefined) ??
    null;

  const purchaseIdCandidate =
    rawPurchase?.["id"] ??
    rawPurchase?.["purchase_id"] ??
    raw?.["id"] ??
    raw?.["purchase_id"];

  const purchaseSummary = {
    id: ensureStringOrNumber(purchaseIdCandidate, ""),
    status: (rawPurchase?.status ?? raw.status ?? "pending") as string,
    created_at: String(rawPurchase?.created_at ?? raw.created_at ?? ""),
    amount_due: toNumberSafe(rawPurchase?.amount_due ?? raw.amount_due ?? totals.due, 0),
    currency: inferredCurrency ?? "",
    deadline: (rawPurchase?.deadline ?? rawPurchase?.payment_deadline ?? null) as string | null,
  } satisfies PurchaseSummary;

  const historySource = Array.isArray(raw.history)
    ? raw.history
    : Array.isArray(rawPurchase?.history)
      ? (rawPurchase.history as Array<Record<string, unknown>>)
      : [];

  const history: PurchaseHistoryEvent[] = historySource
    .map((event) => ({
      id: event.id ?? event.event_id ?? event.uuid ?? undefined,
      date: String(event.date ?? event.created_at ?? ""),
      category: String(event.category ?? event.type ?? "Событие"),
      amount:
        event.amount !== undefined
          ? Number(event.amount)
          : event.value !== undefined
            ? Number(event.value)
            : null,
      currency: (event.currency ?? event.currency_code ?? inferredCurrency ?? null) as string | null,
      method: (event.method ?? event.payment_method ?? null) as string | null,
      comment: (event.comment ?? event.description ?? null) as string | null,
    }))
    .filter((event) => Boolean(event.date));

  let trips: PurchaseTrip[] = Array.isArray(raw.trips)
    ? (raw.trips as Array<Record<string, unknown>>)
        .map((trip) => {
          const ticketIds = Array.isArray(trip.tickets)
            ? (trip.tickets as Array<PurchaseTicket["id"]>)
            : [];

          if (ticketIds.length === 0) {
            return null;
          }

          return {
            direction: trip.direction === "return" ? "return" : "outbound",
            tickets: ticketIds,
          } satisfies PurchaseTrip;
        })
        .filter((trip): trip is PurchaseTrip => Boolean(trip))
    : [];

  if (trips.length === 0 && normalizedTickets.length > 0) {
    const grouped = new Map<string, Array<PurchaseTicket["id"]>>();
    normalizedTickets.forEach((ticket) => {
      const key = String(ticket.tour?.id ?? ticket.id);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(ticket.id);
    });

    trips = Array.from(grouped.values()).map((ticketIds) => ({
      direction: "outbound" as const,
      tickets: ticketIds,
    }));
  }

  return {
    purchase: purchaseSummary,
    passengers,
    tickets: normalizedTickets,
    trips,
    totals,
    history,
    customer: customerInfo
      ? {
          name: String(customerInfo.name ?? ""),
          email: (customerInfo.email ?? null) as string | null,
          phone: (customerInfo.phone ?? null) as string | null,
        }
      : null,
  };
};

const tripTickets = (trip: PurchaseTrip, tickets: PurchaseTicket[]) => {
  const ticketMap = mapById(tickets);
  return trip.tickets
    .map((id) => ticketMap.get(String(id)))
    .filter((ticket): ticket is PurchaseTicket => Boolean(ticket));
};

const tripSummary = (tickets: PurchaseTicket[]) => {
  if (tickets.length === 0) {
    return null;
  }

  const allSegments = tickets.flatMap((ticket) => ticket.segments ?? []);
  if (allSegments.length === 0) {
    return null;
  }

  const departures = allSegments.filter((segment) => segment.is_departure);
  const arrivals = allSegments.filter((segment) => segment.is_arrival);
  const firstDeparture =
    departures.reduce((earliest, segment) => {
      const segmentDate = parseDate(segment.time);
      if (!segmentDate) return earliest;
      if (!earliest) return { segment, date: segmentDate };
      return segmentDate < earliest.date ? { segment, date: segmentDate } : earliest;
    }, null as { segment: typeof allSegments[number]; date: Date } | null)?.segment ??
    allSegments[0];

  const lastArrival =
    arrivals.reduce((latest, segment) => {
      const segmentDate = parseDate(segment.time);
      if (!segmentDate) return latest;
      if (!latest) return { segment, date: segmentDate };
      return segmentDate > latest.date ? { segment, date: segmentDate } : latest;
    }, null as { segment: typeof allSegments[number]; date: Date } | null)?.segment ??
    allSegments[allSegments.length - 1];

  const startDate = parseDate(firstDeparture.time);
  const endDate = parseDate(lastArrival.time);

  return {
    from: firstDeparture.stop_name,
    to: lastArrival.stop_name,
    start: firstDeparture.time,
    end: lastArrival.time,
    durationMinutes: minutesBetween(startDate, endDate),
  };
};

type PurchaseClientProps = {
  purchaseId: string;
};

type PaymentPayload = {
  url: string;
  [key: string]: unknown;
};

const submitPaymentForm = (payload: PaymentPayload) => {
  if (typeof window === "undefined") return;

  const { url, ...fields } = payload;
  const targetUrl = typeof url === "string" ? url : "";
  if (!targetUrl) {
    return;
  }

  const paymentWindow = window.open("", "payment-window");
  if (!paymentWindow) {
    return;
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = targetUrl;
  form.target = paymentWindow.name;

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

export default function PurchaseClient({ purchaseId }: PurchaseClientProps) {
  const [data, setData] = useState<PurchaseView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<ActionBanner | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [openMenuTicketId, setOpenMenuTicketId] = useState<string | null>(null);
  const [rescheduleSelected, setRescheduleSelected] = useState<string[]>([]);
  const [rescheduleDates, setRescheduleDates] = useState<string[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleTours, setRescheduleTours] = useState<RescheduleTour[]>([]);
  const [rescheduleTourId, setRescheduleTourId] = useState<number | null>(null);
  const [rescheduleSeatNumbers, setRescheduleSeatNumbers] = useState<number[]>([]);
  const [rescheduleSeatDetails, setRescheduleSeatDetails] = useState<SeatSelectionDetail[]>([]);
  const [rescheduleQuote, setRescheduleQuote] = useState<RescheduleQuote | null>(null);
  const [rescheduleFetchingDates, setRescheduleFetchingDates] = useState(false);
  const [rescheduleFetchingTours, setRescheduleFetchingTours] = useState(false);
  const [rescheduleQuoteLoading, setRescheduleQuoteLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const [cancelSelected, setCancelSelected] = useState<string[]>([]);
  const [cancelPreview, setCancelPreview] = useState<CancelPreview | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [baggageDraft, setBaggageDraft] = useState<Record<string, number>>({});
  const [baggageQuote, setBaggageQuote] = useState<BaggageQuote | null>(null);
  const [baggageLoading, setBaggageLoading] = useState(false);
  const [baggageError, setBaggageError] = useState<string | null>(null);
  const [isBaggageModalOpen, setIsBaggageModalOpen] = useState(false);

  const [actionLoading, setActionLoading] = useState<PurchaseAction | null>(null);
  const [activePanel, setActivePanel] = useState<"reschedule" | "cancel" | null>(null);
  const [rescheduleScope, setRescheduleScope] = useState<"all" | "selected">("selected");
  const [scrollPositions, setScrollPositions] = useState<ScrollPositions>({});
  const [menuAnchor, setMenuAnchor] = useState<
    | {
        top: number;
        bottom: number;
        right: number;
        viewportHeight: number;
        placement: "up" | "down";
      }
    | null
  >(null);

  const closeTicketMenu = useCallback(() => {
    setOpenMenuTicketId(null);
    setMenuAnchor(null);
  }, []);

  const isActionDisabled = ACTION_DISABLED_STATUSES.has(String(data?.purchase?.status ?? ""));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(SCROLL_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        setScrollPositions(parsed as ScrollPositions);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const updateScrollPosition = useCallback((key: string, value: number) => {
    setScrollPositions((prev) => {
      if (prev[key] === value) {
        return prev;
      }

      const next = { ...prev, [key]: value };
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }
      }
      return next;
    });
  }, []);

  const makeScrollKey = useCallback((section: string) => `purchase-${purchaseId}::${section}`, [purchaseId]);

  const passengerMap = useMemo(() => {
    const map = new Map<string, PurchasePassenger>();
    (data?.passengers ?? []).forEach((passenger) => {
      map.set(String(passenger.id), passenger);
    });
    return map;
  }, [data]);

  const tripsDetailed = useMemo(() => {
    if (!data)
      return [] as Array<{
        trip: PurchaseTrip;
        tickets: PurchaseTicket[];
        summary: ReturnType<typeof tripSummary>;
      }>;
    const tickets = Array.isArray(data.tickets) ? data.tickets : [];
    const trips = Array.isArray(data.trips) ? data.trips : [];
    return trips.map((trip) => {
      const tripRelatedTickets = tripTickets(trip, tickets);
      return { trip, tickets: tripRelatedTickets, summary: tripSummary(tripRelatedTickets) };
    });
  }, [data]);

  const allTicketIds = useMemo(() => {
    if (!data) return [] as string[];
    return data.tickets.map((ticket) => String(ticket.id));
  }, [data]);

  const hasTickets = allTicketIds.length > 0;

  const outboundTickets = useMemo(() => {
    const outbound = tripsDetailed
      .filter((entry) => entry.trip.direction === "outbound")
      .flatMap((entry) => entry.tickets);
    if (outbound.length > 0) {
      return outbound;
    }
    return data?.tickets ?? [];
  }, [tripsDetailed, data]);

  const returnTickets = useMemo(() => {
    return tripsDetailed
      .filter((entry) => entry.trip.direction === "return")
      .flatMap((entry) => entry.tickets);
  }, [tripsDetailed]);

  const toOriginalTicketIds = useCallback(
    (selected: string[]) => {
      if (!data) {
        return selected as PurchaseTicket["id"][];
      }

      return selected.map((id) => {
        const ticket = data.tickets.find((item) => String(item.id) === id);
        return (ticket?.id ?? id) as PurchaseTicket["id"];
      });
    },
    [data]
  );

  const fetchPurchase = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsUnauthorized(false);

    try {
      const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}`);

      if ([401, 403, 404].includes(response.status)) {
        setIsUnauthorized(true);
        setData(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawPayload = await response.json();
      const normalizedPayload = normalizePurchasePayload(rawPayload);
      const tickets = normalizedPayload.tickets ?? [];
      setData(normalizedPayload);
      const initialBaggage: Record<string, number> = {};
      tickets.forEach((ticket) => {
        initialBaggage[String(ticket.id)] = Number(ticket.extra_baggage ?? 0);
      });
      setBaggageDraft(initialBaggage);
      setBanner(null);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Не удалось загрузить данные покупки");
    } finally {
      setLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    void fetchPurchase();
  }, [fetchPurchase]);

  const resolveContactEmail = useCallback((): string | null => {
    if (!data) {
      return null;
    }

    const emailCandidates: Array<string | null | undefined> = [
      data.customer?.email,
      ...data.passengers.map((passenger) => passenger.email),
    ];

    for (const candidate of emailCandidates) {
      if (typeof candidate !== "string") {
        continue;
      }
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }

    return null;
  }, [data]);

  const handleDownloadAll = useCallback(() => {
    if (!data) return;

    const contactEmail = resolveContactEmail();
    if (!contactEmail) {
      setBanner({ type: "error", message: "Не указан email для скачивания билетов" });
      return;
    }

    void (async () => {
      for (const ticket of data.tickets) {
        try {
          await downloadTicketPdf({
            ticketId: ticket.id,
            purchaseId: data.purchase.id,
            email: contactEmail,
          });
        } catch (error) {
          console.error(error);
          setBanner({ type: "error", message: "Не удалось скачать PDF. Попробуйте позже" });
          break;
        }
      }
    })();
  }, [data, resolveContactEmail]);

  const handleDownloadTicket = useCallback(
    async (ticketId: string | number) => {
      if (!data) {
        return;
      }

      const contactEmail = resolveContactEmail();
      if (!contactEmail) {
        setBanner({ type: "error", message: "Не указан email для скачивания билета" });
        return;
      }

      try {
        await downloadTicketPdf({
          ticketId,
          purchaseId: data.purchase.id,
          email: contactEmail,
        });
      } catch (error) {
        console.error(error);
        setBanner({ type: "error", message: "Не удалось скачать PDF. Попробуйте позже" });
      }
    },
    [data, resolveContactEmail]
  );

  const handleBulkDownload = useCallback(() => {
    if (!data || selectedTicketIds.length === 0) {
      return;
    }

    const contactEmail = resolveContactEmail();
    if (!contactEmail) {
      setBanner({ type: "error", message: "Не указан email для скачивания билетов" });
      return;
    }

    void (async () => {
      for (const id of selectedTicketIds) {
        const ticket = data.tickets.find((item) => String(item.id) === id);
        const originalId = ticket?.id ?? id;
        try {
          await downloadTicketPdf({
            ticketId: originalId,
            purchaseId: data.purchase.id,
            email: contactEmail,
          });
        } catch (bulkError) {
          console.error(bulkError);
          setBanner({ type: "error", message: "Не удалось скачать PDF. Попробуйте позже" });
          break;
        }
      }
    })();
  }, [data, resolveContactEmail, selectedTicketIds]);

  const validTicketIds = useMemo(() => {
    if (!data) {
      return new Set<string>();
    }
    return new Set(data.tickets.map((ticket) => String(ticket.id)));
  }, [data]);

  useEffect(() => {
    setSelectedTicketIds((prev) => prev.filter((id) => validTicketIds.has(id)));
  }, [validTicketIds]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-ticket-menu]")) {
        return;
      }
      closeTicketMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeTicketMenu();
      }
    };

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeTicketMenu]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      closeTicketMenu();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [closeTicketMenu]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleWindowScroll = () => {
      closeTicketMenu();
    };

    window.addEventListener("scroll", handleWindowScroll);
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [closeTicketMenu]);

  useEffect(() => {
    if (typeof document === "undefined" || !isBaggageModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeBaggageModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeBaggageModal, isBaggageModalOpen]);

  const rescheduleTickets = useMemo(() => {
    return rescheduleSelected.filter((id) => validTicketIds.has(id));
  }, [rescheduleSelected, validTicketIds]);

  const cancelTickets = useMemo(() => {
    return cancelSelected.filter((id) => validTicketIds.has(id));
  }, [cancelSelected, validTicketIds]);

  const rescheduleSelectionCount = rescheduleScope === "all" ? allTicketIds.length : rescheduleTickets.length;
  const cancelSelectionCount = cancelTickets.length;
  const selectedTicketSet = useMemo(() => new Set(selectedTicketIds), [selectedTicketIds]);
  const bulkSelectionCount = selectedTicketIds.length;

  const baggageChanged = useMemo(() => {
    if (!data) return false;
    return data.tickets.some((ticket) => {
      const initial = Number(ticket.extra_baggage ?? 0);
      const draftValue = baggageDraft[String(ticket.id)] ?? 0;
      return initial !== draftValue;
    });
  }, [data, baggageDraft]);

  const baggageDraftTotal = useMemo(() => {
    return Object.values(baggageDraft).reduce((sum, value) => sum + toNumberSafe(value, 0), 0);
  }, [baggageDraft]);

  const baggageChangedCount = useMemo(() => {
    if (!data) return 0;
    return data.tickets.reduce((count, ticket) => {
      const initial = Number(ticket.extra_baggage ?? 0);
      const draftValue = baggageDraft[String(ticket.id)] ?? 0;
      return initial === draftValue ? count : count + 1;
    }, 0);
  }, [data, baggageDraft]);

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTicketIds((prev) => {
      if (prev.includes(ticketId)) {
        return prev.filter((id) => id !== ticketId);
      }

      return [...prev, ticketId];
    });
  };

  const getTicketRouteMeta = useCallback((ticket: PurchaseTicket) => {
    const departureSegment = ticket.segments.find((segment) => segment.is_departure) ?? ticket.segments[0];
    const arrivalSegment =
      [...ticket.segments].reverse().find((segment) => segment.is_arrival) ??
      ticket.segments[ticket.segments.length - 1];

    const departureName = ticket.segment_details?.departure?.name ?? departureSegment?.stop_name ?? "—";
    const arrivalName = ticket.segment_details?.arrival?.name ?? arrivalSegment?.stop_name ?? "—";
    const ticketDateLabel = ticket.tour.date ? formatDate(ticket.tour.date) : null;

    return {
      routeLabel: `${departureName} → ${arrivalName}`,
      dateLabel: ticketDateLabel,
    };
  }, []);


  const openReschedulePanel = (ticketIds: string[]) => {
    if (isActionDisabled || !hasTickets) {
      return;
    }

    setRescheduleScope("selected");
    setRescheduleSelected(ticketIds);
    setRescheduleError(null);
    setRescheduleQuote(null);
    setActivePanel("reschedule");
    closeTicketMenu();
  };

  const handleBulkReschedule = () => {
    openReschedulePanel(selectedTicketIds);
  };

  const handleTicketReschedule = (ticketId: string) => {
    openReschedulePanel([ticketId]);
  };

  const handleOpenBaggagePanel = () => {
    if (isActionDisabled) {
      return;
    }

    setBaggageError(null);
    setBaggageQuote(null);
    setIsBaggageModalOpen(true);
    closeTicketMenu();
  };

  const closeBaggageModal = useCallback(() => {
    setIsBaggageModalOpen(false);
  }, []);

  const selectAllReschedule = () => {
    if (!data) return;
    setRescheduleSelected(data.tickets.map((ticket) => String(ticket.id)));
  };

  const clearRescheduleSelection = () => {
    setRescheduleSelected([]);
  };

  const selectAllCancel = () => {
    if (!data) return;
    setCancelSelected(data.tickets.map((ticket) => String(ticket.id)));
  };

  const clearCancelSelection = () => {
    setCancelSelected([]);
  };

  const incrementBaggage = (ticketId: string) => {
    setBaggageDraft((prev) => ({ ...prev, [ticketId]: (prev[ticketId] ?? 0) + 1 }));
    setBaggageQuote(null);
    setBaggageError(null);
  };

  const decrementBaggage = (ticketId: string) => {
    setBaggageDraft((prev) => ({ ...prev, [ticketId]: Math.max(0, (prev[ticketId] ?? 0) - 1) }));
    setBaggageQuote(null);
    setBaggageError(null);
  };

  const { rescheduleContext, rescheduleConsistencyError } = useMemo(() => {
    if (!data) {
      return { rescheduleContext: null as RescheduleContext | null, rescheduleConsistencyError: null as string | null };
    }

    const targetIds = rescheduleScope === "all" ? allTicketIds : rescheduleTickets;
    if (targetIds.length === 0) {
      return { rescheduleContext: null, rescheduleConsistencyError: null };
    }

    const targetTickets = targetIds
      .map((id) => data.tickets.find((ticket) => String(ticket.id) === id) ?? null)
      .filter((ticket): ticket is PurchaseTicket => Boolean(ticket));

    if (targetTickets.length === 0) {
      return { rescheduleContext: null, rescheduleConsistencyError: null };
    }

    const extractStop = (
      ticket: PurchaseTicket,
      key: "departure" | "arrival"
    ): { id: number; name: string } | null => {
      const details = ticket.segment_details?.[key] as Record<string, unknown> | undefined;
      const candidates = [details?.id, details?.stop_id];

      for (const candidate of candidates) {
        const normalized = normalizeStopId(candidate);
        if (normalized !== null) {
          const label = String(details?.name ?? details?.stop_name ?? "");
          return { id: normalized, name: label };
        }
      }

      const segments = ticket.segments ?? [];
      const segment =
        key === "departure"
          ? segments.find((item) => item.is_departure) ?? segments[0]
          : [...segments].reverse().find((item) => item.is_arrival) ?? segments[segments.length - 1];

      if (!segment) {
        return null;
      }

      const normalized = normalizeStopId(segment.stop_id);
      if (normalized === null) {
        return null;
      }

      return { id: normalized, name: String(segment.stop_name ?? "") };
    };

    const baseDeparture = extractStop(targetTickets[0], "departure");
    const baseArrival = extractStop(targetTickets[0], "arrival");

    if (!baseDeparture || !baseArrival) {
      return {
        rescheduleContext: null,
        rescheduleConsistencyError: "Не удалось определить остановки для выбранных билетов",
      };
    }

    for (const ticket of targetTickets) {
      const departure = extractStop(ticket, "departure");
      const arrival = extractStop(ticket, "arrival");

      if (!departure || !arrival) {
        return {
          rescheduleContext: null,
          rescheduleConsistencyError: "Не удалось определить остановки для выбранных билетов",
        };
      }

      if (departure.id !== baseDeparture.id || arrival.id !== baseArrival.id) {
        return {
          rescheduleContext: null,
          rescheduleConsistencyError: "Выбранные билеты имеют разные остановки и не могут быть перенесены вместе",
        };
      }
    }

    return {
      rescheduleContext: {
        ticketIds: targetIds,
        ticketIdentifiers: toOriginalTicketIds(targetIds),
        seatCount: targetIds.length,
        departureStopId: baseDeparture.id,
        arrivalStopId: baseArrival.id,
        departureName: baseDeparture.name,
        arrivalName: baseArrival.name,
      },
      rescheduleConsistencyError: null,
    };
  }, [data, rescheduleScope, allTicketIds, rescheduleTickets, toOriginalTicketIds]);

  useEffect(() => {
    if (!data) return;
    setRescheduleSelected((prev) => prev.filter((id) => validTicketIds.has(id)));
    setCancelSelected((prev) => prev.filter((id) => validTicketIds.has(id)));
  }, [data, validTicketIds]);

  useEffect(() => {
    if (rescheduleScope === "all") {
      setRescheduleSelected(allTicketIds);
    }
  }, [rescheduleScope, allTicketIds]);

  useEffect(() => {
    if (activePanel !== "reschedule") {
      return;
    }

    if (!rescheduleContext || rescheduleContext.seatCount === 0 || rescheduleConsistencyError) {
      setRescheduleDates([]);
      setRescheduleDate("");
      setRescheduleTours([]);
      setRescheduleTourId(null);
      setRescheduleSeatNumbers([]);
      setRescheduleSeatDetails([]);
      setRescheduleQuote(null);
      return;
    }

    let cancelled = false;
    setRescheduleFetchingDates(true);
    setRescheduleError(null);

    const params = new URLSearchParams({
      departure_stop_id: String(rescheduleContext.departureStopId),
      arrival_stop_id: String(rescheduleContext.arrivalStopId),
      seats: String(Math.max(rescheduleContext.seatCount, 1)),
    });

    (async () => {
      try {
        const response = await fetchWithInclude(`${API}/search/dates?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const rawDates = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as Record<string, unknown>)?.dates)
          ? (payload as Record<string, unknown>).dates
          : [];

        const normalized = (rawDates as unknown[])
          .map((value) => String(value ?? ""))
          .filter((value) => Boolean(value));

        if (cancelled) {
          return;
        }

        setRescheduleDates(normalized);
        setRescheduleDate((prev) => {
          if (prev && normalized.includes(prev)) {
            return prev;
          }
          return normalized[0] ?? "";
        });
      } catch (datesError) {
        if (cancelled) {
          return;
        }

        console.error(datesError);
        setRescheduleDates([]);
        setRescheduleDate("");
        setRescheduleTours([]);
        setRescheduleTourId(null);
        setRescheduleSeatNumbers([]);
        setRescheduleSeatDetails([]);
        setRescheduleQuote(null);
        setRescheduleError("Не удалось получить доступные даты для переноса");
      } finally {
        if (!cancelled) {
          setRescheduleFetchingDates(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activePanel, rescheduleContext, rescheduleConsistencyError]);

  const submitCancelPreview = useCallback(
    async (ticketIds: string[]) => {
      if (ticketIds.length === 0) {
        setCancelPreview(null);
        return;
      }
      setCancelLoading(true);
      setCancelError(null);

      try {
        const ticketIdentifiers = toOriginalTicketIds(ticketIds);
        const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/cancel/preview`, {
          method: "POST",
          body: JSON.stringify({ ticket_ids: ticketIdentifiers }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as CancelPreview;
        setCancelPreview(payload);
      } catch (previewError) {
        console.error(previewError);
        setCancelPreview(null);
        setCancelError("Не удалось рассчитать возврат");
      } finally {
        setCancelLoading(false);
      }
    },
    [purchaseId, toOriginalTicketIds]
  );

  const openCancelPanel = (ticketIds: string[]) => {
    if (isActionDisabled || !hasTickets) {
      return;
    }

    setCancelSelected(ticketIds);
    setCancelError(null);
    setActivePanel("cancel");
    closeTicketMenu();
    if (ticketIds.length > 0) {
      void submitCancelPreview(ticketIds);
    } else {
      setCancelPreview(null);
    }
  };

  const handleBulkCancel = () => {
    openCancelPanel(selectedTicketIds);
  };

  const handleTicketCancel = (ticketId: string) => {
    openCancelPanel([ticketId]);
  };

  const confirmCancel = useCallback(async () => {
    if (isActionDisabled || !data) {
      return;
    }

    if (cancelSelectionCount === 0) {
      setCancelError("Выберите билеты");
      return;
    }

    setActionLoading("cancel");
    setCancelError(null);

    const identifiers = toOriginalTicketIds(cancelTickets);
    const body: Record<string, unknown> = {};

    if (identifiers.length > 0 && cancelTickets.length !== allTicketIds.length) {
      body.ticket_ids = identifiers;
    }

    try {
      const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/cancel`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchPurchase();
      setCancelPreview(null);
      setCancelSelected([]);
      setActivePanel(null);

      const label = data.purchase.status === "paid" ? "Возврат" : "Отмена";
      setBanner({ type: "success", message: `${label} оформлена` });
    } catch (cancelError) {
      console.error(cancelError);
      setCancelError("Не удалось выполнить операцию");
    } finally {
      setActionLoading(null);
    }
  }, [
    allTicketIds,
    cancelSelectionCount,
    cancelTickets,
    data,
    fetchPurchase,
    isActionDisabled,
    purchaseId,
    toOriginalTicketIds,
  ]);

  const submitBaggageQuote = useCallback(
    async (draft: Record<string, number>) => {
      if (Object.keys(draft).length === 0) {
        setBaggageQuote(null);
        return;
      }
      setBaggageLoading(true);
      setBaggageError(null);

      try {
        const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/baggage/quote`, {
          method: "POST",
          body: JSON.stringify({ baggage: draft }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as BaggageQuote;
        setBaggageQuote(payload);
        if (payload && payload.can_apply === false) {
          setBaggageError("Изменения недоступны согласно правилам");
        }
      } catch (quoteError) {
        console.error(quoteError);
        setBaggageQuote(null);
        setBaggageError("Не удалось рассчитать изменения по багажу");
      } finally {
        setBaggageLoading(false);
      }
    },
    [purchaseId]
  );

  const confirmBaggage = useCallback(async () => {
    if (!data || isActionDisabled) {
      return;
    }

    if (!baggageChanged) {
      setBanner({ type: "info", message: "Изменений по багажу нет" });
      return;
    }

    setActionLoading("baggage");
    setBaggageError(null);

    try {
      const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/baggage`, {
        method: "POST",
        body: JSON.stringify({ baggage: baggageDraft }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let payload: BaggageApplyResponse | null = null;
      try {
        payload = (await response.json()) as BaggageApplyResponse;
      } catch {
        payload = null;
      }

      await fetchPurchase();
      setBaggageQuote(null);
      setIsBaggageModalOpen(false);

      if (payload?.status === "pending" && typeof payload?.amount_due === "number") {
        setBanner({
          type: "info",
          message: `Необходимо доплатить: ${formatCurrency(
            payload.amount_due,
            payload.currency ?? data.purchase.currency
          )}`,
        });
      } else {
        setBanner({ type: "success", message: "Багаж обновлён" });
      }
    } catch (baggageSubmitError) {
      console.error(baggageSubmitError);
      setBaggageError("Не удалось обновить багаж");
    } finally {
      setActionLoading(null);
    }
  }, [
    baggageChanged,
    baggageDraft,
    data,
    fetchPurchase,
    isActionDisabled,
    purchaseId,
  ]);

  const confirmPayment = useCallback(async () => {
    if (!data || isActionDisabled) {
      return;
    }

    setActionLoading("pay");
    setBanner(null);

    try {
      const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/pay`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as PaymentPayload;
      submitPaymentForm(payload);
      setBanner({ type: "info", message: "Перенаправляем на оплату…" });
    } catch (paymentError) {
      console.error(paymentError);
      setBanner({ type: "error", message: "Не удалось инициировать оплату" });
    } finally {
      setActionLoading(null);
    }
  }, [data, isActionDisabled, purchaseId]);

  const selectedRescheduleTour = useMemo(() => {
    if (!rescheduleTourId) {
      return null;
    }

    return rescheduleTours.find((tour) => tour.id === rescheduleTourId) ?? null;
  }, [rescheduleTourId, rescheduleTours]);

  const rescheduleFreeSeats = useMemo(() => {
    if (!selectedRescheduleTour) {
      return null;
    }

    const seats = selectedRescheduleTour.seats;
    if (typeof seats === "number") {
      return seats;
    }

    if (seats && typeof (seats as { free?: unknown }).free === "number") {
      return (seats as { free: number }).free;
    }

    return null;
  }, [selectedRescheduleTour]);

  useEffect(() => {
    if (activePanel !== "reschedule") {
      return;
    }

    if (!rescheduleContext || rescheduleContext.seatCount === 0 || rescheduleConsistencyError) {
      setRescheduleDates([]);
      setRescheduleDate("");
      setRescheduleTours([]);
      setRescheduleTourId(null);
      setRescheduleSeatNumbers([]);
      setRescheduleSeatDetails([]);
      setRescheduleQuote(null);
      return;
    }

    let cancelled = false;
    setRescheduleFetchingDates(true);
    setRescheduleError(null);

    const params = new URLSearchParams({
      departure_stop_id: String(rescheduleContext.departureStopId),
      arrival_stop_id: String(rescheduleContext.arrivalStopId),
      seats: String(Math.max(rescheduleContext.seatCount, 1)),
    });

    (async () => {
      try {
        const response = await fetchWithInclude(`${API}/search/dates?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const rawDates = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.dates)
          ? payload.dates
          : [];

        const normalized = rawDates
          .map((value: unknown) => String(value ?? ""))
          .filter((value: string) => Boolean(value));

        if (cancelled) {
          return;
        }

        setRescheduleDates(normalized);
        setRescheduleDate((prev) => {
          if (prev && normalized.includes(prev)) {
            return prev;
          }
          return normalized[0] ?? "";
        });
      } catch (datesError) {
        if (cancelled) {
          return;
        }

        console.error(datesError);
        setRescheduleDates([]);
        setRescheduleDate("");
        setRescheduleTours([]);
        setRescheduleTourId(null);
        setRescheduleSeatNumbers([]);
        setRescheduleSeatDetails([]);
        setRescheduleQuote(null);
        setRescheduleError("Не удалось получить доступные даты для переноса");
      } finally {
        if (!cancelled) {
          setRescheduleFetchingDates(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activePanel, rescheduleContext, rescheduleConsistencyError]);

  useEffect(() => {
    if (activePanel !== "reschedule") {
      return;
    }

    if (!rescheduleContext || rescheduleContext.seatCount === 0 || rescheduleConsistencyError) {
      setRescheduleTours([]);
      setRescheduleTourId(null);
      setRescheduleSeatNumbers([]);
      setRescheduleSeatDetails([]);
      setRescheduleQuote(null);
      return;
    }

    if (!rescheduleDate) {
      setRescheduleTours([]);
      setRescheduleTourId(null);
      setRescheduleSeatNumbers([]);
      setRescheduleSeatDetails([]);
      setRescheduleQuote(null);
      return;
    }

    let cancelled = false;
    setRescheduleFetchingTours(true);
    setRescheduleError(null);

    const params = new URLSearchParams({
      departure_stop_id: String(rescheduleContext.departureStopId),
      arrival_stop_id: String(rescheduleContext.arrivalStopId),
      date: rescheduleDate,
      seats: String(Math.max(rescheduleContext.seatCount, 1)),
    });

    (async () => {
      try {
        const response = await fetchWithInclude(`${API}/tours/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const rawTours = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.tours)
          ? payload.tours
          : [];

        const normalized: RescheduleTour[] = rawTours
          .map((tour: Record<string, unknown>) => {
            const id = Number(tour?.id ?? tour?.tour_id ?? NaN);
            if (!Number.isFinite(id)) {
              return null;
            }

            const layoutVariantRaw =
              typeof tour?.layout_variant === "string"
                ? tour.layout_variant
                : typeof tour?.bus_layout === "string"
                ? tour.bus_layout
                : null;

            const priceRaw =
              typeof tour?.price_change === "number"
                ? tour.price_change
                : typeof tour?.price === "number"
                ? tour.price
                : null;

            const noteRaw =
              typeof tour?.description === "string"
                ? tour.description
                : typeof tour?.note === "string"
                ? tour.note
                : null;

            return {
              id,
              date: String(tour?.date ?? rescheduleDate ?? ""),
              departure_time: String(tour?.departure_time ?? tour?.time ?? ""),
              arrival_time: String(tour?.arrival_time ?? ""),
              seats: tour?.seats ?? 0,
              layout_variant: layoutVariantRaw,
              price: priceRaw,
              description: noteRaw,
            } as RescheduleTour;
            })
            .filter((tour: RescheduleTour | null | undefined): tour is RescheduleTour => Boolean(tour));

        if (cancelled) {
          return;
        }

        setRescheduleTours(normalized);
        setRescheduleTourId((prev) => {
          if (prev !== null && normalized.some((tour) => tour.id === prev)) {
            return prev;
          }
          return null;
        });
        setRescheduleSeatNumbers([]);
        setRescheduleSeatDetails([]);
        setRescheduleQuote(null);
      } catch (toursError) {
        if (cancelled) {
          return;
        }

        console.error(toursError);
        setRescheduleTours([]);
        setRescheduleTourId(null);
        setRescheduleSeatNumbers([]);
        setRescheduleSeatDetails([]);
        setRescheduleQuote(null);
        setRescheduleError("Не удалось получить список доступных рейсов");
      } finally {
        if (!cancelled) {
          setRescheduleFetchingTours(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activePanel, rescheduleContext, rescheduleConsistencyError, rescheduleDate]);

  const handleRescheduleSeatChange = (seats: number[]) => {
    const seatLimit = rescheduleContext?.seatCount ?? seats.length;
    const normalized = seats.slice(0, seatLimit);
    setRescheduleSeatNumbers(normalized);
    setRescheduleSeatDetails([]);
    setRescheduleQuote(null);
  };

  const handleRescheduleDateSelect = useCallback((iso: string) => {
    setRescheduleDate((prev) => {
      if (prev === iso) {
        return prev;
      }

      setRescheduleTours([]);
      setRescheduleTourId(null);
      setRescheduleSeatNumbers([]);
      setRescheduleSeatDetails([]);
      setRescheduleQuote(null);
      setRescheduleError(null);

      return iso;
    });
  }, []);

  const handleSelectRescheduleTour = useCallback((tourId: number) => {
    setRescheduleTourId((prev) => {
      if (prev === tourId) {
        return prev;
      }

      setRescheduleSeatNumbers([]);
      setRescheduleSeatDetails([]);
      setRescheduleQuote(null);
      setRescheduleError(null);

      return tourId;
    });
  }, []);

  const rescheduleSeatRequirement = rescheduleContext?.seatCount ?? 0;

  const canSubmitRescheduleQuote =
    !!rescheduleContext &&
    !!rescheduleTourId &&
    rescheduleSeatRequirement > 0 &&
    rescheduleSeatNumbers.length === rescheduleSeatRequirement &&
    rescheduleSeatDetails.length === rescheduleSeatRequirement;

  const reschedulePassengers = useMemo(() => {
    if (!data || !rescheduleContext) {
      return [] as Array<{ ticket: PurchaseTicket | null; passenger: PurchasePassenger | null }>;
    }

    return rescheduleContext.ticketIds.map((ticketId) => {
      const ticket = data.tickets.find((item) => String(item.id) === ticketId) ?? null;
      const passenger = ticket ? passengerMap.get(String(ticket.passenger_id)) ?? null : null;
      return { ticket, passenger };
    });
  }, [data, passengerMap, rescheduleContext]);

  const handleRescheduleQuote = useCallback(async () => {
    if (!rescheduleContext) {
      setRescheduleError("Выберите билеты для переноса");
      return;
    }

    if (!rescheduleTourId) {
      setRescheduleError("Выберите новый рейс");
      return;
    }

    if (rescheduleSeatNumbers.length !== rescheduleContext.seatCount) {
      setRescheduleError("Выберите места для всех билетов");
      return;
    }

    if (rescheduleSeatDetails.length !== rescheduleContext.seatCount) {
      setRescheduleError("Выберите места для всех билетов");
      return;
    }

    setRescheduleQuoteLoading(true);
    setRescheduleError(null);

    const body = {
      ticket_ids: rescheduleContext.ticketIdentifiers,
      new_tour_id: rescheduleTourId,
      new_seat_nums: rescheduleSeatNumbers,
      departure_stop_id: rescheduleContext.departureStopId,
      arrival_stop_id: rescheduleContext.arrivalStopId,
    };

    try {
      const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/reschedule/quote`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as RescheduleQuote;
      setRescheduleQuote(payload);
    } catch (quoteError) {
      console.error(quoteError);
      setRescheduleQuote(null);
      setRescheduleError("Не удалось рассчитать разницу");
    } finally {
      setRescheduleQuoteLoading(false);
    }
  }, [purchaseId, rescheduleContext, rescheduleSeatDetails, rescheduleSeatNumbers, rescheduleTourId]);

  const applyReschedule = useCallback(async () => {
    if (!rescheduleContext) {
      setRescheduleError("Выберите билеты для переноса");
      return;
    }

    if (!rescheduleTourId) {
      setRescheduleError("Выберите новый рейс");
      return;
    }

    if (rescheduleSeatNumbers.length !== rescheduleContext.seatCount) {
      setRescheduleError("Выберите места для всех билетов");
      return;
    }

    if (rescheduleSeatDetails.length !== rescheduleContext.seatCount) {
      setRescheduleError("Выберите места для всех билетов");
      return;
    }

    setActionLoading("reschedule");
    setRescheduleError(null);

    const seatDetailsMap = new Map<number, SeatSelectionDetail["seatId"]>();
    rescheduleSeatDetails.forEach((detail) => {
      seatDetailsMap.set(detail.seatNumber, detail.seatId ?? null);
    });

    const assignments = rescheduleContext.ticketIdentifiers.map((ticketIdentifier, index) => ({
      ticketIdentifier,
      seatNumber: rescheduleSeatNumbers[index],
      seatId: seatDetailsMap.get(rescheduleSeatNumbers[index]) ?? null,
    }));

    const currentCurrency = data?.purchase.currency;

    try {
      let payload: RescheduleApplyResponse | null = null;

      for (const assignment of assignments) {
        const ticketIdEncoded = encodeURIComponent(String(assignment.ticketIdentifier));
        const requestBody: Record<string, unknown> = {
          tour_id: rescheduleTourId,
          seat_num: assignment.seatNumber,
          departure_stop_id: rescheduleContext.departureStopId,
          arrival_stop_id: rescheduleContext.arrivalStopId,
        };

        if (assignment.seatId !== null) {
          requestBody.seat_id = assignment.seatId;
        }

        const response = await fetchWithInclude(`${API}/public/tickets/${ticketIdEncoded}/reschedule`, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        try {
          const currentPayload = (await response.json()) as RescheduleApplyResponse;
          if (currentPayload?.status === "pending" && typeof currentPayload?.amount_due === "number") {
            payload = currentPayload;
          } else if (!payload) {
            payload = currentPayload;
          }
        } catch {
          // ignore empty body
        }
      }

      await fetchPurchase();
      setRescheduleQuote(null);
      setRescheduleSeatNumbers([]);
      setRescheduleSeatDetails([]);
      setActivePanel(null);
      setRescheduleSelected([]);

      if (payload?.status === "pending" && typeof payload?.amount_due === "number") {
        setBanner({
          type: "info",
          message: `Перенос оформлен. К оплате: ${formatCurrency(payload.amount_due, payload.currency ?? currentCurrency ?? "")}`,
        });
      } else {
        setBanner({ type: "success", message: "Перенос выполнен" });
      }
    } catch (applyError) {
      console.error(applyError);
      setRescheduleError("Не удалось выполнить перенос");
    } finally {
      setActionLoading(null);
    }
  }, [
    data?.purchase.currency,
    fetchPurchase,
    rescheduleContext,
    rescheduleSeatDetails,
    rescheduleSeatNumbers,
    rescheduleTourId,
  ]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Loader />
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-gray-600">
        <p>Покупка не найдена или доступ запрещён.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <UiAlert type="error">{error}</UiAlert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const statusLabel = STATUS_LABELS[data.purchase.status] ?? data.purchase.status;
  const cancelActionLabel = data.purchase.status === "paid" ? "Возврат" : "Отмена";
  const cancelConfirmLabel = cancelActionLabel === "Возврат" ? "Подтвердить возврат" : "Подтвердить отмену";
  const purchaseDeadline = formatDate(data.purchase.deadline ?? undefined);
  const customer = data.customer ?? null;
  const totals = data.totals ? { ...DEFAULT_TOTALS, ...data.totals } : { ...DEFAULT_TOTALS };
  const isPaid = data.purchase.status === "paid";
  const primaryActionLabel = isPaid ? "Оформить возврат" : "Оплатить";
  const showReturnTickets = returnTickets.length > 0;
  const shouldShowDownloadAll = data.tickets.length > 1;
  const shouldShowBulkActions = bulkSelectionCount > 0;
  const selectedTicketsTotal = data.tickets.reduce((sum, ticket) => {
    if (!selectedTicketSet.has(String(ticket.id))) {
      return sum;
    }
    return sum + toNumberSafe(ticket.pricing?.price, 0);
  }, 0);
  const primaryActionDisabled = isActionDisabled;
  const dueAmountText = formatCurrency(totals.due, data.purchase.currency);
  const selectedTicketsTotalText = formatCurrency(selectedTicketsTotal, data.purchase.currency);
  const totalAmountText = formatCurrency(data.purchase.amount_due, data.purchase.currency);
  const baggageHighlightClass = baggageQuote?.can_apply
    ? styles.panelHighlightSuccess
    : styles.panelHighlightWarning;
  const baggageDirections =
    tripsDetailed.length > 0
      ? tripsDetailed
      : [
          {
            trip: { direction: "outbound", tickets: data.tickets.map((ticket) => ticket.id) },
            tickets: data.tickets,
            summary: tripSummary(data.tickets),
          },
        ];
  const handlePrimaryAction = () => {
    if (isActionDisabled) {
      return;
    }

    if (isPaid) {
      openCancelPanel(cancelTickets.length > 0 ? cancelTickets : selectedTicketIds);
      return;
    }

    confirmPayment();
  };

  const renderTicketSection = (title: string, tickets: PurchaseTicket[], sectionKey: string) => {
    if (tickets.length === 0) {
      return null;
    }

    const scrollKey = makeScrollKey(sectionKey);
    const listClassName = [styles.tickets, tickets.length > 1 ? styles.ticketsTwoCols : ""].filter(Boolean).join(" ");

    const renderList = () => {
      return (
        <div className={styles.ticketSection}>
          <div className={listClassName}>
            {tickets.map((ticket) => {
          const ticketId = String(ticket.id);
          const passenger = passengerMap.get(String(ticket.passenger_id));
          const passengerName = passenger?.name ?? `Пассажир #${ticket.passenger_id}`;
          const ticketStatusLabel = STATUS_LABELS[ticket.status] ?? ticket.status;
          const departureSegment =
            ticket.segments.find((segment) => segment.is_departure) ?? ticket.segments[0];
          const arrivalSegment =
            [...ticket.segments].reverse().find((segment) => segment.is_arrival) ??
            ticket.segments[ticket.segments.length - 1];
          const departureName =
            ticket.segment_details?.departure?.name ?? departureSegment?.stop_name ?? "—";
          const arrivalName =
            ticket.segment_details?.arrival?.name ?? arrivalSegment?.stop_name ?? "—";
          const departureDateTime = ensureDateTimeString(
            ticket.segment_details?.departure?.time,
            ticket.tour.date,
            null
          );
          const arrivalDateTime = ensureDateTimeString(
            ticket.segment_details?.arrival?.time,
            ticket.tour.date,
            null
          );
          const departureSegmentTime = ensureDateTimeString(
            departureSegment?.time ?? null,
            ticket.tour.date,
            null
          );
          const arrivalSegmentTime = ensureDateTimeString(
            arrivalSegment?.time ?? null,
            ticket.tour.date,
            null
          );
          const departureTimeSource =
            departureDateTime || departureSegment?.time || ticket.segment_details?.departure?.time || null;
          const arrivalTimeSource =
            arrivalDateTime || arrivalSegment?.time || ticket.segment_details?.arrival?.time || null;
          const departureDate = formatDate(departureDateTime);
          const departureTime = formatTime(departureTimeSource ?? departureSegmentTime);
          const arrivalTime = formatTime(arrivalTimeSource ?? arrivalSegmentTime);
          const priceText = formatCurrency(
            ticket.pricing?.price ?? null,
            ticket.pricing?.currency ?? data.purchase.currency
          );
          const isSelected = selectedTicketSet.has(ticketId);
          const isMenuOpen = openMenuTicketId === ticketId;
          let ticketMenu: ReactNode | null = null;

          if (isMenuOpen) {
            const anchor = menuAnchor;
            const floatingStyle: CSSProperties | undefined = anchor
              ? {
                  left: anchor.right,
                  transform: "translateX(-100%)",
                  ...(anchor.placement === "down"
                    ? { top: anchor.bottom + MENU_GAP }
                    : { bottom: anchor.viewportHeight - anchor.top + MENU_GAP }),
                }
              : undefined;

            const content = (
              <div
                className={`${styles.menuList} ${styles.menuListFloating}`}
                role="menu"
                data-ticket-menu="true"
                data-placement={anchor?.placement}
                style={floatingStyle}
              >
                <button type="button" role="menuitem" onClick={() => handleTicketReschedule(ticketId)}>
                  Перенести
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleTicketCancel(ticketId)}
                  className={styles.menuDanger}
                >
                  Отмена
                </button>
                <button type="button" role="menuitem" onClick={handleOpenBaggagePanel}>
                  Доп. багаж
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeTicketMenu();
                    void handleDownloadTicket(ticket.id);
                  }}
                >
                  Скачать PDF
                </button>
              </div>
            );

            ticketMenu =
              anchor && typeof document !== "undefined" ? createPortal(content, document.body) : content;
          }

          return (
            <article key={ticket.id} className={styles.ticket} data-selected={isSelected ? "true" : undefined}>
              <input
                className={styles.select}
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleTicketSelection(ticketId)}
                aria-label={`Выбрать билет #${ticket.id}`}
              />
              <div className={styles.ticketTop}>
                <div>
                  <div className={styles.route}>
                    {departureName} <span aria-hidden="true">→</span> {arrivalName}
                  </div>
                  <div className={styles.sub}>
                    Билет #{ticket.id}
                    {ticketStatusLabel ? ` • ${ticketStatusLabel}` : ""}
                  </div>
                  <div className={styles.passenger}>Пассажир: {passengerName}</div>
                </div>
                <div
                  className={styles.menu}
                  data-open={isMenuOpen ? "true" : undefined}
                  data-ticket-menu="true"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnIcon}`}
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                    title="Действия"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (isMenuOpen) {
                        closeTicketMenu();
                        return;
                      }

                      if (typeof window === "undefined") {
                        setOpenMenuTicketId(ticketId);
                        return;
                      }

                      const rect = event.currentTarget.getBoundingClientRect();
                      const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
                      const spaceBelow = viewportHeight - rect.bottom;
                      const spaceAbove = rect.top;
                      const placement: "up" | "down" =
                        spaceBelow < MENU_HEIGHT_ESTIMATE && spaceAbove > spaceBelow ? "up" : "down";

                      setMenuAnchor({
                        top: rect.top,
                        bottom: rect.bottom,
                        right: rect.right,
                        viewportHeight,
                        placement,
                      });
                      setOpenMenuTicketId(ticketId);
                    }}
                  >
                    ⋯
                  </button>
                  {ticketMenu}
                </div>
              </div>
              <div className={styles.chips}>
                <span className={`${styles.chip} ${styles.chipDate} ${styles.mono}`}>{departureDate}</span>
                <span className={`${styles.chip} ${styles.mono}`}>
                  {departureTime} → {arrivalTime}
                </span>
                <span className={`${styles.chip} ${styles.chipSeat}`}>
                  Место {ticket.seat_num ?? "—"}
                </span>
                <span className={styles.priceEnd}>
                  Цена: <span className={styles.mono}>{priceText}</span>
                </span>
              </div>
            </article>
          );
        })}
          </div>
        </div>
      );
    };

    return (
      <ScrollableCard
        key={sectionKey}
        title={title}
        meta={`Всего билетов: ${tickets.length}`}
        scrollKey={scrollKey}
        ariaLabel={`${title} (прокручиваемая зона)`}
        initialScrollTop={scrollPositions[scrollKey] ?? 0}
        renderContent={renderList}
        onScrollChange={updateScrollPosition}
        onScrollStart={closeTicketMenu}
      />
    );
  };

  const cancelButtonDisabled = isActionDisabled || cancelSelectionCount === 0;
  const baggageModal =
    isBaggageModalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="baggage-modal-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeBaggageModal();
              }
            }}
          >
            <div className={styles.modalSheet} role="document" onClick={(event) => event.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 id="baggage-modal-title" className={styles.modalTitle}>
                    Дополнительный багаж
                  </h3>
                  <p className={styles.panelSubtitle}>
                    Изменено билетов: {baggageChangedCount}. Текущий багаж: {totals.baggage_count}.
                  </p>
                </div>
                <button type="button" className={styles.modalClose} onClick={closeBaggageModal} aria-label="Закрыть">
                  ✕
                </button>
              </div>
              <div className={`${styles.modalBody} ${styles.modalScroll}`}>
                <div className={styles.baggageSummaryRow}>
                  <div>
                    <p className={styles.baggageSummaryTitle}>Итоговая цена</p>
                    <p className={styles.panelNote}>Нажмите «Рассчитать доплату», чтобы увидеть итоговую сумму.</p>
                  </div>
                  <div className={styles.baggageSummaryChips}>
                    <span className={`${styles.chip} ${styles.chipDate}`}>Черновик: {baggageDraftTotal} мест</span>
                    <span className={styles.chip}>Сохранено: {totals.baggage_count} мест</span>
                  </div>
                </div>
                <div className={styles.baggagePassengerList}>
                  {data.passengers.map((passenger) => {
                    const passengerId = String(passenger.id);
                    const passengerLabel = passenger.name || `Пассажир ${passengerId}`;
                    return (
                      <div key={passengerId} className={styles.baggagePassengerCard}>
                        <div className={styles.baggagePassengerHeader}>
                          <p className={styles.baggageTitle}>{passengerLabel}</p>
                          <span className={`${styles.chip} ${styles.chipSeat}`}>
                            Доп. багаж: {baggageDirections.reduce((sum, entry) => {
                              const ticket = entry.tickets.find(
                                (item) => String(item.passenger_id) === passengerId
                              );
                              if (!ticket) return sum;
                              const draftValue = baggageDraft[String(ticket.id)] ?? toNumberSafe(ticket.extra_baggage, 0);
                              return sum + draftValue;
                            }, 0)}
                          </span>
                        </div>
                        <div className={styles.baggageList}>
                          {baggageDirections.map(({ trip, tickets, summary }) => {
                            const directionLabel = DIRECTION_LABELS[trip.direction] ?? trip.direction;
                            const passengerTicket =
                              tickets.find((ticket) => String(ticket.passenger_id) === passengerId) ?? null;

                            if (!passengerTicket) {
                              return (
                                <div key={`${passengerId}-${trip.direction}`} className={styles.baggageRow}>
                                  <div className={styles.baggageInfo}>
                                    <p className={styles.baggageTitle}>{directionLabel}</p>
                                    <p className={styles.baggageMeta}>Билет для этого направления не найден.</p>
                                  </div>
                                </div>
                              );
                            }

                            const ticketId = String(passengerTicket.id);
                            const extraBaggage = toNumberSafe(passengerTicket.extra_baggage, 0);
                            const baggageValue = baggageDraft[ticketId] ?? extraBaggage;
                            const { routeLabel, dateLabel } = getTicketRouteMeta(passengerTicket);
                            const metaParts = [routeLabel];
                            if (summary?.start) {
                              metaParts.push(formatDate(summary.start));
                            } else if (dateLabel) {
                              metaParts.push(dateLabel);
                            }

                            return (
                              <div key={`${passengerId}-${trip.direction}`} className={styles.baggageRow}>
                                <div className={styles.baggageInfo}>
                                  <p className={styles.baggageTitle}>{directionLabel}</p>
                                  <p className={styles.baggageMeta}>{metaParts.filter(Boolean).join(" • ")}</p>
                                </div>
                                <div className={styles.baggageControls}>
                                  <div className={styles.baggageStepper}>
                                    <button
                                      type="button"
                                      onClick={() => decrementBaggage(ticketId)}
                                      disabled={isActionDisabled || baggageValue <= 0}
                                      aria-label={`Уменьшить багаж для билета #${ticketId}`}
                                    >
                                      −
                                    </button>
                                    <span className={styles.baggageValue}>{baggageValue}</span>
                                    <button
                                      type="button"
                                      onClick={() => incrementBaggage(ticketId)}
                                      disabled={isActionDisabled}
                                      aria-label={`Увеличить багаж для билета #${ticketId}`}
                                    >
                                      +
                                    </button>
                                  </div>
                                  {baggageValue !== extraBaggage ? (
                                    <span className={styles.baggageChanged}>изменено</span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {baggageError ? <p className={styles.panelError}>{baggageError}</p> : null}
                {baggageQuote ? (
                  <div className={`${styles.panelHighlight} ${baggageHighlightClass}`}>
                    <p className={styles.panelHighlightTitle}>
                      Изменение долга: {formatCurrency(baggageQuote.delta, baggageQuote.currency)}
                    </p>
                    {Array.isArray(baggageQuote.breakdown) && baggageQuote.breakdown.length > 0 ? (
                      <ul className={styles.breakdownList}>
                        {baggageQuote.breakdown.map((item) => (
                          <li key={String(item.ticket_id)}>
                            Билет #{item.ticket_id}: {item.old ?? 0} → {item.new ?? 0} ({formatCurrency(item.delta ?? 0, baggageQuote.currency)})
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {!baggageQuote.can_apply ? (
                      <p>Изменения недоступны. Проверьте правила перевозчика или попробуйте изменить запрос.</p>
                    ) : null}
                  </div>
                ) : (
                  baggageLoading ? null : (
                    <p className={styles.panelNote}>Настройте количество багажа для каждого направления.</p>
                  )
                )}
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => void submitBaggageQuote(baggageDraft)}
                  disabled={isActionDisabled}
                >
                  Рассчитать доплату
                </button>
                <button
                  type="button"
                  onClick={confirmBaggage}
                  disabled={
                    isActionDisabled ||
                    actionLoading === "baggage" ||
                    !baggageChanged ||
                    (baggageQuote !== null && !baggageQuote.can_apply)
                  }
                  className={`${styles.btn} ${styles.btnOutline}`}
                >
                  Сохранить изменения
                </button>
                {baggageLoading ? <span className={styles.panelNote}>Рассчитываем стоимость...</span> : null}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className={styles.page}>
        <div className={styles.container}>
        <section className={`${styles.card} ${styles.orderCard}`} aria-labelledby="order-title">
          <div className={styles.orderHead}>
            <div className={styles.orderTitleRow}>
              <h1 id="order-title" className={styles.h1}>
                Покупка #{data.purchase.id}
              </h1>
              <span className={styles.badge}>{statusLabel}</span>
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.contacts} aria-label="Контакты">
            <div className={styles.contactWho}>
              <b>{customer?.name ?? "Покупатель не указан"}</b>
              <div className={styles.contactLine}>
                {customer?.phone ? (
                  <a className={styles.contactPill} href={`tel:${customer.phone}`}>
                    📞 {customer.phone}
                  </a>
                ) : null}
                {customer?.email ? (
                  <a className={styles.contactPill} href={`mailto:${customer.email}`}>
                    ✉ {customer.email}
                  </a>
                ) : null}
                {!customer?.phone && !customer?.email ? (
                  <span className={styles.contactPlaceholder}>Контакты не указаны</span>
                ) : null}
              </div>
            </div>
            <div className={styles.contactMeta}>
              <span className={styles.muted}>Создана {formatDate(data.purchase.created_at)}</span>
              {purchaseDeadline ? (
                <span className={styles.muted}>Оплатить до {purchaseDeadline}</span>
              ) : null}
              <span className={styles.amountBadge}>{totalAmountText}</span>
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.fareRow} aria-label="Информация о билете">
            <div>
              <p className={styles.fareLabel}>Входит в билет</p>
              <div className={styles.fareTags} role="list">
                <span className={`${styles.chip} ${styles.chipSeat}`} role="listitem">
                  Пассажиров: {totals.pax_count}
                </span>
                <span className={`${styles.chip} ${styles.chipDate}`} role="listitem">
                  Билетов: {data.tickets.length}
                </span>
                <span className={styles.chip} role="listitem">
                  Доп. багаж в заказе: {totals.baggage_count}
                </span>
              </div>
            </div>
            <div className={styles.fareActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnCompact}`}
                onClick={handleOpenBaggagePanel}
                disabled={isActionDisabled}
              >
                Добавить дополнительный багаж
              </button>
              <span className={styles.fareNote}>
                {baggageChanged
                  ? `Изменено билетов: ${baggageChangedCount}`
                  : "Все изменения сохранены"}
              </span>
            </div>
          </div>
        </section>

        {banner ? (
          <div className={styles.alertWrap}>
            <UiAlert type={banner.type}>{banner.message}</UiAlert>
          </div>
        ) : null}

        {renderTicketSection(
          showReturnTickets ? "Билеты туда" : "Билеты",
          outboundTickets,
          "tickets:outbound"
        )}

        {showReturnTickets
          ? renderTicketSection("Билеты обратно", returnTickets, "tickets:return")
          : null}

        {activePanel === "reschedule" ? (
          <section className={`${styles.card} ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h3 className={styles.panelTitle}>Перенос поездки</h3>
                <p className={styles.panelSubtitle}>Выбрано билетов: {rescheduleSelectionCount}</p>
              </div>
              <div className={styles.panelOptions}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reschedule-scope"
                    value="all"
                    checked={rescheduleScope === "all"}
                    onChange={() => setRescheduleScope("all")}
                  />
                  Для всех пассажиров
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reschedule-scope"
                    value="selected"
                    checked={rescheduleScope === "selected"}
                    onChange={() => setRescheduleScope("selected")}
                  />
                  Только выбранные
                </label>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => {
                    setActivePanel(null);
                    setRescheduleError(null);
                    setRescheduleQuote(null);
                  }}
                >
                  Скрыть
                </button>
              </div>
            </div>
            {rescheduleScope === "selected" ? (
              <div className={styles.panelChipRow}>
                <button type="button" className={`${styles.btn} ${styles.btnPill}`} onClick={selectAllReschedule}>
                  Выбрать все
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnPillMuted}`} onClick={clearRescheduleSelection}>
                  Сбросить
                </button>
              </div>
            ) : null}
            {rescheduleConsistencyError ? (
              <UiAlert type="error">{rescheduleConsistencyError}</UiAlert>
            ) : null}
            {rescheduleContext ? (
              <div className={styles.panelBody}>
                <div className={styles.panelGrid}>
                  <div>
                    <p className={styles.panelLabel}>Маршрут</p>
                    <p className={styles.panelValue}>
                      {rescheduleContext.departureName} → {rescheduleContext.arrivalName}
                    </p>
                  </div>
                  <div>
                    <p className={styles.panelLabel}>Количество мест</p>
                    <p className={styles.panelValue}>
                      {rescheduleSeatRequirement}
                      {rescheduleFreeSeats !== null ? ` • свободно: ${rescheduleFreeSeats}` : ""}
                    </p>
                  </div>
                </div>
                {reschedulePassengers.length > 0 ? (
                  <div className={styles.panelPassengers}>
                    <p className={styles.panelLabel}>Пассажиры</p>
                    <ul className={styles.passengerList}>
                      {reschedulePassengers.map(({ ticket, passenger }, index) => (
                        <li key={`${ticket?.id ?? "ticket"}-${index}`}>
                          {passenger?.name ?? `Пассажир #${ticket?.passenger_id ?? "?"}`} • билет #{ticket?.id ?? "—"} • текущее место: {ticket?.seat_num ?? "—"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>Доступные даты</p>
                  {rescheduleFetchingDates ? (
                    <p className={styles.panelNote}>Загружаем даты…</p>
                  ) : rescheduleDates.length > 0 ? (
                    <Calendar
                      activeDates={rescheduleDates}
                      selectedDate={rescheduleDate || undefined}
                      allowAllFutureDates
                      onSelect={handleRescheduleDateSelect}
                      className={styles.calendar}
                    />
                  ) : (
                    <p className={styles.panelNote}>Нет доступных дат для выбранных билетов.</p>
                  )}
                </div>
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>Доступные рейсы</p>
                  {rescheduleFetchingTours ? (
                    <p className={styles.panelNote}>Подбираем рейсы…</p>
                  ) : rescheduleTours.length > 0 ? (
                    <div className={styles.tourList}>
                      {rescheduleTours.map((tour) => (
                        <label
                          key={tour.id}
                          className={`${styles.tourOption} ${rescheduleTourId === tour.id ? styles.tourOptionActive : ""}`}
                        >
                          <div>
                            <p className={styles.tourTime}>
                              {formatTime(tour.departure_time)} → {formatTime(tour.arrival_time)}
                            </p>
                            <p className={styles.panelNote}>
                              Свободных мест: {typeof tour.seats === "number" ? tour.seats : Number((tour.seats as { free?: number }).free ?? 0)}
                            </p>
                            {tour.description ? <p className={styles.panelNote}>{tour.description}</p> : null}
                          </div>
                          <input
                            type="radio"
                            name="reschedule-tour"
                            checked={rescheduleTourId === tour.id}
                            onChange={() => handleSelectRescheduleTour(tour.id)}
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.panelNote}>
                      {rescheduleDate ? "Нет подходящих рейсов на выбранную дату." : "Выберите дату, чтобы увидеть рейсы."}
                    </p>
                  )}
                </div>
                {rescheduleTourId ? (
                  <div className={styles.panelSection}>
                    <p className={styles.panelLabel}>Выбор мест</p>
                    <SeatClient
                      tourId={rescheduleTourId}
                      departureStopId={rescheduleContext.departureStopId}
                      arrivalStopId={rescheduleContext.arrivalStopId}
                      layoutVariant={selectedRescheduleTour?.layout_variant ?? null}
                      selectedSeats={rescheduleSeatNumbers}
                      maxSeats={rescheduleSeatRequirement}
                      onChange={handleRescheduleSeatChange}
                      onSelectionDetailsChange={setRescheduleSeatDetails}
                    />
                    <p className={styles.panelNote}>
                      Выбрано мест: {rescheduleSeatNumbers.length} из {rescheduleSeatRequirement}
                    </p>
                  </div>
                ) : null}
                {rescheduleQuote ? (
                  <div
                    className={`${styles.panelHighlight} ${rescheduleQuote.can_apply ? styles.panelHighlightSuccess : styles.panelHighlightWarning}`}
                  >
                    <p className={styles.panelHighlightTitle}>
                      Разница: {formatCurrency(rescheduleQuote.price_change, rescheduleQuote.currency)}
                    </p>
                    {rescheduleQuote.note ? <p>{rescheduleQuote.note}</p> : null}
                    {!rescheduleQuote.can_apply ? <p>Перенос недоступен: скорректируйте выбор.</p> : null}
                  </div>
                ) : null}
                {rescheduleError ? <p className={styles.panelError}>{rescheduleError}</p> : null}
                <div className={styles.panelButtons}>
                  <button
                    type="button"
                    onClick={handleRescheduleQuote}
                    disabled={!canSubmitRescheduleQuote || rescheduleQuoteLoading}
                    className={`${styles.btn} ${styles.btnOutline}`}
                  >
                    {rescheduleQuoteLoading ? "Считаем…" : "Рассчитать разницу"}
                  </button>
                  <button
                    type="button"
                    onClick={applyReschedule}
                    disabled={
                      !canSubmitRescheduleQuote ||
                      actionLoading === "reschedule" ||
                      rescheduleQuoteLoading ||
                      rescheduleQuote?.can_apply === false
                    }
                    className={`${styles.btn} ${styles.btnPrimary}`}
                  >
                    {actionLoading === "reschedule" ? "Переносим…" : "Подтвердить перенос"}
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.panelNote}>Выберите билеты, чтобы продолжить перенос.</p>
            )}
          </section>
        ) : null}

        {activePanel === "cancel" ? (
          <section className={`${styles.card} ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h3 className={styles.panelTitle}>{cancelActionLabel} билетов</h3>
                <p className={styles.panelSubtitle}>Выбрано билетов: {cancelSelectionCount}</p>
              </div>
              <div className={styles.panelOptions}>
                <button type="button" className={`${styles.btn} ${styles.btnPill}`} onClick={selectAllCancel}>
                  Выбрать все
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnPillMuted}`} onClick={clearCancelSelection}>
                  Сбросить
                </button>
                <button type="button" className={styles.linkButton} onClick={() => setActivePanel(null)}>
                  Скрыть
                </button>
              </div>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.panelButtons}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => void submitCancelPreview(cancelTickets)}
                  disabled={cancelButtonDisabled}
                >
                  Рассчитать {cancelActionLabel.toLowerCase()}
                </button>
                {cancelLoading ? <span className={styles.panelNote}>Расчёт...</span> : null}
              </div>
              {cancelError ? <p className={styles.panelError}>{cancelError}</p> : null}
              {cancelPreview ? (
                <div className={`${styles.panelHighlight} ${styles.panelHighlightSuccess}`}>
                  К возврату сейчас: {formatCurrency(cancelPreview.total_refund, cancelPreview.currency)}
                </div>
              ) : (
                cancelLoading ? null : (
                  <p className={styles.panelNote}>
                    Выберите билеты, чтобы рассчитать {cancelActionLabel.toLowerCase()}.
                  </p>
                )
              )}
              <div className={styles.panelFooter}>
                <button
                  type="button"
                  onClick={confirmCancel}
                  disabled={cancelButtonDisabled || actionLoading === "cancel"}
                  className={`${styles.btn} ${styles.btnDanger}`}
                >
                  {cancelConfirmLabel}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {shouldShowBulkActions ? (
          <div
            className={styles.bulkBarDock}
            role="region"
            aria-live="polite"
            aria-label="Групповые действия по выбранным билетам"
          >
            <div className={styles.bulkBarWrap}>
              <div className={styles.bulkSummary}>
                <span>Выбрано билетов: {bulkSelectionCount}</span>
                <span>
                  Сумма: <span className={styles.mono}>{selectedTicketsTotalText}</span>
                </span>
              </div>
              <div className={styles.bulkBar} role="toolbar" aria-label="Групповые действия">
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={handleBulkReschedule}
                  disabled={isActionDisabled || bulkSelectionCount === 0}
                >
                  Перенести
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={handleBulkCancel}
                  disabled={isActionDisabled || bulkSelectionCount === 0}
                >
                  {cancelActionLabel}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={handleOpenBaggagePanel}
                  disabled={isActionDisabled}
                >
                  Доп. багаж
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={handleBulkDownload}
                  disabled={bulkSelectionCount === 0}
                >
                  Скачать PDF
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <section className={styles.paybar}>
          <div className={styles.paybarInner}>
            <div className={styles.paySummary}>
              <span className={styles.muted}>К оплате:</span>
              <span className={`${styles.sumInline} ${styles.mono}`}>{dueAmountText}</span>
            </div>
            <div className={styles.payButtons}>
              {shouldShowDownloadAll ? (
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={handleDownloadAll}>
                  Скачать все PDF
                </button>
              ) : null}
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPay}`}
                onClick={handlePrimaryAction}
                disabled={primaryActionDisabled}
              >
                {isPaid ? (
                  primaryActionLabel
                ) : (
                  <>
                    <span className={styles.payDot} aria-hidden="true" />
                    Оплатить • <span className={styles.mono}>{dueAmountText}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
        </div>
      </div>
      {baggageModal}
    </>
  );
}
