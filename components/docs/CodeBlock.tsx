/**
 * A code sample with a caption.
 *
 * `overflow-x-auto` on the <pre> only: a long line scrolls inside its own
 * box, so the page itself never scrolls sideways on a phone. tabIndex makes
 * that scrollable box reachable from the keyboard, which is otherwise a
 * known trap for keyboard-only readers.
 */
export function CodeBlock({ caption, code }: { caption: string; code: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl ring-1 ring-white/10">
      <figcaption className="border-b border-white/10 bg-white/[0.06] px-4 py-2 font-mono text-xs text-white/60">
        {caption}
      </figcaption>
      <pre
        tabIndex={0}
        className="overflow-x-auto bg-black/30 p-4 font-mono text-xs leading-relaxed text-white/85 focus-visible:outline-2 focus-visible:outline-brand-orange"
      >
        <code>{code}</code>
      </pre>
    </figure>
  );
}
