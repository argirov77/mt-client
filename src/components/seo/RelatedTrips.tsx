import Link from "next/link";

import type { Lang } from "@/lib/locale";
import { buildPath } from "@/lib/seo";
import { tripsData } from "@/lib/tripsData";
import { tripPageTranslations } from "@/translations/home";

type Props = {
  currentKey: string;
  locale: Lang;
  reverseKey?: string;
  relatedKeys?: string[];
};

type TripLink = { href: string; label: string };

function buildTripLink(key: string, locale: Lang): TripLink | null {
  const trip = tripsData[key];
  if (!trip) return null;
  const data = trip.i18n[locale];
  if (!data) return null;
  return {
    href: buildPath(locale, `/${data.slug}`),
    label: data.h1,
  };
}

export default function RelatedTrips({
  currentKey,
  locale,
  reverseKey,
  relatedKeys = [],
}: Props) {
  const t = tripPageTranslations[locale];

  const reverse = reverseKey && reverseKey !== currentKey ? buildTripLink(reverseKey, locale) : null;
  const hub = currentKey === "route" ? null : buildTripLink("route", locale);
  const related = relatedKeys
    .filter((k) => k !== currentKey)
    .map((k) => buildTripLink(k, locale))
    .filter((link): link is TripLink => link !== null)
    .slice(0, 3);

  if (!reverse && !hub && related.length === 0) return null;

  return (
    <section className="bg-[#f6f4f1] py-12">
      <div className="mx-auto w-full max-w-5xl px-4">
        <h2 className="mb-6 text-2xl font-semibold text-[#173452]">{t.blockTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reverse ? (
            <Link
              href={reverse.href}
              className="group flex flex-col gap-1 rounded-2xl border border-[#e3dfd9] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c2410c]">
                {t.reverseLabel}
              </span>
              <span className="text-base font-semibold text-[#173452] group-hover:text-[#c2410c]">
                {reverse.label}
              </span>
            </Link>
          ) : null}
          {hub ? (
            <Link
              href={hub.href}
              className="group flex flex-col gap-1 rounded-2xl border border-[#e3dfd9] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c2410c]">
                {t.hubLabel}
              </span>
              <span className="text-base font-semibold text-[#173452] group-hover:text-[#c2410c]">
                {hub.label}
              </span>
            </Link>
          ) : null}
          {related.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-1 rounded-2xl border border-[#e3dfd9] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c929c]">
                {t.relatedLabel}
              </span>
              <span className="text-base font-semibold text-[#173452] group-hover:text-[#c2410c]">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
