type GtagParams = Record<string, unknown>;

export const GA_MEASUREMENT_ID = "G-N3PVQB5J6S";

// ───────────────────────── GA4 debug mode ─────────────────────────────────
//
// Debug mode включается по URL-параметру ?debug_mode=1 и живёт в sessionStorage
// (только текущая вкладка/сессия), потому что query-параметр теряется при
// Next.js-навигации. ?debug_mode=0 выключает. Параметр debug_mode отправляется
// в GA4 ТОЛЬКО когда режим включён — при выключенном режиме он полностью
// исключается (никогда не шлём debug_mode: false), чтобы обычные production-
// посетители не попадали в DebugView.

const DEBUG_STORAGE_KEY = "ga4_debug_mode";

/**
 * Синхронизирует GA4 debug mode из URL в sessionStorage и возвращает текущее
 * состояние. ?debug_mode=1 → включить, ?debug_mode=0 → выключить, без параметра
 * → сохранить ранее выбранное состояние. Вызывать один раз при инициализации.
 */
export const syncGa4DebugModeFromUrl = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("debug_mode");
    if (value === "1") {
      window.sessionStorage.setItem(DEBUG_STORAGE_KEY, "1");
    } else if (value === "0") {
      window.sessionStorage.removeItem(DEBUG_STORAGE_KEY);
    }
    return window.sessionStorage.getItem(DEBUG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

/** Текущее состояние GA4 debug mode (из sessionStorage). */
export const isGa4DebugMode = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(DEBUG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

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

/**
 * Единственная точка отправки событий в GA4. UTM-атрибуция и тип устройства
 * прикрепляются здесь, поэтому ЛЮБОЕ событие, отправленное через trackEvent
 * (напрямую или через типизированные хелперы ниже), автоматически обогащается
 * UTM. Голых window.gtag() вызовов в компонентах быть не должно — иначе часть
 * событий уйдёт без UTM.
 */
export const trackEvent = (eventName: string, params?: GtagParams) => {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  const debugMode = isGa4DebugMode();
  const enriched = {
    ...(params ?? {}),
    ...getUtm(),
    device_type: getDeviceType(),
    // debug_mode шлём только когда режим включён; false никогда не отправляем.
    ...(debugMode ? { debug_mode: true } : {}),
  };
  try {
    w.gtag("event", eventName, enriched);
    if (debugMode) {
      console.debug("[GA4]", {
        eventName,
        params: enriched,
        debugMode,
        measurementId: GA_MEASUREMENT_ID,
      });
    }
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

// ───────────────────────── Currency by locale ─────────────────────────────

export type Locale = string | null | undefined;

/**
 * Валюта отчётности по локали:
 *   ru / ua (uk) → "UAH"
 *   en / bg      → "EUR"
 * Принимает как коды приложения ("ru", "ua", "en", "bg"), так и Intl-локали
 * ("ru-RU", "uk-UA", "en-US", "bg-BG"). Дефолт — UAH (основной рынок).
 *
 * Заменяет жёсткую константу FALLBACK_CURRENCY: валюта теперь всегда выводится
 * из локали, а не хардкодится по месту.
 */
export const getCurrencyForLocale = (locale?: Locale): "UAH" | "EUR" => {
  const base = String(locale ?? "")
    .toLowerCase()
    .split(/[-_]/)[0];
  if (base === "en" || base === "bg") return "EUR";
  // ru, ua, uk и всё остальное → UAH
  return "UAH";
};

/**
 * Доля «book»-броней (бронь без онлайн-оплаты), которые в итоге доезжают и
 * оплачивают офлайн. Взвешивает ценность события reservation, чтобы не задваивать
 * выручку с purchase и усреднить ожидаемую ценность по популяции.
 *
 * Настраивается Димой по данным бэкенда. Значение меняется здесь, в одном месте.
 */
export const RESERVATION_WEIGHT = 0.5;

// ───────────────────────── Shared helpers ─────────────────────────────────

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
    const cleaned = trimmed.replace(/[\s ]/g, "");
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

// ───────────────────────── Ecommerce items ────────────────────────────────

export type EcommerceItem = {
  item_id: string;
  item_name?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price?: number | string | null;
  quantity?: number | string | null;
  [extra: string]: unknown;
};

/** @deprecated Используйте EcommerceItem. Сохранён для обратной совместимости. */
export type PurchaseEventItem = EcommerceItem;

/**
 * Приводит item к консистентному виду: item_id — строка, price — положительное
 * число в основных единицах валюты (гривны/евро, не копейки/центы), quantity —
 * положительное число (по умолчанию 1). Прочие поля (departure, arrival,
 * travel_date, seat …) сохраняются как есть.
 */
const normalizeItems = (items: EcommerceItem[] | undefined): EcommerceItem[] =>
  (Array.isArray(items) ? items : []).map((item) => {
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

const sumItemsValue = (items: EcommerceItem[]): number =>
  items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );

const round2 = (value: number): number => Number((Number.isFinite(value) ? value : 0).toFixed(2));

/** Значение события: явный override, иначе — сумма по items. */
const resolveValue = (
  items: EcommerceItem[],
  valueOverride?: number | string | null,
): number => {
  const override = toFiniteNumber(valueOverride);
  if (override !== null && override > 0) return round2(override);
  return round2(sumItemsValue(items));
};

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

// ═══════════════════════ Purchase funnel (GA4 ecommerce) ═══════════════════
//
// Единая схема параметров: currency (по локали) + value (основные единицы) +
// items[]. Порядок воронки:
//   search → view_item_list → select_item → add_to_cart → begin_checkout
//   → add_payment_info → purchase   (онлайн-оплата)
//   … либо begin_checkout → reservation   (бронь без онлайн-оплаты)

// ── 1. search ──────────────────────────────────────────────────────────────
export type TrackSearchParams = {
  locale?: Locale;
  origin: string;
  destination: string;
  route?: string;
  departureDate?: string;
  returnDate?: string;
  tripType?: string;
  passengerCount?: number;
  adultCount?: number;
  discountCount?: number;
  extra?: GtagParams;
};

export const trackSearch = (params: TrackSearchParams) => {
  trackEvent("search", {
    search_term: `${params.origin} → ${params.destination}`,
    origin: params.origin,
    destination: params.destination,
    route: params.route,
    departure_date: params.departureDate,
    return_date: params.returnDate || undefined,
    trip_type: params.tripType,
    passenger_count: params.passengerCount,
    adult_count: params.adultCount,
    discount_count: params.discountCount,
    currency: getCurrencyForLocale(params.locale),
    ...(params.extra ?? {}),
  });
};

// ── 2. view_item_list ────────────────────────────────────────────────────
export type TrackViewItemListParams = {
  locale?: Locale;
  listId?: string;
  listName?: string;
  items: EcommerceItem[];
  extra?: GtagParams;
};

export const trackViewItemList = (params: TrackViewItemListParams) => {
  trackEvent("view_item_list", {
    item_list_id: params.listId,
    item_list_name: params.listName,
    currency: getCurrencyForLocale(params.locale),
    items: normalizeItems(params.items),
    ...(params.extra ?? {}),
  });
};

// ── 3. select_item ────────────────────────────────────────────────────────
export type TrackSelectItemParams = {
  locale?: Locale;
  listName?: string;
  items: EcommerceItem[];
  value?: number | string | null;
  extra?: GtagParams;
};

export const trackSelectItem = (params: TrackSelectItemParams) => {
  const items = normalizeItems(params.items);
  trackEvent("select_item", {
    item_list_name: params.listName,
    items,
    currency: getCurrencyForLocale(params.locale),
    value: resolveValue(items, params.value),
    ...(params.extra ?? {}),
  });
};

// ── 4. add_to_cart (фиксация рейс+место) ─────────────────────────────────
export type TrackAddToCartParams = {
  locale?: Locale;
  items: EcommerceItem[];
  value?: number | string | null;
  extra?: GtagParams;
};

export const trackAddToCart = (params: TrackAddToCartParams) => {
  const items = normalizeItems(params.items);
  trackEvent("add_to_cart", {
    items,
    currency: getCurrencyForLocale(params.locale),
    value: resolveValue(items, params.value),
    ...(params.extra ?? {}),
  });
};

// ── 5. begin_checkout (попадание на экран оформления) ────────────────────
export type TrackBeginCheckoutParams = {
  locale?: Locale;
  items: EcommerceItem[];
  value?: number | string | null;
  extra?: GtagParams;
};

export const trackBeginCheckout = (params: TrackBeginCheckoutParams) => {
  const items = normalizeItems(params.items);
  trackEvent("begin_checkout", {
    items,
    currency: getCurrencyForLocale(params.locale),
    value: resolveValue(items, params.value),
    ...(params.extra ?? {}),
  });
};

// ── 6. add_payment_info (клик Purchase → редирект на LiqPay) ─────────────
export type TrackAddPaymentInfoParams = {
  locale?: Locale;
  transactionId?: string | number | null;
  items?: EcommerceItem[];
  value?: number | string | null;
  paymentType?: string;
  extra?: GtagParams;
};

export const trackAddPaymentInfo = (params: TrackAddPaymentInfoParams) => {
  const items = normalizeItems(params.items);
  trackEvent("add_payment_info", {
    transaction_id:
      params.transactionId != null ? String(params.transactionId) : undefined,
    ...(items.length ? { items } : {}),
    currency: getCurrencyForLocale(params.locale),
    value: resolveValue(items, params.value),
    payment_type: params.paymentType ?? "liqpay",
    ...(params.extra ?? {}),
  });
};

// ── 7. purchase (оплата подтверждена) ────────────────────────────────────
export type TrackPurchaseParams = {
  transactionId: string | number | null | undefined;
  items: EcommerceItem[];
  locale?: Locale;
  currency?: string | null;
  valueOverride?: number | string | null;
  extra?: GtagParams;
};

const PURCHASE_FIRED_KEY_PREFIX = "ga_purchase_fired_";
const MAX_REASONABLE_PURCHASE_VALUE = 1_000_000;

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

  const normalizedItems = normalizeItems(params.items);

  // Канонический источник value — сумма цен билетов текущей транзакции
  // (ticket.price × quantity) в основных единицах валюты. valueOverride
  // (например totals.paid / amount_due) используется ТОЛЬКО как резерв, когда
  // у билетов нет цены: раньше именно этот резерв улетал в ~72 373.
  const itemsValue = sumItemsValue(normalizedItems);
  const overrideValue = toFiniteNumber(params.valueOverride);
  const value =
    itemsValue > 0
      ? itemsValue
      : overrideValue !== null && overrideValue > 0
        ? overrideValue
        : 0;
  const valueSource =
    itemsValue > 0 ? "items" : overrideValue && overrideValue > 0 ? "override" : "none";

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

  const roundedValue = round2(value);
  const payload: GtagParams = {
    transaction_id: transactionId,
    value: roundedValue,
    currency: params.currency || getCurrencyForLocale(params.locale),
    items: normalizedItems,
    ...(params.extra ?? {}),
  };

  trackEvent("purchase", payload);
  safeStorageSet(firedKey, String(Date.now()));

  if (isDev()) {
    console.log("[Analytics] purchase event fired", {
      transactionId,
      value: roundedValue,
      valueSource,
      itemsCount: normalizedItems.length,
      itemsValue,
      currency: payload.currency,
    });
  }

  return true;
};

// ── 8. reservation (бронь без онлайн-оплаты, путь «book») ────────────────
export type TrackReservationParams = {
  purchaseId: string | number | null | undefined;
  locale?: Locale;
  items?: EcommerceItem[];
  /** Полная стоимость брони (цена билета × количество) ДО взвешивания. */
  value?: number | string | null;
  currency?: string | null;
  tripFrom?: string;
  tripTo?: string;
  extra?: GtagParams;
};

const RESERVATION_FIRED_KEY_PREFIX = "ga_reservation_fired_";

export const trackReservation = (params: TrackReservationParams): boolean => {
  if (typeof window === "undefined") return false;

  const purchaseId =
    params.purchaseId !== null && params.purchaseId !== undefined
      ? String(params.purchaseId).trim()
      : "";
  if (!purchaseId) {
    if (isDev()) {
      console.error("[Analytics] reservation skipped: missing purchaseId");
    }
    return false;
  }

  const firedKey = `${RESERVATION_FIRED_KEY_PREFIX}${purchaseId}`;
  if (safeStorageGet(firedKey)) {
    if (isDev()) {
      console.debug("[Analytics] reservation skipped: already fired", {
        purchaseId,
      });
    }
    return false;
  }

  const items = normalizeItems(params.items);
  const baseValue = resolveValue(items, params.value);
  // Взвешенная ценность: усредняет ожидаемую выручку по book-броням и не
  // задваивает её с purchase (см. RESERVATION_WEIGHT).
  const weightedValue = round2(baseValue * RESERVATION_WEIGHT);

  const payload: GtagParams = {
    transaction_id: purchaseId,
    currency: params.currency || getCurrencyForLocale(params.locale),
    value: weightedValue,
    reservation_weight: RESERVATION_WEIGHT,
    reservation_value_full: baseValue,
    ...(items.length ? { items } : {}),
    ...(params.tripFrom ? { trip_from: params.tripFrom } : {}),
    ...(params.tripTo ? { trip_to: params.tripTo } : {}),
    ...(params.extra ?? {}),
  };

  trackEvent("reservation", payload);
  safeStorageSet(firedKey, String(Date.now()));

  if (isDev()) {
    console.log("[Analytics] reservation event fired", {
      purchaseId,
      value: weightedValue,
      fullValue: baseValue,
      weight: RESERVATION_WEIGHT,
      currency: payload.currency,
    });
  }

  return true;
};

// ═══════════════════════ Contacts / leads ════════════════════════════════

export type ContactMethod = "phone" | "email" | "telegram" | "viber" | "whatsapp";
export type ContactSource =
  | "topbar"
  | "about_section"
  | "parcel_section"
  | "footer"
  | "purchase_detail"
  | (string & {});

export type TrackContactParams = {
  method: ContactMethod;
  source: ContactSource;
  /** Значение контакта (телефон / email / мессенджер) — необязательно. */
  label?: string;
  extra?: GtagParams;
};

/**
 * Единое параметризованное событие контакта. Заменяет phone_click /
 * messenger_click / email_click во всех компонентах.
 */
export const trackContact = (params: TrackContactParams) => {
  trackEvent("contact", {
    method: params.method,
    source: params.source,
    event_category: "conversion",
    ...(params.label ? { event_label: params.label } : {}),
    ...(params.extra ?? {}),
  });
};

// ═══════════════════════ Content sections (Фаза 3) ════════════════════════

export type SectionName =
  | "schedule"
  | "prices"
  | "about"
  | "parcel"
  | "marshrut"
  | (string & {});

const VIEW_SECTION_FIRED_PREFIX = "ga_section_viewed_";

/**
 * view_section — одно параметризованное событие. Дедуп: один раз за сессию на
 * секцию (sessionStorage). Возвращает true, если событие было отправлено.
 */
export const trackViewSection = (section: SectionName, extra?: GtagParams): boolean => {
  if (typeof window === "undefined") return false;
  const key = `${VIEW_SECTION_FIRED_PREFIX}${section}`;
  try {
    if (window.sessionStorage?.getItem(key)) return false;
    window.sessionStorage?.setItem(key, "1");
  } catch {
    /* ignore storage errors — событие всё равно отправим */
  }
  trackEvent("view_section", { section, ...(extra ?? {}) });
  return true;
};

// ═══════════════════════ Search intent (Фаза 3) ══════════════════════════

export type TrackSearchIntentParams = {
  locale?: Locale;
  departure: string;
  arrival: string;
  /** Дошёл ли пользователь до шага выбора даты. */
  reachedDateStep: boolean;
  extra?: GtagParams;
};

const SEARCH_INTENT_FIRED_KEY = "ga_search_intent_fired";

/**
 * search_intent — намерение без результата: указаны departure и arrival, но
 * клика «Поиск» не было. Слать один раз за сессию. Возвращает true, если
 * событие было отправлено.
 */
export const trackSearchIntent = (params: TrackSearchIntentParams): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage?.getItem(SEARCH_INTENT_FIRED_KEY)) return false;
    window.sessionStorage?.setItem(SEARCH_INTENT_FIRED_KEY, "1");
  } catch {
    /* ignore storage errors — событие всё равно отправим */
  }
  trackEvent("search_intent", {
    departure: params.departure,
    arrival: params.arrival,
    reached_date_step: params.reachedDateStep,
    currency: getCurrencyForLocale(params.locale),
    ...(params.extra ?? {}),
  });
  return true;
};
