// src/components/routes/Routes.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  LogOut,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { API } from "@/config";
import { useLanguage, type Lang } from "@/components/common/LanguageProvider";

/* ===================== Types ===================== */

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

/* ===================== i18n ===================== */

const T = {
  ru: {
    title: "Наши маршруты",
    forward: "Направление 1",
    backward: "Направление 2",
    noData: "Маршруты не найдены",
    arrival: "Прибытие",
    departure: "Отправление",
    map: "Открыть на карте",
    stopsCount: (n: number) =>
      `${n} остановк${n % 10 === 1 && n % 100 !== 11
        ? "а"
        : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
          ? "и"
          : ""}`,
    duration: "в пути",
    showAll: "Показать все",
    showLess: "Свернуть",
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
    showAll: "Show all",
    showLess: "Show less",
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
    showAll: "Покажи всички",
    showLess: "Скрий",
  },
  ua: {
    title: "Наші маршрути",
    forward: "Напрям 1",
    backward: "Напрям 2",
    noData: "Маршрути не знайдено",
    arrival: "Прибуття",
    departure: "Відправлення",
    map: "Відкрити на мапі",
    stopsCount: (n: number) =>
      `${n} зупин${n === 1 ? "ка" : n >= 2 && n <= 4 ? "ки" : "ок"}`,
    duration: "у дорозі",
    showAll: "Показати всі",
    showLess: "Згорнути",
  },
} as const;

/* ===================== helpers ===================== */

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

/** Если forward и backward равны — во второй панели показываем reverse */
const reverseIfEqual = (f?: Route | null, b?: Route | null): Route | null => {
  if (!b) return null;
  if (!f) return shallowClone(b);
  if (!deepEqualStops(f.stops, b.stops)) return shallowClone(b);
  return { ...b, stops: [...(b.stops || [])].reverse() };
};

const firstTime = (s?: Stop[]) =>
  s?.[0]?.departure_time || s?.[0]?.arrival_time || null;
const lastTime = (s?: Stop[]) =>
  s?.[s.length - 1]?.arrival_time || s?.[s.length - 1]?.departure_time || null;

/* ===================== Component ===================== */

export default function Routes() {
  const { lang } = useLanguage();
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
    <section
      id="routes"
      className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-sky-50 via-white to-white px-2 py-16 shadow-[0_40px_120px_-60px_rgba(14,165,233,0.35)]"
    >
      <div className="pointer-events-none absolute inset-x-16 top-6 h-32 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-40 w-40 rounded-full bg-sky-100/60 blur-3xl" />

      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 ring-1 ring-sky-100">
            Bus routes
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            {L.title}
          </h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Плавные карточки, подчёркивающие наш фирменный небесный стиль и делающее чтение расписания проще.
          </p>
        </div>

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
            className={`mt-10 grid gap-8 ${forward && backward ? "md:grid-cols-2" : "grid-cols-1"
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

/* ===================== UI Pieces ===================== */

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

  // «протяжённость», если времени нет — не показываем
  const t1 = firstTime(route.stops);
  const t2 = lastTime(route.stops);
  const duration = t1 && t2 ? `${t1} → ${t2}` : null;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-sky-100/80 bg-white/90 shadow-xl shadow-sky-100/60 backdrop-blur">
      <div className="absolute inset-x-6 top-0 h-1 rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-600" />

      <div className="p-5 md:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-600">{subtitle}</p>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900">{title}</h3>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 shadow-sm shadow-sky-100/60">
              {L.stopsCount(count)}
            </span>
            {duration && (
              <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs text-slate-800 ring-1 ring-slate-200 shadow-sm">
                <Clock className="mr-1.5 h-3.5 w-3.5 text-sky-500" />
                {L.duration}: {duration}
              </span>
            )}
          </div>
        </div>

        {/* Rail */}
        <StopsList stops={route.stops} lang={lang} />
      </div>
    </div>
  );
}

/* ===== Список остановок с компактным режимом для мобильных ===== */

function StopsList({ stops, lang = "ru" }: { stops: Stop[]; lang?: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const L = T[lang];

  // Мобильный: показываем первую, последнюю и одну из середины (если есть)
  const compactStops = useMemo(() => {
    if (stops.length <= 3) return stops;
    const mid = Math.floor(stops.length / 2);
    return [stops[0], stops[mid], stops[stops.length - 1]];
  }, [stops]);

  const renderStops = (list: Stop[]) => (
    <ol className="relative pl-9">
      {/* вертикальная линия */}
      <div className="absolute left-[18px] top-2 bottom-6 w-[3px] rounded-full bg-gradient-to-b from-sky-400 via-sky-200 to-slate-200" />
      {list.map((s, i) => (
        <StopRow
          key={`${s.id}-${i}`}
          stop={s}
          index={i + 1}
          isLast={i === list.length - 1}
          lang={lang}
        />
      ))}
    </ol>
  );

  return (
    <>
      {/* Desktop / Tablet: всегда все */}
      <div className="hidden sm:block">
        {renderStops(stops)}
      </div>

      {/* Mobile: компактный вид + «Показать все» */}
      <div className="sm:hidden">
        {expanded ? renderStops(stops) : renderStops(compactStops)}

        {stops.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 shadow-sm hover:bg-sky-100"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {L.showLess}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {L.showAll}
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
}

/* ===== Одна остановка ===== */

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
      {/* Порядковый бейдж */}
      <span className="absolute left-[5px] top-5 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-[11px] font-semibold text-white ring-2 ring-white shadow-lg shadow-sky-200/80">
        {index}
      </span>

      {/* Карточка остановки */}
      <div className="ml-8 mb-6 rounded-2xl border border-slate-100/80 bg-gradient-to-br from-white via-white to-slate-50/40 shadow-sm shadow-sky-100/50">
        {/* Заголовок + описание */}
        <div className="px-4 pt-4">
          <div className="mb-1.5 text-[15px] font-semibold text-slate-900">{stop.name}</div>
          {stop.description && (
            <div className="text-xs text-slate-600">{stop.description}</div>
          )}
        </div>

        {/* Время: выравниваем по колонкам + акцентные цифры */}
        {(stop.arrival_time || stop.departure_time) && (
          <div className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-100/90 px-4 py-3 sm:grid-cols-[1fr_auto_auto]">
            {/* Заполнитель для заголовка в мобильной сетке */}
            <div className="hidden sm:block" />

            {stop.arrival_time && (
              <div className="flex items-center gap-2 justify-start rounded-lg bg-sky-50/60 px-2 py-1 sm:justify-center">
                <Clock className="h-4 w-4 text-sky-500" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] text-slate-500">{L.arrival}</span>
                  <span className="tabular-nums font-mono font-semibold text-slate-900">
                    {stop.arrival_time}
                  </span>
                </div>
              </div>
            )}

            {stop.departure_time && (
              <div className="flex items-center gap-2 justify-end rounded-lg bg-emerald-50/60 px-2 py-1">
                <LogOut className="h-4 w-4 text-emerald-500" />
                <div className="flex flex-col leading-tight text-right">
                  <span className="text-[11px] text-slate-500">{L.departure}</span>
                  <span className="tabular-nums font-mono font-semibold text-slate-900">
                    {stop.departure_time}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Кнопка карты */}
        {stop.location && (
          <div className="border-t border-slate-100/90 px-4 py-2.5">
            <a
              href={stop.location}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100 shadow-sm hover:bg-sky-100"
            >
              <MapPin className="h-3.5 w-3.5" />
              {L.map}
            </a>
          </div>
        )}
      </div>

      {/* соединительная линия (не у последней) */}
      {!isLast && (
        <div className="absolute left-[18px] -bottom-4 h-5 w-[3px] rounded-full bg-slate-200" />
      )}
    </li>
  );
}
