// src/components/routes/Routes.tsx
"use client";

import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { API } from "@/config";

type Lang = "ru" | "bg" | "en" | "ua";

type Stop = {
  id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  arrival_time?: string | null;
  departure_time?: string | null;
};

type Route = {
  id: number;
  name: string;
  stops: Stop[];
};

type ApiResponse = Partial<{
  forward: Route;
  backward: Route;
}>;

const T = {
  ru: {
    title: "Наши маршруты",
    forward: "Направление 1",
    backward: "Направление 2",
    noData: "Маршруты не найдены",
    arrival: "Прибытие",
    departure: "Отправление",
    map: "Открыть на карте",
    stopsCount: (n: number) => `${n} остановк${n % 10 === 1 && n % 100 !== 11 ? "а" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "и" : ""}`,
    duration: "в пути",
  },
  en: {
    title: "Our routes",
    forward: "Direction 1",
    backward: "Direction 2",
    noData: "No routes found",
    arrival: "Arrival",
    departure: "Departure",
    map: "Open in map",
    stopsCount: (n: number) => `${n} stops`,
    duration: "duration",
  },
  bg: {
    title: "Нашите маршрути",
    forward: "Посока 1",
    backward: "Посока 2",
    noData: "Няма намерени маршрути",
    arrival: "Пристига",
    departure: "Заминава",
    map: "Отвори на картата",
    stopsCount: (n: number) => `${n} спирк${n === 1 ? "а" : "и"}`,
    duration: "престой",
  },
  ua: {
    title: "Наші маршрути",
    forward: "Напрям 1",
    backward: "Напрям 2",
    noData: "Маршрути не знайдено",
    arrival: "Прибуття",
    departure: "Відправлення",
    map: "Відкрити на мапі",
    stopsCount: (n: number) => `${n} зупин${n === 1 ? "ка" : n >= 2 && n <= 4 ? "ки" : "ок"}`,
    duration: "у дорозі",
  },
} as const;

/* ---------------- helpers ---------------- */

const titleFromStops = (r?: Route | null) => {
  if (!r || !r.stops?.length) return r?.name ?? "";
  const first = r.stops[0]?.name?.trim();
  const last = r.stops[r.stops.length - 1]?.name?.trim();
  return first && last ? `${first} — ${last}` : r.name;
};

const shallowClone = (r?: Route | null): Route | null =>
  r ? { ...r, stops: Array.isArray(r.stops) ? [...r.stops] : [] } : null;

const deepEqualStops = (a: Stop[] = [], b: Stop[] = []) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const sa = a[i];
    const sb = b[i];
    if (
      sa.id !== sb.id ||
      sa.name?.trim() !== sb.name?.trim() ||
      (sa.arrival_time || "") !== (sb.arrival_time || "") ||
      (sa.departure_time || "") !== (sb.departure_time || "") ||
      (sa.description?.trim() || "") !== (sb.description?.trim() || "") ||
      (sa.location?.trim() || "") !== (sb.location?.trim() || "")
    ) {
      return false;
    }
  }
  return true;
};

/** Только для UI: если forward и backward равны — во второй панели показываем reverse */
const reverseIfEqual = (f?: Route | null, b?: Route | null): Route | null => {
  if (!b) return null;
  if (!f) return shallowClone(b);
  if (!deepEqualStops(f.stops, b.stops)) return shallowClone(b);
  return { ...b, stops: [...(b.stops || [])].reverse() };
};

const firstTime = (s?: Stop[]) => s?.[0]?.departure_time || s?.[0]?.arrival_time || null;
const lastTime = (s?: Stop[]) => s?.[s.length - 1]?.arrival_time || s?.[s.length - 1]?.departure_time || null;

/* ---------------- component ---------------- */

export default function Routes({ lang = "ru" }: { lang?: Lang }) {
  const L = T[lang];
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [forward, setForward] = useState<Route | null>(null);
  const [backward, setBackward] = useState<Route | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);

    fetch(`${API}/selected_route`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ lang }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as ApiResponse;
      })
      .then((data) => {
        if (cancelled) return;
        const f = shallowClone(data.forward);
        const b = reverseIfEqual(f, data.backward ? shallowClone(data.backward) : null);
        setForward(f);
        setBackward(b);
      })
      .catch((e) => !cancelled && setErr(String(e?.message || e)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const hasAny = !!forward || !!backward;

  return (
    <section id="routes" className="py-16 bg-gradient-to-b from-slate-50 to-slate-100/60">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
          {L.title}
        </h2>

        {loading && (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-white/70 backdrop-blur shadow-lg ring-1 ring-black/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && err && (
          <p className="mt-8 text-center text-rose-600">{err}</p>
        )}

        {!loading && !err && !hasAny && (
          <p className="mt-8 text-center text-slate-500">{L.noData}</p>
        )}

        {!loading && !err && hasAny && (
          <div
            className={`mt-8 grid gap-8 ${
              forward && backward ? "md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {forward && (
              <RoutePanel
                title={titleFromStops(forward)}
                subtitle={L.forward}
                route={forward}
                lang={lang}
              />
            )}
            {backward && (
              <RoutePanel
                title={titleFromStops(backward)}
                subtitle={L.backward}
                route={backward}
                lang={lang}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- UI pieces ---------------- */

function RoutePanel({
  title,
  subtitle,
  route,
  lang = "ru",
}: {
  title: string;
  subtitle: string;
  route: Route;
  lang?: Lang;
}) {
  const L = T[lang];
  const count = route.stops?.length ?? 0;

  // приблизительная «протяжённость», если времени нет — не показываем
  const t1 = firstTime(route.stops);
  const t2 = lastTime(route.stops);
  const duration =
    t1 && t2
      ? `${t1} → ${t2}`
      : null;

  return (
    <div className="rounded-3xl bg-white/85 backdrop-blur shadow-xl ring-1 ring-slate-200 p-5 md:p-6">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100">
            {subtitle}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
            {L.stopsCount(count)}
          </span>
          {duration && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-100">
              {L.duration}: {duration}
            </span>
          )}
        </div>
      </div>

      {/* rail */}
      <ol className="relative pl-7">
        <div className="absolute left-[14px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-sky-300 via-slate-200 to-slate-200" />
        {route.stops?.map((s, i) => (
          <StopRow key={`${s.id}-${i}`} stop={s} index={i + 1} lang={lang} isLast={i === route.stops.length - 1} />
        ))}
      </ol>
    </div>
  );
}

function StopRow({
  stop,
  index,
  isLast,
  lang = "ru",
}: {
  stop: Stop;
  index: number;
  isLast: boolean;
  lang?: Lang;
}) {
  const L = T[lang];

  return (
    <li className="relative">
      {/* порядковый бейдж */}
      <span className="absolute left-[6px] top-5 grid h-6 w-6 place-items-center rounded-full bg-sky-600 text-[10px] font-semibold text-white ring-2 ring-white shadow">
        {index}
      </span>

      {/* карточка остановки */}
      <div className="ml-6 mb-5 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
        <div className="mb-2 font-medium text-slate-900">{stop.name}</div>

        <div className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
          {stop.arrival_time && (
            <div>
              <span className="font-medium">{L.arrival}: </span>
              <span className="tabular-nums">{stop.arrival_time}</span>
            </div>
          )}
          {stop.departure_time && (
            <div>
              <span className="font-medium">{L.departure}: </span>
              <span className="tabular-nums">{stop.departure_time}</span>
            </div>
          )}
        </div>

        {stop.description && (
          <div className="mt-1 text-xs text-slate-600 line-clamp-1">{stop.description}</div>
        )}

        {stop.location && (
          <a
            href={stop.location}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100"
          >
            <MapPin className="h-3.5 w-3.5" />
            {L.map}
          </a>
        )}
      </div>

      {/* соединительная линия между карточками (не у последней) */}
      {!isLast && (
        <div className="absolute left-[14px] -bottom-3 h-3 w-[2px] bg-slate-200" />
      )}
    </li>
  );
}
