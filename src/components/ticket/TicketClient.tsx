"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API } from "@/config";
import type { ElectronicTicketData, TicketSegment } from "@/types/ticket";
import { downloadTicketPdf } from "@/utils/ticketPdf";
import { fetchWithInclude } from "@/utils/fetchWithInclude";
import SeatClient, { type SeatMapSeat } from "@/components/SeatClient";

const STATUS_LABELS: Record<ElectronicTicketData["status"], string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  canceled: "Отменён",
};

type TicketAction = "pay" | "reschedule" | "cancel";

type Banner = {
  type: "success" | "error" | "info";
  message: string;
};

type VerifyResponse = {
  otp_token?: string;
  payment?: PaymentPayload;
} & Record<string, unknown>;

type PaymentPayload = {
  url: string;
  [key: string]: unknown;
};

type RescheduleOptionPayload = {
  option_id?: string;
  trip_id?: string;
  date?: string;
  departure_time?: string;
  arrival_time?: string;
} & Record<string, unknown>;

type RescheduleOption = {
  id: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  description: string;
  price: number;
  currency: string;
  availability: number;
  tripId: string;
  payload: RescheduleOptionPayload;
};

type SeatSelectionDetail = {
  seatId: number;
  seatNumber: number;
};

type SeatContext = {
  tourId: number;
  departureStopId: number;
  arrivalStopId: number;
  layoutVariant?: string | null;
};

interface TicketClientProps {
  ticketId: string;
}

const formatTime = (time: string) => time.slice(0, 5);

const formatDate = (value: string) => {
  try {
    const date = new Date(value);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

export default function TicketClient({ ticketId }: TicketClientProps) {
  const [ticket, setTicket] = useState<ElectronicTicketData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [resendEmail, setResendEmail] = useState<string>("");
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [otpModalOpen, setOtpModalOpen] = useState<boolean>(false);
  const [otpAction, setOtpAction] = useState<TicketAction | null>(null);
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSubmitting, setOtpSubmitting] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<TicketAction | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
  const [rescheduleDraftPayload, setRescheduleDraftPayload] = useState<Record<string, unknown> | null>(null);
  const [selectedRescheduleId, setSelectedRescheduleId] = useState<string | null>(null);
  const [rescheduleOptions, setRescheduleOptions] = useState<RescheduleOption[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState<boolean>(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSeatContext, setRescheduleSeatContext] = useState<SeatContext | null>(null);
  const [rescheduleSeatMap, setRescheduleSeatMap] = useState<SeatMapSeat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [reschedulePrice, setReschedulePrice] = useState<{ total: number; currency: string } | null>(null);
  const [rescheduleAmountDiff, setRescheduleAmountDiff] = useState<number | null>(null);
  const [reschedulePriceLoading, setReschedulePriceLoading] = useState<boolean>(false);
  const [reschedulePriceError, setReschedulePriceError] = useState<string | null>(null);
  const [downloadLabel, setDownloadLabel] = useState<string>("Скачать PDF");

  const passengerCount = ticket?.passengers?.length ?? 0;
  const outboundDetails = useMemo(() => {
    if (!ticket?.outbound) {
      return null;
    }

    const segment = ticket.outbound as (TicketSegment & {
      fromId?: string | number;
      toId?: string | number;
      tripId?: string | number;
      departureStopId?: string | number;
      arrivalStopId?: string | number;
      layoutVariant?: string | null;
    }) | null;

    return segment ?? null;
  }, [ticket]);

  const updateRescheduleDraft = useCallback((patch: Record<string, unknown>) => {
    setRescheduleDraftPayload((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const loadReschedulePricing = useCallback(
    async (option: RescheduleOption) => {
      if (!outboundDetails) {
        setReschedulePrice(null);
        setRescheduleAmountDiff(null);
        setReschedulePriceError("Данные о направлении недоступны");
        return;
      }

      const fromId =
        option.payload["departure_stop_id"] ??
        option.payload["from_id"] ??
        outboundDetails.fromId ??
        outboundDetails.departureStopId ??
        null;
      const toId =
        option.payload["arrival_stop_id"] ??
        option.payload["to_id"] ??
        outboundDetails.toId ??
        outboundDetails.arrivalStopId ??
        null;

      if (!fromId || !toId) {
        setReschedulePrice(null);
        setRescheduleAmountDiff(null);
        setReschedulePriceError("Не удалось определить остановки рейса");
        return;
      }

      const seatsRequired = Math.max(1, passengerCount || 0);

      setReschedulePriceLoading(true);
      setReschedulePriceError(null);

      try {
        const params = new URLSearchParams({
          departure_stop_id: String(fromId),
          arrival_stop_id: String(toId),
          date: option.date,
          seats: String(seatsRequired),
        });

        const response = await fetch(`${API}/tours/search?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Ошибка ${response.status}`);
        }

        const tours = (await response.json()) as Array<{
          id?: number | string;
          price?: number;
          layout_variant?: string | null;
        }>;

        const optionTripId = toNumber(option.payload.trip_id ?? option.tripId);

        const matchedTour =
          tours.find((tour) => {
            const tourId = toNumber(tour.id);
            return (
              (tourId !== null && optionTripId !== null && tourId === optionTripId) ||
              (tour?.id !== undefined && optionTripId !== null && String(tour.id) === String(optionTripId))
            );
          }) ?? null;

        const pricePerSeat =
          typeof matchedTour?.price === "number" && Number.isFinite(matchedTour.price)
            ? matchedTour.price
            : passengerCount > 0
              ? option.price / passengerCount
              : option.price;

        const total = pricePerSeat * seatsRequired;
        const currency = option.currency;

        setReschedulePrice({ total, currency });
        const diff = total - (ticket?.total ?? 0);
        setRescheduleAmountDiff(diff);
        if (matchedTour?.layout_variant) {
          setRescheduleSeatContext((prev) =>
            prev ? { ...prev, layoutVariant: matchedTour.layout_variant ?? prev.layoutVariant } : prev
          );
        }
        updateRescheduleDraft({
          new_total: total,
          currency,
          amount_difference: diff,
        });
      } catch (error) {
        console.error(error);
        setReschedulePrice(null);
        setRescheduleAmountDiff(null);
        setReschedulePriceError("Не удалось рассчитать стоимость нового рейса");
      } finally {
        setReschedulePriceLoading(false);
      }
    },
    [outboundDetails, passengerCount, ticket?.total, updateRescheduleDraft]
  );

  const handleRescheduleSelect = useCallback(
    (option: RescheduleOption) => {
      setSelectedRescheduleId(option.id);

      const basePayload: Record<string, unknown> = {
        ...option.payload,
        option_id: option.payload.option_id ?? option.id,
        trip_id: option.payload.trip_id ?? option.tripId,
        date: option.payload.date ?? option.date,
        departure_time: option.payload.departure_time ?? option.departureTime,
        arrival_time: option.payload.arrival_time ?? option.arrivalTime,
      };

      setRescheduleDraftPayload(basePayload);
      setPendingPayload(null);

      const tourId = toNumber(option.payload.trip_id ?? option.tripId);
      const departureStopId = toNumber(
        option.payload["departure_stop_id"] ??
          option.payload["from_id"] ??
          option.payload["departure_stop"] ??
          outboundDetails?.fromId ??
          outboundDetails?.departureStopId
      );
      const arrivalStopId = toNumber(
        option.payload["arrival_stop_id"] ??
          option.payload["to_id"] ??
          option.payload["arrival_stop"] ??
          outboundDetails?.toId ??
          outboundDetails?.arrivalStopId
      );
      const layoutVariant = option.payload["layout_variant"] ?? outboundDetails?.layoutVariant ?? null;

      if (tourId !== null && departureStopId !== null && arrivalStopId !== null) {
        setRescheduleSeatContext({
          tourId,
          departureStopId,
          arrivalStopId,
          layoutVariant,
        });
      } else {
        setRescheduleSeatContext(null);
      }

      setRescheduleSeatMap([]);
      setSelectedSeats([]);
      setSelectedSeatIds([]);
      setReschedulePrice(null);
      setRescheduleAmountDiff(null);
      setReschedulePriceError(null);
      updateRescheduleDraft({ seat_map: [], seat_ids: [], seat_numbers: [] });

      void loadReschedulePricing(option);
    },
    [loadReschedulePricing, outboundDetails, updateRescheduleDraft]
  );

  const handleSeatMapLoad = useCallback(
    (seats: SeatMapSeat[]) => {
      setRescheduleSeatMap(seats);
      updateRescheduleDraft({
        seat_map: seats.map((seat) => ({
          seat_id: seat.seat_id,
          seat_num: seat.seat_num,
          status: seat.status,
        })),
      });
    },
    [updateRescheduleDraft]
  );

  const handleSeatSelectionDetails = useCallback(
    (selection: SeatSelectionDetail[]) => {
      const seatIds = selection.map((item) => item.seatId);
      const seatNumbers = selection.map((item) => item.seatNumber);
      setSelectedSeatIds(seatIds);
      updateRescheduleDraft({
        seat_ids: seatIds,
        seat_numbers: seatNumbers,
      });
    },
    [updateRescheduleDraft]
  );

  const selectedOption = useMemo(
    () => rescheduleOptions.find((option) => option.id === selectedRescheduleId) ?? null,
    [rescheduleOptions, selectedRescheduleId]
  );

  const requiredSeats = Math.max(passengerCount, 0);
  const seatSelectionAvailable = !selectedRescheduleId || Boolean(rescheduleSeatContext);
  const seatsReady =
    seatSelectionAvailable &&
    (requiredSeats === 0 ||
      (selectedSeats.length === requiredSeats && selectedSeatIds.length === requiredSeats));
  const priceReady = Boolean(reschedulePrice && rescheduleAmountDiff !== null);
  const rescheduleButtonDisabled =
    actionLoading === "reschedule" ||
    rescheduleLoading ||
    reschedulePriceLoading ||
    !selectedRescheduleId ||
    !seatSelectionAvailable ||
    !seatsReady ||
    !priceReady;
  const resolvedCurrency = selectedOption
    ? reschedulePrice?.currency ?? selectedOption.currency
    : reschedulePrice?.currency ?? selectedOption?.currency ?? "RUB";
  const currentTotal = ticket?.total ?? 0;
  const differenceSummary = useMemo(() => {
    if (!reschedulePrice || rescheduleAmountDiff === null) {
      return null;
    }

    if (rescheduleAmountDiff > 0) {
      return {
        text: `Доплата: ${formatCurrency(rescheduleAmountDiff, resolvedCurrency)}`,
        tone: "text-amber-600",
        description: "После подтверждения отправим ссылку на оплату.",
      };
    }

    if (rescheduleAmountDiff < 0) {
      return {
        text: `К возврату: ${formatCurrency(Math.abs(rescheduleAmountDiff), resolvedCurrency)}`,
        tone: "text-emerald-600",
        description: "Возврат будет оформлен автоматически.",
      };
    }

    return {
      text: "Стоимость не изменится",
      tone: "text-slate-600",
      description: "Перенос не требует доплаты или возврата.",
    };
  }, [rescheduleAmountDiff, reschedulePrice, resolvedCurrency]);

  const startOtpFlow = useCallback(
    async (action: TicketAction, payload: Record<string, unknown> | null = null) => {
      setActionLoading(action);
      setBanner(null);

      try {
        const response = await fetchWithInclude(`${API}/public/otp/start`, {
          method: "POST",
          body: JSON.stringify({ action, ticket_id: ticketId }),
        });

        if (!response.ok) {
          throw new Error(`Ошибка ${response.status}`);
        }

        setOtpAction(action);
        setPendingPayload(payload);
        setOtpModalOpen(true);
      } catch (error) {
        console.error(error);
        setBanner({ type: "error", message: "Не удалось отправить код подтверждения" });
      } finally {
        setActionLoading(null);
      }
    },
    [ticketId]
  );

  const handleRescheduleRequest = useCallback(() => {
    if (!selectedRescheduleId || !selectedOption) {
      setBanner({ type: "error", message: "Выберите новый рейс для переноса" });
      return;
    }

    if (!rescheduleSeatContext) {
      setBanner({ type: "error", message: "Схема мест недоступна для выбранного рейса" });
      return;
    }

    if (requiredSeats > 0 && selectedSeats.length !== requiredSeats) {
      setBanner({
        type: "error",
        message:
          requiredSeats === 1
            ? "Выберите место перед переносом"
            : `Выберите ${requiredSeats} мест перед переносом`,
      });
      return;
    }

    if (requiredSeats > 0 && selectedSeatIds.length !== selectedSeats.length) {
      setBanner({ type: "error", message: "Данные о выбранных местах недоступны" });
      return;
    }

    if (!rescheduleDraftPayload) {
      setBanner({ type: "error", message: "Перенос недоступен. Попробуйте обновить страницу" });
      return;
    }

    if (!reschedulePrice || rescheduleAmountDiff === null) {
      setBanner({ type: "error", message: "Не удалось рассчитать стоимость нового рейса" });
      return;
    }

    const payload: Record<string, unknown> = {
      ...rescheduleDraftPayload,
      option_id: selectedOption.payload.option_id ?? selectedOption.id,
      trip_id: selectedOption.payload.trip_id ?? selectedOption.tripId,
      date: selectedOption.payload.date ?? selectedOption.date,
      departure_time: selectedOption.payload.departure_time ?? selectedOption.departureTime,
      arrival_time: selectedOption.payload.arrival_time ?? selectedOption.arrivalTime,
      seat_ids: selectedSeatIds,
      seat_numbers: selectedSeats,
      seat_map: rescheduleSeatMap.map((seat) => ({
        seat_id: seat.seat_id,
        seat_num: seat.seat_num,
        status: seat.status,
      })),
      new_total: reschedulePrice.total,
      currency: reschedulePrice.currency ?? selectedOption.currency,
      amount_difference: rescheduleAmountDiff,
      original_total: ticket?.total ?? 0,
    };

    setBanner(null);
    setPendingPayload(payload);
    void startOtpFlow("reschedule", payload);
  }, [
    rescheduleAmountDiff,
    rescheduleDraftPayload,
    selectedOption,
    reschedulePrice,
    rescheduleSeatMap,
    rescheduleSeatContext,
    selectedRescheduleId,
    selectedSeatIds,
    selectedSeats,
    requiredSeats,
    startOtpFlow,
    ticket?.total,
  ]);

  const fetchTicket = useCallback(async () => {
    setIsLoading(true);
    setBanner(null);
    setIsUnauthorized(false);

    try {
      const response = await fetchWithInclude(`${API}/public/tickets/${ticketId}`);

      if (response.status === 401 || response.status === 403 || response.status === 404) {
        setIsUnauthorized(true);
        setTicket(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Не удалось загрузить билет: ${response.status}`);
      }

      const data: ElectronicTicketData = await response.json();
      setTicket(data);
    } catch (error) {
      console.error(error);
      setBanner({ type: "error", message: "Не удалось загрузить данные билета" });
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    if (!outboundDetails) {
      setRescheduleOptions([]);
      setRescheduleError(null);
      setRescheduleLoading(false);
      setSelectedRescheduleId(null);
      setRescheduleDraftPayload(null);
      setRescheduleSeatContext(null);
      setRescheduleSeatMap([]);
      setSelectedSeats([]);
      setSelectedSeatIds([]);
      setReschedulePrice(null);
      setRescheduleAmountDiff(null);
      setReschedulePriceError(null);
      return;
    }

    const fromId = outboundDetails.fromId ?? outboundDetails.departureStopId ?? null;
    const toId = outboundDetails.toId ?? outboundDetails.arrivalStopId ?? null;

    if (!fromId || !toId) {
      setRescheduleOptions([]);
      setRescheduleError("Данные о направлении недоступны для переноса");
      setRescheduleLoading(false);
      setSelectedRescheduleId(null);
      setRescheduleDraftPayload(null);
      setRescheduleSeatContext(null);
      setRescheduleSeatMap([]);
      setSelectedSeats([]);
      setSelectedSeatIds([]);
      setReschedulePrice(null);
      setRescheduleAmountDiff(null);
      setReschedulePriceError(null);
      return;
    }

    const controller = new AbortController();
    const previousSelectionId = selectedRescheduleId;

    const fetchOptions = async () => {
      setRescheduleLoading(true);
      setRescheduleError(null);

      try {
        const response = await fetchWithInclude(`${API}/public/reschedule/options`, {
          method: "POST",
          body: JSON.stringify({
            ticket_id: ticketId,
            from_id: fromId,
            to_id: toId,
            date: outboundDetails.date,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Ошибка ${response.status}`);
        }

        const data = (await response.json()) as {
          options?: Array<Record<string, unknown>>;
        };

        const normalizedOptions = (Array.isArray(data?.options) ? data.options : []).reduce<RescheduleOption[]>(
          (accumulator, option, index) => {
            if (!option) {
              return accumulator;
            }

            const rawOption = option as Record<string, unknown>;

            const optionId = String(
              rawOption["id"] ??
                rawOption["option_id"] ??
                rawOption["trip_id"] ??
                rawOption["tripId"] ??
                `option-${index}`
            );
            const optionDate = String(
              rawOption["date"] ?? rawOption["departure_date"] ?? outboundDetails.date ?? ""
            );
            const departureTime = String(
              rawOption["departure_time"] ??
                rawOption["departureTime"] ??
                outboundDetails.departure_time ??
                ""
            );
            const arrivalTime = String(
              rawOption["arrival_time"] ??
                rawOption["arrivalTime"] ??
                outboundDetails.arrival_time ??
                ""
            );
            const description = String(
              rawOption["description"] ?? `${outboundDetails.fromName} → ${outboundDetails.toName}`
            );

            const priceRaw = rawOption["price"] ?? 0;
            const priceAmount =
              typeof priceRaw === "number"
                ? priceRaw
                : typeof priceRaw === "object" && priceRaw
                  ? Number((priceRaw as { amount?: number }).amount ?? 0)
                  : Number(priceRaw);
            const currency =
              (typeof priceRaw === "object" && priceRaw
                ? (priceRaw as { currency?: string }).currency
                : (rawOption["currency"] as string | undefined)) ?? "RUB";

            const availability = Number(
              rawOption["availability"] ?? rawOption["available_seats"] ?? rawOption["seats"] ?? 0
            );

            const tripId = String(
              rawOption["trip_id"] ?? rawOption["tripId"] ?? optionId
            );

            const rawPayload =
              (typeof rawOption["payload"] === "object" && rawOption["payload"]
                ? (rawOption["payload"] as RescheduleOptionPayload)
                : undefined) ?? undefined;
            const requestPayload =
              (typeof rawOption["request_payload"] === "object" && rawOption["request_payload"]
                ? (rawOption["request_payload"] as RescheduleOptionPayload)
                : undefined) ?? undefined;

            const payload: RescheduleOptionPayload = {
              ...requestPayload,
              ...rawPayload,
              option_id: rawPayload?.option_id ?? requestPayload?.option_id ?? optionId,
              trip_id: rawPayload?.trip_id ?? requestPayload?.trip_id ?? tripId,
              date: rawPayload?.date ?? requestPayload?.date ?? optionDate,
              departure_time:
                rawPayload?.departure_time ?? requestPayload?.departure_time ?? departureTime,
              arrival_time:
                rawPayload?.arrival_time ?? requestPayload?.arrival_time ?? arrivalTime,
            };

            accumulator.push({
              id: optionId,
              date: optionDate,
              departureTime,
              arrivalTime,
              description,
              price: Number.isFinite(priceAmount) ? priceAmount : 0,
              currency,
              availability: Number.isFinite(availability) ? availability : 0,
              tripId,
              payload,
            });

            return accumulator;
          },
          []
        );

        setRescheduleOptions(normalizedOptions);

        if (normalizedOptions.length) {
          const nextOption =
            normalizedOptions.find((option) => option.id === previousSelectionId) ??
            normalizedOptions[0];
          handleRescheduleSelect(nextOption);
        } else {
          setSelectedRescheduleId(null);
          setRescheduleDraftPayload(null);
          setRescheduleSeatContext(null);
          setRescheduleSeatMap([]);
          setSelectedSeats([]);
          setSelectedSeatIds([]);
          setReschedulePrice(null);
          setRescheduleAmountDiff(null);
          setReschedulePriceError(null);
        }
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }

        console.error(error);
        setRescheduleOptions([]);
        setSelectedRescheduleId(null);
        setRescheduleDraftPayload(null);
        setRescheduleSeatContext(null);
        setRescheduleSeatMap([]);
        setSelectedSeats([]);
        setSelectedSeatIds([]);
        setReschedulePrice(null);
        setRescheduleAmountDiff(null);
        setReschedulePriceError(null);
        setRescheduleError("Не удалось загрузить варианты переноса");
      } finally {
        setRescheduleLoading(false);
      }
    };

    void fetchOptions();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outboundDetails, ticketId, handleRescheduleSelect]);

  const handleResendLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resendEmail) {
      return;
    }

    setResendLoading(true);
    setBanner(null);

    try {
      const response = await fetchWithInclude(`${API}/public/tickets/resend-link`, {
        method: "POST",
        body: JSON.stringify({ email: resendEmail, ticket_id: ticketId }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}`);
      }

      setBanner({ type: "success", message: "Новая ссылка отправлена на указанную почту" });
      setResendEmail("");
    } catch (error) {
      console.error(error);
      setBanner({ type: "error", message: "Не удалось отправить ссылку. Попробуйте позже" });
    } finally {
      setResendLoading(false);
    }
  };

  const closeOtpModal = () => {
    setOtpModalOpen(false);
    setOtpAction(null);
    setOtpCode("");
    setOtpError(null);
    setPendingPayload(null);
  };

  const submitPaymentForm = (payload: PaymentPayload) => {
    if (typeof window === "undefined") {
      return;
    }

    const { url, ...fields } = payload;

    if (!url || typeof url !== "string") {
      setBanner({ type: "error", message: "Платёжные данные повреждены" });
      return;
    }

    const paymentWindow = window.open("", "_blank");

    if (!paymentWindow) {
      setBanner({
        type: "error",
        message: "Браузер заблокировал открытие окна оплаты. Разрешите всплывающие окна и попробуйте снова",
      });
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.target = paymentWindow.name;

    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    setBanner({ type: "info", message: "Переход на страницу оплаты" });
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!otpAction || !otpCode) {
      setOtpError("Введите код из SMS");
      return;
    }

    setOtpSubmitting(true);
    setOtpError(null);

    try {
      const response = await fetchWithInclude(`${API}/public/otp/verify`, {
        method: "POST",
        body: JSON.stringify({
          action: otpAction,
          ticket_id: ticketId,
          code: otpCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}`);
      }

      let verifyData: VerifyResponse | null = null;

      try {
        verifyData = (await response.json()) as VerifyResponse;
      } catch {
        verifyData = null;
      }

      if (otpAction === "pay") {
        const paymentData = (verifyData?.payment ?? verifyData) as PaymentPayload | undefined;
        if (paymentData) {
          submitPaymentForm(paymentData);
        }
        closeOtpModal();
        setBanner({ type: "success", message: "Платёж инициирован" });
        void fetchTicket();
        return;
      }

      if (otpAction === "reschedule") {
        await submitReschedule(verifyData ?? undefined);
        return;
      }

      if (otpAction === "cancel") {
        await submitCancellation(verifyData ?? undefined);
        return;
      }
    } catch (error) {
      console.error(error);
      setOtpError("Не удалось подтвердить код. Попробуйте ещё раз");
    } finally {
      setOtpSubmitting(false);
    }
  };

  const submitReschedule = async (verifyData?: VerifyResponse) => {
    if (!pendingPayload) {
      setOtpError("Выберите рейс для переноса");
      return;
    }

    setActionLoading("reschedule");

    try {
      const response = await fetchWithInclude(`${API}/public/reschedule`, {
        method: "POST",
        body: JSON.stringify({
          ...pendingPayload,
          ticket_id: ticketId,
          ...(verifyData?.otp_token ? { otp_token: verifyData.otp_token } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}`);
      }

      let payload: Record<string, unknown> | null = null;
      try {
        payload = (await response.json()) as Record<string, unknown>;
      } catch {
        payload = null;
      }

      const rawDifference = pendingPayload?.amount_difference;
      const amountDifference =
        typeof rawDifference === "number"
          ? rawDifference
          : Number(rawDifference ?? 0);
      const payloadCurrency =
        typeof pendingPayload?.currency === "string"
          ? (pendingPayload.currency as string)
          : resolvedCurrency;

      let successMessage = "Рейс перенесён. Скачайте обновлённый билет.";

      if (Number.isFinite(amountDifference) && payloadCurrency) {
        if (amountDifference > 0) {
          successMessage = `Рейс перенесён. Доплата ${formatCurrency(amountDifference, payloadCurrency)} будет доступна после подтверждения.`;
        } else if (amountDifference < 0) {
          successMessage = `Рейс перенесён. К возврату ${formatCurrency(Math.abs(amountDifference), payloadCurrency)}.`;
        } else {
          successMessage = "Рейс перенесён. Стоимость не изменилась, скачайте обновлённый билет.";
        }
      }

      closeOtpModal();
      setBanner({ type: "success", message: successMessage });
      setSelectedRescheduleId(null);
      setRescheduleDraftPayload(null);
      setRescheduleSeatContext(null);
      setRescheduleSeatMap([]);
      setSelectedSeats([]);
      setSelectedSeatIds([]);
      setReschedulePrice(null);
      setRescheduleAmountDiff(null);
      setReschedulePriceError(null);
      setDownloadLabel("Скачать обновлённый PDF");
      await fetchTicket();

      const paymentData = (payload?.payment ?? payload?.paymentPayload) as PaymentPayload | null;
      if (paymentData) {
        submitPaymentForm(paymentData);
      }
    } catch (error) {
      console.error(error);
      setOtpError("Не удалось перенести рейс. Попробуйте позже");
    } finally {
      setActionLoading(null);
    }
  };

  const submitCancellation = async (verifyData?: VerifyResponse) => {
    setActionLoading("cancel");

    try {
      const response = await fetchWithInclude(`${API}/public/cancel`, {
        method: "POST",
        body: JSON.stringify({
          ticket_id: ticketId,
          ...(verifyData?.otp_token ? { otp_token: verifyData.otp_token } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}`);
      }

      let payload: Record<string, unknown> | null = null;
      try {
        payload = (await response.json()) as Record<string, unknown>;
      } catch {
        payload = null;
      }

      closeOtpModal();
      setBanner({
        type: "success",
        message: payload?.refundAmount
          ? `Поездка отменена. К возврату: ${payload.refundAmount}`
          : "Поездка отменена",
      });
      await fetchTicket();
    } catch (error) {
      console.error(error);
      setOtpError("Не удалось отменить поездку. Попробуйте позже");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualReschedule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const date = String(formData.get("date") ?? "");
    const departure = String(formData.get("departure") ?? "");
    const arrival = String(formData.get("arrival") ?? "");

    if (!date || !departure) {
      setBanner({ type: "error", message: "Выберите дату и время" });
      return;
    }

    setSelectedRescheduleId(null);
    setRescheduleDraftPayload(null);
    setRescheduleSeatContext(null);
    setRescheduleSeatMap([]);
    setSelectedSeats([]);
    setSelectedSeatIds([]);
    setReschedulePrice(null);
    setRescheduleAmountDiff(null);
    setReschedulePriceError(null);

    const manualPayload = {
      date,
      departure_time: departure,
      arrival_time: arrival || undefined,
    };

    setPendingPayload(manualPayload);

    void startOtpFlow("reschedule", manualPayload);
  };

  const renderSegment = (
    segment: TicketSegment | null | undefined,
    title: string
  ) => {
    if (!segment) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <p className="mt-2">Данные о рейсе недоступны</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{formatDate(segment.date)}</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-400">Откуда</p>
            <p className="text-base font-medium text-slate-800">{segment.fromName}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Куда</p>
            <p className="text-base font-medium text-slate-800">{segment.toName}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Отправление</p>
            <p className="text-base font-medium text-slate-800">
              {formatTime(segment.departure_time)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Прибытие</p>
            <p className="text-base font-medium text-slate-800">
              {formatTime(segment.arrival_time)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs uppercase text-slate-400">Места</p>
          <p className="text-base font-medium text-slate-800">
            {segment.seatNumbers?.length
              ? segment.seatNumbers.join(", ")
              : "Будет назначено позже"}
          </p>
        </div>
        {segment.extraBaggage?.length ? (
          <div className="mt-2 text-sm text-slate-500">
            Доп. багаж: {segment.extraBaggage.filter(Boolean).length} мест
          </div>
        ) : null}
      </div>
    );
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 to-sky-200 p-4">
        <div className="rounded-2xl bg-white/90 px-6 py-4 text-slate-600 shadow-lg">
          Загрузка билета…
        </div>
      </main>
    );
  }

  if (isUnauthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-200 to-slate-300 p-4">
        <div className="w-full max-w-md space-y-6 rounded-3xl bg-white/95 p-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Ссылка устарела</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ссылка на билет больше недействительна. Укажите e-mail, чтобы отправить новую ссылку.
            </p>
          </div>

          {banner ? (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                banner.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : banner.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-sky-200 bg-sky-50 text-sky-700"
              }`}
            >
              {banner.message}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleResendLink}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">E-mail</span>
              <input
                type="email"
                name="email"
                required
                value={resendEmail}
                onChange={(event) => setResendEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring"
              />
            </label>
            <button
              type="submit"
              disabled={resendLoading}
              className="w-full rounded-xl bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {resendLoading ? "Отправка…" : "Отправить новую ссылку"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-200 to-slate-300 p-4">
        <div className="rounded-3xl bg-white/95 px-6 py-4 text-slate-600 shadow-xl">
          Данные билета недоступны
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-slate-100 p-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-white/70 md:flex-row">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-400">Билет #{ticket.purchaseId}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Миникабинет билета</h1>
            <p className="mt-2 text-sm text-slate-500">
              {passengerCount} пассажир(ов) • Статус: {STATUS_LABELS[ticket.status]}
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <button
              type="button"
              onClick={() => void downloadTicketPdf(ticket.purchaseId, "ru")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
            >
              {downloadLabel}
            </button>
            <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
              Создан: {formatDate(ticket.createdAt)}
            </div>
          </div>
        </header>

        {banner ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow ${
              banner.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : banner.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-sky-200 bg-sky-50 text-sky-700"
            }`}
          >
            {banner.message}
          </div>
        ) : null}

        <section className="grid gap-5 md:grid-cols-2">
          {renderSegment(ticket.outbound, "Рейс туда")}
          {renderSegment(ticket.inbound, "Рейс обратно")}
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-white/70">
          <h2 className="text-xl font-semibold text-slate-800">Пассажиры</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(ticket.passengers ?? []).map((passenger, index) => (
              <div key={`${passenger.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="text-base font-semibold text-slate-800">{passenger.name}</p>
                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  <p>Место туда: {passenger.seatOutbound ?? "—"}</p>
                  {ticket.inbound ? <p>Место обратно: {passenger.seatReturn ?? "—"}</p> : null}
                  <p>Доп. багаж туда: {passenger.extraBaggageOutbound ? "Да" : "Нет"}</p>
                  {ticket.inbound ? (
                    <p>Доп. багаж обратно: {passenger.extraBaggageReturn ? "Да" : "Нет"}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-white/70">
          <h2 className="text-xl font-semibold text-slate-800">Действия с билетом</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => void startOtpFlow("pay")}
              disabled={actionLoading === "pay" || ticket.status === "paid"}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow transition ${
                ticket.status === "paid"
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
            >
              {actionLoading === "pay" ? "Запрос кода…" : "Оплатить"}
            </button>
            <button
              type="button"
              onClick={handleRescheduleRequest}
              disabled={rescheduleButtonDisabled}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow transition ${
                rescheduleButtonDisabled
                  ? "bg-slate-300 text-slate-500"
                  : "bg-sky-500 text-white hover:bg-sky-600"
              }`}
            >
              {actionLoading === "reschedule"
                ? "Запрос кода…"
                : rescheduleLoading
                  ? "Загружаем варианты…"
                  : reschedulePriceLoading
                    ? "Рассчитываем стоимость…"
                    : "Перенести рейс"}
            </button>
            <button
              type="button"
              onClick={() => void startOtpFlow("cancel")}
              disabled={actionLoading === "cancel" || ticket.status === "canceled"}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow transition ${
                ticket.status === "canceled"
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {actionLoading === "cancel" ? "Запрос кода…" : "Отменить поездку"}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Выбор нового рейса</h3>
              <p className="mt-1 text-sm text-slate-500">
                Выберите подходящий вариант из списка или задайте дату вручную, затем запросите код.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {rescheduleLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow">
                  Загружаем доступные рейсы…
                </div>
              ) : rescheduleError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow">
                  {rescheduleError}
                </div>
              ) : rescheduleOptions.length ? (
                rescheduleOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleRescheduleSelect(option)}
                    className={`flex w-full flex-col rounded-2xl border p-4 text-left shadow transition ${
                      selectedRescheduleId === option.id
                        ? "border-sky-400 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-sky-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-slate-800">
                      {formatDate(option.date)} • {formatTime(option.departureTime)}
                    </span>
                    <span className="text-sm text-slate-500">{option.description}</span>
                    <span className="mt-2 text-xs font-medium text-slate-500">
                      Стоимость: {formatCurrency(option.price, option.currency)}
                    </span>
                    <span
                      className={`mt-1 text-xs font-medium ${
                        option.availability > 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {option.availability > 0
                        ? `Доступно мест: ${option.availability}`
                        : "Нет свободных мест"}
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow">
                  Подходящих вариантов пока нет. Попробуйте изменить параметры вручную.
                </div>
              )}
            </div>

            {selectedOption ? (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-slate-700">Выбор мест</h4>
                  <p className="text-xs text-slate-500">
                    {requiredSeats === 1
                      ? "Выберите место для нового рейса"
                      : `Выберите ${requiredSeats} мест для нового рейса`}
                  </p>
                </div>
                {rescheduleSeatContext ? (
                  <SeatClient
                    tourId={rescheduleSeatContext.tourId}
                    departureStopId={rescheduleSeatContext.departureStopId}
                    arrivalStopId={rescheduleSeatContext.arrivalStopId}
                    layoutVariant={rescheduleSeatContext.layoutVariant}
                    selectedSeats={selectedSeats}
                    maxSeats={Math.max(requiredSeats, 1)}
                    onChange={setSelectedSeats}
                    onSeatMapLoad={handleSeatMapLoad}
                    onSelectionDetailsChange={handleSeatSelectionDetails}
                    departureText={`${ticket?.outbound?.fromName ?? ""} · ${formatTime(selectedOption.departureTime)}`}
                    arrivalText={`${ticket?.outbound?.toName ?? ""} · ${formatTime(selectedOption.arrivalTime)}`}
                    extraBaggage={false}
                  />
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Схема мест недоступна для выбранного варианта. Попробуйте выбрать другой рейс.
                  </div>
                )}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  {reschedulePriceLoading ? (
                    "Рассчитываем стоимость…"
                  ) : reschedulePriceError ? (
                    reschedulePriceError
                  ) : reschedulePrice ? (
                    <div className="space-y-1">
                      <div>Текущий билет: {formatCurrency(currentTotal, resolvedCurrency)}</div>
                      <div>Новый рейс: {formatCurrency(reschedulePrice.total, resolvedCurrency)}</div>
                      {differenceSummary ? (
                        <div className={`font-semibold ${differenceSummary.tone}`}>
                          {differenceSummary.text}
                          <div className="text-xs font-normal text-slate-500">{differenceSummary.description}</div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    "Выберите рейс, чтобы увидеть стоимость"
                  )}
                </div>
              </div>
            ) : null}

            <form onSubmit={handleManualReschedule} className="rounded-2xl border border-dashed border-slate-300 p-4">
              <h4 className="text-sm font-semibold text-slate-700">Другой рейс</h4>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="flex flex-col text-sm text-slate-600">
                  Дата
                  <input
                    type="date"
                    name="date"
                    className="mt-1 rounded-xl border border-slate-200 px-3 py-2 shadow-inner focus:border-sky-400 focus:outline-none focus:ring"
                  />
                </label>
                <label className="flex flex-col text-sm text-slate-600">
                  Время отправления
                  <input
                    type="time"
                    name="departure"
                    className="mt-1 rounded-xl border border-slate-200 px-3 py-2 shadow-inner focus:border-sky-400 focus:outline-none focus:ring"
                  />
                </label>
                <label className="flex flex-col text-sm text-slate-600">
                  Время прибытия
                  <input
                    type="time"
                    name="arrival"
                    className="mt-1 rounded-xl border border-slate-200 px-3 py-2 shadow-inner focus:border-sky-400 focus:outline-none focus:ring"
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                >
                  Запросить перенос
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {otpModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-800">Введите код подтверждения</h2>
            <p className="mt-1 text-sm text-slate-500">
              Код отправлен на e-mail/телефон, привязанный к билету. Введите его ниже, чтобы продолжить.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleVerifyOtp}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, ""))}
                maxLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold tracking-widest shadow-inner focus:border-sky-400 focus:outline-none focus:ring"
              />
              {otpError ? <p className="text-sm text-red-600">{otpError}</p> : null}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={otpSubmitting}
                  className="flex-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {otpSubmitting ? "Проверяем…" : "Подтвердить"}
                </button>
                <button
                  type="button"
                  onClick={closeOtpModal}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow hover:bg-slate-100"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
