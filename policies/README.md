# Policies

Issuer eligibility policy: one versioned JSON file per issuer, one set of
rules per jurisdiction Vestail covers (NG, US, DE).

## Why files and not a database

The output of this product is a claim about what a named issuer permits in a
named jurisdiction. That claim has to be auditable, and "auditable" means
someone can ask *when did this rule change, who changed it, and what did they
read* — and get an answer.

A database row answers none of that. It shows the current value with no history
and no reviewer. A JSON file in git answers all of it: `git log -p
policies/xstocks.json` is the complete record of every rule change, with a
diff, an author, a timestamp and a message.

**Git history is the audit trail.** That is the reason for the format, and it
is why policy must not migrate into a database later for convenience.

## File shape

```jsonc
{
  "provider": "tessera",          // must match the filename
  "version": "2026-09-21.1",      // YYYY-MM-DD.N, copied onto every verdict
  "reviewedAt": "2026-09-21",
  "rules": [
    {
      "id": "us-persons-excluded",  // stable, lowercase-kebab, unique in file
      "kind": "gate",               // "gate" or "note"
      "status": "restricted",       // gates only
      "regions": ["US"],
      "symbols": ["SPCX"],          // optional; omitted means every symbol
      "reason": "What the user needs to know, in plain language.",
      "source_url": "https://…",    // https only
      "source_quality": "primary"   // "primary" or "secondary"
    }
  ]
}
```

Unknown keys are rejected, so a typo cannot silently drop a field.

## Rules

1. **Gates decide; notes inform.** A gate carries a status. A note never does,
   so a warning ("no voting rights") can never quietly change a verdict. When
   several gates apply, the most severe decides and all are shown.
2. **Three statuses**: `eligible`, `conditional`, `restricted`. A rule that lets
   you acquire on the secondary market while gating redemption, dividends or
   transfer behind KYC or an investor-class test is `conditional` — not a
   softened `restricted` and not a qualified `eligible`.
3. **Every rule carries a `source_url`.** A rule we cannot source is a rule we
   do not ship.
4. **Say how good the source is.** `primary` means the issuer's own document
   states it. `secondary` means third-party reporting, or an inference the
   issuer's document does not state outright. Secondary sources are labelled
   on screen, and a verdict decided by one says so.
5. **No gate, no verdict.** If no gate covers a region, the user sees "not
   assessed", never a default `eligible`. `npm test` requires every
   representation to have a gate in every region, so gaps cannot ship
   silently.
6. **Edits are commits, not amendments.** Bump `version` on any rule change and
   never rewrite history; a correction is a new commit that says what was
   wrong.
7. **The pinned grid.** `tests/policies.test.mjs` pins the researched SPCX
   verdicts. A policy change that alters one fails until the test is updated in
   the same commit, on purpose.

## Scope

Vestail discloses; it does not enforce. Jurisdiction is self-declared, and
these files describe what an issuer says about a jurisdiction. They are not
legal advice and they do not gate anyone.
