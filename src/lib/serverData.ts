// Серверная загрузка публичных данных главной и посадочных страниц.
//
// Контракт с бэкендом не меняется: те же POST /selected_route и
// POST /selected_pricelist с телом {"lang": "<locale>"}. Меняется только то,
// кто их вызывает — серверный рендер вместо браузера.
//
// Серверу нужен абсолютный URL: относительный "/api" в Netlify-функции не
// резолвится, потому что redirect /api/* обрабатывается edge-слоем, а не
// самой функцией. Адрес задаётся переменной окружения API_ORIGIN.
import type { Lang } from "@/lib/locale";

const SERVER_API_BASE = (
  process.env.API_ORIGIN ||
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 8000;

export type ServerStop = {
  id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  arrival_time?: string | null;
  departure_time?: string | null;
};

export type ServerRoute = {
  id: number;
  name: string;
  stops: ServerStop[];
};

export type SelectedRouteResponse = Partial<{
  forward: ServerRoute;
  backward: ServerRoute;
}>;

export type ServerPriceItem = {
  departure_stop_id: number;
  departure_name: string;
  arrival_stop_id: number;
  arrival_name: string;
  price: number;
};

// Никаких next.revalidate на самом фетче: оба эндпоинта — POST, а Data Cache
// кэширует только GET, опция была бы молча проигнорирована. Ревалидация живёт
// на уровне страницы (export const revalidate).
// cache: "no-store" тоже не ставим — он перевёл бы страницу в динамический
// рендер и обнулил кэш, ради которого всё затевается.
async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[serverData] ${path} → HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    // Молчаливый null: компонент догрузит данные в браузере, как раньше.
    console.error(`[serverData] ${path} failed:`, error);
    return null;
  }
}

export async function fetchSelectedRoute(lang: Lang): Promise<SelectedRouteResponse | null> {
  const data = await postJson<SelectedRouteResponse>("/selected_route", { lang });
  if (!data || (!data.forward && !data.backward)) return null;
  return data;
}

export async function fetchSelectedPricelist(lang: Lang): Promise<ServerPriceItem[] | null> {
  const data = await postJson<{ prices?: ServerPriceItem[] }>("/selected_pricelist", { lang });
  const prices = data?.prices;
  if (!Array.isArray(prices) || prices.length === 0) return null;
  return prices;
}
