import React from "react";
import type { Tour } from "./SearchResults";
import styles from "./TripList.module.css";

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
    inRoute: string;
    price: string;
    total: string;
    adults: string;
    discounted: string;
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
      <h3 className="mt-3 mb-2">{title}:</h3>
      {tours.map((tour) => {
        const isChosen = selectedId === tour.id;

        const dep = new Date(`${tour.date}T${tour.departure_time}`);
        const arr = new Date(`${tour.date}T${tour.arrival_time}`);
        if (arr.getTime() < dep.getTime()) {
          arr.setDate(arr.getDate() + 1);
        }
        const dateStr = dep.toLocaleDateString(lang);
        const depTime = dep.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
        const arrTime = arr.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
        const diffMinutes = Math.max(0, Math.round((arr.getTime() - dep.getTime()) / 60000));
        const h = Math.floor(diffMinutes / 60);
        const m = diffMinutes % 60;
        const duration =
          lang === "ru" || lang === "bg" || lang === "ua"
            ? `${h}ч ${m}м`
            : `${h}h ${m}m`;

        const adults = Math.max(0, seatCount - discountCount);
        const adultSum = adults * tour.price;
        const discPrice = tour.price * (1 - DISCOUNT);
        const discSum = discountCount * discPrice;
        const total = adultSum + discSum;

        return (
          <div key={tour.id} className={styles.item}>
            <div className="flex-1">
              <div>
                {dateStr} {depTime} {fromName} → {arrTime} {toName} ({duration})
              </div>
              <div>{t.price}: {tour.price.toFixed(2)}</div>
              {adults > 0 && (
                <div>
                  {adults} {t.adults} {tour.price.toFixed(2)} × {adults} = {adultSum.toFixed(2)}
                </div>
              )}
              {discountCount > 0 && (
                <div>
                  {discountCount} {t.discounted} {tour.price.toFixed(2)} × {discountCount} -5% = {discSum.toFixed(2)}
                </div>
              )}
              <div>
                {t.total}: {total.toFixed(2)}
              </div>
              <div>{t.freeSeats(freeSeatsValue(tour.seats))}</div>
            </div>
            <button
              onClick={() => onSelect(tour)}
              className={`${styles.btn} ${isChosen ? styles.chosen : styles.pick}`}
            >
              {isChosen ? t.chosen : t.pick}
            </button>
          </div>
        );
      })}
    </>
  );
}
