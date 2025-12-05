"use client";

import React from "react";
import BusLayout, { SeatData, CellCode } from "./BusLayout";

type Props = {
  seats?: SeatData[];
  selectedSeats?: number[];
  toggleSeat?: (seatNum: number) => void;
  interactive?: boolean;
};

/**
 * 5 колонок:
 *  [0,1] — левый блок сидений
 *  [2]   — коридор (0)
 *  [3,4] — правый блок сидений
 *
 * Коды:
 *  - число  -> конкретное место
 *  - "d"    -> водитель
 *  - "e"    -> дверь
 *  - "t"    -> туалет
 *  - "0"    -> коридор
 *  - "w"    -> стена / перегородка между рядами
 *  - "-"    -> пустая ячейка
 */
const NEOPLAN_LAYOUT: CellCode[] = [
  //   0    1    2    3    4
  "d", "0", "0", "0", "e", // водитель + вход
  "w", "w", "-", "w", "w", // перегородка

  1, 2, "0", 3, 4,
  5, 6, "0", 7, 8,
  9, 10, "0", 11, 12,
  13, 14, "0", 15, 16,
  17, 18, "0", 19, 20,
  21, 22, "0", 23, 24,

  "-", "-", "-", "w", "w", // перегородка перед туалетом

  25, 26, "0", "t", "e", // WC + дверь
  "-", "-", "-", "w", "w",
  29, 30, "0", 31, 32,
  33, 34, "0", 35, 36,
  37, 38, "0", 39, 40,
  41, 42, "0", 43, 44,
  45, 46, "0", "-", "-", // в конце меньше сидений справа
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
    />
  );
}
