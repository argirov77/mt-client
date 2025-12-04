"use client";

import React from "react";
import BusLayout, { SeatData } from "./BusLayout";

type Props = {
  seats?: SeatData[];
  selectedSeats?: number[];
  toggleSeat?: (seatNum: number) => void;
  interactive?: boolean;
};

const TRAVEGO_LAYOUT: string[] = [
  "20004",
  "33-33",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "11011",
  "---33",
  "11054",
  "---33",
  "11111",
];

export default function Travego({
  seats = [],
  selectedSeats = [],
  toggleSeat,
  interactive = false,
}: Props) {
  return (
    <BusLayout
      layout={TRAVEGO_LAYOUT}
      seats={seats}
      selectedSeats={selectedSeats}
      toggleSeat={toggleSeat}
      interactive={interactive}
    />
  );
}
