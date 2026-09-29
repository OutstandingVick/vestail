# Vestail v2

**What this is:** the frontend for "what can I own here, and where do I buy it?" — a country × asset-class ownership matrix with a resolver that turns free text (Google, a house, gilts) into the right rule per country, a citizen/foreigner toggle, and a buy column that routes to partner venues with an attribution tag.

Open `app/index.html` in a browser to see it. Open `docs/GLOSSARY.html` to understand it end to end.

```
v2/
├── README.md                    ← you are here
├── CLAUDE.md                    ← project context for Claude Code (auto-read)
├── CLAUDE_CODE_FIRST_PROMPT.md  ← paste this into Claude Code to start
├── app/
│   └── index.html               ← the working page, single file, data inlined
├── data/                        ← the same data, split into modules
│   ├── assets.json  categories.json  aliases.json  entities.json
│   ├── countries.json  venues.json  activity.sample.json
│   └── schema/  README.md (data model) · schemas.json (JSON Schema)
├── packages/core/           ← resolver + matrix as a dependency-free ES module
│   ├── index.js  package.json  test.js   (node test.js)
└── docs/
    ├── GLOSSARY.html            ← vocabulary, architecture, build log, open questions
    ├── api/  openapi.yaml · API.md
    └── diagrams/  resolver-pipeline.svg · system-flow.svg
```

## Using the core in another app
```js
import { createVestail } from "./packages/core/index.js";
const core = createVestail({ assets, categories, aliases, entities, countries, venues }); // the JSON files
core.resolve("tesla shares");            // -> { stage:"entity", assets:[3,4], trail:[…], perCountry }
core.matrix("farmland", "foreigner");    // -> ranked rows with one cell + cta each
core.venues("cryptocurrency", "NG");     // -> [{ name:"Luno", url:"…?ref=vestail" }, …]
```

## Status of the data
Everything in `data/` is **illustrative**. Rules need legal review and provenance; venues are homepages, not affiliate links; HUD numbers are placeholders. See "Open questions" in the glossary.
