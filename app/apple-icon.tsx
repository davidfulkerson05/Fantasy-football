import { ImageResponse } from "next/og";

// iOS reads this specific convention (apple-touch-icon) for the home-screen
// icon rather than the manifest's icons array — Next wires up the <link>
// tag automatically when this file exists.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c2410c",
          color: "#fff",
          fontSize: 88,
          fontWeight: 700,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        LU
      </div>
    ),
    { ...size }
  );
}
