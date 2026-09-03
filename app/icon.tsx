import { ImageResponse } from "next/og";

// Next's app-icon convention — generated on request via next/og, so no
// external art asset or extra dependency is needed for a real icon file.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 260,
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
