/** User-supplied landing copy, in the zig-zag's reading order. */
export const TRUST_CARDS = [
  {
    id: "wallet",
    title: "We never hold your money",
    body: "Your funds go from your wallet to the market. Vestail can't touch them, move them, or freeze them. You sign every transaction yourself.",
  },
  {
    id: "sources",
    title: "Every answer is sourced",
    body: "When we tell you a version is restricted, we link to the provider's own terms so you can read the rule yourself. No black box.",
  },
  {
    id: "gate",
    title: "We show the gate, we don't pretend to be it",
    body: "Anyone can buy anything on a public market. What most apps won't tell you is what you're actually entitled to once you hold it. We do.",
  },
  {
    id: "stack",
    title: "Built on what already works",
    body: "Solana for settlement, Jupiter for routing, and the issuers themselves for the assets. We add the layer that was missing.",
  },
] as const;
