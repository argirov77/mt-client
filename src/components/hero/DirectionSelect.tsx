'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API } from '@/config';

type Lang = 'ru' | 'bg' | 'en' | 'ua';

type Stop = { id: number; stop_name: string };

type Props = {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  seatCount: number;
  lang?: Lang;
  className?: string;
  onSwap?: () => void;
};

const T = {
  ru: {
    from: 'Откуда',
    to: 'Куда',
    swap: 'Поменять направление',
    loading: 'Загрузка…',
    noResults: 'Ничего не найдено',
  },
  bg: {
    from: 'Откуда',
    to: 'Къде',
    swap: 'Смяна на посоката',
    loading: 'Зареждане…',
    noResults: 'Няма резултати',
  },
  en: {
    from: 'From',
    to: 'To',
    swap: 'Swap direction',
    loading: 'Loading…',
    noResults: 'No results',
  },
  ua: {
    from: 'Звідки',
    to: 'Куди',
    swap: 'Поміняти напрям',
    loading: 'Завантаження…',
    noResults: 'Нічого не знайдено',
  },
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const levenshteinDistance = (a: string, b: string) => {
  if (!a) return b.length;
  if (!b) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
};

const fuzzyFilterStops = (stops: Stop[], query: string, maxItems = 30) => {
  const cleanQuery = normalize(query);
  if (!cleanQuery) return stops.slice(0, maxItems);

  return stops
    .map((stop) => {
      const name = normalize(stop.stop_name);
      if (!name) return { stop, score: Number.MAX_SAFE_INTEGER };

      if (name.startsWith(cleanQuery)) return { stop, score: 0 };
      if (name.includes(cleanQuery)) return { stop, score: 1 };

      const distance = levenshteinDistance(cleanQuery, name);
      const firstWord = name.split(/\s+/)[0] || name;
      const firstWordDistance = levenshteinDistance(cleanQuery, firstWord);
      const score = Math.min(distance + 2, firstWordDistance + 1);

      return { stop, score };
    })
    .filter(({ score }) => score <= Math.max(2, Math.floor(cleanQuery.length / 2) + 1))
    .sort((a, b) => a.score - b.score || a.stop.stop_name.localeCompare(b.stop.stop_name))
    .slice(0, maxItems)
    .map(({ stop }) => stop);
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

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const fromRef = useRef<HTMLInputElement | null>(null);
  const toRef = useRef<HTMLInputElement | null>(null);

  const sortedDepartures = useMemo(
    () => [...departures].sort((a, b) => a.stop_name.localeCompare(b.stop_name, lang)),
    [departures, lang],
  );
  const sortedArrivals = useMemo(
    () => [...arrivals].sort((a, b) => a.stop_name.localeCompare(b.stop_name, lang)),
    [arrivals, lang],
  );

  const selectedFromName = useMemo(
    () => sortedDepartures.find((s) => String(s.id) === from)?.stop_name ?? '',
    [sortedDepartures, from],
  );
  const selectedToName = useMemo(
    () => sortedArrivals.find((s) => String(s.id) === to)?.stop_name ?? '',
    [sortedArrivals, to],
  );

  useEffect(() => {
    setFromQuery(selectedFromName);
  }, [selectedFromName]);

  useEffect(() => {
    setToQuery(selectedToName);
  }, [selectedToName]);

  useEffect(() => {
    let aborted = false;
    async function load() {
      setDepLoading(true);
      try {
        const res = await fetch(`${API}/search/departures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seats: seatCount || 1, lang }),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data: Stop[] = await res.json();
        if (!aborted) {
          setDepartures(Array.isArray(data) ? data : []);
          if (from && !data.some((s) => String(s.id) === String(from))) {
            setFrom('');
            setFromQuery('');
          }
        }
      } catch (e) {
        if (!aborted) {
          setDepartures([]);
          setFrom('');
          setFromQuery('');
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
  }, [seatCount, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!from) {
        setArrivals([]);
        if (to) setTo('');
        setToQuery('');
        return;
      }
      setArrLoading(true);
      try {
        const res = await fetch(`${API}/search/arrivals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ departure_stop_id: Number(from), seats: seatCount || 1, lang }),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data: Stop[] = await res.json();
        if (!aborted) {
          setArrivals(Array.isArray(data) ? data : []);
          if (to && !data.some((s) => String(s.id) === String(to))) {
            setTo('');
            setToQuery('');
          }
        }
      } catch (e) {
        if (!aborted) {
          setArrivals([]);
          setTo('');
          setToQuery('');
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
  }, [from, seatCount, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSwap = useMemo(() => Boolean(from && to), [from, to]);
  const visibleDepartures = useMemo(() => fuzzyFilterStops(sortedDepartures, fromQuery), [sortedDepartures, fromQuery]);
  const visibleArrivals = useMemo(() => fuzzyFilterStops(sortedArrivals, toQuery), [sortedArrivals, toQuery]);

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
      <div className="flex-1 min-w-[180px]">
        <label className="text-white/90 text-sm mb-1 block select-none">{t.from}</label>
        <div className="relative">
          <input
            ref={fromRef}
            className="w-full h-11 px-4 pr-9 bg-white rounded-xl border border-transparent hover:border-blue-300 transition text-gray-900"
            value={fromQuery}
            placeholder={depLoading ? t.loading : t.from}
            onFocus={() => setFromOpen(true)}
            onBlur={() => setTimeout(() => setFromOpen(false), 120)}
            onChange={(e) => {
              const value = e.target.value;
              setFromQuery(value);
              setFrom('');
            }}
          />
          {fromOpen && (
            <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {visibleDepartures.length > 0 ? (
                visibleDepartures.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-900"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFrom(String(s.id));
                      setFromQuery(s.stop_name);
                      setFromOpen(false);
                      setTimeout(() => toRef.current?.focus(), 0);
                    }}
                  >
                    {s.stop_name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">{t.noResults}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        title={t.swap}
        onClick={handleSwap}
        disabled={!canSwap}
        className={`shrink-0 w-10 h-10 rounded-xl border transition flex items-center justify-center ${
          canSwap ? 'bg-white text-blue-600 hover:border-blue-300' : 'bg-white/60 text-gray-400 cursor-not-allowed'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3-3m-3 3 3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="flex-1 min-w-[180px]">
        <label className="text-white/90 text-sm mb-1 block select-none">{t.to}</label>
        <div className="relative">
          <input
            ref={toRef}
            className="w-full h-11 px-4 pr-9 bg-white rounded-xl border border-transparent hover:border-blue-300 transition text-gray-900 disabled:opacity-60"
            value={toQuery}
            placeholder={arrLoading ? t.loading : t.to}
            onFocus={() => setToOpen(true)}
            onBlur={() => setTimeout(() => setToOpen(false), 120)}
            onChange={(e) => {
              setToQuery(e.target.value);
              setTo('');
            }}
            disabled={!from}
          />
          {toOpen && from && (
            <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {visibleArrivals.length > 0 ? (
                visibleArrivals.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-900"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setTo(String(s.id));
                      setToQuery(s.stop_name);
                      setToOpen(false);
                    }}
                  >
                    {s.stop_name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">{t.noResults}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
