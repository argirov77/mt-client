"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";

import Loader from "../common/Loader";
import Alert from "../common/Alert";
import { API } from "@/config";

import TripList from "./TripList";
import BookingPanel from "./BookingPanel";
import ElectronicTicket from "./ElectronicTicket";
import TicketDownloadPrompt from "./TicketDownloadPrompt";
import ContactsAndPaymentStep from "./ContactsAndPaymentStep";

import { downloadTicketPdf } from "@/utils/ticketPdf";
import type { ElectronicTicketData } from "@/types/ticket";

// ======== Типы ========
export type Tour = {
  id: number;
  date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  seats: number | { free: number };
  layout_variant?: string | null;
};

type Props = {
  lang?: "ru" | "bg" | "en" | "ua";
  from: string;
  to: string;
  fromName: string;
  toName: string;
  date: string;
  returnDate?: string;
  seatCount: number;
  discountCount: number;
};

type Dict = {
  noResults: string;
  outbound: string;
  inbound: string;
  outboundShort: string;
  inboundShort: string;
  pick: string;
  chosen: string;
  freeSeats: (n: number) => string;
  book: string;
  buy: string;
  paid: string;
  canceled: string;
  pay: string;
  cancel: string;
  errSearch: string;
  errAction: string;
  loading: string;
  inRoute: string;
  departure: string;
  arrival: string;
  price: string;
  total: string;
  adults: string;
  discounted: string;
  ticketTitle: string;
  ticketNumber: string;
  ticketActionPurchase: string;
  ticketActionBook: string;
  ticketCreated: string;
  ticketStatus: string;
  ticketStatusPaid: string;
  ticketStatusPending: string;
  ticketStatusCanceled: string;
  ticketTotal: string;
  ticketContacts: string;
  ticketPassengers: string;
  ticketPassengerSeat: string;
  ticketPassengerSeatReturn: string;
  ticketPassengerBaggage: string;
  ticketPassengerBaggageReturn: string;
  ticketYes: string;
  ticketNo: string;
  ticketDownload: string;
  ticketOutbound: string;
  ticketReturn: string;
  ticketOpenOnline: string;
  ticketDownloadReady: string;
  ticketDownloadDismiss: string;
  contactsDescription: string;
  contactsAndPayment: string;
  contactsPhone: string;
  contactsEmail: string;
  bookingSummaryTitle: string;
  bookingSummaryPassengers: string;
  bookingSummarySeatsSelected: string;
  progressActive: string;
  progressUpcoming: string;
  progressDone: string;
  step1Title: string;
  step2Title: string;
  step3Title: string;
  step1ShortLabel: string;
  step2ShortLabel: string;
  step3ShortLabel: string;
  step1SummaryChoose: string;
  step2SummaryChooseSeats: string;
  step2SummaryFillNames: string;
  step2SummaryReady: string;
  step3SummaryEmpty: string;
  step3SummaryPending: string;
  step3SummaryPaid: string;
  step3SummaryCanceled: string;
  next: string;
};

const dict: Record<NonNullable<Props["lang"]>, Dict> = {
  // ... оставил без изменений, как у тебя ...
  ru: {
    noResults: "Рейсы не найдены",
    outbound: "Рейсы туда",
    inbound: "Рейсы обратно",
    outboundShort: "Туда",
    inboundShort: "Обратно",
    pick: "Выбрать",
    chosen: "Выбрано",
    freeSeats: (n) => `Свободно мест: ${n}`,
    book: "Бронь",
    buy: "Покупка",
    paid: "Бронирование оплачено!",
    canceled: "Бронирование отменено!",
    pay: "Оплатить",
    cancel: "Отменить",
    errSearch: "Ошибка поиска рейсов",
    errAction: "Ошибка операции",
    loading: "Загрузка…",
    inRoute: "В пути",
    departure: "Отправление",
    arrival: "Прибытие",
    price: "Цена",
    total: "Итого",
    adults: "Взрослых",
    discounted: "Льготных",
    ticketTitle: "Электронный билет",
    ticketNumber: "Номер заказа",
    ticketActionPurchase: "Покупка",
    ticketActionBook: "Бронирование",
    ticketCreated: "Дата оформления",
    ticketStatus: "Статус",
    ticketStatusPaid: "Оплачен",
    ticketStatusPending: "Ожидает оплаты",
    ticketStatusCanceled: "Отменён",
    ticketTotal: "Сумма",
    ticketContacts: "Контактные данные",
    ticketPassengers: "Пассажиры",
    ticketPassengerSeat: "Место туда",
    ticketPassengerSeatReturn: "Место обратно",
    ticketPassengerBaggage: "Багаж туда",
    ticketPassengerBaggageReturn: "Багаж обратно",
    ticketYes: "Да",
    ticketNo: "Нет",
    ticketDownload: "Скачать билет",
    ticketOutbound: "Маршрут туда",
    ticketReturn: "Маршрут обратно",
    ticketOpenOnline: "Открыть онлайн",
    ticketDownloadReady: "Ваш билет готов к скачиванию",
    ticketDownloadDismiss: "Скрыть",
    contactsDescription:
      "В стоимость входит 1 ручная кладь и 1 чемодан. Дополнительный багаж можно докупить на каждого пассажира отдельно.",
    contactsAndPayment: "Контакты и оплата",
    contactsPhone: "Телефон",
    contactsEmail: "Email",
    bookingSummaryTitle: "Сводка бронирования",
    bookingSummaryPassengers: "Пассажиров",
    bookingSummarySeatsSelected: "Места выбраны",
    progressActive: "Текущий шаг",
    progressUpcoming: "Впереди",
    progressDone: "Готово",
    step1Title: "Выбор рейса",
    step2Title: "Места и пассажиры",
    step3Title: "Контакты и оплата",
    step1ShortLabel: "Выбор рейса",
    step2ShortLabel: "Места и пассажиры",
    step3ShortLabel: "Контакты и оплата",
    step1SummaryChoose: "Выберите рейс",
    step2SummaryChooseSeats: "Выберите места",
    step2SummaryFillNames: "Заполните имена пассажиров",
    step2SummaryReady: "Готово к контактам",
    step3SummaryEmpty: "Укажите контакты и завершите бронирование",
    step3SummaryPending: "Есть бронирование, ожидает оплаты",
    step3SummaryPaid: "Билет оплачен",
    step3SummaryCanceled: "Бронирование отменено",
    next: "Далее",
  },
  en: {
    noResults: "No trips found",
    outbound: "Outbound trips",
    inbound: "Return trips",
    outboundShort: "Outbound",
    inboundShort: "Return",
    pick: "Select",
    chosen: "Selected",
    freeSeats: (n) => `Free seats: ${n}`,
    book: "Reserve",
    buy: "Purchase",
    paid: "Reservation paid!",
    canceled: "Reservation canceled!",
    pay: "Pay",
    cancel: "Cancel",
    errSearch: "Search error",
    errAction: "Operation error",
    loading: "Loading…",
    inRoute: "Duration",
    departure: "Departure",
    arrival: "Arrival",
    price: "Price",
    total: "Total",
    adults: "Adults",
    discounted: "Discounted",
    ticketTitle: "E-ticket",
    ticketNumber: "Order number",
    ticketActionPurchase: "Purchase",
    ticketActionBook: "Reservation",
    ticketCreated: "Issued on",
    ticketStatus: "Status",
    ticketStatusPaid: "Paid",
    ticketStatusPending: "Awaiting payment",
    ticketStatusCanceled: "Canceled",
    ticketTotal: "Amount",
    ticketContacts: "Contacts",
    ticketPassengers: "Passengers",
    ticketPassengerSeat: "Seat outbound",
    ticketPassengerSeatReturn: "Seat return",
    ticketPassengerBaggage: "Baggage outbound",
    ticketPassengerBaggageReturn: "Baggage return",
    ticketYes: "Yes",
    ticketNo: "No",
    ticketDownload: "Download ticket",
    ticketOutbound: "Outbound route",
    ticketReturn: "Return route",
    ticketOpenOnline: "Open online",
    ticketDownloadReady: "Your ticket is ready to download",
    ticketDownloadDismiss: "Dismiss",
    contactsDescription:
      "The price includes 1 cabin bag and 1 checked bag. Extra baggage can be purchased for each passenger individually.",
    contactsAndPayment: "Contacts & payment",
    contactsPhone: "Phone",
    contactsEmail: "Email",
    bookingSummaryTitle: "Booking summary",
    bookingSummaryPassengers: "Passengers",
    bookingSummarySeatsSelected: "Seats selected",
    progressActive: "In progress",
    progressUpcoming: "Upcoming",
    progressDone: "Done",
    step1Title: "Select trip",
    step2Title: "Seats & passengers",
    step3Title: "Contacts & payment",
    step1ShortLabel: "Select trip",
    step2ShortLabel: "Seats & passengers",
    step3ShortLabel: "Contacts & payment",
    step1SummaryChoose: "Choose a trip",
    step2SummaryChooseSeats: "Pick seats",
    step2SummaryFillNames: "Fill passenger names",
    step2SummaryReady: "Ready for contacts",
    step3SummaryEmpty: "Add contacts to finish booking",
    step3SummaryPending: "Booking pending payment",
    step3SummaryPaid: "Ticket paid",
    step3SummaryCanceled: "Booking canceled",
    next: "Next",
  },
  bg: {
    noResults: "Няма намерени курсове",
    outbound: "Курсове натам",
    inbound: "Курсове обратно",
    outboundShort: "Натам",
    inboundShort: "Обратно",
    pick: "Избор",
    chosen: "Избрано",
    freeSeats: (n) => `Свободни места: ${n}`,
    book: "Резервация",
    buy: "Покупка",
    paid: "Резервацията е платена!",
    canceled: "Резервацията е отменена!",
    pay: "Плати",
    cancel: "Отмени",
    errSearch: "Грешка при търсене",
    errAction: "Грешка при операция",
    loading: "Зареждане…",
    inRoute: "В път",
    departure: "Отпътуване",
    arrival: "Пристигане",
    price: "Цена",
    total: "Общо",
    adults: "Възрастни",
    discounted: "С намаление",
    ticketTitle: "Електронен билет",
    ticketNumber: "Номер на поръчка",
    ticketActionPurchase: "Покупка",
    ticketActionBook: "Резервация",
    ticketCreated: "Дата на издаване",
    ticketStatus: "Статус",
    ticketStatusPaid: "Платен",
    ticketStatusPending: "Очаква плащане",
    ticketStatusCanceled: "Отменен",
    ticketTotal: "Сума",
    ticketContacts: "Контакти",
    ticketPassengers: "Пътници",
    ticketPassengerSeat: "Място натам",
    ticketPassengerSeatReturn: "Място обратно",
    ticketPassengerBaggage: "Багаж натам",
    ticketPassengerBaggageReturn: "Багаж обратно",
    ticketYes: "Да",
    ticketNo: "Не",
    ticketDownload: "Изтегли билет",
    ticketOutbound: "Маршрут натам",
    ticketReturn: "Маршрут обратно",
    ticketOpenOnline: "Отвори онлайн",
    ticketDownloadReady: "Вашият билет е готов за изтегляне",
    ticketDownloadDismiss: "Скрий",
    contactsDescription:
      "В цената са включени 1 ръчен багаж и 1 куфар. Допълнителен багаж може да се добави за всеки пътник отделно.",
    contactsAndPayment: "Контакти и плащане",
    contactsPhone: "Телефон",
    contactsEmail: "Email",
    bookingSummaryTitle: "Сводка на резервацията",
    bookingSummaryPassengers: "Пътници",
    bookingSummarySeatsSelected: "Местата са избрани",
    progressActive: "В процес",
    progressUpcoming: "Предстои",
    progressDone: "Готово",
    step1Title: "Избор на курс",
    step2Title: "Места и пътници",
    step3Title: "Контакти и плащане",
    step1ShortLabel: "Избор на курс",
    step2ShortLabel: "Места и пътници",
    step3ShortLabel: "Контакти и плащане",
    step1SummaryChoose: "Изберете курс",
    step2SummaryChooseSeats: "Изберете места",
    step2SummaryFillNames: "Въведете имената на пътниците",
    step2SummaryReady: "Готово за контакти",
    step3SummaryEmpty: "Добавете контакти, за да завършите",
    step3SummaryPending: "Резервация в очакване на плащане",
    step3SummaryPaid: "Билетът е платен",
    step3SummaryCanceled: "Резервацията е отменена",
    next: "Напред",
  },
  ua: {
    noResults: "Рейси не знайдено",
    outbound: "Рейси туди",
    inbound: "Рейси назад",
    outboundShort: "Туди",
    inboundShort: "Назад",
    pick: "Обрати",
    chosen: "Обрано",
    freeSeats: (n) => `Вільних місць: ${n}`,
    book: "Бронювання",
    buy: "Купівля",
    paid: "Бронювання оплачено!",
    canceled: "Бронювання скасовано!",
    pay: "Оплатити",
    cancel: "Скасувати",
    errSearch: "Помилка пошуку рейсів",
    errAction: "Помилка операції",
    loading: "Завантаження…",
    inRoute: "У дорозі",
    departure: "Відправлення",
    arrival: "Прибуття",
    price: "Ціна",
    total: "Разом",
    adults: "Дорослих",
    discounted: "Пільгових",
    ticketTitle: "Електронний квиток",
    ticketNumber: "Номер замовлення",
    ticketActionPurchase: "Покупка",
    ticketActionBook: "Бронювання",
    ticketCreated: "Дата оформлення",
    ticketStatus: "Статус",
    ticketStatusPaid: "Сплачено",
    ticketStatusPending: "Очікує оплату",
    ticketStatusCanceled: "Скасовано",
    ticketTotal: "Сума",
    ticketContacts: "Контакти",
    ticketPassengers: "Пасажири",
    ticketPassengerSeat: "Місце туди",
    ticketPassengerSeatReturn: "Місце назад",
    ticketPassengerBaggage: "Багаж туди",
    ticketPassengerBaggageReturn: "Багаж назад",
    ticketYes: "Так",
    ticketNo: "Ні",
    ticketDownload: "Завантажити квиток",
    ticketOutbound: "Маршрут туди",
    ticketReturn: "Маршрут назад",
    ticketOpenOnline: "Відкрити онлайн",
    ticketDownloadReady: "Ваш квиток готовий до завантаження",
    ticketDownloadDismiss: "Приховати",
    contactsDescription:
      "У вартість входить 1 одиниця ручної поклажі та 1 валіза. Додатковий багаж можна докупити окремо на кожного пасажира.",
    contactsAndPayment: "Контакти та оплата",
    contactsPhone: "Телефон",
    contactsEmail: "Email",
    bookingSummaryTitle: "Зведення бронювання",
    bookingSummaryPassengers: "Пасажирів",
    bookingSummarySeatsSelected: "Місця обрано",
    progressActive: "У процесі",
    progressUpcoming: "Попереду",
    progressDone: "Готово",
    step1Title: "Вибір рейсу",
    step2Title: "Місця та пасажири",
    step3Title: "Контакти та оплата",
    step1ShortLabel: "Вибір рейсу",
    step2ShortLabel: "Місця та пасажири",
    step3ShortLabel: "Контакти та оплата",
    step1SummaryChoose: "Оберіть рейс",
    step2SummaryChooseSeats: "Оберіть місця",
    step2SummaryFillNames: "Заповніть імена пасажирів",
    step2SummaryReady: "Готово до контактів",
    step3SummaryEmpty: "Додайте контакти, щоб завершити бронювання",
    step3SummaryPending: "Є бронювання, очікує оплату",
    step3SummaryPaid: "Квиток оплачено",
    step3SummaryCanceled: "Бронювання скасовано",
    next: "Далі",
  },
};

type Step = 1 | 2 | 3;

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
  const t = dict[lang];

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

  const step1Ref = useRef<HTMLDivElement | null>(null);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const step3Ref = useRef<HTMLDivElement | null>(null);

  const scrollToStep = useCallback(
    (ref: React.RefObject<HTMLDivElement | null>) => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    []
  );

  const goToStep = useCallback(
    (step: Step, ref: React.RefObject<HTMLDivElement | null>) => {
      setActiveStep(step);
      scrollToStep(ref);
    },
    [scrollToStep]
  );

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

        setOutboundTours(outRes.data || []);
        setReturnTours(retRes.data || []);
        setSelectedOutboundTour(null);
        setSelectedReturnTour(null);
        setSelectedOutboundSeats([]);
        setSelectedReturnSeats([]);

        const bothEmpty =
          !(outRes.data && outRes.data.length) &&
          (!(retRes.data && retRes.data.length) || !returnDate);

        if (bothEmpty) {
          setMsg(t.noResults);
          setMsgType("info");
        } else {
          setMsg("");
        }

        // после загрузки рейсов — скроллим к шагу 1
        scrollToStep(step1Ref);
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
  }, [fromId, toId, date, returnDate, safeSeatCount, t, scrollToStep]);

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
    if (activeStep < 2) {
      goToStep(2, step2Ref);
      return;
    }
    scrollToStep(step2Ref);
  }, [
    activeStep,
    goToStep,
    hasReturnSection,
    scrollToStep,
    selectedOutboundTour,
    selectedReturnTour,
  ]);

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
      goToStep(3, step3Ref);
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
      goToStep(3, step3Ref);
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
      goToStep(3, step3Ref);
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

  const freeSeatsValue = (s: Tour["seats"]) =>
    typeof s === "number" ? s : s?.free ?? 0;

  // ====== РЕЗЮМЕ ДЛЯ ХЕДЕРОВ ШАГОВ ======

  const returnRequired = Boolean(returnDate && hasReturnSection);
  const outboundSeatNumbers = useMemo(() => {
    if (ticket?.outbound?.seatNumbers?.length) {
      return ticket.outbound.seatNumbers;
    }
    return selectedOutboundSeats;
  }, [selectedOutboundSeats, ticket]);

  const returnSeatNumbers = useMemo(() => {
    if (ticket?.inbound?.seatNumbers?.length) {
      return ticket.inbound.seatNumbers;
    }
    return selectedReturnSeats;
  }, [selectedReturnSeats, ticket]);

  const seatsDone =
    outboundSeatNumbers.length === safeSeatCount &&
    (!returnRequired || returnSeatNumbers.length === safeSeatCount);
  const namesDone =
    passengerNames.filter((n) => !!n).length === safeSeatCount || Boolean(ticket);
  const step2Complete = Boolean(
    ticket ||
      (!!selectedOutboundTour && (!returnRequired || !!selectedReturnTour) && seatsDone && namesDone)
  );

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
    if (!namesDone) return t.step2SummaryFillNames;
    return t.step2SummaryReady;
  }, [namesDone, seatsDone, selectedOutboundTour, t]);

  const step3Summary = useMemo(() => {
    if (ticket?.status === "paid") return t.step3SummaryPaid;
    if (ticket?.status === "canceled") return t.step3SummaryCanceled;
    if (ticket || purchaseId) return t.step3SummaryPending;
    return t.step3SummaryEmpty;
  }, [purchaseId, ticket, t]);

  const outboundTripSummary = useMemo(() => {
    if (!selectedOutboundTour) return null;
    return {
      route: `${fromName} → ${toName}`,
      schedule: `${selectedOutboundTour.date} · ${selectedOutboundTour.departure_time} – ${selectedOutboundTour.arrival_time}`,
    };
  }, [fromName, selectedOutboundTour, toName]);

  const returnTripSummary = useMemo(() => {
    if (!selectedReturnTour) return null;
    return {
      route: `${toName} → ${fromName}`,
      schedule: `${selectedReturnTour.date} · ${selectedReturnTour.departure_time} – ${selectedReturnTour.arrival_time}`,
    };
  }, [fromName, selectedReturnTour, toName]);

  const passengerSummary = useMemo(
    () => `${safeSeatCount} ${t.bookingSummaryPassengers}`,
    [safeSeatCount, t]
  );

  const seatsStatusLabel = seatsDone ? t.bookingSummarySeatsSelected : t.step2SummaryChooseSeats;
  const outboundSeatsText = seatsDone
    ? outboundSeatNumbers.length
      ? outboundSeatNumbers.join(", ")
      : "—"
    : "—";

  const returnSeatsText = seatsDone
    ? returnRequired
      ? returnSeatNumbers.length
        ? returnSeatNumbers.join(", ")
        : "—"
      : null
    : returnRequired
      ? "—"
      : null;

  const paymentActionLabel = ticket
    ? ticket.action === "purchase"
      ? t.ticketActionPurchase
      : t.ticketActionBook
    : "—";

  const paymentStatusLabel = ticket?.status
    ? ticket.status === "paid"
      ? t.ticketStatusPaid
      : ticket.status === "canceled"
        ? t.ticketStatusCanceled
        : t.ticketStatusPending
    : purchaseId
      ? t.ticketStatusPending
      : "—";

  const paymentTotalLabel =
    ticket?.total != null ? `${Number(ticket.total).toFixed(2)}` : "—";

  const handleStepOpen = (
    step: Step,
    ref: React.RefObject<HTMLDivElement>
  ) => {
    if (step === 2 && (!selectedOutboundTour || (returnRequired && !selectedReturnTour))) {
      goToStep(1, step1Ref);
      return;
    }
    if (step === 3 && !step2Complete) {
      goToStep(2, step2Ref);
      return;
    }
    goToStep(step, ref);
  };

  const handleStepNavigation = (step: Step) => {
    const targetRef = step === 1 ? step1Ref : step === 2 ? step2Ref : step3Ref;
    handleStepOpen(step, targetRef);
  };

  const collapsibleBodyClass = (isOpen: boolean) =>
    `transition-all duration-300 ease-in-out ${
      isOpen
        ? "max-h-[5000px] opacity-100 translate-y-0"
        : "max-h-0 opacity-0 -translate-y-2 overflow-hidden pointer-events-none"
    }`;

  const renderProgressBar = () => {
    const steps: { id: Step; label: string; state: "active" | "done" | "future" }[] = [
      {
        id: 1,
        label: t.step1ShortLabel,
        state: activeStep === 1 ? "active" : isStep1Done ? "done" : "future",
      },
      {
        id: 2,
        label: t.step2ShortLabel,
        state:
          activeStep === 2
            ? "active"
            : activeStep > 2 || isStep2Done
              ? "done"
              : "future",
      },
      {
        id: 3,
        label: t.step3ShortLabel,
        state: activeStep === 3 ? "active" : isStep3Done ? "done" : "future",
      },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          {steps.map((step, idx) => {
            const isActive = step.state === "active";
            const isDone = step.state === "done";
            const circleClasses = isDone
              ? "bg-emerald-500 text-white border-emerald-500"
              : isActive
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-slate-200 text-slate-600 border-slate-300";

            const connectorState = isDone
              ? "bg-emerald-400"
              : isActive
                ? "bg-sky-300"
                : "bg-slate-200";

            const statusLabel =
              step.state === "future"
                ? t.progressUpcoming
                : step.state === "done"
                  ? t.progressDone
                  : t.progressActive;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => handleStepNavigation(step.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 text-left transition hover:bg-slate-50"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold shadow-sm transition ${circleClasses}`}
                  >
                    {isDone && !isActive ? "✓" : step.id}
                  </span>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-semibold ${
                        isActive ? "text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {step.label}
                    </div>
                    <p className="text-xs text-slate-500">{statusLabel}</p>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`hidden h-0.5 flex-1 md:block ${connectorState}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStepHeader = (
    step: Step,
    title: string,
    summary: string,
    ref: React.RefObject<HTMLDivElement>
  ) => {
    const isActive = activeStep === step;
    return (
      <button
        type="button"
        className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
          isActive
            ? "border-sky-400 bg-sky-50 text-sky-900 shadow-sm"
            : "border-slate-200 bg-white text-slate-800 hover:border-sky-200"
        }`}
        onClick={() => handleStepOpen(step, ref)}
      >
        <div className="flex items-center gap-3">
          <span
            className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
              isActive ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {step}
          </span>
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-slate-500">{summary}</div>
          </div>
        </div>
        {!isActive && (
          <span className="text-xs text-sky-600">
            {lang === "en" ? "Open" : "Открыть"}
          </span>
        )}
      </button>
    );
  };

  const renderBookingSummary = () => {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {t.bookingSummaryTitle}
          </h3>
          {ticket?.ticketNumber && (
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {t.ticketNumber}: {ticket.ticketNumber}
            </span>
          )}
        </div>

        <div className="mt-3 space-y-4 text-sm text-slate-800">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">{t.step1ShortLabel}</p>
            {outboundTripSummary ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="font-semibold text-slate-900">{outboundTripSummary.route}</div>
                <div className="text-xs text-slate-600">{outboundTripSummary.schedule}</div>
              </div>
            ) : (
              <p className="text-slate-500">{t.step1SummaryChoose}</p>
            )}

            {returnRequired && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="font-semibold text-slate-900">
                  {returnTripSummary?.route || t.inboundShort}
                </div>
                <div className="text-xs text-slate-600">
                  {returnTripSummary?.schedule || t.step1SummaryChoose}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg bg-white px-1 py-1 text-sm">
              <span className="text-slate-600">{t.bookingSummaryPassengers}</span>
              <span className="font-semibold text-slate-900">{passengerSummary}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">{t.step2ShortLabel}</p>
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t.outboundShort}</span>
                <span className="font-semibold text-slate-900">{outboundSeatsText}</span>
              </div>
              {returnRequired && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{t.inboundShort}</span>
                  <span className="font-semibold text-slate-900">{returnSeatsText ?? "—"}</span>
                </div>
              )}
              <div className="text-xs font-semibold text-emerald-700">{seatsStatusLabel}</div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">{t.contactsAndPayment}</p>
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t.ticketStatus}</span>
                <span className="font-semibold text-slate-900">{paymentStatusLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t.ticketActionPurchase}</span>
                <span className="font-semibold text-slate-900">{paymentActionLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t.total}</span>
                <span className="font-semibold text-slate-900">{paymentTotalLabel}</span>
              </div>
            </div>
            {ticket?.ticketNumber && (
              <button
                type="button"
                onClick={() => handleTicketDownloadClick(ticket.ticketNumber)}
                className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
              >
                {t.ticketDownload}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTicketSection = () => {
    if (!ticket) return null;
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
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
  };


  useEffect(() => {
    if (!selectedOutboundTour) return;
    if (returnRequired && !selectedReturnTour) return;
    if (activeStep < 2) {
      goToStep(2, step2Ref);
    }
  }, [activeStep, goToStep, returnRequired, selectedOutboundTour, selectedReturnTour]);

  const showStep1Body = activeStep === 1;
  const showStep2Body =
    activeStep === 2 && selectedOutboundTour && (!returnRequired || selectedReturnTour);
  const showStep3Body = activeStep === 3 && !ticket;

  const outboundListVisible = !selectedOutboundTour && outboundTours.length > 0;
  const returnListVisible =
    !!selectedOutboundTour && returnRequired && !selectedReturnTour && returnTours.length > 0;

  const resetOutbound = () => {
    setSelectedOutboundTour(null);
    setSelectedReturnTour(null);
    setSelectedOutboundSeats([]);
    setSelectedReturnSeats([]);
    goToStep(1, step1Ref);
  };

  const resetReturn = () => {
    setSelectedReturnTour(null);
    setSelectedReturnSeats([]);
    goToStep(1, step1Ref);
  };

  const handleReadyForContacts = () => {
    goToStep(3, step3Ref);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      {loading && <Loader />}
      {msg && <Alert type={msgType}>{msg}</Alert>}

      <div className="grid grid-cols-1 items-start gap-4 md:gap-6 md:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          {renderProgressBar()}

          {ticket ? (
            renderTicketSection()
          ) : (
            <div className="space-y-5">
              <div ref={step1Ref} className="space-y-3">
                {renderStepHeader(1, t.step1Title, step1Summary, step1Ref)}

                <div
                  className={collapsibleBodyClass(showStep1Body)}
                  aria-hidden={!showStep1Body}
                >
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-md">
                    {outboundListVisible && (
                      <TripList
                        title={t.outbound}
                        tours={outboundTours}
                        selectedId={selectedOutboundTour?.id}
                        onSelect={onSelectOutbound}
                        freeSeatsValue={freeSeatsValue}
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
                        title={t.inbound}
                        tours={returnTours}
                        selectedId={selectedReturnTour?.id}
                        onSelect={onSelectReturn}
                        freeSeatsValue={freeSeatsValue}
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
                            {lang === "en" ? "Change outbound" : "Изменить рейсы"}
                          </button>
                          {returnRequired && selectedReturnTour && (
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                              onClick={resetReturn}
                            >
                              {lang === "en" ? "Change return" : "Изменить обратно"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {!outboundTours.length && !returnTours.length && (
                      <p className="text-sm text-slate-500">{t.noResults}</p>
                    )}
                  </div>
                </div>
              </div>

              <div ref={step2Ref} className="space-y-3">
                {renderStepHeader(2, t.step2Title, step2Summary, step2Ref)}

                <div
                  className={collapsibleBodyClass(showStep2Body)}
                  aria-hidden={!showStep2Body}
                >
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-md">
                    {selectedOutboundTour ? (
                      <BookingPanel
                        t={t}
                        seatCount={safeSeatCount}
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
                        onReadyForContacts={handleReadyForContacts}
                      />
                    ) : (
                      <p className="text-sm text-slate-600">
                        {t.outboundShort} {lang === "en" ? "not selected" : "не выбран"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div ref={step3Ref} className="space-y-3">
                {renderStepHeader(3, t.contactsAndPayment, step3Summary, step3Ref)}

                <div
                  className={collapsibleBodyClass(showStep3Body)}
                  aria-hidden={!showStep3Body}
                >
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-md">
                    <ContactsAndPaymentStep
                      t={t}
                      phone={phone}
                      setPhone={setPhone}
                      email={email}
                      setEmail={setEmail}
                      purchaseId={purchaseId}
                      ticket={ticket}
                      handleAction={handleAction}
                      handlePay={handlePay}
                      onDownloadTicket={handleTicketDownloadClick}
                    />
                    <TicketDownloadPrompt
                      visible={showDownloadPrompt && !!ticket}
                      t={t}
                      onDownload={() => handleTicketDownloadClick()}
                      onClose={handlePromptClose}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">{renderBookingSummary()}</div>
      </div>
    </div>
  );
}
