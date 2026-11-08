// The canonical host includes www because the apex redirects here.
export const SITE_URL = "https://www.vestail.fun";

export const SITE_NAME = "Vestail";

export const SITE_DESCRIPTION =
  "See what you're allowed to own where you live — stocks, land, gold, bonds and more — " +
  "for citizens and foreigners, with the conditions spelled out and where to buy it.";

export const SOCIAL_TITLE = "Know what you can own before you buy";

export const SOCIAL_DESCRIPTION =
  "Country-aware ownership answers for tokenized stocks, property, gold and more — with verdicts, conditions and sources.";

export const SOCIAL = {
  x: "https://x.com/usevestail",
  github: "https://github.com/OutstandingVick/vestail",
};

export const absolute = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/$/, "") || SITE_URL;
