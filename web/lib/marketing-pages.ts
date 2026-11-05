export type MarketingPageSection = {
  title: string;
  body: string;
  items?: Array<string | { label: string; href: string }>;
};

export type MarketingShowcaseGroup = {
  title: string;
  description: string;
  entries: Array<{
    name: string;
    symbol: string;
    detail: string;
    tags: string[];
  }>;
};

export type MarketingPage = {
  section: "Explore" | "Countries" | "Company";
  title: string;
  summary: string;
  sections: MarketingPageSection[];
  showcases?: MarketingShowcaseGroup[];
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
  "countries/supported": {
    section: "Countries",
    title: "All supported countries",
    summary: "Vestail currently maps ownership rules across twelve countries, with the same three-verdict model in every market.",
    sections: [
      { title: "Current coverage", body: "Each country includes citizen and foreigner views across the same twenty asset classes.", items: ["Brazil", "China", "Germany", "India", "Japan", "Nigeria", "Saudi Arabia", "South Africa", "South Korea", "United Arab Emirates", "United Kingdom", "United States"] },
      { title: "What supported means", body: "A supported country has structured rules, sources and verification dates. It does not mean every asset or product is available there." },
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
  "countries/access-matrix": {
    section: "Countries",
    title: "Country-by-country access matrix",
    summary: "Scan the same asset classes across countries while keeping buyer type and verdict meaning consistent.",
    sections: [
      { title: "Built for comparison", body: "The matrix holds the asset constant and changes the jurisdiction, making differences visible without hiding conditional access." },
      { title: "Read beyond the colour", body: "Open a cell for the text of the condition and its evidence.", items: ["Country and buyer type", "Ownership verdict", "Rule explanation", "Source and verification date"] },
    ],
  },
  "company/about": {
    section: "Company",
    title: "About Vestail",
    summary: "Vestail makes ownership rules legible before a person commits money to an asset or financial product.",
    sections: [
      { title: "The problem", body: "Most platforms show price and availability first. The ownership rule, product structure and exit conditions are scattered elsewhere." },
      { title: "The Vestail approach", body: "Resolve the asset, check the declared buyer profile, show one of three verdicts and reveal the evidence behind it." },
      { title: "Rules before routing", body: "A purchase path follows the ownership verdict; it never replaces it." },
      { title: "What makes Vestail different", body: "Vestail preserves can own, conditional, cannot own and not assessed as distinct outcomes. Sources stay visible, and commercial routing never changes the verdict.", items: ["Declare the buyer profile", "Name the condition", "Show the source", "Stop restricted routes"] },
    ],
  },
  "company/partners": {
    section: "Company",
    title: "Companies & chains",
    summary: "Explore the companies, funds and networks represented by assets in Vestail's current catalogue.",
    showcases: [
      {
        title: "Token issuers and providers",
        description: "The companies behind the tokenized versions Vestail currently maps. Inclusion describes product coverage, not a formal partnership or endorsement.",
        entries: [
          { name: "xStocks by Backed Finance", symbol: "XSTOCKS", detail: "Collateral-backed tracker certificates for public equities, funds and SpaceX", tags: ["Solana"] },
          { name: "Ondo Global Markets", symbol: "ONDO", detail: "Total-return notes linked to public equities, funds and SpaceX", tags: ["Solana"] },
          { name: "Backpack Securities", symbol: "BACKPACK", detail: "Security-entitlement exposure to SpaceX", tags: ["Solana"] },
          { name: "Tessera", symbol: "TESSERA", detail: "Loan-participation tokens linked to private companies", tags: ["Solana"] },
          { name: "PreStocks", symbol: "PRESTOCKS", detail: "SPV-based economic exposure to private companies", tags: ["Solana"] },
          { name: "Robinhood", symbol: "ROBINHOOD", detail: "Tokenized debt linked to NVIDIA and Tesla", tags: ["Robinhood Chain"] },
          { name: "Coinbase", symbol: "COINBASE", detail: "A tokenized share claim linked to NVIDIA", tags: ["Base"] },
        ],
      },
      {
        title: "Companies and funds",
        description: "Examples of public-company tokens, private-market exposure and fund-linked instruments mapped by Vestail.",
        entries: [
          { name: "NVIDIA", symbol: "NVDA", detail: "Public equity", tags: ["Solana", "Base", "Robinhood Chain"] },
          { name: "Tesla", symbol: "TSLA", detail: "Public equity", tags: ["Solana", "Robinhood Chain"] },
          { name: "Apple", symbol: "AAPL", detail: "Public equity", tags: ["Solana"] },
          { name: "Microsoft", symbol: "MSFT", detail: "Public equity", tags: ["Solana"] },
          { name: "Alphabet", symbol: "GOOGL", detail: "Public equity", tags: ["Solana"] },
          { name: "Amazon", symbol: "AMZN", detail: "Public equity", tags: ["Solana"] },
          { name: "SpaceX", symbol: "SPCX", detail: "Private-market exposure", tags: ["Solana"] },
          { name: "OpenAI", symbol: "OPENAI", detail: "Private-market exposure", tags: ["Solana"] },
          { name: "Kalshi", symbol: "KALSHI", detail: "Private-market exposure", tags: ["Solana"] },
          { name: "S&P 500 ETF", symbol: "SPY", detail: "Fund-linked instrument", tags: ["Solana"] },
          { name: "Nasdaq-100 ETF", symbol: "QQQ", detail: "Fund-linked instrument", tags: ["Solana"] },
        ],
      },
    ],
    sections: [
      { title: "Availability follows the rule", body: "A listed asset is part of Vestail's coverage, not a promise that every user can buy it. Your country, buyer type and the issuer's own restrictions still determine the verdict." },
      { title: "Coverage is not endorsement", body: "Company and network names identify the underlying asset or route. They do not imply sponsorship, affiliation or a formal partnership with Vestail.", items: ["No custody by Vestail", "No paid change to a verdict", "No route for cannot-own assets"] },
    ],
  },
  "company/contact": {
    section: "Company",
    title: "Contact Vestail",
    summary: "Reach the team about coverage, rule corrections, partnerships or product feedback.",
    sections: [
      { title: "Rule and source feedback", body: "When reporting a rule, include the country, buyer type, asset class and the source you believe should be reviewed." },
      { title: "Product and partnership enquiries", body: "Explain the user problem, market and route you want Vestail to evaluate." },
      { title: "Contact channels", body: "Email Vestail for coverage questions, corrections, partnerships and product feedback, or message us on X.", items: [{ label: "hello@vestail.fun", href: "mailto:hello@vestail.fun" }, { label: "@usevestail", href: "https://x.com/usevestail" }] },
    ],
  },
};

export const marketingPageKey = (section: string, slug: string) => `${section}/${slug}`;
