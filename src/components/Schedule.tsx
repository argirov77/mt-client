'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { ArrowRight, Bus } from 'lucide-react';

type Lang = 'ru' | 'bg' | 'en' | 'ua';

type PriceItem = {
  departure_stop_id: number;
  departure_name: string;
  arrival_stop_id: number;
  arrival_name: string;
  price: number;
};

type Dict = {
  title: string;
  loading: string;
  error: string;
  noData: string;
  currency: string;
};

const i18n: Record<Lang, Dict> = {
  ru: {
    title: 'Цены',
    loading: 'Загрузка…',
    error: 'Ошибка загрузки',
    noData: 'Данные не найдены',
    currency: '₴',
  },
  bg: {
    title: 'Цени',
    loading: 'Зареждане…',
    error: 'Грешка при зареждането',
    noData: 'Няма данни',
    currency: '₴',
  },
  en: {
    title: 'Prices',
    loading: 'Loading…',
    error: 'Failed to load',
    noData: 'No data',
    currency: '₴',
  },
  ua: {
    title: 'Ціни',
    loading: 'Завантаження…',
    error: 'Помилка завантаження',
    noData: 'Даних немає',
    currency: '₴',
  },
};

function formatPrice(n: number, curr: string) {
  return `${Number(n).toFixed(0)} ${curr}`;
}

export default function PriceListCompact({ lang = 'ru' }: { lang?: Lang }) {
  const t = i18n[lang];
  const [list, setList] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.post(`${API}/selected_pricelist`, { lang });
        if (!cancelled) setList(data?.prices || []);
      } catch {
        if (!cancelled) setErr(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <section id="prices" className="bg-gray-50 py-14">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-center mb-6">
          {t.title}
        </h2>

        {loading && <p className="text-center text-slate-500">{t.loading}</p>}
        {!loading && err && <p className="text-center text-red-500">{t.error}</p>}
        {!loading && !err && list.length === 0 && (
          <p className="text-center text-slate-500">{t.noData}</p>
        )}

        {!loading && !err && list.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r, i) => (
              <article
                key={`${r.departure_stop_id}-${r.arrival_stop_id}-${i}`}
                className="group flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 hover:ring-sky-300 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-8 w-8 grid place-items-center rounded-lg bg-sky-100 text-sky-700">
                    <Bus className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[15px] font-medium text-slate-800 truncate">
                      <span className="truncate">{r.departure_name.trim()}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{r.arrival_name.trim()}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center rounded-full bg-orange-500/10 text-orange-600 px-3 py-1 text-sm font-semibold">
                    {formatPrice(r.price, t.currency)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
