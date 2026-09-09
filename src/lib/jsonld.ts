import type { Lang } from "@/lib/locale";
import { SITE_URL, buildUrl } from "@/lib/seo";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/locale";
import { tripsData } from "@/lib/tripsData";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;

const ORG_SAME_AS = [
  "https://www.facebook.com/maximovturs/",
  "https://www.instagram.com/maximov_turs/",
];

const ORG_TELEPHONES = ["+380930004636", "+359879554559"];

const ORG_NAME_BY_LOCALE: Record<Lang, string> = {
  ru: "Максимов Турс",
  ua: "Максимов Турс",
  bg: "Максимов Турс",
  en: "Maximov Tours",
};

const ORG_DESCRIPTION_BY_LOCALE: Record<Lang, string> = {
  ru: "Международный автобусный перевозчик между Украиной и Болгарией с 1992 года. Прямые рейсы Одесса – Варна – Бургас.",
  ua: "Міжнародний автобусний перевізник між Україною та Болгарією з 1992 року. Прямі рейси Одеса – Варна – Бургас.",
  bg: "Международен автобусен превозвач между Украйна и България от 1992 г. Директни курсове Одеса – Варна – Бургас.",
  en: "International bus carrier between Ukraine and Bulgaria since 1992. Direct routes Odessa – Varna – Burgas on comfortable coaches.",
};

type StopInfo = {
  name: Record<Lang, string>;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressCountry: string;
  };
  geo?: { latitude: number; longitude: number };
};

const STOPS: Record<string, StopInfo> = {
  odessa: {
    name: { ru: "Автовокзал «Привоз», Одесса", ua: "Автовокзал «Привоз», Одеса", en: "Privoz Bus Station, Odessa", bg: "Автогара „Привоз“, Одеса" },
    address: { streetAddress: "Privoznaya St 14", addressLocality: "Odessa", addressCountry: "UA" },
    geo: { latitude: 46.4747, longitude: 30.7330 },
  },
  bolgrad: {
    name: { ru: "Автостанция Болград", ua: "Автостанція Болград", en: "Bolgrad Bus Station", bg: "Автогара Болград" },
    address: { addressLocality: "Bolgrad", addressCountry: "UA" },
    geo: { latitude: 45.6794, longitude: 28.6147 },
  },
  constanta: {
    name: { ru: "Автовокзал Констанца", ua: "Автовокзал Констанца", en: "Constanța Bus Station", bg: "Автогара Констанца" },
    address: { addressLocality: "Constanța", addressCountry: "RO" },
    geo: { latitude: 44.1733, longitude: 28.6383 },
  },
  varna: {
    name: { ru: "Центральная автостанция, Варна", ua: "Центральна автостанція, Варна", en: "Central Bus Station, Varna", bg: "Централна автогара Варна" },
    address: { streetAddress: "Vladislav Varnenchik Blvd 158", addressLocality: "Varna", addressCountry: "BG" },
    geo: { latitude: 43.2237, longitude: 27.9097 },
  },
  "sunny-beach": {
    name: { ru: "Автостанция Солнечный берег", ua: "Автостанція Сонячний берег", en: "Sunny Beach Bus Station", bg: "Автогара Слънчев бряг" },
    address: { addressLocality: "Sunny Beach", addressCountry: "BG" },
    geo: { latitude: 42.6877, longitude: 27.7136 },
  },
  burgas: {
    name: { ru: "Автостанция «Юг», Бургас", ua: "Автостанція «Південь», Бургас", en: "Yug Bus Station, Burgas", bg: "Автогара „Юг“, Бургас" },
    address: { streetAddress: "Aleksandrovska St 22", addressLocality: "Burgas", addressCountry: "BG" },
    geo: { latitude: 42.4943, longitude: 27.4719 },
  },
};

const HEAD_OFFICE_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Privoznaya St 14",
  addressLocality: "Odessa",
  postalCode: "65000",
  addressCountry: "UA",
};

const HEAD_OFFICE_GEO = {
  "@type": "GeoCoordinates",
  latitude: 46.4747,
  longitude: 30.7330,
};

const OFFICE_LOGO = `${SITE_URL}/icons/logo.svg`;
const OFFICE_IMAGE = `${SITE_URL}/og-image.jpg`;

function busStopLD(stopKey: string, locale: Lang) {
  const stop = STOPS[stopKey];
  if (!stop) return null;
  const node: Record<string, unknown> = {
    "@type": "BusStation",
    name: stop.name[locale] ?? stop.name[DEFAULT_LOCALE],
    address: {
      "@type": "PostalAddress",
      ...(stop.address.streetAddress ? { streetAddress: stop.address.streetAddress } : {}),
      addressLocality: stop.address.addressLocality,
      addressCountry: stop.address.addressCountry,
    },
  };
  if (stop.geo) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: stop.geo.latitude,
      longitude: stop.geo.longitude,
    };
  }
  return node;
}

// Единственное определение узла организации. Все страницы берут имя, url и @id
// отсюда: на главной — целиком, на остальных 52 — сокращённой ссылкой
// (buildOrganizationRefLD). Литералы не дублируются, поэтому правка телефона
// или названия не может развести копии.
function organizationNode(locale: Lang) {
  const sameAsLanguages = LOCALES.filter((l) => l !== locale).map((l) => buildUrl(l, "/"));

  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: ORG_NAME_BY_LOCALE[locale],
    alternateName: "Maximov Tours",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: OFFICE_LOGO,
    },
    image: OFFICE_IMAGE,
    description: ORG_DESCRIPTION_BY_LOCALE[locale],
    foundingDate: "1992",
    email: "avroraiko@gmail.com",
    telephone: ORG_TELEPHONES,
    address: HEAD_OFFICE_ADDRESS,
    sameAs: [...ORG_SAME_AS, ...sameAsLanguages],
    contactPoint: ORG_TELEPHONES.map((phone) => ({
      "@type": "ContactPoint",
      telephone: phone,
      contactType: "customer service",
      availableLanguage: ["ru", "uk", "en", "bg"],
    })),
  };
}

// Сокращённый узел организации для страниц, где полное определение не нужно:
// он лишь разрешает ссылку provider: { "@id": ORGANIZATION_ID } в пределах той
// же страницы — Google резолвит @id только внутри одного документа.
export function buildOrganizationRefLD(locale: Lang) {
  const org = organizationNode(locale);
  return {
    "@type": org["@type"],
    "@id": org["@id"],
    name: org.name,
    url: org.url,
  };
}

export function buildOrganizationLD(locale: Lang) {
  const homeUrl = buildUrl(locale, "/");

  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(locale),
      {
        "@type": "LocalBusiness",
        "@id": LOCAL_BUSINESS_ID,
        name: ORG_NAME_BY_LOCALE[locale],
        url: homeUrl,
        image: OFFICE_IMAGE,
        logo: OFFICE_LOGO,
        description: ORG_DESCRIPTION_BY_LOCALE[locale],
        telephone: ORG_TELEPHONES,
        email: "avroraiko@gmail.com",
        priceRange: "$$",
        address: HEAD_OFFICE_ADDRESS,
        geo: HEAD_OFFICE_GEO,
        areaServed: [
          { "@type": "Country", name: "Ukraine" },
          { "@type": "Country", name: "Romania" },
          { "@type": "Country", name: "Bulgaria" },
        ],
        sameAs: ORG_SAME_AS,
        parentOrganization: { "@id": ORGANIZATION_ID },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.4",
          reviewCount: "21",
        },
      },
    ],
  };
}

function tripUrl(tripKey: string, locale: Lang): string | null {
  const trip = tripsData[tripKey];
  if (!trip) return null;
  const slug = trip.i18n[locale]?.slug ?? trip.i18n[DEFAULT_LOCALE]?.slug;
  if (!slug) return null;
  return buildUrl(locale, `/${slug}`);
}

function tripPriceForKey(tripKey: string): { price: number; currency: string } {
  const map: Record<string, { price: number; currency: string }> = {
    "odessa-varna": { price: 2300, currency: "UAH" },
    "varna-odessa": { price: 2300, currency: "UAH" },
    "odessa-burgas": { price: 2600, currency: "UAH" },
    "burgas-odessa": { price: 2600, currency: "UAH" },
    "odessa-sunny-beach": { price: 2500, currency: "UAH" },
    "sunny-beach-odessa": { price: 2500, currency: "UAH" },
    "odessa-constanta": { price: 1500, currency: "UAH" },
    "constanta-odessa": { price: 1500, currency: "UAH" },
    "constanta-varna": { price: 40, currency: "EUR" },
    "varna-constanta": { price: 40, currency: "EUR" },
    "constanta-burgas": { price: 50, currency: "EUR" },
    "burgas-constanta": { price: 50, currency: "EUR" },
  };
  return map[tripKey] ?? { price: 2300, currency: "UAH" };
}

function busTripNode(tripKey: string, locale: Lang) {
  const trip = tripsData[tripKey];
  if (!trip) return null;
  const data = trip.i18n[locale];
  if (!data) return null;
  const departureStop = busStopLD(trip.fromSlug, locale);
  const arrivalStop = busStopLD(trip.toSlug, locale);
  const { price, currency } = tripPriceForKey(tripKey);
  const url = tripUrl(tripKey, locale);

  const offerNode = {
    "@type": "Offer",
    price: String(price),
    priceCurrency: currency,
    availability: "https://schema.org/InStock",
    ...(url ? { url } : {}),
  };

  return {
    "@type": "BusTrip",
    name: data.title,
    description: data.description,
    ...(url ? { url } : {}),
    provider: { "@id": ORGANIZATION_ID },
    ...(departureStop ? { departureBusStop: departureStop } : {}),
    ...(arrivalStop ? { arrivalBusStop: arrivalStop } : {}),
    offers: offerNode,
  };
}

export function buildBusTripLD(tripKey: string, locale: Lang) {
  const busTrip = busTripNode(tripKey, locale);
  if (!busTrip) return null;

  return {
    "@context": "https://schema.org",
    "@graph": [busTrip, buildOrganizationRefLD(locale)],
  };
}

const HUB_TRIP_KEYS = [
  "odessa-varna",
  "odessa-burgas",
  "odessa-sunny-beach",
  "odessa-constanta",
  "varna-odessa",
  "burgas-odessa",
  "sunny-beach-odessa",
  "constanta-odessa",
];

export function buildHubTouristTripLD(locale: Lang) {
  const trip = tripsData.route;
  if (!trip) return null;
  const data = trip.i18n[locale];
  if (!data) return null;
  const hubUrl = tripUrl("route", locale);

  const itemList = {
    "@type": "ItemList",
    name: data.h1,
    numberOfItems: HUB_TRIP_KEYS.length,
    itemListElement: HUB_TRIP_KEYS.map((tripKey, index) => {
      const busTrip = busTripNode(tripKey, locale);
      if (!busTrip) return null;
      return {
        "@type": "ListItem",
        position: index + 1,
        item: { "@context": "https://schema.org", ...busTrip },
      };
    }).filter(Boolean),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristTrip",
        name: data.title,
        description: data.description,
        ...(hubUrl ? { url: hubUrl } : {}),
        provider: { "@id": ORGANIZATION_ID },
        touristType: ["Bus travel", "International coach"],
        itinerary: {
          "@type": "ItemList",
          itemListElement: [
            "Odessa",
            "Bolgrad",
            "Constanța",
            "Varna",
            "Sunny Beach",
            "Burgas",
          ].map((name, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: { "@type": "City", name },
          })),
        },
      },
      itemList,
      buildOrganizationRefLD(locale),
    ],
  };
}
