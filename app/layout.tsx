import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recapped",
  description:
    "AI-written weekly recap messages for your Sleeper fantasy football league — ready to paste into the group chat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#0b0b0c",
          color: "#e8e6e3",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
