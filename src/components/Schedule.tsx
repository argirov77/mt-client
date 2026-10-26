'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { STOP, findTripKeyForStopPair, tripsData } from '@/lib/tripsData';
import { buildPath } from '@/lib/seo';
import { routesTranslations, scheduleTranslations } from '@/translations/home';
import {
  accentPillClass,
  buttonPrimaryClass,
  cardTitleClass,
  notePillClass,
  sectionBgMuted,
  sectionEyebrowClass,
  sectionEyebrowOnDarkClass,
  sectionInnerClass,
  sectionPadClass,
  sectionTitleClass,
} from './common/designGuide';
import type { Lang } from './common/LanguageProvider';
import { useSectionView } from '@/utils/useSectionView';

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

type PriceListProps = {
  lang?: Lang;
  /** Данные, отрендеренные на сервере. Пусто — компонент догрузит их сам. */
  initialPrices?: PriceItem[] | null;
};

/** Цены из продажи, сгруппированные как в макете: из Одессы, в Одессу, между городами. */
export default function PriceListCompact({ lang = 'ru', initialPrices }: PriceListProps) {
  const t = scheduleTranslations[lang];
  const routesCopy = routesTranslations[lang];
  const hasInitial = Array.isArray(initialPrices) && initialPrices.length > 0;
  const [list, setList] = useState<PriceItem[]>(hasInitial ? initialPrices : []);
  const [loading, setLoading] = useState(!hasInitial);
  const [err, setErr] = useState(false);
  // Локаль, которой соответствуют текущие данные. null — данных нет.
  const [dataLang, setDataLang] = useState<Lang | null>(hasInitial ? lang : null);
  const sectionRef = useSectionView<HTMLElement>('prices');

  // Пришли серверные данные для другой локали (переключение языка) — принимаем
  // их сразу, без похода в сеть. Штатный приём React для синхронизации стейта
  // с пропсами; повтора не будет, потому что dataLang сразу становится lang.
  if (hasInitial && dataLang !== lang) {
    setList(initialPrices);
    setDataLang(lang);
    setErr(false);
    setLoading(false);
  }

  // Клиентский фетч остаётся фолбэком: если серверные пропсы пришли пустыми,
  // компонент догружает данные в браузере, как делал раньше.
  useEffect(() => {
    if (dataLang === lang) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(false);
        const { data } = await apiClient.post('/selected_pricelist', { lang });
        if (!cancelled) {
          setList(data?.prices || []);
          setDataLang(lang);
        }
      } catch {
        if (!cancelled) setErr(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, dataLang]);

  // Группы — по id остановки Одессы, а не по названию: названия переведены.
  const groups = [
    {
      key: 'from',
      title: t.groupFrom,
      days: routesCopy.daysForward,
      items: list.filter((item) => item.departure_stop_id === STOP.odessa),
    },
    {
      key: 'to',
      title: t.groupTo,
      days: routesCopy.daysBackward,
      items: list.filter((item) => item.arrival_stop_id === STOP.odessa),
    },
    {
      key: 'between',
      title: t.groupBetween,
      days: '',
      items: list.filter(
        (item) => item.departure_stop_id !== STOP.odessa && item.arrival_stop_id !== STOP.odessa,
      ),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <section id="prices" ref={sectionRef} className={`${sectionBgMuted} ${sectionPadClass}`}>
      <div className={`${sectionInnerClass} flex flex-col gap-7 lg:gap-10`}>
        <div className="flex flex-wrap items-end justify-between gap-5 lg:gap-12">
          <div className="flex flex-1 basis-[520px] flex-col gap-4">
            <span className={sectionEyebrowClass}>{t.eyebrow}</span>
            <h2 className={sectionTitleClass}>{t.title}</h2>
          </div>
          <div className="flex flex-1 basis-[380px] flex-wrap gap-2">
            {t.meta.map((item) => (
              <span key={item} className={notePillClass}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {loading && <p className="text-[15px] text-[#5c6370]">{t.loading}</p>}
        {!loading && err && <p className="text-[15px] text-[#c2410c]">{t.error}</p>}
        {!loading && !err && list.length === 0 && (
          <p className="text-[15px] text-[#5c6370]">{t.noData}</p>
        )}

        {!loading && !err && groups.length > 0 && (
          <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group.key} className="flex flex-col rounded-3xl bg-white p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3 pb-2.5">
                  <h3 className={`${cardTitleClass} text-[19px]`}>{group.title}</h3>
                  {group.days ? <span className={accentPillClass}>{group.days}</span> : null}
                </div>

                {group.items.map((item, index) => {
                  const tripKey = findTripKeyForStopPair(item.departure_stop_id, item.arrival_stop_id);
                  const slug = tripKey ? tripsData[tripKey]?.i18n[lang]?.slug : null;
                  const href = slug ? buildPath(lang, `/${slug}`) : null;
                  const label =
                    group.key === 'from'
                      ? item.arrival_name.trim()
                      : group.key === 'to'
                        ? item.departure_name.trim()
                        : `${item.departure_name.trim()} → ${item.arrival_name.trim()}`;
                  const price = (
                    <span className="font-display whitespace-nowrap text-[17px] font-bold text-[#173452]">
                      {formatPrice(item.price, t.currency)}
                    </span>
                  );
                  const key = `${item.departure_stop_id}-${item.arrival_stop_id}-${index}`;
                  const rowClass =
                    'grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-3 border-t border-[#eeebe6] first:border-t-0';

                  return href ? (
                    <Link key={key} href={href} className={`${rowClass} group`}>
                      <span className="truncate text-[16px] font-semibold text-[#173452] group-hover:text-[#c2410c]">
                        {label}
                      </span>
                      {price}
                      <ChevronRight className="h-[18px] w-[18px] text-[#a3a7ad]" aria-hidden />
                    </Link>
                  ) : (
                    <div key={key} className={rowClass}>
                      <span className="truncate text-[16px] font-semibold text-[#173452]">{label}</span>
                      {price}
                      <span />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 gap-x-8 rounded-3xl bg-[#173452] p-5 text-white sm:p-7">
          <div className="flex flex-1 basis-[300px] flex-col gap-1.5">
            <span className={sectionEyebrowOnDarkClass}>{t.returnKicker}</span>
            <span className="font-display text-[20px] font-bold sm:text-[26px]">{t.returnTitle}</span>
          </div>
          <p className="flex-[2] basis-[380px] text-base text-white/85">{t.returnNote}</p>
          <Link href="#booking" className={buttonPrimaryClass}>
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
