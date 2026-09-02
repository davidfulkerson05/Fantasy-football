import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Guillotine",
  description: "Weekly recap messages for elimination fantasy football leagues.",
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
