import Image from "next/image";

/**
 * The issuers whose tokens Vestail resolves, with their own logos.
 *
 * Each height is set per logo rather than once for all five: a wordmark and
 * a lockup with a tagline under it do not read as the same size at the same
 * pixel height, so these are tuned by eye to sit on one optical line.
 */
const ISSUERS: Array<{ name: string; file: string; width: number; className: string }> = [
  { name: "xStocks", file: "xstocks.svg", width: 170, className: "h-9" },
  { name: "Ondo Finance", file: "ondo.svg", width: 1512, className: "h-4 sm:h-5" },
  { name: "Backpack", file: "backpack.svg", width: 143, className: "h-6 sm:h-7" },
  { name: "Tessera", file: "tessera.svg", width: 192, className: "h-6 sm:h-7" },
  { name: "PreStocks", file: "prestocks.svg", width: 5566, className: "h-6 sm:h-7" },
];

/** One copy of the row. The track holds two; only the first is announced. */
function Row({ hidden }: { hidden: boolean }) {
  return (
    <>
      {ISSUERS.map((issuer) => (
        <li
          key={`${issuer.file}-${hidden}`}
          aria-hidden={hidden || undefined}
          className={`flex shrink-0 items-center px-8 sm:px-12 ${hidden ? "motion-reduce:hidden" : ""}`}
        >
          <Image
            src={`/brand/issuers/${issuer.file}`}
            alt={hidden ? "" : issuer.name}
            width={issuer.width}
            height={40}
            unoptimized
            className={`w-auto opacity-70 transition-opacity hover:opacity-100 motion-reduce:transition-none ${issuer.className}`}
          />
        </li>
      ))}
    </>
  );
}

/**
 * The issuer strip under the hero: the five companies whose tokenized stocks
 * Vestail reads, drifting past in one continuous row.
 *
 * No JavaScript and no measuring. The track carries the row twice and moves
 * by half its own width, so the second copy arrives exactly where the first
 * began. `w-max` lets the track be as wide as its contents rather than the
 * viewport, and the parent's `overflow-hidden` keeps that width off the page,
 * so nothing here can scroll the document sideways.
 *
 * Hovering pauses it — the logos are the point, and a moving target is a
 * poor one. With `prefers-reduced-motion` the animation never starts, the
 * duplicate row is dropped, and what is left is a centred, wrapping row.
 */
export function IssuerStrip() {
  return (
    <section
      aria-labelledby="issuers-heading"
      className="relative z-10 border-y border-white/10 bg-brand-navy/30 py-10 backdrop-blur-sm sm:py-12"
    >
      <h2
        id="issuers-heading"
        className="px-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white/60"
      >
        Every version, from every issuer
      </h2>

      <div className="mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="flex w-max items-center hover:[animation-play-state:paused] motion-safe:animate-[issuer-marquee_30s_linear_infinite] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6">
          <Row hidden={false} />
          <Row hidden />
        </ul>
      </div>

      <p className="mt-8 px-4 text-center text-sm text-white/60">
        Same ticker, different issuers, different rules about who may hold
        them. Vestail tells you which is which.
      </p>
    </section>
  );
}
