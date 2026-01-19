'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { scheduleTranslations } from '@/translations/home';
import {
  sectionBgMuted,
} from './common/designGuide';
import type { Lang } from './common/LanguageProvider';

type PriceItem = {
  departure_stop_id: number;
  departure_name: string;
  arrival_stop_id: number;
  arrival_name: string;
  price: number;
};


function formatPrice(n: number, curr: string) {
  return `${Number(n).toFixed(0)} ${curr}`;
}

export default function PriceListCompact({ lang = 'ru' }: { lang?: Lang }) {
  const t = scheduleTranslations[lang];
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
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-3 text-base text-slate-500">{t.description}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {t.meta.map((item) => (
              <span
                key={item}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((r, i) => (
              <article
                key={`${r.departure_stop_id}-${r.arrival_stop_id}-${i}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <span className="truncate">{r.departure_name.trim()}</span>
                    <span className="text-slate-400">→</span>
                    <span className="truncate">{r.arrival_name.trim()}</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                  {formatPrice(r.price, t.currency)}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
