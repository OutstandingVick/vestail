import { ApiError } from "../errors.js";
import { createLiveCache } from "../live/cache.js";
import { jupiterPairs } from "../live/jupiter.js";
import { depthUsd, meteoraPools } from "../live/meteora.js";
import { DISCLAIMER } from "./eligibility.js";

/**
 * GET /utilities: for each version of an asset a profile could hold, what they
 * can do with it (hold, trade, lend, borrow, earn) and whether they're
 * allowed to, with reasons, sources and live numbers. Verdicts come from
 * packages/core/utilities.js; live numbers from Jupiter and Meteora and are
 * only fetched for options whose actions are enabled. No personal data.
 */
export function createUtilitiesService(data, { jupiter = jupiterPairs, meteora = meteoraPools, cache = createLiveCache() } = {}) {
  /** Every token version an asset selector names: a symbol (NVDA) or one address. */
  function versions(asset, country, who) {
    const bySymbol = data.tokens.list().find(s => s.symbol === asset.toUpperCase());
    if (bySymbol) return data.tokens.board(bySymbol.symbol, country, who, data.core).tokens.map(t => ({ symbol: bySymbol.symbol, token: t }));
    const found = data.tokens.token(asset, country, who, data.core);
    if (found) return [{ symbol: found.symbol, token: found.token }];
    throw new ApiError(400, "invalid_asset", `asset: Unknown tokenized asset '${asset}'. Use a symbol (NVDA) or a token address.`);
  }

  async function live(option, token) {
    if (!option.actionsEnabled || token.chain !== "solana") return null;
    if (option.protocol === "jupiter") {
      const pairs = await cache(`jup:${token.address}`, () => jupiter(token.address, token.decimals, { pairs: option.pairs }));
      return { pairs };
    }
    if (option.protocol === "meteora") {
      const pools = await cache(`met:${token.address}`, () => meteora(token.address, { kinds: option.pools, pairs: option.pairs }));
      return { depthUsd: depthUsd(pools), pools: pools.slice(0, 10) };
    }
    return null;
  }

  async function utilities({ asset, country, residency }) {
    country = country.toUpperCase();
    if (!data.countryByCode[country]) throw new ApiError(400, "invalid_country", `country: Unsupported country '${country}'.`);
    // The rule set has no resident buyer type: holding is unverified for residents, so every utility is too.
    const who = residency === "resident" ? "citizen" : residency;
    const list = versions(asset, country, who);
    return {
      country, residency,
      versions: await Promise.all(list.map(async ({ symbol, token }) => {
        const held = residency === "resident" ? { ...token, status: null } : token;
        const judged = data.utilities.judge(held, country);
        return {
          asset: { symbol, id: token.address, tokenSymbol: token.token_symbol, name: token.name, issuer: token.provider, chain: token.chain, instrument: token.instrument },
          utilities: await Promise.all(judged.map(async u => ({
            ...u,
            options: await Promise.all(u.options.map(async o => {
              try {
                return { ...o, live: await live(o, token) };
              } catch (e) {
                return { ...o, live: null, liveError: e instanceof Error ? e.message : "Live data unavailable." };
              }
            })),
          }))),
        };
      })),
      disclaimer: DISCLAIMER,
    };
  }

  return { utilities };
}
