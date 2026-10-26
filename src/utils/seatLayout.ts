// Тот же тип, что CellCode в BusLayout; без импорта, чтобы утилита собиралась в тестах без JSX.
type CellCode = number | "d" | "0" | "t" | "e" | "w" | "-";

// Раскладка — 5 колонок: [0,1] слева, [2] проход, [3,4] справа.
const NUM_COLS = 5;

const seatRowsOf = (layout: CellCode[]): CellCode[][] => {
  const rows: CellCode[][] = [];
  for (let i = 0; i < layout.length; i += NUM_COLS) {
    rows.push(layout.slice(i, i + NUM_COLS));
  }
  return rows;
};

export type SeatSide = "window" | "aisle";

/** У окна (крайние колонки) или у прохода. */
export const seatSides = (layout: CellCode[]): Map<number, SeatSide> => {
  const sides = new Map<number, SeatSide>();
  seatRowsOf(layout).forEach((row) => {
    row.forEach((cell, col) => {
      if (typeof cell !== "number") return;
      sides.set(cell, col === 0 || col === NUM_COLS - 1 ? "window" : "aisle");
    });
  });
  return sides;
};

/**
 * Подбор свободных мест рядом — на одной стороне прохода (15 и 16, а не 14 и 15).
 * Сначала целые пары спереди назад, остаток — первые свободные места по порядку.
 */
export const pickAdjacentSeats = (
  layout: CellCode[],
  available: Set<number>,
  count: number,
): number[] => {
  if (count <= 0) return [];
  const rows = seatRowsOf(layout);
  const picked: number[] = [];

  if (count >= 2) {
    for (const row of rows) {
      for (const [a, b] of [
        [row[0], row[1]],
        [row[3], row[4]],
      ]) {
        if (picked.length + 2 > count) break;
        if (typeof a === "number" && typeof b === "number" && available.has(a) && available.has(b)) {
          picked.push(a, b);
        }
      }
      if (picked.length + 2 > count) break;
    }
  }

  for (const row of rows) {
    for (const cell of row) {
      if (picked.length >= count) break;
      if (typeof cell === "number" && available.has(cell) && !picked.includes(cell)) {
        picked.push(cell);
      }
    }
  }

  return picked.length === count ? picked : [];
};
