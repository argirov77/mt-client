"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API } from "@/config";
import type { ElectronicTicketData, TicketSegment } from "@/types/ticket";
import { downloadTicketPdf } from "@/utils/ticketPdf";

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

type RescheduleOption = {
  id: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  description: string;
  priceDifference?: number;
};

interface TicketClientProps {
  ticketId: string;
}

const fetchWithInclude = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

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

const buildRescheduleOptions = (segment?: TicketSegment | null): RescheduleOption[] => {
  if (!segment) {
    return [];
  }

  const baseDate = new Date(segment.date);

  return Array.from({ length: 5 }, (_, index) => {
    const optionDate = new Date(baseDate);
    optionDate.setDate(baseDate.getDate() + index + 1);

    return {
      id: `reschedule-${index + 1}`,
      date: optionDate.toISOString().slice(0, 10),
      departureTime: segment.departure_time,
      arrivalTime: segment.arrival_time,
      description: `${segment.fromName} → ${segment.toName}`,
      priceDifference: index === 0 ? 0 : (index + 1) * 10,
    } satisfies RescheduleOption;
  });
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
  const [selectedRescheduleId, setSelectedRescheduleId] = useState<string | null>(null);

  const rescheduleOptions = useMemo(
    () => buildRescheduleOptions(ticket?.outbound ?? null),
    [ticket]
  );

  const fetchTicket = useCallback(async () => {
    setIsLoading(true);
    setBanner(null);
    setIsUnauthorized(false);

    try {
      const response = await fetch(`${API}/public/tickets/${ticketId}`, {
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
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

  const startOtpFlow = async (
    action: TicketAction,
    payload: Record<string, unknown> | null = null
  ) => {
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

      closeOtpModal();
      setBanner({ type: "success", message: "Перенос успешно оформлен" });
      setSelectedRescheduleId(null);
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

  const handleRescheduleSelect = (option: RescheduleOption) => {
    setSelectedRescheduleId(option.id);
    setPendingPayload({
      option_id: option.id,
      date: option.date,
      departure_time: option.departureTime,
      arrival_time: option.arrivalTime,
    });
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
    setPendingPayload({
      date,
      departure_time: departure,
      arrival_time: arrival || undefined,
    });

    void startOtpFlow("reschedule", {
      date,
      departure_time: departure,
      arrival_time: arrival || undefined,
    });
  };

  const renderSegment = (segment: TicketSegment, title: string) => (
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
          {segment.seatNumbers?.length ? segment.seatNumbers.join(", ") : "Будет назначено позже"}
        </p>
      </div>
      {segment.extraBaggage?.length ? (
        <div className="mt-2 text-sm text-slate-500">
          Доп. багаж: {segment.extraBaggage.filter(Boolean).length} мест
        </div>
      ) : null}
    </div>
  );

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
              {ticket.passengers.length} пассажир(ов) • Статус: {STATUS_LABELS[ticket.status]}
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <button
              type="button"
              onClick={() => void downloadTicketPdf(ticket.purchaseId, "ru")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
            >
              Скачать PDF
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
          {ticket.inbound ? renderSegment(ticket.inbound, "Рейс обратно") : null}
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-white/70">
          <h2 className="text-xl font-semibold text-slate-800">Пассажиры</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {ticket.passengers.map((passenger, index) => (
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
              onClick={() => {
                if (pendingPayload) {
                  void startOtpFlow("reschedule", pendingPayload);
                } else if (rescheduleOptions.length) {
                  handleRescheduleSelect(rescheduleOptions[0]);
                  void startOtpFlow("reschedule", {
                    option_id: rescheduleOptions[0].id,
                    date: rescheduleOptions[0].date,
                    departure_time: rescheduleOptions[0].departureTime,
                    arrival_time: rescheduleOptions[0].arrivalTime,
                  });
                } else {
                  setBanner({ type: "error", message: "Выберите новый рейс для переноса" });
                }
              }}
              disabled={actionLoading === "reschedule"}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow transition ${
                actionLoading === "reschedule" ? "bg-slate-300 text-slate-500" : "bg-sky-500 text-white hover:bg-sky-600"
              }`}
            >
              {actionLoading === "reschedule" ? "Запрос кода…" : "Перенести рейс"}
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
              {rescheduleOptions.map((option) => (
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
                  {option.priceDifference ? (
                    <span className="mt-2 text-xs text-slate-400">
                      Доплата: {option.priceDifference.toFixed(2)}
                    </span>
                  ) : (
                    <span className="mt-2 text-xs text-emerald-500">Без доплаты</span>
                  )}
                </button>
              ))}
            </div>

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
