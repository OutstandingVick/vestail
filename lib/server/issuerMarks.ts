import "server-only";

/**
 * Issuer-published mark prices for the pre-IPO providers.
 *
 * For a private company there is no listed share to compare against, so the
 * only reference available is the issuer's own mark. It is shown as exactly
 * that — the issuer's number — and never presented as a market price.
 *
 * Both endpoints are public and keyless. A failure here only removes a
 * comparison; it never blocks the rest of the view.
 */

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

/** mint -> issuer mark price in USD. */
export async function getIssuerMarks(): Promise<Map<string, number>> {
  const marks = new Map<string, number>();

  const [prestocks, tessera] = await Promise.allSettled([
    fetchJson("https://prestocks.com/api/prestocks"),
    fetchJson("https://rest-api.tessera.pe/v1/public/token-details"),
  ]);

  if (prestocks.status === "fulfilled" && Array.isArray(prestocks.value)) {
    for (const t of prestocks.value as Array<{
      contract_address?: string;
      markPrice?: number;
    }>) {
      if (t.contract_address && typeof t.markPrice === "number") {
        marks.set(t.contract_address, t.markPrice);
      }
    }
  }

  if (tessera.status === "fulfilled" && Array.isArray(tessera.value)) {
    for (const t of tessera.value as Array<{
      mint?: string;
      markPrice?: number;
    }>) {
      if (t.mint && typeof t.markPrice === "number") {
        marks.set(t.mint, t.markPrice);
      }
    }
  }

  return marks;
}
