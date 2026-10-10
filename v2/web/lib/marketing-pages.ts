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
  "explore/trending": {
    section: "Explore",
    title: "Trending assets",
    summary: "See the assets people are checking most often without treating attention as a recommendation.",
    sections: [
      { title: "Interest is not eligibility", body: "A popular asset may still be conditional or restricted for you. Vestail keeps the ownership verdict beside the trend instead of implying that popularity means access." },
      { title: "How to use this view", body: "Use trends to discover questions worth checking, then confirm the rule for your declared country and buyer type before taking action.", items: ["Compare asset classes", "Open the country rule", "Review the source and verification date"] },
    ],
  },
  "explore/questions": {
    section: "Explore",
    title: "Popular ownership questions",
    summary: "Clear answers to the questions that usually appear after a price screen has already made an asset look available.",
    sections: [
      { title: "Can I buy it and can I own it?", body: "Those are different questions. A venue may display a product even when the underlying ownership, redemption or transfer rule places conditions on you." },
      { title: "Why can two versions differ?", body: "Tokens and wrappers with the same ticker can represent different legal claims, issuers and redemption rights.", items: ["Check the issuer", "Check the instrument type", "Check what happens at exit"] },
      { title: "What does conditional mean?", body: "The asset is not simply open or closed. A licence, cap, approval, account type or identity check may apply." },
    ],
  },
};

export const marketingPageKey = (section: string, slug: string) => `${section}/${slug}`;
