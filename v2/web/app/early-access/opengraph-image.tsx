import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#EBEBFF", color: "#17171A", padding: "70px 80px", fontFamily: "sans-serif" }}><div style={{ display: "flex", alignItems: "center", gap: 16, color: "#FF580A", fontSize: 38, fontWeight: 800 }}><span style={{ fontSize: 58 }}>✓</span>vestail</div><div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#B83D00", fontSize: 24, fontWeight: 700, letterSpacing: 3 }}>EARLY ACCESS</span><span style={{ maxWidth: 960, marginTop: 22, fontSize: 72, lineHeight: 1.02, fontWeight: 750, letterSpacing: -3 }}>Find out what you can own, wherever you are.</span></div><span style={{ fontSize: 25, color: "#5e5b65" }}>vestail.fun/early-access</span></div>, size);
}
