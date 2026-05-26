type GtagParams = Record<string, unknown>;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

const UTM_STORAGE_KEY = "ga_utm_attribution";

export const captureUtm = () => {
  if (typeof window === "undefined") return;
  try {
    const url = new URLSearchParams(window.location.search);
    const captured: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = url.get(key);
      if (value) captured[key] = value;
    }
    if (Object.keys(captured).length === 0) return;
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(captured));
  } catch {
    /* ignore storage errors */
  }
};

const getUtm = (): GtagParams => {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const stored = JSON.parse(raw) as Record<string, string>;
    return {
      source: stored.utm_source,
      medium: stored.utm_medium,
      campaign: stored.utm_campaign,
      campaign_id: stored.utm_campaign,
      term: stored.utm_term,
      content: stored.utm_content,
      gclid: stored.gclid,
      fbclid: stored.fbclid,
    };
  } catch {
    return {};
  }
};

const getDeviceType = () => {
  if (typeof navigator === "undefined") return "unknown";
  return /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? "mobile" : "desktop";
};

export const trackEvent = (eventName: string, params?: GtagParams) => {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  const enriched = {
    ...(params ?? {}),
    ...getUtm(),
    device_type: getDeviceType(),
  };
  try {
    w.gtag("event", eventName, enriched);
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Analytics]", eventName, enriched);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.error("[Analytics] error", err);
  }
};

export const setUserProperties = (props: GtagParams) => {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  try {
    w.gtag("set", "user_properties", props);
  } catch {
    /* ignore */
  }
};

export const FALLBACK_CURRENCY = "UAH";

export const buildRouteCategory = (
  from: { id?: string | number | null; name: string },
  to: { id?: string | number | null; name: string },
) => {
  const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
  const left = from.id != null && from.id !== "" ? `id${from.id}` : slug(from.name);
  const right = to.id != null && to.id !== "" ? `id${to.id}` : slug(to.name);
  return `${left}-${right}`;
};

export const daysUntil = (futureMs: number | null | undefined): number | undefined => {
  if (!futureMs || !Number.isFinite(futureMs)) return undefined;
  return Math.max(0, Math.floor((futureMs - Date.now()) / 86400000));
};

export const toFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const cleaned = trimmed.replace(/[\s ]/g, "");
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    let normalized = cleaned;
    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else if (lastDot > lastComma) {
      normalized = normalized.replace(/,/g, "");
    } else if (lastComma >= 0) {
      normalized = normalized.replace(",", ".");
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export type PurchaseEventItem = {
  item_id: string;
  item_name?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price?: number | string | null;
  quantity?: number | string | null;
  [extra: string]: unknown;
};

export type TrackPurchaseParams = {
  transactionId: string | number | null | undefined;
  items: PurchaseEventItem[];
  currency?: string | null;
  valueOverride?: number | string | null;
  extra?: GtagParams;
};

const PURCHASE_FIRED_KEY_PREFIX = "ga_purchase_fired_";
const MAX_REASONABLE_PURCHASE_VALUE = 1_000_000;

const isDev = () => process.env.NODE_ENV !== "production";

const safeStorageGet = (key: string): string | null => {
  try {
    return (
      window.sessionStorage?.getItem(key) ??
      window.localStorage?.getItem(key) ??
      null
    );
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    window.sessionStorage?.setItem(key, value);
  } catch {
    /* ignore */
  }
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    /* ignore */
  }
};

export const trackPurchase = (params: TrackPurchaseParams): boolean => {
  if (typeof window === "undefined") return false;

  const transactionId =
    params.transactionId !== null && params.transactionId !== undefined
      ? String(params.transactionId).trim()
      : "";
  if (!transactionId) {
    if (isDev()) {
      console.error(
        "[Analytics] purchase event skipped: missing transactionId",
      );
    }
    return false;
  }

  const items = Array.isArray(params.items) ? params.items : [];
  const normalizedItems = items.map((item) => {
    const price = toFiniteNumber(item.price);
    const quantity = toFiniteNumber(item.quantity);
    const safePrice = price !== null && price > 0 ? Number(price.toFixed(2)) : 0;
    const safeQty = quantity !== null && quantity > 0 ? quantity : 1;
    return {
      ...item,
      item_id: String(item.item_id ?? ""),
      price: safePrice,
      quantity: safeQty,
    };
  });

  const itemsValue = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const overrideValue = toFiniteNumber(params.valueOverride);
  const value =
    itemsValue > 0
      ? itemsValue
      : overrideValue !== null && overrideValue > 0
        ? overrideValue
        : 0;

  if (!Number.isFinite(value) || value <= 0) {
    if (isDev()) {
      console.error("[Analytics] purchase event skipped: invalid value", {
        transactionId,
        value,
        itemsValue,
        valueOverride: params.valueOverride,
        items: normalizedItems,
      });
    }
    return false;
  }

  if (
    overrideValue !== null &&
    itemsValue > 0 &&
    Math.abs(overrideValue - itemsValue) > Math.max(1, itemsValue * 0.05)
  ) {
    if (isDev()) {
      console.warn(
        "[Analytics] purchase value mismatch (items vs override)",
        {
          transactionId,
          itemsValue,
          overrideValue,
        },
      );
    }
  }

  if (value > MAX_REASONABLE_PURCHASE_VALUE) {
    if (isDev()) {
      console.warn("[Analytics] purchase value is unusually high", {
        transactionId,
        value,
      });
    }
  }

  const firedKey = `${PURCHASE_FIRED_KEY_PREFIX}${transactionId}`;
  if (safeStorageGet(firedKey)) {
    if (isDev()) {
      console.debug("[Analytics] purchase event skipped: already fired", {
        transactionId,
      });
    }
    return false;
  }

  const roundedValue = Number(value.toFixed(2));
  const payload: GtagParams = {
    transaction_id: transactionId,
    value: roundedValue,
    currency: params.currency || FALLBACK_CURRENCY,
    items: normalizedItems,
    ...(params.extra ?? {}),
  };

  trackEvent("purchase", payload);
  safeStorageSet(firedKey, String(Date.now()));

  if (isDev()) {
    console.log("[Analytics] purchase event fired", {
      transactionId,
      value: roundedValue,
      itemsCount: normalizedItems.length,
      itemsValue,
      currency: payload.currency,
    });
  }

  return true;
};

const BOOKING_FIRED_KEY_PREFIX = "ga_booking_fired_";

export type TrackBookingParams = {
  purchaseId: string | number | null | undefined;
  tripFrom: string;
  tripTo: string;
  value?: number | string | null;
  currency?: string | null;
};

export const trackBooking = (params: TrackBookingParams): boolean => {
  if (typeof window === "undefined") return false;

  const purchaseId =
    params.purchaseId !== null && params.purchaseId !== undefined
      ? String(params.purchaseId).trim()
      : "";
  if (!purchaseId) {
    if (isDev()) {
      console.error("[Analytics] booking_success skipped: missing purchaseId");
    }
    return false;
  }

  const firedKey = `${BOOKING_FIRED_KEY_PREFIX}${purchaseId}`;
  if (safeStorageGet(firedKey)) {
    if (isDev()) {
      console.debug("[Analytics] booking_success skipped: already fired", {
        purchaseId,
      });
    }
    return false;
  }

  const payload: GtagParams = {
    transaction_id: purchaseId,
    trip_from: params.tripFrom,
    trip_to: params.tripTo,
    currency: params.currency || FALLBACK_CURRENCY,
  };

  const numericValue = toFiniteNumber(params.value);
  if (numericValue !== null && numericValue > 0) {
    payload.value = Number(numericValue.toFixed(2));
  }

  trackEvent("booking_success", payload);
  safeStorageSet(firedKey, String(Date.now()));

  if (isDev()) {
    console.log("[Analytics] booking_success event fired", {
      purchaseId,
      value: payload.value,
      currency: payload.currency,
    });
  }

  return true;
};
