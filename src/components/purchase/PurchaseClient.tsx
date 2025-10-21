"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  PurchaseTicket,
  PurchaseTrip,
  PurchaseView,
  PurchaseTotals,
} from "@/types/purchase";
import { fetchWithInclude } from "@/utils/fetchWithInclude";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачено",
  canceled: "Отменено",
  expired: "Истёкло",
  reserved: "Забронировано",
};

const ACTION_DISABLED_STATUSES = new Set(["canceled", "expired"]);

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
      stop_id: stop.id ?? `route-stop-${index}`,
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
      stop_id: departure.id ?? departure.stop_id ?? "departure",
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
      stop_id: stop.id ?? stop.stop_id ?? `stop-${index}`,
      stop_name: String(stop.name ?? stop.stop_name ?? ""),
      time: toDateTimeString(tourDate, String(stop.departure_time ?? stop.arrival_time ?? "")),
      is_departure: false,
      is_arrival: false,
    });
  });

  const arrival = segment?.arrival as Record<string, unknown> | undefined;
  if (arrival) {
    segments.push({
      stop_id: arrival.id ?? arrival.stop_id ?? "arrival",
      stop_name: String(arrival.name ?? arrival.stop_name ?? ""),
      time: toDateTimeString(tourDate, String(arrival.time ?? "")),
      is_departure: false,
      is_arrival: true,
    });
  }

  if (segments.length === 0 && routeStops.length > 0) {
    routeStops.forEach((stop, index) => {
      segments.push({
        stop_id: stop.id ?? `route-stop-${index}`,
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

    const passengerIdRaw = passengerInfo?.id ?? ticketInfo?.passenger_id ?? `passenger-${index}`;
    const passengerId = String(passengerIdRaw ?? `passenger-${index}`);
    const passengerName = passengerInfo?.name ?? ticketInfo?.passenger_name ?? rawPurchase?.customer?.name ?? "Пассажир";

    if (!passengersMap.has(passengerId)) {
      passengersMap.set(passengerId, {
        id: passengerId,
        name: String(passengerName ?? passengerId),
        email: (passengerInfo?.email ?? null) as string | null,
        phone: (passengerInfo?.phone ?? null) as string | null,
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

    const ticketId =
      ticketInfo?.id ??
      ticketInfo?.ticket_id ??
      ticketInfo?.ticketId ??
      entry.id ??
      entry.ticket_id ??
      entry.ticketId ??
      index;

    return {
      id: ticketId,
      passenger_id: passengerId,
      status: (paymentStatus?.status as string | undefined) ?? (ticketInfo?.status as string | undefined) ?? (rawPurchase?.status as string | undefined) ?? "pending",
      seat_id: (ticketInfo?.seat_id ?? ticketInfo?.seatId ?? null) as number | string | null,
      seat_num: (ticketInfo?.seat_number ?? ticketInfo?.seat_num ?? ticketInfo?.seat ?? null) as number | string | null,
      extra_baggage: toNumberSafe(ticketInfo?.extra_baggage ?? ticketInfo?.extraBaggage, 0),
      tour: {
        id: (tourInfo?.id ?? rawPurchase?.tour_id ?? rawPurchase?.id ?? index) as number | string,
        date: String(tourDate ?? rawPurchase?.created_at ?? ""),
        route_id: (routeInfo?.id ?? tourInfo?.route_id) as number | string | undefined,
        route_name: String(routeInfo?.name ?? tourInfo?.route_name ?? rawPurchase?.route_name ?? ""),
      },
      segments,
      route: routeInfo
        ? {
            id: routeInfo.id as number | string | undefined,
            name: routeInfo.name as string | undefined,
            stops: routeStops.map((stop) => ({
              id: stop.id as number | string,
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
        departure: segmentInfo?.departure
          ? {
              id: (segmentInfo.departure as Record<string, unknown>).id as number | string | undefined,
              name: (segmentInfo.departure as Record<string, unknown>).name as string | undefined,
              order: (segmentInfo.departure as Record<string, unknown>).order as number | undefined,
              time: (segmentInfo.departure as Record<string, unknown>).time as string | undefined,
            }
          : null,
        arrival: segmentInfo?.arrival
          ? {
              id: (segmentInfo.arrival as Record<string, unknown>).id as number | string | undefined,
              name: (segmentInfo.arrival as Record<string, unknown>).name as string | undefined,
              order: (segmentInfo.arrival as Record<string, unknown>).order as number | undefined,
              time: (segmentInfo.arrival as Record<string, unknown>).time as string | undefined,
            }
          : null,
        intermediate_stops: intermediateStops.map((stop) => ({
          id: stop.id as number | string | undefined,
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

  const inferredCurrency =
    (normalizedTickets.find((ticket) => ticket.pricing?.currency)?.pricing?.currency as string | undefined) ??
    (rawPurchase?.currency as string | undefined) ??
    (raw.currency as string | undefined) ??
    null;

  const purchaseSummary = {
    id: rawPurchase?.id ?? rawPurchase?.purchase_id ?? raw.id ?? raw.purchase_id ?? "",
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

  const customerRaw = isObject(rawPurchase?.customer) ? (rawPurchase.customer as Record<string, unknown>) : null;

  return {
    purchase: purchaseSummary,
    passengers,
    tickets: normalizedTickets,
    trips,
    totals,
    history,
    customer: customerRaw
      ? {
          name: String(customerRaw.name ?? ""),
          email: (customerRaw.email ?? null) as string | null,
          phone: (customerRaw.phone ?? null) as string | null,
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

  const [actionLoading, setActionLoading] = useState<PurchaseAction | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"reschedule" | "cancel" | "baggage" | null>(null);
  const [rescheduleScope, setRescheduleScope] = useState<"all" | "selected">("selected");

  const isActionDisabled = ACTION_DISABLED_STATUSES.has(String(data?.purchase?.status ?? ""));

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

  const validTicketIds = useMemo(() => {
    if (!data) {
      return new Set<string>();
    }
    return new Set(data.tickets.map((ticket) => String(ticket.id)));
  }, [data]);

  const rescheduleTickets = useMemo(() => {
    return rescheduleSelected.filter((id) => validTicketIds.has(id));
  }, [rescheduleSelected, validTicketIds]);

  const cancelTickets = useMemo(() => {
    return cancelSelected.filter((id) => validTicketIds.has(id));
  }, [cancelSelected, validTicketIds]);

  const rescheduleSelectionCount = rescheduleScope === "all" ? allTicketIds.length : rescheduleTickets.length;
  const cancelSelectionCount = cancelTickets.length;

  const baggageChanged = useMemo(() => {
    if (!data) return false;
    return data.tickets.some((ticket) => {
      const initial = Number(ticket.extra_baggage ?? 0);
      const draftValue = baggageDraft[String(ticket.id)] ?? 0;
      return initial !== draftValue;
    });
  }, [data, baggageDraft]);

  const baggageChangedCount = useMemo(() => {
    if (!data) return 0;
    return data.tickets.reduce((count, ticket) => {
      const initial = Number(ticket.extra_baggage ?? 0);
      const draftValue = baggageDraft[String(ticket.id)] ?? 0;
      return initial === draftValue ? count : count + 1;
    }, 0);
  }, [data, baggageDraft]);

  const toggleRescheduleTicket = (ticketId: string) => {
    setRescheduleSelected((prev) => {
      if (prev.includes(ticketId)) {
        return prev.filter((id) => id !== ticketId);
      }
      return [...prev, ticketId];
    });
  };

  const selectAllReschedule = () => {
    if (!data) return;
    setRescheduleSelected(data.tickets.map((ticket) => String(ticket.id)));
  };

  const clearRescheduleSelection = () => {
    setRescheduleSelected([]);
  };

  const toggleCancelTicket = (ticketId: string) => {
    setCancelSelected((prev) => {
      if (prev.includes(ticketId)) {
        return prev.filter((id) => id !== ticketId);
      }
      return [...prev, ticketId];
    });
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
      setActivePanel(null);

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
          .filter((tour): tour is RescheduleTour => Boolean(tour));

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
  const routeNames = Array.from(
    new Set(
      data.tickets
        .map((ticket) => ticket.tour.route_name)
        .filter((name): name is string => Boolean(name))
    )
  );
  const tripDates = Array.from(
    new Set(
      data.tickets
        .map((ticket) => ticket.tour.date)
        .filter((date): date is string => Boolean(date))
    )
  );
  const customer = data.customer ?? null;

  const history: PurchaseHistoryEvent[] = Array.isArray(data.history) ? data.history : [];
  const totals = data.totals ? { ...DEFAULT_TOTALS, ...data.totals } : { ...DEFAULT_TOTALS };
  const isPaid = data.purchase.status === "paid";
  const primaryActionLabel = isPaid ? "Оформить возврат" : "Оплатить";
  const primaryButtonClasses = isPaid ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500";
  const hasTickets = allTicketIds.length > 0;
  const primaryActionDisabled = isActionDisabled || (isPaid && cancelSelectionCount === 0);
  const cancelButtonDisabled = isActionDisabled || cancelSelectionCount === 0;
  const rescheduleButtonDisabled = isActionDisabled || !hasTickets;
  const baggageButtonDisabled = isActionDisabled;
  const showReturnTickets = returnTickets.length > 0;

  const handlePrimaryAction = () => {
    if (isActionDisabled) {
      return;
    }

    if (isPaid) {
      setActivePanel("cancel");
      if (cancelSelectionCount > 0) {
        void submitCancelPreview(cancelTickets);
      }
      return;
    }

    confirmPayment();
  };

  const handleCancelAction = () => {
    if (cancelButtonDisabled) {
      return;
    }

    setCancelError(null);
    setActivePanel("cancel");
    void submitCancelPreview(cancelTickets);
  };

  const handleRescheduleAction = () => {
    if (rescheduleButtonDisabled) {
      return;
    }

    setRescheduleError(null);
    setRescheduleQuote(null);
    setActivePanel("reschedule");
  };

  const handleBaggageAction = () => {
    if (baggageButtonDisabled) {
      return;
    }

    setBaggageError(null);
    setBaggageQuote(null);
    setActivePanel("baggage");
  };

  const renderTicketSection = (title: string, tickets: PurchaseTicket[]) => {
    if (tickets.length === 0) {
      return null;
    }

    return (
      <section key={title} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">Всего билетов: {tickets.length}</span>
        </div>
        <ul className="space-y-4">
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
              ticket.segment_details?.departure?.time ?? null,
              ticket.tour.date,
              departureSegment?.time ?? null
            );
            const arrivalDateTime = ensureDateTimeString(
              ticket.segment_details?.arrival?.time ?? null,
              ticket.tour.date,
              arrivalSegment?.time ?? null
            );
            const departureTimeSource =
              departureDateTime || departureSegment?.time || ticket.segment_details?.departure?.time || null;
            const arrivalTimeSource =
              arrivalDateTime || arrivalSegment?.time || ticket.segment_details?.arrival?.time || null;
            const departureDate = formatDate(departureDateTime);
            const arrivalDate = formatDate(arrivalDateTime);
            const departureTime = formatTime(departureTimeSource);
            const arrivalTime = formatTime(arrivalTimeSource);
            const extraBaggage = toNumberSafe(ticket.extra_baggage, 0);
            const baggageValue = baggageDraft[ticketId] ?? extraBaggage;
            const isRescheduleSelected = rescheduleTickets.includes(ticketId);
            const isCancelSelected = cancelTickets.includes(ticketId);
            const priceText = formatCurrency(
              ticket.pricing?.price ?? null,
              ticket.pricing?.currency ?? data.purchase.currency
            );
            const routeName = ticket.tour.route_name || "Маршрут не указан";

            return (
              <li
                key={ticket.id}
                className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-gray-900">{passengerName}</p>
                    <p className="text-sm text-gray-500">
                      Билет #{ticket.id} • {ticketStatusLabel}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(ticket.tour.date)} • {routeName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{priceText}</span>
                    <span>Место: {ticket.seat_num ?? "—"}</span>
                    <span>Доп. багаж: {baggageValue}</span>
                    {baggageValue !== extraBaggage ? (
                      <span className="text-xs font-semibold text-blue-600">изменено</span>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-4 border-t border-gray-100 pt-4 text-sm text-gray-700 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-gray-500">Отправление</p>
                    <p className="text-base font-semibold text-gray-900">{departureName}</p>
                    <p>
                      {(departureDate || "—")} • {departureTime}
                    </p>
                  </div>
                  <div className="space-y-1 md:text-right">
                    <p className="text-xs uppercase text-gray-500">Прибытие</p>
                    <p className="text-base font-semibold text-gray-900">{arrivalName}</p>
                    <p>
                      {(arrivalDate || "—")} • {arrivalTime}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex flex-wrap items-center gap-3 text-gray-700">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isRescheduleSelected}
                        onChange={() => toggleRescheduleTicket(ticketId)}
                        disabled={isActionDisabled || rescheduleScope === "all"}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                      />
                      Перенести
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isCancelSelected}
                        onChange={() => toggleCancelTicket(ticketId)}
                        disabled={isActionDisabled}
                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:cursor-not-allowed"
                      />
                      {cancelActionLabel}
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">Доп. багаж</span>
                      <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1">
                        <button
                          type="button"
                          onClick={() => decrementBaggage(ticketId)}
                          disabled={isActionDisabled || baggageValue <= 0}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-base text-gray-700 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-gray-900">
                          {baggageValue}
                        </span>
                        <button
                          type="button"
                          onClick={() => incrementBaggage(ticketId)}
                          disabled={isActionDisabled}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-base text-gray-700 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadTicket(ticket.id)}
                      className="text-sm font-semibold text-blue-600 transition hover:text-blue-500"
                    >
                      Скачать PDF
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <section className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Покупка #{data.purchase.id}</h1>
            <p className="text-sm text-gray-500">Создана {formatDate(data.purchase.created_at)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
              {statusLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-sm font-semibold text-emerald-700">
              {formatCurrency(data.purchase.amount_due, data.purchase.currency)}
            </span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Покупатель</h3>
            {customer ? (
              <>
                <p className="mt-2 text-base font-semibold text-gray-900">{customer.name}</p>
                {customer.phone ? (
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                ) : null}
                {customer.email ? (
                  <p className="text-sm text-gray-600">{customer.email}</p>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Информация о покупателе недоступна.</p>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Оплата</h3>
            <dl className="mt-2 space-y-1 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <dt>К оплате</dt>
                <dd className="font-semibold text-gray-900">{formatCurrency(totals.due, data.purchase.currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Оплачено</dt>
                <dd>{formatCurrency(totals.paid, data.purchase.currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Билеты</dt>
                <dd>{totals.pax_count}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Доп. багаж</dt>
                <dd>{totals.baggage_count}</dd>
              </div>
            </dl>
            {purchaseDeadline ? (
              <p className="mt-3 text-xs text-gray-500">Оплатить до {purchaseDeadline}</p>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Маршрут и документы</h3>
          {routeNames.length > 0 ? (
            <p className="mt-2 text-sm text-gray-700">{routeNames.join(", ")}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Маршрут не указан</p>
          )}
          {tripDates.length > 0 ? (
            <p className="mt-2 text-xs text-gray-500">
              Даты поездки: {tripDates.map((date) => formatDate(date)).join(", ")}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleDownloadAll}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            Скачать все билеты (PDF)
          </button>
        </div>
      </section>

      {banner ? <UiAlert type={banner.type}>{banner.message}</UiAlert> : null}

      {renderTicketSection("Билеты туда", outboundTickets)}

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={primaryActionDisabled}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 ${primaryButtonClasses}`}
          >
            {isPaid ? primaryActionLabel : `${primaryActionLabel} ${formatCurrency(totals.due, data.purchase.currency)}`}
          </button>
          <button
            type="button"
            onClick={handleCancelAction}
            disabled={cancelButtonDisabled}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Отменить
          </button>
          <button
            type="button"
            onClick={handleRescheduleAction}
            disabled={rescheduleButtonDisabled}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Перенести поездку
          </button>
          <button
            type="button"
            onClick={handleBaggageAction}
            disabled={baggageButtonDisabled}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Доп багаж
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>К оплате: {formatCurrency(totals.due, data.purchase.currency)}</span>
          <span>Для переноса выбрано: {rescheduleSelectionCount}</span>
          <span>
            {cancelActionLabel}: {cancelSelectionCount}
          </span>
          <span>Изменено багажа: {baggageChangedCount}</span>
        </div>
      </section>

      {activePanel === "reschedule" ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Перенос поездки</h3>
              <p className="text-sm text-gray-500">Выбрано билетов: {rescheduleSelectionCount}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="reschedule-scope"
                  value="all"
                  checked={rescheduleScope === "all"}
                  onChange={() => setRescheduleScope("all")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                Для всех пассажиров
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="reschedule-scope"
                  value="selected"
                  checked={rescheduleScope === "selected"}
                  onChange={() => setRescheduleScope("selected")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                Только выбранные
              </label>
              <button
                type="button"
                onClick={() => {
                  setActivePanel(null);
                  setRescheduleError(null);
                  setRescheduleQuote(null);
                }}
                className="ml-auto text-sm font-semibold text-gray-400 transition hover:text-gray-600"
              >
                Скрыть
              </button>
            </div>
          </div>
          {rescheduleScope === "selected" ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllReschedule}
                className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 font-semibold text-gray-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                Выбрать все
              </button>
              <button
                type="button"
                onClick={clearRescheduleSelection}
                className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 font-semibold text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
              >
                Сбросить
              </button>
            </div>
          ) : null}
          {rescheduleConsistencyError ? (
            <UiAlert type="error">{rescheduleConsistencyError}</UiAlert>
          ) : null}
          {rescheduleContext ? (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Маршрут</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {rescheduleContext.departureName} → {rescheduleContext.arrivalName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Количество мест</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {rescheduleSeatRequirement}
                    {rescheduleFreeSeats !== null ? ` • свободно: ${rescheduleFreeSeats}` : ""}
                  </p>
                </div>
              </div>
              {reschedulePassengers.length > 0 ? (
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs uppercase text-gray-500">Пассажиры</p>
                  <ul className="mt-2 grid gap-1 text-sm text-gray-700 md:grid-cols-2">
                    {reschedulePassengers.map(({ ticket, passenger }, index) => (
                      <li key={`${ticket?.id ?? "ticket"}-${index}`}>
                        {passenger?.name ?? `Пассажир #${ticket?.passenger_id ?? "?"}`} • билет #{ticket?.id ?? "—"} • текущее место: {ticket?.seat_num ?? "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Доступные даты</p>
                {rescheduleFetchingDates ? (
                  <p className="text-sm text-gray-500">Загружаем даты…</p>
                ) : rescheduleDates.length > 0 ? (
                  <Calendar
                    activeDates={rescheduleDates}
                    selectedDate={rescheduleDate || undefined}
                    allowAllFutureDates
                    onSelect={handleRescheduleDateSelect}
                    className="max-w-full"
                  />
                ) : (
                  <p className="text-sm text-gray-500">Нет доступных дат для выбранных билетов.</p>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Доступные рейсы</p>
                {rescheduleFetchingTours ? (
                  <p className="text-sm text-gray-500">Подбираем рейсы…</p>
                ) : rescheduleTours.length > 0 ? (
                  <div className="space-y-2">
                    {rescheduleTours.map((tour) => (
                      <label
                        key={tour.id}
                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition ${
                          rescheduleTourId === tour.id
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 bg-gray-50 hover:border-blue-300"
                        }`}
                      >
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {formatTime(tour.departure_time)} → {formatTime(tour.arrival_time)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Свободных мест: {typeof tour.seats === "number" ? tour.seats : Number((tour.seats as { free?: number }).free ?? 0)}
                          </p>
                          {tour.description ? (
                            <p className="text-xs text-gray-500">{tour.description}</p>
                          ) : null}
                        </div>
                        <input
                          type="radio"
                          name="reschedule-tour"
                          className="h-4 w-4"
                          checked={rescheduleTourId === tour.id}
                          onChange={() => handleSelectRescheduleTour(tour.id)}
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {rescheduleDate ? "Нет подходящих рейсов на выбранную дату." : "Выберите дату, чтобы увидеть рейсы."}
                  </p>
                )}
              </div>
              {rescheduleTourId ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Выбор мест</p>
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
                  <p className="text-xs text-gray-500">
                    Выбрано мест: {rescheduleSeatNumbers.length} из {rescheduleSeatRequirement}
                  </p>
                </div>
              ) : null}
              {rescheduleQuote ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    rescheduleQuote.can_apply
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                >
                  <p className="font-semibold">
                    Разница: {formatCurrency(rescheduleQuote.price_change, rescheduleQuote.currency)}
                  </p>
                  {rescheduleQuote.note ? <p>{rescheduleQuote.note}</p> : null}
                  {!rescheduleQuote.can_apply ? <p>Перенос недоступен: скорректируйте выбор.</p> : null}
                </div>
              ) : null}
              {rescheduleError ? <p className="text-sm text-red-500">{rescheduleError}</p> : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRescheduleQuote}
                  disabled={!canSubmitRescheduleQuote || rescheduleQuoteLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                >
                  {rescheduleQuoteLoading ? "Считаем…" : "Рассчитать разницу"}
                </button>
                <button
                  type="button"
                  onClick={applyReschedule}
                  disabled={
                    !canSubmitRescheduleQuote ||
                    actionLoading === "reschedule" ||
                    !rescheduleQuote ||
                    rescheduleQuote.can_apply === false
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {actionLoading === "reschedule" ? "Переносим…" : "Подтвердить перенос"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Выберите билеты, чтобы продолжить перенос.</p>
          )}
        </section>
      ) : null}

      {activePanel === "cancel" ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{cancelActionLabel} билетов</h3>
              <p className="text-sm text-gray-500">Выбрано билетов: {cancelSelectionCount}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllCancel}
                className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 font-semibold text-gray-600 transition hover:border-red-300 hover:text-red-600"
              >
                Выбрать все
              </button>
              <button
                type="button"
                onClick={clearCancelSelection}
                className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 font-semibold text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
              >
                Сбросить
              </button>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="text-sm font-semibold text-gray-400 transition hover:text-gray-600"
              >
                Скрыть
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              onClick={() => void submitCancelPreview(cancelTickets)}
              disabled={cancelButtonDisabled}
            >
              Рассчитать {cancelActionLabel.toLowerCase()}
            </button>
            {cancelLoading ? <span className="text-sm text-gray-500">Расчёт...</span> : null}
          </div>
          {cancelError ? <p className="text-sm text-red-500">{cancelError}</p> : null}
          {cancelPreview ? (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              К возврату сейчас: {formatCurrency(cancelPreview.total_refund, cancelPreview.currency)}
            </div>
          ) : (
            cancelLoading ? null : (
              <p className="text-sm text-gray-500">Выберите билеты, чтобы рассчитать {cancelActionLabel.toLowerCase()}.</p>
            )
          )}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={confirmCancel}
              disabled={cancelButtonDisabled || actionLoading === "cancel"}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {cancelConfirmLabel}
            </button>
          </div>
        </section>
      ) : null}

      {activePanel === "baggage" ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Дополнительный багаж</h3>
              <p className="text-sm text-gray-500">
                Изменено билетов: {baggageChangedCount}. Настраивайте багаж рядом с нужными билетами.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="text-sm font-semibold text-gray-400 transition hover:text-gray-600"
            >
              Скрыть
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
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
                (baggageQuote && !baggageQuote.can_apply)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Сохранить изменения
            </button>
            {baggageLoading ? <span className="text-sm text-gray-500">Рассчитываем стоимость...</span> : null}
          </div>
          {baggageError ? <p className="text-sm text-red-500">{baggageError}</p> : null}
          {baggageQuote ? (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                baggageQuote.can_apply
                  ? "border border-blue-200 bg-blue-50 text-blue-700"
                  : "border border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <p className="font-semibold">
                Изменение долга: {formatCurrency(baggageQuote.delta, baggageQuote.currency)}
              </p>
              {Array.isArray(baggageQuote.breakdown) && baggageQuote.breakdown.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs">
                  {baggageQuote.breakdown.map((item) => (
                    <li key={String(item.ticket_id)}>
                      Билет #{item.ticket_id}: {item.old ?? 0} → {item.new ?? 0} ({formatCurrency(item.delta ?? 0, baggageQuote.currency)})
                    </li>
                  ))}
                </ul>
              ) : null}
              {!baggageQuote.can_apply ? (
                <p className="mt-2 text-xs">Изменения недоступны. Проверьте правила перевозчика или попробуйте изменить запрос.</p>
              ) : null}
            </div>
          ) : (
            baggageLoading ? null : (
              <p className="text-sm text-gray-500">Укажите нужное количество багажа в карточках билетов.</p>
            )
          )}
        </section>
      ) : null}

      {showReturnTickets ? renderTicketSection("Билеты обратно", returnTickets) : null}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">История действий</h2>
          <button
            type="button"
            onClick={() => setHistoryOpen((prev) => !prev)}
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-500"
          >
            {historyOpen ? "Скрыть" : "Показать"}
          </button>
        </div>
        {historyOpen ? (
          history.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
              История пока пуста.
            </p>
          ) : (
            <ul className="space-y-3">
              {history.map((event) => (
                <li
                  key={event.id ?? `${event.date}-${event.category}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(event.date)} • {event.category}</p>
                    {event.comment ? <p className="text-xs text-gray-500">{event.comment}</p> : null}
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {event.amount !== undefined && event.amount !== null ? (
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(event.amount, event.currency ?? data.purchase.currency)}
                      </p>
                    ) : null}
                    {event.method ? <p className="text-xs text-gray-500">{event.method}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="text-sm text-gray-500">Откройте раздел, чтобы посмотреть историю операций.</p>
        )}
      </section>

    </div>
  );
}
