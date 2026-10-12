# Issuer logos

The five issuers whose tokens Vestail resolves. Each file is that issuer's own
logo, taken from their own site on 2026-09-23:

| File | Source | Colour here |
| --- | --- | --- |
| `xstocks.svg` | the header lockup on <https://xstocks.com> | theirs: the mark keeps its green-to-blue gradient, the wordmark is white as on their own dark site |
| `ondo.svg` | `ondo.finance/images/nebula-footer-wordmark.svg` | theirs: the file is white already |
| `backpack.svg` | the mark and wordmark from <https://backpack.exchange>, locked up side by side | theirs: the red mark, and the wordmark white as their dark site renders it |
| `tessera.svg` | the header logo on <https://www.tessera.pe> | **white**, see below |
| `prestocks.svg` | `prestocks.com/ui/brand-logos/prestocks-logo.svg` | **white**, see below |

Tessera and PreStocks publish one mark each, drawn for light pages: Tessera's
is near-black (`#12121b`) and PreStocks' is a periwinkle (`#6264d9`) within a
few points of this site's own violet. Neither is legible on the page
gradient, and neither company publishes a light variant, so both are used in
white — a colour change, not a redraw. If either ever ships a dark-background
logo, swap the file and drop the override.

The only other change to any file is that the `width`/`height` attributes were
removed so each can be sized in CSS. The Backpack file places that company's
own two assets in a row at their own proportions; xStocks' gradient stops were
CSS variables on their site, resolved here to the same two colours their own
favicon hard-codes. No artwork was redrawn or recomposed.

These logos are the trademarks of their respective owners. They appear here to
name the issuers Vestail checks, which is nominative use; nothing here implies
endorsement, partnership, or that any of them have reviewed Vestail.
