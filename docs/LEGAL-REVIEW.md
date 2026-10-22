# Legal and consent release review — 22 October 2026

Draft pages: `/terms`, `/privacy`, `/cookies`. Each renders a LAWYER REVIEW REQUIRED HTML comment. Content is based on the supplied product description and the inspected schemas, profile and invitation cookie routes, KV/user stores, public API key store and click log. These are drafts for review, not a compliance certification.

Before publication, fill in legal entity name, address, governing law/jurisdiction, retention schedule and international transfer locations/safeguards. Confirm deployed hosting/database settings and provider retention with the operator. The code supports Vercel and Upstash/Vercel KV but repository configuration cannot prove which accounts are active in production. Audit Privy and wallet-provider storage against enabled sign-in flows: the first-party key inventory is exhaustive for inspected source; the SDK list identifies confirmed names, not a promise of a universal SDK key inventory.

Privacy reflects server-side watchlists and daily portfolio snapshots, not an invented browser watchlist. Early-access free text, tester motivation, invitation status, account metadata and IP rate-limit memory are disclosed. API key secrets are hashed; usage and click records are distinct from anonymous analytics. No dedicated analytics/marketing provider was found or added.

`web/public/cookie-consent.js` is shared by the static homepage and Next routes. Optional integrations must be registered with `window.VestailConsent.register(id, 'analytics' | 'marketing', start)`. `start` must return a cleanup function that disables collection on withdrawal. Do not add eager optional script tags or preconnects. No optional integration is currently registered. Consent is validated, versioned and expires after 180 days. Storage failures fall back to page memory; the next visit asks again. Browser storage does not delete account records.

Tests: `node --test scripts/consent.test.mjs scripts/legal-pages.test.mjs` and the existing `npm test` command. The consent tests exercise storage denial, repeat visits, expiry, separate categories and integration start/cleanup. The page tests render React on the server and inspect actual HTML and metadata.

Consent design reference: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/
