import Link from "next/link";

const EXAMPLES = ["NVIDIA", "Tesla", "Crude oil", "Copper", "Gold", "A house"];

/**
 * The app's first thing: one very large search box. A plain GET form, so a
 * search is a URL (/app/search?q=…) that can be shared, reloaded and gone back to.
 */
export function GiantSearch({ q, action = "/app/search" }: { q: string; action?: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <h1 className="text-[clamp(36px,5.5vw,72px)] leading-[1.02] font-extrabold tracking-[-0.04em] text-ink-strong">
        What do you want to own?
      </h1>
      <form action={action} method="get" role="search" className="flex w-full max-w-[960px] items-center gap-2.5 rounded-full border-2 border-line bg-surface py-2.5 pr-2.5 pl-7 shadow-[0_18px_50px_rgba(124,92,255,0.14)]">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#636069" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <label htmlFor="q" className="sr-only">Search an asset, company or token</label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          autoFocus={!q}
          autoComplete="off"
          placeholder="NVIDIA, a house, gold, bitcoin…"
          className="min-w-0 flex-1 bg-transparent px-1 py-4 text-[clamp(20px,2.6vw,30px)] outline-none placeholder:text-muted/70"
        />
        <button type="submit" className="flex min-h-16 shrink-0 items-center rounded-full bg-action px-7 text-lg font-bold text-on-action">
          See where
        </button>
      </form>
      <div className="flex flex-wrap justify-center gap-2 text-sm">
        <span className="px-1 py-2 text-muted">Try</span>
        {EXAMPLES.map(x => (
          <Link key={x} href={`${action}?q=${encodeURIComponent(x)}`} className="rounded-full border border-line bg-surface px-3.5 py-2 hover:border-field">
            {x}
          </Link>
        ))}
      </div>
    </div>
  );
}
