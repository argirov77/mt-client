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

const NUM_COLS = 5;
const CORRIDOR_PADDING_X = 12;
const CORRIDOR_PADDING_Y = 3;
const WALL_HEIGHT = 4;

type ParsedLayout = {
  seatRows: CellCode[][];
  wallRows: { pattern: CellCode[]; between: number }[];
};

type Rect = { left: number; right: number; top: number; bottom: number };
type Block = { left: number; top: number; width: number; height: number };

/* --- helpers --- */

function parseLayout(flat: CellCode[]): ParsedLayout {
  const seatRows: CellCode[][] = [];
  const wallRows: { pattern: CellCode[]; between: number }[] = [];

  const numRows = Math.ceil(flat.length / NUM_COLS);
  for (let r = 0; r < numRows; r += 1) {
    const row = flat.slice(r * NUM_COLS, (r + 1) * NUM_COLS);
    seatRows.push(row);
    if (row.some((c) => c === "w")) {
      wallRows.push({ pattern: row, between: r });
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

function measureCellRects(
  container: HTMLDivElement,
  grid: HTMLDivElement,
  numSeatRows: number
): Rect[][] | null {
  const containerRect = container.getBoundingClientRect();
  const gridChildren = Array.from(grid.children) as HTMLDivElement[];
  const expectedCells = numSeatRows * NUM_COLS;

  if (gridChildren.length < expectedCells) return null;

  const cellRects: Rect[][] = [];

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

  return cellRects;
}

function buildCorridors(seatRows: CellCode[][], cellRects: Rect[][]): Block[] {
  const numSeatRows = seatRows.length;
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

      const left = topRect.left + CORRIDOR_PADDING_X;
      const right = topRect.right - CORRIDOR_PADDING_X;
      const top = topRect.top + CORRIDOR_PADDING_Y;
      const bottom = bottomRect.bottom - CORRIDOR_PADDING_Y;

      newCorridors.push({
        left,
        top,
        width: Math.max(8, right - left),
        height: Math.max(12, bottom - top),
      });
    }
  }

  return newCorridors;
}

function buildWalls(wallRows: ParsedLayout["wallRows"], cellRects: Rect[][]): Block[] {
  const numSeatRows = cellRects.length;
  const newWalls: Block[] = [];

  wallRows.forEach((wall) => {
    const { pattern, between } = wall;
    const rowAbove = between - 1;
    const rowBelow = between + 1;

    if (rowAbove < 0 || rowBelow >= numSeatRows) return;

    const aboveRect = cellRects[rowAbove][0];
    const belowRect = cellRects[rowBelow][0];

    const yTop = aboveRect.bottom;
    const yBottom = belowRect.top;
    const gap = yBottom - yTop;
    if (gap <= 0) return;

    const wallTop = yTop + (gap - WALL_HEIGHT) / 2;

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
          height: WALL_HEIGHT,
        });
      } else {
        i += 1;
      }
    }
  });

  return newWalls;
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

  const recalcLayout = useCallback(() => {
    if (!containerRef.current || !gridRef.current) return;

    const cellRects = measureCellRects(
      containerRef.current,
      gridRef.current,
      seatRows.length
    );

    if (!cellRects) return;

    const newCorridors = buildCorridors(seatRows, cellRects);
    const newWalls = buildWalls(wallRows, cellRects);

    setCorridorBlocks(newCorridors);
    setWallBlocks(newWalls);
  }, [seatRows, wallRows]);

  useEffect(() => {
    recalcLayout();
    window.addEventListener("resize", recalcLayout);
    return () => window.removeEventListener("resize", recalcLayout);
  }, [recalcLayout]);

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

  /* === ИКОНКИ driver / door / wc — тоже SVG, но меньше === */

  const renderIconCell = (type: "driver" | "door" | "wc") => {
    return (
      <div className="bus-icon-cell">
        {type === "driver" && (
          <svg
            className="bus-icon-svg"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="#111827" />
            <circle cx="12" cy="12" r="7" fill="#F9FAFB" />
            <path
              d="M12 6.5a1 1 0 0 1 1 1v1.2l2.3 1.1a1 1 0 0 1 .5 1.3l-.4.9a1 1 0 0 1-1.3.5l-1.8-.8h-1.6l-1.8.8a1 1 0 0 1-1.3-.5l-.4-.9a1 1 0 0 1 .5-1.3L11 8.7V7.5a1 1 0 0 1 1-1Z"
              fill="#111827"
            />
          </svg>
        )}

        {type === "door" && (
          <svg
            className="bus-icon-svg"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="4"
              y="4"
              width="12"
              height="16"
              rx="2"
              fill="#ffffff"
              stroke="#111827"
              strokeWidth="1.5"
            />
            <circle cx="13" cy="12" r="1" fill="#111827" />
            <path
              d="M15 12h4m0 0-1.6-2.2M19 12l-1.6 2.2"
              stroke="#111827"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {type === "wc" && (
          <svg
            className="bus-icon-svg"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="2" y="3" width="20" height="18" rx="3" fill="#1D4ED8" />
            <rect
              x="3.5"
              y="4.5"
              width="17"
              height="15"
              rx="2"
              fill="#2563EB"
            />
            {/* woman */}
            <circle cx="9" cy="9" r="1.6" fill="#ffffff" />
            <path
              d="M7.3 16.5 8 11.5h2l.7 5"
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path d="M8 11.5h2l-.7-2.5h-1L8 11.5Z" fill="#ffffff" />
            {/* man */}
            <circle cx="15" cy="9" r="1.6" fill="#ffffff" />
            <path
              d="M13.4 16.5 14 11.5h2l.6 5"
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <rect
              x="14"
              y="9.2"
              width="2"
              height="2.8"
              rx="0.6"
              fill="#ffffff"
            />
          </svg>
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
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px dashed #d1d5db;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
        }

        .bus-icon-svg {
          width: 16px;
          height: 16px;
          display: block;
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
