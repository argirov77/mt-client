import React from "react";
import type { Tour } from "./SearchResults";
import { formatDate } from "@/utils/date";
import TripCard, { PriceRow } from "../TripCard";

type TripListProps = {
  title: string;
  tours: Tour[];
  selectedId?: number;
  onSelect: (tour: Tour) => void;
  freeSeatsValue: (s: Tour["seats"]) => number;
  fromName: string;
  toName: string;
  lang: "ru" | "bg" | "en" | "ua";
  seatCount: number;
  discountCount: number;
  t: {
    pick: string;
    chosen: string;
    freeSeats: (n: number) => string;
    adults: string;
    discounted: string;
    departure: string;
    arrival: string;
    inRoute: string;
  };
};

export default function TripList({
  title,
  tours,
  selectedId,
  onSelect,
  freeSeatsValue,
  fromName,
  toName,
  lang,
  seatCount,
  discountCount,
  t,
}: TripListProps) {
  const DISCOUNT = 0.05;

  return (
    <>
      <h3 className="sticky top-0 z-10 -mx-3 -mt-1 mb-2 bg-white/95 px-3 py-2 text-base font-semibold text-slate-900 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
        {title}
      </h3>
      <div className="flex flex-col gap-3">
        {tours.map((tour) => {
          const isChosen = selectedId === tour.id;

          const dep = new Date(`${tour.date}T${tour.departure_time}`);
          const arr = new Date(`${tour.date}T${tour.arrival_time}`);
          if (arr.getTime() < dep.getTime()) {
            arr.setDate(arr.getDate() + 1);
          }
          const dateStr = formatDate(dep);
          const depTime = dep.toLocaleTimeString(lang, {
            hour: "2-digit",
            minute: "2-digit",
          });
          const arrTime = arr.toLocaleTimeString(lang, {
            hour: "2-digit",
            minute: "2-digit",
          });
          const diffMinutes = Math.max(
            0,
            Math.round((arr.getTime() - dep.getTime()) / 60000)
          );
          const h = Math.floor(diffMinutes / 60);
          const m = diffMinutes % 60;
          const duration =
            lang === "ru" || lang === "bg" || lang === "ua"
              ? `${h}ч ${m}м`
              : `${h}h ${m}m`;

          const adults = Math.max(0, seatCount - discountCount);
          const adultSum = adults * tour.price;
          const discSum = discountCount * tour.price * (1 - DISCOUNT);
          const total = adultSum + discSum;

          const rows: PriceRow[] = [];
          if (adults > 0) {
            rows.push({ label: t.adults, count: adults, price: tour.price });
          }
          if (discountCount > 0) {
            rows.push({
              label: t.discounted,
              count: discountCount,
              price: tour.price,
              discount: DISCOUNT * 100,
            });
          }

          return (
            <TripCard
              key={tour.id}
              dateText={dateStr}
              fromStop={fromName}
              toStop={toName}
              departTime={depTime}
              arriveTime={arrTime}
              duration={duration}
              departureLabel={t.departure}
              arrivalLabel={t.arrival}
              inRouteLabel={t.inRoute}
              freeSeats={freeSeatsValue(tour.seats)}
              rows={rows}
              total={total}
              onSelect={() => onSelect(tour)}
              selected={isChosen}
              pickLabel={t.pick}
              chosenLabel={t.chosen}
              freeSeatsText={t.freeSeats}
            />
          );
        })}
      </div>
    </>
  );
}
