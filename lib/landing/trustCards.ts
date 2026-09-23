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
] as const;
