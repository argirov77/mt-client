// src/components/hero/SearchForm.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import DateInput from './DateInput';
import PassengersInput from './PassengersInput';
import { API } from '@/config';

type Stop = { id: number; stop_name: string };

type Lang = 'ru' | 'bg' | 'en' | 'ua';
type Props = {
  lang?: Lang;
  initialFromId?: number | string;
  initialToId?: number | string;
  initialDate?: string;       // YYYY-MM-DD
  initialReturnDate?: string; // YYYY-MM-DD
  initialSeats?: number;
  embedded?: boolean;         // <--- НОВОЕ!
  onSearch: (params: {
    from: string;
    to: string;
    date: string;
    returnDate?: string;
    seatCount: number;
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
  en: { from: 'From', to: 'To', date: 'Date', back: 'Return', search: 'Search', swapTitle: 'Swap' },
  bg: { from: 'Откъде', to: 'Накъде', date: 'Дата', back: 'Обратно', search: 'Търсене', swapTitle: 'Размени' },
  ua: { from: 'Звідки', to: 'Куди', date: 'Дата', back: 'Назад', search: 'Пошук', swapTitle: 'Поміняти місцями' },
};

const pill = 'h-12 rounded-2xl bg-white/90 hover:bg-white text-slate-800 shadow ring-1 ring-black/5 px-4';

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

  const [from, setFrom] = useState<string>(initialFromId ? String(initialFromId) : '');
  const [to, setTo] = useState<string>(initialToId ? String(initialToId) : '');
  const [departDate, setDepartDate] = useState<string>(initialDate ?? '');
  const [returnDate, setReturnDate] = useState<string>(initialReturnDate ?? '');
  const [seatCount, setSeatCount] = useState<number>(Math.max(1, initialSeats));

  const [departureStops, setDepartureStops] = useState<Stop[]>([]);
  const [arrivalStops, setArrivalStops] = useState<Stop[]>([]);
  const [departActive, setDepartActive] = useState<string[]>([]);
  const [returnActive, setReturnActive] = useState<string[]>([]);

  const fromId = useMemo(() => Number(from) || 0, [from]);
  const toId   = useMemo(() => Number(to)   || 0, [to]);

  useEffect(() => {
    let cancelled = false;
    axios.get<Stop[]>(`${API}/search/departures`, { params: { seats: seatCount } })
      .then(res => !cancelled && setDepartureStops(res.data || []))
      .catch(() => !cancelled && setDepartureStops([]));
    return () => { cancelled = true; };
  }, [seatCount]);

  useEffect(() => {
    let cancelled = false;
    if (!fromId) {
      setArrivalStops([]); setTo('');
      setDepartActive([]); setReturnActive([]);
      setDepartDate('');   setReturnDate('');
      return;
    }
    axios.get<Stop[]>(`${API}/search/arrivals`, { params: { departure_stop_id: fromId, seats: seatCount } })
      .then(res => !cancelled && setArrivalStops(res.data || []))
      .catch(() => !cancelled && setArrivalStops([]));
    return () => { cancelled = true; };
  }, [fromId, seatCount]);

  useEffect(() => {
    let cancelled = false;
    if (!fromId || !toId) {
      setDepartActive([]); setReturnActive([]);
      setDepartDate('');   setReturnDate('');
      return;
    }
    axios.get<string[]>(`${API}/search/dates`, { params: { departure_stop_id: fromId, arrival_stop_id: toId, seats: seatCount } })
      .then(res => !cancelled && setDepartActive(res.data || []))
      .catch(() => !cancelled && setDepartActive([]));
    axios.get<string[]>(`${API}/search/dates`, { params: { departure_stop_id: toId, arrival_stop_id: fromId, seats: seatCount } })
      .then(res => !cancelled && setReturnActive(res.data || []))
      .catch(() => !cancelled && setReturnActive([]));
    return () => { cancelled = true; };
  }, [fromId, toId, seatCount]);

  const handleSwap = () => {
    setFrom(to); setTo(from);
    setDepartDate(''); setReturnDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || !departDate) return;
    onSearch({
      from: String(fromId),
      to: String(toId),
      date: departDate,
      returnDate: returnDate || undefined,
      seatCount,
    });
  };

  // ВНУТРЕННЕЕ СОДЕРЖИМОЕ ФОРМЫ
  const row = (
    <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
      <div className="relative flex w-full md:w-1/2">
        <select aria-label={t.from} className={pill + ' w-1/2 pr-10 rounded-r-none'} value={from} onChange={e => setFrom(e.target.value)}>
          <option value="">{t.from}</option>
          {departureStops.map(s => <option key={s.id} value={s.id}>{s.stop_name}</option>)}
        </select>
        <select aria-label={t.to} className={pill + ' w-1/2 pl-10 rounded-l-none'} value={to} onChange={e => setTo(e.target.value)} disabled={!fromId}>
          <option value="">{t.to}</option>
          {arrivalStops.map(s => <option key={s.id} value={s.id}>{s.stop_name}</option>)}
        </select>
        <button type="button" title={t.swapTitle} onClick={handleSwap}
                className="absolute left-1/2 top-1/2 z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white text-sky-700 shadow ring-1 ring-black/5">⇄</button>
      </div>

      <div className="flex w-full md:w-1/2 flex-wrap md:flex-nowrap items-center gap-3">
        <DateInput value={departDate} setValue={setDepartDate} activeDates={departActive} lang={lang}
                   className={pill + ' flex-1 flex items-center gap-2'} disabled={!fromId || !toId}/>
        <DateInput value={returnDate} setValue={setReturnDate} activeDates={returnActive} lang={lang}
                   className={pill + ' flex-1 flex items-center gap-2'} disabled={!fromId || !toId}/>
        <PassengersInput value={seatCount} setValue={setSeatCount}
                         className="flex items-center gap-2"
                         pillClass="h-12 px-3 rounded-2xl bg-white/90 hover:bg-white text-slate-800 shadow ring-1 ring-black/5 flex items-center gap-2"
                         btnClass="h-12 w-10 grid place-items-center rounded-xl bg-white/90 hover:bg-white text-sky-700 shadow ring-1 ring-black/5"/>
        <button type="submit"
                className="h-12 px-6 rounded-2xl bg-[#ff6a00] hover:bg-[#ff7a1c] text-white font-medium shadow-lg"
                disabled={!fromId || !toId || !departDate} aria-label={t.search}>{t.search}</button>
      </div>
    </div>
  );

  // Обёртка: если embedded — возвращаем ТОЛЬКО строку
  if (embedded) {
    return <form onSubmit={handleSubmit} className="w-full">{row}</form>;
  }

  // Старый режим (самостоятельная капсула)
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white/20 backdrop-blur p-5 shadow-lg ring-1 ring-white/30">
        {row}
      </div>
    </form>
  );
}

