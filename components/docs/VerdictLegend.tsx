import { VERDICT_BADGE, type BadgeStatus } from "@/lib/verdictBadge";

const ROWS: Array<{
  status: BadgeStatus;
  means: string;
  buy: string;
  exit: string;
}> = [
  {
    status: "eligible",
    means:
      "The issuer's own policy permits holders in the country you declared, with no further gate.",
    buy: "Yes",
    exit: "Yes",
  },
  {
    status: "conditional",
    means:
      "You can acquire and hold it, but redemption, dividends or transfer sit behind KYC or an investor-class test.",
    buy: "Yes",
    exit: "Not without clearing a gate",
  },
  {
    status: "restricted",
    means: "The issuer's own policy excludes the country you declared.",
    buy: "Onchain, technically",
    exit: "No",
  },
];

/**
 * The three verdicts, with what each one means for buying and for getting
 * out again. Two columns, because those are the two different questions and
 * the whole argument is that the answers come apart in the middle row.
 */
export function VerdictLegend() {
  return (
    <ul className="space-y-3">
      {ROWS.map((row) => {
        const badge = VERDICT_BADGE[row.status];
        return (
          <li
            key={row.status}
            className="rounded-2xl bg-brand-navy/60 p-5 ring-1 ring-white/10"
          >
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1 ${badge.className}`}
            >
              {badge.label}
            </span>
            <p className="mt-3 leading-relaxed text-white/80">{row.means}</p>
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-white/60">Can you buy it?</dt>
                <dd className="font-semibold text-white">{row.buy}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-white/60">Can you get out?</dt>
                <dd className="font-semibold text-white">{row.exit}</dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
