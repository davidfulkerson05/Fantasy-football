import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "League Update",
  description:
    "Weekly recap messages for your Sleeper fantasy football league — ready to paste into the group chat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#f7f5f1",
          color: "#211f1c",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
