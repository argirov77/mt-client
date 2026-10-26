// src/components/hero/SearchForm.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Calendar from '../Calendar';
import DateInput from './DateInput';
import PassengersInput from './PassengersInput';
import StopCombobox, { type StopComboboxHandle } from './StopCombobox';
import apiClient from '@/lib/apiClient';
import { useLockBodyScroll } from '@/utils/useLockBodyScroll';
import { useModalVisibility } from '@/utils/useModalVisibility';
import { trackSearch, trackSearchIntent, buildRouteCategory } from '@/lib/analytics';
import { weekdaysOfDates } from '@/utils/tripFormat';

type Stop = { id: number; stop_name: string };

type Lang = 'ru' | 'bg' | 'en' | 'ua';
type Props = {
  lang?: Lang;
  initialFromId?: number | string;
  initialToId?: number | string;
  initialDate?: string;       // YYYY-MM-DD
  initialReturnDate?: string; // YYYY-MM-DD
  initialSeats?: number;
  initialDiscount?: number;
  initialOpenReturn?: boolean;
  embedded?: boolean;
  // Направление предзаполнено программно (посадочная страница маршрута), а не
  // выбрано пользователем. Используется, чтобы НЕ слать search_intent до тех
  // пор, пока пользователь реально не тронет форму (см. эффект ниже).
  prefilled?: boolean;
  onSearch: (params: {
    from: string;
    to: string;
    fromName: string;
    toName: string;
    date: string;
    returnDate?: string;
    openReturn?: boolean;
    seatCount: number;
    discountCount: number;
  }) => void;
};

const L = {
  ru: {
    from: 'Откуда',
    to: 'Куда',
    date: 'Дата',
    back: 'Обратно',
    search: 'Поиск',
    swapTitle: 'Поменять местами',
    noMatches: 'Ничего не найдено',
    openDate: 'Открытая дата',
    openDateBtn: 'Билет с открытой датой',
    openDateHint: 'Дату и место выберете позже в кабинете заказа по QR-коду',
    noReturn: 'не нужно',
    outboundTitle: 'Туда',
    returnTitle: 'Обратно',
    tripsOn: (days: string) => `Рейсы по ${days}`,
    returnDiscount: 'обратный билет −10%',
    close: 'Закрыть',
  },
  en: {
    from: 'From',
    to: 'To',
    date: 'Date',
    back: 'Return',
    search: 'Search',
    swapTitle: 'Swap',
    noMatches: 'No matches',
    openDate: 'Open date',
    openDateBtn: 'Open-date ticket',
    openDateHint: 'Choose the date and seat later in your order page via the QR code',
    noReturn: 'not needed',
    outboundTitle: 'Outbound',
    returnTitle: 'Return',
    tripsOn: (days: string) => `Trips on ${days}`,
    returnDiscount: 'return ticket −10%',
    close: 'Close',
  },
  bg: {
    from: 'Откъде',
    to: 'Накъде',
    date: 'Дата',
    back: 'Обратно',
    search: 'Търсене',
    swapTitle: 'Размени',
    noMatches: 'Няма съвпадения',
    openDate: 'Отворена дата',
    openDateBtn: 'Билет с отворена дата',
    openDateHint: 'Датата и мястото избирате по-късно в страницата на поръчката чрез QR кода',
    noReturn: 'не е нужно',
    outboundTitle: 'Натам',
    returnTitle: 'Обратно',
    tripsOn: (days: string) => `Курсове в ${days}`,
    returnDiscount: 'обратен билет −10%',
    close: 'Затвори',
  },
  ua: {
    from: 'Звідки',
    to: 'Куди',
    date: 'Дата',
    back: 'Назад',
    search: 'Пошук',
    swapTitle: 'Поміняти місцями',
    noMatches: 'Нічого не знайдено',
    openDate: 'Відкрита дата',
    openDateBtn: 'Квиток з відкритою датою',
    openDateHint: 'Дату й місце оберете пізніше в кабінеті замовлення за QR-кодом',
    noReturn: 'не потрібно',
    outboundTitle: 'Туди',
    returnTitle: 'Назад',
    tripsOn: (days: string) => `Рейси по ${days}`,
    returnDiscount: 'зворотний квиток −10%',
    close: 'Закрити',
  },
};

export default function SearchForm({
  lang = 'ru',
  initialFromId,
  initialToId,
  initialDate,
  initialReturnDate,
  initialSeats = 1,
  initialDiscount = 0,
  initialOpenReturn = false,
  embedded = false,
  prefilled = false,
  onSearch,
}: Props) {
  const t = L[lang];

  const [from, setFrom] = useState<string>(
    initialFromId ? String(initialFromId) : '',
  );
  const [to, setTo] = useState<string>(
    initialToId ? String(initialToId) : '',
  );
  const [departDate, setDepartDate] = useState<string>(initialDate ?? '');
  const [returnDate, setReturnDate] = useState<string>(
    initialReturnDate ?? '',
  );
  // Обратный билет с открытой датой (выбирается из календаря «Обратно»)
  const [openReturn, setOpenReturn] = useState(initialOpenReturn);
  const [passengers, setPassengers] = useState({
    adults: Math.max(1, initialSeats),
    discount: Math.max(0, initialDiscount),
  });
  const seatCount = passengers.adults + passengers.discount;

  const [departureStops, setDepartureStops] = useState<Stop[]>([]);
  const [arrivalStops, setArrivalStops] = useState<Stop[]>([]);
  const [departActive, setDepartActive] = useState<string[]>([]);
  const [returnActive, setReturnActive] = useState<string[]>([]);

  const [showDepart, setShowDepart] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const departModal = useModalVisibility(showDepart);
  const returnModal = useModalVisibility(showReturn);

  useLockBodyScroll(departModal.shouldRender || returnModal.shouldRender);

  const fromId = useMemo(() => Number(from) || 0, [from]);
  const toId = useMemo(() => Number(to) || 0, [to]);

  // refs для авто-переходов внутри формы
  const fromSelectRef = useRef<StopComboboxHandle | null>(null);
  const toSelectRef = useRef<StopComboboxHandle | null>(null);

  // Тронул ли пользователь форму руками. При программном предзаполнении
  // (prefilled) остаётся false до первого реального действия — это гасит
  // search_intent, чтобы автозаполнение направления не считалось намерением
  // пользователя (аналитика не должна засоряться ложными событиями).
  const userInteractedRef = useRef(false);
  const markInteracted = () => {
    userInteractedRef.current = true;
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .post<Stop[]>('/search/departures', { seats: seatCount, lang })
      .then((res) => !cancelled && setDepartureStops(res.data || []))
      .catch(() => !cancelled && setDepartureStops([]));
    return () => {
      cancelled = true;
    };
  }, [seatCount, lang]);

  useEffect(() => {
    let cancelled = false;
    if (!fromId) {
      setArrivalStops([]);
      setTo('');
      setDepartActive([]);
      setReturnActive([]);
      setDepartDate('');
      setReturnDate('');
      return;
    }
    apiClient
      .post<Stop[]>('/search/arrivals', {
        departure_stop_id: fromId,
        seats: seatCount,
        lang,
      })
      .then((res) => !cancelled && setArrivalStops(res.data || []))
      .catch(() => !cancelled && setArrivalStops([]));
    return () => {
      cancelled = true;
    };
  }, [fromId, seatCount, lang]);

  useEffect(() => {
    let cancelled = false;
    if (!fromId || !toId) {
      setDepartActive([]);
      setReturnActive([]);
      setDepartDate('');
      setReturnDate('');
      return;
    }
    apiClient
      .get<string[]>('/search/dates', {
        params: {
          departure_stop_id: fromId,
          arrival_stop_id: toId,
          seats: seatCount,
        },
      })
      .then((res) => !cancelled && setDepartActive(res.data || []))
      .catch(() => !cancelled && setDepartActive([]));
    apiClient
      .get<string[]>('/search/dates', {
        params: {
          departure_stop_id: toId,
          arrival_stop_id: fromId,
          seats: seatCount,
        },
      })
      .then((res) => !cancelled && setReturnActive(res.data || []))
      .catch(() => !cancelled && setReturnActive([]));
    return () => {
      cancelled = true;
    };
  }, [fromId, toId, seatCount]);

  // ─── search_intent (намерение без результата, Фаза 3) ───────────────────
  // Оба направления выбраны, но клик «Поиск» не сделан → шлём один раз за
  // сессию, с задержкой (не на каждый клик/раскрытие дропдауна). Микро-действия
  // (открытие departure/arrival/date) не трекаем.
  const searchIntentSentRef = useRef(false);
  const searchIntentNamesRef = useRef({ fromName: '', toName: '' });

  useEffect(() => {
    const fromName =
      departureStops.find((s) => s.id === fromId)?.stop_name || '';
    const toName = arrivalStops.find((s) => s.id === toId)?.stop_name || '';
    searchIntentNamesRef.current = { fromName, toName };
  }, [fromId, toId, departureStops, arrivalStops]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (searchIntentSentRef.current) return;
    if (!fromId || !toId) return;
    // Предзаполненное направление само по себе — не намерение пользователя.
    // Ждём реального действия (смена «Откуда»/«Куда», работа с датой и т.п.),
    // иначе search_intent улетал бы при простом заходе на посадочную страницу.
    if (prefilled && !userInteractedRef.current) return;
    const timer = window.setTimeout(() => {
      if (searchIntentSentRef.current) return;
      const { fromName, toName } = searchIntentNamesRef.current;
      const sent = trackSearchIntent({
        locale: lang,
        departure: fromName || String(fromId),
        arrival: toName || String(toId),
        // reached_date_step: дошёл ли до выбора даты (выбрана дата отправления),
        // чтобы различать «бросил на направлении» vs «даты не подошли».
        reachedDateStep: Boolean(departDate),
      });
      if (sent) searchIntentSentRef.current = true;
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [fromId, toId, departDate, lang, prefilled]);

  const fromStopName =
    departureStops.find((stop) => stop.id === fromId)?.stop_name || '';
  const toStopName =
    arrivalStops.find((stop) => stop.id === toId)?.stop_name || '';

  // Обратная дата не может быть раньше отправления.
  useEffect(() => {
    if (departDate && returnDate && returnDate < departDate) {
      setReturnDate('');
    }
  }, [departDate, returnDate]);

  const handleSwap = () => {
    markInteracted();
    setFrom(to);
    setTo(from);
    setDepartDate('');
    setReturnDate('');
    setOpenReturn(false);
  };

  const handleSelectOpenReturn = () => {
    markInteracted();
    setOpenReturn(true);
    setReturnDate('');
    setShowReturn(false);
  };

  const handleDepartOpen = () => {
    markInteracted();
    setShowDepart(true);
  };
  const handleReturnOpen = () => {
    markInteracted();
    setShowReturn(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || !departDate) return;
    const fromName =
      departureStops.find((s) => s.id === fromId)?.stop_name || '';
    const toName =
      arrivalStops.find((s) => s.id === toId)?.stop_name || '';
    // Завершённый поиск — это не «намерение без результата»: гасим search_intent.
    searchIntentSentRef.current = true;
    // Завершённое действие поиска. form_submit удалён как дубль без нагрузки.
    trackSearch({
      locale: lang,
      origin: fromName,
      destination: toName,
      route: buildRouteCategory(
        { id: fromId, name: fromName },
        { id: toId, name: toName },
      ),
      departureDate: departDate,
      returnDate: returnDate || undefined,
      tripType: openReturn ? 'open_return' : returnDate ? 'roundtrip' : 'oneway',
      passengerCount: passengers.adults + passengers.discount,
      adultCount: passengers.adults,
      discountCount: passengers.discount,
    });
    onSearch({
      from: String(fromId),
      to: String(toId),
      fromName,
      toName,
      date: departDate,
      returnDate: openReturn ? undefined : returnDate || undefined,
      openReturn,
      seatCount,
      discountCount: passengers.discount,
    });
  };

  // ВНУТРЕННЕЕ СОДЕРЖИМОЕ ФОРМЫ
  const baseFieldStyles =
    "h-14 w-full rounded-xl bg-slate-50 px-4 text-slate-900 ring-1 ring-slate-200 transition hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-400 focus:outline-none";

  const labelStyles =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";

  const row = (
    <div className="grid gap-4">
      <div className="relative grid gap-4 @xl:grid-cols-[1fr_auto_1fr] @xl:items-end">
        <div className="flex flex-col gap-2">
          <span className={labelStyles}>{t.from}</span>
          <StopCombobox
            ref={fromSelectRef}
            stops={departureStops}
            value={from}
            onChange={(val) => {
              markInteracted();
              setFrom(val);
            }}
            onSelect={(val) => {
              if (val) {
                setTimeout(() => toSelectRef.current?.focus(), 0);
              }
            }}
            placeholder={t.from}
            ariaLabel={t.from}
            inputClassName={`${baseFieldStyles} pr-4`}
            noOptionsText={t.noMatches}
          />
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center @xl:static @xl:translate-x-0 @xl:translate-y-0 @xl:pb-1">
          <button
            type="button"
            title={t.swapTitle}
            onClick={handleSwap}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-400 focus:outline-none"
          >
            <span aria-hidden className="text-lg">
              ⇄
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelStyles}>{t.to}</span>
          <StopCombobox
            ref={toSelectRef}
            stops={arrivalStops}
            value={to}
            onChange={(val) => {
              markInteracted();
              setTo(val);
            }}
            onSelect={(val) => {
              if (val && fromId) handleDepartOpen();
            }}
            disabled={!fromId}
            placeholder={t.to}
            ariaLabel={t.to}
            inputClassName={`${baseFieldStyles} pr-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            noOptionsText={t.noMatches}
          />
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 @md:grid-cols-2 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] @4xl:items-end">
        <DateInput
          value={departDate}
          setValue={setDepartDate}
          activeDates={departActive}
          label={t.date}
          lang={lang}
          disabled={!fromId || !toId}
          onOpen={handleDepartOpen}
        />

        <DateInput
          value={returnDate}
          setValue={setReturnDate}
          activeDates={returnActive}
          label={t.back}
          lang={lang}
          disabled={!fromId || !toId}
          onOpen={handleReturnOpen}
          displayText={openReturn ? t.openDate : undefined}
          placeholder={t.noReturn}
        />

        <PassengersInput
          lang={lang}
          value={passengers}
          onChange={(val) => {
            markInteracted();
            setPassengers(val);
          }}
          pillClass="h-14 w-full rounded-xl bg-slate-50 px-4 text-left text-slate-800 ring-1 ring-slate-200 inline-flex items-center gap-2 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        />

        <button
          type="submit"
          className="h-14 w-full rounded-xl bg-[#0a65b0] px-8 text-base font-bold text-white shadow-lg transition hover:bg-[#08558f] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0a65b0] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none @4xl:w-auto"
          disabled={!fromId || !toId || !departDate}
          aria-label={t.search}
        >
          {t.search}
        </button>
      </div>
    </div>
  );

  const form = (
    <form onSubmit={handleSubmit} className="@container w-full">
      {embedded ? (
        row
      ) : (
        <div className="mx-auto max-w-5xl rounded-3xl bg-white/20 backdrop-blur p-5 shadow-lg ring-1 ring-white/30">
          {row}
        </div>
      )}
    </form>
  );

  return (
    <>
      {form}
      {departModal.shouldRender && (
        <CalendarSheet
          visibility={departModal}
          onClose={() => setShowDepart(false)}
          closeLabel={t.close}
          title={`${t.outboundTitle}${fromStopName && toStopName ? ` · ${fromStopName} → ${toStopName}` : ''}`}
          subtitle={departActive.length ? t.tripsOn(weekdaysOfDates(departActive, lang)) : undefined}
        >
          <Calendar
            activeDates={departActive}
            selectedDate={departDate}
            onSelect={(iso) => {
              setDepartDate(iso);
              setShowDepart(false);
              // после выбора даты НИЧЕГО автоматически не открываем
            }}
            lang={lang}
          />
        </CalendarSheet>
      )}
      {returnModal.shouldRender && (
        <CalendarSheet
          visibility={returnModal}
          onClose={() => setShowReturn(false)}
          closeLabel={t.close}
          title={`${t.returnTitle}${fromStopName && toStopName ? ` · ${toStopName} → ${fromStopName}` : ''}`}
          subtitle={[
            returnActive.length ? t.tripsOn(weekdaysOfDates(returnActive, lang)) : '',
            t.returnDiscount,
          ]
            .filter(Boolean)
            .join(' · ')}
        >
          <Calendar
            activeDates={returnActive}
            selectedDate={returnDate}
            minDate={departDate || undefined}
            onSelect={(iso) => {
              setReturnDate(iso);
              setOpenReturn(false);
              setShowReturn(false);
            }}
            lang={lang}
          />
          <div className="w-full max-w-[360px] px-3 pb-3">
            <button
              type="button"
              onClick={handleSelectOpenReturn}
              className={`flex w-full flex-col items-center gap-0.5 rounded-xl border-[1.5px] px-4 py-2.5 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                openReturn
                  ? 'border-[#0E63F4] bg-[#0E63F4]/10'
                  : 'border-[#93b8e6] bg-[#f3f8fe] hover:bg-[#e3eefb]'
              }`}
            >
              <span className="text-sm font-bold text-[#0E63F4]">{t.openDateBtn}</span>
              <span className="text-xs text-slate-600">{t.openDateHint}</span>
            </button>
          </div>
        </CalendarSheet>
      )}
    </>
  );
}

// Окно календаря: снизу листом на телефоне, по центру на компьютере.
function CalendarSheet({
  visibility,
  onClose,
  closeLabel,
  title,
  subtitle,
  children,
}: {
  visibility: ReturnType<typeof useModalVisibility>;
  onClose: () => void;
  closeLabel: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] transition-opacity ease-out sm:items-center ${
        visibility.isClosing ? 'opacity-0' : 'opacity-100'
      } ${visibility.prefersReducedMotion ? 'motion-reduce:transition-none' : ''}`}
      style={{ transitionDuration: `${visibility.animationDuration}ms` }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full max-w-[400px] transform rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl transition-all ease-out sm:rounded-2xl ${
          visibility.isClosing ? 'translate-y-4 opacity-0 sm:scale-95' : 'translate-y-0 opacity-100'
        } ${
          visibility.prefersReducedMotion
            ? 'motion-reduce:transform-none motion-reduce:transition-none'
            : ''
        }`}
        style={{ transitionDuration: `${visibility.animationDuration}ms` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900">{title}</p>
            {subtitle ? <p className="text-xs text-slate-600">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-600 hover:bg-slate-50"
          >
            ×
          </button>
        </div>
        <div className="flex flex-col items-center">{children}</div>
      </div>
    </div>
  );
}
