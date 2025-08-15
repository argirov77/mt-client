import React from "react";
import type { Tour } from "./SearchResults";

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
      <h3 style={{ marginTop: 12, marginBottom: 8 }}>{title}:</h3>
      {tours.map((tour) => {
        const isChosen = selectedId === tour.id;
        return (
          <div
            key={tour.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span>
              Рейс #{tour.id}, дата: {tour.date} —{" "}
              {t.freeSeats(freeSeatsValue(tour.seats))}
            </span>
            <button onClick={() => onSelect(tour)}>
              {isChosen ? t.chosen : t.pick}
            </button>
          </div>
        );
      })}
    </>
  );
}
