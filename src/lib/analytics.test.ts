import { test, beforeEach } from "node:test";
import * as assert from "node:assert/strict";

import {
  toFiniteNumber,
  trackPurchase,
  trackReservation,
  trackAddToCart,
  trackBeginCheckout,
  trackAddPaymentInfo,
  getCurrencyForLocale,
  BOOKING_CURRENCY,
  trackContact,
  trackViewSection,
  trackSearchIntent,
  syncGa4DebugModeFromUrl,
  isGa4DebugMode,
  RESERVATION_WEIGHT,
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

test("trackPurchase defaults currency to BOOKING_CURRENCY when none provided", () => {
  trackPurchase({
    transactionId: "tx-cur",
    items: [{ item_id: "a", price: 2600 }],
  });

  assert.equal(ctx.calls[0]?.params.currency, BOOKING_CURRENCY);
});

test("trackPurchase uses the transaction currency, NOT the locale", () => {
  // Регрессия: раньше currency выводилась из локали (en/bg → EUR), из-за чего
  // цена в UAH метилась чужой валютой. Теперь локаль не влияет на валюту, а
  // фактическая валюта транзакции (ticket.pricing.currency) передаётся явно.
  trackPurchase({
    transactionId: "tx-cur-en",
    items: [{ item_id: "a", price: 2600 }],
    locale: "en",
    currency: "UAH",
  });

  assert.equal(ctx.calls[0]?.params.currency, "UAH");
});

test("trackPurchase honors an explicit non-UAH transaction currency", () => {
  trackPurchase({
    transactionId: "tx-cur-eur",
    items: [{ item_id: "a", price: 40 }],
    locale: "ru",
    currency: "EUR",
  });

  assert.equal(ctx.calls[0]?.params.currency, "EUR");
});

test("trackPurchase ignores locale entirely for currency (bg stays UAH by default)", () => {
  trackPurchase({
    transactionId: "tx-cur-bg",
    items: [{ item_id: "a", price: 2600 }],
    locale: "bg",
  });

  assert.equal(ctx.calls[0]?.params.currency, BOOKING_CURRENCY);
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

// ─────────────────────── getCurrencyForLocale ───────────────────────────

test("getCurrencyForLocale maps ru/ua to UAH and en/bg to EUR", () => {
  assert.equal(getCurrencyForLocale("ru"), "UAH");
  assert.equal(getCurrencyForLocale("ua"), "UAH");
  assert.equal(getCurrencyForLocale("en"), "EUR");
  assert.equal(getCurrencyForLocale("bg"), "EUR");
});

test("getCurrencyForLocale accepts Intl locale strings", () => {
  assert.equal(getCurrencyForLocale("ru-RU"), "UAH");
  assert.equal(getCurrencyForLocale("uk-UA"), "UAH");
  assert.equal(getCurrencyForLocale("en-US"), "EUR");
  assert.equal(getCurrencyForLocale("bg-BG"), "EUR");
});

test("getCurrencyForLocale defaults to UAH for unknown/empty locale", () => {
  assert.equal(getCurrencyForLocale(undefined), "UAH");
  assert.equal(getCurrencyForLocale(null), "UAH");
  assert.equal(getCurrencyForLocale(""), "UAH");
  assert.equal(getCurrencyForLocale("zz"), "UAH");
});

// ───────────────────────── trackReservation ─────────────────────────────

test("trackReservation applies RESERVATION_WEIGHT to value", () => {
  const fired = trackReservation({
    purchaseId: "res-1",
    items: [{ item_id: "a", price: 2600, quantity: 1 }],
  });

  assert.equal(fired, true);
  assert.equal(ctx.calls.length, 1);
  const call = ctx.calls[0];
  assert.equal(call.event, "reservation");
  assert.equal(call.params.value, 2600 * RESERVATION_WEIGHT);
  assert.equal(call.params.reservation_value_full, 2600);
  assert.equal(call.params.reservation_weight, RESERVATION_WEIGHT);
  assert.equal(call.params.transaction_id, "res-1");
});

test("trackReservation uses explicit value over items when provided", () => {
  trackReservation({
    purchaseId: "res-2",
    value: 5000,
    items: [{ item_id: "a", price: 2600, quantity: 1 }],
    currency: "UAH",
  });

  assert.equal(ctx.calls[0]?.params.value, 5000 * RESERVATION_WEIGHT);
});

test("trackReservation defaults currency to BOOKING_CURRENCY, not locale", () => {
  trackReservation({
    purchaseId: "res-cur",
    value: 1000,
    locale: "bg",
  });

  assert.equal(ctx.calls[0]?.params.currency, BOOKING_CURRENCY);
});

test("trackReservation honors an explicit transaction currency", () => {
  trackReservation({
    purchaseId: "res-cur-eur",
    value: 1000,
    locale: "ru",
    currency: "EUR",
  });

  assert.equal(ctx.calls[0]?.params.currency, "EUR");
});

test("trackReservation prevents duplicate events with same purchaseId", () => {
  const first = trackReservation({ purchaseId: "res-dup", value: 1000 });
  const second = trackReservation({ purchaseId: "res-dup", value: 1000 });

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(ctx.calls.length, 1);
});

test("trackReservation skips when purchaseId is missing", () => {
  const fired = trackReservation({ purchaseId: "", value: 1000 });
  assert.equal(fired, false);
  assert.equal(ctx.calls.length, 0);
});

// ─────────────────── funnel currency (no locale mapping) ────────────────

test("funnel events default to BOOKING_CURRENCY regardless of locale", () => {
  // Регрессия: en/bg локали давали EUR, хотя booking-flow считается в UAH (₴).
  trackAddToCart({ locale: "en", items: [{ item_id: "a", price: 2600 }] });
  trackBeginCheckout({ locale: "bg", items: [{ item_id: "a", price: 2600 }] });
  trackAddPaymentInfo({
    locale: "en",
    transactionId: "tx",
    items: [{ item_id: "a", price: 2600 }],
  });

  assert.equal(ctx.calls.length, 3);
  for (const call of ctx.calls) {
    assert.equal(call.params.currency, BOOKING_CURRENCY);
  }
});

test("funnel events honor an explicit currency override", () => {
  trackAddToCart({
    locale: "ru",
    items: [{ item_id: "a", price: 40 }],
    currency: "EUR",
  });

  assert.equal(ctx.calls[0]?.params.currency, "EUR");
});

// ─────────────────────────── trackContact ───────────────────────────────

test("trackContact emits a single parameterized contact event", () => {
  trackContact({ method: "phone", source: "footer", label: "+380930004636" });

  assert.equal(ctx.calls.length, 1);
  const call = ctx.calls[0];
  assert.equal(call.event, "contact");
  assert.equal(call.params.method, "phone");
  assert.equal(call.params.source, "footer");
  assert.equal(call.params.event_label, "+380930004636");
});

// ────────────────── trackViewSection / trackSearchIntent ─────────────────

test("trackViewSection fires once per section per session", () => {
  const first = trackViewSection("parcel");
  const second = trackViewSection("parcel");
  const other = trackViewSection("prices");

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(other, true);
  assert.equal(ctx.calls.length, 2);
  assert.equal(ctx.calls[0]?.event, "view_section");
  assert.equal(ctx.calls[0]?.params.section, "parcel");
});

test("trackSearchIntent fires once per session with reached_date_step", () => {
  const first = trackSearchIntent({
    departure: "Odessa",
    arrival: "Varna",
    reachedDateStep: true,
  });
  const second = trackSearchIntent({
    departure: "Odessa",
    arrival: "Kyiv",
    reachedDateStep: false,
  });

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.calls[0]?.event, "search_intent");
  assert.equal(ctx.calls[0]?.params.departure, "Odessa");
  assert.equal(ctx.calls[0]?.params.reached_date_step, true);
});

// ─────────────────────────── GA4 debug mode ─────────────────────────────

const setSearch = (search: string) => {
  (globalThis as Record<string, unknown>).window = {
    ...((globalThis as Record<string, unknown>).window as object),
    location: { search },
  };
};

test("syncGa4DebugModeFromUrl enables debug via ?debug_mode=1", () => {
  setSearch("?debug_mode=1");
  assert.equal(syncGa4DebugModeFromUrl(), true);
  assert.equal(isGa4DebugMode(), true);
  setSearch("");
});

test("debug mode persists across navigation once enabled", () => {
  setSearch("?debug_mode=1");
  syncGa4DebugModeFromUrl();
  // Query param disappears on Next.js navigation — sessionStorage keeps it.
  setSearch("");
  assert.equal(syncGa4DebugModeFromUrl(), true);
  assert.equal(isGa4DebugMode(), true);
});

test("?debug_mode=0 disables debug mode", () => {
  setSearch("?debug_mode=1");
  syncGa4DebugModeFromUrl();
  setSearch("?debug_mode=0");
  assert.equal(syncGa4DebugModeFromUrl(), false);
  assert.equal(isGa4DebugMode(), false);
  setSearch("");
});

test("trackEvent adds debug_mode: true only when enabled", () => {
  setSearch("?debug_mode=1");
  syncGa4DebugModeFromUrl();
  setSearch("");
  trackContact({ method: "phone", source: "footer" });
  assert.equal(ctx.calls[0]?.params.debug_mode, true);
});

test("trackEvent omits debug_mode entirely when disabled", () => {
  trackContact({ method: "phone", source: "footer" });
  assert.equal("debug_mode" in (ctx.calls[0]?.params ?? {}), false);
});
