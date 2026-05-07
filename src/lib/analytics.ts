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
