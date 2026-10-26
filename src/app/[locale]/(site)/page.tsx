import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import About from "@/components/About";
import HomeFirstScreen, { type PopularRoute } from "@/components/hero/HomeFirstScreen";
import PurchaseReturnView from "@/components/home/PurchaseReturnView";
import ParcelSection from "@/components/ParcelSection";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import { buildHomeMetadata, buildPath, isLocale } from "@/lib/seo";
import { tripsData } from "@/lib/tripsData";
import { firstScreenTranslations } from "@/translations/firstScreen";
import { buildOrganizationLD } from "@/lib/jsonld";
import type { Lang } from "@/lib/locale";
import { fetchSelectedPricelist, fetchSelectedRoute } from "@/lib/serverData";

type Params = { locale: string };

// Популярные направления на первом экране главной.
const POPULAR_ROUTE_KEYS = ["odessa-varna", "odessa-sunny-beach", "odessa-burgas", "varna-odessa"];

function buildPopularRoutes(lang: Lang): PopularRoute[] {
  const labels = firstScreenTranslations[lang].popularLabels;
  return POPULAR_ROUTE_KEYS.flatMap((key) => {
    const trip = tripsData[key];
    const data = trip?.i18n[lang];
    if (!trip || !data || !trip.fromStopId || !trip.toStopId) return [];
    return [
      {
        key,
        href: buildPath(lang, `/${data.slug}`),
        label: labels[key] ?? data.h1,
        fromId: trip.fromStopId,
        toId: trip.toStopId,
      },
    ];
  });
}

// Ревалидация задана на уровне страницы, а не на fetch: /selected_route и
// /selected_pricelist — POST-запросы, а Data Cache в Next кэширует только GET,
// и опция next.revalidate на самом фетче была бы молча проигнорирована.
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildHomeMetadata(locale);
}

export default async function HomePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Lang;
  const organizationLd = buildOrganizationLD(lang);

  const [routesData, prices] = await Promise.all([
    fetchSelectedRoute(lang),
    fetchSelectedPricelist(lang),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      {/* Оверлей возврата с оплаты читает query-параметры на клиенте
          (useSearchParams). Suspense здесь нужен именно для CSR-bailout:
          без него prerender падает, с ним страница остаётся статической,
          а в SSR-разметку не попадает ничего пользовательского. */}
      <Suspense fallback={null}>
        <PurchaseReturnView />
      </Suspense>
      <main className="min-h-screen">
        <HomeFirstScreen lang={lang} routes={buildPopularRoutes(lang)} />
        <About />
        <ParcelSection />
        <Routes lang={lang} initialData={routesData} />
        <Schedule lang={lang} initialPrices={prices} />
      </main>
    </>
  );
}
