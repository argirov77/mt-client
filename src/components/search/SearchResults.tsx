"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Loader from "../common/Loader";
import Alert from "../common/Alert";
import { API } from "@/config";

import TripList from "./TripList";
import ElectronicTicket from "./ElectronicTicket";
import TicketDownloadPrompt from "./TicketDownloadPrompt";
import OrderSummary from "./OrderSummary";
import StepProgress from "./StepProgress";
import { dict } from "./searchDictionary";
import type { Lang, Step, Tour } from "./types";
import StepTwo from "./steps/StepTwo";
import StepThree from "./steps/StepThree";

import { downloadTicketPdf } from "@/utils/ticketPdf";
import type { ElectronicTicketData } from "@/types/ticket";

// ======== Типы ========
type Props = {
  lang?: Lang;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  date: string;
  returnDate?: string;
  seatCount: number;
  discountCount: number;
};

const DISCOUNT_RATE = 0.05;

export default function SearchResults({
  lang = "ru",
  from,
  to,
  fromName,
  toName,
  date,
  returnDate,
  seatCount,
  discountCount,
}: Props) {
  const t = dict[lang ?? "ru"];

  // Limit seat count to a reasonable range to avoid huge allocations
  const MAX_SEAT_COUNT = 50;
  const safeSeatCount = Math.max(1, Math.min(seatCount, MAX_SEAT_COUNT));
  const safeDiscountCount = Math.max(
    0,
    Math.min(discountCount, safeSeatCount)
  );

  const fromId = useMemo(() => Number(from), [from]);
  const toId = useMemo(() => Number(to), [to]);

  // stepper
  const [activeStep, setActiveStep] = useState<Step>(1);

  // Общие сообщения/состояние
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [msgType, setMsgType] = useState<"info" | "error" | "success">("info");

  // Результаты поиска
  const [outboundTours, setOutboundTours] = useState<Tour[]>([]);
  const [returnTours, setReturnTours] = useState<Tour[]>([]);

  const [ticket, setTicket] = useState<ElectronicTicketData | null>(null);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);

  // Выбор рейсов
  const [selectedOutboundTour, setSelectedOutboundTour] = useState<Tour | null>(
    null
  );
  const [selectedReturnTour, setSelectedReturnTour] = useState<Tour | null>(
    null
  );

  // Выбор мест
  const [selectedOutboundSeats, setSelectedOutboundSeats] = useState<number[]>(
    []
  );
  const [selectedReturnSeats, setSelectedReturnSeats] = useState<number[]>([]);

  // Пассажиры/контакты/багаж
  const [passengerNames, setPassengerNames] = useState<string[]>(
    Array(safeSeatCount).fill("")
  );
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [extraBaggageOutbound, setExtraBaggageOutbound] = useState<boolean[]>(
    Array(safeSeatCount).fill(false)
  );
  const [extraBaggageReturn, setExtraBaggageReturn] = useState<boolean[]>(
    Array(safeSeatCount).fill(false)
  );

  // Покупка/бронь
  const [purchaseId, setPurchaseId] = useState<number | null>(null);

  // При смене seatCount — сброс завязанных стейтов
  useEffect(() => {
    setPassengerNames(Array(safeSeatCount).fill(""));
    setExtraBaggageOutbound(Array(safeSeatCount).fill(false));
    setExtraBaggageReturn(Array(safeSeatCount).fill(false));
    setSelectedOutboundSeats([]);
    setSelectedReturnSeats([]);
  }, [seatCount, safeSeatCount]);

  // Поиск рейсов
  useEffect(() => {
    let cancelled = false;

    const freeSeats = (value: Tour["seats"]) =>
      typeof value === "number" ? value : value?.free ?? 0;

    const filterBySeats = (tours: Tour[]) =>
      tours.filter((tour) => freeSeats(tour.seats) >= safeSeatCount);

    const search = async () => {
      if (!fromId || !toId || !date) {
        setOutboundTours([]);
        setReturnTours([]);
        setSelectedOutboundTour(null);
        setSelectedReturnTour(null);
        return;
      }

      setLoading(true);
      setMsg("");
      setMsgType("info");
      setActiveStep(1);
      setTicket(null);
      setShowDownloadPrompt(false);
      setPurchaseId(null);

      try {
        const outReq = axios.get<Tour[]>(`${API}/tours/search`, {
          params: {
            departure_stop_id: fromId,
            arrival_stop_id: toId,
            date,
            seats: safeSeatCount,
          },
        });

        const retReq = returnDate
          ? axios.get<Tour[]>(`${API}/tours/search`, {
              params: {
                departure_stop_id: toId,
                arrival_stop_id: fromId,
                date: returnDate,
                seats: safeSeatCount,
              },
            })
          : Promise.resolve({ data: [] as Tour[] });

        const [outRes, retRes] = await Promise.all([outReq, retReq]);

        if (cancelled) return;

        const filteredOutbound = filterBySeats(outRes.data || []);
        const filteredReturn = filterBySeats(retRes.data || []);

        setOutboundTours(filteredOutbound);
        setReturnTours(filteredReturn);
        setSelectedOutboundTour(null);
        setSelectedReturnTour(null);
        setSelectedOutboundSeats([]);
        setSelectedReturnSeats([]);

        const bothEmpty =
          !(filteredOutbound && filteredOutbound.length) &&
          (!(filteredReturn && filteredReturn.length) || !returnDate);

        if (bothEmpty) {
          setMsg(t.noResults);
          setMsgType("info");
        } else {
          setMsg("");
        }

        setActiveStep(1);
      } catch {
        if (!cancelled) {
          setMsg(t.errSearch);
          setMsgType("error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    search();
    return () => {
      cancelled = true;
    };
  }, [fromId, toId, date, returnDate, safeSeatCount, t]);

  const hasReturnSection = Boolean(returnDate && returnTours.length > 0);

  // Выбор рейсов
  const onSelectOutbound = (tour: Tour) => {
    setSelectedOutboundTour(tour);
    setSelectedOutboundSeats([]);
    setSelectedReturnSeats([]);
    setMsg("");
  };

  const onSelectReturn = (tour: Tour) => {
    setSelectedReturnTour(tour);
    setSelectedOutboundSeats([]);
    setSelectedReturnSeats([]);
    setMsg("");
  };

  // когда выбран(ы) рейс(ы) — автоматически переходим к шагу 2
  useEffect(() => {
    if (!selectedOutboundTour) return;
    if (hasReturnSection && !selectedReturnTour) return;
    // все нужные рейсы выбраны → шаг 2
    setActiveStep((prev) => (prev < 2 ? 2 : prev));
  }, [selectedOutboundTour, selectedReturnTour, hasReturnSection]);

  // ====== ACTIONS: бронь / покупка ======
  const handleAction = async (action: "book" | "purchase") => {
    try {
      if (!selectedOutboundTour || (returnDate && !selectedReturnTour)) {
        setMsg("Сначала выберите рейсы");
        setMsgType("error");
        return;
      }
      if (
        selectedOutboundSeats.length !== safeSeatCount ||
        (selectedReturnTour && selectedReturnSeats.length !== safeSeatCount)
      ) {
        setMsg("Выберите нужное количество мест");
        setMsgType("error");
        return;
      }
      if (passengerNames.some((n) => !n)) {
        setMsg("Заполните имена пассажиров");
        setMsgType("error");
        return;
      }
      if (!phone || !email) {
        setMsg("Заполните контактные данные");
        setMsgType("error");
        return;
      }

      setLoading(true);
      setMsg(action === "purchase" ? "Покупка…" : "Бронирование…");
      setMsgType("info");

      const endpoint = action === "purchase" ? "purchase" : "book";
      const basePayload = {
        passenger_names: passengerNames,
        passenger_phone: phone,
        passenger_email: email,
        adult_count: safeSeatCount - safeDiscountCount,
        discount_count: safeDiscountCount,
        ...(lang ? { lang } : {}),
      };

      const coerceTicketNumber = (value: unknown): string | null => {
        if (value == null) {
          return null;
        }
        if (Array.isArray(value)) {
          for (const item of value) {
            const normalized = coerceTicketNumber(item);
            if (normalized) return normalized;
          }
          return null;
        }
        if (typeof value === "object") {
          const obj = value as Record<string, unknown>;
          return (
            coerceTicketNumber(obj["ticket_number"]) ??
            coerceTicketNumber(obj["ticketNumber"]) ??
            coerceTicketNumber(obj["ticket_id"]) ??
            coerceTicketNumber(obj["ticketId"]) ??
            coerceTicketNumber(obj["number"]) ??
            coerceTicketNumber(obj["id"])
          );
        }
        if (typeof value === "string" || typeof value === "number") {
          const normalized = String(value).trim();
          return normalized || null;
        }
        return null;
      };

      const extractTicketNumber = (payload: unknown): string | null => {
        if (!payload || typeof payload !== "object") {
          return null;
        }
        const data = payload as Record<string, unknown>;
        return (
          coerceTicketNumber(data["ticket_number"]) ??
          coerceTicketNumber(data["ticketNumber"]) ??
          coerceTicketNumber(data["ticket_id"]) ??
          coerceTicketNumber(data["ticketId"]) ??
          coerceTicketNumber(data["ticket_numbers"]) ??
          coerceTicketNumber(data["ticketNumbers"]) ??
          coerceTicketNumber(data["ticket_ids"]) ??
          coerceTicketNumber(data["ticketIds"]) ??
          coerceTicketNumber(data["tickets"])
        );
      };

      // туда
      const outRes = await axios.post(`${API}/${endpoint}`, {
        ...basePayload,
        seat_nums: selectedOutboundSeats,
        extra_baggage: extraBaggageOutbound.slice(0, safeSeatCount),
        tour_id: selectedOutboundTour.id,
        departure_stop_id: fromId,
        arrival_stop_id: toId,
      });

      let total = outRes.data.amount_due;
      let pId = outRes.data.purchase_id as number;
      let ticketNumberValue = extractTicketNumber(outRes.data);

      // обратно
      if (selectedReturnTour) {
        const retRes = await axios.post(`${API}/${endpoint}`, {
          ...basePayload,
          seat_nums: selectedReturnSeats,
          extra_baggage: extraBaggageReturn.slice(0, safeSeatCount),
          tour_id: selectedReturnTour.id,
          departure_stop_id: toId,
          arrival_stop_id: fromId,
          purchase_id: pId,
        });
        total = retRes.data.amount_due;
        pId = retRes.data.purchase_id;
        ticketNumberValue =
          extractTicketNumber(retRes.data) ?? ticketNumberValue;
      }

      setPurchaseId(pId);
      const resolvedTicketNumber = ticketNumberValue ?? String(pId);
      const ticketData: ElectronicTicketData = {
        ticketNumber: resolvedTicketNumber,
        purchaseId: pId,
        action,
        total: Number(total),
        createdAt: new Date().toISOString(),
        status: action === "purchase" ? "paid" : "pending",
        contact: {
          phone,
          email,
        },
        outbound: {
          fromName,
          toName,
          date: selectedOutboundTour.date,
          departure_time: selectedOutboundTour.departure_time,
          arrival_time: selectedOutboundTour.arrival_time,
          seatNumbers: [...selectedOutboundSeats],
          extraBaggage: [...extraBaggageOutbound],
        },
        inbound: selectedReturnTour
          ? {
              fromName: toName,
              toName: fromName,
              date: selectedReturnTour.date,
              departure_time: selectedReturnTour.departure_time,
              arrival_time: selectedReturnTour.arrival_time,
              seatNumbers: [...selectedReturnSeats],
              extraBaggage: [...extraBaggageReturn],
            }
          : null,
        passengers: passengerNames.map((name, idx) => ({
          name,
          seatOutbound: selectedOutboundSeats[idx] ?? null,
          seatReturn: selectedReturnTour
            ? selectedReturnSeats[idx] ?? null
            : null,
          extraBaggageOutbound: extraBaggageOutbound[idx] ?? false,
          extraBaggageReturn: selectedReturnTour
            ? extraBaggageReturn[idx] ?? false
            : false,
        })),
      };
      setTicket(ticketData);
      setShowDownloadPrompt(true);
      setMsg(
        action === "purchase"
          ? `Билеты куплены! Purchase ID: ${pId}. Сумма: ${Number(
              total
            ).toFixed(2)}`
          : `Билеты забронированы! Purchase ID: ${pId}. Сумма: ${Number(
              total
            ).toFixed(2)}`
      );
      setMsgType("success");

      // сброс выбора мест и пассажиров
      setSelectedOutboundSeats([]);
      setSelectedReturnSeats([]);
      setPassengerNames(Array(safeSeatCount).fill(""));
      setPhone("");
      setEmail("");
      setExtraBaggageOutbound(Array(safeSeatCount).fill(false));
      setExtraBaggageReturn(Array(safeSeatCount).fill(false));

      // после успешного действия — активируем шаг 3
      setActiveStep(3);
    } catch {
      setMsg(t.errAction);
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!purchaseId) {
      setMsg("Нет бронирования для оплаты");
      setMsgType("error");
      return;
    }
    try {
      setLoading(true);
      setMsg("Оплата…");
      setMsgType("info");
      await axios.post(`${API}/pay`, { purchase_id: purchaseId });
      setMsg(t.paid);
      setMsgType("success");
      setPurchaseId(null);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: "paid",
            }
          : prev
      );
      setShowDownloadPrompt(true);
      setActiveStep(3);
    } catch {
      setMsg(t.errAction);
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCancel = async () => {
    if (!purchaseId) {
      setMsg("Нет бронирования для отмены");
      setMsgType("error");
      return;
    }
    try {
      setLoading(true);
      setMsg("Отмена…");
      setMsgType("info");
      await axios.post(`${API}/cancel/${purchaseId}`);
      setMsg(t.canceled);
      setMsgType("success");
      setPurchaseId(null);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: "canceled",
            }
          : prev
      );
      setShowDownloadPrompt(false);
      setActiveStep(3);
    } catch {
      setMsg(t.errAction);
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketDownload = async (ticketNumberOverride?: string) => {
    const targetTicketNumber =
      ticketNumberOverride ??
      ticket?.ticketNumber ??
      (ticket?.purchaseId != null ? String(ticket.purchaseId) : null);
    const targetPurchaseId = ticket?.purchaseId ?? purchaseId ?? null;
    const targetEmail = (ticket?.contact.email ?? email ?? "").trim();

    if (targetTicketNumber == null || targetPurchaseId == null || !targetEmail) {
      setMsg("Не хватает данных для скачивания билета");
      setMsgType("error");
      return;
    }

    try {
      await downloadTicketPdf({
        ticketId: targetTicketNumber,
        purchaseId: targetPurchaseId,
        email: targetEmail,
      });
      setShowDownloadPrompt(false);
    } catch (error) {
      console.error(error);
      setMsg(t.errAction);
      setMsgType("error");
    }
  };

  const handleTicketDownloadClick = (ticketNumberOverride?: string) => {
    void handleTicketDownload(ticketNumberOverride);
  };

  const handlePromptClose = () => {
    setShowDownloadPrompt(false);
  };

  // ====== РЕЗЮМЕ ДЛЯ ХЕДЕРОВ ШАГОВ ======

  const returnRequired = Boolean(returnDate && hasReturnSection);
  const seatsDone =
    selectedOutboundSeats.length === safeSeatCount &&
    (!returnRequired || selectedReturnSeats.length === safeSeatCount);
  const namesDone = passengerNames.filter((n) => !!n).length === safeSeatCount;
  const step2Complete =
    !!selectedOutboundTour && (!returnRequired || !!selectedReturnTour) && seatsDone && namesDone;

  const isStep1Done = Boolean(
    selectedOutboundTour && (!returnRequired || !!selectedReturnTour)
  );
  const isStep2Done = step2Complete;
  const isStep3Done = Boolean(ticket || purchaseId);

  const step1Summary = useMemo(() => {
    if (!selectedOutboundTour) {
      return t.step1SummaryChoose;
    }
    if (selectedReturnTour) {
      return `${t.outboundShort} ${selectedOutboundTour.departure_time} · ${t.inboundShort} ${selectedReturnTour.departure_time}`;
    }
    return `${t.outboundShort} ${selectedOutboundTour.departure_time}`;
  }, [selectedOutboundTour, selectedReturnTour, t]);

  const step2Summary = useMemo(() => {
    if (!selectedOutboundTour) return t.step1SummaryChoose;
    if (!seatsDone) return t.step2SummaryChooseSeats;
    return t.step2SummaryReady;
  }, [seatsDone, selectedOutboundTour, t]);

  const step3Summary = useMemo(() => {
    if (ticket?.status === "paid") return t.step3SummaryPaid;
    if (ticket?.status === "canceled") return t.step3SummaryCanceled;
    if (ticket || purchaseId) return t.step3SummaryPending;
    return t.step3SummaryEmpty;
  }, [purchaseId, ticket, t]);

  const handleStepNavigation = (step: Step) => {
    if (step === 2 && (!selectedOutboundTour || (returnRequired && !selectedReturnTour))) {
      setActiveStep(1);
      return;
    }

    if (step === 3 && !step2Complete) {
      setActiveStep(2);
      return;
    }

    setActiveStep(step);
  };

  const stepNavigation = useMemo(
    () => [
      {
        id: 1 as Step,
        label: t.step1ShortLabel,
        summary: step1Summary,
        state: activeStep === 1 ? "active" : isStep1Done ? "done" : "future",
      },
      {
        id: 2 as Step,
        label: t.step2ShortLabel,
        summary: step2Summary,
        state:
          activeStep === 2
            ? "active"
            : activeStep > 2 || isStep2Done
              ? "done"
              : "future",
      },
      {
        id: 3 as Step,
        label: t.step3ShortLabel,
        summary: step3Summary,
        state: activeStep === 3 ? "active" : isStep3Done ? "done" : "future",
      },
    ],
    [activeStep, isStep1Done, isStep2Done, isStep3Done, step1Summary, step2Summary, step3Summary, t]
  );

  useEffect(() => {
    if (!selectedOutboundTour) return;
    if (returnRequired && !selectedReturnTour) return;
    setActiveStep((prev) => (prev < 2 ? 2 : prev));
  }, [returnRequired, selectedOutboundTour, selectedReturnTour]);

  const outboundListVisible = !selectedOutboundTour && outboundTours.length > 0;
  const returnListVisible =
    !!selectedOutboundTour && returnRequired && !selectedReturnTour && returnTours.length > 0;

  const resetOutbound = () => {
    setSelectedOutboundTour(null);
    setSelectedReturnTour(null);
    setSelectedOutboundSeats([]);
    setSelectedReturnSeats([]);
    setActiveStep(1);
  };

  const resetReturn = () => {
    setSelectedReturnTour(null);
    setSelectedReturnSeats([]);
    setActiveStep(1);
  };

  const handleReadyForContacts = () => {
    setActiveStep(3);
  };

  const locale = useMemo(() => {
    if (lang === "en") return "en-US";
    if (lang === "bg") return "bg-BG";
    if (lang === "ua") return "uk-UA";
    return "ru-RU";
  }, [lang]);

  const formatDateLabel = useCallback(
    (value: string) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
    },
    [locale]
  );

  const formatPrice = useCallback((value: number) => `${value.toFixed(2)} ₴`, []);

  const calculateTotal = useCallback(
    (tour: Tour | null) => {
      if (!tour) return 0;
      const adults = Math.max(0, safeSeatCount - safeDiscountCount);
      const adultSum = adults * tour.price;
      const discSum = safeDiscountCount * tour.price * (1 - DISCOUNT_RATE);
      return adultSum + discSum;
    },
    [safeDiscountCount, safeSeatCount]
  );

  const outboundTotal = useMemo(() => calculateTotal(selectedOutboundTour), [calculateTotal, selectedOutboundTour]);
  const returnTotal = useMemo(() => calculateTotal(selectedReturnTour), [calculateTotal, selectedReturnTour]);
  const overallTotal = useMemo(() => outboundTotal + returnTotal, [outboundTotal, returnTotal]);

  const calculateBaggagePrice = useCallback((tour: Tour | null) => {
    if (!tour) return null;

    const rawPrice = tour.price * 0.1;
    return Math.round(rawPrice * 100) / 100;
  }, []);

  const baggagePriceLabels = useMemo(
    () => ({
      outbound: calculateBaggagePrice(selectedOutboundTour),
      return: calculateBaggagePrice(selectedReturnTour),
    }),
    [calculateBaggagePrice, selectedOutboundTour, selectedReturnTour]
  );

  const formattedBaggagePriceLabels = useMemo(
    () => ({
      outbound: baggagePriceLabels.outbound != null ? formatPrice(baggagePriceLabels.outbound) : null,
      return: baggagePriceLabels.return != null ? formatPrice(baggagePriceLabels.return) : null,
    }),
    [baggagePriceLabels.outbound, baggagePriceLabels.return, formatPrice]
  );

  const passengerSummaries = useMemo(
    () =>
      passengerNames
        .map((name, index) => ({
          name: name.trim(),
          seatOutbound: selectedOutboundSeats[index] ?? null,
          seatReturn:
            returnRequired && selectedReturnTour
              ? selectedReturnSeats[index] ?? null
              : null,
          baggageOutbound: extraBaggageOutbound[index] ?? false,
          baggageReturn:
            returnRequired && selectedReturnTour ? extraBaggageReturn[index] ?? false : false,
        }))
        .filter((passenger) => passenger.name),
    [
      extraBaggageOutbound,
      extraBaggageReturn,
      passengerNames,
      returnRequired,
      selectedOutboundSeats,
      selectedReturnSeats,
      selectedReturnTour,
    ]
  );

  const orderSummaryTotals = useMemo(
    () => ({ outbound: outboundTotal, return: returnTotal, overall: overallTotal }),
    [outboundTotal, overallTotal, returnTotal]
  );
  const showStepNavigation = Boolean(selectedOutboundTour);
  const stepCounterLabel = t.stepCounter(activeStep, stepNavigation.length);

  const resolveStepToRender = (): Step => {
    if (activeStep === 2 && (!selectedOutboundTour || (returnRequired && !selectedReturnTour))) {
      return 1;
    }

    if (activeStep === 3 && !step2Complete) {
      return 2;
    }

    return activeStep;
  };

  const renderStepHeader = (stepNumber: Step, title: string, summary: string) => {
    const showInlineSummary = !showStepNavigation;
    const stepLabel = t.stepLabel(stepNumber);

    return (
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{`${stepLabel} — ${title}`}</h2>
          {showInlineSummary ? (
            <p className="text-sm text-slate-500">{summary}</p>
          ) : null}
        </div>
      </div>
    );
  };

  const renderStepContent = (stepToRender: Step) => {
    if (stepToRender === 1) {
      const outboundDirectionTitle = `${fromName} → ${toName} (${t.outboundShort.toLowerCase()})`;
      const returnDirectionTitle = `${toName} → ${fromName} (${t.inboundShort.toLowerCase()})`;

      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          {renderStepHeader(1, t.step1Title, step1Summary)}

          {outboundListVisible && (
            <TripList
              title={outboundDirectionTitle}
              tours={outboundTours}
              selectedId={selectedOutboundTour?.id}
              onSelect={onSelectOutbound}
              fromName={fromName}
              toName={toName}
              lang={lang}
              seatCount={safeSeatCount}
              discountCount={safeDiscountCount}
              t={t}
            />
          )}

          {returnListVisible && (
            <TripList
              title={returnDirectionTitle}
              tours={returnTours}
              selectedId={selectedReturnTour?.id}
              onSelect={onSelectReturn}
              fromName={toName}
              toName={fromName}
              lang={lang}
              seatCount={safeSeatCount}
              discountCount={safeDiscountCount}
              t={t}
            />
          )}

          {!outboundListVisible && !returnListVisible && selectedOutboundTour && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                {t.outboundShort}: {selectedOutboundTour.departure_time} · {fromName} → {toName}
              </p>
              {returnRequired && selectedReturnTour && (
                <p>
                  {t.inboundShort}: {selectedReturnTour.departure_time} · {toName} → {fromName}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                  onClick={resetOutbound}
                >
                  {t.changeOutbound}
                </button>
                {returnRequired && selectedReturnTour && (
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                    onClick={resetReturn}
                  >
                    {t.changeReturn}
                  </button>
                )}
              </div>
            </div>
          )}

          {!outboundTours.length && !returnTours.length && (
            <p className="text-sm text-slate-500">{t.noResults}</p>
          )}
        </section>
      );
    }

    if (stepToRender === 2) {
      return (
        <StepTwo
          renderStepHeader={renderStepHeader}
          t={t}
          safeSeatCount={safeSeatCount}
          fromId={fromId}
          toId={toId}
          fromName={fromName}
          toName={toName}
          selectedOutboundTour={selectedOutboundTour}
          selectedReturnTour={selectedReturnTour}
          selectedOutboundSeats={selectedOutboundSeats}
          setSelectedOutboundSeats={setSelectedOutboundSeats}
          selectedReturnSeats={selectedReturnSeats}
          setSelectedReturnSeats={setSelectedReturnSeats}
          passengerNames={passengerNames}
          setPassengerNames={setPassengerNames}
          extraBaggageOutbound={extraBaggageOutbound}
          setExtraBaggageOutbound={setExtraBaggageOutbound}
          extraBaggageReturn={extraBaggageReturn}
          setExtraBaggageReturn={setExtraBaggageReturn}
          handleReadyForContacts={handleReadyForContacts}
          step2Summary={step2Summary}
        />
      );
    }

    return (
      <StepThree
        renderStepHeader={renderStepHeader}
        t={t}
        passengerNames={passengerNames}
        phone={phone}
        setPhone={setPhone}
        email={email}
        setEmail={setEmail}
        fromName={fromName}
        toName={toName}
        returnRequired={returnRequired}
        baggagePriceByDirection={formattedBaggagePriceLabels}
        extraBaggageOutbound={extraBaggageOutbound}
        setExtraBaggageOutbound={setExtraBaggageOutbound}
        extraBaggageReturn={extraBaggageReturn}
        setExtraBaggageReturn={setExtraBaggageReturn}
        purchaseId={purchaseId}
        ticket={ticket}
        handleAction={handleAction}
        handlePay={handlePay}
        handleTicketDownloadClick={handleTicketDownloadClick}
        handlePromptClose={handlePromptClose}
        showDownloadPrompt={showDownloadPrompt}
        step3Summary={step3Summary}
      />
    );
  };

      


  if (ticket) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-4">
        {loading && <Loader />}
        {msg && <Alert type={msgType}>{msg}</Alert>}

        <ElectronicTicket
          ticket={ticket}
          t={t}
          onDownload={() => handleTicketDownloadClick()}
        />

        <div className="flex flex-wrap gap-3">
          {purchaseId && (
            <button
              type="button"
              onClick={handlePay}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-white shadow hover:bg-emerald-700"
            >
              {t.pay}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleTicketDownloadClick()}
            className="rounded-xl border border-slate-300 px-6 py-3 text-slate-700 shadow hover:bg-slate-100"
          >
            {t.ticketDownload}
          </button>
        </div>

        <TicketDownloadPrompt
          visible={showDownloadPrompt && !!ticket}
          t={t}
          onDownload={() => handleTicketDownloadClick()}
          onClose={handlePromptClose}
        />
      </div>
    );
  }

  const stepToRender = resolveStepToRender();

  return (
    <div className="w-full max-w-6xl mx-auto">
      {loading && <Loader />}
      {msg && <Alert type={msgType}>{msg}</Alert>}

      {/* Общая сетка: слева прогресс + шаги, справа сводка.
          На десктопе 2 строки: 
          row 1 — прогресс + сводка, row 2 — шаги + продолжение сводки. */}
      <div className="grid gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)] lg:auto-rows-min">
        {/* Прогресс-бар: слева, верхняя строка */}
        {showStepNavigation && (
          <div className="lg:col-start-1 lg:row-start-1 mb-2 sm:mb-3">
            <StepProgress
              activeStep={activeStep}
              steps={stepNavigation}
              onNavigate={handleStepNavigation}
              stepCounterLabel={stepCounterLabel}
            />
          </div>
        )}

        {/* Текущий шаг: слева, под прогресс-баром */}
        <div className="lg:col-start-1 lg:row-start-2">
          <div key={stepToRender} className="animate-step-fade">
            {renderStepContent(stepToRender)}
          </div>
        </div>

        {/* Сводка: справа, тянется по двум строкам и липнет к верху */}
        {showStepNavigation && (
          <div
            key={`summary-${activeStep}`}
            className="animate-summary-slide lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:max-w-[520px] lg:ml-auto lg:sticky lg:top-20"
          >
            <OrderSummary
              t={t}
              fromName={fromName}
              toName={toName}
              outboundTour={selectedOutboundTour as Tour}
              returnTour={selectedReturnTour}
              returnRequired={returnRequired}
              passengerSummaries={passengerSummaries}
              seatCount={seatCount}
              phone={phone}
              email={email}
              totals={orderSummaryTotals}
              formatDateLabel={formatDateLabel}
              formatPrice={formatPrice}
            />
          </div>
        )}
      </div>
    </div>
  );


}
