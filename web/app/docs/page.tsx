import { CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { absolute } from "@/lib/seo";

import styles from "./docs.module.css";

export const metadata: Metadata = {
  title: "Developer docs",
  description: "Build with Vestail's ownership resolver, rule engine, verdict model, and venue routing API.",
  alternates: { canonical: absolute("/docs") },
};

const navigation = [
  { label: "Overview", href: "#overview" },
  { label: "Quickstart", href: "#quickstart" },
  { label: "Resolver", href: "#resolver" },
  { label: "Verdict model", href: "#verdicts" },
  { label: "Rule engine", href: "#rules" },
  { label: "API reference", href: "#api" },
  { label: "Integration guide", href: "#integration" },
  { label: "Trust and limits", href: "#trust" },
  { label: "Glossary", href: "#glossary" },
  { label: "Changelog", href: "#changelog" },
];

const glossary = [
  ["Price exposure only", "The product follows a reference price, but you do not own the company, index constituents, currency basket, commodity, or other underlying asset."],
  ["Underlying asset", "The share, commodity, currency, index, or other reference whose value a product follows or claims to represent."],
  ["Perpetual future", "A leveraged contract that tracks a reference price and has no expiry date. It is settled in money rather than by delivering the underlying."],
  ["Liquidation", "The forced closing of a leveraged position when the account no longer has enough collateral to support it."],
  ["Margin and collateral", "Collateral supports a trade; margin is the amount required to open and maintain a leveraged position."],
  ["Tokenised asset", "An onchain token connected to an offchain asset. Its legal rights come from the issuer’s terms, not from its ticker or blockchain."],
  ["Tokenised share", "A token whose issuer says a real share backs it or that it carries a claim on one. Voting, dividends, transfer, and redemption still depend on the terms."],
  ["Debt token", "An issuer obligation that may follow a share’s price without making its holder a shareholder."],
  ["Custodian", "An organisation that holds an underlying asset for someone else. Custody alone does not make each token holder the registered owner."],
  ["Redemption", "Exchanging a product for its stated underlying asset or cash value. Eligibility checks, minimums, or jurisdiction limits may apply."],
  ["Issuer", "The organisation that creates a product and defines the holder’s rights, restrictions, and claims."],
  ["Conditional", "A route exists, but a licence, cap, identity check, investor-status test, or other condition may apply. Acknowledging it does not satisfy it."],
] as const;

const endpoints = [
  ["POST", "/check", "Check one asset for a declared country and residency."],
  ["POST", "/check/batch", "Run up to 100 independent checks in one request."],
  ["GET", "/assets", "List every class and issuer version with its profile-specific verdict."],
  ["GET", "/countries", "Read supported countries and sourced-rule coverage."],
  ["GET", "/rules/{id}", "Read one rule with sources and available history."],
] as const;

const curlExample = `curl "$VESTAIL_API_BASE_URL/api/v1/check" \\
  -H "Authorization: Bearer $VESTAIL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "country": "NG",
    "residency": "citizen",
    "asset": { "class": "gold_bullion" }
  }'`;
const fetchExample = `const response = await fetch(\`${"${process.env.VESTAIL_API_BASE_URL}"}/api/v1/check\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.VESTAIL_API_KEY}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    country: "NG",
    residency: "citizen",
    asset: { class: "gold_bullion" }
  })
});
const eligibility = await response.json();`;
const responseShapes = `// Shape examples — placeholders are replaced by sourced rule data.
{ "verdict": "eligible", "reasons": ["<sourced reason>"], "conditions": [],
  "sources": [{ "label": "<source label>", "url": "<source URL>" }] }
{ "verdict": "conditional", "reasons": ["<sourced reason>"],
  "conditions": ["<condition from the rule>"],
  "sources": [{ "label": "<source label>", "url": "<source URL>" }] }
{ "verdict": "restricted", "reasons": ["<sourced reason>"], "conditions": [],
  "sources": [{ "label": "<source label>", "url": "<source URL>" }] }`;

function CodeBlock({ children, label }: { children: string; label: string }) {
  return (
    <figure className={styles.codeBlock}>
      <figcaption>{label}</figcaption>
      <pre><code>{children}</code></pre>
    </figure>
  );
}

export default function DocsPage() {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#docs-content">Skip to documentation</a>

      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Vestail home">
          <Logo className="h-7 w-auto" />
          <span>Docs</span>
        </Link>
        <div className={styles.headerActions}>
          <span className={styles.version}>Eligibility API v1</span>
          <Link className={styles.secondaryAction} href="/">View website</Link>
          <Link className={styles.primaryAction} href="/app?signin">Open app</Link>
        </div>
      </header>

      <div className={styles.mobileNav}>
        <details>
          <summary>Browse documentation</summary>
          <nav aria-label="Documentation sections">
            {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
        </details>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <p className={styles.navLabel}>Developer documentation</p>
          <nav aria-label="Documentation sections">
            {navigation.map((item, index) => (
              <a className={index === 0 ? styles.activeLink : undefined} key={item.href} href={item.href}>{item.label}</a>
            ))}
          </nav>
          <div className={styles.sidebarNote}>
            <strong>Need the contract?</strong>
            <p>The running API serves its OpenAPI document at <code>/api/v1/openapi.json</code>.</p>
          </div>
        </aside>

        <main id="docs-content" className={styles.main}>
          <section id="overview" className={styles.hero}>
            <div className={styles.eyebrow}>Vestail developer platform</div>
            <h1>Eligibility answers your product can explain.</h1>
            <p className={styles.lede}>Check what a person may own using only a declared country, residency, and asset—without sending names, IDs, or wallet addresses.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#quickstart">Start building</a>
              <a className={styles.textLink} href="#api">Explore the API <span aria-hidden="true">→</span></a>
            </div>
            <div className={styles.previewNotice} role="note">
              <span className={styles.noticeMark} aria-hidden="true" />
              <div><strong>Design-partner access</strong><p>Ask Vestail for a test key. Test keys begin with <code>vst_test_</code>; live keys begin with <code>vst_live_</code>.</p></div>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="mental-model-title">
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>The mental model</p>
              <h2 id="mental-model-title">One question. Four explicit steps.</h2>
            </div>
            <ol className={styles.steps}>
              <li><span>01</span><strong>Declare</strong><p>Use the buyer’s stated country and role. Vestail does not infer either.</p></li>
              <li><span>02</span><strong>Resolve</strong><p>Turn a company, product, or everyday phrase into a known asset class.</p></li>
              <li><span>03</span><strong>Judge</strong><p>Apply the country rule and preserve conditional outcomes as their own state.</p></li>
              <li><span>04</span><strong>Route</strong><p>Offer a venue only when the verdict allows it and required conditions are acknowledged.</p></li>
            </ol>
          </section>

          <section id="quickstart" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Quickstart</p>
              <h2>Make your first eligibility check.</h2>
              <p>Get an API key from Vestail, keep it on your server, and send only the declared eligibility context.</p>
            </div>
            <div className={styles.twoColumn}>
              <div>
                <h3>1. Call the API with curl</h3>
                <p>Use the bearer key in the Authorization header. Never expose a live key in browser code.</p>
                <CodeBlock label="curl">{curlExample}</CodeBlock>
              </div>
              <div><h3>2. Call it from TypeScript</h3><CodeBlock label="Server-side TypeScript">{fetchExample}</CodeBlock></div>
            </div>
            <div className={styles.callout}>
              <strong>Example response shapes</strong>
              <p>These are structural examples, not claims about a country or asset. Real reasons and sources always come from Vestail’s stored rule data.</p>
              <CodeBlock label="Eligible, conditional, restricted">{responseShapes}</CodeBlock>
            </div>
          </section>

          <section id="resolver" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Resolver</p>
              <h2>Every match shows its work.</h2>
              <p>Vestail evaluates named entities before generic aliases, so “Tesla shares” resolves to Tesla instead of the broader shares category.</p>
            </div>
            <div className={styles.pipeline} aria-label="Resolver priority">
              {[
                ["Entity", "Named companies and assets"],
                ["Alias", "Everyday language"],
                ["Category", "Groups that fan out"],
                ["Asset", "Canonical asset IDs"],
              ].map(([title, copy], index) => (
                <div key={title}><span>{index + 1}</span><strong>{title}</strong><small>{copy}</small></div>
              ))}
            </div>
            <p className={styles.bodyCopy}>A resolution can include a per-country rule when the same entity maps differently by location. For example, a listed company can be domestic equity in its home country and foreign equity elsewhere.</p>
          </section>

          <section id="verdicts" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Verdict model</p>
              <h2>Three states. Never a misleading boolean.</h2>
            </div>
            <div className={styles.verdictGrid}>
              <article className={styles.can}><span className={styles.verdictIcon}><CheckCircle size={22} weight="duotone" aria-hidden="true" /></span><h3>Eligible</h3><code>eligible</code><p>The sourced rules indicate ownership is available for this declared context.</p></article>
              <article className={styles.conditional}><span className={styles.verdictIcon}><WarningCircle size={22} weight="duotone" aria-hidden="true" /></span><h3>Conditional</h3><code>conditional · 1</code><p>A licence, cap, approval, residency rule, or other condition applies.</p></article>
              <article className={styles.cannot}><span className={styles.verdictIcon}><XCircle size={22} weight="duotone" aria-hidden="true" /></span><h3>Restricted</h3><code>restricted</code><p>The sourced rules indicate ownership is restricted for this declared context.</p></article>
            </div>
            <div className={styles.ruleBox}><strong>Routing invariant</strong><p>Conditional routes require <code>acknowledged: true</code>. Cannot-own routes are always refused.</p></div>
            <div className={styles.warning}><strong>Unverified is not eligible</strong><p>If a rule has no source, the public API returns <code>unverified</code>. It never promotes missing research to an eligibility verdict.</p></div>
          </section>

          <section id="rules" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Rule engine</p>
              <h2>Country rules, issuer rules, and the stricter outcome.</h2>
            </div>
            <div className={styles.ruleFlow}>
              <article><span>Class rule</span><h3>Country × buyer × asset</h3><p>The baseline ownership status for the asset class.</p></article>
              <span aria-hidden="true">+</span>
              <article><span>Issuer rule</span><h3>Product-specific policy</h3><p>Eligibility evidence for a tokenized or issued product.</p></article>
              <span aria-hidden="true">→</span>
              <article><span>Final verdict</span><h3>The stricter result wins</h3><p>An unassessed product is never treated as eligible or buyable.</p></article>
            </div>
            <div className={styles.schemaGrid}>
              <div><h3>Rule shape</h3><p>Rules are keyed by asset ID under each buyer type. Every country must contain every supported asset.</p></div>
              <CodeBlock label="Rule JSON">{`{
  "status": 1,
  "sources": [],
  "verified_at": null
}`}</CodeBlock>
            </div>
          </section>

          <section id="api" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>API reference</p>
              <h2>Small surface, composable responses.</h2>
              <p>All responses are JSON. Reference data is designed to be cacheable; activity data is live.</p>
            </div>
            <div className={styles.baseUrl}><span>Base path</span><code>/api/v1</code><small>The running service publishes its generated OpenAPI 3.1 document at <code>/api/v1/openapi.json</code>.</small></div>
            <div className={styles.endpointList}>
              {endpoints.map(([method, path, description]) => (
                <article key={`${method}${path}`}>
                  <span className={method === "POST" ? styles.post : styles.get}>{method}</span>
                  <code>{path}</code>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="integration" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Integration guide</p>
              <h2>Use the disclosure, not a boolean.</h2>
            </div>
            <div className={styles.integrationGrid}>
              <div>
                <h3>For every response</h3>
                <ul>
                  <li>Display the verdict, reasons, conditions, and sources together.</li>
                  <li>Treat <code>unverified</code> as unknown, never eligible.</li>
                  <li>Use <code>ruleId</code> to retrieve the current rule and available history.</li>
                  <li>Respect <code>429</code> and the <code>Retry-After</code> header.</li>
                  <li>Do not send personal data, IDs, or wallet addresses.</li>
                </ul>
              </div>
              <CodeBlock label="Batch request">{`await fetch(\`${"${process.env.VESTAIL_API_BASE_URL}"}/api/v1/check/batch\`, {
  method: "POST",
  headers: { Authorization: \`Bearer \${key}\`, "Content-Type": "application/json" },
  body: JSON.stringify({ checks: [firstCheck, secondCheck] })
});`}</CodeBlock>
            </div>
          </section>

          <section id="trust" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Trust and limits</p>
              <h2>What Vestail knows—and what it does not claim.</h2>
            </div>
            <div className={styles.trustGrid}>
              <article><h3>Buyer context is declared</h3><p>Vestail does not infer citizenship, residency, or identity. Results depend on the values supplied by the buyer or integrating product.</p></article>
              <article><h3>Provenance is mandatory</h3><p>A result without a source is returned as <code>unverified</code>, regardless of the internal rule status.</p></article>
              <article><h3>Disclosure, not enforcement</h3><p>Every response includes a disclaimer. Vestail informs; it does not certify compliance or guarantee a transaction.</p></article>
              <article><h3>Usage is privacy-minimal</h3><p>Vestail counts requests per API key per day for limits and future billing. Request bodies are not retained.</p></article>
            </div>
            <div className={styles.warning}><strong>Residency coverage</strong><p>The current rule set distinguishes citizens and foreigners. Requests for residents return <code>unverified</code> until resident-specific sourced rules are added.</p></div>
          </section>

          <section id="glossary" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Glossary</p>
              <h2>Know what you are—and are not—buying.</h2>
              <p>Plain-language meanings for the instrument and ownership terms used across Vestail.</p>
            </div>
            <dl className={styles.glossary}>
              {glossary.map(([term, meaning]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{meaning}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="changelog" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Changelog</p>
              <h2>What changed.</h2>
            </div>
            <article className={styles.change}>
              <time dateTime="2026-10-14">14 October 2026</time>
              <div><h3>Public Eligibility API v1</h3><p>Added bearer-key access, single and batch checks, profile-scoped assets, coverage statistics, rule history, unverified handling, and generated OpenAPI documentation.</p></div>
            </article>
            <article className={styles.change}>
              <time dateTime="2026-10-09">9 October 2026</time>
              <div><h3>Developer documentation launched</h3><p>Added the resolver, matrix, verdict, rule schema, route gating, provenance, API reference, and deployment-limit guidance in one connected path.</p></div>
            </article>
          </section>

          <footer className={styles.footer}>
            <Logo className="h-7 w-auto" />
            <p>Ownership rules, made legible.</p>
            <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/app?signin">Open app</Link></div>
          </footer>
        </main>

        <aside className={styles.onPage} aria-label="On this page">
          <p>On this page</p>
          <a href="#quickstart">Quickstart</a>
          <a href="#verdicts">Verdict model</a>
          <a href="#api">API reference</a>
          <a href="#trust">Trust and limits</a>
        </aside>
      </div>
    </div>
  );
}
