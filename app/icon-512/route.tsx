import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#1A5C52", borderRadius: 106, position: "relative", display: "flex" }}>
        <div style={{ position: "absolute", top: 85, left: 85, right: 85, height: 48, background: "#E07B39", borderRadius: 24 }} />
        <div style={{ position: "absolute", bottom: 101, left: 101, width: 80, height: 80, background: "#FFFFFF", borderRadius: 16 }} />
      </div>
    ),
    { width: 512, height: 512 }
  );
}
