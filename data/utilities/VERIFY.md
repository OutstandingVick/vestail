# Utility facts to verify

Rules in `protocols/*.json` were read from the sources named in each rule on
2026-11-11. These are the points a person still needs to confirm, ideally with
the protocol, before any verdict is relied on.

## Jupiter (trade)
1. The rule cites `jup.ag/mobile/terms` (Block Raccoon S.A., updated 2024-09-21). Confirm these are also the terms
   for jup.ag web swaps and the quote API, or find the web terms and re-read them.
2. The list names "Republic of China". Confirm whether that means the PRC (as encoded: `CN` restricted) or Taiwan.
3. Confirm none of NG, GB, AE, IN, BR, SA, DE, JP, ZA, KR is restricted (Singapore is, but isn't covered).
4. Confirm keyless use of `lite-api.jup.ag/swap/v1/quote` is allowed for a commercial product, and its rate limits.

## Meteora (earn)
5. The terms page didn't show its "Last updated" date. Record it.
6. Confirm the Restricted Territories list (US and CN among them; NG, GB, DE and the other covered countries not
   listed) and that it applies to direct SDK/contract use, not only the app.
7. Confirm the public data APIs (`dlmm.datapi.meteora.ag`, `damm-v2.datapi.meteora.ag`) may be used this way, and
   that `fee_tvl_ratio["24h"]` is a percentage (Vestail annualises it ×365 as a simple fee APR).
8. Confirm the program ids (`LBUZKhRx…` DLMM, `cpamdpZC…` DAMM v2) against Meteora's docs (taken from the SDKs).

## Issuers × utilities (not modelled yet)
9. Whether each issuer's terms let holders pledge the token as collateral, lend it, or deposit it in a liquidity pool
   (xStocks, Ondo, Backpack, Tessera, PreStocks). Today a utility inherits only the hold verdict; an issuer that
   forbids pledging would need its own utility rule.
10. Whether liquidity provision counts as "offering" the token to the pool's other side under Reg S restrictions.

## Lending (lend, borrow) — placeholders
11. Kamino, marginfi, Save: terms of use and restricted jurisdictions for each covered country.
12. Which mints each accepts for supply and as collateral, with max LTV, liquidation threshold and where APYs come from.
    Then fill `support.json` (assets) and the rule files (`todo: false`).

## Profile
13. There is no resident rule set: residents get unverified holding and utilities everywhere. Decide whether
    protocol rules (which mostly key on residence) should apply to residents separately.
