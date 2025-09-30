"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import UiAlert from "@/components/common/Alert";
import Loader from "@/components/common/Loader";
import { API } from "@/config";
import type {
  BaggageQuote,
  CancelPreview,
  PurchaseHistoryEvent,
  PurchasePassenger,
  PurchaseTicket,
  PurchaseTrip,
  PurchaseView,
  RescheduleOption,
} from "@/types/purchase";
import { fetchWithInclude } from "@/utils/fetchWithInclude";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачено",
  canceled: "Отменено",
  expired: "Истёкло",
};

const ACTION_DISABLED_STATUSES = new Set(["canceled", "expired"]);

type PurchaseAction = "pay" | "reschedule" | "cancel" | "baggage";

type ActionBanner = {
  type: "info" | "success" | "error";
  message: string;
};

type RescheduleScope = "all" | "selected";
type CancelScope = "all" | "selected";

const formatDate = (value: string | undefined | null) => {
  if (!value) return "";

  try {
    return new Date(value).toLocaleDateString("ru-RU", {
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
    return new Date(value).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value.slice(11, 16) || value;
  }
};

const parseDate = (value: string | undefined | null) => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
};

const formatCurrency = (amount: number | undefined | null, currency: string | undefined | null) => {
  if (amount === undefined || amount === null || currency === undefined || currency === null) {
    return "—";
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

const formatDuration = (minutes: number | null) => {
  if (minutes === null) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) {
    return `${mins} мин`;
  }
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
};

const downloadPdf = async (path: string, filename: string, onError: (message: string) => void) => {
  if (typeof window === "undefined") return;

  try {
    const response = await fetchWithInclude(`${API}${path}`, {
      method: "GET",
      headers: { Accept: "application/pdf" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    onError("Не удалось скачать PDF. Попробуйте позже");
  }
};

const mapById = <T extends { id: string | number }>(items: T[]) => {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(String(item.id), item);
  });
  return map;
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

type OtpStartResponse = {
  challenge_id?: string | number;
} & Record<string, unknown>;

type VerifyResponse = {
  op_token?: string;
  payment?: PaymentPayload;
} & Record<string, unknown>;

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

  const [rescheduleScope, setRescheduleScope] = useState<RescheduleScope>("all");
  const [rescheduleSelected, setRescheduleSelected] = useState<string[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleOptions, setRescheduleOptions] = useState<RescheduleOption[]>([]);
  const [rescheduleOptionId, setRescheduleOptionId] = useState<string | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const [cancelScope, setCancelScope] = useState<CancelScope>("all");
  const [cancelSelected, setCancelSelected] = useState<string[]>([]);
  const [cancelPreview, setCancelPreview] = useState<CancelPreview | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [baggageDraft, setBaggageDraft] = useState<Record<string, number>>({});
  const [baggageQuote, setBaggageQuote] = useState<BaggageQuote | null>(null);
  const [baggageLoading, setBaggageLoading] = useState(false);
  const [baggageError, setBaggageError] = useState<string | null>(null);

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpAction, setOtpAction] = useState<PurchaseAction | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<PurchaseAction | null>(null);

  const isActionDisabled = ACTION_DISABLED_STATUSES.has(String(data?.purchase?.status ?? ""));

  const passengerNameMap = useMemo(() => {
    if (!data || !data.passengers) return new Map<string, string>();
    const map = new Map<string, string>();
    data.passengers.forEach((passenger) => {
      map.set(String(passenger.id), passenger.name);
    });
    return map;
  }, [data]);

  const passengerTickets = useMemo(() => {
    if (!data || !data.passengers) return new Map<string, PurchaseTicket[]>();
    const tickets = Array.isArray(data.tickets) ? data.tickets : [];
    const map = new Map<string, PurchaseTicket[]>();
    data.passengers.forEach((passenger) => {
      const related = tickets.filter(
        (ticket) => String(ticket.passenger_id) === String(passenger.id)
      );
      map.set(String(passenger.id), related);
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

  const resetActionState = useCallback(() => {
    setRescheduleOptions([]);
    setRescheduleOptionId(null);
    setRescheduleLoading(false);
    setRescheduleError(null);
    setCancelPreview(null);
    setCancelLoading(false);
    setCancelError(null);
    setBaggageQuote(null);
    setBaggageLoading(false);
    setBaggageError(null);
    setOtpModalOpen(false);
    setOtpCode("");
    setOtpError(null);
    setOtpAction(null);
    setPendingPayload(null);
    setOtpChallengeId(null);
    setOtpSubmitting(false);
    setActionLoading(null);
  }, []);

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

      const payload = (await response.json()) as PurchaseView;
      const tickets: PurchaseTicket[] = Array.isArray(payload.tickets) ? payload.tickets : [];
      const trips: PurchaseTrip[] = Array.isArray(payload.trips) ? payload.trips : [];
      const passengers: PurchasePassenger[] = Array.isArray(payload.passengers) ? payload.passengers : [];
      const normalizedPayload: PurchaseView = {
        ...payload,
        passengers,
        tickets,
        trips,
      };
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

  const refreshAfterAction = useCallback(async () => {
    await fetchPurchase();
    setBanner({ type: "success", message: "Успешно" });
  }, [fetchPurchase]);

  const handleDownloadAll = useCallback(() => {
    if (!data) return;
    void downloadPdf(`/purchase/${data.purchase.id}/pdf`, `purchase-${data.purchase.id}.pdf`, (message) =>
      setBanner({ type: "error", message })
    );
  }, [data]);

  const handleDownloadTicket = useCallback(
    (ticketId: string | number) => {
      void downloadPdf(`/tickets/${ticketId}/pdf`, `ticket-${ticketId}.pdf`, (message) =>
        setBanner({ type: "error", message })
      );
    },
    []
  );

  const startOtpFlow = useCallback(
    async (action: PurchaseAction, payload: Record<string, unknown>) => {
      setActionLoading(action);
      setBanner(null);

      try {
        const response = await fetchWithInclude(`${API}/public/otp/start`, {
          method: "POST",
          body: JSON.stringify({ action, purchase_id: purchaseId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        let startPayload: OtpStartResponse | null = null;
        try {
          startPayload = (await response.json()) as OtpStartResponse;
        } catch {
          startPayload = null;
        }

        const challengeIdRaw = startPayload?.challenge_id;
        const challengeId =
          challengeIdRaw !== undefined && challengeIdRaw !== null ? String(challengeIdRaw) : null;

        if (!challengeId) {
          throw new Error("Missing challenge id in OTP start response");
        }

        setOtpAction(action);
        setPendingPayload(payload);
        setOtpChallengeId(challengeId);
        setOtpCode("");
        setOtpError(null);
        setOtpModalOpen(true);
      } catch (otpError) {
        console.error(otpError);
        setBanner({ type: "error", message: "Не удалось отправить код подтверждения" });
      } finally {
        setActionLoading(null);
      }
    },
    [purchaseId]
  );

  const submitRescheduleOptions = useCallback(
    async (ticketIds: string[], date: string) => {
      if (ticketIds.length === 0 || !date) {
        setRescheduleOptions([]);
        return;
      }
      setRescheduleLoading(true);
      setRescheduleError(null);

      try {
        const ticketIdentifiers = toOriginalTicketIds(ticketIds);
        const body: Record<string, unknown> = { date };
        if (ticketIdentifiers.length > 0) {
          body.ticket_ids = ticketIdentifiers;
        }

        const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/reschedule-options`, {
          method: "POST",
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as { options?: RescheduleOption[] };
        setRescheduleOptions(Array.isArray(payload?.options) ? payload.options : []);
        setRescheduleOptionId(null);
      } catch (optionsError) {
        console.error(optionsError);
        setRescheduleOptions([]);
        setRescheduleError("Не удалось получить варианты переноса");
      } finally {
        setRescheduleLoading(false);
      }
    },
    [purchaseId, toOriginalTicketIds]
  );

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
      } catch (quoteError) {
        console.error(quoteError);
        setBaggageQuote(null);
        setBaggageError("Не удалось рассчитать доплату за багаж");
      } finally {
        setBaggageLoading(false);
      }
    },
    [purchaseId]
  );

  const submitPayment = useCallback(
    async (verifyData?: VerifyResponse) => {
      const opToken = verifyData?.op_token;

      if (!opToken) {
        setOtpError("Не удалось подтвердить код");
        setOtpSubmitting(false);
        return;
      }

      try {
        const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/pay`, {
          method: "POST",
          body: JSON.stringify({ ...(pendingPayload ?? {}), op_token: opToken }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        let payload: VerifyResponse | null = null;
        try {
          payload = (await response.json()) as VerifyResponse;
        } catch {
          payload = null;
        }

        const paymentPayload = (payload?.payment ?? payload) as PaymentPayload | undefined;
        if (paymentPayload) {
          submitPaymentForm(paymentPayload);
        }

        resetActionState();
        await refreshAfterAction();
      } catch (paymentError) {
        console.error(paymentError);
        setOtpError("Не удалось инициировать оплату");
        setOtpSubmitting(false);
      }
    },
    [pendingPayload, purchaseId, refreshAfterAction, resetActionState]
  );

  const submitReschedule = useCallback(
    async (verifyData?: VerifyResponse) => {
      if (!pendingPayload) {
        setOtpError("Нет данных для переноса");
        setOtpSubmitting(false);
        return;
      }

      const opToken = verifyData?.op_token;
      if (!opToken) {
        setOtpError("Не удалось подтвердить код");
        setOtpSubmitting(false);
        return;
      }

      try {
        const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/reschedule`, {
          method: "POST",
          body: JSON.stringify({ ...pendingPayload, op_token: opToken }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        resetActionState();
        await refreshAfterAction();
      } catch (rescheduleError) {
        console.error(rescheduleError);
        setOtpError("Не удалось выполнить перенос");
        setOtpSubmitting(false);
      }
    },
    [pendingPayload, purchaseId, refreshAfterAction, resetActionState]
  );

  const submitCancel = useCallback(
    async (verifyData?: VerifyResponse) => {
      if (!pendingPayload) {
        setOtpError("Нет данных для отмены");
        setOtpSubmitting(false);
        return;
      }

      const opToken = verifyData?.op_token;
      if (!opToken) {
        setOtpError("Не удалось подтвердить код");
        setOtpSubmitting(false);
        return;
      }

      try {
        const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/cancel`, {
          method: "POST",
          body: JSON.stringify({ ...pendingPayload, op_token: opToken }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        resetActionState();
        await refreshAfterAction();
      } catch (cancelError) {
        console.error(cancelError);
        setOtpError("Не удалось отменить билеты");
        setOtpSubmitting(false);
      }
    },
    [pendingPayload, purchaseId, refreshAfterAction, resetActionState]
  );

  const submitBaggage = useCallback(
    async (verifyData?: VerifyResponse) => {
      if (!pendingPayload) {
        setOtpError("Нет данных по багажу");
        setOtpSubmitting(false);
        return;
      }

      const opToken = verifyData?.op_token;
      if (!opToken) {
        setOtpError("Не удалось подтвердить код");
        setOtpSubmitting(false);
        return;
      }

      try {
        const response = await fetchWithInclude(`${API}/public/purchase/${purchaseId}/baggage`, {
          method: "POST",
          body: JSON.stringify({ ...pendingPayload, op_token: opToken }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        resetActionState();
        await refreshAfterAction();
      } catch (baggageSubmitError) {
        console.error(baggageSubmitError);
        setOtpError("Не удалось обновить багаж");
        setOtpSubmitting(false);
      }
    },
    [pendingPayload, purchaseId, refreshAfterAction, resetActionState]
  );

  const handleVerifyOtp = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!otpAction) {
        setOtpError("Нет действия для подтверждения");
        return;
      }

      if (!otpChallengeId) {
        setOtpError("Нет активного запроса подтверждения");
        return;
      }

      if (!pendingPayload && otpAction !== "pay") {
        setOtpError("Нет данных для выполнения действия");
        return;
      }

      if (!otpCode) {
        setOtpError("Введите код из SMS");
        return;
      }

      setOtpSubmitting(true);
      setOtpError(null);

      try {
        const response = await fetchWithInclude(`${API}/public/otp/verify`, {
          method: "POST",
          body: JSON.stringify({ challenge_id: otpChallengeId, code: otpCode }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        let verifyData: VerifyResponse | null = null;
        try {
          verifyData = (await response.json()) as VerifyResponse;
        } catch {
          verifyData = null;
        }

        if (otpAction === "pay") {
          await submitPayment(verifyData ?? undefined);
          return;
        }

        if (otpAction === "reschedule") {
          await submitReschedule(verifyData ?? undefined);
          return;
        }

        if (otpAction === "cancel") {
          await submitCancel(verifyData ?? undefined);
          return;
        }

        if (otpAction === "baggage") {
          await submitBaggage(verifyData ?? undefined);
          return;
        }
      } catch (verifyError) {
        console.error(verifyError);
        setOtpError("Не удалось подтвердить код");
        setOtpSubmitting(false);
      }
    },
    [
      otpAction,
      otpChallengeId,
      otpCode,
      pendingPayload,
      submitBaggage,
      submitCancel,
      submitPayment,
      submitReschedule,
    ]
  );

  const rescheduleTickets = useMemo(() => {
    if (!data) return [] as string[];
    if (rescheduleScope === "all") {
      return data.tickets.map((ticket) => String(ticket.id));
    }
    return rescheduleSelected;
  }, [data, rescheduleScope, rescheduleSelected]);

  const cancelTickets = useMemo(() => {
    if (!data) return [] as string[];
    if (cancelScope === "all") {
      return data.tickets.map((ticket) => String(ticket.id));
    }
    return cancelSelected;
  }, [data, cancelScope, cancelSelected]);

  const baggageChanged = useMemo(() => {
    if (!data) return false;
    return data.tickets.some((ticket) => {
      const initial = Number(ticket.extra_baggage ?? 0);
      const draftValue = baggageDraft[String(ticket.id)] ?? 0;
      return initial !== draftValue;
    });
  }, [data, baggageDraft]);

  const handleRescheduleScopeChange = (value: RescheduleScope) => {
    setRescheduleScope(value);
    if (value === "all" && data) {
      setRescheduleSelected(data.tickets.map((ticket) => String(ticket.id)));
    }
  };

  const handleCancelScopeChange = (value: CancelScope) => {
    setCancelScope(value);
    if (value === "all" && data) {
      setCancelSelected(data.tickets.map((ticket) => String(ticket.id)));
    }
  };

  const toggleRescheduleTicket = (ticketId: string) => {
    setRescheduleSelected((prev) => {
      if (prev.includes(ticketId)) {
        return prev.filter((id) => id !== ticketId);
      }
      return [...prev, ticketId];
    });
  };

  const toggleCancelTicket = (ticketId: string) => {
    setCancelSelected((prev) => {
      if (prev.includes(ticketId)) {
        return prev.filter((id) => id !== ticketId);
      }
      return [...prev, ticketId];
    });
  };

  const incrementBaggage = (ticketId: string) => {
    setBaggageDraft((prev) => ({ ...prev, [ticketId]: (prev[ticketId] ?? 0) + 1 }));
  };

  const decrementBaggage = (ticketId: string) => {
    setBaggageDraft((prev) => ({ ...prev, [ticketId]: Math.max(0, (prev[ticketId] ?? 0) - 1) }));
  };

  const confirmReschedule = () => {
    if (isActionDisabled) {
      return;
    }

    if (rescheduleTickets.length === 0) {
      setBanner({ type: "error", message: "Выберите билеты для переноса" });
      return;
    }

    const selectedOption = rescheduleOptions.find((option) => String(option.id) === rescheduleOptionId);

    if (!selectedOption) {
      setBanner({ type: "error", message: "Выберите новый рейс" });
      return;
    }

    const ticketIdentifiers = toOriginalTicketIds(rescheduleTickets);
    const payload: Record<string, unknown> = {
      new_tour_id: selectedOption.id,
    };

    if (ticketIdentifiers.length > 0) {
      payload.ticket_ids = ticketIdentifiers;
    }

    void startOtpFlow("reschedule", payload);
  };

  const confirmCancel = () => {
    if (isActionDisabled || cancelTickets.length === 0) {
      setBanner({ type: "error", message: "Выберите билеты для отмены" });
      return;
    }

    const ticketIdentifiers = toOriginalTicketIds(cancelTickets);
    const payload: Record<string, unknown> = {};

    if (ticketIdentifiers.length > 0) {
      payload.ticket_ids = ticketIdentifiers;
    }

    void startOtpFlow("cancel", payload);
  };

  const confirmBaggage = () => {
    if (isActionDisabled || !baggageChanged) {
      setBanner({ type: "error", message: "Изменений по багажу нет" });
      return;
    }

    const payload: Record<string, unknown> = {
      baggage: baggageDraft,
    };

    void startOtpFlow("baggage", payload);
  };

  const confirmPayment = () => {
    if (!data || isActionDisabled) {
      return;
    }

    void startOtpFlow("pay", {});
  };

  useEffect(() => {
    if (rescheduleScope === "all" && data) {
      setRescheduleSelected(data.tickets.map((ticket) => String(ticket.id)));
    }
  }, [data, rescheduleScope]);

  useEffect(() => {
    if (cancelScope === "all" && data) {
      setCancelSelected(data.tickets.map((ticket) => String(ticket.id)));
    }
  }, [data, cancelScope]);

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

  const history: PurchaseHistoryEvent[] = Array.isArray(data.history) ? data.history : [];

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Покупка #{data.purchase.id}</h1>
            <p className="text-sm text-gray-500">Создана {formatDate(data.purchase.created_at)}</p>
            {purchaseDeadline ? (
              <p className="mt-1 text-sm text-gray-500">Оплатить до {purchaseDeadline}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
              {statusLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700">
              Пассажиры: {data.totals.pax_count}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700">
              Багаж: {data.totals.baggage_count}+ручная
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-sm font-semibold text-emerald-700">
              {formatCurrency(data.purchase.amount_due, data.purchase.currency)}
            </span>
          </div>
        </div>
        {routeNames.length > 0 ? (
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium">Маршрут: {routeNames.join(", ")}</p>
            {tripDates.length > 0 ? (
              <p className="mt-1">Даты: {tripDates.map((date) => formatDate(date)).join(", ")}</p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            Скачать все билеты (PDF)
          </button>
          <div className="text-right text-sm text-gray-500">
            <p>Оплачено: {formatCurrency(data.totals.paid, data.purchase.currency)}</p>
            <p>К оплате: {formatCurrency(data.totals.due, data.purchase.currency)}</p>
          </div>
        </div>
      </section>

      {banner ? (
        <UiAlert type={banner.type}>{banner.message}</UiAlert>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Состав покупки</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {tripsDetailed.map(({ trip, summary }) => (
            <div key={trip.direction} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Рейс {trip.direction === "outbound" ? "туда" : "обратно"}
                </h3>
                {summary ? (
                  <span className="text-sm text-gray-500">{formatDuration(summary.durationMinutes)}</span>
                ) : null}
              </div>
              {summary ? (
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{summary.from}</p>
                      <p className="text-xs text-gray-500">Отправление</p>
                    </div>
                    <span className="text-base font-semibold">{formatTime(summary.start)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{summary.to}</p>
                      <p className="text-xs text-gray-500">Прибытие</p>
                    </div>
                    <span className="text-base font-semibold">{formatTime(summary.end)}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Информация о рейсе недоступна.</p>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Пассажиры и билеты</h3>
          <ul className="mt-4 space-y-4">
            {(data?.passengers ?? []).map((passenger) => {
              const tickets = passengerTickets.get(String(passenger.id)) ?? [];
              return (
                <li key={passenger.id} className="rounded-xl bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">{passenger.name}</p>
                      <p className="text-sm text-gray-500">
                        {passenger.email ? `${passenger.email} • ` : ""}
                        {passenger.phone ?? ""}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      Всего билетов: {tickets.length}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-3">
                    {tickets.map((ticket) => (
                      <li
                        key={ticket.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Билет #{ticket.id}</p>
                          <p className="text-sm text-gray-600">
                            Место {ticket.seat_num ?? "—"} • {Number(ticket.extra_baggage ?? 0)} багаж (+ручная)
                          </p>
                          <p className="text-xs text-gray-500">Статус: {STATUS_LABELS[ticket.status] ?? ticket.status}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadTicket(ticket.id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          Скачать PDF
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Действия с покупкой</h2>

        <div className="grid gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Оплата покупки</h3>
                <p className="text-sm text-gray-500">Оплатить всю покупку целиком</p>
              </div>
              <button
                type="button"
                disabled={isActionDisabled || actionLoading === "pay"}
                onClick={confirmPayment}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Оплатить {formatCurrency(data.totals.due, data.purchase.currency)}
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Перенос рейса</h3>
                <p className="text-sm text-gray-500">Выберите пассажиров и новый рейс</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reschedule-scope"
                    value="all"
                    checked={rescheduleScope === "all"}
                    onChange={() => handleRescheduleScopeChange("all")}
                    className="h-4 w-4"
                  />
                  всех пассажиров
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reschedule-scope"
                    value="selected"
                    checked={rescheduleScope === "selected"}
                    onChange={() => handleRescheduleScopeChange("selected")}
                    className="h-4 w-4"
                  />
                  выбрать пассажиров
                </label>
              </div>
            </div>

            {rescheduleScope === "selected" ? (
              <div className="grid gap-2 md:grid-cols-2">
                {data.tickets.map((ticket) => {
                  const ticketId = String(ticket.id);
                  return (
                    <label key={`reschedule-${ticket.id}`} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={rescheduleSelected.includes(ticketId)}
                        onChange={() => toggleRescheduleTicket(ticketId)}
                        className="h-4 w-4"
                      />
                      <span>Билет #{ticket.id} • {ticket.seat_num ?? "без места"}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-[240px_1fr]">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="reschedule-date">
                  Дата нового рейса
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleDate}
                  onChange={(event) => setRescheduleDate(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
                  onClick={() => void submitRescheduleOptions(rescheduleTickets, rescheduleDate)}
                  disabled={isActionDisabled || rescheduleTickets.length === 0 || !rescheduleDate}
                >
                  {rescheduleLoading ? "Загрузка..." : "Показать рейсы"}
                </button>
                {rescheduleError ? <p className="mt-2 text-sm text-red-500">{rescheduleError}</p> : null}
              </div>
              <div className="space-y-3">
                {rescheduleOptions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                    Выберите дату, чтобы увидеть доступные рейсы.
                  </p>
                ) : (
                  rescheduleOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 hover:border-blue-400"
                    >
                      <div className="flex flex-col">
                        <span className="text-base font-semibold text-gray-900">
                          {formatTime(option.departure_time)} → {formatTime(option.arrival_time)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Свободных мест: {option.availability}
                        </span>
                        {option.description ? (
                          <span className="mt-1 text-xs text-gray-500">{option.description}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(option.price_change, option.currency)}
                        </span>
                        <input
                          type="radio"
                          name="reschedule-option"
                          checked={rescheduleOptionId === String(option.id)}
                          onChange={() => setRescheduleOptionId(String(option.id))}
                          className="h-4 w-4"
                        />
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Выбрано билетов: {rescheduleTickets.length}
              </div>
              <button
                type="button"
                onClick={confirmReschedule}
                disabled={isActionDisabled || actionLoading === "reschedule"}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Подтвердить перенос
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Отмена билетов</h3>
                <p className="text-sm text-gray-500">Рассчёт мгновенного возврата</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="cancel-scope"
                    value="all"
                    checked={cancelScope === "all"}
                    onChange={() => handleCancelScopeChange("all")}
                    className="h-4 w-4"
                  />
                  всю покупку
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="cancel-scope"
                    value="selected"
                    checked={cancelScope === "selected"}
                    onChange={() => handleCancelScopeChange("selected")}
                    className="h-4 w-4"
                  />
                  выбрать билеты
                </label>
              </div>
            </div>

            {cancelScope === "selected" ? (
              <div className="grid gap-2 md:grid-cols-2">
                {data.tickets.map((ticket) => {
                  const ticketId = String(ticket.id);
                  return (
                    <label key={`cancel-${ticket.id}`} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={cancelSelected.includes(ticketId)}
                        onChange={() => toggleCancelTicket(ticketId)}
                        className="h-4 w-4"
                      />
                      <span>Билет #{ticket.id} • {ticket.seat_num ?? "без места"}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                onClick={() => void submitCancelPreview(cancelTickets)}
                disabled={isActionDisabled || cancelTickets.length === 0}
              >
                Рассчитать возврат
              </button>
              {cancelLoading ? <span className="text-sm text-gray-500">Расчёт...</span> : null}
            </div>
            {cancelError ? <p className="text-sm text-red-500">{cancelError}</p> : null}
            {cancelPreview ? (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                К возврату сейчас: {formatCurrency(cancelPreview.total_refund, cancelPreview.currency)}
              </div>
            ) : null}

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={confirmCancel}
                disabled={isActionDisabled || actionLoading === "cancel"}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Подтвердить отмену
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Дополнительный багаж</h3>
                <p className="text-sm text-gray-500">Укажите количество мест багажного отсека</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
                onClick={() => void submitBaggageQuote(baggageDraft)}
                disabled={isActionDisabled}
              >
                Рассчитать доплату
              </button>
            </div>

            {baggageError ? <p className="text-sm text-red-500">{baggageError}</p> : null}
            {baggageLoading ? <p className="text-sm text-gray-500">Рассчитываем стоимость...</p> : null}

            <div className="grid gap-3 md:grid-cols-2">
              {data.tickets.map((ticket) => {
                const ticketId = String(ticket.id);
                const value = baggageDraft[ticketId] ?? 0;
                return (
                  <div key={`baggage-${ticket.id}`} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Билет #{ticket.id}</p>
                      <p>
                        Пассажир: {passengerNameMap.get(String(ticket.passenger_id)) ?? ticket.passenger_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => decrementBaggage(ticketId)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-700"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-base font-semibold text-gray-900">{value}</span>
                      <button
                        type="button"
                        onClick={() => incrementBaggage(ticketId)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {baggageQuote ? (
              <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Доплата за багаж: {formatCurrency(baggageQuote.total, baggageQuote.currency)}
              </div>
            ) : null}

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={confirmBaggage}
                disabled={isActionDisabled || actionLoading === "baggage"}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">История действий</h2>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
            История пока пуста.
          </p>
        ) : (
          <ul className="space-y-3">
            {history.map((event) => (
              <li key={event.id ?? `${event.date}-${event.category}`}
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
        )}
      </section>

      {otpModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Подтверждение действия</h3>
            <p className="mt-2 text-sm text-gray-500">
              Введите код, отправленный на ваш телефон, чтобы подтвердить действие.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleVerifyOtp}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest focus:border-blue-500 focus:outline-none"
                placeholder="••••••"
              />
              {otpError ? <p className="text-sm text-red-500">{otpError}</p> : null}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600"
                  onClick={resetActionState}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={otpSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {otpSubmitting ? "Отправка..." : "Подтвердить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
