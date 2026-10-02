# Vestail v2: design handoff

A brief for designing the next version of the Vestail v2 interface. It stands on its own: everything needed is here, and nothing here requires reading the code.

## 1. What Vestail is

**Vestail v1** (live at vestail.fun) answers one narrow question: *which tokenized version of this stock am I actually allowed to hold?* One ticker, such as NVDA, exists onchain as several different legal claims. xStocks holds real shares in custody; Ondo's note only tracks the price; Backpack's is an entitlement through a broker. Vestail gives each version a verdict for the buyer's declared country and routes a purchase only to versions they may hold.

**Vestail v2** widens that question to *what can I own in this country, and where do I buy it?* It covers 20 asset classes (property, farmland, equities, bonds, crypto, gold, aircraft, firearms…) across 10 countries, for citizens and for foreigners. Mentors see it as the start of an **open compliance layer**: the same rule data, later extended to tax and immigration.

Two principles carry over from v1 and must survive any redesign:

- **Three verdicts, never two.** *Can own*, *conditional* (allowed, but behind a licence, cap, approval or KYC gate) and *cannot own*. Conditional is the product: it is where buyers get hurt. It must read as its own state, never as a softer "yes" or a gentler "no".
- **Disclosure, not enforcement.** Vestail shows the rule and routes; it does not verify identity or block anyone. The buyer declares who they are.

## 2. Who uses it

A person deciding whether and where to buy something, often across borders: a Nigerian wanting US stocks, an expat wanting property, someone checking whether gold, crypto or farmland is open to them. They are not lawyers. They want a fast, trustworthy answer and a next step.

## 3. The current page (one screen)

Top to bottom:

1. **Top bar.** Vestail wordmark left; scope line right ("10 countries · 20 asset classes · citizens and foreigners").
2. **Hero.** Headline *"What can you actually own here?"*, one-line explanation, then a large **search field** ("Google, bitcoin, a house, farmland, a Gulfstream…").
3. **Activity strip.** Three stat cards (volume bought through Vestail, last 30 days, with change; orders routed to venues, with change; active buyers this week) and a one-line **live ticker** ("🇳🇬 Someone bought Foreign equities via Bamboo · just now").
4. **Suggestion chips** that fill the search: Google, Bitcoin, A house, Farmland, Gold, Dangote, Private jet.
5. **Controls.** Two segmented toggles, *Citizens / Foreigners* and *By status / By asset 1–20*, plus a legend.
6. **Trail.** How the search was understood, as chips joined by arrows, with one explanatory sentence. Example: `Google → Listed company (US) → Equities → Domestic in US, foreign elsewhere` and *"Google is a listed company from US, so it counts as domestic equity there and foreign equity everywhere else."*
7. **Board.** One card per country:
   - flag and name, with a summary such as "9 of 20 open · 6 conditional · 5 closed", or the single verdict when only one asset applies;
   - a grid of verdict tiles, 20 with no search, 1 to 3 after one;
   - a **buy column**.
8. **Asset key.** The 20 asset classes in order.
9. **Footer disclaimer.** Sample rules only; links carry a tracking tag.

### Interactions

- Typing re-resolves on every keystroke and clears any manual selection.
- Clicking a tile selects that asset in every row: other tiles dim, and the buy column fills. Clicking it again, or pressing Escape, clears the selection.
- Hovering or focusing a tile shows a tooltip with the asset name and verdict. Tiles are buttons and work from the keyboard.
- The buyer toggle swaps every rule and re-ranks the countries. *By status* sorts tiles green → amber → red and ranks countries most-open first; *By asset* keeps the fixed 1–20 order so one asset can be compared down the column.

### Buy column states

| Verdict | What shows |
|---|---|
| Can own | Primary button **"Buy on {venue}"**, plus "or {second venue}" as a text link |
| Conditional | Amber button **"Check eligibility on {venue}"** |
| Cannot own | Disabled **"Not permitted"** |
| No online venue | The route as text: "Licensed dealers only", "Regulator auction", "Local agents" |
| Nothing selected | Hint: "Pick an asset" |

Pressing Buy records the click and opens the venue in a new tab.

## 4. Brand (match v1 exactly)

Dark only, deliberately: v1's verdict colours are tuned for, and checked against, a dark ground.

| Token | Value | Use |
|---|---|---|
| Navy | `#0A122A` | Page base, label colour on orange |
| Violet | `#7C41F1` | Page gradient, left → navy on the right |
| Card | `#151922` at 85% | Panels and country cards, with a 1px white ring at 10% |
| Field | white at 7% | Inputs, chips, insets |
| Paper | `#E8E4D9` | Body text; headings pure white |
| Orange | `#FF580A` | The one primary action, with a navy label |
| Gold | `#C9A227` | Emphasis only, **never** a verdict |
| Can own | `#8FBD7F` | Verdict only |
| Conditional | `#D9A84D` | Verdict only |
| Cannot own | `#D98D84` | Verdict only, **always hatched** so it reads without colour |

- **Type:** Outfit, weights 400, 600 and 700 only, normal tracking.
- **Shape:** 28px panels, 16px fields and cards, 12px buttons, pill toggles and chips, 6px tiles. Rings, not borders.
- **Logo:** an orange "vestail" wordmark with a small character (two orange strokes forming a V, with eyes). It is available as SVG in the repo at `public/brand/` on `main`.
- **Rules:** verdict colours are used for nothing but verdicts; red is never shown by colour alone; motion respects reduced-motion settings and entrance animation plays on first paint only; layouts work down to phone width (≈375px).

## 5. What to design

### A. The existing page, refined

Same content and states as section 3, with stronger hierarchy and scanability, especially:

- the board on a phone, where each country card currently stacks to identity, then grid, then button;
- how the trail and the board relate, so the reasoning is visible but not noisy;
- the 20-tile grid: whether a tile could carry more meaning, such as an icon or a label on focus, without losing the at-a-glance pattern.

### B. New states the product needs

1. **Conditional acknowledgement.** In v1, a buyer must tick *"I understand I can buy and hold this, but {limit} requires {requires}"* before a conditional version can be bought. v2 must get the same gate on its amber cells: the checkbox, its copy, and how the "Check eligibility" button changes once the box is ticked.
2. **Provenance.** Every rule will carry `sources` (a title and link for each) and `verified_at` (a date, or none). Design:
   - how a tile, tooltip or card shows where a verdict comes from;
   - an "unverified" state, which is how every rule starts;
   - a "last verified a while ago" state.

   This is the answer to "what happens after an SEC announcement?", so it should feel trustworthy rather than legalistic.
3. **Region pre-fill.** The country may be guessed from the visitor's IP, but it must stay **declared and editable**: a "You're browsing from Nigeria · change" pattern, never silent detection. Show the buyer type alongside it.
4. **Empty, loading and offline states:**
   - no search match, which currently says *"Nothing matched. Try the class it belongs to…"*;
   - the board loading from the API;
   - the page falling back to built-in data when the API is down. Consider whether to say so.
5. **Activity strip in production.** The live numbers start at **zero**; sample figures must never ship. Design an honest early state that doesn't look broken or fake.

### C. A look ahead (exploratory)

How would the same pattern take a second area, such as **tax** or **immigration**? For example, "Can I hold this?" becoming "What do I owe on it?" or "Can I live here?". A tab, a mode or a separate board? Rough directions are enough here.

## 6. Data each component shows

The page gets everything from an API, which keeps these shapes stable:

- **Matrix row:**
  - `code` (e.g. NG), `name`, `flag`;
  - `cells[]`, each with an asset id, index and verdict;
  - `summary`, with counts of each verdict;
  - `cta`: the venues for a row's single asset, as `{ name, url }`, where a null url means no online venue.
- **Resolution** (the trail):
  - `stage`: entity, alias, category, asset, all or none;
  - `trail`: a list of labels;
  - `note`: one sentence;
  - for companies, `perCountry`, which marks the asset as domestic in its home country and foreign elsewhere.
- **Rule:** country, asset, buyer type, verdict, venues, `sources[]`, `verified_at`.
- **Activity:** five stats (30-day volume and its change, orders routed and its change, active buyers this week) and a list of recent buys, each as flag, asset, venue and "time ago".

The counts are fixed: 10 countries, 20 assets and 2 buyer types now, with a third buyer type, **resident**, planned. Names run long ("Foreign currency accounts", "United Kingdom"), and venue names vary ("ZAP Imóveis", "RBI Retail Direct").

## 7. Constraints

- It must work as **one self-contained HTML page** with no build step, so designs should be buildable in plain HTML and CSS.
- It must be accessible: keyboard-reachable tiles, visible focus, never colour alone, and readable contrast on the dark ground.
- **Don't change:**
  - the three verdicts or their colours;
  - the citizen/foreigner distinction;
  - the referral tag on venue links (`ref=vestail`), which is commercial.

## 8. Deliverables

1. The refined main page at desktop (≈1280px) and phone (≈375px) widths.
2. The new states from section 5B, each shown in context.
3. Components: verdict tile (all states, including selected and dimmed), country card, buy-column states, trail chips, toggles, stat card, provenance badge or tooltip, acknowledgement checkbox, region chip.
4. One or two rough directions for section 5C.

## Reference

- Live v1: https://www.vestail.fun (landing) and https://www.vestail.fun/app (the stock version picker).
- Current v2: the `v2-own` branch of github.com/OutstandingVick/vestail, file `v2/app/index.html`. It runs locally with the commands in `v2/DEPLOY.md`.
- The glossary at `v2/docs/GLOSSARY.html` has the full vocabulary.
