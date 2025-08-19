import React from "react";
import type { Tour } from "./SearchResults";
import styles from "./TripList.module.css";

type TripListProps = {
  title: string;
  tours: Tour[];
  selectedId?: number;
  onSelect: (tour: Tour) => void;
  freeSeatsValue: (s: Tour["seats"]) => number;
  t: {
    pick: string;
    chosen: string;
    freeSeats: (n: number) => string;
  };
};

export default function TripList({
  title,
  tours,
  selectedId,
  onSelect,
  freeSeatsValue,
  t,
}: TripListProps) {
  return (
    <>
      <h3 className="mt-3 mb-2">{title}:</h3>
      {tours.map((tour) => {
        const isChosen = selectedId === tour.id;
        return (
          <div key={tour.id} className={styles.item}>
            <span>
              Рейс #{tour.id}, дата: {tour.date} —{" "}
              {t.freeSeats(freeSeatsValue(tour.seats))}
            </span>
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
