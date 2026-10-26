import type { Metadata } from "next";
import { notFound } from "next/navigation";

import About from "@/components/About";
import RouteFirstScreen from "@/components/hero/RouteFirstScreen";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import DepartureDays from "@/components/seo/DepartureDays";
import FullText from "@/components/seo/FullText";
import LeadText from "@/components/seo/LeadText";
import RelatedTrips from "@/components/seo/RelatedTrips";
import type { Lang } from "@/lib/locale";
import { departureDaysText } from "@/lib/departureDays";
import { buildBusTripLD, buildHubTouristTripLD } from "@/lib/jsonld";
import { buildTripMetadata, isLocale } from "@/lib/seo";
import {
  buildHubStopLinks,
  findTripByLocaleSlug,
  getAllStaticParams,
} from "@/lib/tripsData";
import { fetchSelectedPricelist, fetchSelectedRoute } from "@/lib/serverData";

type Params = { locale: string; trip: string };

// Ревалидация задана на уровне страницы, а не на fetch: /selected_route и
// /selected_pricelist — POST-запросы, а Data Cache в Next кэширует только GET,
// и опция next.revalidate на самом фетче была бы молча проигнорирована.
export const revalidate = 600;

export function generateStaticParams() {
  return getAllStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, trip } = await params;
  if (!isLocale(locale)) return {};
  const match = findTripByLocaleSlug(locale, trip);
  if (!match) return {};
  return buildTripMetadata(match.key, locale) ?? {};
}

export default async function TripPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, trip } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Lang;
  const match = findTripByLocaleSlug(lang, trip);
  if (!match) notFound();
  const { key, trip: tripDef } = match;
  const data = tripDef.i18n[lang];
  if (!data) notFound();
  const isHub = key === "route";
  const hubLinks = isHub ? buildHubStopLinks(lang) : undefined;
  const tripLd = isHub ? buildHubTouristTripLD(lang) : buildBusTripLD(key, lang);
  const departureDays = departureDaysText(key, lang);

  const [routesData, prices] = await Promise.all([
    fetchSelectedRoute(lang),
    fetchSelectedPricelist(lang),
  ]);

  return (
    <main className="min-h-screen">
      {tripLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(tripLd) }}
        />
      )}
      <RouteFirstScreen
        lang={lang}
        title={data.h1}
        subtitle={data.heroSubtitle}
        fromId={isHub ? undefined : tripDef.fromStopId}
        toId={isHub ? undefined : tripDef.toStopId}
      />
      <LeadText text={data.leadText} />
      <About />
      <FullText text={data.fullText} />
      <DepartureDays text={departureDays} />
      <Routes lang={lang} hubLinks={hubLinks} initialData={routesData} />
      <Schedule lang={lang} initialPrices={prices} />
      <RelatedTrips
        currentKey={key}
        locale={lang}
        reverseKey={tripDef.reverseKey}
        relatedKeys={tripDef.related ?? []}
      />
    </main>
  );
}
