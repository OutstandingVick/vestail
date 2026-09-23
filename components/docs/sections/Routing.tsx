import { AcknowledgementExample } from "@/components/docs/AcknowledgementExample";
import { Lede, Note, P, Section } from "@/components/docs/blocks";
import { VERDICT_BADGE, type BadgeStatus } from "@/lib/verdictBadge";

const RULES: Array<{ status: BadgeStatus; routed: string }> = [
  {
    status: "eligible",
    routed: "Bought. The strongest eligible version is selected for you by default.",
  },
  {
    status: "conditional",
    routed:
      "Bought only after you tick that version's acknowledgement. Never selected for you.",
  },
  {
    status: "restricted",
    routed: "Never bought, and never even priced. Shown dimmed, with the reason.",
  },
  { status: "not_assessed", routed: "Never bought." },
];

export function Routing() {
  return (
    <Section id="routing">
      <Lede>
        Showing you the verdict would be worth little if the buy button
        ignored it. It does not.
      </Lede>
      <ul className="space-y-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
        {RULES.map(({ status, routed }) => {
          const badge = VERDICT_BADGE[status];
          return (
            <li
              key={status}
              className="flex flex-col gap-2 bg-brand-navy/80 p-4 sm:flex-row sm:items-center sm:gap-5"
            >
              <span
                className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-sm font-bold ring-1 sm:w-36 sm:justify-center ${badge.className}`}
              >
                {badge.label}
              </span>
              <span className="text-sm leading-relaxed text-white/80">{routed}</span>
            </li>
          );
        })}
      </ul>
      <AcknowledgementExample />
      <P>
        The rule is enforced on the server, not in the interface. Every order
        is re-evaluated before it is priced or placed: a restricted version is
        refused outright, and a conditional one is refused unless the request
        carries the acknowledgement. Turning off JavaScript, editing the page
        or calling the API directly does not get you a different answer.
      </P>
      <Note title="This rule changed once, deliberately">
        <p>
          Vestail originally routed to eligible versions only. That turned out
          to be useless in practice: for a retail buyer almost nothing is
          plainly eligible, so the app would have refused to buy nearly
          everything while insisting the tokens were fine to hold. Buying
          conditional versions behind an explicit acknowledgement is the
          honest version of the same position.
        </p>
      </Note>
    </Section>
  );
}
