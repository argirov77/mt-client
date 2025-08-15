"use client";

import React from "react";

/** Шаблон Travego (как в Neoplan, можно править матрицу под ваш автобус) */
const layoutTravego: (number | null)[][] = [
  [1,  2,  null,  3,  4],
  [5,  6,  null,  7,  8],
  [9, 10,  null, 11, 12],
  [13, 14, null, 15, 16],
  [17, 18, null, 19, 20],
  [21, 22, null, 23, 24],
  [25, 26, null, 27, 28],
  [29, 30, null, 31, 32],
  [33, 34, null, 35, 36],
  [37, 38, null, 39, 40],
  [41, 42, null, 43, 44],
  [45, 46, null, 47, 48],
  [49, 50, null, 51, 52],
  [53, 54, null, 55, null],
];

function transpose<T>(m: T[][]): T[][] {
  const rows = m.length;
  const cols = Math.max(...m.map(r => r.length));
  const t: T[][] = Array.from({ length: cols }, () => Array(rows).fill(null as unknown as T));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < m[i].length; j++) {
      t[j][i] = m[i][j];
    }
  }
  return t;
}
const layoutHorizontal = transpose(layoutTravego);

type SeatData = { seat_num: number; status: "available" | "occupied" | "blocked" | string };

type Props = {
  renderCell?: (seatNum: number) => React.ReactNode;

  seats?: SeatData[];
  selectedSeats?: number[];
  toggleSeat?: (seatNum: number) => void;
  interactive?: boolean;

  cell?: { w?: number; h?: number };
  gap?: number;
};

export default function Travego({
  renderCell,
  seats = [],
  selectedSeats = [],
  toggleSeat,
  interactive = false,
  cell = { w: 40, h: 40 },
  gap = 6,
}: Props) {
  // skeleton-режим
  if (typeof renderCell === "function") {
    return (
      <div style={{ display: "flex", flexDirection: "row", gap }}>
        {layoutHorizontal.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap }}>
            {col.map((seatNum, ri) =>
              seatNum === null
                ? <div key={ri} style={{ width: cell.w, height: cell.h }} />
                : <React.Fragment key={ri}>{renderCell(seatNum)}</React.Fragment>
            )}
          </div>
        ))}
      </div>
    );
  }

  // legacy-режим
  const statusMap: Record<number, SeatData["status"]> = {};
  seats.forEach(s => { statusMap[s.seat_num] = s.status; });

  const COLORS = {
    selected: "#4caf50",
    available: "#a2d5ab",
    occupied: "#e27c7c",
    blocked: "#cccccc",
    empty: "#ddd",
  };

  const seatButton = (seatNum: number) => {
    const st = statusMap[seatNum] ?? "available";
    const isSelected = selectedSeats.includes(seatNum);
    const isOccupied = st === "occupied";
    const isBlocked = st === "blocked";

    const bg =
      isSelected ? COLORS.selected :
      isOccupied ? COLORS.occupied :
      isBlocked  ? COLORS.blocked  :
      COLORS.available;

    const canClick = interactive && !isOccupied && !isBlocked;

    return (
      <button
        key={seatNum}
        type="button"
        onClick={() => canClick && toggleSeat && toggleSeat(seatNum)}
        style={{
          width: cell.w,
          height: cell.h,
          backgroundColor: bg,
          border: "1px solid #888",
          borderRadius: 6,
          cursor: canClick ? "pointer" : "default",
          opacity: isOccupied ? 0.6 : 1,
          fontSize: 12,
          transition: "transform .06s ease",
        }}
        onMouseDown={(e) => { if (canClick) (e.currentTarget.style.transform = "scale(0.97)"); }}
        onMouseUp={(e) => { (e.currentTarget.style.transform = ""); }}
      >
        {seatNum}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", gap }}>
      {layoutHorizontal.map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap }}>
          {col.map((seatNum, ri) =>
            seatNum === null
              ? <div key={ri} style={{ width: cell.w, height: cell.h }} />
              : seatButton(seatNum)
          )}
        </div>
      ))}
    </div>
  );
}
