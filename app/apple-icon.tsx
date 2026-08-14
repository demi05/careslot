import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1A5C52",
          position: "relative",
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            right: 30,
            height: 18,
            background: "#E07B39",
            borderRadius: 9,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 36,
            width: 30,
            height: 30,
            background: "#FFFFFF",
            borderRadius: 6,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
