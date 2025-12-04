"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import doorIcon from "./icons/door.png";
import driverIcon from "./icons/driver.png";
import seatAvailableIcon from "./icons/seat-avail.svg";
import seatSelectedIcon from "./icons/seat-selected.svg";
import seatTakenIcon from "./icons/seat-taken.png";
import wcIcon from "./icons/wc.png";

export type SeatData = { seat_num: number; status: "available" | "occupied" | "blocked" | string };

type Props = {
  layout: string[];
  seats?: SeatData[];
  selectedSeats?: number[];
  toggleSeat?: (seatNum: number) => void;
  interactive?: boolean;
  seatNumbers?: number[];
};

type ParsedLayout = {
  seatRows: string[];
  wallRows: { pattern: string; between: number }[];
};

type Block = { left: number; top: number; width: number; height: number };

const ICONS = {
  seatAvailable: seatAvailableIcon,
  seatSelected: seatSelectedIcon,
  seatTaken: seatTakenIcon,
  driver: driverIcon,
  door: doorIcon,
  wc: wcIcon,
};

function parseLayout(layout: string[]): ParsedLayout {
  const seatRows: string[] = [];
  const wallRows: { pattern: string; between: number }[] = [];

  let seatRowIndex = 0;
  layout.forEach((rawRow) => {
    const row = rawRow.padEnd(5, "0");
    if (row.includes("-")) {
      wallRows.push({ pattern: row, between: seatRowIndex });
    } else {
      seatRows.push(row);
      seatRowIndex += 1;
    }
  });

  return { seatRows, wallRows };
}

function buildStatusMap(seats?: SeatData[]) {
  return (seats || []).reduce<Map<number, SeatData["status"]>>((map, seat) => {
    map.set(seat.seat_num, seat.status);
    return map;
  }, new Map());
}

export default function BusLayout({
  layout,
  seats = [],
  selectedSeats = [],
  toggleSeat,
  interactive = false,
  seatNumbers,
}: Props) {
  const { seatRows, wallRows } = useMemo(() => parseLayout(layout), [layout]);
  const statusMap = useMemo(() => buildStatusMap(seats), [seats]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [corridorBlocks, setCorridorBlocks] = useState<Block[]>([]);
  const [wallBlocks, setWallBlocks] = useState<Block[]>([]);

  const computeCellRects = useCallback(() => {
    if (!containerRef.current || !gridRef.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    const gridChildren = Array.from(gridRef.current.children) as HTMLDivElement[];
    const numSeatRows = seatRows.length;
    const numCols = 5;

    const cellRects: { left: number; right: number; top: number; bottom: number }[][] = [];
    for (let r = 0; r < numSeatRows; r += 1) {
      cellRects[r] = [];
      for (let c = 0; c < numCols; c += 1) {
        const index = r * numCols + c;
        const cell = gridChildren[index];
        if (!cell) return null;
        const rect = cell.getBoundingClientRect();
        cellRects[r][c] = {
          left: rect.left - containerRect.left,
          right: rect.right - containerRect.left,
          top: rect.top - containerRect.top,
          bottom: rect.bottom - containerRect.top,
        };
      }
    }

    return { cellRects, numSeatRows, numCols };
  }, [seatRows]);

  useEffect(() => {
    const recalc = () => {
      const computed = computeCellRects();
      if (!computed) return;

      const { cellRects, numSeatRows, numCols } = computed;

      const paddingX = 8;
      const paddingY = 4;

      const newCorridors: Block[] = [];

      for (let c = 0; c < numCols; c += 1) {
        let r = 0;
        while (r < numSeatRows) {
          while (r < numSeatRows && seatRows[r][c] !== "0") r += 1;
          if (r >= numSeatRows) break;

          const start = r;
          while (r < numSeatRows && seatRows[r][c] === "0") r += 1;
          const end = r - 1;

          const length = end - start + 1;
          if (length < 2) continue;

          const topRect = cellRects[start][c];
          const bottomRect = cellRects[end][c];

          const left = topRect.left + paddingX;
          const right = topRect.right - paddingX;
          const top = topRect.top + paddingY;
          const bottom = bottomRect.bottom - paddingY;

          newCorridors.push({
            left,
            top,
            width: Math.max(4, right - left),
            height: Math.max(6, bottom - top),
          });
        }
      }

      const newWalls: Block[] = [];

      wallRows.forEach((wall) => {
        const { pattern, between } = wall;
        const rowBelow = between;
        const rowAbove = between - 1;

        if (rowAbove < 0 || rowBelow >= numSeatRows) return;

        const aboveRect = cellRects[rowAbove][0];
        const belowRect = cellRects[rowBelow][0];
        const yTop = aboveRect.bottom;
        const yBottom = belowRect.top;
        const wallY = (yTop + yBottom) / 2;
        const wallHeight = 4;

        let i = 0;
        while (i < numCols) {
          if (pattern[i] === "3") {
            const start = i;
            while (i < numCols && pattern[i] === "3") i += 1;
            const end = i - 1;

            const leftRect = cellRects[rowAbove][start];
            const rightRect = cellRects[rowAbove][end];
            const left = leftRect.left + 4;
            const right = rightRect.right - 4;

            newWalls.push({
              left,
              top: wallY - wallHeight / 2,
              width: right - left,
              height: wallHeight,
            });
          } else {
            i += 1;
          }
        }
      });

      setCorridorBlocks(newCorridors);
      setWallBlocks(newWalls);
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [computeCellRects, seatRows, wallRows]);

  let seatIndex = 0;

  const renderSeat = () => {
    const seatNum = seatNumbers?.[seatIndex] ?? seatIndex + 1;
    seatIndex += 1;

    const status = statusMap.get(seatNum) || "available";
    const isSelected = selectedSeats.includes(seatNum);
    const clickable = interactive && status === "available";

    let iconSrc = ICONS.seatAvailable;
    if (status === "occupied" || status === "blocked") {
      iconSrc = ICONS.seatTaken;
    }
    if (isSelected) {
      iconSrc = ICONS.seatSelected;
    }

    const seatClass = [
      "seat-wrapper",
      isSelected ? "selected" : "",
      status !== "available" ? "seat-disabled" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        type="button"
        className={seatClass}
        onClick={() => clickable && toggleSeat?.(seatNum)}
        aria-pressed={isSelected}
        aria-label={`Место ${seatNum}`}
        disabled={!clickable}
      >
        <Image className="seat-icon" src={iconSrc} alt="Место" width={40} height={40} draggable={false} />
        <span className="seat-number">{seatNum}</span>
      </button>
    );
  };

  const renderIconCell = (type: "driver" | "door" | "wc") => {
    const src = type === "driver" ? ICONS.driver : type === "door" ? ICONS.door : ICONS.wc;
    const alt = type === "driver" ? "Водитель" : type === "door" ? "Вход" : "WC";
    return (
      <div className="icon-cell">
        <Image className="icon-cell-img" src={src} alt={alt} width={24} height={24} draggable={false} />
      </div>
    );
  };

  return (
    <div className="bus-container" ref={containerRef}>
      <div className="corridors-layer">
        {corridorBlocks.map((b, idx) => (
          <div
            key={`corridor-${idx}`}
            className="corridor-block"
            style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
          />
        ))}
      </div>

      <div className="seat-grid" ref={gridRef}>
        {seatRows.map((row, rowIndex) =>
          row.split("").map((cell, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            if (cell === "1") {
              return (
                <div className="cell" key={key}>
                  {renderSeat()}
                </div>
              );
            }
            if (cell === "2") {
              return (
                <div className="cell" key={key}>
                  {renderIconCell("driver")}
                </div>
              );
            }
            if (cell === "4") {
              return (
                <div className="cell" key={key}>
                  {renderIconCell("door")}
                </div>
              );
            }
            if (cell === "5") {
              return (
                <div className="cell" key={key}>
                  {renderIconCell("wc")}
                </div>
              );
            }
            return <div className="cell cell-empty" key={key} />;
          })
        )}
      </div>

      <div className="walls-layer">
        {wallBlocks.map((b, idx) => (
          <div
            key={`wall-${idx}`}
            className="wall-horizontal"
            style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
          />
        ))}
      </div>

      <style jsx>{`
        * { box-sizing: border-box; }

        .bus-container {
          position: relative;
          background: #f7f8fd;
          border-radius: 14px;
          padding: 6px 6px;
          box-shadow: 0 2px 6px rgba(15, 35, 75, 0.08);
        }

        .corridors-layer,
        .walls-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .corridors-layer { z-index: 0; }
        .seat-grid       { position: relative; z-index: 1; }
        .walls-layer     { z-index: 2; }

        .seat-grid {
          display: grid;
          grid-template-columns: 40px 40px 30px 40px 40px;
          grid-auto-rows: 40px;
          column-gap: 2px;
          row-gap: 1px;
        }

        .cell {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .seat-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
          cursor: pointer;
          transition: transform 0.1s ease, filter 0.1s ease;
          border: none;
          padding: 0;
          background: transparent;
        }

        .seat-icon {
          width: 100%;
          height: 100%;
          display: block;
          pointer-events: none;
          position: relative;
          z-index: 1;
        }

        .seat-number {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          text-shadow: 0 1px 2px rgba(255,255,255,.7), 0 0 1px rgba(255,255,255,.85);
          pointer-events: none;
          z-index: 2;
        }

        .seat-wrapper:hover {
          transform: translateY(-1px);
          filter: drop-shadow(0 0 3px rgba(148, 163, 184, 0.9));
        }

        .seat-wrapper.selected::after {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 10px;
          box-shadow: 0 0 0 2px #34d399, 0 0 8px rgba(52,211,153,0.7);
        }

        .seat-disabled {
          cursor: not-allowed;
          opacity: 0.65;
          filter: grayscale(0.2);
        }

        .icon-cell {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px dashed #d1d5db;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .icon-cell-img {
          max-width: 24px;
          max-height: 24px;
          display: block;
          pointer-events: none;
        }

        .corridor-block {
          position: absolute;
          border-radius: 999px;
          background: linear-gradient(180deg, #e5e7eb, #d1d5db);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.9), 0 1px 2px rgba(148,163,184,0.6);
        }

        .wall-horizontal {
          position: absolute;
          border-radius: 999px;
          background: linear-gradient(90deg, #cbd5f5, #93c5fd);
          box-shadow: 0 1px 2px rgba(148,163,184,0.7);
        }

        .wall-horizontal::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.3));
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
