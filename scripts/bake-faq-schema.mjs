/*
 * Rebuilds the FAQPage JSON-LD in site/index.html from the FAQ actually
 * rendered there.
 *
 * Structured data that says something the page does not is worse than none: it
 * is a claim made to a crawler that the reader cannot check, on a site whose
 * whole proposition is that its answers can be checked. So the markup is
 * generated from the markup, never written alongside it by hand.
 *
 * Usage, from the repo root:  node scripts/bake-faq-schema.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../site/index.html", import.meta.url);
const OPEN = "<!-- faq-schema:start -->";
const CLOSE = "<!-- faq-schema:end -->";

const strip = html =>
  html
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export function extractFaq(html) {
  const section = html.match(/id="faq"[\s\S]*?<\/section>/)?.[0];
  if (!section) throw new Error("no #faq section in the page");

  const items = [];
  for (const block of section.match(/<details[\s\S]*?<\/details>/g) ?? []) {
    const summary = block.match(/<summary[\s\S]*?<\/summary>/)?.[0] ?? "";
    /*
     * Each summary is a short label and a one-line teaser. The teaser is the
     * sentence a reader would recognise as the question, so that is what goes
     * in `name` — verbatim, not a question invented to sound better.
     */
    const teaser = strip(summary.match(/<small[^>]*>([\s\S]*?)<\/small>/)?.[1] ?? "");
    const answer = strip(block.slice(block.indexOf("</summary>") + "</summary>".length));
    if (teaser && answer) items.push({ name: teaser, answer });
  }
  if (!items.length) throw new Error("the #faq section has no question and answer pairs");
  return items;
}

export function buildSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://www.vestail.fun/#faq",
    isPartOf: { "@id": "https://www.vestail.fun/#website" },
    mainEntity: items.map(({ name, answer }) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

if (import.meta.url === new URL(process.argv[1] ?? "", "file:").href || process.argv[1]?.endsWith("bake-faq-schema.mjs")) {
  const html = readFileSync(FILE, "utf8");
  const items = extractFaq(html);
  const script = `${OPEN}\n<script type="application/ld+json">\n${JSON.stringify(buildSchema(items), null, 2)}\n</script>\n${CLOSE}`;

  const start = html.indexOf(OPEN);
  if (start === -1) throw new Error(`no ${OPEN} marker in site/index.html`);
  const end = html.indexOf(CLOSE, start);
  if (end === -1) throw new Error(`no ${CLOSE} marker in site/index.html`);

  writeFileSync(FILE, html.slice(0, start) + script + html.slice(end + CLOSE.length));
  process.stderr.write(`faq schema: ${items.length} questions\n`);
  for (const i of items) process.stderr.write(`  ${i.name.slice(0, 72)}\n`);
}
