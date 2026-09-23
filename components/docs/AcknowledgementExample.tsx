import { POLICIES } from "@/lib/policies";
import { PROVIDER_NAME } from "@/lib/labels";
import { REGION_IN_SENTENCE } from "@/lib/constants";

/**
 * A real acknowledgement, rendered exactly as the app renders it.
 *
 * The sentence is not docs copy: `limit` and `requires` are read out of the
 * policy file, which is where the app reads them too. If the research
 * changes, this example changes with it — which is the claim being
 * illustrated, so faking it here would undercut the section.
 */
export function AcknowledgementExample() {
  const policy = POLICIES.xstocks;
  const gate = policy.rules.find(
    (r) => r.kind === "gate" && r.status === "conditional" && r.acknowledgement,
  );
  if (!gate || gate.kind !== "gate" || !gate.acknowledgement) return null;

  return (
    <figure>
      <div className="flex items-start gap-3 rounded-2xl bg-conditional/10 px-4 py-3 text-sm leading-relaxed text-white ring-1 ring-conditional/40">
        <span
          aria-hidden
          className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm bg-brand-orange text-[10px] font-bold text-brand-navy"
        >
          ✓
        </span>
        <span>
          I understand I can buy and hold this, but {gate.acknowledgement.limit}{" "}
          requires {gate.acknowledgement.requires}.
        </span>
      </div>
      <figcaption className="mt-2 text-sm text-white/60">
        The real checkbox for {PROVIDER_NAME[policy.provider]}, as it appears{" "}
        {REGION_IN_SENTENCE[gate.regions[0]]}. Its wording comes from the
        sourced policy file, not from interface copy — no gate, no sentence, no
        purchase.
      </figcaption>
    </figure>
  );
}
