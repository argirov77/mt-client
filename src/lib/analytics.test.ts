import { test, beforeEach } from "node:test";
import * as assert from "node:assert/strict";

import {
  toFiniteNumber,
  trackPurchase,
  FALLBACK_CURRENCY,
} from "./analytics";

type GtagCall = { event: string; params: Record<string, unknown> };

type MutableStorage = {
  store: Map<string, string>;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
};

const createStorage = (): MutableStorage => {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
};

const installWindow = (): { calls: GtagCall[]; reset: () => void } => {
  const calls: GtagCall[] = [];
  const sessionStorage = createStorage();
  const localStorage = createStorage();
  const gtag = (..._args: unknown[]) => {
    const [type, event, params] = _args as [
      string,
      string,
      Record<string, unknown> | undefined,
    ];
    if (type === "event") {
      calls.push({ event, params: params ?? {} });
    }
  };
  const g = globalThis as Record<string, unknown>;
  g.window = {
    gtag,
    sessionStorage,
    localStorage,
    location: { search: "" },
    navigator: { userAgent: "node-test" },
  };
  g.sessionStorage = sessionStorage;
  g.localStorage = localStorage;
  return {
    calls,
    reset: () => {
      calls.length = 0;
      sessionStorage.clear();
      localStorage.clear();
    },
  };
};

const ctx = installWindow();

beforeEach(() => {
  ctx.reset();
});

test("toFiniteNumber accepts plain numbers", () => {
  assert.equal(toFiniteNumber(0), 0);
  assert.equal(toFiniteNumber(2600), 2600);
  assert.equal(toFiniteNumber(-15.5), -15.5);
});

test("toFiniteNumber rejects NaN and Infinity", () => {
  assert.equal(toFiniteNumber(NaN), null);
  assert.equal(toFiniteNumber(Infinity), null);
  assert.equal(toFiniteNumber(-Infinity), null);
});

test("toFiniteNumber parses common string formats", () => {
  assert.equal(toFiniteNumber("2600"), 2600);
  assert.equal(toFiniteNumber("2600.50"), 2600.5);
  assert.equal(toFiniteNumber("2,600.00"), 2600);
  assert.equal(toFiniteNumber("2.600,00"), 2600);
  assert.equal(toFiniteNumber("2 600,00"), 2600);
  assert.equal(toFiniteNumber("2 600"), 2600);
  assert.equal(toFiniteNumber("  72373  "), 72373);
});

test("toFiniteNumber rejects unparseable values", () => {
  assert.equal(toFiniteNumber(""), null);
  assert.equal(toFiniteNumber("abc"), null);
  assert.equal(toFiniteNumber(null), null);
  assert.equal(toFiniteNumber(undefined), null);
  assert.equal(toFiniteNumber({}), null);
});

test("trackPurchase uses sum of item prices as canonical value", () => {
  const fired = trackPurchase({
    transactionId: "tx-1",
    items: [
      { item_id: "t1", item_name: "Trip A", price: 2600, quantity: 1 },
    ],
    currency: "UAH",
  });

  assert.equal(fired, true);
  assert.equal(ctx.calls.length, 1);
  const call = ctx.calls[0];
  assert.equal(call.event, "purchase");
  assert.equal(call.params.value, 2600);
  assert.equal(call.params.transaction_id, "tx-1");
  assert.equal(call.params.currency, "UAH");
});

test("trackPurchase sums multiple items correctly", () => {
  trackPurchase({
    transactionId: "tx-2",
    items: [
      { item_id: "a", price: 2600, quantity: 1 },
      { item_id: "b", price: 2600, quantity: 1 },
    ],
  });

  assert.equal(ctx.calls[0]?.params.value, 5200);
});

test("trackPurchase coerces string prices to numbers", () => {
  trackPurchase({
    transactionId: "tx-3",
    items: [{ item_id: "a", price: "2 600,00" as unknown as number }],
  });

  assert.equal(ctx.calls[0]?.params.value, 2600);
});

test("trackPurchase prefers items value over valueOverride", () => {
  trackPurchase({
    transactionId: "tx-4",
    items: [{ item_id: "a", price: 2600, quantity: 1 }],
    valueOverride: 72373,
  });

  assert.equal(ctx.calls[0]?.params.value, 2600);
});

test("trackPurchase falls back to valueOverride when items have no price", () => {
  trackPurchase({
    transactionId: "tx-5",
    items: [{ item_id: "a", price: null, quantity: 1 }],
    valueOverride: 1500,
  });

  assert.equal(ctx.calls[0]?.params.value, 1500);
});

test("trackPurchase skips event when value is invalid", () => {
  const fired = trackPurchase({
    transactionId: "tx-6",
    items: [{ item_id: "a", price: null }],
  });

  assert.equal(fired, false);
  assert.equal(ctx.calls.length, 0);
});

test("trackPurchase skips event when transactionId is missing", () => {
  const fired = trackPurchase({
    transactionId: "",
    items: [{ item_id: "a", price: 2600 }],
  });

  assert.equal(fired, false);
  assert.equal(ctx.calls.length, 0);
});

test("trackPurchase prevents duplicate events with same transactionId", () => {
  const first = trackPurchase({
    transactionId: "tx-dup",
    items: [{ item_id: "a", price: 2600 }],
  });
  const second = trackPurchase({
    transactionId: "tx-dup",
    items: [{ item_id: "a", price: 2600 }],
  });

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(ctx.calls.length, 1);
});

test("trackPurchase applies fallback currency when not provided", () => {
  trackPurchase({
    transactionId: "tx-cur",
    items: [{ item_id: "a", price: 2600 }],
  });

  assert.equal(ctx.calls[0]?.params.currency, FALLBACK_CURRENCY);
});

test("trackPurchase normalizes invalid quantity to 1", () => {
  trackPurchase({
    transactionId: "tx-qty",
    items: [{ item_id: "a", price: 2600, quantity: 0 }],
  });

  const items = ctx.calls[0]?.params.items as Array<{ quantity: number }>;
  assert.equal(items[0].quantity, 1);
  assert.equal(ctx.calls[0]?.params.value, 2600);
});

test("trackPurchase preserves extra event params", () => {
  trackPurchase({
    transactionId: "tx-extra",
    items: [{ item_id: "a", price: 2600 }],
    extra: { passenger_count: 2, trip_type: "roundtrip" },
  });

  assert.equal(ctx.calls[0]?.params.passenger_count, 2);
  assert.equal(ctx.calls[0]?.params.trip_type, "roundtrip");
});

test("trackPurchase rounds value to 2 decimals", () => {
  trackPurchase({
    transactionId: "tx-round",
    items: [{ item_id: "a", price: 100.567, quantity: 3 }],
  });

  const value = ctx.calls[0]?.params.value as number;
  assert.equal(value, 301.71);
});
