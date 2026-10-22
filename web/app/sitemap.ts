import type { MetadataRoute } from "next";

import { MARKETING_PAGES } from "@/lib/marketing-pages";
import { absolute } from "@/lib/seo";

/**
 * Every page a reader is meant to find.
 *
 * Deliberately absent: anything under /app or /admin, which robots.ts also
 * disallows, and /early-access, which calls notFound() in production. Listing a
 * page that answers 404 teaches a crawler the sitemap cannot be trusted, which
 * costs more than the missing entry.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absolute("/company/methodology"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absolute("/docs"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absolute("/testers"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absolute("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absolute("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absolute("/cookies"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const marketing: MetadataRoute.Sitemap = Object.keys(MARKETING_PAGES).map(key => ({
    url: absolute(`/${key}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...fixed, ...marketing];
}
