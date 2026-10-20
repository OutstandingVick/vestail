import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#EBEBFF", color: "#17171A", padding: "70px 80px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#FF580A", fontSize: 38, fontWeight: 800 }}><span style={{ display: "flex", width: 42, height: 42, borderRadius: 14, background: "#FF580A" }} />vestail</div>
      <div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#B83D00", fontSize: 24, fontWeight: 700, letterSpacing: 3 }}>CALL FOR TESTERS</span><span style={{ maxWidth: 960, marginTop: 22, fontSize: 78, lineHeight: 1.02, fontWeight: 750, letterSpacing: -3 }}>Limited spots. The first 10 get funded.</span></div>
      <span style={{ fontSize: 25, color: "#5e5b65" }}>vestail.fun/testers</span>
    </div>,
    { width: 1200, height: 630 },
  );
}
