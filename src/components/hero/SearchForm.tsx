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
      <div className="relative grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
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

        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center md:static md:translate-x-0 md:translate-y-0 md:pb-1">
          <button
            type="button"
            title={t.swapTitle}
            onClick={handleSwap}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-400 focus:outline-none md:h-12 md:w-12"
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

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
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
        />

        <PassengersInput
          value={passengers}
          onChange={(val) => {
            markInteracted();
            setPassengers(val);
          }}
          pillClass="h-14 w-full rounded-xl bg-slate-50 px-3 text-slate-800 ring-1 ring-slate-200 inline-flex items-center gap-2 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        />

        <button
          type="submit"
          className="h-14 w-full rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#ff8c1a] px-8 text-base font-semibold text-white shadow-lg transition hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff6a00] sm:w-auto"
          disabled={!fromId || !toId || !departDate}
          aria-label={t.search}
        >
          {t.search}
        </button>
      </div>
    </div>
  );

  const form = (
    <form onSubmit={handleSubmit} className="w-full">
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
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity ease-out ${
            departModal.isClosing ? 'opacity-0' : 'opacity-100'
          } ${
            departModal.prefersReducedMotion
              ? 'motion-reduce:transition-none'
              : ''
          }`}
          style={{ transitionDuration: `${departModal.animationDuration}ms` }}
          onClick={() => setShowDepart(false)}
        >
          <div
            className={`origin-center transform rounded-2xl bg-white shadow-2xl transition-all ease-out ${
              departModal.isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            } ${
              departModal.prefersReducedMotion
                ? 'motion-reduce:transform-none motion-reduce:transition-none'
                : ''
            }`}
            style={{ transitionDuration: `${departModal.animationDuration}ms` }}
            onClick={(e) => e.stopPropagation()}
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
          </div>
        </div>
      )}
      {returnModal.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity ease-out ${
            returnModal.isClosing ? 'opacity-0' : 'opacity-100'
          } ${
            returnModal.prefersReducedMotion
              ? 'motion-reduce:transition-none'
              : ''
          }`}
          style={{ transitionDuration: `${returnModal.animationDuration}ms` }}
          onClick={() => setShowReturn(false)}
        >
          <div
            className={`origin-center transform rounded-2xl bg-white shadow-2xl transition-all ease-out ${
              returnModal.isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            } ${
              returnModal.prefersReducedMotion
                ? 'motion-reduce:transform-none motion-reduce:transition-none'
                : ''
            }`}
            style={{ transitionDuration: `${returnModal.animationDuration}ms` }}
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar
              activeDates={returnActive}
              selectedDate={returnDate}
              onSelect={(iso) => {
                setReturnDate(iso);
                setOpenReturn(false);
                setShowReturn(false);
              }}
              lang={lang}
            />
            <div className="border-t border-gray-100 px-3 py-3">
              <button
                type="button"
                onClick={handleSelectOpenReturn}
                className="w-full rounded-xl border border-[#0E63F4]/30 bg-[#0E63F4]/5 px-4 py-2.5 text-sm font-semibold text-[#0E63F4] transition hover:bg-[#0E63F4]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {t.openDateBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
