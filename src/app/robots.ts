import type { MetadataRoute } from "next";

const SITE_URL = "https://maximovtours.com";

const ALLOWED_AGENTS = [
  "*",
  "GPTBot",
  "ChatGPT-User",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: ALLOWED_AGENTS.map((userAgent) => ({
      userAgent,
      allow: "/",
    })),
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
