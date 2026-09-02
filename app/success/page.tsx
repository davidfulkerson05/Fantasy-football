"use client";

import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [link, setLink] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setStatus("error");
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId!)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");

        if (data.ready) {
          const url = `${window.location.origin}/app?token=${data.token}`;
          localStorage.setItem("guillotine.token", data.token);
          localStorage.setItem("guillotine.leagueName", data.leagueName);
          setLink(url);
          setLeagueName(data.leagueName);
          setStatus("ready");
          return;
        }
      } catch {
        // fall through to retry
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 1500);
      } else {
        setStatus("error");
      }
    }

    poll();
  }, []);

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>The Guillotine</h1>

      {status === "loading" && (
        <p style={{ color: "#9a9691" }}>Finalizing your access...</p>
      )}

      {status === "ready" && (
        <>
          <p style={{ color: "#9a9691" }}>
            Payment received. {leagueName}&rsquo;s season pass is active — we&rsquo;ve also emailed this
            link to you as a backup.
          </p>
          <div style={{ marginTop: 20 }}>
            <pre style={messageBox}>{link}</pre>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={button} onClick={copy}>
                {copied ? "Copied!" : "Copy link"}
              </button>
              <a href={link} style={{ ...button, textDecoration: "none", display: "inline-block" }}>
                Open The Guillotine
              </a>
            </div>
          </div>
        </>
      )}

      {status === "error" && (
        <p style={{ color: "#e0645a" }}>
          Couldn&rsquo;t confirm your payment yet. Check your email for the access link — if it
          doesn&rsquo;t arrive shortly, get in touch and we&rsquo;ll sort it out.
        </p>
      )}
    </main>
  );
}

const button: React.CSSProperties = {
  padding: "10px 18px",
  background: "#8a1c1c",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  fontSize: 15,
  cursor: "pointer",
};

const messageBox: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  fontFamily: "inherit",
  fontSize: 14,
  lineHeight: 1.6,
  background: "#151516",
  border: "1px solid #2a2a2c",
  borderRadius: 6,
  padding: 16,
  marginBottom: 12,
};
