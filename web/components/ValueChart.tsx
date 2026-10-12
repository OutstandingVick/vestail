"use client";

import { useState } from "react";

/**
 * Portfolio value over time: one series, so one hue, no legend box (the card
 * title names it), a 2px line, a crosshair and tooltip on hover, and a table
 * for screen readers. Points exist only for days the user actually visited.
 */
export function ValueChart({ points }: { points: { day: string; usd: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 200, PAD = { l: 8, r: 8, t: 16, b: 24 };
  const usd = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: n < 100 ? 2 : 0 });

  if (points.length < 2) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-1 rounded-field border-[1.5px] border-dashed border-field text-center text-sm text-muted">
        <span>Your value history builds up from today.</span>
        <span>Vestail records one point a day when you open your portfolio; nothing is back-filled.</span>
      </div>
    );
  }

  const max = Math.max(...points.map(p => p.usd)), min = Math.min(...points.map(p => p.usd));
  const span = max - min || Math.max(1, max * 0.1);
  const x = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.usd).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1)},${H - PAD.b}L${x(0)},${H - PAD.b}Z`;
  const h = hover !== null ? points[hover] : null;

  return (
    <figure className="relative m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full" preserveAspectRatio="none" role="img" aria-label="Portfolio value by day"
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left) / r.width) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, i)));
        }}>
        <defs>
          <linearGradient id="vc-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-emphasis)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--color-emphasis)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--color-line)" />
        <path d={area} fill="url(#vc-fill)" />
        <path d={line} fill="none" stroke="var(--color-emphasis)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--color-muted)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover)} cy={y(points[hover].usd)} r="5" fill="var(--color-emphasis)" stroke="var(--color-surface)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      <div className="flex justify-between text-xs text-muted">
        <span>{points[0].day}</span><span>{points[points.length - 1].day}</span>
      </div>
      {h && (
        <div className="pointer-events-none absolute top-0 rounded-xl bg-ink px-3 py-1.5 text-xs text-page shadow"
          style={{ left: `clamp(0px, calc(${(hover! / (points.length - 1)) * 100}% - 60px), calc(100% - 120px))` }}>
          <div>{h.day}</div><strong>{usd(h.usd)}</strong>
        </div>
      )}
      <table className="sr-only">
        <caption>Portfolio value by day</caption>
        <tbody>{points.map(p => <tr key={p.day}><th scope="row">{p.day}</th><td>{usd(p.usd)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
