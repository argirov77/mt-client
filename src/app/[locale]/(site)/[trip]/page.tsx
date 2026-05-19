import type { Metadata } from "next";
import { notFound } from "next/navigation";

import About from "@/components/About";
import HeroSection from "@/components/hero/HeroSection";
import BookingSection from "@/components/home/BookingSection";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import FullText from "@/components/seo/FullText";
import LeadText from "@/components/seo/LeadText";
import RelatedTrips from "@/components/seo/RelatedTrips";
import type { Lang } from "@/lib/locale";
import { buildTripMetadata, isLocale } from "@/lib/seo";
import {
  buildHubStopLinks,
  findTripByLocaleSlug,
  getAllStaticParams,
} from "@/lib/tripsData";

type Params = { locale: string; trip: string };

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

  return (
    <main className="min-h-screen">
      <HeroSection
        lang={lang}
        heroTitle={data.h1}
        heroSubtitle={data.heroSubtitle}
      />
      <LeadText text={data.leadText} />
      <BookingSection
        lang={lang}
        forcedFromId={isHub ? undefined : tripDef.fromStopId}
        forcedToId={isHub ? undefined : tripDef.toStopId}
      />
      <About />
      <FullText text={data.fullText} />
      <Routes lang={lang} hubLinks={hubLinks} />
      <Schedule lang={lang} />
      <RelatedTrips
        currentKey={key}
        locale={lang}
        reverseKey={tripDef.reverseKey}
        relatedKeys={tripDef.related ?? []}
      />
    </main>
  );
}
