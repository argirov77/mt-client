"use client";

import React from "react";
import BusLayout, { SeatData } from "./BusLayout";

type Props = {
  seats?: SeatData[];
  selectedSeats?: number[];
  toggleSeat?: (seatNum: number) => void;
  interactive?: boolean;
};

const NEOPLAN_LAYOUT: string[] = [
  "20004",
  "33-33",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "---33",
  "11054",
  "---33",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
];

const NEOPLAN_SEAT_NUMBERS = [
  1, 2, 3, 4,
  5, 6, 7, 8,
  9, 10, 11, 12,
  13, 14, 15, 16,
  17, 18, 19, 20,
  21, 22, 23, 24,
  25, 26,
  29, 30, 31, 32,
  33, 34, 35, 36,
  37, 38, 39, 40,
  41, 42, 43, 44,
  45, 46, 47, 48,
];

export default function Neoplan({
  seats = [],
  selectedSeats = [],
  toggleSeat,
  interactive = false,
}: Props) {
  return (
    <BusLayout
      layout={NEOPLAN_LAYOUT}
      seats={seats}
      selectedSeats={selectedSeats}
      toggleSeat={toggleSeat}
      interactive={interactive}
      seatNumbers={NEOPLAN_SEAT_NUMBERS}
    />
  );
}
