"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  baggageIncludedTitle: string;
  baggageIncludedCabin: string;
  baggageIncludedChecked: string;
  baggageIncludedNote: string;
  extraBaggagePrice: string;
  addExtraBaggage: string;
  addedExtraBaggage: string;
  removeExtraBaggage: string;
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
  subtotal: string;
  stepLabel: (step: number) => string;
  stepCounter: (current: number, total: number) => string;
  changeOutbound: string;
  changeReturn: string;
  outboundNotSelected: string;
  orderSummaryTitle: string;
  orderSummaryNote: string;
  liveLabel: string;
  seatsLabel: string;
  seatsPending: string;
  passengerLabel: (index: number) => string;
  extraBaggageHeading: string;
  configureBaggage: string;
  pricePerBagLabel: string;
  baggageToggleHide: string;
  baggageIncludedBadge: string;
  baggageCollapsedHint: string;
  addBagAria: string;
  removeBagAria: string;
};

const DISCOUNT_RATE = 0.05;

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
    baggageIncludedTitle: "Входит в билет",
    baggageIncludedCabin: "1 ручная кладь (7 кг) включена",
    baggageIncludedChecked: "1 чемодан (10–20 кг) включен",
    baggageIncludedNote:
      "Дополнительный багаж можно добавить отдельно для каждого пассажира.",
    extraBaggagePrice: "+€10",
    addExtraBaggage: "Добавить багаж",
    addedExtraBaggage: "Багаж добавлен",
    removeExtraBaggage: "Убрать багаж",
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
    subtotal: "Промежуточно",
    stepLabel: (step) => `Шаг ${step}`,
    stepCounter: (current, total) => `Шаг ${current} / ${total}`,
    changeOutbound: "Изменить рейсы",
    changeReturn: "Изменить обратно",
    outboundNotSelected: "не выбран",
    orderSummaryTitle: "Сводка заказа",
    orderSummaryNote: "Обновляется по мере заполнения",
    liveLabel: "Онлайн",
    seatsLabel: "Места",
    seatsPending: "Не выбраны",
    seatSelectionTitle: "Выберите места",
    openSeatPicker: "Выбрать места",
    hideSeatPicker: "Скрыть схему",
    selectedSeatsLabel: (selected, total) => `Выбрано ${selected} из ${total}`,
    passengersTitle: "Пассажиры",
    passengersHint: "Укажите имя и фамилию как в документе.",
    passengerPlaceholder: "Имя Фамилия",
    errorSelectSeat: "Выберите место для ОТ - ДО (туда или обратно)",
    errorFillName: "Заполните Имя и фамилию пассажира",
    passengerLabel: (index) => `Пассажир ${index}`,
    extraBaggageHeading: "Дополнительный багаж",
    configureBaggage: "Добавьте места багажа для каждого пассажира",
    pricePerBagLabel: "Цена за место",
    baggageToggleHide: "Свернуть",
    baggageIncludedBadge: "Багаж включён",
    baggageCollapsedHint: "Нажмите «Добавить багаж», чтобы настроить багаж для пассажиров.",
    addBagAria: "Добавить багаж",
    removeBagAria: "Убрать багаж",
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
    baggageIncludedTitle: "Included with your ticket",
    baggageIncludedCabin: "1 cabin bag (7 kg) included",
    baggageIncludedChecked: "1 checked bag (10–20 kg) included",
    baggageIncludedNote: "Extra baggage can be added per passenger.",
    extraBaggagePrice: "+€10",
    addExtraBaggage: "Add extra baggage",
    addedExtraBaggage: "Added",
    removeExtraBaggage: "Remove",
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
    subtotal: "Subtotal",
    stepLabel: (step) => `Step ${step}`,
    stepCounter: (current, total) => `Step ${current} / ${total}`,
    changeOutbound: "Change outbound",
    changeReturn: "Change return",
    outboundNotSelected: "not selected",
    orderSummaryTitle: "Order summary",
    orderSummaryNote: "Updates as you fill the form",
    liveLabel: "Live",
    seatsLabel: "Seats",
    seatsPending: "Pending",
    seatSelectionTitle: "Pick seats",
    openSeatPicker: "Choose seats",
    hideSeatPicker: "Hide seat map",
    selectedSeatsLabel: (selected, total) => `Selected ${selected}/${total}`,
    passengersTitle: "Passengers",
    passengersHint: "Enter first and last name as in the document.",
    passengerPlaceholder: "First and last name",
    errorSelectSeat: "Choose a seat for your trip (outbound or return)",
    errorFillName: "Fill in the passenger's first and last name",
    passengerLabel: (index) => `Passenger ${index}`,
    extraBaggageHeading: "Extra baggage",
    configureBaggage: "Configure baggage for each passenger",
    pricePerBagLabel: "€ per bag",
    baggageToggleHide: "Hide",
    baggageIncludedBadge: "Bags included",
    baggageCollapsedHint: 'Click "Add baggage" to configure checked bags for your passengers.',
    addBagAria: "Add bag",
    removeBagAria: "Remove bag",
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
    baggageIncludedTitle: "Включено в билета",
    baggageIncludedCabin: "1 ръчна чанта (7 кг) включена",
    baggageIncludedChecked: "1 куфар (10–20 кг) включен",
    baggageIncludedNote:
      "Допълнителен багаж може да се добави за всеки пътник отделно.",
    extraBaggagePrice: "+€10",
    addExtraBaggage: "Добави багаж",
    addedExtraBaggage: "Добавено",
    removeExtraBaggage: "Премахни",
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
    subtotal: "Междинно",
    stepLabel: (step) => `Стъпка ${step}`,
    stepCounter: (current, total) => `Стъпка ${current} / ${total}`,
    changeOutbound: "Промени курса натам",
    changeReturn: "Промени обратно",
    outboundNotSelected: "не е избран",
    orderSummaryTitle: "Обобщение на поръчката",
    orderSummaryNote: "Актуализира се при попълване",
    liveLabel: "На живо",
    seatsLabel: "Места",
    seatsPending: "Неизбрани",
    seatSelectionTitle: "Изберете места",
    openSeatPicker: "Избор на места",
    hideSeatPicker: "Скрий схемата",
    selectedSeatsLabel: (selected, total) => `Избрани ${selected}/${total}`,
    passengersTitle: "Пътници",
    passengersHint: "Въведете име и фамилия както в документа.",
    passengerPlaceholder: "Име и фамилия",
    errorSelectSeat: "Изберете място за курса натам или обратно",
    errorFillName: "Попълнете името и фамилията на пътника",
    passengerLabel: (index) => `Пътник ${index}`,
    extraBaggageHeading: "Допълнителен багаж",
    configureBaggage: "Настройте багажа за всеки пътник",
    pricePerBagLabel: "Цена за багаж",
    baggageToggleHide: "Скрий",
    baggageIncludedBadge: "Багаж включен",
    baggageCollapsedHint: "Използвайте «Добави багаж», за да настроите куфарите за пътниците.",
    addBagAria: "Добави багаж",
    removeBagAria: "Премахни багаж",
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
    baggageIncludedTitle: "Входить у квиток",
    baggageIncludedCabin: "1 ручна поклажа (7 кг) включена",
    baggageIncludedChecked: "1 валіза (10–20 кг) включена",
    baggageIncludedNote:
      "Додатковий багаж можна додати окремо для кожного пасажира.",
    extraBaggagePrice: "+€10",
    addExtraBaggage: "Додати багаж",
    addedExtraBaggage: "Додано",
    removeExtraBaggage: "Прибрати",
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
    subtotal: "Проміжно",
    stepLabel: (step) => `Крок ${step}`,
    stepCounter: (current, total) => `Крок ${current} / ${total}`,
    changeOutbound: "Змінити рейси",
    changeReturn: "Змінити назад",
    outboundNotSelected: "не обрано",
    orderSummaryTitle: "Зведення замовлення",
    orderSummaryNote: "Оновлюється під час заповнення",
    liveLabel: "Онлайн",
    seatsLabel: "Місця",
    seatsPending: "Не вибрані",
    seatSelectionTitle: "Оберіть місця",
    openSeatPicker: "Вибрати місця",
    hideSeatPicker: "Приховати схему",
    selectedSeatsLabel: (selected, total) => `Обрано ${selected}/${total}`,
    passengersTitle: "Пасажири",
    passengersHint: "Вкажіть ім'я та прізвище як у документі.",
    passengerPlaceholder: "Ім'я та прізвище",
    errorSelectSeat: "Оберіть місце для поїздки (туди чи назад)",
    errorFillName: "Заповніть ім'я та прізвище пасажира",
    passengerLabel: (index) => `Пасажир ${index}`,
    extraBaggageHeading: "Додатковий багаж",
    configureBaggage: "Налаштуйте багаж для кожного пасажира",
    pricePerBagLabel: "Ціна за місце",
    baggageToggleHide: "Згорнути",
    baggageIncludedBadge: "Багаж включено",
    baggageCollapsedHint: "Натисніть «Додати багаж», щоб налаштувати багаж для пасажирів.",
    addBagAria: "Додати багаж",
    removeBagAria: "Прибрати багаж",
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
    if (!namesDone) return t.step2SummaryFillNames;
    return t.step2SummaryReady;
  }, [namesDone, seatsDone, selectedOutboundTour, t]);

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

  const renderProgressBar = () => {
    const steps: { id: Step; label: string; summary: string; state: "active" | "done" | "future" }[] = [
      {
        id: 1,
        label: t.step1ShortLabel,
        summary: step1Summary,
        state: activeStep === 1 ? "active" : isStep1Done ? "done" : "future",
      },
      {
        id: 2,
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
        id: 3,
        label: t.step3ShortLabel,
        summary: step3Summary,
        state: activeStep === 3 ? "active" : isStep3Done ? "done" : "future",
      },
    ];

    const progressPercent = ((activeStep - 1) / Math.max(steps.length - 1, 1)) * 100;
    const activeIndex = Math.max(
      0,
      steps.findIndex((step) => step.state === "active")
    );
    const underlineWidth = `${100 / Math.max(steps.length, 1)}%`;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 pb-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 transition-all duration-400 ease-in-out"
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {t.stepCounter(activeStep, steps.length)}
          </span>
        </div>
        <div className="relative mt-3">
          <div className="grid gap-2 pb-3 sm:grid-cols-3 sm:gap-3">
            {steps.map((step) => {
              const isActive = step.state === "active";
              const isDone = step.state === "done";
              const isFuture = step.state === "future";

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepNavigation(step.id)}
                  className={`group flex w-full transform flex-col items-start gap-2 rounded-xl border p-3 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md duration-400 ease-in-out ${
                    isActive
                      ? "scale-[1.04] border-sky-400 bg-sky-50"
                      : isDone
                        ? "hover:scale-[1.01] border-emerald-100 bg-emerald-50"
                        : "hover:scale-[1.01] border-slate-200 bg-white"
                  } ${isFuture ? "opacity-75" : ""}`}
                >
                  <div className="flex w-full items-center gap-2">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-sky-600 text-white"
                          : isDone
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isDone && !isActive ? "✓" : step.id}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{step.label}</div>
                      <div className="truncate text-xs text-slate-500">{step.summary}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-full bg-slate-100">
            <div
              className="absolute bottom-0 left-0 h-[3px] rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 transition-transform duration-400 ease-in-out"
              style={{
                width: underlineWidth,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
          </div>
        </div>
      </div>
    );
  };

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

  const formatTimeLabel = useCallback(
    (value: string) => {
      const date = new Date(`1970-01-01T${value}`);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    },
    [locale]
  );

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

  const passengerList = useMemo(
    () => passengerNames.map((name) => name.trim()).filter(Boolean),
    [passengerNames]
  );

  const extraBaggageOutboundCount = useMemo(
    () => extraBaggageOutbound.filter(Boolean).length,
    [extraBaggageOutbound]
  );
  const extraBaggageReturnCount = useMemo(
    () => extraBaggageReturn.filter(Boolean).length,
    [extraBaggageReturn]
  );

  const formatPrice = useCallback((value: number) => `${value.toFixed(2)} ₴`, []);
  const showStepNavigation = Boolean(selectedOutboundTour);

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
      const stickyDirectionTitle = returnListVisible ? returnDirectionTitle : outboundDirectionTitle;

      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          {renderStepHeader(1, t.step1Title, step1Summary)}

          <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <span>{stickyDirectionTitle}</span>
          </div>

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
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          {renderStepHeader(2, t.step2Title, step2Summary)}
          <div className="rounded-xl border border-slate-100 bg-white p-3">
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
              <p className="text-sm text-slate-600">{t.outboundShort} {t.outboundNotSelected}</p>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {renderStepHeader(3, t.contactsAndPayment, step3Summary)}
        <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-3">
          <ContactsAndPaymentStep
            t={t}
            passengerNames={passengerNames}
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
            fromName={fromName}
            toName={toName}
            hasReturnSection={returnRequired}
            extraBaggageOutbound={extraBaggageOutbound}
            setExtraBaggageOutbound={setExtraBaggageOutbound}
            extraBaggageReturn={extraBaggageReturn}
            setExtraBaggageReturn={setExtraBaggageReturn}
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
      </section>
    );
  };

      const renderOrderSummary = () => {
    if (!selectedOutboundTour) return null;

    const contactsProvided = Boolean(phone || email);
    const baggageBadges = [
      extraBaggageOutboundCount > 0
        ? `${t.outboundShort}: ${extraBaggageOutboundCount}`
        : null,
      extraBaggageReturnCount > 0
        ? `${t.inboundShort}: ${extraBaggageReturnCount}`
        : null,
    ].filter(Boolean);

    const renderRouteBlock = (
      title: string,
      subtitle: string,
      date: string,
      departure: string,
      arrival: string,
      seats: number | { free: number },
      price: number,
      accent: string,
    ) => (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            <p className="text-base font-semibold text-slate-900">{subtitle}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 ring-1 ${accent}`}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                {formatDate(date)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden />
                {departure} → {arrival}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {seats && typeof seats === "object" ? t.freeSeats(seats.free) : t.seatsPending}
            </span>
            <span className="text-base font-semibold text-slate-900">{formatPrice(price * safeSeatCount)}</span>
          </div>
        </div>
      </div>
    );

    return (
      <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.orderSummaryTitle}</p>
            <p className="mt-1 text-sm text-slate-700">{t.orderSummaryNote}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            {t.liveLabel}
          </span>
        </div>

        <div className="space-y-4 px-5 py-4">
          {renderRouteBlock(
            t.outboundShort,
            `${fromName} → ${toName}`,
            selectedOutboundTour.date,
            selectedOutboundTour.departure_time,
            selectedOutboundTour.arrival_time,
            selectedOutboundTour.seats,
            selectedOutboundTour.price,
            "bg-sky-50 text-sky-700 ring-sky-100",
          )}

          {returnRequired && selectedReturnTour
            ? renderRouteBlock(
                t.inboundShort,
                `${toName} → ${fromName}`,
                selectedReturnTour.date,
                selectedReturnTour.departure_time,
                selectedReturnTour.arrival_time,
                selectedReturnTour.seats,
                selectedReturnTour.price,
                "bg-indigo-50 text-indigo-700 ring-indigo-100",
              )
            : null}

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.passengersTitle}</p>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                {seatCount} {t.seatsLabel}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {passengerNames.length ? (
                <ul className="space-y-2">
                  {passengerNames.map((name, index) => (
                    <li
                      key={`${name}-${index}`}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <span className="truncate font-semibold text-slate-900">{name}</span>
                      <span className="text-xs font-medium text-slate-600">{t.passengerLabel(index + 1)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">{t.step2SummaryFillNames}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.ticketContacts}</p>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                {t.contactsAndPayment}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {contactsProvided ? (
                <>
                  {phone ? <div className="font-semibold text-slate-900">{phone}</div> : null}
                  {email ? <div className="text-slate-600">{email}</div> : null}
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                    {t.step3SummaryPending}
                  </span>
                </>
              ) : (
                <p className="text-sm text-slate-500">{step3Summary}</p>
              )}
            </div>
          </div>

          {baggageBadges.length > 0 ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{t.extraBaggageHeading}</p>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
                  +
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {baggageBadges.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100"
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-900 px-4 py-4 text-white shadow-lg">
            <div className="flex items-center justify-between text-sm text-slate-200">
              <span className="font-medium">{t.subtotal}</span>
              <span className="font-semibold">{formatPrice(outboundTotal + returnTotal)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-lg font-semibold">
              <span>{t.total}</span>
              <span className="text-emerald-300">{formatPrice(overallTotal)}</span>
            </div>
          </div>
        </div>
      </aside>
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
            {renderProgressBar()}
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
            {renderOrderSummary()}
          </div>
        )}
      </div>
    </div>
  );


}
