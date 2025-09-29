"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import Loader from "../common/Loader";
import Alert from "../common/Alert";
import { API } from "@/config";

import TripList from "./TripList";
import BookingPanel from "./BookingPanel";
import ElectronicTicket from "./ElectronicTicket";
import TicketDownloadPrompt from "./TicketDownloadPrompt";

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
  from: string;        // id остановки приходит как string
  to: string;          // id остановки приходит как string
  fromName: string;
  toName: string;
  date: string;        // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD | undefined
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
};

const dict: Record<NonNullable<Props["lang"]>, Dict> = {
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
  },
};

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
  const safeDiscountCount = Math.max(0, Math.min(discountCount, safeSeatCount));

  // Числовые id (один раз)
  const fromId = useMemo(() => Number(from), [from]);
  const toId = useMemo(() => Number(to), [to]);

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
  const [selectedOutboundTour, setSelectedOutboundTour] = useState<Tour | null>(null);
  const [selectedReturnTour, setSelectedReturnTour] = useState<Tour | null>(null);

  // Выбор мест
  const [selectedOutboundSeats, setSelectedOutboundSeats] = useState<number[]>([]);
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

  // При смене кол-ва мест — очищаем связанные стейты
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
        setTicket(null);
        setShowDownloadPrompt(false);

        const bothEmpty =
          !(outRes.data && outRes.data.length) &&
          (!(retRes.data && retRes.data.length) || !returnDate);

        if (bothEmpty) {
          setMsg(t.noResults);
          setMsgType("info");
        } else {
          setMsg("");
        }
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

  // Действия: бронь / покупка
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
      }

      setPurchaseId(pId);
      const ticketData: ElectronicTicketData = {
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
          seatReturn: selectedReturnTour ? selectedReturnSeats[idx] ?? null : null,
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
          ? `Билеты куплены! Purchase ID: ${pId}. Сумма: ${Number(total).toFixed(2)}`
          : `Билеты забронированы! Purchase ID: ${pId}. Сумма: ${Number(total).toFixed(2)}`
      );
      setMsgType("success");

      // сброс выбора
      setSelectedOutboundSeats([]);
      setSelectedReturnSeats([]);
      setPassengerNames(Array(safeSeatCount).fill(""));
      setPhone("");
      setEmail("");
      setExtraBaggageOutbound(Array(safeSeatCount).fill(false));
      setExtraBaggageReturn(Array(safeSeatCount).fill(false));
    } catch {
      setMsg(t.errAction);
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  // Оплата/отмена
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
    } catch {
      setMsg(t.errAction);
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };
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
    } catch {
      setMsg(t.errAction);
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketDownload = async () => {
    if (!ticket) {
      return;
    }

    try {
      await downloadTicketPdf(ticket.purchaseId, lang);
      setShowDownloadPrompt(false);
    } catch (error) {
      console.error(error);
      setMsg(t.errAction);
      setMsgType("error");
    }
  };

  const handleTicketDownloadClick = () => {
    void handleTicketDownload();
  };

  const handlePromptClose = () => {
    setShowDownloadPrompt(false);
  };

  const freeSeatsValue = (s: Tour["seats"]) =>
    typeof s === "number" ? s : s?.free ?? 0;

  return (
    <div className="container" style={{ padding: 20 }}>
      {loading && <Loader />}

      <Alert type={msgType}>{msg}</Alert>

      {/* РЕЙСЫ ТУДА */}
      {outboundTours.length > 0 && (
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

      {/* РЕЙСЫ ОБРАТНО */}
      {returnDate && returnTours.length > 0 && (
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

      {/* ВЫБОР МЕСТ + ФОРМА */}
      {selectedOutboundTour &&
        (!returnDate || (returnDate && selectedReturnTour)) && (
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
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
            extraBaggageOutbound={extraBaggageOutbound}
            setExtraBaggageOutbound={setExtraBaggageOutbound}
            extraBaggageReturn={extraBaggageReturn}
            setExtraBaggageReturn={setExtraBaggageReturn}
            handleAction={handleAction}
            handlePay={handlePay}
            handleCancel={handleCancel}
            purchaseId={purchaseId}
          />
        )}

      {ticket && (
        <ElectronicTicket
          ticket={ticket}
          t={t}
          onDownload={handleTicketDownloadClick}
        />
      )}
      <TicketDownloadPrompt
        visible={showDownloadPrompt && !!ticket}
        t={t}
        onDownload={handleTicketDownloadClick}
        onClose={handlePromptClose}
      />
    </div>
  );
}
