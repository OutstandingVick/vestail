/**
 * One place for the facts every page's metadata repeats.
 *
 * The canonical host is www. The apex 308-redirects to it, so a canonical tag
 * pointing at the apex would name a URL that does not serve the page — which
 * is the sort of thing that quietly splits a site's ranking signals in two.
 */
export const SITE_URL = "https://www.vestail.fun";

export const SITE_NAME = "Vestail";

/** The question the product answers, in one line, for search results. */
export const SITE_DESCRIPTION =
  "See what you're allowed to own where you live — stocks, land, gold, bonds and more — " +
  "for citizens and foreigners, with the conditions spelled out and where to buy it.";

/** Shorter copy written for link cards, where the first line does the selling. */
export const SOCIAL_TITLE = "Know what you can own before you buy";

export const SOCIAL_DESCRIPTION =
  "Country-aware ownership answers for tokenized stocks, property, gold and more — with verdicts, conditions and sources.";

export const SOCIAL = {
  x: "https://x.com/usevestail",
  github: "https://github.com/OutstandingVick/vestail",
};

/** An absolute URL for a path, for canonicals and Open Graph. */
export const absolute = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/$/, "") || SITE_URL;
