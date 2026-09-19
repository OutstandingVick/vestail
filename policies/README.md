# Policies

Provider eligibility policy, one versioned JSON file per issuer. Empty until
Phase 2; this file documents the contract those files will honour.

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

## Rules

1. **Every rule carries a `source_url`** pointing at the issuer's own document —
   terms of service, prospectus, restricted-jurisdiction list. A rule we cannot
   source is a rule we do not ship. `VerdictSchema.sourceUrl` is a required URL
   precisely so this cannot be skipped.
2. **Every file carries a `version`.** It is copied onto each `Verdict` as
   `policyVersion`, so any verdict can be reproduced against the exact revision
   that produced it.
3. **Edits are commits, not amendments.** Never rewrite history here; a
   correction is a new commit that says what was wrong.
4. **Three statuses**: `eligible`, `conditional`, `restricted`. A rule that
   grants acquisition while gating redemption, dividends or transfer behind KYC
   or an investor-class test is `conditional` — not a softened `restricted` and
   not a qualified `eligible`.

## Scope

Vestail discloses; it does not enforce. Jurisdiction is self-declared, and
these files describe what an issuer says about a jurisdiction. They are not
legal advice and they do not gate anyone.
