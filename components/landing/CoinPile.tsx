import { coinPile, type PileCoin } from "@/lib/landing/coinPile";

const ORANGE = "#ff580a";
const INK = "#0a122a";

/** Desktop and phone bands. Each is generated once, at module load. */
const WIDE = { width: 1600, height: 280, count: 82, seed: 20260923 };
const NARROW = { width: 760, height: 170, count: 30, seed: 20260923 };

/**
 * A coin, as a rounded octagon with its ticker across the face.
 *
 * The rounding is the stroke, not the path: an octagon drawn at 86% of the
 * radius and stroked at 28% of it with a round join comes out the full
 * radius with soft corners, in one element instead of eight arcs.
 *
 * `textLength` forces every ticker to the same width whatever its length,
 * so GOOGL and SPY both sit inside the face without measuring text.
 */
function Coin({ coin }: { coin: PileCoin }) {
  const inner = coin.r * 0.86;
  const points = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 8) + (i * Math.PI) / 4;
    return `${(coin.x + Math.cos(a) * inner).toFixed(2)},${(coin.y + Math.sin(a) * inner).toFixed(2)}`;
  }).join(" ");

  return (
    <g transform={`rotate(${coin.rotation.toFixed(1)} ${coin.x.toFixed(2)} ${coin.y.toFixed(2)})`}>
      <polygon
        points={points}
        fill={ORANGE}
        stroke={ORANGE}
        strokeWidth={coin.r * 0.28}
        strokeLinejoin="round"
      />
      <text
        x={coin.x}
        y={coin.y}
        textLength={coin.r * 1.15}
        lengthAdjust="spacingAndGlyphs"
        textAnchor="middle"
        dominantBaseline="central"
        fill={INK}
        fontSize={coin.r * 0.46}
        fontWeight={700}
      >
        {coin.ticker}
      </text>
    </g>
  );
}

/**
 * One band: the pile split into three depth layers.
 *
 * Blur is the reason for the split. A filter per coin would be eighty
 * filters to rasterise; three groups is three, and depth only needs three
 * steps to read. Each layer is blurred and faded by how far back it sits,
 * and all of them glow, which is what makes orange on a dark ground look
 * lit rather than pasted on.
 */
function Band({
  id,
  width,
  height,
  count,
  seed,
}: {
  id: string;
  width: number;
  height: number;
  count: number;
  seed: number;
}) {
  const coins = coinPile({ count, width, height, seed });
  const layers = [
    { key: "far", blur: 3.2, opacity: 0.42, coins: coins.filter((c) => c.depth < 0.34) },
    { key: "mid", blur: 1.3, opacity: 0.72, coins: coins.filter((c) => c.depth >= 0.34 && c.depth < 0.67) },
    { key: "near", blur: 0, opacity: 1, coins: coins.filter((c) => c.depth >= 0.67) },
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      className="h-full w-full"
    >
      <defs>
        <filter id={`${id}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation={height * 0.022} result="halo" />
          <feFlood floodColor={ORANGE} floodOpacity="0.55" result="tint" />
          <feComposite in="tint" in2="halo" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {layers
          .filter((l) => l.blur > 0)
          .map((l) => (
            <filter key={l.key} id={`${id}-${l.key}`} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation={l.blur} />
            </filter>
          ))}
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {layers.map((layer) => (
          <g
            key={layer.key}
            opacity={layer.opacity}
            filter={layer.blur > 0 ? `url(#${id}-${layer.key})` : undefined}
          >
            {layer.coins.map((coin, i) => (
              <Coin key={i} coin={coin} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * The decorative band of heaped tokenized-stock coins under the footer.
 *
 * Both bands are in the HTML and CSS shows one: the phone's is a third of
 * the coins and a shorter band, and choosing between them in CSS rather
 * than JavaScript means the right one paints on first render with no
 * measuring and no hydration mismatch.
 *
 * Decoration only — aria-hidden, nothing to click, nothing that moves.
 */
export function CoinPile() {
  return (
    <div aria-hidden className="pointer-events-none w-full overflow-hidden select-none">
      <div className="h-32 w-full sm:hidden">
        <Band id="pile-sm" {...NARROW} />
      </div>
      <div className="hidden h-44 w-full sm:block lg:h-56">
        <Band id="pile-lg" {...WIDE} />
      </div>
    </div>
  );
}
