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
  | { status: "ok"; prices: Map<string, PythPrice> }
  | { status: "no_key" }
  | { status: "error"; message: string };

interface HermesParsed {
  id: string;
  price: { price: string; conf: string; expo: number; publish_time: number };
}

export async function getPythPrices(feedIds: string[]): Promise<PythResult> {
  const key = process.env.PYTH_API_KEY?.trim();
  if (!key) return { status: "no_key" };
  if (feedIds.length === 0) return { status: "ok", prices: new Map() };

  const query = feedIds
    .map((id) => `ids[]=${encodeURIComponent(id)}`)
    .join("&");

  try {
    const res = await fetch(
      `${PYTH_HERMES}/v2/updates/price/latest?parsed=true&${query}`,
      {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: 10 },
      },
    );
    if (!res.ok) {
      return {
        status: "error",
        message:
          res.status === 401 || res.status === 403
            ? "Pyth rejected the API key."
            : `Pyth returned HTTP ${res.status}.`,
      };
    }

    const body = (await res.json()) as { parsed?: HermesParsed[] };
    const prices = new Map<string, PythPrice>();
    for (const p of body.parsed ?? []) {
      const scale = 10 ** p.price.expo;
      prices.set(`0x${p.id.replace(/^0x/, "")}`, {
        price: Number(p.price.price) * scale,
        conf: Number(p.price.conf) * scale,
        publishTime: p.price.publish_time,
      });
    }
    return { status: "ok", prices };
  } catch (cause) {
    return {
      status: "error",
      message: cause instanceof Error ? cause.message : "Pyth request failed.",
    };
  }
}
