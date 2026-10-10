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
  "explore/compare": {
    section: "Explore",
    title: "Compare ownership access",
    summary: "Compare the same asset across countries and buyer types without collapsing conditional rules into a yes-or-no answer.",
    sections: [
      { title: "Compare like with like", body: "Choose one asset and keep the buyer type explicit. Vestail then shows where the rule is open, conditional or restrictive." },
      { title: "Read the middle carefully", body: "Conditional access carries the detail that simple comparison tools usually lose.", items: ["Foreign ownership caps", "Licences and approvals", "Product or issuer restrictions", "Exit and redemption gates"] },
    ],
  },
  "explore/all": {
    section: "Explore",
    title: "Explore Vestail",
    summary: "Browse the full ownership map: countries, asset classes, onchain versions and price-exposure markets.",
    sections: [
      { title: "Ownership rules", body: "Check twenty asset classes for citizens and foreigners across the countries Vestail currently covers." },
      { title: "Onchain versions", body: "Compare tokenized versions by chain, issuer and legal instrument rather than ticker alone." },
      { title: "Price exposure", body: "Commodity perpetuals are labelled as exposure, not ownership, so the product is never confused with holding the underlying asset." },
    ],
  },
  "countries/supported": {
    section: "Countries",
    title: "All supported countries",
    summary: "Vestail currently maps ownership rules across twelve countries, with the same three-verdict model in every market.",
    sections: [
      { title: "Current coverage", body: "Each country includes citizen and foreigner views across the same twenty asset classes.", items: ["Brazil", "China", "Germany", "India", "Japan", "Nigeria", "Saudi Arabia", "South Africa", "South Korea", "United Arab Emirates", "United Kingdom", "United States"] },
      { title: "What supported means", body: "A supported country has structured rules, sources and verification dates. It does not mean every asset or product is available there." },
    ],
  },
  "countries/overview": {
    section: "Countries",
    title: "Country overview pages",
    summary: "Understand a market before opening an individual asset rule.",
    sections: [
      { title: "One country, one consistent view", body: "Country overviews group the current buyer profiles, asset verdicts and common conditions in one place." },
      { title: "From overview to evidence", body: "Open any asset to move from the summary verdict to the specific rule, source and last-verified date.", items: ["Citizen view", "Foreigner view", "Asset-by-asset matrix", "Source provenance"] },
    ],
  },
  "countries/citizen-rules": {
    section: "Countries",
    title: "Citizen rules",
    summary: "Check what a citizen can own in their own country and which conditions still apply.",
    sections: [
      { title: "Citizenship does not remove every gate", body: "Licences, sector rules, product eligibility and account requirements can still make an asset conditional." },
      { title: "How Vestail presents the answer", body: "Every asset stays inside the same three verdicts.", items: ["Can own: no further ownership gate found", "Conditional: a named requirement applies", "Cannot own: the rule excludes this buyer type"] },
    ],
  },
  "countries/foreigner-rules": {
    section: "Countries",
    title: "Foreigner rules",
    summary: "See where non-citizens can own an asset, where limits apply and where the route stops.",
    sections: [
      { title: "Foreign access varies by asset", body: "Property, strategic sectors, licences and locally issued products often treat foreign buyers differently from citizens." },
      { title: "The condition is part of the answer", body: "Vestail names the restriction instead of presenting a misleading buy button.", items: ["Ownership caps", "Approval requirements", "Local entities or accounts", "Issuer-specific exclusions"] },
    ],
  },
};

export const marketingPageKey = (section: string, slug: string) => `${section}/${slug}`;
