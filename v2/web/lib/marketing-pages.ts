export type MarketingPageSection = {
  title: string;
  body: string;
  items?: Array<string | { label: string; href: string }>;
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
    ],
  },
  "company/mission": {
    section: "Company",
    title: "Our mission",
    summary: "Help people understand what they can own, under which conditions and through which legitimate route.",
    sections: [
      { title: "Rules before routing", body: "A purchase path should follow the ownership verdict, never replace it." },
      { title: "Clarity over false certainty", body: "Vestail preserves the conditional middle instead of forcing complex rules into a convenient yes or no.", items: ["Make the buyer profile explicit", "Name the condition", "Show the source", "Stop restricted routes"] },
    ],
  },
  "company/difference": {
    section: "Company",
    title: "How Vestail is different",
    summary: "Vestail starts with ownership eligibility, not a catalogue, price chart or sponsored venue.",
    sections: [
      { title: "Three verdicts, not a loose boolean", body: "Can own, conditional and cannot own are distinct outcomes. Not assessed is never presented as buyable." },
      { title: "Evidence stays visible", body: "Rules carry provenance and verification dates so users can judge how an answer was formed." },
      { title: "Commercial incentives do not change the verdict", body: "Routing can happen only after the rule allows it, and cannot-own results stop before a venue." },
    ],
  },
  "company/partners": {
    section: "Company",
    title: "Partners",
    summary: "Vestail connects eligible users to external venues while keeping the ownership decision independent from the route.",
    sections: [
      { title: "What a partner route means", body: "The venue provides the transaction or product. Vestail provides the ownership context and sends a user onward only when the verdict permits it." },
      { title: "What it does not mean", body: "A listed route is not legal, tax or investment advice and does not guarantee that a venue will accept or complete a transaction.", items: ["No custody by Vestail", "No paid change to a verdict", "No route for cannot-own assets"] },
    ],
  },
  "company/contact": {
    section: "Company",
    title: "Contact Vestail",
    summary: "Reach the team about coverage, rule corrections, partnerships or product feedback.",
    sections: [
      { title: "Rule and source feedback", body: "When reporting a rule, include the country, buyer type, asset class and the source you believe should be reviewed." },
      { title: "Product and partnership enquiries", body: "Explain the user problem, market and route you want Vestail to evaluate." },
      { title: "Contact channel", body: "Message Vestail on X for coverage questions, corrections, partnerships and product feedback.", items: [{ label: "@usevestail", href: "https://x.com/usevestail" }] },
    ],
  },
};

export const marketingPageKey = (section: string, slug: string) => `${section}/${slug}`;
