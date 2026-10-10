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

export const MARKETING_PAGES: Record<string, MarketingPage> = {
  "explore/search": {
    section: "Explore",
    title: "Search anything",
    summary: "Start with an asset, company, commodity or everyday phrase. Vestail resolves what you mean before checking the ownership rule.",
    sections: [
      { title: "What you can search", body: "Use a familiar name such as Tesla, gold, farmland or a house. Vestail maps the phrase to the relevant asset class and shows the path it followed." },
      { title: "What comes back", body: "Results separate direct ownership, conditional access and restrictions for the country and buyer type you declare.", items: ["A visible ownership verdict", "The rule and its source", "A route to buy only when one is appropriate"] },
    ],
  },
};

export const marketingPageKey = (section: string, slug: string) => `${section}/${slug}`;
