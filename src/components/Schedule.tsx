'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { ArrowRight, Bus } from 'lucide-react';
import { scheduleTranslations } from '@/translations/home';
import {
  accentPillClass,
  bodyTextClass,
  cardBaseClass,
  iconCircleClass,
  sectionBgMuted,
  sectionDescriptionClass,
  sectionEyebrowClass,
  sectionTitleClass,
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
    <section id="prices" className={`${sectionBgMuted} py-12`}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-8 text-center">
          <p className={sectionEyebrowClass}>{t.eyebrow}</p>
          <h2 className={`${sectionTitleClass} mt-2`}>{t.title}</h2>
          <p className={`${sectionDescriptionClass} mt-3`}>{t.description}</p>
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
                      {t.serviceDescription}
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
