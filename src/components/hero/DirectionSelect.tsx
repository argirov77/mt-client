'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { API } from '@/config';

type Lang = 'ru' | 'bg' | 'en' | 'ua';

type Stop = { id: number; stop_name: string };

type Props = {
  from: string;                        // id отправной
  to: string;                          // id конечной
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  seatCount: number;                   // кол-во мест
  lang?: Lang;
  className?: string;
  /** если хочешь отследить реверс во внешнем коде */
  onSwap?: () => void;
};

const T = {
  ru: {
    from: 'Откуда',
    to: 'Куда',
    swap: 'Поменять направление',
    loading: 'Загрузка…',
  },
  bg: {
    from: 'Откуда',
    to: 'Куда',
    swap: 'Смяна на посоката',
    loading: 'Зареждане…',
  },
  en: {
    from: 'From',
    to: 'To',
    swap: 'Swap direction',
    loading: 'Loading…',
  },
  ua: {
    from: 'Звідки',
    to: 'Куди',
    swap: 'Поміняти напрям',
    loading: 'Завантаження…',
  },
};

export default function DirectionSelect({
  from,
  to,
  setFrom,
  setTo,
  seatCount,
  lang = 'ru',
  className = '',
  onSwap,
}: Props) {
  const t = T[lang] ?? T.ru;

  const [depLoading, setDepLoading] = useState(false);
  const [arrLoading, setArrLoading] = useState(false);

  const [departures, setDepartures] = useState<Stop[]>([]);
  const [arrivals, setArrivals] = useState<Stop[]>([]);

  // Загрузка отправных остановок
  useEffect(() => {
    let aborted = false;
    async function load() {
      setDepLoading(true);
      try {
        const url = new URL(`${API}/search/departures`);
        url.searchParams.set('seats', String(seatCount || 1));
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data: Stop[] = await res.json();
        if (!aborted) {
          setDepartures(Array.isArray(data) ? data : []);
          // если текущего from нет в списке — сбросить
          if (from && !data.some(s => String(s.id) === String(from))) {
            setFrom('');
          }
        }
      } catch (e) {
        if (!aborted) {
          setDepartures([]);
          setFrom('');
        }
        console.error('Failed to load departures', e);
      } finally {
        if (!aborted) setDepLoading(false);
      }
    }
    load();
    return () => {
      aborted = true;
    };
  }, [seatCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Загрузка конечных при выборе отправной
  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!from) {
        setArrivals([]);
        if (to) setTo('');
        return;
      }
      setArrLoading(true);
      try {
        const url = new URL(`${API}/search/arrivals`);
        url.searchParams.set('departure_stop_id', String(from));
        url.searchParams.set('seats', String(seatCount || 1));
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data: Stop[] = await res.json();
        if (!aborted) {
          setArrivals(Array.isArray(data) ? data : []);
          if (to && !data.some(s => String(s.id) === String(to))) {
            setTo('');
          }
        }
      } catch (e) {
        if (!aborted) {
          setArrivals([]);
          setTo('');
        }
        console.error('Failed to load arrivals', e);
      } finally {
        if (!aborted) setArrLoading(false);
      }
    }
    load();
    return () => {
      aborted = true;
    };
  }, [from, seatCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSwap = useMemo(
    () => Boolean(from && to),
    [from, to]
  );

  const handleSwap = () => {
    if (!canSwap) return;
    const prevFrom = from;
    const prevTo = to;
    setFrom(prevTo);
    setTo(prevFrom);
    onSwap?.();
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* FROM */}
      <div className="flex-1 min-w-[180px]">
        <label className="text-white/90 text-sm mb-1 block select-none">
          {t.from}
        </label>
        <div className="relative">
          <select
            className="w-full h-11 px-4 pr-9 bg-white rounded-xl border border-transparent hover:border-blue-300 transition appearance-none text-gray-900"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            <option value="">{depLoading ? t.loading : t.from}</option>
            {departures.map((s) => (
              <option key={s.id} value={s.id}>
                {s.stop_name}
              </option>
            ))}
          </select>
          {/* caret */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>

      {/* SWAP — одна кнопка */}
      <button
        type="button"
        title={t.swap}
        onClick={handleSwap}
        disabled={!canSwap}
        className={`shrink-0 w-10 h-10 rounded-xl border transition flex items-center justify-center
          ${canSwap ? 'bg-white text-blue-600 hover:border-blue-300' : 'bg-white/60 text-gray-400 cursor-not-allowed'}`}
      >
        {/* иконка реверса с хорошим контрастом */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* TO */}
      <div className="flex-1 min-w-[180px]">
        <label className="text-white/90 text-sm mb-1 block select-none">
          {t.to}
        </label>
        <div className="relative">
          <select
            className="w-full h-11 px-4 pr-9 bg-white rounded-xl border border-transparent hover:border-blue-300 transition appearance-none text-gray-900 disabled:opacity-60"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={!from}
          >
            <option value="">{arrLoading ? t.loading : t.to}</option>
            {arrivals.map((s) => (
              <option key={s.id} value={s.id}>
                {s.stop_name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
