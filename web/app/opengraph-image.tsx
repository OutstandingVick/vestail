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
          padding: "56px 64px",
          backgroundColor: "#F8F7FF",
          backgroundImage:
            "linear-gradient(rgba(124,92,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,255,0.07) 1px, transparent 1px), radial-gradient(circle at 88% 18%, rgba(255,88,10,0.16), transparent 28%)",
          backgroundSize: "72px 72px, 72px 72px, 100% 100%",
          fontFamily: "sans-serif",
          border: "1px solid rgba(124,92,255,0.16)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3, transform: "rotate(-8deg)" }}>
              <div style={{ width: 15, height: 37, borderRadius: 10, background: "#FF580A" }} />
              <div style={{ width: 18, height: 54, borderRadius: 12, background: "#FF580A", transform: "rotate(28deg)" }} />
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, color: "#FF580A", letterSpacing: "-0.04em" }}>vestail</div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(23,23,26,0.12)",
              color: "#52525B",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            OWNERSHIP, EXPLAINED
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 42 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, width: 650 }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: "#17171A", lineHeight: 0.98, letterSpacing: "-0.055em" }}>
              Know what you can own. Before you buy.
            </div>
            <div style={{ fontSize: 25, color: "#5B5B66", lineHeight: 1.35 }}>
              Country-aware answers for tokenized stocks, property, gold and more — with the conditions and sources made clear.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 380,
              padding: 24,
              borderRadius: 28,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(124,92,255,0.2)",
              boxShadow: "0 24px 64px rgba(62,45,120,0.14)",
            }}
          >
            <div style={{ display: "flex", color: "#70707C", fontSize: 16, fontWeight: 600 }}>YOUR CONTEXT</div>
            <div style={{ display: "flex", marginTop: 10, color: "#17171A", fontSize: 27, fontWeight: 750 }}>Nigeria · Foreigner</div>
            <div style={{ display: "flex", height: 1, background: "#E7E4F7", margin: "20px 0" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", color: "#17171A", fontSize: 22, fontWeight: 750 }}>Tokenized stock</div>
                <div style={{ display: "flex", color: "#70707C", fontSize: 16 }}>Issuer terms checked</div>
              </div>
              <div style={{ display: "flex", width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", background: "#F0ECFF", color: "#6D4AFF", fontSize: 24, fontWeight: 800 }}>
                V
              </div>
            </div>
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
