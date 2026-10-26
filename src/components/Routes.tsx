// src/components/Routes.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { API } from "@/config";
import { useLanguage, type Lang } from "@/components/common/LanguageProvider";
import { routesTranslations } from "@/translations/home";
import {
  accentPillClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardTitleClass,
  sectionDescriptionClass,
  sectionEyebrowClass,
  sectionInnerClass,
  sectionPadClass,
  sectionTitleClass,
} from "./common/designGuide";
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

/** «13:40:00» → «13:40»: секунды в расписании не нужны. */
const shortTime = (time?: string | null) => (time ? time.trim().slice(0, 5) : "");

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
    <section id="routes" ref={sectionRef} className={`bg-white ${sectionPadClass}`}>
      <div className={`${sectionInnerClass} flex flex-col gap-6 lg:gap-9`}>
        <div className="flex flex-wrap items-end justify-between gap-4 lg:gap-12">
          <div className="flex flex-1 basis-[520px] flex-col gap-3.5">
            <span className={sectionEyebrowClass}>{L.eyebrow}</span>
            <h2 className={sectionTitleClass}>{L.title}</h2>
          </div>
          <p className={`flex-1 basis-[380px] ${sectionDescriptionClass}`}>{L.intro}</p>
        </div>

        {loading && <SkeletonCards />}

        {!loading && err && <p className="text-[15px] text-[#c2410c]">{err}</p>}

        {!loading && !err && !hasAny && <p className="text-[15px] text-[#5c6370]">{L.noData}</p>}

        {!loading && !err && hasAny && (
          <div className="grid items-start gap-5 lg:grid-cols-2">
            {forward && (
              <RoutePanel
                title={titleFromStops(forward)}
                days={L.daysForward}
                route={forward}
                lang={lang}
                hubLinks={hubLinks}
              />
            )}
            {backward && (
              <RoutePanel
                title={titleFromStops(backward)}
                days={L.daysBackward}
                route={backward}
                lang={lang}
                hubLinks={hubLinks}
              />
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 gap-x-6">
          <span className="text-[15px] text-[#5c6370]">{L.timesNote}</span>
          <Link href="#booking" className={buttonPrimaryClass}>
            {L.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ===================== UI Pieces ===================== */

function SkeletonCards() {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-3xl bg-[#f6f4f1] p-5 sm:p-6">
          <div className="h-7 w-2/3 animate-pulse rounded-full bg-black/5" />
          {[0, 1, 2, 3].map((j) => (
            <div key={j} className="h-11 animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
      ))}
    </div>
  );
}

function RoutePanel({
  title,
  days,
  route,
  lang = "ru",
  hubLinks,
}: {
  title: string;
  days: string;
  route: Route;
  lang?: Lang;
  hubLinks?: Record<string, string>;
}) {
  return (
    <article className="flex flex-col gap-1.5 rounded-3xl bg-[#f6f4f1] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 pb-2">
        <h3 className={cardTitleClass}>{title}</h3>
        <span className={accentPillClass}>{days}</span>
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
  // В свёрнутом виде показываем концы маршрута и первые остановки после начала.
  const visibleStops = shouldCollapse && !expanded ? stops.slice(0, visibleByDefault) : stops;
  const hiddenCount = stops.length - visibleStops.length;

  return (
    <div className="flex flex-col">
      {visibleStops.map((stop, i) => (
        <StopRow
          key={`${stop.id}-${i}`}
          stop={stop}
          isKey={i === 0 || (!shouldCollapse || expanded ? i === stops.length - 1 : false)}
          lang={lang}
          hubLinks={hubLinks}
        />
      ))}

      {shouldCollapse && !expanded && hiddenCount > 0 ? (
        <div className="relative grid min-h-[26px] grid-cols-[24px_minmax(0,1fr)] items-center gap-3.5">
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-[11px] top-0 w-0.5 bg-[repeating-linear-gradient(#fdba74_0_4px,transparent_4px_8px)]"
          />
          <span />
          <span className="py-1 text-[13.5px] text-[#5c6370]">+ {L.stopsCount(hiddenCount)}</span>
        </div>
      ) : null}

      {shouldCollapse && (
        <button
          type="button"
          className={`mt-3 self-start ${buttonSecondaryClass} min-h-[44px] px-[18px] text-[15px]`}
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
  isKey,
  lang = "ru",
  hubLinks,
}: {
  stop: Stop;
  isKey: boolean;
  lang?: Lang;
  hubLinks?: Record<string, string>;
}) {
  const L = routesTranslations[lang];
  const stopName = stop.name?.trim() ?? "";
  const stopHref = hubLinks?.[stopName];
  const arrival = shortTime(stop.arrival_time);
  const departure = shortTime(stop.departure_time);
  const time =
    arrival && departure
      ? `${arrival} – ${departure}`
      : departure
        ? `${L.departure} ${departure}`
        : arrival
          ? `${L.arrival} ${arrival}`
          : "";

  return (
    <div
      className={`relative grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3.5 ${
        isKey ? "min-h-[46px]" : "min-h-[38px]"
      }`}
    >
      <span aria-hidden="true" className="absolute bottom-0 left-[11px] top-0 w-0.5 bg-[#fdba74]" />
      {isKey ? (
        <span
          aria-hidden="true"
          className="relative h-6 w-6 rounded-full border-4 border-[#f6f4f1] bg-[#c2410c]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="relative justify-self-center h-2.5 w-2.5 rounded-full border-2 border-[#c2410c] bg-white"
        />
      )}

      {isKey ? (
        <span className="flex min-w-0 flex-col leading-tight">
          <b className="text-[17px] text-[#173452]">
            {stopHref ? (
              <Link href={stopHref} className="hover:text-[#c2410c] hover:underline">
                {stop.name}
              </Link>
            ) : (
              stop.name
            )}
          </b>
          {stop.description ? (
            <span className="text-[13.5px] text-[#5c6370]">{stop.description}</span>
          ) : null}
          {stop.location ? (
            <a
              href={stop.location}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-[13.5px] font-semibold text-[#c2410c] hover:underline"
            >
              {L.map}
            </a>
          ) : null}
        </span>
      ) : (
        <span className="min-w-0 truncate text-[15px] text-[#5c6370]">
          {stopHref ? (
            <Link href={stopHref} className="hover:text-[#c2410c] hover:underline">
              {stop.name}
            </Link>
          ) : (
            stop.name
          )}
          {stop.description ? ` · ${stop.description}` : ""}
        </span>
      )}

      {time ? (
        <span
          className={`whitespace-nowrap tabular-nums ${
            isKey ? "text-[16px] font-bold text-[#173452]" : "text-[14px] text-[#5c6370]"
          }`}
        >
          {time}
        </span>
      ) : (
        <span />
      )}
    </div>
  );
}
