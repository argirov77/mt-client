"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import BookingCard from "@/components/booking/BookingCard";
import type { Lang } from "@/lib/locale";
import { firstScreenTranslations } from "@/translations/firstScreen";
import { heroTranslations } from "@/translations/home";
import { formatUah, shortTime, weekdaysOfDates } from "@/utils/tripFormat";
import { useNearestTrips } from "@/utils/useNearestTrips";

export type PopularRoute = {
  key: string;
  href: string;
  label: string;
  fromId: number;
  toId: number;
};

type Props = {
  lang: Lang;
  routes: PopularRoute[];
};

function PopularRouteRow({ route, lang }: { route: PopularRoute; lang: Lang }) {
  // Дни, время и цена — из продажи (тот же поиск, что у формы),
  // а не из блока «Актуальные тарифы».
  const nearest = useNearestTrips(route.fromId, route.toId, 1);
  const trip = nearest.trips[0];
  const days = weekdaysOfDates(nearest.dates.slice(0, 14), lang).replace(/ (и|та|and) /, ", ");
  return (
    <li>
      <Link
        href={route.href}
        className="flex min-h-[56px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 transition hover:border-[#93b8e6] hover:shadow-sm"
      >
        <span className="min-w-0 flex-1">
          <b className="block truncate text-sm text-slate-900">{route.label}</b>
          <span className="block text-xs text-slate-600">
            {nearest.loading ? "…" : [days, trip ? shortTime(trip.tour.departure_time) : ""].filter(Boolean).join(" · ")}
          </span>
        </span>
        {trip ? <b className="shrink-0 text-sm text-slate-900">{formatUah(trip.tour.price)}</b> : null}
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      </Link>
    </li>
  );
}

/** Первый экран главной: форма поиска сразу, популярные направления с ценой. */
export default function HomeFirstScreen({ lang, routes }: Props) {
  const t = firstScreenTranslations[lang];
  const hero = heroTranslations[lang];
  const [flowActive, setFlowActive] = useState(false);
  const handleFlowChange = useCallback((active: boolean) => setFlowActive(active), []);

  return (
    <section id="hero" className="bg-slate-50 px-3 pb-8 pt-3 sm:px-4">
      {/* Телефон: заголовок → форма → направления. Компьютер: слева заголовок
          и направления, справа форма на всю высоту. */}
      <div
        className={`mx-auto grid w-full max-w-6xl items-start gap-4 lg:gap-x-6 ${
          flowActive ? "" : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        }`}
      >
        <div
          className="overflow-hidden rounded-2xl bg-[#173452] px-4 py-5 text-white sm:px-6 sm:py-7 lg:col-start-1"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(23,52,82,0.8) 0%, rgba(23,52,82,0.94) 100%), url('/images/hero-webp.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#c9d6e6]">{t.homeEyebrow}</p>
          <h1 className="mt-2 text-[clamp(24px,4vw,40px)] font-black leading-[1.1] tracking-[-0.02em]">
            {t.homeTitle}
          </h1>
          <p className="mt-2 text-sm text-white/85">{hero.route}</p>
        </div>

        <div
          id="booking"
          className={`scroll-mt-20 ${flowActive ? "" : "lg:col-start-2 lg:row-span-2 lg:row-start-1"}`}
        >
          {!flowActive ? (
            <h2 className="mb-2 px-1 text-lg font-bold text-slate-900 sm:text-xl">{t.formTitle}</h2>
          ) : null}
          <BookingCard onFlowChange={handleFlowChange} />
        </div>

        {!flowActive ? (
          <div className="lg:col-start-1 lg:row-start-2">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">{t.popular}</p>
            <ul className="space-y-2">
              {routes.map((route) => (
                <PopularRouteRow key={route.key} route={route} lang={lang} />
              ))}
            </ul>
            <a
              href="#parcel"
              className="mt-2 flex min-h-[48px] items-center gap-3 rounded-xl bg-[#eef3f9] px-3 py-2 text-sm font-semibold text-[#173452] hover:bg-[#e3eefb]"
            >
              <span className="flex-1">{t.parcels}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
