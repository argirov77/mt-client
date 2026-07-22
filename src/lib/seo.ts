import type { Metadata } from "next";

import {
  DEFAULT_LOCALE,
  LOCALES,
  type Lang,
  isLocale,
  localeToPathPrefix,
  toHreflang,
  toHtmlLang,
  toOgLocale,
} from "@/lib/locale";
import { tripsData, type Trip } from "@/lib/tripsData";

export {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  localeToPathPrefix,
  toHreflang,
  toHtmlLang,
};

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "https://maximovtours.com";

export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: "Maximov Tours — bus Ukraine, Romania, Bulgaria since 1992",
};

export function buildPath(locale: Lang, path: string = "/"): string {
  const prefix = localeToPathPrefix(locale);
  if (!path || path === "/") return prefix || "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${normalized}`;
}

export function buildUrl(locale: Lang, path: string = "/"): string {
  return `${SITE_URL}${buildPath(locale, path)}`;
}

function tripSlugForLocale(trip: Trip, locale: Lang): string {
  return trip.i18n[locale]?.slug ?? trip.i18n[DEFAULT_LOCALE].slug;
}

export type AlternatesShape = {
  canonical: string;
  languages: Record<string, string>;
};

export function buildHomeAlternates(currentLocale: Lang): AlternatesShape {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[toHreflang(locale)] = buildUrl(locale, "/");
  }
  languages["x-default"] = buildUrl(DEFAULT_LOCALE, "/");
  return {
    canonical: buildUrl(currentLocale, "/"),
    languages,
  };
}

export function buildTripAlternates(tripKey: string, currentLocale: Lang): AlternatesShape {
  const trip = tripsData[tripKey];
  if (!trip) {
    return buildHomeAlternates(currentLocale);
  }
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[toHreflang(locale)] = buildUrl(locale, `/${tripSlugForLocale(trip, locale)}`);
  }
  languages["x-default"] = buildUrl(DEFAULT_LOCALE, `/${tripSlugForLocale(trip, DEFAULT_LOCALE)}`);
  return {
    canonical: buildUrl(currentLocale, `/${tripSlugForLocale(trip, currentLocale)}`),
    languages,
  };
}

export type HomeMeta = { title: string; description: string };

export const HOME_META: Record<Lang, HomeMeta> = {
  ru: {
    title: "Автобус Украина → Болгария | Максимов Турс — 30+ лет опыта",
    description:
      "Официальный перевозчик Украина↔Болгария, опыт 30+ лет. Прямой автобус Одесса – Варна, Бургас, Солнечный берег, Констанца. Билеты онлайн, посылки.",
  },
  ua: {
    title: "Автобус Україна → Болгарія | Максимов Турс — 30+ років",
    description:
      "Офіційний перевізник Україна↔Болгарія, досвід 30+ років. Прямий автобус Одеса – Варна, Бургас, Сонячний берег, Констанца. Квитки онлайн, посилки.",
  },
  en: {
    title: "Bus Ukraine → Bulgaria | Maximov Tours — 30+ years",
    description:
      "Licensed carrier Ukraine ↔ Bulgaria, 30+ years. Direct bus Odessa – Varna, Burgas, Sunny Beach, Constanta. Online tickets and schedule.",
  },
  bg: {
    title: "Автобус Украйна → България | Максимов Турс — 30+ години опит",
    description:
      "Официален превозвач Украйна↔България, опит 30+ години. Директен автобус Одеса – Варна, Бургас, Слънчев бряг, Констанца. Билети онлайн, пратки.",
  },
};

export function buildHomeMetadata(locale: Lang): Metadata {
  const meta = HOME_META[locale];
  const alternates = buildHomeAlternates(locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates,
    ...(locale === "bg" ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: alternates.canonical,
      siteName: "Maximov Tours",
      locale: toOgLocale(locale),
      alternateLocale: LOCALES.filter((l) => l !== locale).map(toOgLocale),
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [OG_IMAGE.url],
    },
  };
}

export function buildTripMetadata(tripKey: string, locale: Lang): Metadata | null {
  const trip = tripsData[tripKey];
  if (!trip) return null;
  const data = trip.i18n[locale];
  if (!data) return null;
  const alternates = buildTripAlternates(tripKey, locale);
  return {
    title: data.title,
    description: data.description,
    alternates,
    ...(locale === "bg" ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: data.title,
      description: data.description,
      url: alternates.canonical,
      siteName: "Maximov Tours",
      locale: toOgLocale(locale),
      alternateLocale: LOCALES.filter((l) => l !== locale).map(toOgLocale),
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
      images: [OG_IMAGE.url],
    },
  };
}

const PREFIXED_LOCALES: ReadonlyArray<string> = ["ua", "en", "bg"];

export function mapPathToLocale(pathname: string, nextLocale: Lang): string {
  const segments = (pathname || "/").split("/").filter(Boolean);
  const first = (segments[0] ?? "").toLowerCase();
  const hadPrefix = PREFIXED_LOCALES.includes(first);
  const tail = hadPrefix ? segments.slice(1) : segments;

  if (tail.length === 1) {
    const slug = tail[0];
    const currentLocale = (hadPrefix ? (first as Lang) : DEFAULT_LOCALE);
    for (const trip of Object.values(tripsData)) {
      if (trip.i18n[currentLocale]?.slug === slug) {
        const nextSlug = trip.i18n[nextLocale]?.slug;
        if (nextSlug) {
          return buildPath(nextLocale, `/${nextSlug}`);
        }
        break;
      }
    }
  }

  const tailPath = tail.length ? `/${tail.join("/")}` : "/";
  return buildPath(nextLocale, tailPath);
}
