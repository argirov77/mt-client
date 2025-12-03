'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { ArrowRight, Bus } from 'lucide-react';
import {
  accentPillClass,
  bodyTextClass,
  cardBaseClass,
  headingH2Class,
  iconCircleClass,
  sectionBgMuted,
  secondaryEyebrowClass,
} from './common/designGuide';

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
    <section id="prices" className={`${sectionBgMuted} py-16`}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-8 text-center">
          <p className={secondaryEyebrowClass}>{t.title}</p>
          <h2 className={`${headingH2Class} mt-2`}>{t.title}</h2>
          <p className={`${bodyTextClass} mt-3 text-slate-600`}>
            {lang === 'en'
              ? 'Actual fares for popular directions. Same card style as booking steps.'
              : 'Актуальные тарифы по популярным направлениям — в едином стиле бронирования.'}
          </p>
        </div>

        {loading && (
          <p className="text-center text-slate-500">{t.loading}</p>
        )}
        {!loading && err && (
          <p className="text-center text-red-500">{t.error}</p>
        )}
        {!loading && !err && list.length === 0 && (
          <p className="text-center text-slate-500">{t.noData}</p>
        )}

        {!loading && !err && list.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r, i) => (
              <article
                key={`${r.departure_stop_id}-${r.arrival_stop_id}-${i}`}
                className={`${cardBaseClass} group flex items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`${iconCircleClass} h-10 w-10`}> 
                    <Bus className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-base font-semibold text-slate-900 truncate">
                      <span className="truncate">{r.departure_name.trim()}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{r.arrival_name.trim()}</span>
                    </div>
                    <p className={`${bodyTextClass} m-0 text-slate-600`}>
                      {lang === 'en'
                        ? 'Direct coach service'
                        : 'Прямой автобусный рейс'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={accentPillClass}>{formatPrice(r.price, t.currency)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
