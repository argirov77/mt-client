// src/components/routes/Routes.tsx
"use client";

import React, { useEffect, useState } from "react";
import { API } from "@/config";
import { useLanguage, type Lang } from "@/components/common/LanguageProvider";
import styles from "./Routes.module.css";

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
    eyebrow: "Маршруты автобусов",
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
    duration: "В пути",
    showAll: "Показать все",
    showLess: "Свернуть",
  },
  en: {
    eyebrow: "Bus routes",
    title: "Our routes",
    forward: "Direction 1",
    backward: "Direction 2",
    noData: "No routes found",
    arrival: "Arrival",
    departure: "Departure",
    map: "Open in map",
    stopsCount: (n: number) => `${n} stops`,
    duration: "Duration",
    showAll: "Show all",
    showLess: "Show less",
  },
  bg: {
    eyebrow: "Автобусни маршрути",
    title: "Нашите маршрути",
    forward: "Посока 1",
    backward: "Посока 2",
    noData: "Няма намерени маршрути",
    arrival: "Пристига",
    departure: "Заминава",
    map: "Отвори на картата",
    stopsCount: (n: number) => `${n} спирк${n === 1 ? "а" : "и"}`,
    duration: "Пътуване",
    showAll: "Покажи всички",
    showLess: "Скрий",
  },
  ua: {
    eyebrow: "Автобусні маршрути",
    title: "Наші маршрути",
    forward: "Напрям 1",
    backward: "Напрям 2",
    noData: "Маршрути не знайдено",
    arrival: "Прибуття",
    departure: "Відправлення",
    map: "Відкрити на мапі",
    stopsCount: (n: number) =>
      `${n} зупин${n === 1 ? "ка" : n >= 2 && n <= 4 ? "ки" : "ок"}`,
    duration: "У дорозі",
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
    <section id="routes" className={styles.routes}>
      <div className={styles.routesInner}>
        <header className={styles.routesHeader}>
          <p className={styles.routesEyebrow}>{L.eyebrow}</p>
          <h2 className={styles.routesTitle}>{L.title}</h2>
        </header>

        {loading && <SkeletonCards />}

        {!loading && err && <p className={styles.error}>{err}</p>}

        {!loading && !err && !hasAny && <p className={styles.empty}>{L.noData}</p>}

        {!loading && !err && hasAny && (
          <div className={styles.routesCards}>
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

function SkeletonCards() {
  return (
    <div className={styles.routesCards}>
      {[0, 1].map((i) => (
        <div key={i} className={`${styles.routeCard} ${styles.skeletonCard}`}>
          <div className={styles.skeletonSummary} />
          <div className={styles.skeletonStops}>
            {[0, 1, 2].map((j) => (
              <div key={j} className={styles.skeletonStop} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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

  const t1 = firstTime(route.stops);
  const t2 = lastTime(route.stops);
  const duration = t1 && t2 ? `${t1} — ${t2}` : null;

  return (
    <article className={styles.routeCard}>
      <div className={styles.routeCardSummary}>
        <div className={styles.routeCardSummaryMain}>
          <span className={styles.routeCardBadge}>{subtitle}</span>
          <div className={styles.routeCardText}>
            <div className={styles.routeCardDirection}>{title}</div>
            <div className={styles.routeCardMeta}>{L.stopsCount(count)}</div>
          </div>
        </div>
        {duration && (
          <div className={styles.routeCardSummaryTimes}>
            <span>
              {L.duration}: <strong>{duration}</strong>
            </span>
          </div>
        )}
      </div>

      <StopsList stops={route.stops || []} lang={lang} />
    </article>
  );
}

function StopsList({ stops, lang = "ru" }: { stops: Stop[]; lang?: Lang }) {
  return (
    <div className={styles.routeCardStops}>
      {stops.map((stop, i) => (
        <StopRow
          key={`${stop.id}-${i}`}
          stop={stop}
          index={i + 1}
          isLast={i === stops.length - 1}
          lang={lang}
        />
      ))}
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
  const dotClasses = [styles.routeStopDot];

  if (index === 1) {
    dotClasses.push(styles.routeStopDotStart);
  }

  if (isLast) {
    dotClasses.push(styles.routeStopDotEnd);
  }

  return (
    <div className={styles.routeStop}>
      <div className={styles.routeStopLine}>
        <div className={dotClasses.join(" ")}>{index}</div>
        {!isLast && <div className={styles.routeStopLineSeg} />}
      </div>
      <div className={styles.routeStopCard}>
        <div className={styles.routeStopTop}>
          <div>
            <div className={styles.routeStopCity}>{stop.name}</div>
            {stop.description && (
              <div className={styles.routeStopPlace}>{stop.description}</div>
            )}
          </div>
          {(stop.arrival_time || stop.departure_time) && (
            <div className={styles.routeStopTimes}>
              {stop.arrival_time && (
                <div>
                  {L.arrival} <span>{stop.arrival_time}</span>
                </div>
              )}
              {stop.departure_time && (
                <div>
                  {L.departure} <span>{stop.departure_time}</span>
                </div>
              )}
            </div>
          )}
        </div>
        {stop.location && (
          <a
            href={stop.location}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.routeStopMap}
          >
            {L.map}
          </a>
        )}
      </div>
    </div>
  );
}
