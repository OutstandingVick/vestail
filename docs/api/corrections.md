# Reporting a wrong rule

If Vestail says something untrue about what a person may own, that is the most serious
bug this project has. It is worth more than a crash.

## What to send

Open an issue at
[github.com/OutstandingVick/vestail](https://github.com/OutstandingVick/vestail/issues)
with:

| | |
|---|---|
| The `ruleId` | Returned by [`/check`](./reference/check.md); it identifies the exact rule. |
| Or country, asset, buyer type | `NG`, `agricultural_land`, `foreigner` — enough to find it. |
| What Vestail said | The verdict you got. |
| What is actually true | And, if you can, what kind of restriction applies. |
| **A document** | The part that matters. See below. |

## A cited document beats an argument

Rules are written from statutes, regulator guidance and issuer terms. They are not
written from news coverage, another service's answer, or a well-argued comment — those
can point at a document but cannot stand in for one.

So a report with a link to the relevant law, circular or terms page gets acted on. A
report without one gets a request for the source first, however confident it is. That is
not scepticism about you; it is the same standard the rules themselves are held to, and
the reason `sources` exists as a field.

## What happens next

The rule is checked against the document, corrected if it is wrong, and gains a
`sources` entry and a `verified_at` date — so the fix is visible in the API, not just in
the interface.

If the document shows the rule was right, that is a result too: it gets a source it did
not have.

## "Everything is unsourced" is known

All 480 rules currently have `sources: []` and `verified_at: null`. You do not need to
report that. It is stated on the [methodology
page](https://www.vestail.fun/company/methodology), in [rules.md](./reference/rules.md),
and in this repo's `CLAUDE.md` as the largest open gap.

What is worth reporting is a rule you believe is **wrong**, not merely unverified.

## Security issues

Do not open a public issue. See `SECURITY-AUDIT.md` in the repository root.
