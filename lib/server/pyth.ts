import "server-only";

/**
 * Pyth price reads.
 *
 * Since the Pyth Core upgrade on 26 August 2026, Hermes requires an API key
 * on every price read (feed *discovery* is still open, which is what the
 * registry sync uses). This targets the upgraded endpoint rather than
 * hermes.pyth.network; Pyth documents the two as having identical routes and
 * response shapes.
 *
 * PYTH_API_KEY is server-only. A missing key is reported to the caller as a
 * status, not thrown — the rest of the page still has something true to say.
 */

const PYTH_HERMES = "https://pyth.dourolabs.app/hermes";

export interface PythPrice {
  price: number;
  /** Pyth's confidence interval, in the same units as price. */
  conf: number;
  /** Unix seconds. */
  publishTime: number;
}

export type PythResult =
  | { status: "no_key" }
  | { status: "unauthorized" }
  | {
      status: "ok";
      prices: Map<string, PythPrice>;
      /** Feeds the key is valid for but the plan does not include. */
      notEntitled: string[];
      /** Feeds that failed for any other reason, with the reason. */
      errors: string[];
    };

interface HermesParsed {
  id: string;
  price: { price: string; conf: string; expo: number; publish_time: number };
}

type FeedOutcome =
  | { kind: "ok"; id: string; price: PythPrice }
  | { kind: "unauthorized" }
  | { kind: "not_entitled"; id: string }
  | { kind: "error"; message: string };

/**
 * One request per feed, not one batch.
 *
 * Pyth plans grant access per asset class: a trial key reads BTC/USD but gets
 * 403 "Not entitled" on US equity and tokenized-stock feeds. A batch fails as
 * a whole if any single feed is outside the plan, which would blank out the
 * feeds the key *can* read. Symbols have at most three feeds, so the cost is
 * three small parallel requests.
 */
async function fetchFeed(id: string, key: string): Promise<FeedOutcome> {
  try {
    const res = await fetch(
      `${PYTH_HERMES}/v2/updates/price/latest?parsed=true&ids[]=${encodeURIComponent(id)}`,
      {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: 10 },
      },
    );

    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 403) {
      // 403 is Pyth's answer for a valid key outside its plan. Only a body
      // that says so is treated that way; any other 403 is a plain error.
      const text = await res.text();
      return text.startsWith("Not entitled")
        ? { kind: "not_entitled", id }
        : { kind: "error", message: `Pyth returned HTTP 403: ${text.slice(0, 80)}` };
    }
    if (!res.ok) {
      return { kind: "error", message: `Pyth returned HTTP ${res.status}.` };
    }

    const body = (await res.json()) as { parsed?: HermesParsed[] };
    const p = body.parsed?.[0];
    if (!p) return { kind: "error", message: "Pyth returned no price." };

    const scale = 10 ** p.price.expo;
    return {
      kind: "ok",
      id: `0x${p.id.replace(/^0x/, "")}`,
      price: {
        price: Number(p.price.price) * scale,
        conf: Number(p.price.conf) * scale,
        publishTime: p.price.publish_time,
      },
    };
  } catch (cause) {
    return {
      kind: "error",
      message: cause instanceof Error ? cause.message : "Pyth request failed.",
    };
  }
}

export async function getPythPrices(feedIds: string[]): Promise<PythResult> {
  const key = process.env.PYTH_API_KEY?.trim();
  if (!key) return { status: "no_key" };

  const outcomes = await Promise.all(feedIds.map((id) => fetchFeed(id, key)));

  if (outcomes.some((o) => o.kind === "unauthorized")) {
    return { status: "unauthorized" };
  }

  const prices = new Map<string, PythPrice>();
  const notEntitled: string[] = [];
  const errors: string[] = [];
  for (const o of outcomes) {
    if (o.kind === "ok") prices.set(o.id, o.price);
    else if (o.kind === "not_entitled") notEntitled.push(o.id);
    else if (o.kind === "error") errors.push(o.message);
  }
  return { status: "ok", prices, notEntitled, errors };
}
