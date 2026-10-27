import React from "react";
import type { Dict, Lang, Tour } from "./types";
import TripCard from "../TripCard";
import {
  arrivalWeekday,
  formatDayShort,
  formatDuration,
  formatUah,
  shortTime,
  tripDuration,
} from "@/utils/tripFormat";

type TripListProps = {
  title: string;
  heading: string; // «Туда» / «Обратно»
  tours: Tour[];
  selectedId?: number;
  onSelect: (tour: Tour) => void;
  onChange?: () => void;
  fromName: string;
  toName: string;
  lang: Lang;
  seatCount: number;
  discountCount: number;
  // обратный рейс при покупке туда-обратно: цена сразу со скидкой −10%
  isReturn?: boolean;
  t: Dict;
};

const CHILD_DISCOUNT = 0.05;
export const RETURN_DISCOUNT = 0.1;

export const freeSeatsOf = (tour: Tour) =>
  typeof tour.seats === "number" ? tour.seats : tour.seats?.free ?? 0;

/** Стоимость рейса на всех пассажиров (льготный тариф — как раньше, −5%). */
export const tourTotal = (tour: Tour, seatCount: number, discountCount: number) => {
  const adults = Math.max(0, seatCount - discountCount);
  return adults * tour.price + discountCount * tour.price * (1 - CHILD_DISCOUNT);
};

export default function TripList({
  title,
  heading,
  tours,
  selectedId,
  onSelect,
  onChange,
  fromName,
  toName,
  lang,
  seatCount,
  discountCount,
  isReturn = false,
  t,
}: TripListProps) {
  const selectedTour = tours.find((tour) => tour.id === selectedId) ?? null;
  const visibleTours = selectedTour ? [selectedTour] : tours;
  const otherTours = selectedTour ? tours.filter((tour) => tour.id !== selectedTour.id) : [];

  const renderCard = (tour: Tour) => {
    const duration = tripDuration(tour.departure_time, tour.arrival_time);
    const arriveDay = duration?.dayShift
      ? arrivalWeekday(tour.date, tour.departure_time, tour.arrival_time, lang)
      : "";
    const total = tourTotal(tour, seatCount, discountCount);
    const discounted = isReturn ? total * (1 - RETURN_DISCOUNT) : total;
    const free = freeSeatsOf(tour);
    const breakdown =
      !isReturn && seatCount > 1 && discountCount === 0
        ? `${seatCount} × ${formatUah(tour.price).replace(" ₴", "")} =`
        : undefined;

    return (
      <TripCard
        key={tour.id}
        heading={`${heading} · ${formatDayShort(tour.date, lang)}`}
        fromStop={fromName}
        toStop={toName}
        departTime={shortTime(tour.departure_time)}
        arriveTime={shortTime(tour.arrival_time)}
        arriveDay={arriveDay}
        durationText={duration ? `~${formatDuration(duration.minutes, lang)}` : undefined}
        freeSeatsText={free > 0 ? t.freeSeats(free) : undefined}
        priceBreakdown={breakdown}
        priceText={formatUah(discounted)}
        oldPriceText={isReturn ? formatUah(total).replace(" ₴", "") : undefined}
        discountBadge={isReturn ? "−10%" : undefined}
        onSelect={() => onSelect(tour)}
        selected={tour.id === selectedId}
        chosenLabel={t.chosen}
        changeLabel={t.change}
        onChange={onChange}
      />
    );
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[#173452]">{title}</h3>
      <div className="flex flex-col gap-2">{visibleTours.map(renderCard)}</div>
      {otherTours.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-[#5c6370]">{t.otherDates}:</span>
          {otherTours.map((tour) => (
            <button
              key={tour.id}
              type="button"
              onClick={() => onSelect(tour)}
              className="min-h-[36px] rounded-lg border border-[#e3dfd9] bg-white px-2.5 text-sm font-semibold text-[#c2410c] hover:border-[#fdba74]"
            >
              {formatDayShort(tour.date, lang)} {shortTime(tour.departure_time)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
