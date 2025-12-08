"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SeatData = {
  seat_num: number;
  status: "available" | "occupied" | "blocked" | string;
};

export type CellCode = number | "d" | "0" | "t" | "e" | "w" | "-";

type Props = {
  layout: CellCode[];
  seats?: SeatData[];
  selectedSeats?: number[];
  toggleSeat?: (seatNum: number) => void;
  interactive?: boolean;
};

type ParsedLayout = {
  seatRows: CellCode[][];
  wallRows: { pattern: CellCode[]; between: number }[];
};

type Block = { left: number; top: number; width: number; height: number };

const NUM_COLS = 5;

/* --- helpers --- */

function parseLayout(flat: CellCode[]): ParsedLayout {
  const seatRows: CellCode[][] = [];
  const wallRows: { pattern: CellCode[]; between: number }[] = [];

  const numRows = Math.ceil(flat.length / NUM_COLS);
  let seatRowIndex = 0;

  for (let r = 0; r < numRows; r += 1) {
    const row = flat.slice(r * NUM_COLS, (r + 1) * NUM_COLS);
    if (row.some((c) => c === "w")) {
      wallRows.push({ pattern: row, between: seatRowIndex });
    } else {
      seatRows.push(row);
      seatRowIndex += 1;
    }
  }

  return { seatRows, wallRows };
}

function buildStatusMap(seats?: SeatData[]) {
  return (seats || []).reduce<Map<number, SeatData["status"]>>((map, seat) => {
    map.set(seat.seat_num, seat.status);
    return map;
  }, new Map());
}

/* --- component --- */

export default function BusLayout({
  layout,
  seats = [],
  selectedSeats = [],
  toggleSeat,
  interactive = false,
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
    const gridChildren = Array.from(
      gridRef.current.children
    ) as HTMLDivElement[];
    const numSeatRows = seatRows.length;

    const cellRects: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    }[][] = [];

    for (let r = 0; r < numSeatRows; r += 1) {
      cellRects[r] = [];
      for (let c = 0; c < NUM_COLS; c += 1) {
        const index = r * NUM_COLS + c;
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

    return { cellRects, numSeatRows };
  }, [seatRows]);

  useEffect(() => {
    const recalc = () => {
      const computed = computeCellRects();
      if (!computed) return;

      const { cellRects, numSeatRows } = computed;

      /* === ПРОХОД ("0") === */
      const paddingX = 12;
      const paddingY = 3;
      const newCorridors: Block[] = [];

      for (let c = 0; c < NUM_COLS; c += 1) {
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
            width: Math.max(8, right - left),
            height: Math.max(12, bottom - top),
          });
        }
      }

      /* === СТЕНЫ ("w") === */
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
        const gap = yBottom - yTop;
        if (gap <= 0) return;

        const wallHeight = 4;
        const wallTop = yTop + (gap - wallHeight) / 2;

        let i = 0;
        while (i < NUM_COLS) {
          if (pattern[i] === "w") {
            const start = i;
            while (i < NUM_COLS && pattern[i] === "w") i += 1;
            const end = i - 1;

            const leftRect = cellRects[rowAbove][start];
            const rightRect = cellRects[rowAbove][end];

            const left = leftRect.left + 4;
            const right = rightRect.right - 4;

            newWalls.push({
              left,
              top: wallTop,
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

  /* === СИДЕНЬЕ: 3 состояния (available / selected / taken) === */

  const renderSeat = (seatNum: number) => {
    const status = statusMap.get(seatNum) || "available";
    const isSelected = selectedSeats.includes(seatNum);
    const isTaken = status === "occupied" || status === "blocked";
    const clickable = interactive && !isTaken;

    const topGradientId = isTaken
      ? "topGradientTaken"
      : isSelected
      ? "topGradientSel"
      : "topGradientAvail";

    const bottomGradientId = isTaken
      ? "bottomGradientTaken"
      : isSelected
      ? "bottomGradientSel"
      : "bottomGradientAvail";

    const shadowFill = isTaken
      ? "#A5AABB"
      : isSelected
      ? "#1D4ED8"
      : "#5FA514"; // мягкий зелёный

    const bodyFill = isTaken
      ? "#C8CCD8"
      : isSelected
      ? "#2563EB"
      : "#7AC700"; // зелёный спокойнее, чем #8EE000

    const textFill = isTaken ? "#4B5563" : "#FFFFFF";

    const seatClass = [
      "bus-seat-wrapper",
      isSelected ? "bus-seat-selected" : "",
      isTaken ? "bus-seat-disabled" : "",
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
        <svg
          className="bus-seat-svg"
          width="45"
          height="45"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* тень */}
          <ellipse
            cx="16"
            cy="25"
            rx="10"
            ry="4"
            fill={shadowFill}
            opacity={isTaken ? 0.35 : 0.45}
          />

          {/* корпус */}
          <rect x="5" y="4" width="22" height="22" rx="6" fill={bodyFill} />

          {/* верхний блик */}
          <rect
            x="5"
            y="4"
            width="22"
            height="10"
            rx="6"
            fill={`url(#${topGradientId})`}
          />

          {/* нижняя подушка */}
          <rect
            x="6"
            y="17"
            width="20"
            height="7"
            rx="4"
            fill={`url(#${bottomGradientId})`}
          />

          {/* номер */}
          <text
            x="16"
            y="19"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="700"
            fill={textFill}
          >
            {seatNum}
          </text>

          <defs>
            {/* ЗАНЯТО (серый SVG) */}
            <linearGradient
              id="topGradientTaken"
              x1="16"
              y1="4"
              x2="16"
              y2="14"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#F4F5F9" />
              <stop offset="1" stopColor="#C8CCD8" stopOpacity="0" />
            </linearGradient>

            <linearGradient
              id="bottomGradientTaken"
              x1="16"
              y1="17"
              x2="16"
              y2="24"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#ECEEF4" />
              <stop offset="1" stopColor="#B2B7C7" />
            </linearGradient>

            {/* ВЫБРАНО (синий SVG) */}
            <linearGradient
              id="topGradientSel"
              x1="16"
              y1="4"
              x2="16"
              y2="14"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#60A5FA" />
              <stop offset="1" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>

            <linearGradient
              id="bottomGradientSel"
              x1="16"
              y1="17"
              x2="16"
              y2="24"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#BFDBFE" />
              <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>

            {/* ДОСТУПНО (мягкий зелёный) */}
            <linearGradient
              id="topGradientAvail"
              x1="16"
              y1="4"
              x2="16"
              y2="14"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#E6FFC4" />
              <stop offset="1" stopColor="#7AC700" stopOpacity="0" />
            </linearGradient>

            <linearGradient
              id="bottomGradientAvail"
              x1="16"
              y1="17"
              x2="16"
              y2="24"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#D3F7A2" />
              <stop offset="1" stopColor="#6CB800" />
            </linearGradient>
          </defs>
        </svg>
      </button>
    );
  };

  /* === ИКОНКИ driver / door / wc — IMG c door2/driver2/wc2 === */

  const renderIconCell = (type: "driver" | "door" | "wc") => {
    let src = "";
    let alt = "";

    if (type === "driver") {
      src = "/icons/driver2.svg";
      alt = "Driver";
    } else if (type === "door") {
      src = "/icons/door2.svg";
      alt = "Door";
    } else if (type === "wc") {
      src = "/icons/wc2.svg";
      alt = "WC";
    }

    return (
      <div className="bus-icon-cell">
        {src && (
          <img
            src={src}
            alt={alt}
            className="bus-icon-svg"
            draggable={false}
          />
        )}
      </div>
    );
  };

  return (
    <div className="bus-container" ref={containerRef}>
      <div className="bus-corridors-layer">
        {corridorBlocks.map((b, idx) => (
          <div
            key={`corridor-${idx}`}
            className="bus-corridor-block"
            style={{
              left: b.left,
              top: b.top,
              width: b.width,
              height: b.height,
            }}
          />
        ))}
      </div>

      <div className="bus-seat-grid" ref={gridRef}>
        {seatRows.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;

            if (typeof cell === "number") {
              return (
                <div className="bus-cell" key={key}>
                  {renderSeat(cell)}
                </div>
              );
            }

            if (cell === "d") {
              return (
                <div className="bus-cell" key={key}>
                  {renderIconCell("driver")}
                </div>
              );
            }
            if (cell === "e") {
              return (
                <div className="bus-cell" key={key}>
                  {renderIconCell("door")}
                </div>
              );
            }
            if (cell === "t") {
              return (
                <div className="bus-cell" key={key}>
                  {renderIconCell("wc")}
                </div>
              );
            }

            return <div className="bus-cell bus-cell-empty" key={key} />;
          })
        )}
      </div>

      <div className="bus-walls-layer">
        {wallBlocks.map((b, idx) => (
          <div
            key={`wall-${idx}`}
            className="bus-wall-horizontal"
            style={{
              left: b.left,
              top: b.top,
              width: b.width,
              height: b.height,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        .bus-container {
          position: relative;
          background: #f7f8fd;
          border-radius: 14px;
          padding: 4px;
          border: 1px solid #dde3f3;
          box-shadow: 0 2px 6px rgba(15, 35, 75, 0.08);
        }

        .bus-corridors-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .bus-seat-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 45px 45px 35px 45px 45px;
          grid-auto-rows: 45px;
          column-gap: 2px;
          row-gap: 1px;
        }

        .bus-walls-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .bus-cell {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .bus-seat-wrapper {
          position: relative;
          width: 45px;
          height: 45px;
          cursor: pointer;
          padding: 0;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease, filter 0.1s ease;
        }

        .bus-seat-svg {
          width: 45px;
          height: 45px;
        }

        .bus-seat-wrapper:hover {
          transform: translateY(-1px);
          filter: drop-shadow(0 0 3px rgba(148, 163, 184, 0.9));
        }

        .bus-seat-wrapper.bus-seat-selected::after {
          content: "";
          position: absolute;
          inset: 4px;
          border-radius: 10px;
          box-shadow: 0 0 0 2px #2563eb,
            0 0 8px rgba(37, 99, 235, 0.7);
        }

        .bus-seat-disabled {
          cursor: not-allowed;
          opacity: 0.85;
        }

        .bus-icon-cell {
          width: 45px;
          height: 45px;
          border-radius: 10px;
          border: none;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.7),
            0 1px 2px rgba(148, 163, 184, 0.8);
        }

        .bus-icon-svg {
          width: 28px;
          height: 28px;
          display: block;
          object-fit: contain;
        }

        .bus-corridor-block {
          position: absolute;
          border-radius: 999px;
          background: linear-gradient(180deg, #e5e7eb, #d1d5db);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.9),
            0 1px 2px rgba(148, 163, 184, 0.6);
        }

        .bus-wall-horizontal {
          position: absolute;
          border-radius: 999px;
          background: linear-gradient(90deg, #cbd5f5, #93c5fd);
          box-shadow: 0 1px 2px rgba(148, 163, 184, 0.7);
        }

        .bus-wall-horizontal::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.8),
            rgba(255, 255, 255, 0.3)
          );
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
