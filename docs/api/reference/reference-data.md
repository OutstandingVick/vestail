# Reference endpoints

The lists everything else is keyed by. All public, all cached for a day, none of them
take parameters.

### `GET /v1/assets`

The 20 asset classes, each with its id and display name.

### `GET /v1/categories`

Category groupings, and the asset classes each one fans out to. *Commodities* and *fixed
income* are categories; they resolve to several classes rather than one.

### `GET /v1/countries`

The 12 covered countries: code, name and flag.

### `GET /v1/entities`

Named things the resolver knows — companies, coins, bond series, aircraft models.

## Fetch these once

`public, max-age=86400`. They change with a deploy, never between requests. Honour the
cache and they cost you nothing against your [rate limit](../request-limits.md).

Hard-coding them instead is the mistake worth avoiding: the twelve countries and twenty
classes are a snapshot of coverage, not a constant, and both are intended to grow.

## Ids, not names

`assets` returns both. The id is the contract — `gold_bullion`, `foreign_equities` — and
the name is a display string that may be rewritten. Key your own storage by id.

## `entities` is why the resolver feels smart

It holds the named things: Tesla, Dangote, specific bond series, aircraft models.
Entities are tried before aliases, which is what makes *tesla shares* resolve to Tesla
rather than to the generic *shares* bucket. Companies carry a `home` market, which is how
one ticker can be domestic equity in one country and foreign in another.

## Coverage today

12 countries · 20 asset classes · 2 buyer types = **480 rules**.

Those are the figures on the homepage, and they are countable from `data/`. What they do
not tell you is that none of the 480 is yet sourced — see
[rules.md](./rules.md).
