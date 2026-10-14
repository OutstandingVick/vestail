import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * What crawlers may read.
 *
 * /app is behind sign-in and every page under it is personal — a portfolio, a
 * watchlist, someone's settings. /api answers machines, not readers. Neither
 * belongs in an index, and disallowing them keeps a crawler's budget on the
 * pages that are meant to be found.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/app/", "/api/", "/admin", "/admin/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
