import type { MetadataRoute } from "next";

const SITE_URL = "https://maximovtours.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: {
          ru: `${SITE_URL}/ru/`,
          en: `${SITE_URL}/en/`,
          uk: `${SITE_URL}/uk/`,
          bg: `${SITE_URL}/bg/`,
        },
      },
    },
    {
      url: `${SITE_URL}/booking`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
