# Data model

Six independent JSON modules. Each can be swapped for a database table with the same shape. Nothing references another module by array position except `countries.rules`, which is indexed by `assets[].index` — keep that ordering stable or migrate to keyed rules (see "Roadmap").

```
assets.json       the 20 asset classes            (id, index, name)
categories.json   fan-out groups                  (id, name, assets[name])
aliases.json      everyday word -> asset|category (string -> string)
entities.json     named things -> asset class     (name, kind, home?, asset)
countries.json    ownership rules per buyer type  (code, name, flag, rules.{citizen,foreigner}[20])
venues.json       where to buy, per asset/country (asset -> {default[], <ISO>[]})
activity.sample.json  HUD feed shape             (stats{}, recent[])
```

## Status scale
| value | key          | meaning                                      |
|------:|--------------|----------------------------------------------|
| 2     | can_own      | permitted outright                           |
| 1     | conditional  | licence, cap, approval or residency required |
| 0     | cannot_own   | prohibited for this buyer type               |

## Entity `asset` values
Either a literal asset name, or the sentinel `"equity-by-home"` meaning: domestic equity in `home`, foreign equity everywhere else. Add more sentinels the same way (e.g. `"bond-by-home"`).

## Venue rows
`{ "name": "Zerodha", "url": "https://zerodha.com" }`. A `null` url means "no online venue; show the name as guidance" (used for firearms, trusts, regulated sectors). The `ref` field at the top of venues.json is appended to every outbound url for attribution.

## Roadmap
1. Replace positional `rules[20]` with keyed rules `{ "residential_property": 2, ... }` once asset count changes.
2. Add `sources[]` and `verified_at` to every rule so the matrix can show provenance.
3. Replace `entities.json` with a securities master (ISIN/ticker lookup) behind the same `{name, kind, home, asset}` shape.
4. Add `resident` as a third buyer type between citizen and foreigner.
