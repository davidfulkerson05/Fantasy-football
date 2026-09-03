import type { MetadataRoute } from "next";

// Next's App Router manifest convention — auto-linked into every page's
// <head> and served at /manifest.webmanifest. Lets a visitor "Add to Home
// Screen" for an app-like icon, without any app store involved.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "League Update",
    short_name: "League Update",
    description:
      "Weekly recap messages for your Sleeper fantasy football league — ready to paste into the group chat.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f1",
    theme_color: "#c2410c",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
