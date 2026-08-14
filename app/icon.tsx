import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1A5C52",
          borderRadius: 7,
          position: "relative",
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 5,
            left: 5,
            right: 5,
            height: 3,
            background: "#E07B39",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: 6,
            width: 5,
            height: 5,
            background: "#FFFFFF",
            borderRadius: 1,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
