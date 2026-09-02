"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "guillotine.token";
const NAME_KEY = "guillotine.leagueName";

export default function AppPage() {
  const [token, setToken] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string | null>(null);
  const [week, setWeek] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem(STORAGE_KEY, urlToken);
      setToken(urlToken);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setToken(saved);
    }
    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) setLeagueName(savedName);
    setCheckedStorage(true);
  }, []);

  async function generate(regenerate = false) {
    if (!token) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/generate?token=${encodeURIComponent(token)}&week=${week}${regenerate ? "&regenerate=1" : ""}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessage(data.message);
      if (data.facts?.chopped?.team && !leagueName) {
        // best-effort, doesn't overwrite a name we already know
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (checkedStorage && !token) {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>The Guillotine</h1>
        <p style={{ color: "#9a9691" }}>
          No access link found. You need a season pass to use this — head back to{" "}
          <a href="/" style={{ color: "#e0645a" }}>
            the homepage
          </a>{" "}
          to get one, or use the link that was emailed to you.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>The Guillotine</h1>
      <p style={{ color: "#9a9691", marginTop: 0, marginBottom: 32 }}>
        {leagueName || "Your league"}
      </p>

      <label style={label}>Week</label>
      <input
        style={{ ...input, width: 80 }}
        type="number"
        min={1}
        max={18}
        value={week}
        onChange={(e) => setWeek(parseInt(e.target.value, 10) || 1)}
      />
      <button style={button} onClick={() => generate(false)} disabled={loading}>
        {loading ? "Sharpening..." : `Generate Week ${week}`}
      </button>

      {message && (
        <div style={{ marginTop: 24 }}>
          <pre style={messageBox}>{message}</pre>
          <div style={{ display: "flex", gap: 12 }}>
            <button style={button} onClick={copy}>
              {copied ? "Copied!" : "Copy message"}
            </button>
            <button style={secondaryButton} onClick={() => generate(true)} disabled={loading}>
              Regenerate
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "#e0645a", marginTop: 16 }}>{error}</p>}
    </main>
  );
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#9a9691",
  marginTop: 16,
  marginBottom: 6,
};

const input: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "#151516",
  border: "1px solid #2a2a2c",
  borderRadius: 6,
  color: "#e8e6e3",
  fontSize: 15,
};

const button: React.CSSProperties = {
  marginTop: 16,
  padding: "10px 18px",
  background: "#8a1c1c",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  fontSize: 15,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  ...button,
  background: "#2a2a2c",
};

const messageBox: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  fontFamily: "inherit",
  fontSize: 15,
  lineHeight: 1.6,
  background: "#151516",
  border: "1px solid #2a2a2c",
  borderRadius: 6,
  padding: 16,
  marginBottom: 12,
};
