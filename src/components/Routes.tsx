// src/components/routes/Routes.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { API } from "@/config";
import { useLanguage, type Lang } from "@/components/common/LanguageProvider";
import { routesTranslations } from "@/translations/home";
import styles from "./Routes.module.css";
import { sectionEyebrowClass, sectionTitleClass } from "./common/designGuide";
import { useSectionView } from "@/utils/useSectionView";

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

/* ===================== helpers ===================== */

const titleFromStops = (r?: Route | null) => r?.name ?? "";

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

/* ===================== Component ===================== */

type RoutesProps = {
  lang?: Lang;
  hubLinks?: Record<string, string>;
  /** Данные, отрендеренные на сервере. Пусто — компонент догрузит их сам. */
  initialData?: ApiResponse | null;
};

/** Ответ бэкенда → пара панелей. Одна логика для сервера и для браузера. */
function normalizeRoutes(data?: ApiResponse | null) {
  if (!data) return null;
  const forward = shallowClone(data.forward);
  const backward = reverseIfEqual(forward, data.backward ? shallowClone(data.backward) : null);
  if (!forward && !backward) return null;
  return { forward, backward };
}

export default function Routes({ lang: langProp, hubLinks, initialData }: RoutesProps = {}) {
  const { lang: ctxLang } = useLanguage();
  const lang = langProp ?? ctxLang;
  const L = routesTranslations[lang];
  const sectionRef = useSectionView<HTMLElement>("marshrut");
  const initial = useMemo(() => normalizeRoutes(initialData), [initialData]);

  // Пока данных нет — скелетон, а не «маршруты не найдены»: noData оставлен
  // для случая, когда ответ пришёл и он действительно пуст.
  const [loading, setLoading] = useState(!initial);
  const [err, setErr] = useState<string | null>(null);

  const [forward, setForward] = useState<Route | null>(initial?.forward ?? null);
  const [backward, setBackward] = useState<Route | null>(initial?.backward ?? null);
  // Локаль, которой соответствуют текущие данные. null — данных нет.
  const [dataLang, setDataLang] = useState<Lang | null>(initial ? lang : null);

  // Пришли серверные данные для другой локали (переключение языка) — принимаем
  // их сразу, без похода в сеть. Штатный приём React для синхронизации стейта
  // с пропсами; повтора не будет, потому что dataLang сразу становится lang.
  if (initial && dataLang !== lang) {
    setForward(initial.forward);
    setBackward(initial.backward);
    setDataLang(lang);
    setErr(null);
    setLoading(false);
  }

  // Клиентский фетч остаётся фолбэком: если серверные пропсы пришли пустыми,
  // компонент догружает данные в браузере, как делал раньше.
  useEffect(() => {
    if (dataLang === lang) return;

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
        const next = normalizeRoutes(data);
        setForward(next?.forward ?? null);
        setBackward(next?.backward ?? null);
        setDataLang(lang);
      })
      .catch((e) => !cancelled && setErr(String(e?.message || e)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [lang, dataLang]);

  const hasAny = !!forward || !!backward;

  return (
    <section id="routes" ref={sectionRef} className={styles.routes}>
      <div className={styles.routesInner}>
        <header className={styles.routesHeader}>
          <p className={sectionEyebrowClass}>{L.eyebrow}</p>
          <h2 className={sectionTitleClass}>{L.title}</h2>
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
                hubLinks={hubLinks}
              />
            )}
            {backward && (
              <RoutePanel
                title={titleFromStops(backward)}
                subtitle={L.backward}
                route={backward}
                lang={lang}
                hubLinks={hubLinks}
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
  hubLinks,
}: {
  title: string;
  subtitle: string;
  route: Route;
  lang?: Lang;
  hubLinks?: Record<string, string>;
}) {
  const L = routesTranslations[lang];
  const count = route.stops?.length ?? 0;

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
      </div>

      <StopsList stops={route.stops || []} lang={lang} hubLinks={hubLinks} />
    </article>
  );
}

function StopsList({
  stops,
  lang = "ru",
  hubLinks,
}: {
  stops: Stop[];
  lang?: Lang;
  hubLinks?: Record<string, string>;
}) {
  const L = routesTranslations[lang];
  const visibleByDefault = 4;
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = stops.length > visibleByDefault;
  const visibleStops = shouldCollapse && !expanded ? stops.slice(0, visibleByDefault) : stops;

  return (
    <div className={styles.routeCardStopsWrap}>
      <div className={styles.routeCardStops}>
        {visibleStops.map((stop, i) => (
          <StopRow
            key={`${stop.id}-${i}`}
            stop={stop}
            index={i + 1}
            isLast={i === visibleStops.length - 1}
            lang={lang}
            hubLinks={hubLinks}
          />
        ))}
      </div>
      {shouldCollapse && (
        <button
          type="button"
          className={styles.routeStopsToggle}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? L.showLess : L.showAll}
        </button>
      )}
    </div>
  );
}

function StopRow({
  stop,
  index,
  isLast,
  lang = "ru",
  hubLinks,
}: {
  stop: Stop;
  index: number;
  isLast: boolean;
  lang?: Lang;
  hubLinks?: Record<string, string>;
}) {
  const L = routesTranslations[lang];
  const dotClasses = [styles.routeStopDot];

  if (index === 1) {
    dotClasses.push(styles.routeStopDotStart);
  }

  if (isLast) {
    dotClasses.push(styles.routeStopDotEnd);
  }

  const stopName = stop.name?.trim() ?? "";
  const stopHref = hubLinks?.[stopName];

  return (
    <div className={styles.routeStop}>
      <div className={styles.routeStopLine}>
        <div className={dotClasses.join(" ")}>{index}</div>
        {!isLast && <div className={styles.routeStopLineSeg} />}
      </div>
      <div className={styles.routeStopCard}>
        <div className={styles.routeStopTop}>
          <div>
            <div className={styles.routeStopCity}>
              {stopHref ? (
                <Link href={stopHref} className="hover:underline">
                  {stop.name}
                </Link>
              ) : (
                stop.name
              )}
            </div>
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
