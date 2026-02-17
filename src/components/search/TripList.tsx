import React from "react";
import type { Lang, Tour } from "./types";
import { formatDate } from "@/utils/date";
import TripCard from "../TripCard";

type TripListProps = {
  title: string;
  tours: Tour[];
  selectedId?: number;
  onSelect: (tour: Tour) => void;
  fromName: string;
  toName: string;
  lang: Lang;
  seatCount: number;
  discountCount: number;
  t: {
    chosen: string;
    adults: string;
    discounted: string;
  };
};

export default function TripList({
  title,
  tours,
  selectedId,
  onSelect,
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
      <h3 className="mb-1 text-base font-semibold text-slate-900">{title}</h3>
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

          const adults = Math.max(0, seatCount - discountCount);
          const adultSum = adults * tour.price;
          const discSum = discountCount * tour.price * (1 - DISCOUNT);
          const total = adultSum + discSum;

          return (
            <TripCard
              key={tour.id}
              // Здесь рендерится блок "departure → arrival" внутри списка выбора рейса
              dateText={dateStr}
              fromStop={fromName}
              toStop={toName}
              departTime={depTime}
              arriveTime={arrTime}
              total={total}
              onSelect={() => onSelect(tour)}
              selected={isChosen}
              chosenLabel={t.chosen}
            />
          );
        })}
      </div>
    </>
  );
}
