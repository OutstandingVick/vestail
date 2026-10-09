import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/Logo";

import styles from "./docs.module.css";

export const metadata: Metadata = {
  title: "Developer docs · Vestail",
  description: "Build with Vestail's ownership resolver, rule engine, verdict model, and venue routing API.",
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
  { label: "Changelog", href: "#changelog" },
];

const endpoints = [
  ["GET", "/resolve", "Turn free text into asset classes with an explanation trail."],
  ["GET", "/matrix", "Return ownership verdicts across countries for a query."],
  ["GET", "/rules/{country}/{asset}", "Read one rule, its venues, sources, and verification date."],
  ["GET", "/venues/{asset}", "List eligible buying venues, optionally scoped to a country."],
  ["GET", "/tokens/{symbol}", "Compare tokenized versions using issuer and class rules."],
  ["POST", "/orders/click", "Validate and record an outbound route to a venue."],
] as const;

const resolveExample = `curl "https://api.vestail.example/v1/resolve?q=tesla%20shares"`;
const resolveResponse = `{
  "stage": "entity",
  "assets": ["domestic_equities", "foreign_equities"],
  "entity": { "name": "Tesla", "kind": "Listed company", "home": "US" },
  "trail": ["Tesla", "Listed company (US)", "Equities", "Domestic in US, foreign elsewhere"]
}`;
const matrixExample = `const response = await fetch(
  "https://api.vestail.example/v1/matrix?q=tesla%20shares&who=citizen&countries=NG,GB,US"
);
const matrix = await response.json();`;
const clickExample = `await fetch("https://api.vestail.example/v1/orders/click", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": process.env.VESTAIL_API_KEY
  },
  body: JSON.stringify({
    country: "NG",
    asset: "cryptocurrency",
    who: "citizen",
    venue: "Luno",
    acknowledged: true
  })
});`;

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
          <span className={styles.version}>API v0.1</span>
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
            <p>The running API serves its OpenAPI document at <code>/v1/openapi.json</code>.</p>
          </div>
        </aside>

        <main id="docs-content" className={styles.main}>
          <section id="overview" className={styles.hero}>
            <div className={styles.eyebrow}>Vestail developer platform</div>
            <h1>Ownership rules your product can explain.</h1>
            <p className={styles.lede}>Resolve what someone wants to buy, judge it for their declared country and buyer type, and route only the outcomes that can proceed.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#quickstart">Start building</a>
              <a className={styles.textLink} href="#api">Explore the API <span aria-hidden="true">→</span></a>
            </div>
            <div className={styles.previewNotice} role="note">
              <span className={styles.noticeMark} aria-hidden="true" />
              <div><strong>Preview API</strong><p>The contract is implemented and tested. The public production host and credentials are not yet generally available.</p></div>
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
              <h2>Go from text to a country matrix.</h2>
              <p>Start with the resolver, then request verdicts for the buyer context you actually have.</p>
            </div>
            <div className={styles.twoColumn}>
              <div>
                <h3>1. Resolve the query</h3>
                <p>Resolution is never silent. Every match returns a stage and a trail your interface can show to the buyer.</p>
                <CodeBlock label="Request">{resolveExample}</CodeBlock>
              </div>
              <CodeBlock label="Response">{resolveResponse}</CodeBlock>
            </div>
            <div className={styles.callout}>
              <strong>2. Ask for verdicts</strong>
              <p>Pass <code>who=citizen</code> or <code>who=foreigner</code>. Omit <code>countries</code> to return every supported country.</p>
              <CodeBlock label="JavaScript">{matrixExample}</CodeBlock>
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
              <article className={styles.can}><span className={styles.verdictIcon} aria-hidden="true">✓</span><h3>Can own</h3><code>can_own · 2</code><p>Ownership is permitted outright for this buyer context.</p></article>
              <article className={styles.conditional}><span className={styles.verdictIcon} aria-hidden="true">!</span><h3>Conditional</h3><code>conditional · 1</code><p>A licence, cap, approval, residency rule, or other condition applies.</p></article>
              <article className={styles.cannot}><span className={styles.verdictIcon} aria-hidden="true">×</span><h3>Cannot own</h3><code>cannot_own · 0</code><p>Vestail does not provide a buy route for this buyer context.</p></article>
            </div>
            <div className={styles.ruleBox}><strong>Routing invariant</strong><p>Conditional routes require <code>acknowledged: true</code>. Cannot-own routes are always refused.</p></div>
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
            <div className={styles.baseUrl}><span>Base URL</span><code>https://api.vestail.example/v1</code><small>Placeholder until the production API host is published</small></div>
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
              <h2>Route the verdict, not just the asset.</h2>
            </div>
            <div className={styles.integrationGrid}>
              <div>
                <h3>Before showing a buy action</h3>
                <ul>
                  <li>Collect a declared country and buyer type.</li>
                  <li>Keep the asset ID returned by the resolver.</li>
                  <li>Display the verdict label, reason, and provenance.</li>
                  <li>Require explicit acknowledgement for a conditional result.</li>
                  <li>Never construct venue links for a cannot-own result.</li>
                </ul>
              </div>
              <CodeBlock label="Record an eligible route">{clickExample}</CodeBlock>
            </div>
          </section>

          <section id="trust" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Trust and limits</p>
              <h2>What Vestail knows—and what it does not claim.</h2>
            </div>
            <div className={styles.trustGrid}>
              <article><h3>Buyer context is declared</h3><p>Vestail does not infer citizenship, residency, or identity. Results depend on the values supplied by the buyer or integrating product.</p></article>
              <article><h3>Provenance is explicit</h3><p>Each sourced rule can include documents and a verification date. Empty sources and a null date mean the rule is illustrative, not verified.</p></article>
              <article><h3>Guidance is not legal advice</h3><p>Rules can change and may not capture every personal circumstance. High-stakes decisions still require qualified advice.</p></article>
              <article><h3>Routing has hard gates</h3><p>The API refuses cannot-own clicks and conditional clicks without acknowledgement. A venue URL alone never overrides a verdict.</p></article>
            </div>
            <div className={styles.warning}><strong>Current infrastructure limit</strong><p>Click records and rate-limit windows are held in memory and reset on restart. A shared persistent store is required before multi-instance production deployment.</p></div>
          </section>

          <section id="changelog" className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Changelog</p>
              <h2>What changed.</h2>
            </div>
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
