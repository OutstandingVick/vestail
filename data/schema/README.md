# Data model

Six independent JSON modules. Each can be swapped for a database table with the same shape. Nothing references another module by array position: `countries.rules` is keyed by asset id.

```
assets.json       the 20 asset classes            (id, index, name)
categories.json   fan-out groups                  (id, name, assets[name])
aliases.json      everyday word -> asset|category (string -> string)
entities.json     named things -> asset class     (name, kind, home?, asset)
countries.json    ownership rules per buyer type  (code, name, flag, rules.{citizen,foreigner}.{asset_id})
venues.json       where to buy, per asset/country (asset -> {default[], <ISO>[]})
activity.sample.json  HUD feed shape             (stats{}, recent[])
```

## Status scale
| value | key          | meaning                                      |
|------:|--------------|----------------------------------------------|
| 2     | can_own      | permitted outright                           |
| 1     | conditional  | licence, cap, approval or residency required |
| 0     | cannot_own   | prohibited for this buyer type               |

## Entity `asset` values
Either a literal asset name, or the sentinel `"equity-by-home"` meaning: domestic equity in `home`, foreign equity everywhere else. Add more sentinels the same way (e.g. `"bond-by-home"`).

## Venue rows
`{ "name": "Zerodha", "url": "https://zerodha.com" }`. A `null` url means "no online venue; show the name as guidance" (used for firearms, trusts, regulated sectors). The `ref` field at the top of venues.json is appended to every outbound url for attribution.

## Rules and provenance
```json
"rules": {
  "citizen": {
    "gold_bullion": {
      "status": 2,
      "sources": [{ "title": "Regulator guidance, 2025", "url": "https://…" }],
      "verified_at": "2026-09-29"
    }
  }
}
```
Every country needs a rule for every asset id, for both buyer types; the core refuses to load a missing, unknown or invalid one. `sources` lists the documents the status rests on and `verified_at` is the date it was last checked against them. Both start empty (`[]`, `null`): an unsourced rule is illustrative. `schemas.json` validates the shape, and the API tests run it over `countries.json`.

## Reading this through the API

The same model, from a caller's side, is in
[`docs/api/data-model.md`](../../docs/api/data-model.md) — and the endpoints that expose
it are documented one page each under [`docs/api/reference/`](../../docs/api/reference/README.md).

If you are adding an asset class or a country, both need updating: the core refuses to
load when a rule is missing, and a guard refuses the build when an endpoint has no page.

## Tokenised symbols

`tokens/representations.json` (Solana) and `tokens/evm.json` (Robinhood Chain,
Base) list the onchain versions of a listed equity. A row says which contract,
on which chain, from which provider, and — the part that matters — what it
legally is: `custody_backed`, `security_entitlement`, `share_claim` or
`tokenized_debt`, plus whether it can be redeemed and who, if anyone, holds the
underlying share. The same ticker through three providers is three different
answers, and that difference is the thing being recorded.

Addresses are read from the chain, never taken on trust from a provider's
registry. `scripts/sync-robinhood-tokens.mjs` does this for Robinhood.
`scripts/sync-solana-tokens.mjs` treats the Solana catalogue as candidate
discovery only, then verifies the SPL mint account and canonical Metaplex
metadata PDA. Token-2022 mints may carry their metadata in an onchain mint
extension instead; the synchronizer accepts that chain-owned record, not an
offchain replacement.

`tokens/symbols.json` maps each symbol to the asset class that governs it.
`equity-by-home` means the `home` market decides: domestic equities there,
foreign equities everywhere else. Pre-IPO names are private company shares.
Every symbol needs an entry — the core refuses to load without one.

## Roadmap
1. ~~Keyed rules~~ and 2. ~~`sources[]` and `verified_at` on every rule~~: done; values still to be filled.
3. Replace `entities.json` with a securities master (ISIN/ticker lookup) behind the same `{name, kind, home, asset}` shape.
4. Add `resident` as a third buyer type between citizen and foreigner.
