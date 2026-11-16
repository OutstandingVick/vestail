import type { MetadataRoute } from "next";

import { MARKETING_PAGES } from "@/lib/marketing-pages";
import { absolute } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absolute("/explore"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absolute("/countries"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absolute("/company"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
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
