"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Loader from "../common/Loader";
import Alert from "../common/Alert";
import apiClient from "@/lib/apiClient";

import TripList, { RETURN_DISCOUNT, tourTotal } from "./TripList";
import BookedScreen from "./BookedScreen";
import FlowActionBar from "./FlowActionBar";
import TicketDownloadPrompt from "./TicketDownloadPrompt";
import OrderSummary from "./OrderSummary";
import StepProgress from "./StepProgress";
import { dict } from "./searchDictionary";
import type { Lang, Step, Tour as SearchTour } from "./types";
import StepTwo from "./steps/StepTwo";
import StepThree from "./steps/StepThree";

import { downloadTicketPdf } from "@/utils/ticketPdf";
import {
  trackViewItemList,
  trackSelectItem,
  trackAddToCart,
  trackBeginCheckout,
  trackAddPaymentInfo,
  trackReservation,
  buildRouteCategory,
  type EcommerceItem,
} from "@/lib/analytics";
import { getPublicOfferUrl } from "@/utils/publicOffer";
import {
  checkPassengerPhone,
  isValidPassengerEmail,
  normalizePassengerContact,
} from "@/utils/passengerContact";
import { formatUah } from "@/utils/tripFormat";
import {
  normalizePublicPayResponse,
  persistLastLiqPayOrderId,
  type PublicPayResponse,
} from "@/utils/liqpayCheckout";
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
  openReturn?: boolean;
  seatCount: number;
  discountCount: number;
};

type StepNavigationItem = {
  id: Step;
  label: string;
  summary: string;
  state: "active" | "done" | "future";
};


const submitLiqPayCheckout = (checkoutFormUrl: string, data: string, signature: string) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutFormUrl;

  const dataInput = document.createElement("input");
  dataInput.type = "hidden";
  dataInput.name = "data";
  dataInput.value = data;

  const signatureInput = document.createElement("input");
  signatureInput.type = "hidden";
  signatureInput.name = "signature";
  signatureInput.value = signature;

  form.append(dataInput, signatureInput);
  document.body.appendChild(form);
  form.submit();
};

const LIQPAY_CHECKOUT_FORM_URL = "https://www.liqpay.ua/api/3/checkout";
const ENABLE_TWO_STEP_PURCHASE_FALLBACK =
  process.env.NEXT_PUBLIC_ENABLE_TWO_STEP_PURCHASE === "true";

type PublicPurchaseCheckout = {
  data?: unknown;
  signature?: unknown;
  order_id?: unknown;
};

type PublicPurchaseResponse = {
  purchase_id?: unknown;
  amount_due?: unknown;
  checkout?: PublicPurchaseCheckout | null;
};

export default function SearchResults({
  lang = "ru",
  from,
  to,
  fromName,
  toName,
  date,
  returnDate,
  openReturn: openReturnInitial = false,
  seatCount,
  discountCount,
}: Props) {
  const t = dict[lang ?? "ru"];
  const publicOfferUrl = getPublicOfferUrl(lang ?? "ru");

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
  const [outboundTours, setOutboundTours] = useState<SearchTour[]>([]);
  const [returnTours, setReturnTours] = useState<SearchTour[]>([]);

  const [ticket, setTicket] = useState<ElectronicTicketData | null>(null);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);

  // Выбор рейсов
  const [selectedOutboundTour, setSelectedOutboundTour] = useState<SearchTour | null>(
    null
  );
  const [selectedReturnTour, setSelectedReturnTour] = useState<SearchTour | null>(null);

  // Обратный билет с открытой датой (сценарий C): обратный рейс не выбирается,
  // бэкенд выпускает предоплаченный открытый обратный билет.
  // Скидка −10% относится к обратному билету при покупке туда-обратно.
  const [openReturn, setOpenReturn] = useState(Boolean(openReturnInitial));

  // Итоговая сумма считается на бэкенде (quote), фронт её только отображает.
  const [quoteAmount, setQuoteAmount] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

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

  // Подсказки «чего не хватает» у полей — после первой попытки пройти дальше
  const [showStep2Errors, setShowStep2Errors] = useState(false);
  const [showContactErrors, setShowContactErrors] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);

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

    const freeSeats = (value: SearchTour["seats"]) =>
      typeof value === "number" ? value : value?.free ?? 0;

    const filterBySeats = (tours: SearchTour[]) =>
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
        const outReq = apiClient.get<SearchTour[]>("/tours/search", {
          params: {
            departure_stop_id: fromId,
            arrival_stop_id: toId,
            date,
            seats: safeSeatCount,
          },
        });

        const retReq = returnDate
          ? apiClient.get<SearchTour[]>("/tours/search", {
              params: {
                departure_stop_id: toId,
                arrival_stop_id: fromId,
                date: returnDate,
                seats: safeSeatCount,
              },
            })
          : Promise.resolve({ data: [] as SearchTour[] });

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
  const getTourId = (tour: SearchTour | null) => tour?.id;

  // Выбор рейсов
  const onSelectOutbound = (tour: SearchTour) => {
    trackSelectItem({
      locale: lang,
      listName: "search_results_outbound",
      items: [
        {
          item_id: String(tour.id),
          item_name: `${fromName} → ${toName}`,
          item_category: returnDate ? "roundtrip" : "oneway",
          item_category2: buildRouteCategory(
            { id: fromId, name: fromName },
            { id: toId, name: toName },
          ),
          price: tour.price,
          item_variant: tour.date,
          departure: fromName,
          arrival: toName,
          travel_date: tour.date,
        },
      ],
      value: tour.price,
    });
    setSelectedOutboundTour(tour);
    setSelectedOutboundSeats([]);
    setSelectedReturnSeats([]);
    setMsg("");
  };

  const onSelectReturn = (tour: SearchTour) => {
    trackSelectItem({
      locale: lang,
      listName: "search_results_return",
      items: [
        {
          item_id: String(tour.id),
          item_name: `${toName} → ${fromName}`,
          item_category: "roundtrip",
          item_category2: buildRouteCategory(
            { id: fromId, name: fromName },
            { id: toId, name: toName },
          ),
          price: tour.price,
          item_variant: tour.date,
          departure: toName,
          arrival: fromName,
          travel_date: tour.date,
        },
      ],
      value: tour.price,
    });
    setSelectedReturnTour(tour);
    setSelectedOutboundSeats([]);
    setSelectedReturnSeats([]);
    setMsg("");
  };

  // Переход к шагу 2 — кнопкой «Далее» в нижней панели: на шаге 1 видны
  // оба выбранных рейса и итог (раньше шаг переключался сам).

  // ====== ACTIONS: бронь / покупка ======
  const handleAction = async (action: "book" | "purchase") => {
    try {
      if (!selectedOutboundTour || (returnDate && !openReturn && !selectedReturnTour)) {
        setMsg(t.errChooseTrips);
        setMsgType("error");
        return;
      }
      if (
        selectedOutboundSeats.length !== safeSeatCount ||
        (selectedReturnTour && selectedReturnSeats.length !== safeSeatCount)
      ) {
        setMsg(t.errChooseSeats);
        setMsgType("error");
        return;
      }
      const normalizedContact = normalizePassengerContact({
        email,
        phone,
        passengerNames,
      });

      if (normalizedContact.passengerNames.some((name) => !name)) {
        setMsg(t.errFillNames);
        setMsgType("error");
        return;
      }

      // Номер без кода страны или неполный не уходит на сервер.
      if (
        !checkPassengerPhone(normalizedContact.phone).ok ||
        !isValidPassengerEmail(normalizedContact.email)
      ) {
        setShowContactErrors(true);
        return;
      }

      setLoading(true);
      setMsg(action === "purchase" ? t.msgPurchasing : t.msgBooking);
      setMsgType("info");

      // begin_checkout больше НЕ шлётся здесь: он отправляется один раз при
      // попадании на экран оформления (ContactsAndPaymentStep), до развилки
      // book/purchase. purchase_click удалён.

      const isTwoStepPurchaseFallback =
        action === "purchase" && ENABLE_TWO_STEP_PURCHASE_FALLBACK;
      const endpoint =
        action === "purchase"
          ? isTwoStepPurchaseFallback
            ? "book"
            : "public/purchase"
          : "book";
      const basePayload = {
        passenger_names: normalizedContact.passengerNames,
        passenger_phone: normalizedContact.phone,
        passenger_email: normalizedContact.email,
        adult_count: safeSeatCount - safeDiscountCount,
        discount_count: safeDiscountCount,
        ...(lang ? { lang } : {}),
      };

      const coerceTicketNumbers = (value: unknown): string[] => {
        if (value == null) {
          return [];
        }
        if (Array.isArray(value)) {
          return value.flatMap((item) => coerceTicketNumbers(item));
        }
        if (typeof value === "object") {
          const obj = value as Record<string, unknown>;
          const nestedSources = [
            obj["ticket_number"],
            obj["ticketNumber"],
            obj["ticket_id"],
            obj["ticketId"],
            obj["number"],
            obj["id"],
          ];
          return nestedSources.flatMap((source) => coerceTicketNumbers(source));
        }
        if (typeof value === "string" || typeof value === "number") {
          const normalized = String(value).trim();
          return normalized ? [normalized] : [];
        }
        return [];
      };

      const extractTicketNumbers = (payload: unknown): string[] => {
        if (!payload || typeof payload !== "object") {
          return [];
        }
        const data = payload as Record<string, unknown>;
        const potentialSources = [
          data["ticket_number"],
          data["ticketNumber"],
          data["ticket_id"],
          data["ticketId"],
          data["ticket_numbers"],
          data["ticketNumbers"],
          data["ticket_ids"],
          data["ticketIds"],
          data["tickets"],
        ];

        return potentialSources
          .flatMap((source) => coerceTicketNumbers(source))
          .filter(Boolean);
      };

      // туда
      const outRes = await apiClient.post<PublicPurchaseResponse>(`/${endpoint}`, {
        ...basePayload,
        seat_nums: selectedOutboundSeats,
        extra_baggage: extraBaggageOutbound.slice(0, safeSeatCount),
        tour_id: selectedOutboundTour.id,
        departure_stop_id: fromId,
        arrival_stop_id: toId,
        // Сценарий C: выпустить открытую обратку для каждого пассажира.
        // Скидка применяется к обратному билету, а не к открытому формату даты.
        ...(openReturn ? { open_return: true } : {}),
      });

      let total = outRes.data.amount_due;
      let pId = Number(outRes.data.purchase_id);
      let ticketNumbers = extractTicketNumbers(outRes.data);
      let finalPurchaseResponse = outRes.data;

      // обратно (конкретная дата) — скидка −10% на обратный билет применяется бэкендом по is_return_leg
      if (selectedReturnTour && !openReturn) {
        const retRes = await apiClient.post<PublicPurchaseResponse>(`/${endpoint}`, {
          ...basePayload,
          seat_nums: selectedReturnSeats,
          extra_baggage: extraBaggageReturn.slice(0, safeSeatCount),
          tour_id: selectedReturnTour.id,
          departure_stop_id: toId,
          arrival_stop_id: fromId,
          purchase_id: pId,
          is_return_leg: true,
        });
        total = retRes.data.amount_due;
        pId = Number(retRes.data.purchase_id);
        ticketNumbers = [...ticketNumbers, ...extractTicketNumbers(retRes.data)];
        finalPurchaseResponse = retRes.data;
      }

      setPurchaseId(pId);
      const resolvedTicketNumbers = Array.from(
        new Set(ticketNumbers.length ? ticketNumbers : [String(pId)])
      );
      const primaryTicketNumber = resolvedTicketNumbers[0];
      const ticketData: ElectronicTicketData = {
        ticketNumber: primaryTicketNumber,
        ticketNumbers: resolvedTicketNumbers,
        purchaseId: pId,
        action,
        total: Number(total),
        createdAt: new Date().toISOString(),
        status: "pending",
        contact: {
          phone: normalizedContact.phone,
          email: normalizedContact.email,
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
        passengers: normalizedContact.passengerNames.map((name, idx) => ({
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
      // Номер заказа, рейсы, места и сумма — на экране BookedScreen,
      // а не строкой «Purchase ID: … Сумма: …».
      setMsg("");
      setMsgType("success");

      if (action === "book") {
        // reservation срабатывает ТОЛЬКО на пути «book» (бронь без онлайн-оплаты).
        // На пути «purchase» этот блок недостижим, поэтому reservation не может
        // выстрелить на purchase-ветке и не задваивается с purchase.
        const reservationItems = buildCheckoutItems();
        trackReservation({
          purchaseId: pId,
          locale: lang,
          items: reservationItems.items,
          value: Number(total),
          tripFrom: fromName,
          tripTo: toName,
          extra: {
            passenger_count: safeSeatCount,
            trip_type: reservationItems.tripType,
            route: reservationItems.route,
          },
        });
      }

      if (action === "purchase" && !isTwoStepPurchaseFallback) {
        const checkoutData =
          typeof finalPurchaseResponse.checkout?.data === "string"
            ? finalPurchaseResponse.checkout.data
            : "";
        const checkoutSignature =
          typeof finalPurchaseResponse.checkout?.signature === "string"
            ? finalPurchaseResponse.checkout.signature
            : "";

        if (!checkoutData || !checkoutSignature) {
          throw new Error("missing checkout payload in purchase response");
        }

        const checkoutPayload = normalizePublicPayResponse(finalPurchaseResponse);
        persistLastLiqPayOrderId(checkoutPayload.orderId);
        const paymentItems = buildCheckoutItems();
        trackAddPaymentInfo({
          locale: lang,
          transactionId: String(pId),
          items: paymentItems.items,
          value: Number(total),
          paymentType: "liqpay",
          extra: {
            passenger_count: safeSeatCount,
            trip_type: tripTypeLabel,
            route: paymentItems.route,
          },
        });
        if (typeof window !== "undefined") {
          sessionStorage.setItem("ga_checkout_start_ts", String(Date.now()));
          sessionStorage.setItem("ga_checkout_purchase_id", String(pId));
          // Funnel-consistent резерв для purchase.value на /return, если бэкенд
          // не вернёт per-ticket pricing (см. return/page.tsx).
          sessionStorage.setItem("ga_checkout_value", String(Number(total)));
        }
        setMsg(t.msgRedirect);
        setMsgType("info");
        submitLiqPayCheckout(
          checkoutPayload.checkoutFormUrl || LIQPAY_CHECKOUT_FORM_URL,
          checkoutPayload.data,
          checkoutPayload.signature
        );
      }

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
      setMsg(t.errNoBooking);
      setMsgType("error");
      return;
    }
    try {
      setLoading(true);
      setMsg(t.msgRedirect);
      setMsgType("info");
      const response = await apiClient.post<PublicPayResponse>(
        `/public/purchase/${encodeURIComponent(String(purchaseId))}/pay`,
      );

      const checkoutPayload = normalizePublicPayResponse(response.data);
      persistLastLiqPayOrderId(checkoutPayload.orderId);
      const paymentItems = buildCheckoutItems();
      trackAddPaymentInfo({
        locale: lang,
        transactionId: String(purchaseId),
        items: paymentItems.items,
        value: overallTotal,
        paymentType: "liqpay",
        extra: {
          passenger_count: safeSeatCount,
          trip_type: tripTypeLabel,
          route: paymentItems.route,
        },
      });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ga_checkout_start_ts", String(Date.now()));
        sessionStorage.setItem("ga_checkout_purchase_id", String(purchaseId));
        // Funnel-consistent резерв для purchase.value на /return.
        sessionStorage.setItem("ga_checkout_value", String(overallTotal));
      }
      submitLiqPayCheckout(
        checkoutPayload.checkoutFormUrl,
        checkoutPayload.data,
        checkoutPayload.signature
      );
      setMsg(t.msgRedirect);
      setMsgType("info");
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
      await apiClient.post(`/cancel/${purchaseId}`);
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
    const candidateTicketIds = ticketNumberOverride
      ? [ticketNumberOverride]
      : ticket?.ticketNumbers?.length
        ? ticket.ticketNumbers
        : ticket?.ticketNumber
          ? [ticket.ticketNumber]
          : [];
    const targetTicketNumbers = candidateTicketIds.length
      ? candidateTicketIds
      : ticket?.purchaseId != null
        ? [String(ticket.purchaseId)]
        : [];
    const targetPurchaseId = ticket?.purchaseId ?? purchaseId ?? null;
    const targetEmail = (ticket?.contact.email ?? email ?? "").trim();

    if (!targetTicketNumbers.length || targetPurchaseId == null || !targetEmail) {
      setMsg(t.errDownloadData);
      setMsgType("error");
      return;
    }

    try {
      for (const ticketId of targetTicketNumbers) {
        await downloadTicketPdf({
          ticketId,
          purchaseId: targetPurchaseId,
          email: targetEmail,
          source: "post_purchase",
        });
      }
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

  const returnRequired = Boolean(returnDate && hasReturnSection && !openReturn);
  const tripTypeLabel = openReturn
    ? "open_return"
    : selectedReturnTour
      ? "roundtrip"
      : "oneway";
  const seatsDone =
    selectedOutboundSeats.length === safeSeatCount &&
    (!returnRequired || selectedReturnSeats.length === safeSeatCount);
  const namesDone = passengerNames.filter((n) => !!n.trim()).length === safeSeatCount;
  const step2Complete =
    !!selectedOutboundTour && (!returnRequired || !!selectedReturnTour) && seatsDone && namesDone;

  const isStep1Done = Boolean(
    selectedOutboundTour && (!returnRequired || !!selectedReturnTour)
  );
  const isStep2Done = step2Complete;
  const isStep3Done = Boolean(ticket || purchaseId);
  const canUseManualPay = Boolean(
    purchaseId && (ticket?.action === "book" || ENABLE_TWO_STEP_PURCHASE_FALLBACK)
  );

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

  const stepNavigation = useMemo<StepNavigationItem[]>(
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

  const handleReturnModeChange = (open: boolean) => {
    setOpenReturn(open);
    if (open) {
      setSelectedReturnTour(null);
      setSelectedReturnSeats([]);
      setExtraBaggageReturn(Array(safeSeatCount).fill(false));
    }
  };

  const formatPrice = useCallback((value: number) => formatUah(value), []);

  // Информационная цена за место багажа (+10%); используется только как подпись в шаге 3.
  const calculateBaggagePrice = useCallback((tour: SearchTour | null) => {
    if (!tour) return null;

    const rawPrice = tour.price * 0.1;
    return Math.round(rawPrice * 100) / 100;
  }, []);

  const baggageCounts = useMemo(
    () => ({
      outbound: extraBaggageOutbound.filter(Boolean).length,
      return: returnRequired ? extraBaggageReturn.filter(Boolean).length : 0,
    }),
    [extraBaggageOutbound, extraBaggageReturn, returnRequired]
  );

  // Итог считает бэкенд: запрашиваем предварительную сумму (quote) по выбранным ногам.
  useEffect(() => {
    let cancelled = false;

    if (!selectedOutboundTour) {
      setQuoteAmount(null);
      return;
    }

    const run = async () => {
      setQuoteLoading(true);
      try {
        const adultCount = safeSeatCount - safeDiscountCount;
        const legs: Record<string, unknown>[] = [
          {
            tour_id: selectedOutboundTour.id,
            departure_stop_id: fromId,
            arrival_stop_id: toId,
            adult_count: adultCount,
            discount_count: safeDiscountCount,
            extra_baggage_count: baggageCounts.outbound,
            ...(openReturn ? { open_return: true } : {}),
          },
        ];
        if (selectedReturnTour && !openReturn) {
          legs.push({
            tour_id: selectedReturnTour.id,
            departure_stop_id: toId,
            arrival_stop_id: fromId,
            adult_count: adultCount,
            discount_count: safeDiscountCount,
            extra_baggage_count: baggageCounts.return,
            is_return_leg: true,
          });
        }

        let sum = 0;
        for (const leg of legs) {
          const res = await apiClient.post<{ amount_due?: unknown }>(
            "/public/purchase/quote",
            leg
          );
          sum += Number(res.data?.amount_due ?? 0);
        }
        if (!cancelled) setQuoteAmount(sum);
      } catch {
        if (!cancelled) setQuoteAmount(null);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    baggageCounts.outbound,
    baggageCounts.return,
    fromId,
    openReturn,
    safeDiscountCount,
    safeSeatCount,
    selectedOutboundTour,
    selectedReturnTour,
    toId,
  ]);

  const overallTotal = quoteAmount ?? 0;

  const buildCheckoutItems = useCallback(() => {
    const tripType = openReturn ? "open_return" : selectedReturnTour ? "roundtrip" : "oneway";
    const route = buildRouteCategory(
      { id: fromId, name: fromName },
      { id: toId, name: toName },
    );
    const items: EcommerceItem[] = [];
    if (selectedOutboundTour) {
      items.push({
        item_id: String(selectedOutboundTour.id),
        item_name: `${fromName} → ${toName}`,
        item_category: tripType,
        item_category2: route,
        item_variant: selectedOutboundTour.date,
        price: selectedOutboundTour.price,
        quantity: safeSeatCount,
      });
    }
    if (selectedReturnTour) {
      items.push({
        item_id: String(selectedReturnTour.id),
        item_name: `${toName} → ${fromName}`,
        item_category: tripType,
        item_category2: route,
        item_variant: selectedReturnTour.date,
        price: selectedReturnTour.price,
        quantity: safeSeatCount,
      });
    }
    return { items, tripType, route };
  }, [
    fromId,
    fromName,
    openReturn,
    safeSeatCount,
    selectedOutboundTour,
    selectedReturnTour,
    toId,
    toName,
  ]);

  // view_item_list: отрисован список рейсов (после загрузки туров). Один раз
  // на поисковый запрос.
  const viewItemListFiredRef = useRef(false);
  useEffect(() => {
    viewItemListFiredRef.current = false;
  }, [fromId, toId, date, returnDate, safeSeatCount]);

  useEffect(() => {
    if (loading) return;
    if (!outboundTours.length) return;
    if (viewItemListFiredRef.current) return;
    viewItemListFiredRef.current = true;
    const route = buildRouteCategory(
      { id: fromId, name: fromName },
      { id: toId, name: toName },
    );
    trackViewItemList({
      locale: lang,
      listId: "search_results_outbound",
      listName: "search_results_outbound",
      items: outboundTours.map((tour) => ({
        item_id: String(tour.id),
        item_name: `${fromName} → ${toName}`,
        item_category: returnDate ? "roundtrip" : "oneway",
        item_category2: route,
        item_variant: tour.date,
        price: tour.price,
      })),
      extra: { item_count: outboundTours.length, route },
    });
  }, [loading, outboundTours, fromName, toName, returnDate, fromId, toId, lang]);

  // add_to_cart: рейс + место зафиксированы (бывший view_item). Один раз на
  // текущий выбор рейсов; сбрасывается при смене рейса.
  const addToCartFiredRef = useRef(false);
  const beginCheckoutFiredRef = useRef(false);
  useEffect(() => {
    addToCartFiredRef.current = false;
    beginCheckoutFiredRef.current = false;
  }, [selectedOutboundTour?.id, selectedReturnTour?.id]);

  useEffect(() => {
    if (!selectedOutboundTour) return;
    if (returnRequired && !selectedReturnTour) return;
    if (!seatsDone) return;
    if (addToCartFiredRef.current) return;
    addToCartFiredRef.current = true;
    const { items, tripType, route } = buildCheckoutItems();
    trackAddToCart({
      locale: lang,
      items,
      value: overallTotal,
      extra: {
        trip_type: tripType,
        route,
        passenger_count: safeSeatCount,
        seats_outbound: [...selectedOutboundSeats],
        ...(selectedReturnTour ? { seats_return: [...selectedReturnSeats] } : {}),
      },
    });
  }, [
    seatsDone,
    returnRequired,
    selectedOutboundTour,
    selectedReturnTour,
    selectedOutboundSeats,
    selectedReturnSeats,
    buildCheckoutItems,
    overallTotal,
    safeSeatCount,
    lang,
  ]);

  // begin_checkout: попадание на экран оформления (ContactsAndPaymentStep),
  // ОДИН раз, до развилки book/purchase.
  useEffect(() => {
    if (ticket) return;
    if (activeStep !== 3) return;
    if (!step2Complete) return;
    if (beginCheckoutFiredRef.current) return;
    beginCheckoutFiredRef.current = true;
    const { items, tripType, route } = buildCheckoutItems();
    trackBeginCheckout({
      locale: lang,
      items,
      value: overallTotal,
      extra: { trip_type: tripType, route, passenger_count: safeSeatCount },
    });
  }, [
    ticket,
    activeStep,
    step2Complete,
    buildCheckoutItems,
    overallTotal,
    safeSeatCount,
    lang,
  ]);

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
    () => ({
      overall: quoteAmount,
      baggage: {
        outboundCount: baggageCounts.outbound,
        returnCount: baggageCounts.return,
      },
    }),
    [quoteAmount, baggageCounts.outbound, baggageCounts.return]
  );
  const showStepNavigation = outboundTours.length > 0 || Boolean(selectedOutboundTour);
  // Оценка итога по ценам рейсов, пока бэкенд не вернул quote.
  const estimatedTotal = useMemo(() => {
    if (!selectedOutboundTour) return null;
    let sum = tourTotal(selectedOutboundTour, safeSeatCount, safeDiscountCount);
    if (selectedReturnTour && !openReturn) {
      sum += tourTotal(selectedReturnTour, safeSeatCount, safeDiscountCount) * (1 - RETURN_DISCOUNT);
    }
    return sum;
  }, [openReturn, safeDiscountCount, safeSeatCount, selectedOutboundTour, selectedReturnTour]);
  const displayTotal = quoteAmount ?? estimatedTotal;
  const totalText = displayTotal != null ? formatUah(displayTotal) : undefined;

  const resolveStepToRender = (): Step => {
    if (activeStep === 2 && (!selectedOutboundTour || (returnRequired && !selectedReturnTour))) {
      return 1;
    }

    if (activeStep === 3 && !step2Complete) {
      return 2;
    }

    return activeStep;
  };

  const stepToRender = resolveStepToRender();

  // При смене шага возвращаемся к его началу, если оно ушло выше экрана.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top;
    if (top < 0) {
      window.scrollTo({ top: Math.max(window.scrollY + top - 80, 0), behavior: "smooth" });
    }
  }, [stepToRender]);

  // Ошибка операции — показываем на экране, а не выше него.
  useEffect(() => {
    if (msg && msgType === "error") {
      alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [msg, msgType]);

  // ===== Шаг 2: чего не хватает =====
  const firstEmptyNameIndex = passengerNames.findIndex((name) => !name.trim());
  const step2Missing = (() => {
    if (selectedOutboundSeats.length < safeSeatCount) {
      return t.missingSeats("outbound", selectedOutboundSeats.length, safeSeatCount);
    }
    if (returnRequired && selectedReturnTour && selectedReturnSeats.length < safeSeatCount) {
      return t.missingSeats("return", selectedReturnSeats.length, safeSeatCount);
    }
    if (firstEmptyNameIndex >= 0) return t.missingName(firstEmptyNameIndex + 1);
    return null;
  })();
  const highlightNameIndex =
    firstEmptyNameIndex >= 0 && (seatsDone || showStep2Errors) ? firstEmptyNameIndex : null;

  // ===== Шаг 3: проверка контактов у полей =====
  const phoneCheck = checkPassengerPhone(phone);
  const phoneError = phoneCheck.ok
    ? null
    : phoneCheck.reason === "length"
      ? t.phoneInvalid(phoneCheck.dialCode, phoneCheck.expectedDigits)
      : phoneCheck.reason === "no_code"
        ? t.phoneInvalid("", null)
        : t.phoneRequired;
  const emailError = !email.trim()
    ? t.emailRequired
    : !isValidPassengerEmail(email)
      ? t.emailInvalid
      : null;
  const defaultDialCode = lang === "bg" ? "+359" : "+380";

  const tripKind = openReturn
    ? t.tripKindOpen
    : selectedReturnTour
      ? t.tripKindRoundtrip
      : t.tripKindOneway;
  const totalNote = [
    t.passengersSummary(safeSeatCount - safeDiscountCount, safeDiscountCount),
    tripKind,
    openReturn || selectedReturnTour ? t.returnDiscountShort : "",
  ]
    .filter(Boolean)
    .join(", ");

  const focusField = (id: string) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    (node as HTMLInputElement).focus({ preventScroll: true });
  };

  const goToStep2 = () => {
    if (isStep1Done) {
      setActiveStep(2);
      return;
    }
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToStep3 = () => {
    if (step2Complete) {
      setActiveStep(3);
      return;
    }
    setShowStep2Errors(true);
    if (seatsDone && firstEmptyNameIndex >= 0) {
      focusField(`passenger-name-${firstEmptyNameIndex}`);
    } else {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const submitOrder = (action: "book" | "purchase") => {
    if (phoneError || emailError) {
      setShowContactErrors(true);
      focusField(phoneError ? "contact-phone" : "contact-email");
      return;
    }
    void handleAction(action);
  };

  const step1Hint = !selectedOutboundTour
    ? `${t.step1SummaryChoose}: ${t.outboundShort.toLowerCase()}`
    : returnRequired && !selectedReturnTour
      ? `${t.step1SummaryChoose}: ${t.inboundShort.toLowerCase()}`
      : null;

  const renderActionBar = () => {
    if (stepToRender === 1) {
      return (
        <FlowActionBar
          hint={outboundTours.length ? step1Hint : null}
          totalLabel={t.totalPassengers(safeSeatCount)}
          totalText={totalText}
          primary={{ label: t.nextStep2, onClick: goToStep2, muted: !isStep1Done }}
        />
      );
    }
    if (stepToRender === 2) {
      return (
        <FlowActionBar
          hint={step2Missing}
          totalLabel={t.total}
          totalText={totalText}
          primary={{ label: t.nextStep3, onClick: goToStep3, muted: !step2Complete }}
        />
      );
    }
    const payLabel = totalText ? t.payByCard(totalText) : t.buy;
    return (
      <FlowActionBar
        totalLabel={t.total}
        totalText={totalText}
        primary={{ label: payLabel, onClick: () => submitOrder("purchase"), tone: "pay", disabled: loading }}
        secondary={{ label: t.bookWithoutPay, onClick: () => submitOrder("book"), tone: "secondary", disabled: loading }}
        notes={
          <>
            <span className="block">{t.bookingNote}</span>
            <span className="block text-slate-500">
              {t.publicOfferConsent}{" "}
              <a
                href={publicOfferUrl}
                className="font-semibold text-slate-700 underline decoration-dotted underline-offset-2 hover:text-slate-900"
                target="_blank"
                rel="noreferrer"
              >
                {t.publicOfferLink}
              </a>
            </span>
          </>
        }
      />
    );
  };

  const renderStepHeader = (stepNumber: Step, title: string, summary: string) => {
    const showInlineSummary = !showStepNavigation;

    return (
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {showInlineSummary ? (
            <p className="text-sm text-slate-600">{summary}</p>
          ) : null}
        </div>
      </div>
    );
  };

  const renderStepContent = (step: Step) => {
    if (step === 1) {
      const outboundDirectionTitle = `${fromName} → ${toName}`;
      const returnDirectionTitle = `${toName} → ${fromName}`;

      return (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          {renderStepHeader(1, t.step1Title, step1Summary)}

          {outboundTours.length > 0 && (
            <TripList
              title={outboundDirectionTitle}
              heading={t.outboundShort}
              tours={outboundTours}
              selectedId={getTourId(selectedOutboundTour)}
              onSelect={onSelectOutbound}
              onChange={resetOutbound}
              fromName={fromName}
              toName={toName}
              lang={lang}
              seatCount={safeSeatCount}
              discountCount={safeDiscountCount}
              t={t}
            />
          )}

          {(returnDate || openReturn) && outboundTours.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                {t.returnModeTitle}
              </p>
              {returnDate && (
                <div className="grid grid-cols-2 gap-2">
                  {[false, true].map((isOpen) => {
                    const active = openReturn === isOpen;
                    return (
                      <button
                        key={String(isOpen)}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleReturnModeChange(isOpen)}
                        className={`min-h-[44px] rounded-xl px-3 text-sm font-semibold transition ${
                          active
                            ? "border-2 border-emerald-600 bg-emerald-50 text-emerald-900"
                            : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        {isOpen ? t.returnModeOpen : t.returnModeFixed}
                      </button>
                    );
                  })}
                </div>
              )}
              {openReturn && (
                <p className="rounded-xl bg-[#f3f8fe] px-3 py-2 text-xs text-slate-700">
                  {t.openReturnHint} · {t.returnDiscountShort}
                </p>
              )}
            </div>
          )}

          {returnRequired && returnTours.length > 0 && (
            <TripList
              title={returnDirectionTitle}
              heading={t.inboundShort}
              tours={returnTours}
              selectedId={getTourId(selectedReturnTour)}
              onSelect={onSelectReturn}
              onChange={resetReturn}
              fromName={toName}
              toName={fromName}
              lang={lang}
              seatCount={safeSeatCount}
              discountCount={safeDiscountCount}
              isReturn
              t={t}
            />
          )}

          {!loading && !outboundTours.length && !returnTours.length && (
            <p className="text-sm text-slate-600">{t.noResults}</p>
          )}
        </section>
      );
    }

    if (step === 2) {
      return (
        <StepTwo
          renderStepHeader={renderStepHeader}
          t={t}
          lang={lang}
          safeSeatCount={safeSeatCount}
          safeDiscountCount={safeDiscountCount}
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
          highlightNameIndex={highlightNameIndex}
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
        defaultDialCode={defaultDialCode}
        phoneError={showContactErrors ? phoneError : null}
        emailError={showContactErrors ? emailError : null}
        totalText={totalText}
        totalNote={totalNote}
        step3Summary={step3Summary}
      />
    );
  };

  if (ticket) {
    return (
      <div className="w-full space-y-4">
        {loading && <Loader />}
        {msg && (
          <div ref={alertRef}>
            <Alert type={msgType}>{msg}</Alert>
          </div>
        )}

        <BookedScreen
          t={t}
          lang={lang}
          ticket={ticket}
          openReturn={openReturn}
          canPay={canUseManualPay}
          onPay={handlePay}
          onDownload={() => handleTicketDownloadClick()}
        />

        <TicketDownloadPrompt
          visible={showDownloadPrompt && !!ticket}
          t={t}
          onDownload={() => handleTicketDownloadClick()}
          onClose={handlePromptClose}
        />
      </div>
    );
  }

  const hasFlow = showStepNavigation;

  return (
    <div ref={rootRef} className={`w-full scroll-mt-24 ${hasFlow ? "pb-44 lg:pb-0" : ""}`}>
      {loading && <Loader />}
      {msg && (
        <div ref={alertRef} className="mb-3">
          <Alert type={msgType}>{msg}</Alert>
        </div>
      )}

      {/* Слева прогресс и шаг, справа «Ваша поездка» с итогом и кнопкой.
          На телефоне итог и кнопка закреплены внизу экрана. */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)] lg:items-start">
        <div className="min-w-0 space-y-3">
          {showStepNavigation && (
            <StepProgress
              activeStep={stepToRender}
              steps={stepNavigation}
              onNavigate={handleStepNavigation}
              stepCounterLabel={t.stepCounter(stepToRender, stepNavigation.length)}
            />
          )}

          <div key={stepToRender} className="animate-step-fade">
            {renderStepContent(stepToRender)}
          </div>
        </div>

        {hasFlow && (
          <div className="space-y-3 lg:sticky lg:top-20">
            <OrderSummary
              t={t}
              lang={lang}
              fromName={fromName}
              toName={toName}
              outboundTour={selectedOutboundTour}
              returnTour={selectedReturnTour}
              returnRequired={returnRequired}
              openReturn={openReturn}
              priceLoading={quoteLoading}
              passengerSummaries={passengerSummaries}
              adultCount={safeSeatCount - safeDiscountCount}
              childCount={safeDiscountCount}
              phone={phone}
              email={email}
              totals={{ ...orderSummaryTotals, overall: displayTotal }}
              formatPrice={formatPrice}
            />
            {renderActionBar()}
          </div>
        )}
      </div>
    </div>
  );
}
