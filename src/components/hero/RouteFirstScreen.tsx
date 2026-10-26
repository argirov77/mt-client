"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import BookingCard from "@/components/booking/BookingCard";
import apiClient from "@/lib/apiClient";
import type { Lang } from "@/lib/locale";
import { firstScreenTranslations } from "@/translations/firstScreen";
import {
  arrivalWeekday,
  formatDayShort,
  formatUah,
  shortTime,
  tripDuration,
  weekdaysOfDates,
} from "@/utils/tripFormat";
import { openTripInBooking, useNearestTrips } from "@/utils/useNearestTrips";

type Stop = { id: number; stop_name: string };

type Props = {
  lang: Lang;
  title: string;
  subtitle?: string;
  fromId?: number;
  toId?: number;
};

// Названия остановок — из тех же справочников, что у формы поиска.
function useStopNames(lang: Lang, fromId?: number, toId?: number) {
  const [names, setNames] = useState({ from: "", to: "" });
  useEffect(() => {
    if (!fromId || !toId) return;
    let cancelled = false;
    Promise.all([
      apiClient.post<Stop[]>("/search/departures", { seats: 1, lang }),
      apiClient.post<Stop[]>("/search/arrivals", { departure_stop_id: fromId, seats: 1, lang }),
    ])
      .then(([deps, arrs]) => {
        if (cancelled) return;
        setNames({
          from: deps.data?.find((s) => s.id === fromId)?.stop_name ?? "",
          to: arrs.data?.find((s) => s.id === toId)?.stop_name ?? "",
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [fromId, toId, lang]);
  return names;
}

/**
 * Первый экран страницы маршрута: вместо большого фото — время, цена,
 * дни рейсов и ближайшие рейсы со свободными местами. На компьютере
 * справа форма бронирования, на телефоне — ниже, с закреплённой кнопкой.
 */
export default function RouteFirstScreen({ lang, title, subtitle, fromId, toId }: Props) {
  const t = firstScreenTranslations[lang];
  const outbound = useNearestTrips(fromId, toId, 3);
  const inbound = useNearestTrips(toId, fromId, 0);
  const names = useStopNames(lang, fromId, toId);

  const [flowActive, setFlowActive] = useState(false);
  const [bookingVisible, setBookingVisible] = useState(true);
  const bookingRef = useRef<HTMLDivElement | null>(null);

  const handleFlowChange = useCallback((active: boolean) => setFlowActive(active), []);

  useEffect(() => {
    const node = bookingRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setBookingVisible(entry.isIntersecting), {
      rootMargin: "0px 0px -35% 0px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const first = outbound.trips[0];
  const duration = first ? tripDuration(first.tour.departure_time, first.tour.arrival_time) : null;
  const arriveDay =
    first && duration?.dayShift
      ? arrivalWeekday(first.date, first.tour.departure_time, first.tour.arrival_time, lang)
      : "";
  const minPrice = outbound.trips.length ? Math.min(...outbound.trips.map((trip) => trip.tour.price)) : null;
  const days = weekdaysOfDates(outbound.dates.slice(0, 14), lang);
  const returnDays = weekdaysOfDates(inbound.dates.slice(0, 14), lang);
  const isRoute = Boolean(fromId && toId);

  const openTrip = (index: number) => {
    const trip = outbound.trips[index];
    if (!trip || !fromId || !toId || !names.from || !names.to) {
      bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    openTripInBooking({
      from: fromId,
      to: toId,
      fromName: names.from,
      toName: names.to,
      date: trip.date,
      tourId: trip.tour.id,
    });
    window.setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const chip = "rounded-full bg-white/15 px-2.5 py-1 text-xs sm:text-sm";

  return (
    <section id="hero" className="bg-[#f6f4f1] px-3 pb-8 pt-3 sm:px-4">
      <div
        className={`mx-auto grid w-full max-w-6xl items-start gap-4 lg:gap-6 ${
          flowActive ? "" : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        }`}
      >
        <div className="space-y-3">
          <div
            className="relative overflow-hidden rounded-2xl bg-[#173452] px-4 py-5 text-white sm:px-6 sm:py-7"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(23,52,82,0.86) 0%, rgba(23,52,82,0.94) 100%), url('/images/hero-webp.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#fdba74]">{t.directSince}</p>
            <h1 className="mt-2 text-[clamp(24px,4vw,40px)] font-black leading-[1.1] tracking-[-0.02em]">{title}</h1>
            {subtitle && !isRoute ? <p className="mt-2 text-sm text-white/85">{subtitle}</p> : null}
            {isRoute ? (
              <div className="mt-3 flex min-h-[28px] flex-wrap gap-1.5">
                {first ? (
                  <span className={chip}>
                    <b>
                      {shortTime(first.tour.departure_time)} → {shortTime(first.tour.arrival_time)}
                    </b>
                    {arriveDay ? ` (${arriveDay})` : ""}
                  </span>
                ) : null}
                {minPrice != null ? (
                  <span className={chip}>
                    <b>{t.fromPrice(formatUah(minPrice))}</b>
                  </span>
                ) : null}
                {days ? (
                  <span className={chip}>
                    {t.onDays("")}
                    <b>{days}</b>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {isRoute && (outbound.loading || outbound.trips.length > 0) ? (
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#5c6370]">{t.nearestTrips}</p>
              <div className="grid grid-cols-3 gap-2">
                {outbound.loading
                  ? [0, 1, 2].map((key) => (
                      <span key={key} className="h-[58px] animate-pulse rounded-xl bg-[#e3dfd9]/70" aria-hidden />
                    ))
                  : outbound.trips.map((trip, index) => (
                      <button
                        key={trip.date}
                        type="button"
                        onClick={() => openTrip(index)}
                        className="flex min-h-[58px] flex-col items-center justify-center rounded-xl border border-[#e3dfd9] bg-white px-1 py-2 transition hover:border-[#fdba74] hover:shadow-sm"
                      >
                        <b className="text-sm text-[#173452]">{formatDayShort(trip.date, lang)}</b>
                        <span className="text-xs font-semibold text-emerald-700">{t.seatsFree(trip.freeSeats)}</span>
                      </button>
                    ))}
              </div>
            </div>
          ) : null}

          {isRoute ? (
            <p className="rounded-xl bg-[#fdf0e7] px-3 py-2 text-sm text-[#173452]">
              {returnDays && names.from && names.to
                ? t.returnDiscount(`${names.to} → ${names.from}`, returnDays)
                : t.returnDiscountShort}
            </p>
          ) : null}

          <ul className="space-y-1 rounded-xl border border-[#e3dfd9] bg-white px-3 py-2.5 text-sm text-[#173452]">
            {[t.baggageIncluded, t.freeBooking].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div id="booking" ref={bookingRef} className="scroll-mt-20">
          {!flowActive ? (
            <h2 className="mb-2 px-1 text-lg font-bold text-[#173452] sm:text-xl">{t.formTitle}</h2>
          ) : null}
          <BookingCard forcedFromId={fromId} forcedToId={toId} onFlowChange={handleFlowChange} />
        </div>
      </div>

      {/* Телефон: кнопка «Выбрать рейс» закреплена внизу, пока форма не на экране */}
      {!flowActive && !bookingVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-[#e3dfd9] bg-white px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_14px_rgba(15,23,42,0.07)] lg:hidden">
          {first ? (
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] text-[#5c6370]">{formatDayShort(first.date, lang)}</span>
              <b className="text-base text-[#173452]">{formatUah(first.tour.price)}</b>
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => openTrip(0)}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#c2410c] px-4 text-sm font-bold text-white hover:bg-[#a8380b]"
          >
            {t.chooseTrip}
          </button>
        </div>
      ) : null}
    </section>
  );
}
