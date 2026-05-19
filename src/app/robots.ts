import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/cabinet",
          "/cabinet/",
          "/purchase/",
          "/ticket/",
          "/q/",
          "/booking",
          "/booking/",
          "/return",
          "/return/",
          "/*/cabinet",
          "/*/cabinet/",
          "/*/purchase/",
          "/*/ticket/",
          "/*/q/",
          "/*/booking",
          "/*/booking/",
          "/*/return",
          "/*/return/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
