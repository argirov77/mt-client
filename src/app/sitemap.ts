import type { MetadataRoute } from "next";

import {
  DEFAULT_LOCALE,
  LOCALES,
  buildUrl,
  toHreflang,
} from "@/lib/seo";
import { tripsData } from "@/lib/tripsData";
import type { Lang } from "@/lib/locale";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  const homeLanguages: Record<string, string> = {};
  for (const locale of LOCALES) {
    homeLanguages[toHreflang(locale)] = buildUrl(locale, "/");
  }
  homeLanguages["x-default"] = buildUrl(DEFAULT_LOCALE, "/");

  for (const locale of LOCALES) {
    entries.push({
      url: buildUrl(locale, "/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: { languages: homeLanguages },
    });
  }

  for (const [key, trip] of Object.entries(tripsData)) {
    const tripLanguages: Record<string, string> = {};
    for (const locale of LOCALES) {
      const slug = trip.i18n[locale]?.slug;
      if (slug) tripLanguages[toHreflang(locale)] = buildUrl(locale, `/${slug}`);
    }
    const defaultSlug = trip.i18n[DEFAULT_LOCALE]?.slug;
    if (defaultSlug) tripLanguages["x-default"] = buildUrl(DEFAULT_LOCALE, `/${defaultSlug}`);

    const priority = key === "route" ? 0.9 : key.startsWith("odessa-") ? 0.9 : 0.7;

    for (const locale of LOCALES) {
      const slug = trip.i18n[locale as Lang]?.slug;
      if (!slug) continue;
      entries.push({
        url: buildUrl(locale, `/${slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority,
        alternates: { languages: tripLanguages },
      });
    }
  }

  return entries;
}
