export type MarketingPageSection = {
  title: string;
  body: string;
  items?: string[];
};

export type MarketingPage = {
  section: "Explore" | "Countries" | "Company";
  title: string;
  summary: string;
  sections: MarketingPageSection[];
};

export const MARKETING_PAGES: Record<string, MarketingPage> = {};

export const marketingPageKey = (section: string, slug: string) => `${section}/${slug}`;
