// src/components/hero/SearchForm.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import Calendar from '../Calendar';
import DateInput from './DateInput';
import PassengersInput from './PassengersInput';
import { API } from '@/config';
import { useLockBodyScroll } from '@/utils/useLockBodyScroll';
import { useModalVisibility } from '@/utils/useModalVisibility';

type Stop = { id: number; stop_name: string };

type Lang = 'ru' | 'bg' | 'en' | 'ua';
type Props = {
  lang?: Lang;
  initialFromId?: number | string;
  initialToId?: number | string;
  initialDate?: string;       // YYYY-MM-DD
  initialReturnDate?: string; // YYYY-MM-DD
  initialSeats?: number;
  embedded?: boolean;
  onSearch: (params: {
    from: string;
    to: string;
    fromName: string;
    toName: string;
    date: string;
    returnDate?: string;
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
  },
  en: {
    from: 'From',
    to: 'To',
    date: 'Date',
    back: 'Return',
    search: 'Search',
    swapTitle: 'Swap',
  },
  bg: {
    from: 'Откъде',
    to: 'Накъде',
    date: 'Дата',
    back: 'Обратно',
    search: 'Търсене',
    swapTitle: 'Размени',
  },
  ua: {
    from: 'Звідки',
    to: 'Куди',
    date: 'Дата',
    back: 'Назад',
    search: 'Пошук',
    swapTitle: 'Поміняти місцями',
  },
};

export default function SearchForm({
  lang = 'ru',
  initialFromId,
  initialToId,
  initialDate,
  initialReturnDate,
  initialSeats = 1,
  embedded = false,
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
  const [passengers, setPassengers] = useState({
    adults: Math.max(1, initialSeats),
    discount: 0,
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
  const fromSelectRef = useRef<HTMLSelectElement | null>(null);
  const toSelectRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .post<Stop[]>(`${API}/search/departures`, { seats: seatCount, lang })
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
    axios
      .post<Stop[]>(`${API}/search/arrivals`, {
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
    axios
      .get<string[]>(`${API}/search/dates`, {
        params: {
          departure_stop_id: fromId,
          arrival_stop_id: toId,
          seats: seatCount,
        },
      })
      .then((res) => !cancelled && setDepartActive(res.data || []))
      .catch(() => !cancelled && setDepartActive([]));
    axios
      .get<string[]>(`${API}/search/dates`, {
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

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setDepartDate('');
    setReturnDate('');
  };

  const handleDepartOpen = () => setShowDepart(true);
  const handleReturnOpen = () => setShowReturn(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || !departDate) return;
    const fromName =
      departureStops.find((s) => s.id === fromId)?.stop_name || '';
    const toName =
      arrivalStops.find((s) => s.id === toId)?.stop_name || '';
    onSearch({
      from: String(fromId),
      to: String(toId),
      fromName,
      toName,
      date: departDate,
      returnDate: returnDate || undefined,
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
          <div className="relative">
            <select
              ref={fromSelectRef}
              aria-label={t.from}
              className={`${baseFieldStyles} pr-12 appearance-none`}
              value={from}
              onChange={(e) => {
                const val = e.target.value;
                setFrom(val);

                if (val && toSelectRef.current) {
                  setTimeout(() => {
                    toSelectRef.current?.focus();
                  }, 0);
                }
              }}
            >
              <option value="">{t.from}</option>
              {departureStops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.stop_name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              ▼
            </span>
          </div>
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
          <div className="relative">
            <select
              ref={toSelectRef}
              aria-label={t.to}
              className={`${baseFieldStyles} pr-12 appearance-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
              value={to}
              onChange={(e) => {
                const val = e.target.value;
                setTo(val);

                if (val && fromId) {
                  handleDepartOpen();
                }
              }}
              disabled={!fromId}
            >
              <option value="">{t.to}</option>
              {arrivalStops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.stop_name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              ▼
            </span>
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
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
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <PassengersInput
          value={passengers}
          onChange={setPassengers}
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
                setShowReturn(false);
              }}
              lang={lang}
            />
          </div>
        </div>
      )}
    </>
  );
}
