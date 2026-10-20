import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#1A5C52", borderRadius: 40, position: "relative", display: "flex" }}>
        <div style={{ position: "absolute", top: 32, left: 32, right: 32, height: 18, background: "#E07B39", borderRadius: 9 }} />
        <div style={{ position: "absolute", bottom: 38, left: 38, width: 30, height: 30, background: "#FFFFFF", borderRadius: 6 }} />
      </div>
    ),
    { width: 192, height: 192 }
  );
}
