import { ImageResponse } from "next/og";

/**
 * The card people see when a Vestail link is pasted anywhere.
 *
 * Generated rather than exported from a design file, so it cannot drift from
 * the brand or go stale when the wording changes. 1200x630 is the size every
 * platform crops from.
 *
 * No logo file is loaded: an ImageResponse that fetches an asset can fail at
 * request time, and a link preview that intermittently renders nothing is
 * worse than one drawn from type alone.
 */
export const alt = "Vestail — what you can own in your country, and where to buy it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #F8F7FF 0%, #EBEBFF 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: "#FF580A" }} />
          <div style={{ fontSize: 34, fontWeight: 700, color: "#17171A", letterSpacing: "-0.02em" }}>vestail</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: "#17171A", lineHeight: 1.05, letterSpacing: "-0.04em" }}>
            What can you actually own here?
          </div>
          <div style={{ fontSize: 30, color: "rgba(23,23,26,0.68)", lineHeight: 1.35, maxWidth: 900 }}>
            Stocks, land, gold and more — what you may hold where you live, for citizens and foreigners.
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, fontSize: 24, color: "rgba(23,23,26,0.55)" }}>
          <div style={{ display: "flex" }}>12 countries</div>
          <div style={{ display: "flex" }}>20 asset classes</div>
          <div style={{ display: "flex" }}>480 ownership rules</div>
        </div>
      </div>
    ),
    size,
  );
}
