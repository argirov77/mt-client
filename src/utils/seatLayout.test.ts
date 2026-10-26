import { test } from "node:test";
import * as assert from "node:assert/strict";

import { pickAdjacentSeats, seatSides } from "./seatLayout";

const LAYOUT = [
  "d", "0", "0", "0", "e",
  1, 2, "0", 3, 4,
  5, 6, "0", 7, 8,
  13, 14, "0", 15, 16,
] as const;

test("pickAdjacentSeats picks a pair on one side of the aisle", () => {
  // 14 и 15 свободны, но через проход; 15 и 16 — пара
  assert.deepEqual(pickAdjacentSeats([...LAYOUT], new Set([14, 15, 16]), 2), [15, 16]);
});

test("pickAdjacentSeats falls back to single seats and returns [] when not enough", () => {
  assert.deepEqual(pickAdjacentSeats([...LAYOUT], new Set([2, 7]), 2), [2, 7]);
  assert.deepEqual(pickAdjacentSeats([...LAYOUT], new Set([2]), 2), []);
  assert.deepEqual(pickAdjacentSeats([...LAYOUT], new Set([3, 4, 5, 6, 8]), 3), [3, 4, 5]);
});

test("seatSides marks outer columns as window", () => {
  const sides = seatSides([...LAYOUT]);
  assert.equal(sides.get(1), "window");
  assert.equal(sides.get(2), "aisle");
  assert.equal(sides.get(15), "aisle");
  assert.equal(sides.get(16), "window");
});
